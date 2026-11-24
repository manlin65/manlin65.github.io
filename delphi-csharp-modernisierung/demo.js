"use strict";

const examples = {
  condition: {
    title: "Funktion mit Bedingungen",
    pascal: `function DiscountPercent(Amount: Integer): Integer;
begin
  if Amount >= 100 then
    Result := 10
  else if Amount >= 50 then
    Result := 5
  else
    Result := 0;
end;`,
    csharp: `static int DiscountPercent(int amount)
{
    if (amount >= 100)
        return 10;
    if (amount >= 50)
        return 5;

    return 0;
}`,
    differences: [
      "Datentyp: Delphi verwendet Integer, C# verwendet int für dieselbe 32-Bit-Ganzzahl.",
      "Rückgabe: Delphi weist das Ergebnis mit := an Result zu. C# gibt den Wert mit return zurück.",
      "Bedingung: Delphi schreibt if … then. C# setzt den Ausdruck nach if in Klammern."
    ]
  },
  sum: {
    title: "Schleife mit Summenberechnung",
    pascal: `function Sum(const Values: array of Integer): Integer;
var
  I: Integer;
begin
  Result := 0;
  for I := Low(Values) to High(Values) do
    Result := Result + Values[I];
end;`,
    csharp: `static int Sum(int[] values)
{
    int total = 0;
    for (int i = 0; i < values.Length; i++)
        total += values[i];

    return total;
}`,
    differences: [
      "Indexierung: Der offene Array-Parameter in Delphi und das C#-Array beginnen bei Index 0.",
      "Schleifengrenze: Delphi zählt bis einschließlich High(Values). C# prüft i < values.Length.",
      "Leere Eingabe: Beide Schleifen überspringen den Schleifenrumpf und liefern 0."
    ]
  },
  class: {
    title: "Einfache Klasse",
    pascal: `type
  TStockItem = class
  private
    FName: string;
    FQuantity: Integer;
  public
    constructor Create(const AName: string);
    property Name: string read FName;
    property Quantity: Integer read FQuantity;
    procedure Add(Units: Integer);
  end;

constructor TStockItem.Create(const AName: string);
begin
  inherited Create;
  FName := AName;
  FQuantity := 0;
end;

procedure TStockItem.Add(Units: Integer);
begin
  FQuantity := FQuantity + Units;
end;`,
    csharp: `sealed class StockItem
{
    public string Name { get; }
    public int Quantity { get; private set; }

    public StockItem(string name)
    {
        Name = name;
        Quantity = 0;
    }

    public void Add(int units)
    {
        Quantity += units;
    }
}`,
    differences: [
      "Eigenschaften: Delphi liest aus privaten Feldern. C# verwendet automatisch implementierte Eigenschaften.",
      "Zugriff: Aufrufer können Name und Quantity lesen. Add ändert den Bestand über das Feld in Delphi und den privaten Setter in C#.",
      "Aufbau: Delphi deklariert die Methoden in der Klasse und implementiert sie darunter. C# schreibt die Methoden direkt in den Klassenblock."
    ]
  }
};

const form = document.querySelector("#example-form");
const importForm = document.querySelector("#import-form");
const fileInput = document.querySelector("#pascal-file");
const importStatus = document.querySelector("#import-status");
const projectForm = document.querySelector("#project-form");
const projectInput = document.querySelector("#project-file");
const projectSources = document.querySelector("#project-sources");
const projectSample = document.querySelector("#project-sample");
const projectStatus = document.querySelector("#project-status");
const projectResults = document.querySelector("#project-results");
const projectActions = document.querySelector("#project-actions");
const projectExport = document.querySelector("#project-export");
const projectExportHelp = document.querySelector("#project-export-help");
const projectBack = document.querySelector("#project-back");
const selection = document.querySelector("#example");
const title = document.querySelector("#example-title");
const pascalHeading = document.querySelector("#pascal-heading");
const pascalCode = document.querySelector("#pascal-code");
const csharpCode = document.querySelector("#csharp-code");
const differences = document.querySelector("#differences");
const notesSection = document.querySelector("#notes");
const status = document.querySelector("#status");
const copyButton = document.querySelector("#copy");
const output = document.querySelector("#code-output");
const modeButtons = [...document.querySelectorAll("[data-mode]")];
const views = { example: examples[selection.value] };
let activeExample;
let mode = "project";
let importRequest = 0;
let projectRun;
let currentProject;

const translationNotes = [
  "Datentyp und Rückgabe: Aus Integer wird int. Zuweisungen an Result werden zu return.",
  "Bedingungen: Die Vergleiche werden in C#-Syntax geschrieben. Jeder zutreffende Zweig beendet die Funktion direkt."
];

const pascalTokens = /\b(?:function|type|const|var|begin|end|if|then|else|for|to|do|array|of|class|private|public|constructor|property|read|procedure|inherited|Integer|string|[0-9]+)\b/gi;
const csharpTokens = /\b(?:static|int|if|return|for|sealed|class|public|private|string|get|set|void|[0-9]+)\b/g;

function showCode(element, source, tokens) {
  const fragment = document.createDocumentFragment();
  let offset = 0;

  for (const match of source.matchAll(tokens)) {
    fragment.append(source.slice(offset, match.index));
    const token = document.createElement("span");
    token.className = /^[0-9]/.test(match[0]) ? "token-number" : "token-keyword";
    token.textContent = match[0];
    fragment.append(token);
    offset = match.index + match[0].length;
  }

  fragment.append(source.slice(offset));
  element.replaceChildren(fragment);
  element.parentElement.scrollLeft = 0;
}

function renderOutput() {
  const example = views[mode];
  activeExample = example;
  output.hidden = !example;
  if (!example) {
    pascalCode.textContent = "";
    csharpCode.textContent = "";
    status.textContent = "";
    return;
  }
  title.textContent = example.title;
  pascalHeading.textContent = example.sourceLabel || "Delphi/Object Pascal";
  showCode(pascalCode, example.pascal, pascalTokens);
  showCode(csharpCode, example.csharp, csharpTokens);
  copyButton.disabled = !example.csharp;
  notesSection.hidden = example.differences.length === 0;
  projectBack.hidden = mode !== "project" || projectResults.hidden;
  const notes = example.differences.map((text) => {
    const item = document.createElement("li");
    item.textContent = text;
    return item;
  });
  differences.replaceChildren(...notes);
  status.textContent = example.previewNote || "";
}

function switchMode(nextMode) {
  mode = nextMode;
  modeButtons.forEach((button) => {
    const active = button.dataset.mode === mode;
    button.setAttribute("aria-pressed", String(active));
    document.getElementById(button.getAttribute("aria-controls")).hidden = !active;
  });
  renderOutput();
}

function setView(viewMode, example) {
  views[viewMode] = example;
  if (mode === viewMode) renderOutput();
}

function showProjectFile(result) {
  setView("project", {
    pascal: "", csharp: "", differences: [], ...result, title: result.name,
    previewNote: result.error || result.message
  });
}

function reportImport(message, error = false) {
  importStatus.textContent = message;
  importStatus.classList.toggle("is-error", error);
}

async function inspectPascalFile(file) {
  const result = { title: file.name, pascal: "", csharp: "", differences: [] };
  if (!/\.pas$/i.test(file.name) || file.size > 64 * 1024) {
    return { ...result, error: "Wähle eine .pas-Datei mit höchstens 64 KB." };
  }
  try {
    result.pascal = new TextDecoder("utf-8", { fatal: true }).decode(await file.arrayBuffer());
  } catch {
    return { ...result, error: "Datei konnte nicht gelesen werden. Speichere sie im UTF-8-Format." };
  }
  try {
    result.csharp = convertPascalFunction(result.pascal);
    result.differences = translationNotes;
    return result;
  } catch (error) {
    return { ...result, error: `Übersetzung nicht möglich. ${error.message}` };
  }
}

function resetProjectResults() {
  projectRun?.abort();
  projectStatus.textContent = "";
  projectStatus.classList.remove("is-error");
  projectResults.replaceChildren();
  projectResults.hidden = true;
  currentProject = undefined;
  projectActions.hidden = true;
  setView("project", undefined);
}

function projectResultRow(result) {
  const row = document.createElement("li");
  const name = document.createElement("code");
  name.textContent = result.name;
  const outcome = document.createElement("span");
  outcome.textContent = result.message || result.error || "C# erzeugt.";
  row.append(name, outcome);
  const open = document.createElement("button");
  open.type = "button";
  open.textContent = result.csharp ? "C# anzeigen" : result.pascal ? "Code anzeigen" : "Details anzeigen";
  open.setAttribute("aria-label", `${open.textContent} für ${result.name}`);
  open.addEventListener("click", () => {
    showProjectFile(result);
    title.focus();
  });
  row.append(open);
  return row;
}

function copyWithSelection(source) {
  const field = document.createElement("textarea");
  field.value = source;
  field.readOnly = true;
  field.style.position = "fixed";
  field.style.opacity = "0";
  document.body.append(field);
  try {
    field.select();
    return document.execCommand("copy");
  } finally {
    field.remove();
    copyButton.focus({ preventScroll: true });
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const example = examples[selection.value];
  setView("example", { ...example, previewNote: `${example.title} wird angezeigt.` });
});

fileInput.addEventListener("change", () => {
  importRequest++;
  reportImport("");
  setView("file", undefined);
});

importForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const file = fileInput.files[0];
  if (!file) return;

  const request = ++importRequest;
  setView("file", undefined);
  reportImport("");

  const result = await inspectPascalFile(file);
  if (request !== importRequest) return;
  setView("file", result);
  reportImport(result.error || "C#-Code aus der Datei erzeugt.", Boolean(result.error));
});

async function analyzeProject(loadFiles, fromSample = false) {
  resetProjectResults();
  projectRun = new AbortController();
  const { signal } = projectRun;
  try {
    const [project, ...sources] = await loadFiles(signal);
    if (signal.aborted || !project) return;
    const { results, referenceCount } = await inspectDelphiProject(
      project, sources, inspectPascalFile, signal
    );
    if (signal.aborted) return;
    const translated = results.filter((result) => result.csharp).length;
    const unresolved = results.filter((result) => result.unresolved).length;
    projectStatus.textContent = `${project.name} · Dateiverweise: ${referenceCount} · C# erzeugt: ${translated} · Offene Verweise: ${unresolved}`;
    const rows = results.map(projectResultRow);
    projectResults.replaceChildren(...rows);
    projectResults.hidden = rows.length === 0;
    currentProject = { name: project.name, results };
    projectActions.hidden = false;
    projectExport.disabled = translated === 0;
    const firstTranslation = results.find((result) => result.csharp);
    if (firstTranslation) {
      projectExportHelp.textContent = "Das ZIP enthält eine .NET-Klassenbibliothek mit den übersetzten Funktionen.";
      showProjectFile(firstTranslation);
      if (fromSample && document.activeElement === projectSample) projectExport.focus();
    } else {
      const hasPascal = sources.some((file) => /\.pas$/i.test(file.name));
      if (hasPascal) {
        projectExportHelp.textContent = "Keine der gewählten .pas-Dateien konnte übersetzt werden. Den Grund siehst du in der Liste.";
      } else {
        const missingSources = sources.length
          ? "Unter den ausgewählten Dateien ist keine .pas-Datei."
          : "Wähle oben die zugehörigen .pas-Dateien aus, damit C# erzeugt werden kann.";
        const sampleHelp = project.name.toLowerCase() === "modernisierungdemo.dproj"
          ? " Für dieses Beispiel öffne projektbeispiel\\Quellen und wähle Rabatt.pas und Versandklasse.pas zusammen aus."
          : "";
        projectExportHelp.textContent = missingSources + sampleHelp;
      }
    }
  } catch (error) {
    if (signal.aborted) return;
    projectStatus.textContent = error.message;
    projectStatus.classList.add("is-error");
  }
}

function analyzeSelectedProject() {
  return analyzeProject(() => [projectInput.files[0], ...projectSources.files]);
}

async function loadSampleProject(signal) {
  if (location.protocol === "file:") {
    throw new Error("Öffne die Demo über einen lokalen HTTP-Server oder wähle die Beispieldateien unten von Hand aus.");
  }
  projectStatus.textContent = "Beispielprojekt wird geladen …";
  const paths = [
    "ModernisierungDemo.dproj",
    "ModernisierungDemo.dpr",
    "Quellen/Rabatt.pas",
    "Quellen/Versandklasse.pas",
    "Quellen/Messwertanalyse.pas"
  ];
  return Promise.all(paths.map(async (path) => {
    try {
      const response = await fetch(`./projektbeispiel/${path}`, { signal });
      if (!response.ok) throw new Error();
      return new File([await response.blob()], path.split("/").pop());
    } catch {
      throw new Error(`Beispieldatei konnte nicht geladen werden: ${path}.`);
    }
  }));
}

projectSample.addEventListener("click", () => analyzeProject(loadSampleProject, true));
projectInput.addEventListener("change", () => {
  projectSources.value = "";
  projectSources.disabled = projectInput.files.length === 0;
  analyzeSelectedProject();
});
projectSources.addEventListener("change", analyzeSelectedProject);
projectForm.addEventListener("submit", (event) => {
  event.preventDefault();
  analyzeSelectedProject();
});

projectExport.addEventListener("click", () => {
  const { name, results } = currentProject;
  const url = URL.createObjectURL(projectArchive(name, results));
  const link = document.createElement("a");
  link.href = url;
  link.download = "DelphiModernisierung-CSharp.zip";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
});

copyButton.addEventListener("click", async () => {
  const example = activeExample;
  if (!example?.csharp) return;
  let copied = false;

  try {
    await navigator.clipboard.writeText(example.csharp);
    copied = true;
  } catch {
    try {
      copied = copyWithSelection(example.csharp);
    } catch {
      copied = false;
    }
  }

  if (example === activeExample) {
    status.textContent = copied
      ? "C#-Code in die Zwischenablage kopiert."
      : "Kopieren fehlgeschlagen. Du kannst den C#-Code im Codefeld markieren und kopieren.";
  }
});

modeButtons.forEach((button) => button.addEventListener("click", () => switchMode(button.dataset.mode)));
