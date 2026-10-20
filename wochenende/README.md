# Rauszeit – Wohin am Wochenende?

Statische Webanwendung mit direkter API-Anbindung an Open-Meteo, ohne API-Schlüssel oder Build-Schritt. Aus dem Repository-Stamm starten:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Anwendung unter `/wochenende/` öffnen. Auf GitHub Pages funktioniert derselbe Unterpfad.

## Funktionen

- Weltweite Ortssuche mit Auswahl gleichnamiger Orte.
- Wetter für das aktuelle/nächste und das darauffolgende Wochenende. Sonntags wird der Samstag desselben Wochenendes mit angezeigt.
- Tageshöchst-/Tiefsttemperatur, Wetterlage, Regenwahrscheinlichkeit, Niederschlag und Wind.
- Regelbasierte Aktivitätsideen sowie Hinweise bei Gewitter, starkem Wind oder gefrierendem Regen. Keine KI-Anfragen und keine lokalen Angebotsdaten.
- Wettervergleich für bis zu fünf Orte weltweit: „Wetter für alle Orte laden“ zeigt Tageshöchsttemperatur und Regenrisiko je Ort und Tag. Bei gleichnamigen Orten kann der konkrete Treffer samt Land ausgewählt werden. Bereits geladene Vorhersagen werden 15 Minuten im Arbeitsspeicher wiederverwendet; keine geheimen Schlüssel erforderlich.
- Veranstaltungssuche für bis zu fünf frei eingebbare Orte; Bamberg, Nürnberg und Schwabach sind vorbelegt. Die eigene Liste wird lokal gespeichert. Ausländische Orte können ebenfalls eingegeben werden.
- Veranstaltungssuche nach Wochenende, Samstag/Sonntag und Kategorie (Musik, Kultur, Märkte, Familie, Outdoor). Suchlinks öffnen Google mit Ort und konkreten Kalenderdaten sowie bei bekannten Orten eine Suche auf der offiziellen Website. Es werden keine Veranstaltungstermine erfunden oder automatisch importiert; kein API-Schlüssel erforderlich.
- Bis zu 20 Lieblingsorte in localStorage; speichern, erneut aufrufen und entfernen.
- Klar gekennzeichnete Demo mit fiktiven Wetterdaten, auch ohne API erreichbar.
- Ladezustände, fehlende Daten, Zeitüberschreitungen, leere Suchergebnisse und API-Ausfälle werden angezeigt.

## APIs und Datenschutz

- `https://geocoding-api.open-meteo.com/v1/search`: Ortssuche; liefert Koordinaten und Ortsnamen. Open-Meteo-Geocoding basiert auf GeoNames.
- `https://api.open-meteo.com/v1/forecast`: tägliche Wetterdaten, 16 Tage Vorhersage und ein vergangener Tag, automatische Zielzeitzone.
- Veranstaltungssuchlinks übertragen den gewählten Ort, Termine und die Kategorie erst beim Öffnen an Google. Beim Laden des Wettervergleichs werden die bis zu fünf Ortsnamen und anschließend die aufgelösten Koordinaten an Open-Meteo gesendet. Die fünf Vergleichsorte sind eine separate Liste von den Wetter-Lieblingsorten.
- Suchbegriffe und Zielkoordinaten werden an Open-Meteo übertragen. Keine automatische Standortabfrage. Lieblingsorte bleiben im jeweiligen Browser.
- Die Open-Meteo-Free-API ist für nicht kommerzielle Nutzung vorgesehen. Bei kommerziellem Einsatz Lizenz und erforderlichen Tarif prüfen: https://open-meteo.com/en/terms
- Cloud-Entwicklungsumgebungen müssen beide API-Hosts zulassen. Die öffentliche Website benötigt eine Internetverbindung im Browser.

Die Empfehlungen ersetzen keine amtlichen Warnungen oder Tourenplanung. Vorhersagen können sich ändern. API-Daten können fehlen; in diesem Fall erscheinen keine erfundenen Messwerte.
