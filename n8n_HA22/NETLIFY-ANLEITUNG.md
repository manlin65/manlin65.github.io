# WorkflowPilot über Netlify testen lassen

Die GitHub-Pages-Seite bleibt bestehen. Netlify veröffentlicht zusätzlich eine eigene Testversion unter einer Adresse wie `https://dein-name.netlify.app`. Dort wird der Token serverseitig verwahrt; Tester müssen keinen Token kennen.

## Einmalige Einrichtung

1. Bei Netlify mit GitHub anmelden und **Add new project → Import an existing project** wählen.
2. Das Repository `manlin65/manlin65.github.io` auswählen.
3. Als **Base directory** `n8n_HA22` eintragen. Build command leer lassen. Die Datei `netlify.toml` setzt Publish-Verzeichnis und Functions-Verzeichnis.
4. Ersten Deploy starten und die erzeugte `*.netlify.app`-Adresse notieren.
5. In **Project configuration → Environment variables** die Variable `N8N_WEBHOOK_TOKEN` anlegen. Als Wert den **Value** aus der n8n-Header-Auth-Credential eintragen. Den Wert nicht in GitHub oder hier im Chat speichern.
6. Falls Netlify nach einem Scope fragt, **Functions** einschließen. Danach einen neuen Deploy auslösen, damit die Function das Secret erhält.
7. Die `*.netlify.app`-Adresse an die Tester geben. Sie können dann die Beispieldaten laden und analysieren, ohne den n8n-Token zu sehen.

## Hinweise

- Die Seite auf GitHub Pages bleibt im persönlichen Modus mit Tokenfeld. Die separate Netlify-Adresse verwendet die Function unter `/.netlify/functions/analyze`.
- Der Proxy erlaubt nur die Netlify-Site-Herkunft und begrenzt Eingaben; er speichert keine Stellenanzeige oder kein Kurzprofil.
- Die Function wartet höchstens 55 Sekunden auf n8n. Ein bisheriger Workflow-Lauf dauerte rund 43 Sekunden.
- Netlify Free hat ein monatliches Nutzungslimit; bei Überschreitung pausiert das Projekt. n8n-Ausführungen und Gemini-Nutzung haben eigene Limits.
- Für öffentliche Tests Beispieldaten oder andere nicht sensible Angaben verwenden.
