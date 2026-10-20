from datetime import date,timedelta
import os
import shutil
from urllib.parse import urlparse,parse_qs
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium') or None,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':1280,'height':900});errors=[];geo_requests=[];weather_requests=[];ticket_requests=[];pending=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 days=[str(date.today()+timedelta(days=i)) for i in range(-7,35)]
 def place(name,lat,country='Deutschland',region='Bayern'):
  return {'name':name,'latitude':lat,'longitude':11.08,'country':country,'admin1':region,'country_code':{'Deutschland':'DE','Frankreich':'FR','Vereinigte Staaten':'US','Tschechien':'CZ'}.get(country,'XX')}
 def geo(route):
  query=parse_qs(urlparse(route.request.url).query)['name'][0];geo_requests.append(query)
  if query=='Slow':pending.append(route);return
  if query=='Offline':route.abort();return
  if query=='Nichts':route.fulfill(json={'results':[]});return
  if query=='Paris':matches=[place('Paris',48.85,'Frankreich','Île-de-France'),place('Paris',33.66,'Vereinigte Staaten','Texas')]
  elif query.casefold()=='prag':matches=[place('Prag',50.075,'Tschechien','Prag')]
  else:matches=[place(query,{'Bamberg':49.89,'Nürnberg':49.45,'Schwabach':49.33}.get(query,49))]
  route.fulfill(json={'results':matches})
 def forecast(route):
  q=parse_qs(urlparse(route.request.url).query);weather_requests.append(q)
  route.fulfill(json={'timezone':'Europe/Berlin','daily':{'time':days,'weather_code':[0]*len(days),'temperature_2m_max':[20]*len(days),'precipitation_probability_max':[10]*len(days),'wind_speed_10m_max':[10]*len(days)}})
 def tickets(route):
  ticket_requests.append(parse_qs(urlparse(route.request.url).query));route.fulfill(json={'events':[]})
 page.route('https://geocoding-api.open-meteo.com/**',geo)
 page.route('https://api.open-meteo.com/**',forecast)
 page.route('https://test.netlify.app/.netlify/functions/events?**',tickets)
 page.goto(os.environ.get('RAUSZEIT_BASE_URL','http://127.0.0.1:8000/wochenende/'))
 page.wait_for_function("document.querySelectorAll('.city-weather-day').length===9")
 page.locator('.ticket-setup').click();page.locator('#ticketEndpoint').fill('https://test.netlify.app');page.locator('#ticketEndpointForm button').click()
 page.wait_for_function("document.querySelector('#ticketStatus').textContent.includes('Keine passenden')")
 # Debounce and keyboard selection.
 page.locator('#eventCity').fill('Pra');page.locator('#eventCity').fill('Prag')
 page.locator('#eventCityOptions [role=option]').first.wait_for()
 assert 'Pra' not in geo_requests
 assert 'Tschechien' in page.locator('#eventCityOptions').inner_text()
 assert page.locator('#eventCityOptions img').first.get_attribute('src').endswith('/cz.svg')
 page.locator('#eventCity').press('ArrowDown');assert page.locator('#eventCity').get_attribute('aria-activedescendant')=='event-city-option-0'
 page.locator('#eventCity').press('Enter')
 page.wait_for_function("RauszeitSelection().cities.length===4 && document.querySelectorAll('.city-weather-day').length===12")
 page.wait_for_function("document.querySelector('#ticketStatus').textContent.includes('Keine passenden')")
 assert any(q['latitude']==['50.075'] for q in weather_requests)
 assert any(q['latitude']==['50.075'] for q in ticket_requests)
 assert not any(name.startswith('Prag ·') for name in geo_requests)
 print('PASS live suggestions, debounce, region/country, keyboard selection and automatic exact-coordinate weather/event updates')
 # Old results must not replace the newest query.
 page.locator('#eventCity').fill('Slow');page.wait_for_timeout(400);assert pending
 page.locator('#eventCity').fill('Paris')
 page.locator('#eventCityOptions [role=option]').first.wait_for()
 try:pending.pop().fulfill(json={'results':[place('Old result',42)]})
 except Exception:pass
 assert 'Old result' not in page.locator('#eventCityOptions').inner_text()
 assert 'Texas' in page.locator('#eventCityOptions').inner_text()
 page.locator('#eventCityOptions [role=option]').nth(1).click()
 page.wait_for_function("document.querySelectorAll('.city-weather-day').length===15")
 assert page.locator('#eventCity').is_disabled()
 assert any(q['latitude']==['33.66'] for q in weather_requests)
 page.reload();page.wait_for_function("document.querySelectorAll('.city-weather-day').length===15")
 selected=page.evaluate('RauszeitSelection().cities')
 assert any(city['name']=='Paris' and city['place']['latitude']==33.66 for city in selected)
 print('PASS stale-query cancellation, five-city limit and persistence of the selected foreign place')
 # Selecting the same coordinates cannot add a duplicate; different Paris is allowed.
 page.locator('[aria-label="Prag aus Veranstaltungsorten entfernen"]').click()
 page.locator('#eventCity').fill('Paris');page.locator('#eventCityOptions [role=option]').first.wait_for()
 page.locator('#eventCityOptions [role=option]').nth(1).click()
 assert page.locator('.event-city-chip').count()==4
 assert 'bereits' in page.locator('#eventCityStatus').inner_text()
 page.locator('#eventCity').fill('Paris');page.locator('#eventCityOptions [role=option]').first.wait_for();page.locator('#eventCityOptions [role=option]').first.click()
 page.wait_for_function("document.querySelectorAll('.city-weather-day').length===15")
 selected=page.evaluate('RauszeitSelection().cities')
 assert {city['place']['latitude'] for city in selected if city['name'].startswith('Paris')}=={33.66,48.85}
 print('PASS coordinate-based duplicate protection and distinct equally named cities')
 page.locator('[aria-label="Bamberg aus Veranstaltungsorten entfernen"]').click()
 page.locator('#eventCity').fill('Nichts');page.wait_for_function("document.querySelector('#eventCityHint').textContent.includes('Keine Orte')")
 page.locator('#eventCity').fill('Offline');page.wait_for_function("document.querySelector('#eventCityHint').textContent.includes('nicht erreichbar')")
 page.locator('#eventCity').fill('Prag');page.locator('#eventCityOptions [role=option]').first.wait_for();page.locator('#eventCity').press('Escape');assert page.locator('#eventCityOptions').is_hidden()
 page.locator('#eventCity').fill('Pa');page.locator('#eventCity').fill('Paris');page.locator('#eventCityOptions [role=option]').first.wait_for()
 page.set_viewport_size({'width':390,'height':844})
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 page.locator('#eventCityForm').screenshot(path='/tmp/rauszeit-live-autocomplete.png')
 assert not errors,errors
 print('PASS empty/failing search, Escape dismissal, responsive suggestions and no JavaScript errors')
 legacy=browser.new_page()
 legacy.route('https://geocoding-api.open-meteo.com/**',geo);legacy.route('https://api.open-meteo.com/**',forecast)
 legacy.add_init_script("localStorage.setItem('rauszeit.eventCities.v1',JSON.stringify(['Bamberg','prag']))")
 legacy.goto(os.environ.get('RAUSZEIT_BASE_URL','http://127.0.0.1:8000/wochenende/'))
 legacy.wait_for_function("document.querySelectorAll('.city-weather-day').length===6")
 assert legacy.locator('.event-search-card h3').all_text_contents()==['Bamberg','Prag']
 assert 'Prag' in legacy.locator('#eventCities').inner_text()
 legacy.wait_for_function("[...document.querySelectorAll('.event-search-card .country-flag img')].every(image=>image.complete && image.naturalWidth>0)")
 assert legacy.locator('.event-search-card h3 img').nth(1).get_attribute('src').endswith('/cz.svg')
 legacy.locator('[aria-label="Prag aus Liste entfernen"]').click()
 assert legacy.locator('.event-search-card').count()==1
 assert legacy.locator('.top-result-card').count()==1
 assert all(city['name']!='prag' for city in legacy.evaluate('RauszeitSelection().cities'))
 print('PASS legacy prag displays as Prag with a locally loaded Czech flag; direct card deletion updates all results')
 legacy.close()
 browser.close()
