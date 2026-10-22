# DatenCockpit

Portfolio-Demo von manlin für den Ablauf **Datei einlesen → Daten prüfen →
Auffälligkeiten bearbeiten und freigeben → Kennzahlen anzeigen**. Die Oberfläche
liegt unter `/datencockpit/`, das Backend in Netlify Functions, die Daten in Neon
PostgreSQL. Nur fiktive Daten verwenden; diese Demo hat keine Mitarbeiterkonten.

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

Node.js >=22, vorhandene `.env.local` mit `DATABASE_URL`, `DATABASE_URL_UNPOOLED`
und `NEON_BRANCH` verwenden. Neon CLI kann diese Werte mit `neon env pull` laden.
Niemals den Inhalt der Datei protokollieren oder veröffentlichen.

```sh
cd /workspace/manlin65.github.io
npm ci --cache /workspace/.npm-cache --no-audit --no-fund
npm run migrate:datencockpit
npm run build
npm test
npm run dev:datencockpit
```

Die Migration ist versioniert unter `migrations/datencockpit/001_orders.sql`.
Sie ergänzt ausschließlich `datencockpit_batches`, `datencockpit_orders` und deren
Indizes. Der Runner nutzt die direkte Verbindung und eine Transaktion. Sie wurde
auf einem kurzlebigen Neon-Branch zweimal getestet und anschließend auf dem
vorgesehenen production-Branch angewendet. Der Testbranch wurde entfernt.

Der lokale Server auf Port 8888 liefert nur die öffentlichen Cockpit-Dateien und
verwendet dieselben Funktionen wie Netlify. Er respektiert den Cloud-HTTPS-Proxy
mit aktivierter TLS-Prüfung. Er wird nach einer Umgebungswiederherstellung neu gestartet.

## Prüfen

```sh
npm test
# Bei laufendem dev:datencockpit-Server und verfügbarem Chromium:
npm run test:datencockpit:browser
```

34 Node-Tests inklusive bestehender Tests. Der separate Browsertest verwendet
Playwright Core und `/usr/bin/chromium` (alternativ `CHROMIUM_PATH` setzen). Er legt
ausschließlich eigene Testimporte an und entfernt sie wieder. Geprüft werden CSV,
XLSX, Korrektur, Ausschluss, Zustimmung, echte SQL-Kennzahlen, Zugriffsschutz,
CSV-Export, Neuladen, mobile Breite und Löschen. Screenshots liegen lokal unter
`/tmp/datencockpit-upload.png`, `/tmp/datencockpit-report.png` und
`/tmp/datencockpit-mobile.png`.

Interne HTTP-Prüfungen: `/datencockpit/` liefert 200; `/.env.local` liefert 404;
`/.netlify/functions/datencockpit-status` liefert 200 und `connected:true`.

## Demo vorführen

1. „Beispieldaten laden“ wählen: 8 Zeilen, 3 Zeilen mit Auffälligkeiten.
2. Die zweite A-1003-Zeile (Dateizeile 5) ausschließen.
3. Den fehlenden Kundennamen in Dateizeile 6 ergänzen, z. B. „Musterbetrieb“.
4. Die Auswahl ausdrücklich freigeben und „Freigeben & Bericht erstellen“ wählen.
5. Erwartung: **7 Aufträge, 4.650,00 € bezahlt, 2 offene Aufträge mit 1.490,50 €**.
6. Monatsbericht herunterladen, SQL-Abfrage ansehen, Import bei Bedarf löschen.

September: 3 Aufträge, 1.570,00 € bezahlt, 840,50 € offen.
Oktober: 4 Aufträge, 3.080,00 € bezahlt, 650,00 € offen, 1 Stornierung.

## Datenmodell und Zugriff

Jeder Import erhält eine zufällige UUID und einen kryptografisch zufälligen
256-Bit-Zugriffsschlüssel. Nur dessen SHA-256-Hash wird in der Datenbank gespeichert.
Lesen und Löschen erfordern diesen Schlüssel im Authorization-Header. Es gibt keine
öffentliche Liste von Importen. Der Browser hält den Schlüssel ausschließlich in
sessionStorage; er steht weder in der URL noch in Cookies. Das ist ein getrennter
Demo-Zugang pro Import, keine Benutzerverwaltung für einen echten Mehrbenutzerbetrieb.

Vor Freigabe bleiben Rohdaten im Browser. Die API speichert nur geprüfte Aufträge,
keine hochgeladenen Dateien und keine ausgeschlossenen Zeilen. Geld wird als ganze
Cent-Beträge gespeichert. Ein Import ist nach 24 Stunden nicht mehr lesbar;
physisch entfernt werden abgelaufene Importe beim nächsten erfolgreichen Import
oder sofort über die Löschfunktion. Es läuft kein automatischer Bereinigungsjob.

Der öffentliche Import-Endpunkt ist für eine kleine Beispieldaten-Demo gedacht.
Vor produktiver Nutzung mit Geschäftsdaten sind Benutzeranmeldung, Rollen,
Missbrauchsschutz und ein definierter Löschprozess zu ergänzen.

## Layout der bestehenden Homepage

Das Cockpit verwendet das Original-ML-Logo, die Schriften Manrope und Source Sans 3,
Navigation und Footer sowie die Petrolfarben aus `assets/site.css`. `styles.css`
begrenzt eigene Regeln auf `.cockpit-app`, damit das gemeinsame Seitenlayout
unverändert bleibt. Der lokale Server und der Netlify-Build stellen die nötigen
Brand-, Font- und Site-Dateien ebenfalls bereit. Die Hauptnavigation verweist
auf die Abschnitte der Homepage, Impressum und Datenschutz auf die bestehenden Seiten.

## Hosting auf GitHub Pages und Netlify

Die vorbereitete Anwendung ist noch nicht öffentlich bereitgestellt. Das vorhandene
Backend `https://rauszeitml.netlify.app` ist im GitHub-Pages-Frontend bereits als
Ziel eingetragen. Die neuen Functions müssen dort noch veröffentlicht werden.
Im Netlify-Build und im lokalen Server wird die Konfiguration auf relative
API-Adressen gesetzt, damit Vorschau-Deployments ihre eigenen Functions verwenden.

1. Im bestehenden Netlify-Projekt `DATABASE_URL` aus der Neon-Konfiguration als
   geheime Runtime-Variable für Functions hinterlegen. `NEON_API_KEY` ist nur für
   die Verwaltung nötig, nicht für die App.
2. Netlify verwendet den bestehenden Build `npm run build`, den Publish-Ordner
   `netlify-public` und Functions aus `netlify/functions`.
3. Die Anwendung liegt auch dort unter `/datencockpit/`; bei gleichem Ursprung
   funktionieren die voreingestellten relativen API-Adressen.
4. Für GitHub Pages in `datencockpit/config.js` ausschließlich die öffentlichen
   HTTPS-Adressen der veröffentlichten Functions hinterlegen:

```js
window.DATENCOCKPIT_CONFIG = Object.freeze({
  apiUrl: 'https://DEIN-PROJEKT.netlify.app/.netlify/functions/datencockpit-status',
  dataApiUrl: 'https://DEIN-PROJEKT.netlify.app/.netlify/functions/datencockpit-data'
});
```

Die erlaubten Website-Ursprünge sind `https://mlinner-software.de`,
`https://www.mlinner-software.de`, `https://manlin65.github.io` und die Netlify-URL
in `URL`. Lokale Freigaben werden nur im lokalen Entwicklungsserver ergänzt.
Zugangsdaten gehören niemals in diese öffentliche Konfiguration.

`datencockpit/app-source.js` ist der editierbare Quelltext; `app.js` ist das vom
Build erzeugte Browser-Bundle, das für direktes GitHub-Pages-Hosting mitgeliefert
wird. Nach Änderungen am Quelltext `npm run build` ausführen. Der Build erzeugt
auch `THIRD_PARTY_LICENSES.txt`; Backendcode und Geheimnisse werden nicht kopiert.
