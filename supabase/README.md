# DatenCockpit auf Supabase

Die neue Anbindung arbeitet direkt über die Supabase Data API und vier eng
begrenzte PostgreSQL-Funktionen. Netlify und Azure werden dafür nicht benötigt.
Die Neon/Netlify-Anbindung bleibt im Code erhalten, bis die Supabase-Konfiguration
bewusst aktiviert wird. Das Homepage-Layout bleibt gleich.

## Im Supabase SQL-Editor ausführen

1. `migrations/202610220001_datencockpit_tables.sql` – Tabellen, Indizes,
   aktivierte Row Level Security und Entzug direkter Tabellenrechte.
2. `migrations/202610220002_datencockpit_functions.sql` – vier API-Funktionen,
   deren Ausführungsrechte explizit an anon/authenticated vergeben werden.

Beide Skripte sind transaktional und wiederholbar. Sie löschen keine bestehenden
Tabellen oder Nutzdaten. Ein fehlerhafter Import rollt vollständig zurück.
Die Statusfunktion lässt sich anschließend im Editor testen:

```sql
SELECT public.datencockpit_status();
```

## Öffentliche Website konfigurieren

In `datencockpit/config.js` wird nach Einrichtung der Funktionen aktiviert:

```js
window.DATENCOCKPIT_CONFIG = Object.freeze({
  provider: 'supabase',
  supabaseUrl: 'https://DEIN-PROJEKT.supabase.co',
  supabasePublishableKey: 'sb_publishable_DEIN_OEFFENTLICHER_KEY'
});
```

Nur Publishable-Key oder alter anon/public-Key sind erlaubt. Der Client lehnt
Secret- und service_role-Schlüssel ab. Diese dürfen niemals in Website-Dateien.
Nach der Änderung `npm run build` und `npm test` ausführen und die statischen
Dateien auf GitHub Pages veröffentlichen. `app.js` ist das Browser-Bundle.

## Zugriff und Validierung

- Tabellen sind für anon/authenticated weder lesbar noch beschreibbar.
- Schreib-/Lese-/Löschfunktionen haben einen leeren search_path und verwenden
  vollständig qualifizierte Tabellen, keine dynamischen SQL-Anweisungen.
- Import erzeugt eine zufällige Import-ID und einen kryptografisch zufälligen
  Zugriffsschlüssel. In der DB wird nur dessen SHA-256-Hash gespeichert.
- Bericht und Löschung prüfen ID, Schlüssel und Ablaufzeit. Keine öffentliche
  Importliste. Schlüssel stehen nur in JSON-Anfragekörpern, nicht in URLs.
- Die Datenbank prüft Pflichtfelder, Datumsbereich, ganze Cent-Beträge, Status,
  Größenlimits und Dubletten unabhängig von der Browserprüfung.
- Der freigegebene Demo-Import benötigt keine Benutzerregistrierung. Er ersetzt
  keine Mitarbeiteranmeldung und keinen Missbrauchsschutz für produktive Daten.
- Aufbewahrung wie bisher: Zugriff endet nach 24 Stunden; der nächste erfolgreiche
  Import entfernt abgelaufene Einträge. Kein automatischer Löschjob.

## Validierung

`npm test` führt neben den bisherigen Tests neue SQL- und Clienttests aus.
Der SQL-Test läuft auf der lokalen PostgreSQL-Engine PGlite, richtet die Rollen
anon/authenticated ein und prüft Datenbankrechte, die echte Migration, Freigaben,
SQL-Summen, fremde Schlüssel, Rollback ungültiger Importe, Ablauf und Löschung.
Das ist keine Bestätigung der Live-Supabase-Installation. Diese muss separat nach
Ausführung der Skripte und Einrichtung des öffentlichen API-Schlüssels geprüft werden.
