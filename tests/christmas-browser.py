from playwright.sync_api import sync_playwright
from urllib.parse import parse_qs,urlparse
from datetime import date,timedelta
import os,shutil
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=shutil.which('chromium'),args=['--no-sandbox'])
 context=browser.new_context(permissions=['geolocation'],geolocation={'latitude':48.86,'longitude':2.35},viewport={'width':390,'height':844})
 page=context.new_page();errors=[];market_calls=[];weather_calls=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 days=[str(date.today()+timedelta(days=i)) for i in range(-7,35)]
 def geo(route):
  name=parse_qs(urlparse(route.request.url).query)['name'][0]
  lat,lon,country=(48.85,2.35,'Frankreich') if name=='Paris' else (49.45,11.08,'Deutschland')
  route.fulfill(json={'results':[{'name':name,'latitude':lat,'longitude':lon,'country':country,'country_code':'FR' if name=='Paris' else 'DE'}]})
 def forecast(route):
  weather_calls.append(route.request.url)
  route.fulfill(json={'timezone':'Europe/Berlin','daily':{'time':days,'weather_code':[0]*len(days),'temperature_2m_max':[20]*len(days),'precipitation_probability_max':[10]*len(days),'wind_speed_10m_max':[10]*len(days)}})
 def markets(route):
  q=parse_qs(urlparse(route.request.url).query);market_calls.append(q)
  route.fulfill(json={'markets':[{'id':'node/1','name':'Weihnachtsmarkt am Platz','distanceKm':4.2,'city':'Teststadt','description':'Kleiner Markt auf dem historischen Platz.','mapUrl':'https://www.openstreetmap.org/node/1','website':'https://market.example.org'}],'radiusKm':100})
 page.route('https://geocoding-api.open-meteo.com/**',geo)
 page.route('https://api.open-meteo.com/**',forecast)
 page.route('**/.netlify/functions/events?**',lambda route:route.fulfill(json={'events':[]}))
 page.route('**/.netlify/functions/christmas-markets?**',markets)
 page.goto(os.environ.get('RAUSZEIT_NETLIFY_URL','http://127.0.0.1:8892/'))
 page.wait_for_function("document.querySelectorAll('.christmas-market-card').length===1")
 assert '4,2 km' in page.locator('#christmasResults').inner_text()
 assert 'historischen Platz' in page.locator('.christmas-description').inner_text()
 assert page.locator('#weihnachtsmaerkte .ticket-weather').count()==0
 # No date selection is needed, even if every date in the main planner is unchecked.
 for box in page.locator('[data-event-weekday]').all():box.uncheck()
 page.wait_for_timeout(600);before=len(weather_calls)
 page.locator('#christmasCity').fill('Paris');page.locator('#christmasCityForm button').click()
 page.wait_for_function("document.querySelector('#christmasOrigin').selectedOptions[0].textContent.includes('Paris') && document.querySelectorAll('.christmas-market-card').length===1")
 assert market_calls[-1]=={'latitude':['48.85'],'longitude':['2.35']}
 assert len(weather_calls)==before
 assert not any('start' in q or 'end' in q for q in market_calls)
 page.locator('#christmasGPS').click()
 page.wait_for_function("document.querySelector('#christmasOrigin').value==='gps' && document.querySelectorAll('.christmas-market-card').length===1")
 assert market_calls[-1]['latitude']==['48.86']
 assert len(weather_calls)==before
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 page.screenshot(path='/tmp/rauszeit-christmas-mobile.png',full_page=True)
 assert not errors,errors
 print('PASS independent city search, 100-km backend request, descriptions, GPS, no dates, no weather calls, mobile layout')
 context.close();browser.close()
