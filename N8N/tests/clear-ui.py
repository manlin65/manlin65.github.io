from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1280,'height':900})
 page.goto('http://127.0.0.1:8893/N8N/')
 assert not page.locator('#beispiel details').get_attribute('open')
 assert page.locator('input[type=file]:visible').count()==1
 page.locator('#beispiel summary').click();page.locator('#load').click();page.locator('#results').wait_for(state='visible')
 assert page.locator('#material blockquote').count()==8
 assert page.locator('#material details').count()==3
 assert page.locator('#download').is_disabled()
 page.locator('#approve').check();assert page.locator('#download').is_enabled()
 page.locator('#material textarea').first.fill('Korrigierter Text');assert not page.locator('#approve').is_checked()
 for width in [390,768,1280]:
  page.set_viewport_size({'width':width,'height':900});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),width
 page.set_viewport_size({'width':1280,'height':900});page.goto('http://127.0.0.1:8893/N8N/');page.screenshot(path='/tmp/clear-learning-ui.png',full_page=True)
 page.route('**/webhook/ki-lernassistent-analyse',lambda r:r.fulfill(status=500,body='Error'))
 page.locator('#analysis-file').set_input_files({'name':'test.pdf','mimeType':'application/pdf','buffer':b'%PDF-1.4 test'})
 page.locator('#analysis-consent').check();page.locator('#analyze').click()
 page.wait_for_function("document.querySelector('#analysis-status').dataset.state==='error'")
 assert 'später' in page.locator('#analysis-status').inner_text()
 assert page.locator('#analyze').is_enabled()
 b.close();print('PASS: clear upload, optional demo, quiz, review, mobile, HTTP 500 message')
