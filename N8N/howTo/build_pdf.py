"""Build: python3 N8N/howTo/build_pdf.py (ReportLab; optional CairoSVG for logo)."""
from pathlib import Path
from xml.sax.saxutils import escape
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader
import io
ROOT=Path(__file__).resolve().parents[2]
OUT=Path(__file__).with_name('KI-Lernassistent-HowTo.pdf')
for name,file in [('Manrope','manrope-variable.ttf'),('Source','source-sans-3-variable.ttf')]:
 from fontTools.ttLib import TTFont as Font
 from fontTools.varLib.instancer import instantiateVariableFont
 font=Font(ROOT/'assets/fonts'/file)
 font=instantiateVariableFont(font,{'wght':750 if name=='Manrope' else 450},inplace=True)
 buf=io.BytesIO();font.save(buf);buf.seek(0)
 pdfmetrics.registerFont(TTFont(name,buf))
navy='#0e4759';petrol='#155e75';muted='#64748b'
c=canvas.Canvas(str(OUT),pagesize=(595.28,841.89));c.setTitle('KI-Lernassistent | Workflow & Zugänge');c.setAuthor('ML · Manfred Linner')
body=ParagraphStyle('body',fontName='Source',fontSize=10.5,leading=14,textColor=HexColor('#17202a'))
y=0
logo=ImageReader(str(Path(__file__).with_name('ml-logo-kompakt.png')))

def page(num,kicker,title,intro):
 global y
 c.setFillColor(HexColor('#f6f8fb'));c.rect(0,0,595.28,841.89,fill=1,stroke=0)
 c.setFillColor(HexColor(navy));c.rect(0,827,595.28,15,fill=1,stroke=0)
 if logo:c.drawImage(logo,44,750,120,55,mask='auto',preserveAspectRatio=True)
 c.setFillColor(HexColor(navy));c.setFont('Manrope',12);c.drawString(184 if logo else 44,778,'ML · Manfred Linner')
 c.setFont('Source',9);c.setFillColor(HexColor(muted));c.drawString(184 if logo else 44,762,'KI. Datenbanken. Programmierung.')
 c.setStrokeColor(HexColor('#dce4ec'));c.line(44,740,551,740)
 c.setFont('Source',10);c.setFillColor(HexColor(petrol));c.drawString(44,715,kicker.upper())
 y=674
 p=Paragraph(escape(title),ParagraphStyle('h',fontName='Manrope',fontSize=27,leading=33,textColor=HexColor(navy)))
 _,h=p.wrap(507,100);p.drawOn(c,44,y-h+25);y=y-h+10
 text(intro)
 c.setFont('Source',9);c.setFillColor(HexColor(muted));c.drawString(44,34,'info@mlinner-software.de · +49 160 7838773')
 c.drawString(44,21,'www.mlinner-software.de · KI-Lernassistent · 21.10.2026');c.drawRightString(551,30,str(num))

def text(s):
 global y
 p=Paragraph(s,body);_,h=p.wrap(507,700);p.drawOn(c,44,y-h);y-=h+9
 if y<55:raise RuntimeError('Page overflow')

def item(title,s):
 global y
 y-=4
 p=Paragraph(escape(title),ParagraphStyle('sub',fontName='Manrope',fontSize=13,leading=18,textColor=HexColor(petrol)))
 _,h=p.wrap(507,100);p.drawOn(c,44,y-h);y-=h+6;text(s)

def link(url):return '<link href="'+url+'" color="'+petrol+'">'+escape(url)+'</link>'
page(1,'Die Anwendung','Aus deiner PDF wird Lernstoff.','Ein Klassenprojekt von Manfred Linner: Eine neue, textlesbare PDF hochladen und daraus Zusammenfassung, Glossar und Quizfragen erzeugen lassen.')
item('Was macht die Webanwendung?','Sie sendet deine ausgewählte PDF an n8n Cloud. Dort wird der Text ausgelesen und von Google Gemini in Lernmaterialien umgewandelt. Das Ergebnis erscheint wieder in der Webanwendung und gehört zu deiner hochgeladenen Unterlage.')
item('Was entsteht?','Eine Zusammenfassung, bis zu drei Glossarbegriffe mit Erklärungen sowie bis zu drei Quizfragen mit Lösungen, Begründungen und Quellenzitaten. Im Quiz kannst du erst selbst antworten und anschließend die Lösung zum Vergleichen aufklappen.')
item('Was kannst du danach tun?','Die erzeugten Lernmaterialien prüfen und bearbeiten. Nach deiner Prüfbestätigung kannst du das Ergebnis als JSON herunterladen. Änderungen heben die Prüfbestätigung wieder auf. Der Web-Ablauf speichert nicht automatisch in Google Drive.')
item('Zwei Wege zum Ausprobieren','Oben auf der Website: eine neue PDF mit dem echten Analyse-Endpunkt verarbeiten. Unten: eine getrennte Beispieldemo mit festen Daten. Die Beispieldemo ruft keine KI auf. Der ältere n8n-Formularablauf mit Drive bleibt separat bestehen.')
item('Rahmen des Klassenprojekts','Ohne Anmeldung nutzbar. Verwende zunächst künstliche, textlesbare Unterlagen ohne persönliche Daten. Der PDF-Inhalt wird an n8n und Google Gemini übertragen. OCR für Bild-PDFs und ein freier Chat zur Unterlage sind nicht eingebaut.')
c.showPage()
page(2,'How-to','In fünf Schritten zum Quiz','Anwendungsadresse: https://www.mlinner-software.de/N8N/')
item('1 · Eine eigene Test-PDF wählen','Die Website öffnen und oben bei „Neue PDF analysieren“ eine textlesbare PDF auswählen. Das Browserlimit beträgt 10 MB; im Workflow sind maximal 60.000 ausgelesene Textzeichen vorgesehen.')
item('2 · Übertragung bestätigen','Das Kontrollkästchen zur Übertragung an n8n und Gemini aktivieren. Erst „PDF analysieren“ sendet die Datei. Eine reine Dateiauswahl löst keine Analyse aus.')
item('3 · Analyse abwarten','Der Browser sendet die Datei als POST-Anfrage an den n8n-Webhook. Die Verarbeitung kann dauern. Nicht mehrfach klicken. Bei einem Zeitlimit kann der Server noch arbeiten; zuerst die n8n-Ausführung prüfen.')
item('4 · Lernen und prüfen','Zusammenfassung und Glossar mit dem PDF-Text vergleichen. Die Quizfragen zunächst selbst beantworten, anschließend „Lösung vergleichen“ öffnen. Quellenzitate dienen zur Kontrolle; sie beweisen nicht die Richtigkeit aller Aussagen.')
item('5 · Bei Bedarf bearbeiten und herunterladen','Texte können korrigiert werden. Erst nach persönlicher Prüfung das Freigabe-Kästchen bestätigen und die JSON-Datei herunterladen. Diese lokale Prüfbestätigung ist kein serverseitiger Freigabenachweis.')
item('Wenn keine Ergebnisse kommen','404: Veröffentlichung des Workflows „Glossar-Quiz“ und Produktions-Webhook prüfen. 503: Gemini ist überlastet. Leerer PDF-Text: eine textlesbare PDF verwenden. Format- oder Belegfehler: Ausgabe prüfen. Nach Änderungen in n8n erneut veröffentlichen.')
c.showPage()
page(3,'Workflow erklären','So arbeitet „Glossar-Quiz“','Dieser neue Workflow liefert das Ergebnis direkt an den Browser zurück. Er enthält weder den alten Wait-Knoten noch eine automatische Drive-Speicherung.')
item('Website-Upload · Der Eingang','Ein POST-Webhook empfängt die PDF aus dem Browser. Das Formularfeld und das binäre Eingabefeld heißen pdf. Die Website verwendet die Produktionsadresse mit /webhook/, nicht die manuelle Testadresse mit /webhook-test/.')
item('PDF_Text · Text auslesen','Extract From File liest den Text der PDF. Bei einer reinen Bild-PDF kann der Text leer sein. Ein anschließender Code-Knoten stoppt bei leerem Text oder bei mehr als 60.000 Textzeichen.')
item('Basic LLM Chain + Gemini · Entwurf erzeugen','Die LLM-Kette übergibt Quelltext und Arbeitsanweisung an das Gemini-Modell. Der Prompt fordert ausschließlich Informationen aus dem Text, ein festes JSON-Format und wörtliche Quellenzitate. Dokumentinhalt soll nicht als Arbeitsanweisung behandelt werden.')
item('JavaScript3 · Antwort kontrollieren','Der Code prüft gültiges JSON, vorhandene Bereiche, 1–3 Glossareinträge und Fragen sowie Zitate, die nach Leerraum-Normalisierung im Quelltext vorkommen. Das ist eine technische, keine fachliche Prüfung.')
item('Ergebnis an Website · Antwort zurückgeben','Respond to Webhook sendet das geprüfte JSON an genau die wartende Browseranfrage. Die Website zeigt Texte als Textfelder an und fügt keine KI-generierten HTML-Anweisungen ein. Jede Anfrage erhält ihre eigene Antwort.')
c.showPage()
page(4,'Backend verständlich','Was ist bei dir das Backend?','Frontend ist die sichtbare Bedienung. Backend ist die Verarbeitung im Hintergrund. Ein externer Dienst unterstützt das Backend bei einer bestimmten Aufgabe.')
item('Frontend · Website und Browser','GitHub speichert deinen Quellcode. GitHub Pages liefert HTML, CSS und JavaScript an den Browser. Dort wählst du die Datei, klickst „PDF analysieren“ und siehst die Lernmaterialien. GitHub Pages führt den n8n-Workflow nicht aus.')
item('Backend · n8n Cloud','Dein Backend ist in diesem Projekt n8n Cloud. Es nimmt die PDF entgegen, liest Text aus, ruft Gemini auf, prüft die Antwort und schickt das Ergebnis zurück. Die JavaScript-Knoten laufen auf dem Server; der Oberflächencode läuft im Browser.')
item('KI-Dienst · Google Gemini','Gemini ist der externe KI-Dienst. Er erstellt aus dem extrahierten Text den Entwurf. Der API-Schlüssel liegt ausschließlich in n8n-Zugangsdaten. Er gehört niemals in den öffentlich ausgelieferten Website-Code.')
item('Speicher · Google Drive im älteren Ablauf','Google Drive ist der externe Ergebnisspeicher des separaten PDF-Test-Workflows. Dieser schreibt nach Formularfreigabe in eine vorhandene Datei. Der neue Glossar-Quiz-Webworkflow nutzt Drive nicht und verändert diese Datei nicht.')
item('API, Webhook und JSON','Eine API ist eine Schnittstelle zwischen Programmen. Der Webhook ist hier eine HTTPS-Adresse, die den Ablauf per Anfrage startet. JSON ist das strukturierte Textformat der Antwort. CORS regelt Browserzugriffe; es ersetzt keine Anmeldung oder Nutzungsbegrenzung.')
c.showPage()
page(5,'Zugang 01','Gemini verbinden','Die Anmeldung erfolgt durch dich in Google AI Studio und n8n. Besucher brauchen keinen eigenen API-Schlüssel.')
item('1 · Schlüssel in Google AI Studio','https://aistudio.google.com/api-keys öffnen, mit deinem Google-Konto anmelden und einen vorhandenen API-Schlüssel verwenden oder einen neuen erstellen. Projekt, Modellverfügbarkeit und Kontingent prüfen.')
item('2 · Zugangsdaten in n8n','Im Gemini-Modellknoten eigene Zugangsdaten vom Typ Google Gemini (PaLM) API auswählen oder anlegen. Host: https://generativelanguage.googleapis.com. Den API-Schlüssel im geschützten Credential-Feld speichern.')
item('3 · Modell und Verbindung wählen','Ein in deinem Konto verfügbares Textmodell wählen. Die Importvorlage übernimmt den Modellnamen des ursprünglichen Exports; ein angezeigter Modellname ist kein Nachweis seiner Verfügbarkeit. Mit künstlichem Quelltext testen und danach den Workflow veröffentlichen.')
item('4 · Klassenbetrieb beachten','Anonyme Besucher verwenden dein n8n- und Gemini-Kontingent. Die Zustimmung im Browser ist keine serverseitige Zugriffssperre. Für breiten Betrieb sind serverseitige Größenlimits und Nutzungsbegrenzungen nötig. Der Browser prüft 10 MB, der Workflow bisher die extrahierte Textlänge.')
item('Fehlermeldungen einordnen','401/403: Schlüssel oder Projektberechtigung prüfen. 404: Modell oder Webhook nicht verfügbar. 429: Kontingent oder Anfragerate erreicht. 503: Dienst überlastet. Die Ursache in der n8n-Ausführung nachsehen; keine Zugangsdaten in Screenshots zeigen.')
c.showPage()
page(6,'Zugang 02','Google Drive – separater Ablauf','Diese Schritte beschreiben deinen älteren PDF-Test mit persönlicher Freigabe und Drive. Für die neue direkte Webanalyse wird Drive nicht benötigt.')
item('1 · Google Cloud vorbereiten','In https://console.cloud.google.com/ ein Projekt wählen und Google Drive API aktivieren. OAuth-Zustimmungsbildschirm einrichten; bei privatem Konto extern und im Testbetrieb das eigene Konto als Testnutzer hinzufügen.')
item('2 · OAuth-Webclient erstellen','Client vom Typ Webanwendung anlegen. Die Weiterleitungsadresse exakt aus den n8n-Zugangsdaten übernehmen. Bei deiner Cloud-Konfiguration war dies https://oauth.n8n.cloud/oauth2/callback.')
item('3 · In n8n verbinden','Client-ID und Client Secret in den Google-Drive-OAuth2-Zugangsdaten speichern. Scope: https://www.googleapis.com/auth/drive.file. Anschließend über „Sign in with Google“ anmelden und bestätigen.')
item('4 · Datei einmal per Upload anlegen','Convert to File erzeugt JSON im Binärfeld data. Drive: Upload, Eingabefeld data, eigener Dateiname. Parent Drive: From list → My Drive. Parent Folder: By URL mit dem eigenen Zielordner. Mit freigegebenen Testdaten einmal hochladen.')
item('5 · Danach dieselbe Datei aktualisieren','webViewLink aus dem Upload-Ergebnis kopieren. Auf Update umstellen, Datei By URL eintragen und „Dateiinhalt ändern“ aktivieren. Eingabefeld data. drive.file ist keine Ordnerbeschränkung. Der alte Test ersetzt immer dieselbe Datei und ist kein Mehrbenutzerarchiv.')
c.showPage()
page(7,'Für die Klasse','Zeigen. Erklären. Nachprüfen.','Vorschlag für eine kurze Vorführung: erst die Aufgabe zeigen, dann den Datenweg und zum Schluss die Grenzen der KI diskutieren.')
item('Einstieg · Welche Aufgabe lösen wir?','Eine Schulungsunterlage soll leichter wiederholbar werden. Die Anwendung erstellt Fachbegriffe und Fragen. Sie nimmt uns die Vorbereitung teilweise ab; die Inhalte müssen trotzdem überprüft werden.')
item('Vorführung · Zwei verschiedene PDFs','Zuerst eine künstliche PDF über Automatisierung hochladen. Danach eine andere über ein anderes Thema. Vergleichen: Ändern sich Glossar, Zusammenfassung und Quiz passend zum Inhalt? Eine feste Beispieldemo kann diesen Nachweis nicht liefern.')
item('Erklärung · Den Datenweg erzählen','Browser → n8n-Webhook → PDF-Text → Gemini → technische Prüfung → JSON-Antwort → Browser. n8n ist das Backend; GitHub Pages liefert das Frontend. Gemini ist ein externer KI-Dienst.')
item('Diskussion · Was ist noch kein Beweis?','Ein gefundenes Zitat belegt nicht automatisch die gesamte Erklärung. KI kann Aussagen unpassend zusammenfassen. Fragen: Ist die Lösung aus dem Text ableitbar? Ist das Zitat exakt? Fehlen wichtige Einschränkungen?')
item('Nachweis · Was wurde tatsächlich getestet?','Der ältere Drive-Ablauf wurde gemeinsam mit Freigabe und Ablehnung getestet. Die neue Weboberfläche wurde lokal mit simulierter API-Antwort auf Upload, Ergebnisanzeige und Prüfsperre geprüft. Der echte neue Cloud-Aufruf muss nach Veröffentlichung mit zwei PDFs bestätigt werden; ein direkter Testaufruf war aus der Arbeitsumgebung nicht erreichbar.')
c.showPage()
page(8,'Kontakt','Manfred Linner','KI sinnvoll einsetzen. Daten nutzbar machen. Lösungen entwickeln.')
c.drawImage(ImageReader(str(Path(__file__).with_name('ml-logo-detail.png'))),150,y-115,295,133,preserveAspectRatio=True,mask='auto')
y-=145
item('M. Linner Softwareentwicklung & Dienstleistungen','Manfred Linner<br/>Dipl. Informatiker (FH) · KI-Manager (Cert-IT-zertifiziert)<br/>Kienbühl 3 · 91126 Schwabach')
item('Fragen zu deiner Anwendung?','Schulungsunterlagen aufbereiten, Dokumente verarbeiten oder Abläufe automatisieren: Gemeinsam klären wir, wo KI hilft und wo Menschen die Ergebnisse prüfen.')
item('E-Mail','<link href="mailto:info@mlinner-software.de" color="#155e75">info@mlinner-software.de</link>')
item('Telefon','<link href="tel:+491607838773" color="#155e75">+49 160 7838773</link>')
item('Website','<link href="https://www.mlinner-software.de/" color="#155e75">www.mlinner-software.de</link>')
c.showPage()
page(9,'n8n · Skizze','Der Web-Analyse-Workflow','Der neue Workflow „Glossar-Quiz“ antwortet direkt auf den Upload der Webanwendung. Der ältere Drive-Ablauf bleibt davon getrennt.')
from reportlab.lib.colors import white
def box(x,yy,title,sub):
 c.setFillColor(white);c.setStrokeColor(HexColor(petrol));c.roundRect(x,yy,145,62,9,fill=1,stroke=1)
 c.setFillColor(HexColor(navy));c.setFont('Manrope',10);c.drawCentredString(x+72.5,yy+39,title)
 c.setFillColor(HexColor(muted));c.setFont('Source',9);c.drawCentredString(x+72.5,yy+21,sub)
def arrow(x1,y1,x2,y2,dashed=False):
 import math
 c.setStrokeColor(HexColor(petrol));c.setFillColor(HexColor(petrol));c.setLineWidth(1.3);c.setDash(4,3) if dashed else c.setDash();c.line(x1,y1,x2,y2);c.setDash()
 a=math.atan2(y2-y1,x2-x1);p=c.beginPath();p.moveTo(x2,y2);p.lineTo(x2-7*math.cos(a-.45),y2-7*math.sin(a-.45));p.lineTo(x2-7*math.cos(a+.45),y2-7*math.sin(a+.45));p.close();c.drawPath(p,fill=1,stroke=0)
box(44,500,'Website-Upload','POST · PDF empfangen');box(225,500,'PDF_Text','Text auslesen');box(406,500,'PDF-Text prüfen','Leer? Zu lang? Stoppen.')
arrow(189,531,225,531);arrow(370,531,406,531)
box(406,340,'Basic LLM Chain','Entwurf erstellen');arrow(478,500,478,402)
box(225,340,'JavaScript3','JSON + Belege prüfen');arrow(406,371,370,371)
box(44,340,'Ergebnis an Website','JSON-Antwort senden');arrow(225,371,189,371)
box(406,220,'Google Gemini','Externes KI-Modell');arrow(478,282,478,340,True)
box(44,220,'Webanwendung','Glossar + Quiz anzeigen');arrow(116,340,116,282)
y=175
text('<b>Durchgehende Pfeile:</b> Datenfluss. <b>Gestrichelter Pfeil:</b> Modellanschluss. Die Antwort enthält die erzeugten Lernmaterialien; der Browser stellt sie dar.')
text('<b>Älterer Ablauf mit Drive:</b> Formular → PDF_Text → LLM-Kette → JavaScript3 → Warten auf Prüfung → JavaScript2 → JSON-Datei → Drive-Update. Ablehnen beendet diesen älteren Ablauf vor der Speicherung.')
c.save()
print(OUT)
