# Delphi → C# Modernisierung

## Lokal starten

1. Öffne `index.html` im Browser. Die Demo braucht keine Installation und keine Internetverbindung.
2. Wechsle zu **Einzeldatei übersetzen** und wähle eine Datei aus dem Ordner `beispiele`. Unter **Pascal-Dateien zum Ausprobieren** zeigt die Seite, welche Dateien der Prototyp übersetzen kann.
3. Klicke auf **In C# übersetzen**. Links erscheint der eingelesene Pascal-Code, rechts die daraus erzeugte C#-Methode. Mit **C#-Code kopieren** übernimmst du sie in die Zwischenablage.

Die drei vorbereiteten Codevergleiche findest du im separaten Bereich **Demo**. Beim Start öffnet sich **Projekt umwandeln**.

Für GitHub Pages lege `index.html`, `styles.css`, `converter.js`, `project.js`, `project-export.js`, `demo.js` sowie die Ordner `beispiele` und `projektbeispiel` in die Veröffentlichungsquelle. Die Seite verwendet relative Pfade und braucht keinen Build-Schritt.

## Eine Delphi-Projektdatei prüfen

Starte im Demo-Ordner `python -m http.server 8000` und öffne `http://localhost:8000/`. Über **Beispielprojekt direkt testen** liest der Browser die mitgelieferte Projektdatei und ihre zugehörigen Quellen ein. Der erste erzeugte C#-Code und der ZIP-Export stehen nach der Analyse direkt bereit. Beim direkten Öffnen der HTML-Datei kannst du die Dateien weiterhin von Hand auswählen.

1. Wähle unter **Delphi-Projektdatei auswählen** eine `.dproj`, zum Beispiel `projektbeispiel/ModernisierungDemo.dproj`. Die Demo liest auch ohne zugehörige Quellen die darin aufgeführten Dateiverweise.
2. Wähle die **zugehörigen .pas-Dateien** gemeinsam aus. Beim Beispielprojekt liegen sie in `projektbeispiel/Quellen`. Eine `.dpr` kannst du ebenfalls für die Zuordnung und Vorschau auswählen.
3. Die erste übersetzte Datei erscheint automatisch. Über **C# anzeigen**, **Code anzeigen** oder **Details anzeigen** kannst du die anderen Einträge einzeln öffnen. **Zur Projektdateiliste** springt zurück. Bei Bedarf liest **Projekt analysieren** die gewählten Dateien erneut ein.
4. Sobald mindestens eine Übersetzung vorliegt, speichert **C#-Projekt als ZIP speichern** eine .NET-8-Klassenbibliothek mit einer `.csproj`, den generierten `.cs`-Dateien und einem Projektbericht. Entpacke das ZIP und führe im entpackten Ordner `dotnet build` aus. Dafür brauchst du das .NET-8-SDK oder ein neueres SDK mit dem .NET-8-Targeting-Pack.

Der Browser liest nur die ausgewählten Dateien. Die Liste umfasst explizite Einträge der `.dproj` und zusätzlich ausgewählte Dateien. Die Demo ordnet Quellen anhand eindeutiger Dateinamen zu und prüft ihre ursprünglichen Pfade auf der Festplatte nicht. Doppelte Dateinamen und nicht auflösbare Projektvariablen werden gemeldet. Build-Bedingungen, Imports und Suchpfade bleiben unberücksichtigt. Die Klassenbibliothek enthält nur unterstützte Funktionen. Der Projektbericht nennt ausgelassene Dateien und Gründe. Ein Delphi-Programmstart und Formulare werden nicht übertragen.

Das mitgelieferte Projekt enthält zwei übersetzbare Units und `Messwertanalyse.pas`. Bei dieser Unit meldet die Demo den Array-Parameter in Zeile 5.

## Beispieldateien zum Laden

| Datei | Was sie zeigt | Erwartung beim Laden |
| --- | --- | --- |
| `Rabatt.pas` | Rabattstufen | C#-Methode |
| `Schwellwerte.pas` | Gleichheit und Ungleichheit | C#-Methode |
| `Temperaturzone.pas` | Negative Schwellenwerte | C#-Methode |
| `Versandklasse.pas` | Vier Gewichtsstufen und Fehlerwert | C#-Methode |
| `Statusprioritaet.pas` | Sonderfall vor allgemeinen Regeln | C#-Methode |
| `Messwertanalyse.pas` | Längste Alarmserie mit Array, Schleife und verschachtelten Bedingungen | Fehlermeldung mit Zeile |
| `Bestandsreservierung.pas` | Klasse mit Eigenschaften, Reservieren und Freigeben | Fehlermeldung mit Zeile |

## Was der Prototyp verarbeitet

- Eine `.pas`-Datei in UTF-8 bis 64 KB mit genau einer Funktion. Du kannst die Funktion als Ausschnitt oder in einer einfachen Delphi-Unit mit `interface` und `implementation` bereitstellen.
- Ein `Integer`-Parameter und `Integer` als Rückgabetyp. `if` und optional `else if` vergleichen den Parameter mit dezimalen Ganzzahlkonstanten. Jeder Zweig und das abschließende `else` weisen `Result` eine Ganzzahlkonstante zu. Zeilenkommentare mit `//` werden übersprungen.
- Bei unbekannter Syntax gibt die Demo eine Fehlermeldung mit Zeilennummer aus. Schleifen, Klassen, weitere Deklarationen und ganze Projekte liegen außerhalb des unterstützten Umfangs.

Die Datei wird nur im Browser gelesen. Die Übersetzung ist regelbasiert und erzeugt einen C#-Methodenausschnitt für ein umgebendes Programm.

## Tatsächlich geprüft

- **Browser.** In Chrome 157 alle sieben `.pas`-Dateien über die Dateiauswahl der lokalen HTML-Seite geladen. Die fünf erzeugten Ausgaben stimmten mit dem kopierten Text überein. Bei den zwei komplexeren Dateien gab es eine Meldung mit Zeile und das C#-Feld blieb leer. Die drei vorbereiteten Beispiele und die Anordnung bei 1.440 und 375 Pixeln wurden erneut geprüft.
- **C# und .NET.** Die fünf direkt aus der Browserausgabe übernommenen Methoden mit .NET SDK 10.0.401 kompiliert und mit 30 Eingaben geprüft. Dazu gehörten die Temperaturgrenzen −11, −10, 0 und 1, alle Versandgrenzen samt ungültigen Gewichten und der Statuscode 503 als Sonderfall vor anderen 5xx-Codes.
- **Projektanalyse.** Unter Chrome die mitgelieferte `.dproj` einzeln gelesen und die Dateiverweise ohne Quellen angezeigt. Anschließend die Quellen separat ausgewählt und die beiden erzeugten C#-Methoden kopiert. Getestet wurden außerdem eine fehlende Quelle, mehrdeutige Dateinamen, ein Verweis mit einer unbekannten Projektvariable und fehlerhaftes XML.
- **Projekt-Export.** Das von Chrome heruntergeladene ZIP entpackt und die enthaltene .NET-8-`.csproj` mit `dotnet build` gebaut. Der Build erzeugte die Bibliothek mit 0 Warnungen und 0 Fehlern. Der Projektbericht enthielt auch die ausgelassene `Messwertanalyse.pas` mit der Erklärung zum Array-Parameter.
- **Delphi und Hosting.** Die installierten Delphi-Kommandozeilencompiler unterstützen in dieser Edition keine Builds. Die Pascal-Dateien wurden als Eingabe für den Prototyp geprüft. Ein Delphi-Build und eine Bereitstellung auf GitHub Pages waren nicht Teil der Prüfung.
