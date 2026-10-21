# Neue PDF direkt in der Website auswerten

Die Website enthält eine echte Upload-/Ergebnisoberfläche. Sie bleibt bis zur Einrichtung des Endpunkts deaktiviert. Die lokale Prüfung verwendet eine simulierte API-Antwort; ein echter Gemini-Aufruf aus der Website wurde noch nicht ausgeführt.

1. `../workflows/ki-lernassistent-web-analyse.json` herunterladen und in n8n als **neuen** Workflow importieren. Der bisherige Workflow bleibt bestehen.
2. Im Gemini-Knoten eigene vorhandene Zugangsdaten auswählen und ein verfügbares Textmodell wählen. Die Vorlage übernimmt den Modellnamen des Exports; dessen Verfügbarkeit prüfen.
3. Veröffentlichen. Der POST-Webhook heißt `ki-lernassistent-analyse`. Die Produktions-URL aus dem Webhook-Knoten kopieren.
4. Diese URL in `N8N/workflow-config.json` unter `analysisWebhookUrl` hinterlegen und veröffentlichen. Keine Zugangsdaten eintragen.
5. Auf der Website eine neue textlesbare künstliche PDF wählen, Übertragung bestätigen und „PDF analysieren“ drücken. Ergebnis muss aus dieser PDF stammen. Anschließend ein zweites Dokument mit anderem Inhalt testen.

Der Webhook empfängt multipart/form-data im Binärfeld `pdf`, extrahiert Text, stoppt bei leerem Text oder über 60.000 Textzeichen, ruft Gemini auf, prüft JSON und Zitate und antwortet mit JSON. CORS ist für diesen anonymen, credentiallosen Testendpunkt freigegeben; CORS ist keine Zugriffskontrolle. Der Browser begrenzt Dateien auf 10 MB; das ersetzt kein serverseitiges Uploadlimit. Der öffentliche Endpunkt kann ohne Website aufgerufen werden und verbraucht Gemini-Kontingent. Nutzungsgrenzen müssen für breiten Betrieb serverseitig eingerichtet werden.

Kein Wait-Knoten und kein automatisches Drive-Schreiben: Jeder Browser erhält seine eigene Antwort und kann sie prüfen, bearbeiten und lokal herunterladen. Die Downloadbestätigung ist eine lokale Benutzeraktion, keine serverseitige Freigabe. Der bisherige Drive-Workflow bleibt davon getrennt.

Bei 503 später erneut versuchen; nach Browser-Zeitlimit zuerst n8n prüfen, die Serververarbeitung kann weiterlaufen. Browser können große/langsame synchrone Antworten durch Infrastruktur-Zeitlimits verlieren. OCR und ein Chat mit freien Rückfragen sind nicht enthalten.
