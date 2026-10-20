'use strict';
(() => {
  const select=$('#christmasOrigin'),status=$('#christmasStatus'),results=$('#christmasResults');
  let places=[],customPlace=null,geoController=null,geoRun=0,gps=null,controller=null,generation=0,timer=null,lastPoint='',markets=[],visible=12;
  const valid=place=>place && Number.isFinite(place.latitude) && Number.isFinite(place.longitude);
  function endpoint() {
    const value=window.RAUSZEIT_CONFIG?.christmasApiUrl;
    if(value) return new URL(value);
    const eventURL=window.RAUSZEIT_CONFIG?.eventApiUrl;
    if(eventURL && new URL(eventURL).pathname==='/.netlify/functions/events') return new URL('/.netlify/functions/christmas-markets',eventURL);
    if(location.hostname.endsWith('.netlify.app')) return new URL('/.netlify/functions/christmas-markets',location.origin);
    return null;
  }
  function clear(message) {results.replaceChildren();$('#christmasMore').hidden=true;status.textContent=message;}
  function updatePlaces() {
    const previous=select.value,selection=window.RauszeitSelection?.();
    places=(selection?.cities || []).filter(city=>valid(city.place)).map(city=>({...city.place,label:city.place.name || city.name}));
    if(customPlace && !places.some(place=>place.latitude===customPlace.latitude && place.longitude===customPlace.longitude)) places.push(customPlace);
    select.replaceChildren();
    for(const place of places) {const option=document.createElement('option');option.value=`${place.latitude},${place.longitude}`;option.textContent=place.label+(place.country?' · '+place.country:'');select.append(option);}
    if(gps) {const option=document.createElement('option');option.value='gps';option.textContent='Mein aktueller Standort';select.append(option);}
    if([...select.options].some(option=>option.value===previous)) select.value=previous;
    select.disabled=!select.options.length;$('#loadChristmasMarkets').disabled=!select.options.length;
    const next=select.value;
    if(next!==lastPoint) {clearTimeout(timer);generation++;controller?.abort();clear('Ausgangspunkt wird aktualisiert …');if(next) timer=setTimeout(()=>load(),350);else clear('Wähle oben einen Ort oder verwende deinen aktuellen Standort.');}
  }
  function chosenPoint() {
    if(select.value==='gps') return gps;
    return places.find(place=>`${place.latitude},${place.longitude}`===select.value);
  }
  function render() {
    results.replaceChildren();
    for(const market of markets.slice(0,visible)) {
      const card=document.createElement('article');card.className='ticket-card christmas-market-card';
      const name=document.createElement('h3');name.textContent=market.name;
      const distance=document.createElement('p');distance.className='ticket-date';distance.textContent=Number(market.distanceKm).toLocaleString('de-DE',{maximumFractionDigits:1})+' km Luftlinie';
      const address=document.createElement('p');address.textContent=[market.address,market.city].filter(Boolean).join(', ') || 'Standort auf der Karte ansehen';card.append(name,distance,address);
      const description=document.createElement('p');description.className='christmas-description';description.textContent=market.description || (market.city?'Als Weihnachtsmarkt in '+market.city+' verzeichnet.':'Dieser Standort ist als Weihnachtsmarkt in OpenStreetMap verzeichnet.')+' Eine nähere Beschreibung wurde von der Quelle nicht hinterlegt.';card.append(description);
      if(market.openingHours) {const hours=document.createElement('p');hours.className='source-note';hours.textContent='Öffnungszeiten laut Karteneintrag: '+market.openingHours;card.append(hours);}
      const links=[['Auf Karte ansehen →',market.mapUrl],['Veranstalter-Website →',market.website]];
      for(const [label,value] of links) {
        try {const url=new URL(value);if(url.protocol!=='https:' || url.username || url.password) continue;const link=document.createElement('a');link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';link.textContent=label;card.append(link);} catch {}
      }
      const note=document.createElement('small');note.textContent='Quelle: OpenStreetMap · Saisontermin nicht bestätigt';card.append(note);results.append(card);
    }
    $('#christmasMore').hidden=visible>=markets.length;
  }
  async function load(force=false) {
    clearTimeout(timer);const point=chosenPoint();if(!point) return;
    const url=endpoint();if(!url) {clear('Die Umkreissuche benötigt das aktualisierte Rauszeit-Backend auf Netlify.');return;}
    if(!force && lastPoint===select.value && markets.length) return;
    const run=++generation;controller?.abort();controller=new AbortController();lastPoint=select.value;markets=[];visible=12;
    clear('Suche Weihnachtsmarkt-Standorte im Umkreis von 100 km …');
    const timeout=setTimeout(()=>controller.abort(),30000);
    try {
      url.search=new URLSearchParams({latitude:String(point.latitude),longitude:String(point.longitude)});
      const response=await fetch(url,{signal:controller.signal});const data=await response.json();
      if(!response.ok) throw new Error(data.error || 'Umkreissuche gerade nicht erreichbar.');
      if(!Array.isArray(data.markets)) throw new Error('Die Quelle liefert keine gültige Standortliste.');
      if(run!==generation) return;
      markets=data.markets;render();
      status.textContent=markets.length?`${markets.length} Weihnachtsmarkt-Standort${markets.length===1?'':'e'} innerhalb von 100 km um ${point.label || 'deinen Standort'} gefunden${data.truncated?' (maximal 100 angezeigt)':''}. Nach Entfernung sortiert. Keine Bestätigung für die aktuelle Saison oder heutige Öffnung.`:'Keine Weihnachtsmarkt-Standorte in OpenStreetMap innerhalb von 100 km gefunden. Das bedeutet nicht, dass es dort keine Weihnachtsmärkte gibt.';
    } catch(error) {if(run===generation) {lastPoint='';clear(error.name==='AbortError'?'Die Umkreissuche dauert zu lange. Bitte erneut versuchen.':error.message || 'Die Umkreissuche ist nicht erreichbar.');}}
    finally {clearTimeout(timeout);}
  }
  $('#christmasCityForm').addEventListener('submit',async event=>{
    event.preventDefault();const query=$('#christmasCity').value.trim();if(query.length<2) return;
    const run=++geoRun;geoController?.abort();geoController=new AbortController();
    const matches=$('#christmasCityMatches');matches.replaceChildren();matches.hidden=true;
    status.textContent='Suche Orte zu „'+query+'“ …';
    const timeout=setTimeout(()=>geoController?.abort(),12000);
    try {
      const url=new URL('https://geocoding-api.open-meteo.com/v1/search');url.search=new URLSearchParams({name:query,count:'6',language:'de',format:'json'});
      const response=await fetch(url,{signal:geoController.signal});if(!response.ok) throw new Error('Ortssuche nicht erreichbar.');
      const data=await response.json();if(run!==geoRun) return;
      const found=(data.results || []).filter(valid);
      if(!found.length) {status.textContent='Keinen passenden Ort gefunden. Bitte präzisiere den Ortsnamen.';return;}
      const choose=place=>{
        customPlace={...place,label:place.name};matches.replaceChildren();matches.hidden=true;updatePlaces();select.value=`${place.latitude},${place.longitude}`;lastPoint='';load();
      };
      if(found.length===1) {choose(found[0]);return;}
      for(const place of found) {const button=document.createElement('button');button.type='button';button.className='save-button';button.textContent=[place.name,place.admin1,place.country].filter(Boolean).join(' · ');button.addEventListener('click',()=>choose(place));matches.append(button);}
      matches.hidden=false;status.textContent='Wähle den passenden Ausgangsort für die 100-km-Suche.';
    } catch(error) {if(run===geoRun) status.textContent=error.name==='AbortError'?'Die Ortssuche dauert zu lange. Bitte erneut versuchen.':'Die Ortssuche ist derzeit nicht erreichbar.';}
    finally {clearTimeout(timeout);}
  });
  select.addEventListener('change',()=>{generation++;controller?.abort();lastPoint='';load();});
  $('#loadChristmasMarkets').addEventListener('click',()=>load(true));
  $('#christmasMore').addEventListener('click',()=>{visible+=12;render();});
  $('#christmasGPS').addEventListener('click',()=>{
    if(!navigator.geolocation) {status.textContent='Dein Browser unterstützt keine Standortabfrage. Wähle oben einen Ort.';return;}
    status.textContent='Dein Browser fragt nach der Standortfreigabe …';
    navigator.geolocation.getCurrentPosition(position=>{
      gps={latitude:position.coords.latitude,longitude:position.coords.longitude,label:'deinen Standort'};updatePlaces();select.value='gps';lastPoint='';load();
    },()=>{status.textContent='Standort nicht verfügbar oder nicht freigegeben. Du kannst stattdessen einen ausgewählten Ort verwenden.';},{enableHighAccuracy:false,timeout:12000,maximumAge:300000});
  });
  document.addEventListener('rauszeit:selection',updatePlaces);
  updatePlaces();
})();
