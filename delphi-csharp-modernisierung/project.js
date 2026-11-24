"use strict";

async function inspectProjectFile(file, inspectPascal) {
  if (/\.pas$/i.test(file.name)) return inspectPascal(file);
  const result = { name: file.name, pascal: "", csharp: "", differences: [] };
  if (/\.(dpr|dpk|inc|dfm|fmx|rc|xml|cfg|txt)$/i.test(file.name) && file.size <= 256 * 1024) {
    try {
      const text = new TextDecoder("utf-8", { fatal: true }).decode(await file.arrayBuffer());
      if (!text.includes("\0") && !text.startsWith("TPF0")) result.pascal = text;
    } catch {
      result.message = "Datei ausgewählt. Keine UTF-8-Textvorschau verfügbar.";
    }
  }
  result.message ||= result.pascal ? "Datei ausgewählt. Textvorschau verfügbar." : "Datei ausgewählt. Keine Textvorschau verfügbar.";
  return result;
}

async function inspectDelphiProject(project, sources, inspectPascal, signal) {
  if (!/\.dproj$/i.test(project.name)) {
    throw new Error("Wähle eine .dproj-Datei.");
  }

  const projectText = await project.text();
  const xml = new DOMParser().parseFromString(projectText, "application/xml");
  signal.throwIfAborted();
  if (xml.doctype || xml.documentElement?.localName !== "Project" ||
      xml.getElementsByTagNameNS("*", "parsererror").length) {
    throw new Error(`${project.name} konnte nicht als Delphi-Projektdatei gelesen werden.`);
  }

  const entries = (name) => [...xml.getElementsByTagNameNS("*", name)];
  const mainSource = entries("MainSource")
    .find((entry) => entry.parentElement?.localName === "PropertyGroup")?.textContent.trim();
  const rawReferences = ["DCCReference", "DelphiCompile", "None", "Content", "Resource"]
    .flatMap(entries)
    .map((entry) => entry.getAttribute("Include")?.trim())
    .filter(Boolean);
  if (mainSource) rawReferences.push(mainSource);

  const references = new Map();
  for (const raw of rawReferences) {
    const name = /^\$\(MainSource\)$/i.test(raw) ? mainSource || raw : raw;
    const path = name.replace(/\\/g, "/").replace(/^(\.\/)+/, "").toLowerCase();
    const basename = /[$@%]\(|[*?;]/.test(path) ? null : path.split("/").at(-1);
    references.set(path, { name, basename });
  }

  const sourcesByName = new Map();
  for (const file of sources) {
    const basename = file.name.toLowerCase();
    if (!sourcesByName.has(basename)) sourcesByName.set(basename, []);
    sourcesByName.get(basename).push(file);
  }

  const referenceCounts = new Map();
  for (const { basename } of references.values()) {
    referenceCounts.set(basename, (referenceCounts.get(basename) || 0) + 1);
  }

  const results = [{
    name: project.name, pascal: projectText, csharp: "", differences: [],
    sourceLabel: "Delphi-Projektdatei (XML)", message: "Projektdatei gelesen."
  }];
  for (const { name, basename } of references.values()) {
    signal.throwIfAborted();
    const matches = sourcesByName.get(basename) || [];
    if (!basename) {
      results.push({ name, unresolved: true, message: "Projektverweis kann nicht aufgelöst werden." });
    } else if (matches.length === 0) {
      results.push({ name, unresolved: true, message: "Quelldatei noch nicht ausgewählt." });
    } else if (matches.length > 1 || referenceCounts.get(basename) > 1) {
      results.push({ name, unresolved: true, message: "Dateiname ist mehrfach vorhanden. Keine eindeutige Zuordnung." });
    } else {
      results.push({ ...await inspectProjectFile(matches[0], inspectPascal), name });
    }
  }

  // Delphi projects do not always list every unit in the .dproj.
  for (const file of sources) {
    signal.throwIfAborted();
    if (file.name.toLowerCase() !== project.name.toLowerCase() && !referenceCounts.has(file.name.toLowerCase())) {
      results.push({ ...await inspectProjectFile(file, inspectPascal), name: `${file.name} (zusätzlich ausgewählt)` });
    }
  }
  signal.throwIfAborted();

  return { results, referenceCount: references.size };
}
