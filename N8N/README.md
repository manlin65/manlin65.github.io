# KI-Lernassistent – Klassenprojekt

Öffentliche Anwendung: https://www.mlinner-software.de/N8N/

How-to für die Klasse: https://www.mlinner-software.de/N8N/howTo/

Die Website sendet eine neue textlesbare PDF als multipart/form-data (`pdf`) an den n8n-Webhook aus `workflow-config.json`. n8n extrahiert Text, ruft Gemini auf, prüft JSON und Quellenzitate und antwortet mit Zusammenfassung, Glossar und Quizfragen. Der Browser zeigt die eigene Antwort, erlaubt Bearbeitung und nach persönlicher Prüfbestätigung einen lokalen JSON-Download. Der Demobereich wurde entfernt.

Frontend: GitHub Pages und Browser. Backend: n8n Cloud. Externer KI-Dienst: Google Gemini. API-Schlüssel ausschließlich in n8n-Credentials. Der neue Webworkflow schreibt nichts nach Drive. Der ältere, separat getestete Formularworkflow aktualisiert nach menschlicher Freigabe eine Drive-Datei.

## Dateien

- `index.html`, `app.css`, `app.js`: Anwendung einschließlich Quiz und Ergebniskontrolle.
- `workflow-config.json`: öffentliche Endpunktadressen, keine Secrets.
- `workflow.js`: optionaler Link zum älteren Formular.
- `workflows/ki-lernassistent-web-analyse.json`: neue Importvorlage ohne Credentials.
- `howTo/index.html`: Anleitung und Erklärung für die Klasse.
- `howTo/KI-Lernassistent-HowTo.pdf`: neunseitige Anleitung, Backend-Erklärung, Zugänge, Kontakt und Workflow-Skizze.
- `howTo/build_pdf.py`: PDF-Erzeugung mit ReportLab und fontTools; lokale Schriften aus assets/fonts, Logos aus dem bereitgestellten Markenpaket.

## Prüfen

Repository-Stamm lokal auf Port 8893 ausliefern. `tests/web-analysis.py` prüft die neue Browserstrecke mit simulierter API-Antwort. Die Cloud-Integration muss zusätzlich über die öffentliche Website mit zwei unterschiedlichen künstlichen PDFs geprüft werden. Die direkte Cloud-Testanfrage aus der Arbeitsumgebung wurde vom Netzwerkproxy blockiert; ein erfolgreicher echter Weblauf wird daher nicht behauptet.

Der Browser prüft maximal 10 MB; der Workflow maximal 60.000 extrahierte Textzeichen. Bild-PDFs benötigen zusätzliche OCR. CORS und die Browser-Zustimmung sind keine serverseitigen Nutzungsgrenzen. Für breiten Betrieb Uploadlimits und Ratenbegrenzung serverseitig ergänzen. Nach Browser-Zeitlimit kann n8n weiterarbeiten.

Alle Änderungen bleiben im Ordner N8N; Hauptseite und Hauptnavigation werden nicht verändert.
