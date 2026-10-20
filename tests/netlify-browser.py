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
  route.fulfill(json={'events':[{'id':q['latitude'][0],'name':'Netlify-Testkonzert','date':q['start'][0],'time':'19:00','city':'Teststadt','venue':'Testbühne','status':'onsale','url':'https://www.ticketmaster.de/event/test'}]})
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
 browser.close()
