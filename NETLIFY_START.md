# Rauszeit auf Netlify – Start

Die Website läuft auf GitHub Pages bereits mit Wetter, Kalender und Live-Ortsauswahl. Netlify kann zusätzlich die gesamte Rauszeit-Anwendung samt Ticketmaster-Backend betreiben. Die bestehende STRATO-Domain muss dafür nicht geändert werden.

## Einrichten

1. https://app.netlify.com/ öffnen und mit GitHub anmelden.
2. Ein bestehendes GitHub-Projekt importieren: `manlin65/manlin65.github.io`, Branch `main`.
3. Base directory leer lassen. Die Datei `netlify.toml` liefert automatisch:
   - Build command: `node scripts/build-netlify.mjs`
   - Publish directory: `netlify-public`
   - Functions directory: `netlify/functions`
4. In den Netlify-Projekteinstellungen eine Environment variable anlegen:
   - Name: `TICKETMASTER_API_KEY`
   - Wert: dein echter Discovery-API-Schlüssel von https://developer.ticketmaster.com/
   - Für die Functions verfügbar machen, falls Netlify nach einem Geltungsbereich fragt.
5. Den Deploy starten bzw. nach einer Änderung des Schlüssels erneut deployen.
6. Die von Netlify vergebene `https://….netlify.app/`-Adresse öffnen.

Die Anwendung findet dort das eigene Backend automatisch – auch auf einer später zugewiesenen eigenen Domain. Es muss keine Backend-Adresse in der Oberfläche eingetragen werden. Der Schlüssel wird nicht in die öffentlichen Dateien geschrieben.

## GitHub-Pages-Seite weiterverwenden

Um dieselben echten Termine auch unter `mlinner-software.de/wochenende/` anzuzeigen, die öffentliche Netlify-Funktionsadresse in `wochenende/config.js` eintragen und nach `main` übernehmen:

```js
window.RAUSZEIT_CONFIG = Object.freeze({
  eventApiUrl: 'https://DEIN-PROJEKT.netlify.app/.netlify/functions/events'
});
```

Dafür wird noch die tatsächliche Netlify-Adresse benötigt. API-Schlüssel gehören ausschließlich in die Netlify-Einstellungen. Die erlaubten Website-Ursprünge enthalten standardmäßig `https://mlinner-software.de`, `https://www.mlinner-software.de` und `https://manlin65.github.io`.

## Download und Upload

`Rauszeit-Netlify.zip` enthält ein vollständiges Quellpaket. Es kann entpackt in ein GitHub-Repository übernommen und von Netlify importiert werden. Ein einfacher statischer Drag-and-drop-Upload nach Netlify baut das Serverless-Backend nicht; deshalb für dieses Projekt den GitHub-Import verwenden.

## Was enthalten ist

- Automatische Wetteranzeige und Live-Ortssuche mit Länderflaggen.
- Bis zu fünf Orte; Kalender und beliebige Wochentage.
- Echte Ticketmaster-Termine mit passendem Wetter, sobald der Schlüssel hinterlegt ist.
- Geschützte Netlify Function mit Eingabeprüfung, Cache und verständlichen Fehlern.
- Separater Build-Ordner ohne PHP-Dateien, echte env-Dateien oder Einrichtungsdokumente.
- `/wochenende/` wird auf der Netlify-Seite auf `/` weitergeleitet.

## Lokal prüfen

```sh
node scripts/build-netlify.mjs
node --test tests/events-backend.test.cjs tests/netlify-build.test.cjs
```

Für lokale Backend-Entwicklung:

```sh
cp .env.example .env
# Echten Schlüssel nur lokal in .env eintragen.
npx netlify-cli dev
```

Die mitgelieferte `.env.example` enthält keinen echten Schlüssel. Eine echte `.env` nicht veröffentlichen. In Netlify selbst die Environment variables verwenden; dort ist kein manueller env-Dateiupload nötig.

## Noch erforderlich

Der Netlify-Account und ein echter Ticketmaster-Schlüssel sind in dieser Cloud-Sitzung nicht verbunden. Das Quellpaket ist vorbereitet und lokal geprüft; eine Veröffentlichung in deinem Netlify-Konto und der Ticketmaster-Live-Test erfolgen nach den obigen Einrichtungsschritten.

## Zusätzliche Kalender, Tanzpartys und Ü-Veranstaltungen

Rauszeit unterstützt jetzt mehrere Quellen. Der bestehende Ticketmaster-Schlüssel
bleibt unverändert. Für einen öffentlichen ICS-Kalender wird kein weiterer
API-Schlüssel benötigt. Weitere Portale sind erst nach Prüfung eines verfügbaren
Datenzugangs tatsächlich angeschlossen; sie werden nicht pauschal durchsucht.

Konfiguration und ehrlicher aktueller Anschlussstand:
[wochenende/VERANSTALTUNGSQUELLEN.md](wochenende/VERANSTALTUNGSQUELLEN.md).
Netlify installiert nun `node-ical` über `package.json` und `package-lock.json`.
