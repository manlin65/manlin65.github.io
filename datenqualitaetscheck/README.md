# KI-Datenqualitätscheck – Excel Fix V3

## Schnelltest
1. `index.html` öffnen.
2. Auf **„Mitgelieferte Excel-Testmappe direkt laden“** klicken.
3. Das Blatt `Kunden_Test` wird automatisch ausgewählt und sofort geprüft.
4. Danach können eigene `.xlsx`, `.xlsm` und `.csv` Dateien über „Datei auswählen“ geladen werden.

## Falls der Browser lokale HTML-Dateien einschränkt
Unter Windows `START_DEMO.bat` doppelklicken. Das Skript startet mit Python einen kleinen lokalen Webserver und öffnet die Anwendung im Browser.

## Wichtig
- Kein Internet nötig.
- XLSX/XLSM werden offline verarbeitet.
- Das alte binäre `.xls`-Format wird nicht unterstützt; bitte vorher als `.xlsx` speichern.

# KI-gestützter Datenqualitäts-Check – Demo

## Schnellstart
1. `index.html` doppelklicken.
2. Einen der drei Demo-Datensätze laden **oder** eine CSV/XLSX-Datei auswählen.
3. Bei XLSX ein Tabellenblatt auswählen und `Prüfen` klicken.
4. Ergebnisse als Prüfbericht-CSV oder bereinigte CSV exportieren.

## Excel-Testdaten
`Testdaten/KI_Datenqualitaetscheck_Testdaten.xlsx` enthält:
- `Kunden_Test`
- `Artikel_Test`
- `Auftraege_Test`
- `Saubere_Daten`
- `Pruefregeln`

Die Testblätter enthalten absichtlich Dubletten, leere Pflichtfelder, falsche Formate, negative Werte, falsche Summen und inkonsistente Schreibweisen.

## SQL Server
1. In SQL Server Management Studio `SQL_Server/01_Datenbank_und_Testdaten.sql` ausführen.
2. Danach `SQL_Server/02_Datenqualitaetschecks.sql` ausführen.
3. Die Abfrage liefert eine priorisierte Fehlerliste über Kunden, Artikel und Aufträge.

Die SQL-Tabellen verwenden für die Demo bewusst lockere NVARCHAR-Felder, damit auch fehlerhafte Quelldaten gespeichert und geprüft werden können.

## Technischer Hinweis
Die HTML-Demo verbindet sich aus Sicherheitsgründen **nicht direkt** mit SQL Server. Eine Produktivversion verwendet typischerweise:

`Browser / UI -> ASP.NET Core REST API -> SQL Server`

Die lokale Demo zeigt dieselbe Prüflogik anhand eingebauter SQL-Demodaten und Excel/CSV-Dateien.

## KI-Anteil
Die Demo kombiniert eine nachvollziehbare Regel-Engine mit einer automatisch formulierten Zusammenfassung. In einer Produktivversion kann zusätzlich ein KI-Service für semantische Muster, Spaltenzuordnung, Freitext und kundenspezifische Anomalien eingebunden werden.


## Offline-Excel-Unterstützung
Die HTML-Demo enthält den Excel-Parser jetzt direkt und benötigt für `.xlsx` **keinen Internetzugriff**. Einfach `index.html` per Doppelklick öffnen, die mitgelieferte Excel-Datei auswählen, Tabellenblatt wählen und prüfen. Das alte `.xls`-Format ist in der Offline-Demo nicht vorgesehen; bitte `.xlsx` verwenden.
