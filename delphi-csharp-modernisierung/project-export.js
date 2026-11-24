"use strict";

function projectArchive(projectName, results) {
  const translated = results.filter((result) => result.csharp);
  const files = [{
    name: "DelphiModernisierung.csproj",
    content: `<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
  </PropertyGroup>
</Project>
`
  }];

  translated.forEach(({ name, csharp }, index) => {
    const unit = name.split(/[\\/]/).at(-1).replace(/\.pas\b.*$/i, "").replace(/[^a-z0-9_]/gi, "_");
    const methodName = /^static int @?([a-z_0-9]+)\(/i.exec(csharp)?.[1];
    let className = `Unit${index + 1}_${unit}`;
    if (className === methodName) className += "_Source";
    const method = ("public " + csharp).split("\n")
      .map((line) => line ? "    " + line : "").join("\n");
    files.push({
      name: `${className}.cs`,
      content: `namespace DelphiModernisierung;

public static class ${className}
{
${method}
}
`
    });
  });

  files.push({
    name: "Projektbericht.txt",
    content: [
      projectName,
      "",
      "C#-Klassenbibliothek mit den übersetzten Methoden. Build: dotnet build",
      "Ein Delphi-Programmstart und Delphi-Formulare sind kein Bestandteil dieser Bibliothek.",
      "",
      ...results.map(({ name, csharp, error, message }) =>
        `- ${name}: ${csharp ? "in C# übernommen" : "nicht übernommen. " + (error || message || "")}`)
    ].join("\n")
  });
  return createUncompressedZip(files);
}

function zipCrc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createUncompressedZip(files) {
  const encoder = new TextEncoder();
  const contents = [];
  const directory = [];
  let offset = 0;
  let directorySize = 0;

  for (const { name, content } of files) {
    const filename = encoder.encode(name);
    const data = encoder.encode(content);
    const crc = zipCrc32(data);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(12, 0x21, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, data.length, true);
    local.setUint32(22, data.length, true);
    local.setUint16(26, filename.length, true);

    const central = new DataView(new ArrayBuffer(46));
    central.setUint32(0, 0x02014b50, true);
    central.setUint16(4, 20, true);
    central.setUint16(6, 20, true);
    central.setUint16(14, 0x21, true);
    central.setUint32(16, crc, true);
    central.setUint32(20, data.length, true);
    central.setUint32(24, data.length, true);
    central.setUint16(28, filename.length, true);
    central.setUint32(42, offset, true);
    contents.push(local.buffer, filename, data);
    directory.push(central.buffer, filename);
    offset += local.byteLength + filename.length + data.length;
    directorySize += central.byteLength + filename.length;
  }

  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, directorySize, true);
  end.setUint32(16, offset, true);
  return new Blob([...contents, ...directory, end.buffer], { type: "application/zip" });
}
