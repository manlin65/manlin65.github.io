#!/usr/bin/env python3
"""Generate the public How-to PDF, vector architecture graphic and example bundle."""
from pathlib import Path
from io import BytesIO
from zipfile import ZipFile,ZIP_DEFLATED
from xml.sax.saxutils import escape
from reportlab.pdfgen import canvas
from reportlab.platypus import SimpleDocTemplate,Paragraph,Spacer,Table,TableStyle,PageBreak,KeepTogether,Flowable
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet,ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.graphics.shapes import Drawing,Rect,String,Line,Polygon
from reportlab.graphics import renderSVG
from pypdf import PdfReader,PdfWriter

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'datencockpit/downloads';OUT.mkdir(parents=True,exist_ok=True)
ASSETS=ROOT/'datencockpit/assets';ASSETS.mkdir(parents=True,exist_ok=True)
PDF=OUT/'DatenCockpit-Howto.pdf'
ZIP=OUT/'DatenCockpit-Anleitung-und-Beispiele.zip'
for name,file in [('Body','DejaVuSans.ttf'),('Bold','DejaVuSans-Bold.ttf'),('Mono','DejaVuSansMono.ttf')]:
 pdfmetrics.registerFont(TTFont(name,'/usr/share/fonts/truetype/dejavu/'+file))
pdfmetrics.registerFontFamily('Body',normal='Body',bold='Bold',italic='Body',boldItalic='Bold')
NAVY=colors.HexColor('#0e4759');PETROL=colors.HexColor('#155e75');INK=colors.HexColor('#17202a');MUTED=colors.HexColor('#64748b');LINE=colors.HexColor('#dce4ec');SOFT=colors.HexColor('#eef3f8')
styles={
 'body':ParagraphStyle('Body',fontName='Body',fontSize=9.2,leading=14,textColor=INK,spaceAfter=9),
 'small':ParagraphStyle('Small',fontName='Body',fontSize=8,leading=11.6,textColor=MUTED,spaceAfter=7),
 'title':ParagraphStyle('Title',fontName='Bold',fontSize=31,leading=37,textColor=NAVY,spaceAfter=18),
 'h1':ParagraphStyle('H1',fontName='Bold',fontSize=22,leading=28,textColor=NAVY,spaceAfter=17),
 'h2':ParagraphStyle('H2',fontName='Bold',fontSize=12,leading=17,textColor=PETROL,spaceBefore=10,spaceAfter=8),
 'code':ParagraphStyle('Code',fontName='Mono',fontSize=7.7,leading=12,textColor=NAVY,backColor=SOFT,borderPadding=10,spaceBefore=6,spaceAfter=12),
 'cell':ParagraphStyle('Cell',fontName='Body',fontSize=8,leading=11.6,textColor=INK,spaceAfter=0),
 'head':ParagraphStyle('Head',fontName='Bold',fontSize=8,leading=11,textColor=NAVY,spaceAfter=0),
 'eyebrow':ParagraphStyle('Eyebrow',fontName='Bold',fontSize=8.5,leading=13,textColor=PETROL,spaceAfter=12),
}
PAGE_W,PAGE_H=595.28,841.89;WIDTH=PAGE_W-88
story=[]
def p(text,style='body'):return Paragraph(text,styles[style])
def add(text,style='body'):story.append(p(text,style))
def h(text):add(text,'h2')
def code(text):add(escape(text).replace(' ','&nbsp;').replace('\n','<br/>'),'code')
def bullet(text):story.append(Paragraph('• '+text,styles['body']))
def table(headers,rows,widths):
 data=[[p(escape(str(v)),'head') for v in headers]]+[[p(escape(str(v)).replace('\n','<br/>'),'cell') for v in row] for row in rows]
 t=Table(data,colWidths=widths,repeatRows=1,hAlign='LEFT');t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),SOFT),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),9),('RIGHTPADDING',(0,0),(-1,-1),9),('TOPPADDING',(0,0),(-1,-1),8),('BOTTOMPADDING',(0,0),(-1,-1),8),('LINEBELOW',(0,0),(-1,0),.6,LINE),('LINEBELOW',(0,1),(-1,-1),.35,LINE)]));story.extend([t,Spacer(1,10)])
def page(number,title):
 if story:story.append(PageBreak())
 add(f'HOW-TO  /  {number:02d}','eyebrow');add(title,'h1')
def link(label,url):return f'<link href="{escape(url)}" color="#155e75"><u>{escape(label)}</u></link>'

def architecture():
 d=Drawing(WIDTH,398)
 def box(x,y,w,h,title,lines,fill=colors.white):
  d.add(Rect(x,y,w,h,rx=9,ry=9,fillColor=fill,strokeColor=LINE,strokeWidth=1))
  d.add(String(x+14,y+h-24,title,fontName='Bold',fontSize=11,fillColor=NAVY))
  for i,line in enumerate(lines):d.add(String(x+14,y+h-43-i*15,line,fontName='Body',fontSize=8.3,fillColor=INK))
 def arrow(x1,y1,x2,y2,label):
  d.add(Line(x1,y1,x2,y2,strokeColor=PETROL,strokeWidth=1.8));d.add(Polygon([x2,y2,x2-4,y2+8,x2+4,y2+8],fillColor=PETROL,strokeColor=PETROL))
  if label:d.add(String(x1+11,(y1+y2)/2-2,label,fontName='Body',fontSize=8,fillColor=PETROL))
 box(0,300,WIDTH,88,'1  GitHub → GitHub Pages',['Quellcode im Repository · Branch main · Ordner / (root)','Liefert HTML, CSS, JavaScript und öffentliche Downloads.'],SOFT)
 arrow(55,299,55,269,'HTTPS: Seite und Dateien')
 box(0,171,WIDTH,98,'2  Browser / DatenCockpit',['CSV/XLSX einlesen → Regeln prüfen → Zeilen bearbeiten/ausschließen','Erst nach ausdrücklicher Freigabe werden Aufträge übertragen.','Der Import-Zugriffsschlüssel bleibt im aktuellen Browser-Tab.'])
 arrow(55,170,55,131,'HTTPS + öffentlicher Publishable-Key; RPC mit Daten/Import-Schlüssel')
 box(0,3,WIDTH,128,'3  Supabase / PostgreSQL',['Data API → vier gezielt freigegebene SQL-Funktionen','Status · validierter Import · Monatsbericht · Löschen','Tabellen: datencockpit_batches  1 : n  datencockpit_orders','RLS aktiv · direkte Tabellenzugriffe gesperrt · nur Token-Hash gespeichert'],SOFT)
 return d
DIAGRAM=architecture();renderSVG.drawToFile(DIAGRAM,str(ASSETS/'architektur.svg'))

page(1,'DatenCockpit')
add('Von der Tabelle zum verlässlichen Bericht.','title')
add('Bedienung · Aufbau · Datenbank · Veröffentlichung','eyebrow')
add('<b>Was macht das Projekt?</b> Kleine Unternehmen erhalten Auftragslisten oft als Excel- oder CSV-Datei. Fehlende Angaben, doppelte Aufträge und ungültige Werte können daraus falsche Berichte machen. Das DatenCockpit macht diese Auffälligkeiten sichtbar, bevor sie in die Auswertung gelangen.')
add('<b>Der Ablauf:</b> Datei einlesen → Daten prüfen → Auffälligkeiten korrigieren oder Zeilen ausschließen → ausdrücklich freigeben → Monatskennzahlen aus PostgreSQL anzeigen.')
h('Was am Anfang passiert')
add('Beim Öffnen ist noch kein neuer Import gespeichert. Die Website lädt zunächst nur Oberfläche und öffentliche Konfiguration. Wird im selben Tab ein noch gültiger Import-Schlüssel gefunden, versucht sie, den zugehörigen Bericht wieder zu laden. Eine neu ausgewählte Datei wird zuerst ausschließlich im Browser gelesen und geprüft.')
h('Das Ergebnis')
add('Ein Monatsbericht zeigt bezahlten Umsatz, offene Aufträge, offenes Auftragsvolumen und die Zahl freigegebener Aufträge. Hinzu kommen Diagramm, CSV-Export und eine Löschfunktion. Maßgeblich ist der <b>Auftragsmonat</b>; dies ist keine buchhalterische Umsatzrealisierung.')
h('Projekt und Unterlagen')
add(link('DatenCockpit öffnen','https://www.mlinner-software.de/datencockpit/'))
add(link('Quellcode auf GitHub','https://github.com/manlin65/manlin65.github.io'))
add('Stand: 22. Oktober 2026 · Manfred Linner / manlin · Portfolio-Demo mit fiktiven Daten.','small')
add('Diese Anleitung beschreibt die aktive Lösung: GitHub Pages + Supabase. Netlify, Azure und die zuvor getestete Neon-Datenbank werden für das aktive Cockpit nicht benötigt.','small')

page(2,'Die Architektur auf einen Blick')
story.extend([DIAGRAM,Spacer(1,14)])
h('Wer übernimmt welche Aufgabe?')
table(['Baustein','Aufgabe'],[['GitHub / GitHub Pages','Quellcode, Versionshistorie und Veröffentlichung der statischen Website.'],['Browser','Datei lesen, Regeln anwenden, Eingaben bearbeiten, Freigabe und Bericht anzeigen.'],['Supabase Data API','HTTPS-Zugang zu genau definierten PostgreSQL-Funktionen (RPC).'],['PostgreSQL','Erneute Datenprüfung, transaktionales Speichern, Zugriffsschutz und SQL-Kennzahlen.']],[145,WIDTH-145])
add('Wichtig: GitHub Pages führt kein serverseitiges Node.js oder PHP aus. Die Datenbank liegt separat bei Supabase. Nur der öffentliche Publishable-Key steht im Website-Code; Secret-Keys und Datenbankpasswörter gehören dort niemals hinein.','small')

page(3,'So ist das Projekt aufgebaut')
code('manlin65.github.io/\n  index.html                 Homepage und Projektverweis\n  assets/                    Logo, Schriften, gemeinsames Layout\n  datencockpit/\n    index.html               Oberfläche unter /datencockpit/\n    styles.css               Auf das Cockpit begrenzte Styles\n    app-source.js            Editierbarer Browser-Quelltext\n    app.js                   Erzeugtes Browser-Bundle\n    data.cjs                 CSV, Normalisierung, Prüfregeln\n    supabase.cjs             Geschützte RPC-Aufrufe\n    config.js                Öffentliche Projektkonfiguration\n    beispieldateien.zip      Fünf Testdateien\n    downloads/               PDF und vollständiges Beispielpaket\n  supabase/migrations/       Tabellen, Rechte und SQL-Funktionen\n  scripts/                   Build, Entwicklungsserver, Prüfungen\n  tests/                     Node-, SQL- und Clienttests')
h('Technische Grundlage')
table(['Technik','Wofür?'],[['HTML / CSS / JavaScript','Statische Oberfläche im bestehenden Homepage-Layout.'],['read-excel-file','Liest das erste Tabellenblatt einer XLSX-Datei.'],['esbuild','Bündelt Quellcode und Bibliothek in app.js.'],['Supabase / PostgreSQL','API, geprüfte Speicherung und SQL-Berichte.'],['Playwright / Chromium','Prüft den Ablauf im echten Browser.'],['PGlite','Lokale PostgreSQL-Engine für SQL- und Rechteprüfungen.']],[145,WIDTH-145])
add('Der Homepage-Stil bleibt erhalten: originales ML-Logo, lokal gehostete Schriften Manrope und Source Sans 3, Petrolfarben, Navigation und Fußzeile. app.js wird erzeugt; Änderungen gehören in app-source.js und werden anschließend neu gebaut.','small')

page(4,'Bedienung: vom Upload zur Freigabe')
for title,text in [
 ('1. Datei wählen','Die Seite öffnen und „Datei auswählen“ oder „Beispieldaten laden“ verwenden. Unterstützt werden CSV und XLSX; alte XLS-Dateien vorher als XLSX speichern. Das ZIP zuerst entpacken, dann eine einzelne Datei hochladen.'),
 ('2. Ergebnis prüfen','Die Übersicht zählt Gesamtzeilen, gültige Zeilen, auffällige Zeilen und Ausschlüsse. „Nur Auffälligkeiten“ blendet fehlerfreie Zeilen aus. Die sichtbare Zeilennummer orientiert sich an den eingelesenen Daten inklusive Kopfzeile.'),
 ('3. Werte berichtigen','Kundennamen, Datum, Betrag oder Status direkt in der Tabelle bearbeiten. Änderungen mit Tab oder einem Klick außerhalb des Felds übernehmen. Nach jeder Änderung muss die Freigabe erneut bestätigt werden.'),
 ('4. Dubletten klären','Bei identischen Auftragsnummern sind beide Zeilen markiert. Die falsche Zeile ausschließen oder eine tatsächlich falsche Nummer korrigieren. Der Vergleich unterscheidet Groß- und Kleinschreibung nicht.'),
 ('5. Ausdrücklich freigeben','Nur eine Auswahl ohne verbleibende Auffälligkeiten lässt sich freigeben. Das Kontrollkästchen bestätigen und „Freigeben & Bericht erstellen“ wählen. Jetzt erst werden die ausgewählten Aufträge übertragen und gespeichert.'),
 ('6. Bericht nutzen','Monatswerte und Diagramm ansehen, den Bericht als CSV exportieren oder aktualisieren. „Import aus der Datenbank löschen“ entfernt den aktuellen Import und alle zugehörigen Aufträge nach einer Bestätigung.')]:
 h(title);add(text)
add('Ausgeschlossene Zeilen und die ursprüngliche Upload-Datei werden nicht in der Datenbank gespeichert. Die API prüft die übermittelten Daten erneut; Browserprüfungen allein reichen nicht aus.','small')

page(5,'Dateiformat und Prüfregeln')
table(['Spalte','Erwartet / Beispiel'],[['Auftragsnummer','Pflichtwert, maximal 80 Zeichen; z. B. A-1001. Keine Dublette innerhalb des Imports.'],['Datum','TT.MM.JJJJ oder JJJJ-MM-TT; gültiges Kalenderdatum von 2000 bis 2100. Excel-Datumszellen werden unterstützt.'],['Kunde','Pflichtwert, maximal 160 Zeichen; in der Demo nur fiktive Namen.'],['Betrag','Euro, 0 bis 10.000.000; maximal zwei Nachkommastellen. Z. B. 1.234,56 oder 1234.56.'],['Status','Genau offen, bezahlt oder storniert. Schreibweise wird normalisiert.']],[115,WIDTH-115])
h('Dateigrenzen')
bullet('Maximal 2 MB pro Datei und 1.000 Auftragszeilen; die API akzeptiert höchstens 1 MB JSON-Nutzdaten.')
bullet('CSV: UTF-8 empfohlen, Komma oder Semikolon als Trennzeichen. Die Beispiele verwenden UTF-8 mit BOM und Semikolon für Excel.')
bullet('XLSX: Nur das erste Tabellenblatt wird gelesen. Die Pflichtspalten müssen jeweils einmal vorhanden sein; ihre Reihenfolge ist frei.')
h('Warum bleibt die Freigabe gesperrt?')
add('Ein Haken bei der Zustimmung hebt Datenfehler nicht auf. Korrigieren oder entfernen Sie zuerst alle markierten Zeilen. Nach Korrekturen die Zustimmung erneut aktivieren. Mindestens ein gültiger Auftrag muss ausgewählt bleiben.')
h('Prüfung versus fachliche Freigabe')
add('Das Cockpit prüft Formate, Pflichtangaben und Dubletten. Es weiß nicht, ob ein Betrag fachlich stimmt oder ob ein Kunde tatsächlich existiert. Diese Entscheidung trifft die Person, die die Datei prüft und freigibt.')

page(6,'Datenbank: zwei Tabellen, ein Import')
table(['datencockpit_batches','Bedeutung'],[['id · uuid · Primärschlüssel','Eindeutige Kennung eines freigegebenen Imports.'],['token_hash · text','SHA-256-Hash des zufälligen Import-Zugriffsschlüssels; nicht der Schlüssel selbst.'],['created_at · timestamptz','Zeitpunkt des Imports.'],['expires_at · timestamptz','Zugriffsende, standardmäßig nach 24 Stunden.']],[185,WIDTH-185])
add('<b>Beziehung:</b> Ein Import hat mehrere Aufträge. datencockpit_orders.batch_id verweist auf datencockpit_batches.id. Beim Löschen des Imports werden seine Aufträge durch ON DELETE CASCADE mit gelöscht.')
table(['datencockpit_orders','Bedeutung'],[['batch_id · uuid','Zugehöriger Import / Fremdschlüssel.'],['order_number · varchar(80)','Auftragsnummer; zusammen mit batch_id der Primärschlüssel. Ein zusätzlicher Index verhindert Dubletten unabhängig von Groß-/Kleinschreibung.'],['order_date · date','Auftragsdatum für die Monatszuordnung.'],['customer · varchar(160)','Fiktiver Kundenname.'],['amount_cents · bigint','Betrag als ganze Cent-Zahl, z. B. 12345 = 123,45 €.'],['status · text','Nur offen, bezahlt oder storniert.']],[185,WIDTH-185])
h('Wo sehe ich gespeicherte Daten?')
add('Supabase-Projekt öffnen → Table Editor → datencockpit_orders. Einträge entstehen nach erfolgreicher Freigabe. datencockpit_batches zeigt den zugehörigen Import. Tests löschen ihre eigenen Daten wieder; leere Tabellen nach einem Test sind daher normal.')
code('SELECT order_number, order_date, customer, amount_cents, status\nFROM public.datencockpit_orders\nORDER BY order_date, order_number;')
add('Die Abfrage oben ist für den administrativen SQL-Editor gedacht. Die öffentliche Website darf die Tabellen nicht direkt lesen.','small')

page(7,'Geschützte Funktionen und SQL-Bericht')
table(['RPC-Funktion','Aufgabe'],[['datencockpit_status()','Bestätigt, dass die SQL-Funktion über die Supabase-API erreichbar ist.'],['datencockpit_import(p_rows)','Prüft alle Aufträge erneut, erzeugt Import-ID und Zugriffsschlüssel und speichert atomar. Fehler rollen den gesamten Import zurück.'],['datencockpit_report(p_batch_id, p_token)','Prüft Schlüssel und Ablaufzeit; liefert Monatswerte und Gesamtsummen.'],['datencockpit_delete(p_batch_id, p_token)','Entfernt nur den Import mit passendem Schlüssel; Aufträge werden mit gelöscht.']],[205,WIDTH-205])
h('Die Kennzahlen entstehen in PostgreSQL')
code("SELECT to_char(order_date, 'YYYY-MM') AS monat,\n       count(*) AS auftraege,\n       sum(amount_cents) FILTER\n         (WHERE status = 'bezahlt') AS umsatz_cent,\n       count(*) FILTER\n         (WHERE status = 'offen') AS offene_auftraege,\n       sum(amount_cents) FILTER\n         (WHERE status = 'offen') AS offen_cent\nFROM public.datencockpit_orders\nWHERE batch_id = 'HIER-IMPORT-UUID-EINSETZEN'::uuid\nGROUP BY 1 ORDER BY 1;")
add('Beispiel für die Logik der Auswertung. Die echte Berichtsfunktion prüft davor die Berechtigung und ersetzt leere Summen mit 0. Die Website sendet keine beliebigen SQL-Anweisungen, sondern ruft nur diese fest definierten Funktionen auf.')
h('Zugriff und Aufbewahrung')
add('Row Level Security ist auf beiden Tabellen aktiv. Den API-Rollen anon und authenticated sind direkte Tabellenrechte entzogen. Nur die vorgesehenen Funktionen sind freigegeben. Bericht und Löschung benötigen einen gültigen Import-Schlüssel.')
add('Der Schlüssel liegt im sessionStorage des aktuellen Tabs. Nach Schließen des Tabs ist er normalerweise nicht mehr verfügbar; Browser-Sitzungswiederherstellung kann ihn erhalten. Nach 24 Stunden endet der Zugriff in jedem Fall. Abgelaufene Daten werden beim nächsten erfolgreichen Import physisch entfernt. Es gibt keinen automatischen Löschjob.','small')
add('Dies ist ein Beispieldaten-Projekt ohne Mitarbeiterkonten. Für echte Geschäftsdaten fehlen insbesondere Benutzerverwaltung, Rollen, Missbrauchsschutz und ein verbindlicher Löschprozess.','small')

page(8,'Supabase einrichten und kontrollieren')
for title,text in [
 ('1. Kostenloses Projekt anlegen','Im Supabase-Dashboard ein eigenes Projekt anlegen, z. B. manlin-datencockpit. Eine EU-Region wählen. Das Datenbankpasswort sicher speichern und nicht in GitHub oder Website-Dateien übernehmen.'),
 ('2. Tabellen und Rechte einrichten','SQL Editor öffnen. Zuerst 202610220001_datencockpit_tables.sql aus dem Paket vollständig ausführen. Danach 202610220002_datencockpit_functions.sql ausführen. Beide Dateien liegen zusätzlich unter supabase/migrations im Repository.'),
 ('3. Auf Originalsprache achten','Automatische Browser-Übersetzung ausschalten, bevor SQL kopiert oder ausgeführt wird. Befehle müssen SELECT, CREATE und GRANT heißen, nicht „WÄHLE“, „ERSTELLEN“ oder übersetzte Varianten.'),
 ('4. Öffentliche Konfiguration übernehmen','Project Settings → Data API: Project URL kopieren. Unter API Keys den Publishable-Key verwenden (sb_publishable_…). Nur diese öffentlichen Werte in datencockpit/config.js eintragen.'),
 ('5. Verbindung prüfen','Im SQL-Editor SELECT public.datencockpit_status(); ausführen. Die Ausgabe enthält connected: true. Danach auf der Website „Verbindung prüfen“ verwenden. Der Test über die Website prüft zusätzlich Projektadresse und öffentlichen Schlüssel.')]:
 h(title);add(text)
code("window.DATENCOCKPIT_CONFIG = Object.freeze({\n  provider: 'supabase',\n  supabaseUrl: 'https://DEIN-PROJEKT.supabase.co',\n  supabasePublishableKey: 'sb_publishable_DEIN_OEFFENTLICHER_KEY'\n});")
add('Die aktuelle Projektadresse ist '+link('ebjoamsxkjufmilzabyp.supabase.co','https://ebjoamsxkjufmilzabyp.supabase.co')+'. Ein Secret- oder service_role-Key darf niemals in diese Datei. Der Client weist solche Schlüssel zurück.','small')

page(9,'Lokal entwickeln und auf GitHub veröffentlichen')
h('Vorbereitung auf dem Entwicklungsrechner')
add('Node.js ab Version 22 installieren. Repository klonen bzw. vorhandenen Checkout verwenden. Im Projektverzeichnis ausführen:')
code('npm ci --include=dev\nnpm run build\nnpm test\nnpm run test:datencockpit:supabase\nnpm run dev:datencockpit')
add('In der Codex-Cloud bei npm zusätzlich --cache /workspace/.npm-cache verwenden. Der Entwicklungsserver läuft auf Port 8888; der aktive Supabase-Modus braucht keine lokale Datenbank und keine .env-Datei. Die Browserprüfung benötigt Chromium; CHROMIUM_PATH kann den Browserpfad vorgeben.','small')
h('Was muss nach GitHub?')
add('Nach Quelltextänderungen immer neu bauen. app-source.js ist der Quelltext; app.js ist das fertige Browser-Bundle. Für dieses Projekt wird auch das erzeugte app.js committed, weil GitHub Pages den Branch direkt als statische Website veröffentlicht. Nur geprüfte Projektdateien hinzufügen; keine .env-Dateien oder Geheimschlüssel.')
code('git status\ngit add datencockpit/ scripts/ supabase/ package.json package-lock.json\ngit diff --cached\ngit commit -m "DatenCockpit aktualisieren"\ngit push origin main')
h('GitHub Pages einmalig einstellen')
add('Repository → Settings → Pages → Build and deployment: <b>Deploy from a branch</b> auswählen. Branch <b>main</b>, Ordner <b>/ (root)</b>. Die bestehende Custom Domain lautet <b>www.mlinner-software.de</b>; die Datei CNAME im Repository bleibt erhalten. HTTPS verwenden.')
h('Veröffentlichung überprüfen')
add('Unter Actions den Lauf „pages build and deployment“ prüfen. Erst nach erfolgreichem Deploy die öffentliche URL öffnen und mit Strg+F5 aktualisieren. Auf der Website Verbindung, Beispieldatei, Freigabe und Bericht testen. Die gesamte Homepage wird mit demselben Branch veröffentlicht; andere Projekte nicht versehentlich überschreiben.')
add('Netlify und Azure sind für die aktive Lösung nicht erforderlich. Alte Adapter im Repository dürfen bestehen bleiben. Die aktive Auswahl steht in datencockpit/config.js auf provider: supabase.','small')

page(10,'Fünf Dateien zum Ausprobieren')
add('Alle Beispiele enthalten ausschließlich fiktive Aufträge. Entpacken Sie das ZIP und laden Sie eine einzelne CSV- oder XLSX-Datei hoch. Beide Excel-Dateien verwenden echte Excel-Datums- und Zahlenzellen.')
table(['Datei','Zeilen','Auffällig','Zweck'],[['01_saubere_auftraege.csv','12','0','Direkt freigeben; vier Monate und alle drei Status.'],['02_dubletten.csv','8','4','Zwei Dublettengruppen; Groß-/Kleinschreibung testen.'],['03_fehlende_und_ungueltige_werte.csv','10','6','Pflichtwerte, Datum, Betrag und Status korrigieren.'],['04_monatsreport_2026.xlsx','24','0','Zwölf Monate mit je einem bezahlten und offenen Auftrag.'],['05_gemischte_pruefliste.xlsx','12','5','Excel-Import mit Dublette, fehlendem Kunden, Datum und negativem Betrag.']],[231,42,52,WIDTH-325])
h('Beispiel 01 und 04: direkt freigeben')
add('Datei laden, Ergebnis prüfen, Zustimmung aktivieren und Bericht erstellen. Für diese sauberen Dateien müssen keine Werte geändert werden.')
h('Beispiel 02: Dubletten entfernen')
add('Die zweite D-1002-Zeile ausschließen (Dateizeile 4). Die zweite Variante der D-1003-Auftragsnummer ausschließen (Dateizeile 6, als d-1003 geschrieben). Danach bleiben 6 gültige Aufträge.')
h('So unterscheiden sich Fehler- und Zeilenzahl')
add('„4 auffällige Zeilen“ bedeutet bei Beispiel 02 nicht vier zusätzliche Aufträge: Jede der zwei Dublettengruppen markiert beide betroffenen Zeilen. Durch Ausschluss jeweils einer Kopie werden auch die verbleibenden Originalzeilen gültig.')
h('Dateien auch direkt in der PDF')
add('Die fünf Originaldateien sind zusätzlich als PDF-Anhänge eingebettet. Viele Desktop-PDF-Reader zeigen sie im Bereich „Anhänge“ / Büroklammer. Browser-PDF-Viewer unterstützen das nicht immer. Das ZIP auf der Projektseite ist deshalb der verlässlichere Downloadweg.')

page(11,'Korrekturübungen und erwartete Ergebnisse')
h('Beispiel 03: diese sechs Werte berichtigen')
table(['Auftrag','Korrektur'],[['F-2002','Kunde ergänzen, z. B. Musterbetrieb.'],['F-2003','Datum ergänzen: 2026-10-03.'],['F-2004','2026-02-30 auf 2026-02-28 korrigieren.'],['F-2005','Betrag -50,00 auf 50,00 korrigieren.'],['F-2006','Betrag 125,999 auf 126,00 korrigieren.'],['F-2007','Status in Bearbeitung auf offen ändern.']],[100,WIDTH-100])
h('Beispiel 05: Auswahl und Werte klären')
add('Die zweite P-3002-Zeile ausschließen (Dateizeile 4). Bei P-3004 den Kunden ergänzen, z. B. Musterbetrieb. Bei P-3005 das Datum auf 2026-10-09 ändern. Bei P-3006 den Betrag von -45 auf 45 ändern. Danach bleiben 11 gültige Aufträge.')
h('Kontrollwerte nach genau diesen Korrekturen')
table(['Beispiel','Aufträge','Bezahlt','Offen'],[['01 · unverändert','12','2.802,00 €','3.102,00 €'],['02 · zwei Kopien ausgeschlossen','6','3.620,50 €','1.400,00 €'],['03 · wie oben korrigiert','10','2.696,00 €','2.200,00 €'],['04 · unverändert','24','21.789,00 €','6.120,00 €'],['05 · wie oben korrigiert','11','7.725,00 €','1.925,50 €']],[220,61,113,WIDTH-394])
add('Die Beträge „Offen“ sind offene Euro-Volumen, keine Auftragsanzahlen. Stornierungen zählen bei „Aufträge“ mit, aber nicht bei den beiden Geldsummen. Werden andere Korrekturen vorgenommen oder weitere Zeilen ausgeschlossen, ändern sich die Kontrollwerte.','small')
h('Schneller Vortrag mit den eingebauten Beispieldaten')
add('„Beispieldaten laden“ auf der Seite verwendet einen separaten 8-Zeilen-Datensatz. Die zweite A-1003-Zeile ausschließen und den Kunden bei A-1004 ergänzen. Ergebnis: 7 Aufträge, 4.650,00 € bezahlt und 1.490,50 € offen. Diese Werte gehören nicht zu Datei 01 des ZIPs.','small')

page(12,'Hilfe, Abnahme und nächste Schritte')
table(['Beobachtung','Was tun?'],[['Freigabe-Button ist grau','Alle verbleibenden Auffälligkeiten korrigieren oder ausschließen. Mindestens eine Zeile auswählen und Zustimmung erneut aktivieren.'],['SQL enthält übersetzte Wörter','Browser-Übersetzung abschalten, Original-SQL erneut kopieren und vollständig ausführen.'],['Verbindung schlägt fehl','Project URL und öffentlichen Publishable-Key prüfen. Beide SQL-Skripte vollständig ausführen. Supabase-Projektstatus kontrollieren.'],['Neuer Code erscheint nicht','GitHub-Actions-Deployment abwarten und die Seite mit Strg+F5 neu laden. Bei Bedarf Browsercache prüfen.'],['Import nicht gefunden / abgelaufen','Richtigen Browser-Tab nutzen. Nach 24 Stunden Datei erneut importieren. Ohne gespeicherten Import-Schlüssel kann der Bericht nicht geöffnet werden.'],['Tabellen sind leer','Es wurde noch nichts freigegeben, der Import wurde gelöscht oder nur ein automatischer Test lief. Tests räumen ihre eigenen Daten auf.'],['Excel wird nicht angenommen','XLSX statt XLS verwenden; erste Tabelle, Pflichtüberschriften, Dateigröße und Zeilenlimit kontrollieren.']],[173,WIDTH-173])
h('Nachweisbarer Prüfstand')
add('Zum dokumentierten Stand bestanden Build und 38 Node-Tests. Zusätzlich wurden die reale Supabase-Verbindung, gesperrte direkte Tabellenzugriffe, gültige und fremde Import-Schlüssel, SQL-Kennzahlen und Löschung geprüft. Der vollständige CSV- und XLSX-Ablauf wurde auf der veröffentlichten Website mit Chromium ausgeführt. Eigene Testimporte wurden danach entfernt.')
h('Checkliste nach einer Änderung')
for t in ['Build und Tests erfolgreich; erzeugtes app.js aktualisiert.','Beide SQL-Skripte eingerichtet; Statusfunktion erreichbar.','GitHub-Pages-Deployment erfolgreich; öffentliche Website neu geladen.','Beispieldatei geprüft, freigegeben, Bericht und CSV-Export kontrolliert.','Testimport gelöscht; keine Geheimschlüssel oder realen Kundendaten veröffentlicht.']:bullet(t)
add(link('Projektseite und Downloads','https://www.mlinner-software.de/datencockpit/'))
add('Diese Anleitung beschreibt eine Portfolio-Demo und keinen fertig abgenommenen Mehrbenutzerbetrieb für echte Unternehmensdaten.','small')

def footer(c,doc):
 c.saveState();c.setStrokeColor(LINE);c.line(44,39,PAGE_W-44,39)
 c.setFont('Body',7.2);c.setFillColor(MUTED);c.drawString(44,26,'manlin · DatenCockpit · How-to · 22.10.2026');c.drawRightString(PAGE_W-44,26,f'{doc.page} / 12')
 if doc.page>1:
  c.setFont('Bold',8);c.setFillColor(NAVY);c.drawString(44,PAGE_H-31,'DATENCOCKPIT');c.setFont('Body',7.2);c.setFillColor(MUTED);c.drawRightString(PAGE_W-44,PAGE_H-31,'AUFBAU · DATENBANK · GITHUB PAGES')
 c.restoreState()
buffer=BytesIO()
doc=SimpleDocTemplate(buffer,pagesize=(PAGE_W,PAGE_H),leftMargin=44,rightMargin=44,topMargin=58,bottomMargin=54,title='DatenCockpit – How-to: Aufbau, Datenbank und Veröffentlichung',author='Manfred Linner / manlin',subject='Anleitung zur Portfolio-Demo mit Supabase und GitHub Pages')
doc.build(story,onFirstPage=footer,onLaterPages=footer)
reader=PdfReader(BytesIO(buffer.getvalue()))

if len(reader.pages)!=12:
 for i,pg in enumerate(reader.pages,1):
  text=pg.extract_text();print(i, text[:130].replace('\n',' | '), '...', text[-100:].replace('\n',' | '))
assert len(reader.pages)==12,f'Unexpected page count: {len(reader.pages)}'
writer=PdfWriter();writer.append(reader)
writer.add_metadata({'/Title':'DatenCockpit – How-to','/Author':'Manfred Linner / manlin','/Subject':'Bedienung, Architektur, Supabase, GitHub Pages und fünf Beispieldateien'})
with ZipFile(ROOT/'datencockpit/beispieldateien.zip') as examples:
 for name in examples.namelist():writer.add_attachment(name,examples.read(name))
 with PDF.open('wb') as f:writer.write(f)
 with ZipFile(ZIP,'w',ZIP_DEFLATED) as bundle:
  bundle.write(PDF,PDF.name)
  for name in examples.namelist():bundle.writestr('Beispieldateien/'+name,examples.read(name))
  for name in ['202610220001_datencockpit_tables.sql','202610220002_datencockpit_functions.sql']:
   bundle.write(ROOT/'supabase/migrations'/name,'SQL/'+name)
  bundle.write(ASSETS/'architektur.svg','Grafik/architektur.svg')
  bundle.writestr('LIESMICH.txt','DatenCockpit – Anleitung und Beispiele\n\n1. DatenCockpit-Howto.pdf öffnen.\n2. ZIP entpacken; einzelne Dateien aus Beispieldateien/ auf der Projektseite hochladen.\n3. SQL/ enthält die beiden Einrichtungsskripte für ein eigenes Supabase-Projekt. Im aktuellen Projekt sind sie bereits eingerichtet.\n4. Grafik/ enthält die Architekturgrafik als SVG.\n\nProjekt: https://www.mlinner-software.de/datencockpit/\nAlle Beispieldaten sind fiktiv. Stand: 22.10.2026.\n')
print(f'PDF: {len(reader.pages)} Seiten, 5 eingebettete Beispieldateien, {PDF.stat().st_size} Bytes')
print(f'ZIP: {ZIP.stat().st_size} Bytes')
