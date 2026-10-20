'use strict';
// Intentionally no event API or invented event listings: these links open external searches.
(() => {
  const key='rauszeit.eventCities.v1';
  const defaults=['Bamberg','Nürnberg','Schwabach'];
  const categories={
    all:{label:'Veranstaltungen',terms:'Veranstaltungen'},
    music:{label:'Konzerte & Musik',terms:'Konzerte Live-Musik'},
    culture:{label:'Kultur & Bühne',terms:'Kultur Theater Ausstellung'},
    markets:{label:'Märkte & Feste',terms:'Markt Flohmarkt Stadtfest'},
    family:{label:'Mit Kindern',terms:'Veranstaltungen Kinder Familie'},
    outdoor:{label:'Draußen & Sport',terms:'Outdoor Sport Wanderung Veranstaltung'}
  };
  const official={bamberg:'bamberg.info',nuernberg:'nuernberg.de',schwabach:'schwabach.de',fuerth:'fuerth.de',erlangen:'erlangen.de'};
  const normalized=value=>value.normalize('NFKC').trim().toLocaleLowerCase('de-DE').replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss').replace(/\s+/g,' ');
  const clean=value=>value.normalize('NFKC').replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e]/g,'').trim().replace(/\s+/g,' ');
  let cities=[...defaults];
  const weatherCache=new Map();
  let weatherEnabled=true;
  let weatherPending=0;
  function useWeekendRange() {
    const dates=weekends[Number($('#weekend').value)];
    const friday=new Date(dates[0]+'T12:00:00Z');friday.setUTCDate(friday.getUTCDate()-1);
    $('#eventStart').value=friday.toISOString().slice(0,10);$('#eventEnd').value=dates[1];
    document.querySelectorAll('[data-event-weekday]').forEach(input=>input.checked=[5,6,0].includes(Number(input.dataset.eventWeekday)));
  }
  function selectedDates() {
    const start=$('#eventStart').value,end=$('#eventEnd').value;
    if(!start || !end || end<start) {$('#eventDateStatus').textContent='Bitte wähle ein gültiges Von-/Bis-Datum.';return [];}
    const span=(Date.parse(end)-Date.parse(start))/86400000;
    if(span>30) {$('#eventDateStatus').textContent='Wähle bitte höchstens 31 Kalendertage auf einmal.';return [];}
    const days=new Set([...document.querySelectorAll('[data-event-weekday]:checked')].map(input=>Number(input.dataset.eventWeekday)));
    const result=[];
    for(let i=0;i<=span;i++) {const date=new Date(Date.parse(start)+i*86400000);if(days.has(date.getUTCDay()))result.push(date.toISOString().slice(0,10));}
    $('#eventDateStatus').textContent=result.length?`${result.length} Tag${result.length===1?'':'e'} ausgewählt. Wetterdaten sind nur innerhalb der verfügbaren Vorhersage verfügbar (bis zu 16 Tage).`:'Wähle mindestens einen Wochentag, der im Zeitraum liegt.';
    return result;
  }
  useWeekendRange();
  try {
    const saved=JSON.parse(localStorage.getItem(key));
    if(Array.isArray(saved)) {
      const seen=new Set();
      cities=saved.filter(value=>typeof value==='string').map(clean).filter(value=>{
        const id=normalized(value);
        if(value.length<2 || value.length>80 || seen.has(id)) return false;
        seen.add(id);return true;
      }).slice(0,5);
    }
  } catch { /* Keep the defaults if storage is unavailable or malformed. */ }
  function message(text) {$('#eventCityStatus').textContent=text;}
  function save() {
    try {localStorage.setItem(key,JSON.stringify(cities));return true;}
    catch {message('Die Ortsliste gilt für diese Sitzung. Dein Browser erlaubt das dauerhafte Speichern gerade nicht.');return false;}
  }
  function searchLink(label,query) {
    const link=document.createElement('a');
    const url=new URL('https://www.google.com/search');url.searchParams.set('q',query);
    link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';link.textContent=label+' →';
    return link;
  }
  function cityWeather(city,dates) {
    const container=document.createElement('div');container.className='city-weather';
    const entry=weatherCache.get(normalized(city));
    if(!entry) {container.textContent='Das Wetter wird automatisch geladen …';return container;}
    if(entry.pending) {container.textContent='Wetter wird geladen …';return container;}
    if(entry.error) {
      container.textContent=entry.error;
      const retry=document.createElement('button');retry.type='button';retry.className='save-button';retry.textContent='Erneut versuchen';
      retry.addEventListener('click',()=>loadCityWeather(city,true));container.append(retry);return container;
    }
    const resolved=document.createElement('p');resolved.className='city-resolved';resolved.textContent=[entry.place.name,entry.place.admin1,entry.place.country].filter(Boolean).join(', ');container.append(resolved);
    for(const date of dates) {
      const i=entry.data.daily.time.indexOf(date),row=document.createElement('div');row.className='city-weather-day';
      const label=document.createElement('strong');label.textContent=formatDate(date,{weekday:'short'});
      const values=document.createElement('span');
      const daily=entry.data.daily;
      const number=(v,suffix)=>finite(v)?Math.round(v)+suffix:'k. A.';
      if(i<0) values.textContent='Noch keine Vorhersage';
      else {
        const [icon,description]=weather(daily.weather_code?.[i]);
        values.textContent=`${icon} ${number(daily.temperature_2m_max?.[i],'°')} · Regen ${number(daily.precipitation_probability_max?.[i],'%')}`;
        values.title=description+' · Wind '+number(daily.wind_speed_10m_max?.[i],' km/h');
      }
      row.append(label,values);container.append(row);
      if(i>=0) {const description=document.createElement('p');description.className='city-weather-description';description.textContent=weather(daily.weather_code?.[i])[1]+' · Wind '+number(daily.wind_speed_10m_max?.[i],' km/h');container.append(description);}
    }
    if(entry.places?.length>1) {
      const label=document.createElement('label');label.className='city-match-label';label.textContent='Genauer Ort / Land';
      const select=document.createElement('select');select.setAttribute('aria-label',`Genauer Ort für ${city}`);
      entry.places.forEach((place,index)=>{
        const option=document.createElement('option');option.value=String(index);option.textContent=[place.name,place.admin1,place.country].filter(Boolean).join(', ');option.selected=placeKey(place)===placeKey(entry.place);select.append(option);
      });
      select.addEventListener('change',()=>loadCityWeather(city,true,entry.places[Number(select.value)]));label.append(select);container.append(label);
    }
    const note=document.createElement('p');note.className='source-note';note.textContent='Open-Meteo · Tageshöchstwert · '+(entry.data.timezone || 'Ortszeit');container.append(note);
    return container;
  }
  async function loadCityWeather(city,force=false,chosenPlace=null) {
    const id=normalized(city),existing=weatherCache.get(id);
    if(existing?.pending || (!force && existing?.data && Date.now()-existing.time<900000)) return;
    const entry={pending:true,places:existing?.places};weatherCache.set(id,entry);weatherPending++;
    $('#cityWeatherStatus').textContent='Wetter für deine Orte wird geladen …';renderSearches();
    const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),20000);
    try {
      let place=chosenPlace || existing?.place;
      if(!place) {
        const geo=new URL('https://geocoding-api.open-meteo.com/v1/search');geo.search=new URLSearchParams({name:city,count:'6',language:'de',format:'json'});
        const result=await requestJSON(geo,controller.signal);
        const matches=(result.results || []).filter(validPlace);
        if(!matches.length) throw new Error('Ort nicht gefunden. Bitte präzisiere den Ortsnamen.');
        entry.places=matches;
        const exact=matches.filter(candidate=>normalized(candidate.name)===id);
        const candidates=exact.length?exact:matches;
        place=(official[id]?candidates.find(candidate=>candidate.country_code==='DE'):null) || candidates[0];
      }
      entry.place=place;renderSearches();
      const url=new URL('https://api.open-meteo.com/v1/forecast');url.search=new URLSearchParams({latitude:String(place.latitude),longitude:String(place.longitude),daily:'weather_code,temperature_2m_max,precipitation_probability_max,wind_speed_10m_max',timezone:'auto',past_days:'1',forecast_days:'16'});
      const data=await requestJSON(url,controller.signal);
      if(!Array.isArray(data.daily?.time)) throw new Error('Keine nutzbaren Wetterdaten erhalten.');
      Object.assign(entry,{pending:false,place,data,time:Date.now()});
    } catch(error) {entry.pending=false;entry.error=error.name==='AbortError'?'Wetterabfrage hat zu lange gedauert.':error instanceof TypeError?'Wetterdienst nicht erreichbar. Bitte später erneut versuchen.':error.message;}
    finally {
      clearTimeout(timeout);weatherPending--;renderSearches();
      if(!weatherPending) {
        const failures=cities.filter(name=>weatherCache.get(normalized(name))?.error).length;
        $('#cityWeatherStatus').textContent=failures?'Einige Orte konnten nicht geladen werden. Die Veranstaltungssuche bleibt verfügbar.':'Wettervergleich aktualisiert. Vorhersagen können sich ändern.';
      }
    }
  }
  function renderTopResults(dates) {
    const results=[];
    for(const city of cities) {
      const entry=weatherCache.get(normalized(city));
      if(!entry?.data || entry.pending || entry.error) continue;
      let best=null;
      for(const date of dates) {
        const daily=entry.data.daily,index=daily.time.indexOf(date);
        if(index<0) continue;
        const day={code:daily.weather_code?.[index],temp:daily.temperature_2m_max?.[index],rain:daily.precipitation_probability_max?.[index],wind:daily.wind_speed_10m_max?.[index]};
        if(!Object.values(day).every(finite)) continue;
        const hazardous=[56,57,66,67,95,96,99].includes(day.code) || day.wind>=50;
        const score=100-day.rain*.65-Math.max(0,day.wind-10)*.5-Math.abs(day.temp-20)*1.5-(hazardous?100:0);
        if(!best || score>best.score) best={city,date,day,score,place:entry.place};
      }
      if(best) results.push(best);
    }
    results.sort((a,b)=>b.score-a.score);
    $('#topResultCards').replaceChildren();
    if(!results.length) {
      const empty=document.createElement('p');empty.className='events-empty';
      empty.textContent=!cities.length?'Füge einen Ort hinzu, um Vorschläge zu erhalten.':cities.some(city=>weatherCache.get(normalized(city))?.pending)?'Wir vergleichen gerade das Wetter deiner Orte …':'Noch keine vollständigen Wetterdaten für diesen Zeitraum. Nutze „Wetter aktualisieren“ oder wähle ein anderes Wochenende.';
      $('#topResultCards').append(empty);return;
    }
    results.slice(0,3).forEach((result,index)=>{
      const tip=recommendation(result.day),card=document.createElement('article');card.className='top-result-card';
      const badge=document.createElement('span');badge.className='top-rank';badge.textContent=`${index+1}. ${index===0?'Beste Wetteroption':'Weitere Wetteroption'}`;
      const title=document.createElement('h4');title.textContent=result.place.name;
      const date=document.createElement('p');date.className='top-date';date.textContent=formatDate(result.date,{weekday:'long',year:'numeric'});
      const facts=document.createElement('p');facts.className='top-weather';facts.textContent=`${weather(result.day.code)[0]} ${Math.round(result.day.temp)}° · Regen ${Math.round(result.day.rain)}% · Wind ${Math.round(result.day.wind)} km/h`;
      const activity=document.createElement('h5');activity.textContent=tip.icon+' '+tip.title;
      const description=document.createElement('p');description.textContent=tip.text;
      card.append(badge,title,date,facts,activity,description);
      if(tip.warning) {const warning=document.createElement('p');warning.className='warning';warning.textContent=tip.warning;card.append(warning);}
      $('#topResultCards').append(card);
    });
  }
  function renderSearches() {
    const dates=selectedDates();
    const label=dates.length?[dates[0],...(dates.length>1?[dates.at(-1)]:[])].map(date=>formatDate(date,{year:'numeric'})).join(' – '):'Keine Tage ausgewählt';
    renderTopResults(dates);
    const category=categories[$('#eventCategory').value] || categories.all;
    $('#eventWeekendLabel').textContent='Dein Zeitraum: '+label;
    const dateQuery=dates.length>1 ? '('+dates.map(date=>'"'+formatDate(date,{year:'numeric'})+'"').join(' OR ')+')' : '"'+(dates[0]?formatDate(dates[0],{year:'numeric'}):'')+'"';
    $('#eventSearchCards').replaceChildren();
    for(const city of cities) {
      const card=document.createElement('article');card.className='event-search-card';
      const title=document.createElement('h3');title.textContent=city;
      const date=document.createElement('p');date.textContent=label+' · '+category.label;
      card.append(title,date,cityWeather(city,dates));
      const links=document.createElement('details');links.className='event-external-links';
      const summary=document.createElement('summary');summary.textContent='Veranstaltungen & Kalender öffnen';links.append(summary);
      links.append(searchLink('Passende Veranstaltungen suchen',`${category.terms} ${city} ${dateQuery}`),searchLink('Veranstaltungskalender finden',`Veranstaltungskalender ${city}`));
      const domain=official[normalized(city)];
      if(domain) links.append(searchLink('Im offiziellen Kalender suchen',`site:${domain} ${category.terms} ${dateQuery}`));
      else links.append(searchLink('Tourist-Information & lokale Termine',`Tourist Information ${city} Veranstaltungen ${dateQuery}`));
      card.append(links);
      const weatherButton=document.createElement('button');weatherButton.type='button';weatherButton.className='event-weather';weatherButton.textContent='Wetter für diesen Ort ansehen →';
      weatherButton.addEventListener('click',()=>{ $('#city').value=city;searchCity(city);$('#planer').scrollIntoView({behavior:'smooth'}); });
      card.append(weatherButton);
      $('#eventSearchCards').append(card);
    }
    document.dispatchEvent(new CustomEvent('rauszeit:selection',{detail:{dates,category:$('#eventCategory').value,cities:cities.map(city=>({name:city,place:weatherCache.get(normalized(city))?.place || null}))}}));
    if(!cities.length) {
      const empty=document.createElement('p');empty.className='events-empty';empty.textContent='Füge oben deinen ersten Ort hinzu. Du kannst bis zu fünf Orte gleichzeitig vergleichen.';$('#eventSearchCards').append(empty);
    }
  }
  function renderCities() {
    $('#eventCities').replaceChildren();
    for(const city of cities) {
      const chip=document.createElement('span');chip.className='event-city-chip';
      const label=document.createElement('span');label.textContent=city;
      const remove=document.createElement('button');remove.type='button';remove.textContent='×';remove.setAttribute('aria-label',`${city} aus Veranstaltungsorten entfernen`);
      remove.addEventListener('click',()=>{cities=cities.filter(value=>value!==city);message(`${city} entfernt. ${cities.length} von 5 Orten ausgewählt.`);save();renderCities();});
      chip.append(label,remove);$('#eventCities').append(chip);
    }
    $('#addEventCity').disabled=cities.length>=5;
    $('#eventCity').disabled=cities.length>=5;
    $('#eventCity').placeholder=cities.length>=5?'Fünf Orte ausgewählt – zuerst einen entfernen':'Zum Beispiel Fürth, Wien oder Paris';
    renderSearches();
    if(weatherEnabled) cities.forEach(city=>loadCityWeather(city));
  }
  $('#eventCityForm').addEventListener('submit',event=>{
    event.preventDefault();
    const city=clean($('#eventCity').value);
    if(cities.length>=5) {message('Du kannst maximal fünf Orte eingeben. Entferne zuerst einen Ort.');return;}
    if(city.length<2 || city.length>80) {message('Bitte gib einen Ortsnamen mit 2 bis 80 Zeichen ein.');return;}
    if(cities.some(value=>normalized(value)===normalized(city))) {message(`${city} ist bereits ausgewählt.`);return;}
    cities.push(city);$('#eventCity').value='';
    message(`${city} hinzugefügt. ${cities.length} von 5 Orten ausgewählt.`);save();renderCities();
  });
  $('#loadCityWeather').addEventListener('click',()=>{weatherEnabled=true;cities.forEach(city=>loadCityWeather(city,true));if(!cities.length) $('#cityWeatherStatus').textContent='Füge zuerst einen Ort hinzu.';});
  $('#weekend').addEventListener('change',()=>{useWeekendRange();renderSearches();});
  $('#selectWeekendDays').addEventListener('click',()=>{useWeekendRange();renderSearches();});
  document.querySelectorAll('[data-date-preset]').forEach(button=>button.addEventListener('click',()=>{
    const preset=button.dataset.datePreset;
    if(preset==='calendar' || preset==='all') {document.querySelectorAll('[data-event-weekday]').forEach(input=>input.checked=true);renderSearches();if(preset==='calendar') {$('#eventStart').focus();try {$('#eventStart').showPicker?.();} catch {}}return;}
    const saturday=new Date(weekends[Number($('#weekend').value)][0]+'T12:00:00Z');
    const offsets={fr:[-1,-1],sa:[0,0],so:[1,1],workdays:[-5,-2],week:[-5,1]}[preset];
    const values=offsets.map(offset=>{const date=new Date(saturday);date.setUTCDate(date.getUTCDate()+offset);return date.toISOString().slice(0,10);});
    $('#eventStart').value=values[0];$('#eventEnd').value=values[1];
    const selectedDays={fr:[5],sa:[6],so:[0],workdays:[1,2,3,4],week:[0,1,2,3,4,5,6]}[preset];
    document.querySelectorAll('[data-event-weekday]').forEach(input=>input.checked=selectedDays.includes(Number(input.dataset.eventWeekday)));renderSearches();
  }));
  $('#selectNextDays').addEventListener('click',()=>{const now=new Date();const start=new Date(Date.UTC(now.getFullYear(),now.getMonth(),now.getDate()));$('#eventStart').value=start.toISOString().slice(0,10);start.setUTCDate(start.getUTCDate()+6);$('#eventEnd').value=start.toISOString().slice(0,10);document.querySelectorAll('[data-event-weekday]').forEach(input=>input.checked=true);renderSearches();});
  ['#eventStart','#eventEnd'].forEach(selector=>$(selector).addEventListener('change',renderSearches));
  document.querySelectorAll('[data-event-weekday]').forEach(input=>input.addEventListener('change',renderSearches));
  $('#eventCategory').addEventListener('change',renderSearches);
  window.RauszeitCityWeather=(city,date)=>{
    const entry=weatherCache.get(normalized(city));if(!entry?.data || entry.pending || entry.error) return null;
    const daily=entry.data.daily,index=daily.time.indexOf(date);if(index<0) return null;
    const temperature=daily.temperature_2m_max?.[index],rain=daily.precipitation_probability_max?.[index];
    if(!finite(temperature) || !finite(rain)) return null;
    return `${weather(daily.weather_code?.[index])[0]} ${Math.round(temperature)}° Tagesmaximum · Regenrisiko ${Math.round(rain)}% am Zielort`;
  };
  window.RauszeitSelection=()=>({dates:selectedDates(),cities:cities.map(city=>({name:city,place:weatherCache.get(normalized(city))?.place || null})),category:$('#eventCategory').value});
  message(`${cities.length} von 5 Orten ausgewählt. Die Liste bleibt in diesem Browser gespeichert.`);
  renderCities();
})();
