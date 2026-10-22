# DatenCockpit

Portfolio-Demo von Manfred Linner für den Ablauf **Datei einlesen → Daten prüfen →
Auffälligkeiten bearbeiten und freigeben → Kennzahlen anzeigen**. Die Oberfläche
liegt unter `/datencockpit/` auf GitHub Pages. Die Daten liegen in Supabase
PostgreSQL; eng begrenzte SQL-Funktionen bilden die API. Netlify und Azure sind
für das Cockpit nicht erforderlich. Nur fiktive Daten verwenden; diese Demo hat keine Mitarbeiterkonten.

## Funktionsumfang

- CSV (UTF-8, Komma oder Semikolon, Anführungszeichen und mehrzeilige Felder) und
  Excel XLSX, erstes Tabellenblatt. Alte XLS-Dateien vorher als XLSX speichern.
- Maximal 2 MB Dateigröße und 1.000 Aufträge; API maximal 1 MB JSON-Nutzdaten.
- Pflichtspalten: Auftragsnummer, Datum, Kunde, Betrag, Status. Reihenfolge egal.
- Fehlende Werte, doppelte Auftragsnummern (ohne Groß-/Kleinschreibung), ungültige
  Daten, Beträge und Status werden markiert. Datum zwischen 2000 und 2100;
  Betrag 0 bis 10 Mio. Euro mit maximal zwei Nachkommastellen;
  Status `offen`, `bezahlt` oder `storniert`.
- Werte bearbeiten oder Zeilen ausschließen. Erst nach fehlerfreier Auswahl und
  ausdrücklicher Freigabe wird gespeichert; dieselbe Datenprüfung läuft im Backend.
- SQL-Gruppierung nach Auftragsmonat: bezahlter Umsatz, offene Aufträge und offenes
  Volumen. Stornierungen zählen zur Anzahl, nicht zu den beiden Geldsummen.
  Das ist eine Auftragsauswertung, keine buchhalterische Umsatzrealisierung.
- Monatsdiagramm, Tabelle, CSV-Export und Löschen des eigenen Imports.

## Lokal starten

Node.js >=22 und vorhandene öffentliche Projektkonfiguration in `config.js`
verwenden. Für den aktiven Supabase-Modus werden keine Datenbankpasswörter oder
lokalen `.env`-Dateien benötigt.

```sh
cd /workspace/manlin65.github.io
npm ci --include=dev --cache /workspace/.npm-cache --no-audit --no-fund
npm run build
npm test
npm run test:datencockpit:supabase
npm run dev:datencockpit
```

Der lokale Server auf Port 8888 liefert die Cockpit-Dateien, die gemeinsamen
Homepage-Assets und die öffentliche Konfiguration. Er lädt eine vorhandene
`.env.local` nur optional für den alten Neon-Adapter. Geheimdateien werden nicht
ausgeliefert. Nach Umgebungswiederherstellung den Server neu starten.

## Prüfen

```sh
npm test
npm run test:datencockpit:supabase
# Bei laufendem lokalen Server:
npm run test:datencockpit:browser
# Gegen die veröffentlichte Website:
DATENCOCKPIT_TEST_URL=https://www.mlinner-software.de npm run test:datencockpit:browser
```

38 Node-Tests prüfen unter anderem die echte Supabase-SQL-Migration mit PGlite,
Rollenrechte, Pflichtwerte, Dubletten, Import-Rollback, Zugriffsschlüssel, Summen,
Ablauf und Löschung. `test:datencockpit:supabase` prüft das echte Supabase-Projekt:
Status, verweigerten direkten Tabellenzugriff, Import, SQL-Bericht, falsche
Zugriffsschlüssel und Löschen. Eigene Testimporte werden wieder entfernt.

Der separate Browsertest verwendet Playwright Core und `/usr/bin/chromium`
(alternativ `CHROMIUM_PATH`). Er prüft CSV/XLSX, Bearbeiten, Ausschließen, Zustimmung,
reale Datenbankkennzahlen, Zugriffsschutz, CSV-Export, Neuladen, mobile Ansicht und
Löschen. Externe Browseranfragen verwenden bei Bedarf den verwalteten HTTPS-Proxy
mit aktiver TLS-Prüfung. Screenshots liegen unter `/tmp/datencockpit-upload.png`,
`/tmp/datencockpit-report.png` und `/tmp/datencockpit-mobile.png`.

## Demo vorführen

1. „Beispieldaten laden“ wählen: 8 Zeilen, 3 Zeilen mit Auffälligkeiten.
2. Die zweite A-1003-Zeile (Dateizeile 5) ausschließen.
3. Den fehlenden Kundennamen in Dateizeile 6 ergänzen, z. B. „Musterbetrieb“.
4. Die Auswahl ausdrücklich freigeben und „Freigeben & Bericht erstellen“ wählen.
5. Erwartung: **7 Aufträge, 4.650,00 € bezahlt, 2 offene Aufträge mit 1.490,50 €**.
6. Monatsbericht herunterladen, SQL-Abfrage ansehen, Import bei Bedarf löschen.

September: 3 Aufträge, 1.570,00 € bezahlt, 840,50 € offen.
Oktober: 4 Aufträge, 3.080,00 € bezahlt, 650,00 € offen, 1 Stornierung.

## Supabase: Schema und Zugriff

Die Projektadresse und der öffentliche Publishable-Key stehen in `config.js`.
Dort gehören niemals Secret-/service_role-Schlüssel oder Datenbankpasswörter hin.
Die versionierten SQL-Skripte, Rechte und RPC-Funktionen sind in
[../supabase/README.md](../supabase/README.md) beschrieben.

Die Tabellen `datencockpit_batches` und `datencockpit_orders` sind für öffentliche
API-Rollen nicht direkt les- oder schreibbar. Die Funktionen prüfen Eingabedaten,
Gültigkeit und pro Import einen zufälligen Zugriffsschlüssel. Nur dessen Hash liegt
in der Datenbank; im Browser liegt der Schlüssel tablokal in sessionStorage,
nicht in einer URL. Rohdateien und ausgeschlossene Zeilen werden nicht gespeichert.

Zugriff endet nach 24 Stunden; der nächste erfolgreiche Import entfernt abgelaufene
Daten physisch. Es läuft kein automatischer Löschjob. Das ist ein getrennter
Demo-Zugang pro Import, keine Mitarbeiteranmeldung. Vor produktiver Nutzung mit
Geschäftsdaten sind Benutzerkonten, Missbrauchsschutz und ein definierter
Löschprozess zu ergänzen.

## Layout und Veröffentlichung

Die Seite nutzt das originale ML-Logo, Manrope und Source Sans 3, Navigation,
Petrolfarben und Footer aus `assets/site.css`. Eigene Regeln sind auf
`.cockpit-app` begrenzt. Die gemeinsamen Assets werden auch lokal und im
Netlify-Build bereitgestellt. Impressum/Datenschutz und Navigation verweisen auf
die vorhandene Homepage.

GitHub Pages veröffentlicht `main` direkt unter
`https://www.mlinner-software.de/datencockpit/`. Die Homepage verlinkt das Cockpit
im Datenqualitäts-Projekt. Nach Quelltextänderungen `npm run build` ausführen und
das generierte `app.js` sowie `THIRD_PARTY_LICENSES.txt` mit übernehmen.

Der bestehende Rauszeit-Netlify-Build bleibt erhalten. Er übernimmt für das
Cockpit die Supabase-Konfiguration; andere Funktionen werden nicht verändert.
Die alte Neon-/Netlify-Anbindung bleibt als Alternative im Repository, ist aber
für das aktive Cockpit nicht erforderlich. Die alte Neon-Datenbank wird weder
zurückgesetzt noch gelöscht.

## How-to auf der Projektseite

Der sichtbare Downloadbereich vor den Arbeitsschritten öffnet die 12-seitige PDF
`downloads/DatenCockpit-Howto.pdf`. Sie erklärt Projektzweck, Architektur,
Dateiformate, Datenbank, Rechte, Einrichtung, GitHub Pages und Korrekturübungen.
Die fünf Beispieldateien sind als PDF-Anhänge eingebettet. Das daneben verlinkte
ZIP enthält zusätzlich die PDF, alle fünf Originaldateien, die beiden SQL-Skripte
und die SVG-Architekturgrafik.

Die Dokumente sind vorab erzeugt; der normale Node-Build braucht keine PDF-Tools.
Zum Aktualisieren auf einem Rechner mit Python, reportlab, pypdf und fontTools:

```sh
python3 scripts/create-datencockpit-guide.py
npm run build
```

Danach PDF, ZIP und SVG prüfen und die erzeugten Dateien mit veröffentlichen.
