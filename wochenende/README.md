# Rauszeit – Wohin am Wochenende?

Webanwendung für bis zu fünf Ausflugsorte mit Wetter, Kalenderauswahl und Veranstaltungssuche. Die vorhandene Website verlinkt auf `/wochenende/`.

## Was ohne Anmeldung funktioniert

- Weltweite Ortssuche mit Auswahl gleichnamiger Orte und Länder.
- Automatischer Wettervergleich für bis zu fünf Orte mit Temperatur, Regenrisiko, Wetterlage und Wind.
- Wetterbasierte Top-Ausflugsziele mit allgemeinen Aktivitätsideen, klar getrennt von Veranstaltungsterminen.
- Kalender: eigene Von-/Bis-Daten, einzelne Wochentage und Schnellwahl WE (Fr–So), Fr, Sa, So, Mo–Do, ganze Woche oder nächste sieben Tage.
- Wetterdaten nur im verfügbaren Vorhersagebereich (bis zu 16 Tage, plus ein vergangener Tag). Für andere Termine wird fehlende Vorhersage offen angezeigt.
- Bis zu 20 Wetter-Lieblingsorte und eine separate Liste mit bis zu fünf Vergleichsorten, jeweils nur im Browser gespeichert.
- Externe Veranstaltungssuchen und lokale Kalenderlinks nach Ort, Zeitraum und Kategorie.
- Gekennzeichnete Wetterdemo, Ladezustände und Fehlerbehandlung.

## Echte Veranstaltungen direkt auf der Seite

Die Ticketmaster Discovery API wird über das mitgelieferte PHP-Backend auf STRATO oder alternativ über eine Netlify Function angesprochen. Der Schlüssel `TICKETMASTER_API_KEY` bleibt beim Hosting-Anbieter. Das Frontend bekommt ausschließlich Veranstaltungsdaten, niemals den Schlüssel. Der Wetterteil benötigt keinen Schlüssel.

Für STRATO steht die Einrichtung in [STRATO_EINRICHTEN.md](STRATO_EINRICHTEN.md), für Netlify in [BACKEND_EINRICHTEN.md](BACKEND_EINRICHTEN.md). Enthalten sind `wochenende/api/events.php`, `rauszeit.env.example`, `netlify.toml`, `netlify/functions/events.js`, `.env.example` und eine `.gitignore` für echte .env-Dateien.

Das Backend ist vorbereitet, aber muss vom Betreiber noch mit einem eigenen Schlüssel auf deinem PHP-Webhosting oder auf Netlify veröffentlicht werden. Ohne Backend bleibt die echte Veranstaltungsliste mit einem verständlichen Einrichtungshinweis leer; Wetter und externe Kalenderlinks funktionieren weiter.

## Lokal starten

Nur statische Oberfläche, ohne Ticketmaster-Backend:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Im Browser den Unterpfad `/wochenende/` öffnen. Für das Backend siehe die Einrichtungsanleitung.

## Prüfungen

```sh
node --test tests/events-backend.test.cjs
php -l wochenende/api/events.php
php tests/events-php.test.php
```

Der Backend-Test prüft fehlende/ungültige Schlüssel, Koordinaten und Daten, CORS, Abfragelimits, Normalisierung, abgesagte Termine, URLs und Cache-Verhalten. Er benötigt keinen echten Schlüssel.

`tests/rauszeit-browser.py` prüft die Oberfläche mit kontrollierten API-Antworten. Dafür die statische Website wie oben starten, Python Playwright und Chromium bereitstellen, dann `python3 tests/rauszeit-browser.py` ausführen. Optional sind `RAUSZEIT_BASE_URL` und `CHROMIUM_PATH` konfigurierbar. Die Testdaten sind ausdrücklich keine echten Veranstaltungstermine.

## Datenquellen und Datenschutz

- Open-Meteo Geocoding (`geocoding-api.open-meteo.com`): Ortsnamen und Koordinaten; Ortsdaten basieren auf GeoNames.
- Open-Meteo Forecast (`api.open-meteo.com`): Wetterdaten. Suchbegriffe und Koordinaten werden zur Abfrage übertragen. Keine automatische Standortfreigabe.
- Ticketmaster (`app.ticketmaster.com`): echte Termine über das eingerichtete Backend. Bis zu fünf Zielkoordinaten, Kategorie und Zeitraum werden an das konfigurierte Backend und den Anbieter übertragen.
- Google-Suchlinks übertragen Ort, Kategorie und Kalenderdaten erst beim Öffnen. Die Backend-Adresse ist öffentlich und wird optional lokal gespeichert; der API-Schlüssel gehört ausschließlich in die Hosting-Einstellungen.
- Die Open-Meteo-Free-API ist für nicht kommerzielle Nutzung vorgesehen. Vor kommerziellem Einsatz die Bedingungen und den passenden Tarif prüfen: https://open-meteo.com/en/terms

Die Ausflugsideen ersetzen keine Tourenplanung oder amtlichen Warnungen. Vorhersagen, Termine und Ticketverfügbarkeit können sich ändern.
