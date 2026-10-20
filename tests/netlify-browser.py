from datetime import date,timedelta
import os
import shutil
from urllib.parse import parse_qs,urlparse
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium') or None,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':1280,'height':900});errors=[];calls=[];configured=False
 page.on('pageerror',lambda e:errors.append(str(e)))
 days=[str(date.today()+timedelta(days=i)) for i in range(-7,35)]
 def geo(route):
  name=parse_qs(urlparse(route.request.url).query)['name'][0];latitude={'Bamberg':49.89,'Nürnberg':49.45,'Schwabach':49.33}.get(name,49)
  route.fulfill(json={'results':[{'name':name,'latitude':latitude,'longitude':11.08,'country':'Deutschland','country_code':'DE'}]})
 def weather(route):
  route.fulfill(json={'timezone':'Europe/Berlin','daily':{'time':days,'weather_code':[0]*len(days),'temperature_2m_max':[20]*len(days),'precipitation_probability_max':[10]*len(days),'wind_speed_10m_max':[10]*len(days)}})
 def tickets(route):
  q=parse_qs(urlparse(route.request.url).query);calls.append(route.request.url)
  if not configured:route.fulfill(status=503,json={'error':'TICKETMASTER_API_KEY beim Hosting-Anbieter hinterlegen.'});return
  route.fulfill(json={'events':[{'id':q['latitude'][0],'name':'Netlify-Testkonzert','category':'Music','date':q['start'][0],'time':'19:00','city':'Teststadt','venue':'Testbühne','status':'onsale','url':'https://www.ticketmaster.de/event/test'}]})
 page.route('https://geocoding-api.open-meteo.com/**',geo);page.route('https://api.open-meteo.com/**',weather)
 base=os.environ.get('RAUSZEIT_NETLIFY_URL','http://127.0.0.1:8892/')
 origin=urlparse(base).scheme+'://'+urlparse(base).netloc
 page.route(origin+'/.netlify/functions/events?**',tickets)
 page.goto(base)
 page.wait_for_function("document.querySelectorAll('.city-weather-day').length===9")
 page.wait_for_function("document.querySelector('#ticketStatus').textContent.includes('TICKETMASTER_API_KEY')")
 assert calls and all(url.startswith(origin+'/.netlify/functions/events?') for url in calls)
 assert page.locator('#ticketEndpoint').input_value()==origin+'/.netlify/functions/events'
 assert page.evaluate("localStorage.getItem('rauszeit.ticketBackend.v1')")==None
 print('PASS built Netlify frontend automatically calls its own backend and clearly reports the missing key')
 configured=True;page.locator('#reloadTickets').click()
 page.wait_for_function("document.querySelectorAll('.ticket-card').length===3")
 assert all('20°' in text for text in page.locator('.ticket-weather').all_text_contents())
 page.locator('[data-date-preset="sa"]').click()
 page.wait_for_function("document.querySelectorAll('.ticket-card').length===3")
 assert all(parse_qs(urlparse(url).query)['start']==parse_qs(urlparse(url).query)['end'] for url in calls[-3:])
 page.wait_for_function("[...document.querySelectorAll('.country-flag img')].every(image=>image.complete && image.naturalWidth>0)")
 assert not errors,errors
 print('PASS event results, matching weather, day changes and local flags without manual connection setup')
 page.locator('[data-interest="party"]').check()
 page.wait_for_function("document.querySelector('#ticketStatus').textContent.startsWith('Keine passenden')")
 assert page.locator('.ticket-card').count()==0
 assert page.locator('.ticket-city-group').count()==3
 page.locator('[data-interest="music"]').check()
 page.wait_for_function("document.querySelectorAll('.ticket-card').length===3")
 page.reload()
 page.wait_for_function("document.querySelectorAll('.ticket-card').length===3")
 assert page.locator('[data-interest="party"]').is_checked()
 assert page.locator('[data-interest="music"]').is_checked()
 page.locator('#clearInterests').click()
 page.locator('[data-interest="fair"]').check()
 page.wait_for_function("document.querySelectorAll('.local-interest-link').length===3")
 assert page.locator('.ticket-card').count()==0
 assert 'Kirmes' in page.locator('.local-interest-link').first.inner_text()
 # Adding and removing a destination updates results automatically, preserving interests.
 page.locator('[data-interest="music"]').check()
 page.locator('#eventCity').fill('Wien')
 page.locator('#eventCityOptions [role=option]').first.wait_for()
 page.locator('#eventCityOptions [role=option]').first.click()
 page.wait_for_function("document.querySelectorAll('.ticket-city-group').length===4 && document.querySelectorAll('.ticket-card').length===4")
 assert page.locator('[data-interest="fair"]').is_checked()
 page.locator('[aria-label="Wien aus Veranstaltungsorten entfernen"]').click()
 page.wait_for_function("document.querySelectorAll('.ticket-city-group').length===3 && document.querySelectorAll('.ticket-card').length===3")
 assert 'Wien' not in page.locator('#ticketResults').inner_text()
 assert page.locator('[data-interest="music"]').is_checked()
 page.set_viewport_size({'width':390,'height':844})
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 assert not errors,errors
 print('PASS automatic destination addition/removal and preserved interests on mobile')
 print('PASS interest union, no unrelated results, per-city groups, persisted choices and local fair searches')
 browser.close()
