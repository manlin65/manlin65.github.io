# Qualifikations- und Zertifikatsmanager

Interaktiver Prototyp mit 15 fiktiven Nachweisen für zehn Personen.

## Start

- Den Ordner vollständig entpacken und `index.html` in einem aktuellen Browser öffnen. HTML, CSS und JavaScript liegen im selben Ordner. Die Demo benötigt keine Installation und keinen Build.
- Für statisches Hosting den gesamten Ordner in das Veröffentlichungsverzeichnis kopieren. Auf GitHub Pages kann der Ordner beispielsweise als `/zertifikatsmanager/` eingebunden werden. Alle Asset-Pfade sind relativ.
- Falls der Browser beim direkten Datei-Aufruf die Speicherung blockiert, im Projektordner `python -m http.server 8000` ausführen und `http://localhost:8000/` öffnen.

## Bedienung

- Das Dashboard zählt alle Nachweise und teilt sie in drei Gruppen auf. „Gültig“ umfasst die unbefristeten und die länger als 90 Tage gültigen Nachweise. „Ablauf innerhalb von 90 Tagen“ schließt den heutigen Tag und den 90. Tag ein. Ab dem Folgetag des Ablaufdatums ist der Nachweis abgelaufen.
- In der Tabelle nach Person oder Zertifikat suchen und nach Status filtern. Mit „Nachweis hinzufügen“ einen Eintrag anlegen. Stift und Papierkorb öffnen die Bearbeitung oder die Löschbestätigung. Das Ablaufdatum ist optional.
- „Demodaten zurücksetzen“ ersetzt nach Bestätigung die aktuellen Einträge durch neue Beispieldaten mit relativen Datumswerten.

## Lokale Speicherung

Die Einträge bleiben per `localStorage` beim Neuladen im selben Browserprofil und unter derselben Webadresse erhalten. Andere Browserprofile oder Adressen haben ihren eigenen Datenbestand. Werden die Website-Daten gelöscht, startet die Demo wieder mit den Beispieldaten. Ist der Speicher gesperrt, meldet die Demo dies und hält Änderungen bis zum Neuladen im Arbeitsspeicher.
