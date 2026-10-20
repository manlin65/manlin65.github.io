'use strict';
(() => {
  const STORAGE='rauszeit.ticketBackend.v1';
  const cache=new Map();let backend='',generation=0,controller=null,timer=null;
  function validateBackend(value) {
    if(!value) return '';
    const url=new URL(value);
    if(url.protocol!=='https:' && !(url.protocol==='http:' && ['localhost','127.0.0.1'].includes(url.hostname))) throw new Error('Bitte eine HTTPS-Adresse deines Rauszeit-Backends eingeben.');
    if(url.username || url.password || url.search || url.hash || !(['','/','/.netlify/functions/events'].includes(url.pathname) || url.pathname.endsWith('/api/events.php'))) throw new Error('Bitte nur die öffentliche Backend-Adresse eingeben, ohne Schlüssel oder Zusatzparameter.');
    return ['','/'].includes(url.pathname)?new URL('/.netlify/functions/events',url.origin).href:url.href;
  }
  try {backend=validateBackend(localStorage.getItem(STORAGE) || window.RAUSZEIT_CONFIG?.eventApiUrl || window.RAUSZEIT_CONFIG?.eventApiBase || ((location.hostname.endsWith('.netlify.app') || ['localhost','127.0.0.1'].includes(location.hostname) && location.port==='8888')?location.origin:''));} catch {}
  $('#ticketEndpoint').value=backend;
  const status=message=>{$('#ticketStatus').textContent=message;};
  const safeURL=value=>{try {const url=new URL(value);return url.protocol==='https:'?url.href:null;}catch{return null;}};
  function renderCards(items,dates,interests,container,audience) {
    const events=window.RauszeitInterests.top(items,dates,interests,audience);
    for(const event of events) {
      const card=document.createElement('article');card.className='ticket-card';
      const city=document.createElement('p');city.className='ticket-city';city.textContent=event.city || event.searchCity;
      const heading=document.createElement('h4');heading.textContent=event.name;
      const date=document.createElement('p');date.className='ticket-date';date.textContent=formatDate(event.date,{weekday:'short',year:'numeric'})+(event.time?' · '+event.time:' · Uhrzeit noch offen');
      const venue=document.createElement('p');venue.textContent=event.venue || 'Veranstaltungsort noch offen';
      card.append(city,heading,date,venue);
      const forecast=event.forecast;
      if(forecast) {const weatherText=document.createElement('p');weatherText.className='ticket-weather';weatherText.textContent=forecast;card.append(weatherText);}
      else {const weatherText=document.createElement('p');weatherText.className='ticket-weather';weatherText.textContent='Noch keine Wettervorhersage für diesen Termin.';card.append(weatherText);}
      if(event.status && !['onsale','unknown'].includes(event.status)) {const note=document.createElement('p');note.className='ticket-status-note';note.textContent=({offsale:'Derzeit nicht im Verkauf',postponed:'Verschoben – Termin beim Veranstalter prüfen',rescheduled:'Neuer Termin – Angaben beim Veranstalter prüfen'})[event.status] || 'Ticketstatus beim Anbieter prüfen';card.append(note);}
      if(event.timeNote) {const note=document.createElement('p');note.textContent=event.timeNote;card.append(note);}
      const href=safeURL(event.url);
      if(href) {const link=document.createElement('a');link.href=href;link.target='_blank';link.rel='noopener noreferrer';link.textContent=event.sourceId && event.sourceId!=='ticketmaster'?'Veranstaltung öffnen →':'Details & Tickets →';card.append(link);}
      const source=document.createElement('small');source.textContent='Quelle: '+(Array.isArray(event.sources)?event.sources.join(' · '):event.source || 'Ticketmaster')+' · Ortszeit am Veranstaltungsort';card.append(source);
      if(event.sourceNote) {const note=document.createElement('small');note.className='event-source-note';note.textContent=event.sourceNote;card.append(note);}
      container.append(card);
    }
    return events.length;
  }
  function renderSources(results) {
    const statuses=new Map();
    for(const {data} of results) for(const source of data.sources || [{id:'ticketmaster',name:'Ticketmaster',status:'ok'}]) {
      const key=source.id+'|'+source.status;
      if(!statuses.has(key)) statuses.set(key,source);
    }
    const labels={ok:'automatisch abgefragt',manual:'manuell gepflegt',error:'derzeit nicht erreichbar',not_configured:'nicht angeschlossen'};
    $('#eventSourceList').replaceChildren();
    for(const source of statuses.values()) {
      const item=document.createElement('li');item.textContent=source.name+' · '+(labels[source.status] || 'Status unbekannt')+(source.notice?' – '+source.notice:'');$('#eventSourceList').append(item);
    }
    $('#eventSourceSummary').textContent='Veranstaltungsquellen · '+[...statuses.values()].filter(source=>source.status==='ok').length+' automatisch · '+[...statuses.values()].filter(source=>source.status==='manual').length+' manuell';
  }
  async function refresh(force=false) {
    const current=window.RauszeitSelection?.();if(!current) return;
    const myGeneration=++generation;controller?.abort();controller=new AbortController();
    const signal=controller.signal;
    $('#ticketResults').replaceChildren();
    $('#eventSourceSummary').textContent='Veranstaltungsquellen';$('#eventSourceList').replaceChildren();
    if(!current.dates.length || !current.cities.length) {status('Wähle mindestens einen Ort und einen gültigen Tag.');return;}
    if(!backend) {status('Echte Veranstaltungstermine sind noch nicht verbunden. Wetter und Ausflugstipps werden bereits angezeigt. Über „Veranstaltungssuche verbinden“ kannst du das eingerichtete Backend anschließen.');return;}
    const resolved=current.cities.filter(city=>city.place);
    if(!resolved.length) {status('Die Orte werden zuerst für die Veranstaltungssuche aufgelöst …');return;}
    status('Suche echte Veranstaltungen für deine Orte …');
    const timeout=setTimeout(()=>controller?.signal===signal && controller.abort(),18000);
    try {
      const results=await Promise.all(resolved.map(async city=>{
        const dates=current.dates,key=JSON.stringify([backend,placeKey(city.place),dates[0],dates.at(-1),current.category]);
        const cached=cache.get(key);
        if(!force && cached && cached.expires>Date.now()) return {city,data:cached.data};
        const url=new URL(backend);
        url.search=new URLSearchParams({latitude:String(city.place.latitude),longitude:String(city.place.longitude),start:dates[0],end:dates.at(-1),category:current.category || 'all'});
        try {
          const response=await fetch(url,{signal});
          let data;try {data=await response.json();} catch {throw new Error('Die Backend-Adresse liefert keine Veranstaltungsdaten. Bitte die PHP- oder Netlify-Bereitstellung prüfen.');}
          if(!response.ok) throw new Error(data.error || 'Veranstaltungssuche derzeit nicht verfügbar.');
          if(!Array.isArray(data.events)) throw new Error('Das Backend hat keine gültige Veranstaltungsliste geliefert.');
          if(cache.size>100) cache.clear();cache.set(key,{data,expires:Date.now()+300000});return {city,data};
        } catch(error) {if(error.name==='AbortError') throw error;return {city,error:error.message};}
      }));
      if(myGeneration!==generation) return;
      const failures=results.filter(result=>result.error),successes=results.filter(result=>result.data);
      let count=0;
      for(const {city,data,error} of results) {
        const group=document.createElement('section');group.className='ticket-city-group';
        const title=document.createElement('h4');title.className='ticket-group-title';title.textContent='Top-Ereignisse für '+(city.place.name || city.name)+' & Umgebung';
        const grid=document.createElement('div');grid.className='ticket-grid';group.append(title,grid);
        const events=(data?.events || []).map(event=>({...event,searchCity:city.name,forecast:window.RauszeitCityWeather?.(city.name,event.date)}));
        const shown=renderCards(events,current.dates,current.interests || [],grid,current.audience || 'all');count+=shown;
        if(!shown) {const empty=document.createElement('p');empty.className='source-note';empty.textContent=error || 'Keine passenden Termine aus den verbundenen Quellen für deine Interessen an den gewählten Tagen gefunden.';group.append(empty);}
        const local=(current.interests || []).filter(id=>window.RauszeitInterests.options[id]?.local);
        for(const id of local) {
          const option=window.RauszeitInterests.options[id];
          const link=document.createElement('a');link.className='local-interest-link';link.target='_blank';link.rel='noopener noreferrer';
          const dates=current.dates.map(day=>'"'+formatDate(day,{year:'numeric'})+'"').join(' OR ');
          link.href='https://www.google.com/search?q='+encodeURIComponent('('+option.terms.split(' ').join(' OR ')+') '+(city.place.name || city.name)+(current.audience && current.audience!=='all'?' Ü'+current.audience:'')+' ('+dates+')');
          link.textContent=option.label+': lokale Termine suchen →';group.append(link);
        }
        if(local.length) {const note=document.createElement('p');note.className='source-note';note.textContent='Externe Suche, keine bestätigten Termine. Kirmes, Weihnachtsmärkte und lokale Feste sind bei Ticketmaster oft nicht erfasst.';group.append(note);}
        $('#ticketResults').append(group);
      }
      renderSources(successes);
      const notices=[...new Set(successes.map(result=>result.data.notice).filter(Boolean))];
      const unresolved=current.cities.length-resolved.length;
      status(`${count?`${count} passende Veranstaltung${count===1?'':'en'} angezeigt – höchstens drei pro Ort.`:'Keine passenden Termine aus den verbundenen Quellen für diese Auswahl gefunden.'}${failures.length?' '+failures.map(result=>result.city.name+': '+result.error).join(' '):''}${unresolved?' Für '+unresolved+' Ort(e) fehlen noch Koordinaten.':''}${notices.length?' '+notices.join(' '):''} Angaben und Verfügbarkeit bitte beim Veranstalter prüfen.`);
    } catch(error) {if(myGeneration===generation) status(error.name==='AbortError'?'Die Veranstaltungssuche dauert zu lange. Bitte erneut versuchen.':'Veranstaltungssuche nicht erreichbar. Wetter und Kalenderlinks bleiben verfügbar.');}
    finally {clearTimeout(timeout);}
  }
  function schedule() {clearTimeout(timer);generation++;controller?.abort();$('#ticketResults').replaceChildren();if(backend)status('Auswahl geändert – Veranstaltungen werden aktualisiert …');timer=setTimeout(()=>refresh(),350);}
  document.addEventListener('rauszeit:selection',schedule);
  $('#reloadTickets').addEventListener('click',()=>{clearTimeout(timer);refresh(true);});
  $('#ticketEndpointForm').addEventListener('submit',event=>{
    event.preventDefault();try {
      const next=validateBackend($('#ticketEndpoint').value.trim());if(!next) throw new Error('Bitte eine Backend-Adresse eingeben.');
      backend=next;try {localStorage.setItem(STORAGE,backend);} catch {}refresh(true);
    } catch(error) {status(error.message);}
  });
  $('#disconnectTickets').addEventListener('click',()=>{backend='';try {localStorage.removeItem(STORAGE);} catch {}$('#ticketEndpoint').value='';cache.clear();refresh();});
  refresh();
})();
