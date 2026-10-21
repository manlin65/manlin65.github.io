from playwright.sync_api import sync_playwright
import json
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page()
 page.route('**/workflow-config.json',lambda r:r.fulfill(json={'analysisWebhookUrl':'https://sonja1.app.n8n.cloud/webhook/ki-lernassistent-analyse'}))
 sent=[]
 def api(r):
  sent.append(r.request.post_data_buffer)
  r.fulfill(json={'technischePruefung':'Bestanden','quelle':{'seitenanzahl':2},'zusammenfassung':'Neue Quelle','zusammenfassungBeleg':'Beleg','glossar':[{'begriff':'Neuer Begriff','erklaerung':'Neue Definition','beleg':'Beleg'}],'uebungsfragen':[{'frage':'Neue Frage?','loesung':'Neue Antwort','erklaerung':'Neue Erklärung','beleg':'Beleg'}]})
 page.route('**/webhook/ki-lernassistent-analyse',api)
 page.goto('http://127.0.0.1:8893/N8N/')
 page.locator('#analyze').wait_for(state='visible')
 page.locator('#analysis-file').set_input_files({'name':'neu.pdf','mimeType':'application/pdf','buffer':b'%PDF-1.4 new'})
 page.locator('#analyze').click();assert not sent
 page.locator('#analysis-consent').check();page.locator('#analyze').click()
 page.wait_for_function("document.querySelector('#analysis-status').textContent.includes('wurden')")
 assert len(sent)==1 and b'neu.pdf' in sent[0]
 assert 'Neuer Begriff' in page.locator('#material').inner_text() or page.locator('textarea').nth(1).input_value()=='Neuer Begriff'
 assert page.locator('#download').is_disabled()
 assert '2 Seite(n)' in page.locator('#source-info').inner_text()
 b.close();print('PASS: PDF upload, consent, real response rendering, review gate')
