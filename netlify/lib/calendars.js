'use strict';
const ical=require('node-ical');
const {isIP}=require('node:net');
const cache=new Map(),pending=new Map();
const MAX_BYTES=1024*1024;
function publicURL(value) {
  const url=new URL(value);
  const hostname=url.hostname.toLowerCase();
  if(url.protocol!=='https:' || url.username || url.password || url.port && url.port!=='443' || isIP(hostname.replace(/^\[|\]$/g,'')) || !hostname.includes('.') || /(?:^|\.)(?:localhost|local|internal|invalid|test|example)$/.test(hostname)) throw new Error('Öffentliche HTTPS-Kalenderadresse erforderlich.');
  return url.href;
}
function distance(a,b) {
  const rad=value=>Number(value)*Math.PI/180;
  const lat=rad(b.latitude-a.latitude),lon=rad(b.longitude-a.longitude);
  const h=Math.sin(lat/2)**2+Math.cos(rad(a.latitude))*Math.cos(rad(b.latitude))*Math.sin(lon/2)**2;
  return 6371*2*Math.asin(Math.min(1,Math.sqrt(h)));
}
function validCoordinates(place) {return typeof place.latitude==='number' && Number.isFinite(place.latitude) && Math.abs(place.latitude)<=90 && typeof place.longitude==='number' && Number.isFinite(place.longitude) && Math.abs(place.longitude)<=180;}
function validSource(source) {
  if(!source || !/^[a-z0-9-]{1,70}$/.test(source.id) || typeof source.name!=='string' || !source.name.trim() || !validCoordinates(source) || typeof source.city!=='string' || !source.city.trim()) throw new Error('Kalenderkonfiguration unvollständig.');
  publicURL(source.url);new Intl.DateTimeFormat('de',{timeZone:source.timezone || 'Europe/Berlin'});
  return source;
}
function localDateTime(date,zone) {
  const parts=new Intl.DateTimeFormat('en-GB',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(date);
  const value=Object.fromEntries(parts.map(part=>[part.type,part.value]));
  return {date:`${value.year}-${value.month}-${value.day}`,time:`${value.hour}:${value.minute}`};
}
function text(value) {return String(value?.val ?? value ?? '').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();}
function safeLink(value) {try {return publicURL(value);} catch {return null;}}
async function readCalendar(source) {
  const key=source.url+'|'+(source.timezone || 'Europe/Berlin');
  const saved=cache.get(key);if(saved && saved.expires>Date.now()) return saved.calendar;
  if(pending.has(key)) return pending.get(key);
  const work=fetchCalendar(source);pending.set(key,work);
  try {return await work;} finally {pending.delete(key);}
}
async function fetchCalendar(source) {
  const response=await fetch(publicURL(source.url),{redirect:'error',signal:AbortSignal.timeout(7000),headers:{Accept:'text/calendar','User-Agent':'Rauszeit/1.0 (public calendar reader)'}});
  if(!response.ok) throw new Error('Kalenderdienst nicht erreichbar.');
  if(Number(response.headers.get('content-length') || 0)>MAX_BYTES) throw new Error('Kalenderdatei zu groß.');
  if(!response.body) throw new Error('Leere Kalenderantwort.');
  const reader=response.body.getReader(),chunks=[];let size=0;
  try {
    for(;;) {const {value,done}=await reader.read();if(done) break;size+=value.byteLength;if(size>MAX_BYTES) {await reader.cancel();throw new Error('Kalenderdatei zu groß.');}chunks.push(Buffer.from(value));}
  } finally {reader.releaseLock();}
  const body=Buffer.concat(chunks).toString('utf8');
  if(!/^BEGIN:VCALENDAR\s*$/mi.test(body) || !/^END:VCALENDAR\s*$/mi.test(body)) throw new Error('Die Quelle liefert keinen iCalendar-Kalender.');
  const zone=source.timezone || 'Europe/Berlin';
  const localized=body.replace(/^(DTSTART|DTEND|EXDATE|RDATE):(?=\d{8}T\d{6}(?:,|\r?$))/gm,'$1;TZID='+zone+':');
  const calendar=await ical.async.parseICS(localized);
  if(cache.size>=16) cache.delete(cache.keys().next().value);
  cache.set(source.url+'|'+(source.timezone || 'Europe/Berlin'),{calendar,expires:Date.now()+900000});return calendar;
}
async function loadCalendar(source,query) {
  validSource(source);
  // Source coordinates must describe its venue/city; global calendars need GEO on each event.
  const calendar=await readCalendar(source),events=[];let truncated=false;
  const from=new Date(Date.parse(query.start)-14*3600000),to=new Date(Date.parse(query.end)+38*3600000);
  for(const entry of Object.values(calendar)) {
    if(entry.type!=='VEVENT' || entry.recurrenceid || !entry.start) continue;
    // Bound expansion work for excessively frequent rules; public outing calendars use daily or slower rules.
    if(entry.rrule && /FREQ=(SECONDLY|MINUTELY|HOURLY)/.test(String(entry.rrule))) {truncated=true;continue;}
    const expanded=ical.expandRecurringEvent(entry,{from,to,includeOverrides:true,excludeExdates:true,expandOngoing:true});
    const instances=expanded.flatMap(occurrence=>{
      if(!occurrence.isFullDay) return [occurrence];
      const zone=occurrence.start.tz || source.timezone || 'Europe/Berlin';
      const first=occurrence.start.tz?localDateTime(occurrence.start,zone).date:occurrence.start.toISOString().slice(0,10);
      const end=occurrence.end?(occurrence.end.tz?localDateTime(occurrence.end,zone).date:occurrence.end.toISOString().slice(0,10)):null;
      const last=end && end>first?new Date(Date.parse(end)-86400000).toISOString().slice(0,10):first;
      const days=[];
      for(let day=first<query.start?query.start:first;day<=last && day<=query.end;day=new Date(Date.parse(day)+86400000).toISOString().slice(0,10)) days.push({...occurrence,displayDate:day});
      return days;
    });
    for(const occurrence of instances) {
      const item={...entry,...occurrence.event,...occurrence};
      const timezone=item.start.tz || entry.start.tz || source.timezone || 'Europe/Berlin';
      const dateTime=occurrence.displayDate?{date:occurrence.displayDate,time:null}:localDateTime(item.start,timezone);
      if(dateTime.date<query.start || dateTime.date>query.end || String(item.status).toUpperCase()==='CANCELLED') continue;
      const geo=item.geo;
      const position=geo && Number.isFinite(Number(geo.lat)) && Number.isFinite(Number(geo.lon))?{latitude:Number(geo.lat),longitude:Number(geo.lon)}:source;
      if(!validCoordinates(position) || distance(query,position)>20) continue;
      const end=item.end instanceof Date?localDateTime(item.end,timezone):null;
      events.push({id:`calendar:${source.id}:${entry.uid || text(item.summary)}:${item.start.toISOString()}:${dateTime.date}`,name:text(item.summary).slice(0,500) || 'Veranstaltung',date:dateTime.date,time:occurrence.isFullDay || item.datetype==='date'?null:dateTime.time,endDate:end?.date || null,endTime:end?.time || null,timezone,venue:text(item.location).slice(0,300),city:position!==source && distance(source,position)>20?'':source.city,country:source.country || '',latitude:position.latitude,longitude:position.longitude,locationApproximate:position===source,description:text(item.description).slice(0,1500),category:'',classifications:Array.isArray(item.categories)?item.categories.map(text):[],status:'unknown',url:safeLink(text(item.url)) || safeLink(source.homepage),source:source.name,sourceNote:'Automatisch aus öffentlichem Veranstaltungskalender.',sourceId:source.id});
      if(events.length>=300) {truncated=true;break;}
    }
    if(truncated && events.length>=300) break;
  }
  return {events,truncated};
}
exports.loadCalendar=loadCalendar;
exports.distance=distance;
exports.validSource=validSource;
exports.validCoordinates=validCoordinates;
