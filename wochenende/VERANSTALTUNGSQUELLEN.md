# Zusätzliche Veranstaltungsquellen auf Netlify

Rauszeit führt Ticketmaster, öffentliche iCalendar-Feeds (.ics) und einzeln
hinterlegte Termine zusammen. Die Interessen- und Altersfilter laufen im Browser.
Die Ortsauswahl ist weltweit möglich; zusätzliche Quellen sind nicht auf Franken
beschränkt. Treffer außerhalb von 20 km oder der ausgewählten Tage werden entfernt.
Ohne genaue Veranstaltungskoordinaten wird die konfigurierte Ortsmitte verwendet.

## Stand der tatsächlich angeschlossenen Quellen

- Ticketmaster: bestehender Netlify-Schlüssel `TICKETMASTER_API_KEY`.
- Einzeln hinterlegte Termine: ein Termin aus dem vom Betreiber bereitgestellten
  Facebook-Screenshot („Einfach Disco auf Vinyl“, Babylon Fürth, 14.11.2026,
  20:00 Uhr bis 15.11., 02:00 Uhr). Kennzeichnung ausdrücklich manuell; kein
  automatischer Facebook-Abgleich. Keine Altersangabe erfinden: Der Screenshot
  belegt keine Ü60-Veranstaltung.
- Zusätzliche Live-Kalender: noch keine. Die Liste ist bewusst leer, bis echte,
  öffentlich nutzbare Feed-Adressen geprüft wurden. Kein automatisches Auslesen
  von Facebook, meinestadt.de oder Rausgegangen ohne deren passenden Datenzugang.

Der Quellstatus wird bei jeder Suche angezeigt. Ein ausgefallener Anbieter
entfernt die Termine der übrigen Quellen nicht. Bei identischem Titel, Datum,
Uhrzeit, Veranstaltungsort und Stadt werden Quellenangaben zusammengeführt.
Termine an unterschiedlichen Uhrzeiten oder Orten bleiben getrennt.

## Einen öffentlichen Kalender anschließen

1. Beim Veranstalter oder Portal nach „iCal“, „ICS“, „Kalender abonnieren“ oder
   einem freigegebenen Kalenderfeed suchen. Eine normale Facebook- oder
   Veranstaltungs-Webseite ist kein Feed. Nutzungsbedingungen der Quelle beachten.
2. Einen Eintrag gemäß `netlify/calendar-sources.example.json` in
   `netlify/calendar-sources.json` ergänzen. Die Beispieladresse ist absichtlich
   ungültig und wird nicht geladen. Pflichtfelder sind `id`, `name`, `url`, `city`,
   `latitude`, `longitude`. `timezone` sollte die örtliche IANA-Zeitzone enthalten.
   Die Koordinaten müssen zum Ort bzw. Veranstaltungsort des Kalenders passen.
   Kalender mit mehreren Städten benötigen GEO-Angaben pro Veranstaltung.
3. Auf `main` speichern; Netlify stellt den Stand automatisch bereit.
4. Passende Stadt und Datum wählen. „Veranstaltungsquellen“ muss den Kalender als
   „automatisch abgefragt“ anzeigen. Eine leere, erfolgreich geladene Quelle
   liefert für diese Auswahl schlicht keine Termine.

Es werden bis zu acht Feeds unterstützt. Nur öffentliche HTTPS-Adressen, keine
IP-Adressen, Zugangsdaten oder Weiterleitungen. Feed-Adressen mit privaten Tokens
gehören nicht ins öffentliche Repository. Private Kalender sind nicht vorgesehen.
Feeds werden 15 Minuten zwischengespeichert, sind auf 1 MiB begrenzt und werden
nach sieben Sekunden abgebrochen. Die Darstellung berücksichtigt maximal 300
Instanzen pro Feed und Zeitraum; außergewöhnlich häufige Serien (stündlich oder
häufiger) werden mit Hinweis übersprungen. Serientermine, EXDATE, Terminänderungen
und Zeitumstellungen verarbeitet `node-ical` in der festgeschriebenen Version.

## Manuell erfasste Veranstaltungen

`netlify/local-events.json` enthält einzelne, datierte Termine, keine erfundenen
Wiederholungen. Für eine neue Auflage Datum und Quelle beim Veranstalter prüfen.
Alte Termine werden nicht automatisch auf das nächste Jahr übertragen. Für neue
Orte die zugehörigen Koordinaten, Stadt und Zeitzone eintragen. Bei Koordinaten
der Ortsmitte `locationApproximate: true` setzen.

„Ü60“ bedeutet beim Filter: Die Quelle nennt ausdrücklich Ü60, 60+, über/ab 60.
Eine Ü30-Party wird nicht automatisch als Ü60-Termin ausgegeben. Oldies ist ein
separates Interesse und keine Altersfreigabe.

## Entwicklung

Node.js 22 oder neuer. `npm ci` installiert die per Lockdatei festgelegten Pakete.
`npm test` prüft Backend, Kalender, Zusammenführung, Filter und statischen Build.
`npm run build` erzeugt ausschließlich das öffentliche Frontend. Die Backend-
Dateien und Quelldefinitionen verbleiben außerhalb von `netlify-public`.
Die PHP-Alternative bleibt Ticketmaster-only; mehrere Quellen sind hier in der
Netlify-Funktion implementiert.

Die zusätzliche Recherche der Portal- und Veranstalterseiten war in der
Codex-Umgebung durch die Netzwerkfreigabe blockiert. Die dafür benötigten Domains
wurden im Cloud-Konfigurationsentwurf ergänzt; dieser muss angewendet werden,
bevor die Live-Recherche und Auswahl realer Feeds fortgesetzt werden kann.

## Weihnachtsmärkte

Eigenes Interesse für Weihnachts-, Christkindles- und Adventsmärkte. Echte Termine
werden wie alle anderen Daten nach Ort und ausgewählten Tagen gefiltert. Ein
Weihnachtskonzert wird durch diesen Filter nicht zum Weihnachtsmarkt. Falls keine
Kalenderquelle solche Termine liefert, bleibt die Anzeige leer und es erscheint
eine datums- und ortsbezogene externe Suche; es werden keine Saisontermine geraten.

## Unabhängige Weihnachtsmarkt-Umkreissuche

Unten auf der Seite gibt es eine eigene Ortseingabe sowie optional die Freigabe
des aktuellen Gerätestandorts. Dieser Bereich benötigt weder die Datumsauswahl
oben noch Wetterdaten. Die Ortsauflösung verwendet Open-Meteo, die Marktstandorte
stammen aus der öffentlichen OpenStreetMap-Overpass-API (`overpass-api.de`).
Es ist kein zusätzlicher API-Schlüssel nötig. Der Suchradius beträgt fest 100 km
Luftlinie; Ergebnisse werden nach Entfernung sortiert. Abfragen werden 15 Minuten
zwischengespeichert. Angezeigte Kurzbeschreibungen stammen aus den Kartendaten;
fehlen sie, erscheint ein ausdrücklicher Hinweis. Es werden keine Angebote oder
Saisontermine erfunden. Ein Standorteintrag bestätigt keine aktuelle Öffnung und
kein Datum für die Saison. OpenStreetMap-Abdeckung kann unvollständig sein.

Die Standorte sind eine eigenständige Datenquelle und werden nicht als bestätigte
Veranstaltungstermine in den Top-Ereignissen ausgegeben. Der Markt-Bereich ist
von den noch nicht angeschlossenen zusätzlichen Veranstaltungsfeeds unabhängig.
