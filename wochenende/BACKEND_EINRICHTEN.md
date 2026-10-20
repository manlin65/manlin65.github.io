# Echte Veranstaltungstermine einschalten

**STRATO mit PHP:** Verwende [STRATO_EINRICHTEN.md](STRATO_EINRICHTEN.md). Dort laufen Website und Backend ohne Netlify auf deinem eigenen Webhosting. Die folgenden Schritte beschreiben die alternative Netlify-Variante.

Wetter und Ausflugstipps funktionieren bereits direkt im Browser. Für echte Ticketmaster-Termine braucht die Anwendung zusätzlich das mitgelieferte Backend. Es schützt deinen API-Schlüssel. Eine .env-Datei auf GitHub Pages würde keinen Server bereitstellen und könnte Geheimnisse veröffentlichen.

## 1. Ticketmaster-Schlüssel erhalten

Registriere dich unter https://developer.ticketmaster.com/ und erstelle einen Schlüssel für die Discovery API. Trage den Schlüssel nicht in GitHub, config.js oder den Chat ein.

## 2. Repository mit Netlify verbinden

1. Bei https://app.netlify.com/ anmelden.
2. Ein neues Projekt aus dem vorhandenen GitHub-Repository `manlin65/manlin65.github.io` importieren, Branch `main`.
3. Die Datei `netlify.toml` übernimmt die Einstellungen: Build command `node scripts/build-netlify.mjs`, Publish directory `netlify-public`, Functions directory `netlify/functions`. Das Base directory bleibt leer.
4. In den Netlify-Projekteinstellungen unter Environment variables die Variable `TICKETMASTER_API_KEY` anlegen und dort den echten Schlüssel sicher eintragen. Die Variable muss für Functions verfügbar sein.
5. Optional `RAUSZEIT_ALLOWED_ORIGINS` ergänzen. Vorgabe: `https://www.mlinner-software.de,https://mlinner-software.de,https://manlin65.github.io`. Weitere Website-Adressen mit Komma trennen. Für einen lokalen Test zusätzlich `http://localhost:8888` eintragen.
6. Anschließend neu deployen und warten, bis die Bereitstellung abgeschlossen ist.

Die Netlify-Adresse sieht beispielsweise so aus: `https://dein-projekt.netlify.app`. Diese Adresse ist öffentlich und enthält kein Geheimnis.

## 3. Anwendung öffnen oder GitHub Pages verbinden

- **Direkt auf Netlify:** Die Anwendung auf `https://dein-projekt.netlify.app/` öffnen. Der Netlify-Build verbindet die Anwendung automatisch mit dem Backend auf derselben Website, auch bei einer eigenen Domain.
- **Bestehende GitHub-Pages-Website:** Unter „Veranstaltungssuche verbinden“ die Netlify-Adresse eintragen. Das aktiviert die Anbindung für diesen Browser.
- **Für alle Besucher deiner GitHub-Pages-Website:** In `wochenende/config.js` den öffentlichen Wert `eventApiUrl` auf deine Netlify-Adresse setzen und die Datei nach `main` übernehmen. Dort niemals den Ticketmaster-Schlüssel eintragen.

Beispiel für config.js:

```js
window.RAUSZEIT_CONFIG = Object.freeze({
  eventApiUrl: 'https://dein-projekt.netlify.app/.netlify/functions/events'
});
```

## Was danach angezeigt wird

- Echte Veranstaltungstitel, Datum, Uhrzeit, Veranstaltungsort und Ticket-Link.
- Bis zu zwölf Treffer, chronologisch sortiert, aus maximal fünf Suchorten.
- Ein Suchradius von 20 km um jeden gewählten Ort; doppelte Treffer erscheinen nur einmal.
- Wetter des gewählten Zielorts passend zum Veranstaltungstag, falls eine Vorhersage verfügbar ist.
- Abgesagte Veranstaltungen werden entfernt. Verschobene Termine und unklarer Ticketstatus werden gekennzeichnet.
- Auswahl nach Kalenderzeitraum und beliebigen Wochentagen; maximal 31 Kalendertage pro Suche.
- Ticketmaster erfasst nicht jeden Ort und nicht jede Veranstaltung. Für Märkte und Stadtfeste bleiben die lokalen Kalenderlinks wichtig. Ohne Treffer werden keine Termine erfunden.
- Es werden höchstens die ersten 100 Ticketmaster-Treffer pro Suchort/Zeitraum verarbeitet. Bei mehr Treffern erscheint ein Hinweis zur Eingrenzung.

## Lokal entwickeln

Node.js 20 oder neuer und Netlify CLI verwenden. Im Repository-Stamm:

```sh
cp .env.example .env
# Danach den Schlüssel lokal in .env eintragen.
npx netlify-cli dev
```

Den vom CLI gemeldeten lokalen Port verwenden (üblicherweise 8888). Die .env-Datei wird durch .gitignore vom Commit ausgeschlossen. Keine echte .env hochladen oder per ZIP weitergeben. Der Netlify-Publish-Ordner ist ausschließlich der erzeugte Ordner `netlify-public`, nicht der Repository-Stamm.

## Bereits geprüft / noch erforderlich

- Backend-Verarbeitung, Schlüsselschutz in Antworten, Eingabeprüfung, Fehlerfälle und Browserdarstellung sind mit kontrollierten API-Antworten getestet.
- Das Wetter wurde zuvor mit echten Open-Meteo-Antworten geprüft.
- Ein echter Ticketmaster-Live-Test ist erst nach Hinterlegen eines gültigen Schlüssels und Veröffentlichung des Backends möglich. Das Backend wurde aus dieser Cloud-Sitzung noch nicht auf Netlify veröffentlicht.
