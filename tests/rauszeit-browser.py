from datetime import date,timedelta
import os
import shutil
from urllib.parse import urlparse,parse_qs
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium') or None,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':1440,'height':1050});errors=[];ticket_calls=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 today=date.today();dates=[str(today+timedelta(days=i)) for i in range(-7,40)]
 def geo(route):
  name=parse_qs(urlparse(route.request.url).query)['name'][0]
  lat={'Bamberg':49.89,'Nürnberg':49.45,'Schwabach':49.33,'Wien':48.2,'Paris':48.85}.get(name,49)
  route.fulfill(json={'results':[{'name':name,'latitude':lat,'longitude':11.08,'country':'Deutschland','country_code':'DE','admin1':'Bayern'}]})
 def weather(route):
  lat=float(parse_qs(urlparse(route.request.url).query)['latitude'][0]);rain=5 if lat==49.89 else 75
  route.fulfill(json={'timezone':'Europe/Berlin','daily':{'time':dates,'weather_code':[0 if rain==5 else 61]*len(dates),'temperature_2m_max':[20]*len(dates),'temperature_2m_min':[8]*len(dates),'precipitation_probability_max':[rain]*len(dates),'wind_speed_10m_max':[10]*len(dates),'precipitation_sum':[0]*len(dates)}})
 page.route('https://geocoding-api.open-meteo.com/**',geo);page.route('https://api.open-meteo.com/**',weather)
 page.goto(os.environ.get('RAUSZEIT_BASE_URL','http://127.0.0.1:8000/wochenende/'))
 page.wait_for_function("document.querySelectorAll('.city-weather-day').length===9")
 assert page.locator('.top-result-card').count()==3
 assert page.locator('.top-result-card h4').first.inner_text()=='Bamberg'
 assert 'noch nicht verbunden' in page.locator('#ticketStatus').inner_text()
 assert len(page.evaluate('RauszeitSelection().dates'))==3
 for preset,count in [('fr',1),('sa',1),('so',1),('workdays',4),('week',7)]:
  page.locator('[data-date-preset="'+preset+'"]').click()
  assert len(page.evaluate('RauszeitSelection().dates'))==count
  assert page.locator('.city-weather-day').count()==count*3
 page.locator('#selectWeekendDays').click()
 assert len(page.evaluate('RauszeitSelection().dates'))==3
 # Independent calendar dates and weekday filtering.
 page.locator('[data-date-preset="all"]').click()
 page.locator('#eventStart').fill(str(today));page.locator('#eventStart').dispatch_event('change')
 page.locator('#eventEnd').fill(str(today+timedelta(days=6)));page.locator('#eventEnd').dispatch_event('change')
 assert len(page.evaluate('RauszeitSelection().dates'))==7
 page.locator('[data-event-weekday="0"]').uncheck();assert len(page.evaluate('RauszeitSelection().dates'))==6
 page.locator('#selectWeekendDays').click()
 print('PASS automatic weather, weather ranking, Friday/Saturday/Sunday/week/workday presets, custom calendar and weekday filtering')
 def tickets(route):
  q=parse_qs(urlparse(route.request.url).query);ticket_calls.append(q)
  start=date.fromisoformat(q['start'][0]);end=date.fromisoformat(q['end'][0]);lat=q['latitude'][0]
  events=[{'id':lat+str(start),'name':'Live Konzert <img src=x onerror=alert(1)>','date':str(start),'time':'19:00','city':'Bamberg','venue':'Testhalle','status':'onsale','url':'https://www.ticketmaster.de/event/123'}, {'id':'shared','name':'Gemeinsamer Treffer','date':str(end),'time':None,'city':'Nürnberg','venue':'Bühne','status':'onsale','url':'javascript:alert(1)'}]
  route.fulfill(json={'events':events,'source':'Ticketmaster'})
 page.route('https://rauszeit-test.netlify.app/.netlify/functions/events?**',tickets)
 page.locator('.ticket-setup').click()
 page.locator('#ticketEndpoint').fill('https://rauszeit-test.netlify.app');page.locator('#ticketEndpointForm button').click()
 page.wait_for_function("document.querySelectorAll('.ticket-card').length===4")
 assert page.locator('.ticket-card img').count()==0
 assert page.locator('.ticket-card a[href^="javascript"]').count()==0
 assert page.locator('.ticket-weather').count()==4
 assert 'Gemeinsamer Treffer' in page.locator('#ticketResults').inner_text()
 assert page.locator('.ticket-card h4').all_text_contents().count('Gemeinsamer Treffer')==1
 page.locator('[data-date-preset="sa"]').click()
 page.wait_for_function("document.querySelectorAll('.ticket-card').length===4 && document.querySelector('#ticketStatus').textContent.includes('direkt angezeigt')")
 assert all(q['start'][0]==q['end'][0] for q in ticket_calls[-3:])
 page.locator('#eventCategory').select_option('music')
 page.wait_for_timeout(500)
 assert ticket_calls[-1]['category']==['music']
 page.route('https://strato-test.example/wochenende/api/events.php?**',tickets)
 page.locator('#ticketEndpoint').fill('https://strato-test.example/wochenende/api/events.php')
 page.locator('#ticketEndpointForm button').click()
 page.wait_for_function("document.querySelectorAll('.ticket-card').length===4")
 assert page.evaluate("localStorage.getItem('rauszeit.ticketBackend.v1')").endswith('/wochenende/api/events.php')
 print('PASS STRATO PHP backend URL connection')
 print('PASS backend connection, real-schema event cards, weather on tickets, safe text/links, deduplication, date/category API parameters')
 page.screenshot(path='/tmp/rauszeit-results-desktop.png',full_page=True)
 page.set_viewport_size({'width':390,'height':844})
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 page.locator('#veranstaltungen').screenshot(path='/tmp/rauszeit-results-mobile.png')
 # No day selected must clear stale event and weather results.
 for checkbox in page.locator('[data-event-weekday]').all():checkbox.uncheck()
 page.wait_for_function("document.querySelector('#ticketStatus').textContent.includes('gültigen Tag')")
 assert page.locator('.ticket-card').count()==0
 assert page.locator('.city-weather-day').count()==0
 # Weather outages must not block the separately configured event backend.
 page.locator('#selectWeekendDays').click()
 page.route('https://api.open-meteo.com/**',lambda route:route.abort())
 page.locator('#loadCityWeather').click()
 page.wait_for_function("document.querySelectorAll('.city-weather').length===3 && [...document.querySelectorAll('.city-weather')].every(element=>element.textContent.includes('nicht erreichbar'))")
 page.wait_for_function("document.querySelectorAll('.ticket-card').length===4")
 assert all('Noch keine Wettervorhersage' in text for text in page.locator('.ticket-weather').all_text_contents())
 print('PASS Ticketmaster results remain usable during a weather outage')
 assert not errors,errors
 print('PASS mobile layout and stale-result clearing when no valid day is selected; no JavaScript errors')
 browser.close()
