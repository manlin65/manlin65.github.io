# KI-gestützter Angebots- und Rechnungscheck - Demo

## Start
1. ZIP entpacken.
2. `index.html` per Doppelklick öffnen.
3. Unter `Testrechnungen` eine oder mehrere PDFs auswählen bzw. per Drag & Drop in die Anwendung ziehen.
4. Daten prüfen, bei Bedarf bearbeiten, Positionen kontrollieren und Ergebnis speichern.
5. Unter `Übersicht` nach CSV, Excel-kompatibler XLS-Datei oder SQL Server exportieren.

## Enthalten
- Browser-Anwendung ohne Installation
- 10 vollständig fiktive Rechnungs-PDFs
- 4 korrekte Testfälle und 6 Fälle mit Auffälligkeiten
- Positionsprüfung
- Netto/MwSt./Gesamt-Prüfung
- Zahlungsziel/Fälligkeit
- Dublettenerkennung
- lokale Dokumentübersicht
- CSV-Export
- Excel-kompatibler Export (`.xls`)
- SQL-Server-Export als INSERT-Skript
- SQL-Server-Datenbankschema unter `SQL_Server/01_Datenbank_anlegen.sql`

## Demo vs. Produktion
Die mitgelieferten Test-PDFs enthalten zusätzlich einen unsichtbaren, maschinenlesbaren Demo-Datensatz. Dadurch funktioniert die Demo komplett offline und reproduzierbar. Bei beliebigen echten PDF-Layouts kann der Benutzer die Daten manuell erfassen. Für eine Produktionsversion würde die Dokumenterkennung durch einen OCR-/KI-Service (z. B. über REST API) ersetzt. Die Prüf- und Exportlogik kann dabei unverändert bleiben.

## Datenschutz
Die Demo überträgt keine Daten an einen Server. Gespeicherte Ergebnisse liegen nur im `localStorage` des Browsers.
