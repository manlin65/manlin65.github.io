'use strict';
const $ = selector => document.querySelector(selector);
const STORAGE = 'rauszeit.favorites.v1';
const state = { place: null, data: null, demo: false, controller: null, searching: null, favorites: [] };
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const formatDate = (date, options = {}) => new Intl.DateTimeFormat('de-DE', {day:'2-digit',month:'2-digit',...options,timeZone:'UTC'}).format(new Date(date+'T12:00:00Z'));
function weekendDates(now = new Date()) {
  // Saturday remains selected on Sunday, so both days of the current weekend are visible.
  const date = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const day = date.getUTCDay();
  date.setUTCDate(date.getUTCDate() + (day === 0 ? -1 : (6-day+7)%7));
  return [0,7].map(offset => {
    const saturday = new Date(date); saturday.setUTCDate(date.getUTCDate()+offset);
    const sunday = new Date(saturday); sunday.setUTCDate(saturday.getUTCDate()+1);
    return [saturday.toISOString().slice(0,10), sunday.toISOString().slice(0,10)];
  });
}
const weekends = weekendDates();
weekends.forEach((days,index) => {
  const option=document.createElement('option'); option.value=String(index);
  option.textContent=`${index ? 'Darauffolgendes' : 'Dieses'} · ${formatDate(days[0])} – ${formatDate(days[1])}`;
  $('#weekend').append(option);
});
function validPlace(place) {
  return place && typeof place.name === 'string' && place.name.length <= 200 && Number.isFinite(place.latitude) && Math.abs(place.latitude)<=90 && Number.isFinite(place.longitude) && Math.abs(place.longitude)<=180;
}
try {
  const saved=JSON.parse(localStorage.getItem(STORAGE) || '[]');
  if(Array.isArray(saved)) state.favorites=saved.filter(validPlace).slice(0,20);
} catch { /* Private browsing or invalid stored data must not break the planner. */ }
function placeKey(place) { return `${place.latitude.toFixed(4)},${place.longitude.toFixed(4)}`; }
function locationDetail(place) { return [place.admin1,place.country].filter(Boolean).join(', '); }
function setStatus(message,error=false) { $('#status').textContent=message; $('#status').classList.toggle('error',error); }
async function requestJSON(url,signal) {
  const response=await fetch(url,{signal});
  if(!response.ok) throw new Error(response.status===429 ? 'Zu viele Anfragen. Bitte versuche es in einer Minute erneut.' : `Der Wetterdienst antwortet mit HTTP ${response.status}. Bitte später erneut versuchen.`);
  const data=await response.json();
  if(data.error) throw new Error('Der Wetterdienst konnte die Anfrage nicht verarbeiten.');
  return data;
}
async function searchCity(name) {
  name=name.trim(); if(name.length<2) { setStatus('Bitte gib mindestens zwei Buchstaben ein.',true); return; }
  state.searching?.abort(); const controller=new AbortController(); state.searching=controller;
  $('#searchButton').disabled=true; $('#searchResults').hidden=true;
  setStatus(`Suche nach „${name}“ …`);
  const timeout=setTimeout(()=>controller.abort('timeout'),15000);
  try {
    const url=new URL('https://geocoding-api.open-meteo.com/v1/search');
    url.search=new URLSearchParams({name,count:'6',language:'de',format:'json'});
    const data=await requestJSON(url,controller.signal);
    const places=(data.results || []).filter(validPlace);
    if(!places.length) { setStatus('Kein Ort gefunden. Versuche einen größeren Ort in der Nähe oder eine andere Schreibweise.'); return; }
    $('#searchResults').replaceChildren();
    for(const place of places) {
      const button=document.createElement('button'); button.type='button';
      button.innerHTML=`<strong>${escapeHTML(place.name)}</strong><small>${escapeHTML(locationDetail(place))}</small>`;
      button.addEventListener('click',()=>selectPlace(place)); $('#searchResults').append(button);
    }
    $('#searchResults').hidden=false; setStatus('Wähle den passenden Ort aus der Liste.');
  } catch(error) {
    if(state.searching!==controller) return;
    if(controller.signal.reason === 'timeout') setStatus('Die Ortssuche dauert zu lange. Bitte erneut versuchen.',true);
    else if(error.name!=='AbortError') setStatus(error instanceof TypeError ? 'Die Ortssuche ist gerade nicht erreichbar. Prüfe deine Internetverbindung oder entdecke die Demo.' : error.message,true);
  } finally { clearTimeout(timeout); if(state.searching===controller) $('#searchButton').disabled=false; }
}
async function selectPlace(place) {
  state.searching?.abort(); $('#searchButton').disabled=false;
  state.controller?.abort(); const controller=new AbortController(); state.controller=controller;
  state.place=place; state.data=null; state.demo=false;
  $('#city').value=place.name; $('#searchResults').hidden=true; $('#forecast').hidden=true;
  setStatus(`Lade Wochenendwetter für ${place.name} …`);
  const timeout=setTimeout(()=>controller.abort('timeout'),15000);
  try {
    const url=new URL('https://api.open-meteo.com/v1/forecast');
    url.search=new URLSearchParams({latitude:String(place.latitude),longitude:String(place.longitude),daily:'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max',timezone:'auto',past_days:'1',forecast_days:'16'});
    const data=await requestJSON(url,controller.signal);
    if(!data.daily || !Array.isArray(data.daily.time)) throw new Error('Der Wetterdienst hat keine nutzbare Vorhersage geliefert.');
    if(state.controller!==controller) return;
    state.data=data; renderForecast();
  } catch(error) {
    if(state.controller!==controller) return;
    if(controller.signal.reason==='timeout') setStatus('Die Wetterabfrage dauert zu lange. Wähle den Ort erneut, um es noch einmal zu versuchen.',true);
    else if(error.name!=='AbortError') setStatus(error instanceof TypeError ? 'Wetterdaten sind gerade nicht erreichbar. Prüfe deine Internetverbindung oder nutze die gekennzeichnete Demo.' : error.message,true);
  } finally { clearTimeout(timeout); }
}
function weather(code) {
  if(code===0) return ['☀️','Klarer Himmel'];
  if([1,2].includes(code)) return ['🌤️','Überwiegend freundlich'];
  if(code===3) return ['☁️','Bedeckt'];
  if([45,48].includes(code)) return ['🌫️','Nebel'];
  if([71,73,75,77,85,86].includes(code)) return ['🌨️','Schnee'];
  if([95,96,99].includes(code)) return ['⛈️','Gewitter möglich'];
  if([51,53,55,56,57,61,63,65,66,67,80,81,82].includes(code)) return ['🌧️','Regen oder Schauer'];
  return ['🌡️','Wetterlage unklar'];
}
const finite = value => typeof value==='number' && Number.isFinite(value);
function recommendation(day) {
  const {code,temp,rain,wind}=day;
  if(![code,temp,rain,wind].every(finite)) return {icon:'☕',title:'Mit Spielraum planen',text:'Ein Teil der Wetterdaten fehlt. Halte eine wetterunabhängige Alternative bereit.',extra:'Café · Ausstellung · Buchhandlung',tag:'FLEXIBEL BLEIBEN'};
  if([95,96,99].includes(code) || wind>=50 || [56,57,66,67].includes(code)) return {icon:'🏛️',title:'Zeit für Kultur',text:'Heute ist ein wettergeschützter Ausflug die bessere Wahl. Wie wäre es mit einem Museum oder einer Ausstellung?',extra:'Museum · Galerie · gemütliches Café',tag:'LIEBER DRINNEN',warning:'Gewitter, Glätte oder kräftiger Wind möglich. Prüfe die örtlichen Warnungen und verzichte auf exponierte Touren.'};
  if(rain>=55 || [61,63,65,80,81,82].includes(code)) return {icon:'🎨',title:'Ein Dach über den Ideen',text:'Mit Regen ist zu rechnen. Entdecke eine Ausstellung, ein Museum oder ein neues Café und halte kurze Wege flexibel.',extra:'Ausstellung · Stadtmuseum · Café',tag:'REGENPLAN'};
  if(temp<=3 || [71,73,75,77,85,86].includes(code)) return {icon:'🧣',title:'Frische Luft, warme Pause',text:'Ein kurzer Spaziergang mit anschließendem Heißgetränk passt gut. Achte auf glatte Wege und warme Kleidung.',extra:'Parkrunde · Altstadt · Teehaus',tag:'GEMÜTLICH UNTERWEGS'};
  if(temp>=30) return {icon:'🌳',title:'Ab in den Schatten',text:'Plane eine kurze Runde am Morgen oder einen schattigen Parkbesuch. Nimm ausreichend Wasser und Sonnenschutz mit.',extra:'Waldweg · schattiger Park · Eiscafé',tag:'ENTSPANNT DURCH DIE HITZE'};
  if(rain<30 && wind<30 && temp>=12) return {icon:'🥾',title:'Raus auf die schönen Wege',text:'Gute Bedingungen für einen Spaziergang, eine gemütliche Radtour oder ein Picknick. Suche dir eine Route, die zu dir passt.',extra:'Wanderweg · Radtour · Picknick im Grünen',tag:'AB NACH DRAUSSEN'};
  return {icon:'🏘️',title:'Einfach mal treiben lassen',text:'Ein Stadtbummel mit flexiblen Pausen ist eine gute Idee. Packe eine leichte Regenjacke ein und entdecke neue Ecken.',extra:'Altstadt · Wochenmarkt · Café-Stopp',tag:'EIN BISSCHEN VON ALLEM'};
}
function renderForecast() {
  if(!state.data) return;
  const dates=window.RauszeitSelection?window.RauszeitSelection().dates:weekends[Number($('#weekend').value)];
  if(!dates.length) {$('#forecast').hidden=true;return;}
  const daily=state.data.daily;
  const number=(value,suffix='',digits=0)=>finite(value) ? value.toLocaleString('de-DE',{maximumFractionDigits:digits})+suffix : 'k. A.';
  const cards=dates.map((date,index)=>{
    const i=daily.time.indexOf(date);
    if(i<0) return `<article class="day-card"><div class="day-top"><strong>${formatDate(date,{weekday:'long'}).split(',')[0]}</strong>${formatDate(date)}</div><p>Für diesen Tag liegen noch keine Wetterdaten vor.</p></article>`;
    const day={code:daily.weather_code?.[i],temp:daily.temperature_2m_max?.[i],rain:daily.precipitation_probability_max?.[i],wind:daily.wind_speed_10m_max?.[i]};
    const [symbol,label]=weather(day.code); const tip=recommendation(day);
    return `<article class="day-card"><div class="day-top"><strong>${formatDate(date,{weekday:'long'}).split(',')[0]}</strong><span>${formatDate(date,{year:'numeric'})}</span></div><div class="weather-main"><span class="weather-symbol" aria-hidden="true">${symbol}</span><div><div class="temperature">${number(day.temp,'°')}</div><div class="weather-label">${label} · Tiefstwert ${number(daily.temperature_2m_min?.[i],'°')}</div></div></div><div class="weather-stats"><span>☂ Regenrisiko ${number(day.rain,'%')}</span><span>≋ Wind ${number(day.wind,' km/h')}</span><span>Regen ${number(daily.precipitation_sum?.[i],' mm',1)}</span></div><div class="activity"><span class="activity-icon" aria-hidden="true">${tip.icon}</span><div><span class="activity-tag">${tip.tag}</span><h4>${tip.title}</h4><p>${tip.text}</p></div></div><p class="extras">Weitere Ideen: ${tip.extra}</p>${tip.warning?`<p class="warning">${tip.warning}</p>`:''}</article>`;
  }).join('');
  const saved=state.favorites.some(p=>placeKey(p)===placeKey(state.place));
  $('#forecast').innerHTML=`<div class="forecast-heading"><div>${state.demo?'<span class="demo-badge">DEMO · BEISPIELDATEN</span>':''}<h3>${escapeHTML(state.place.name)}</h3><p>${escapeHTML(locationDetail(state.place))}</p></div><button type="button" class="save-button" id="savePlace" ${saved?'disabled':''}>${saved?'✓ Ort gemerkt':'♡ Ort merken'}</button></div><div class="days-grid">${cards}</div><p class="source-note">${state.demo?'Fiktive Wetterdaten zum Ausprobieren, keine aktuelle Vorhersage.':'Quelle: Open-Meteo · Zeitzone am Ziel: '+escapeHTML(state.data.timezone || 'Ortszeit')+' · Vorhersagen können sich ändern; weiter entfernte Termine sind unsicherer.'}</p>`;
  $('#forecast').hidden=false;
  $('#savePlace').addEventListener('click',savePlace);
  setStatus(state.demo?'Du siehst eine Demo. Über die Ortssuche erhältst du echte Vorhersagen.':'Dein Wochenendüberblick ist da. Wähle oben ein anderes Wochenende, um weiterzuplanen.');
}
function renderFavorites() {
  $('#favoriteCount').textContent=String(state.favorites.length);
  $('#favorites').replaceChildren();
  if(!state.favorites.length) { $('#favorites').innerHTML='<div class="empty-favorites">♡ Hier ist noch Platz für schöne Ziele. Gib oben einen Ort ein und wähle beim Wetterüberblick „Ort merken“.</div>'; return; }
  state.favorites.forEach(place=>{
    const wrapper=document.createElement('div'); wrapper.className='favorite';
    const open=document.createElement('button'); open.type='button';
    open.innerHTML=`${escapeHTML(place.name)} <small>${escapeHTML(locationDetail(place))}</small>`;
    open.addEventListener('click',()=>{ selectPlace(place); $('#planer').scrollIntoView({behavior:'smooth'}); });
    const remove=document.createElement('button'); remove.type='button'; remove.className='remove'; remove.textContent='×'; remove.setAttribute('aria-label',`${place.name} aus Lieblingsorten entfernen`);
    remove.addEventListener('click',()=>{
      const next=state.favorites.filter(p=>placeKey(p)!==placeKey(place));
      if(persist(next)) {state.favorites=next; renderFavorites(); if(state.data) renderForecast();}
    });
    wrapper.append(open,remove); $('#favorites').append(wrapper);
  });
}
function persist(places) {try {localStorage.setItem(STORAGE,JSON.stringify(places)); return true;} catch {setStatus('Dein Browser erlaubt das Speichern gerade nicht. Das Wetter kannst du trotzdem nutzen.',true);return false;}}
function savePlace() {
  if(!state.place || state.favorites.some(p=>placeKey(p)===placeKey(state.place))) return;
  if(state.favorites.length>=20) {setStatus('Du hast bereits 20 Lieblingsorte. Entferne zuerst einen Ort.',true);return;}
  const {name,latitude,longitude,admin1,country}=state.place;
  const next=[...state.favorites,{name,latitude,longitude,admin1,country}];
  if(persist(next)) {state.favorites=next;renderFavorites();renderForecast();setStatus(`${name} ist jetzt in deinen Lieblingsorten gespeichert.`);}
}
function showDemo() {
  state.searching?.abort(); state.controller?.abort(); $('#searchButton').disabled=false;
  state.demo=true; state.place={name:'Nürnberg',latitude:49.4521,longitude:11.0767,admin1:'Bayern',country:'Deutschland'};
  state.data={timezone:'Europe/Berlin',daily:{time:weekends.flat(),weather_code:[2,61,3,0],temperature_2m_max:[18,14,16,20],temperature_2m_min:[9,8,7,10],precipitation_probability_max:[15,75,30,5],precipitation_sum:[0,6.2,0.4,0],wind_speed_10m_max:[12,24,18,9]}};
  $('#searchResults').hidden=true;renderForecast();
}
$('#searchForm').addEventListener('submit',event=>{event.preventDefault();searchCity($('#city').value);});
document.querySelectorAll('[data-city]').forEach(button=>button.addEventListener('click',()=>{$('#city').value=button.dataset.city;searchCity(button.dataset.city);}));
$('#weekend').addEventListener('change',renderForecast);
$('#demoButton').addEventListener('click',showDemo);
renderFavorites();

document.addEventListener('rauszeit:selection',()=>{if(state.data) renderForecast();});
