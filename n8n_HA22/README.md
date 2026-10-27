# WorkflowPilot – n8n HA 22

Öffne diese Seite:
https://www.mlinner-software.de/n8n_HA22/

## Funktionen
- Stellenanzeige und Kurzprofil eingeben und mit dem veröffentlichten n8n-Workflow analysieren
- Beispieldaten per Button direkt ins Formular laden
- Ergebnisse, Anforderungen, Lücken, Rückfragen und Bewerbungstext anzeigen
- To-do-Liste hinzufügen, abhaken und löschen

Die Beispieldateien liegen unter beispiele/. Die To-dos werden lokal im Browser gespeichert.

## Token und CORS
Das Header-Auth-Token ist nicht im Quelltext hinterlegt. Es wird im Formular eingegeben, nur für die Anfrage verwendet und anschließend aus dem Formular gelöscht. Für eine öffentliche Nutzung ist ein serverseitiger Endpunkt erforderlich, der das Geheimnis schützt.

Wenn der Browser die Anfrage mit CORS blockiert, muss im n8n-Webhook die erlaubte Herkunft passend gesetzt werden.
