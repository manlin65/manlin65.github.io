# Rauszeit auf STRATO mit PHP-Backend

Du kannst die komplette Anwendung mit dem Ticketmaster-Backend auf STRATO betreiben. Benötigt werden **Webhosting mit PHP 8 oder neuer und aktivem cURL**. Eine bei STRATO registrierte Domain allein reicht dafür nicht. Node.js und Netlify sind für diese Variante nicht nötig.

## 1. Öffentliche Dateien hochladen

Den Ordner `wochenende` mit allen enthaltenen Dateien per SFTP in den öffentlichen Webordner deines STRATO-Pakets hochladen. Dieser heißt häufig `htdocs`; entscheidend ist der für deine Domain eingestellte Dokumentenstamm (DocumentRoot).

Beispiel:

```
<dein STRATO-Verzeichnis>/
├── rauszeit.env                 <- privat, außerhalb des Webordners
└── htdocs/                      <- öffentlicher DocumentRoot
    └── wochenende/
        ├── index.html
        ├── app.js
        ├── events.js
        ├── tickets.js
        ├── config.js
        ├── styles.css
        ├── .htaccess
        └── api/
            └── events.php       <- das PHP-Backend
```

Das Backend sucht die Datei `rauszeit.env` genau **eine Ebene oberhalb des tatsächlichen DocumentRoot deiner Domain**, nicht einfach eine Ebene über `events.php`. Bei abweichend eingerichtetem Domain-Verzeichnis entsprechend anpassen. Wenn du keinen Zugriff auf dieses private Verzeichnis hast, dort zunächst nichts veröffentlichen und den Speicherort mit dem Hosting-Support klären.

## 2. Privaten Schlüssel eintragen

Aus `rauszeit.env.example` eine echte Datei **rauszeit.env** erstellen. In diese Datei eintragen:

```dotenv
TICKETMASTER_API_KEY=dein_echter_schluessel
RAUSZEIT_ALLOWED_ORIGINS=https://www.mlinner-software.de,https://manlin65.github.io
```

Die Datei wie im Beispiel außerhalb des öffentlichen Webordners ablegen. Wenn du eine andere Website-Adresse verwendest, diese bei `RAUSZEIT_ALLOWED_ORIGINS` ergänzen. Es sind die Ursprungsadressen ohne Unterpfad gemeint.

Der Dateiname `.env` ist keine technische Pflicht. Hier heißt die private Datei bewusst `rauszeit.env`, damit sie eindeutig diesem Backend zugeordnet ist. Eine echte Datei niemals in GitHub committen, per Download verteilen oder in den Chat kopieren. Die mitgelieferte `.htaccess` sperrt versehentlich im App-Ordner abgelegte env-Dateien zusätzlich; sie ersetzt den privaten Ablageort nicht.

## 3. Öffentliche Backend-Adresse konfigurieren

In `wochenende/config.js` die URL zu deinem hochgeladenen PHP-Backend eintragen:

```js
window.RAUSZEIT_CONFIG = Object.freeze({
  eventApiUrl: 'https://deine-domain.de/wochenende/api/events.php'
});
```

Hier steht **nur die öffentliche URL**, niemals der Schlüssel. Nach dem Hochladen verwendet jeder Besucher diese Anbindung. Alternativ kann die URL zunächst zum Testen in der Oberfläche unter „Veranstaltungssuche verbinden“ eingetragen werden; das gilt dann nur für diesen Browser.

## 4. Testen

1. `https://deine-domain.de/wochenende/` öffnen.
2. „WE · Fr–So“ oder einen anderen Zeitraum wählen.
3. Wetter und echte Ticketmaster-Ergebnisse erscheinen direkt im entsprechenden Bereich. Gibt es keine passenden Termine, wird das ausdrücklich angezeigt.
4. Bei der Meldung „Ticketmaster ist noch nicht eingerichtet“ den privaten Dateinamen und den DocumentRoot kontrollieren.
5. Bei „cURL aktivieren“ die PHP-Einstellungen im Hosting-Paket prüfen.
6. Bei einem nicht akzeptierten Schlüssel den Discovery-API-Schlüssel im privaten env überprüfen. Bei HTTP 403 den erlaubten Website-Ursprung prüfen.

Der PHP-Endpunkt ist kein Besucherformular: Ohne gültige Suchparameter antwortet er mit einem verständlichen HTTP-400-Fehler. Er gibt den Schlüssel niemals zurück.

## GitHub Pages weiterverwenden

Du kannst die Oberfläche auch auf GitHub Pages belassen und nur das PHP-Backend auf STRATO betreiben. Dann in der GitHub-Version von `wochenende/config.js` die vollständige STRATO-Backend-URL setzen. Die Domain/Subdomain des Backends muss tatsächlich auf das PHP-Webhosting zeigen. Wenn `www.mlinner-software.de` weiter auf GitHub Pages zeigt, benötigt das STRATO-Backend eine andere Adresse, z. B. eine entsprechend eingerichtete Subdomain.

## Prüfumfang

PHP-Eingabeprüfung, private env-Datei, Normalisierung, Fehlerfälle und Schlüsselschutz wurden lokal geprüft. Eine Veröffentlichung auf deinem STRATO-Konto und ein Live-Test mit deinem Ticketmaster-Schlüssel stehen noch aus; die Hosting-Zugangsdaten und der Schlüssel sind dieser Sitzung nicht bekannt.
