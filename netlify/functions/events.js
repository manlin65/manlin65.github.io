'use strict';
// The API key stays in the hosting environment and is never returned to the browser.
const cache=new Map();
const MAX_CACHE=100;
const CATEGORY={music:{segmentId:'KZFzniwnSyZfZ7v7nJ'},culture:{segmentId:'KZFzniwnSyZfZ7v7na'},family:{classificationName:'Family'},outdoor:{segmentId:'KZFzniwnSyZfZ7v7nE'}};
function geohash(latitude,longitude) {
  const alphabet='0123456789bcdefghjkmnpqrstuvwxyz';let lat=[-90,90],lon=[-180,180],result='',value=0,bits=0,even=true;
  while(result.length<8) {const range=even?lon:lat,coordinate=even?longitude:latitude,mid=(range[0]+range[1])/2;value=value*2;if(coordinate>=mid){value++;range[0]=mid;}else range[1]=mid;even=!even;if(++bits===5){result+=alphabet[value];value=0;bits=0;}}
  return result;
}
function validDate(date) {return typeof date==='string' && /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(date)) && new Date(date).toISOString().slice(0,10)===date;}
function safeTicketURL(value) {
  const ticketDomains=['ticketmaster.com','ticketmaster.de','ticketmaster.at','ticketmaster.ch','ticketmaster.fr','ticketmaster.co.uk','ticketmaster.ie','ticketmaster.nl','ticketmaster.be','ticketmaster.es','ticketmaster.it','ticketmaster.pl','ticketmaster.cz','ticketmaster.dk','ticketmaster.se','ticketmaster.no','ticketmaster.fi','ticketmaster.ca','ticketmaster.com.au','ticketmaster.co.nz','ticketmaster.com.mx','ticketmaster.sg','ticketmaster.ae','ticketmaster.co.za','livenation.com','livenation.de','livenation.co.uk'];
  try {const url=new URL(value);return url.protocol==='https:' && ticketDomains.some(domain=>url.hostname===domain || url.hostname.endsWith('.'+domain))?url.href:null;}catch{return null;}
}
function normalizeEvent(event) {
  const venue=event._embedded?.venues?.[0];
  return {id:String(event.id || '').slice(0,200),name:String(event.name || 'Veranstaltung').slice(0,500),date:event.dates?.start?.localDate || null,time:event.dates?.start?.noSpecificTime || event.dates?.start?.timeTBA || event.dates?.start?.timeTBD?null:event.dates?.start?.localTime?.slice(0,5) || null,timezone:event.dates?.timezone || venue?.timezone || null,venue:venue?.name || '',city:venue?.city?.name || '',country:venue?.country?.name || '',status:event.dates?.status?.code || 'unknown',url:safeTicketURL(event.url),category:event.classifications?.[0]?.segment?.name || '',timeNote:event.dates?.start?.dateTBA || event.dates?.start?.dateTBD?'Termin noch offen':null};
}
function response(statusCode,data,origin,extra={}) {
  return {statusCode,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Vary':'Origin',...(origin?{'Access-Control-Allow-Origin':origin}:{}),...extra},body:JSON.stringify(data)};
}
async function handler(event) {
  const origin=event.headers?.origin || event.headers?.Origin || '';
  const allowed=(process.env.RAUSZEIT_ALLOWED_ORIGINS || 'https://www.mlinner-software.de,https://mlinner-software.de,https://manlin65.github.io').split(',').map(v=>v.trim()).filter(Boolean);
  const netlifyURL=process.env.URL;
  if(netlifyURL) {try {allowed.push(new URL(netlifyURL).origin);} catch {}}
  if(origin && !allowed.includes(origin)) return response(403,{error:'Diese Website ist für die Veranstaltungssuche nicht freigegeben.'},null);
  if(event.httpMethod==='OPTIONS') return response(204,{},origin,{'Access-Control-Allow-Methods':'GET, OPTIONS','Access-Control-Allow-Headers':'Content-Type'});
  if(event.httpMethod!=='GET') return response(405,{error:'Nur GET-Anfragen sind erlaubt.'},origin,{'Allow':'GET, OPTIONS'});
  const p=event.queryStringParameters || {};
  const latitude=Number(p.latitude),longitude=Number(p.longitude);
  if(!p.latitude || !p.longitude || !Number.isFinite(latitude) || Math.abs(latitude)>90 || !Number.isFinite(longitude) || Math.abs(longitude)>180 || !validDate(p.start) || !validDate(p.end) || p.start>p.end || (Date.parse(p.end)-Date.parse(p.start))/86400000>30 || !['all','music','culture','family','outdoor','markets'].includes(p.category || 'all')) return response(400,{error:'Bitte gültige Koordinaten und einen Zeitraum von maximal 31 Tagen angeben.'},origin);
  const apiKey=process.env.TICKETMASTER_API_KEY;
  if(!apiKey) return response(503,{error:'Die Veranstaltungssuche ist noch nicht eingerichtet. Der Betreiber muss TICKETMASTER_API_KEY beim Hosting-Anbieter hinterlegen.'},origin);
  if(p.category==='markets') return response(200,{events:[],source:'Ticketmaster',notice:'Ticketmaster bietet keinen verlässlichen Filter für Märkte und Stadtfeste. Nutze dafür den lokalen Kalender.',truncated:false},origin);
  const key=[latitude.toFixed(4),longitude.toFixed(4),p.start,p.end,p.category || 'all'].join('|');
  const existing=cache.get(key);if(existing && existing.expires>Date.now()) return response(200,existing.data,origin);
  // UTC envelope includes each destination's local calendar day, across all time zones.
  const start=new Date(Date.parse(p.start)-14*3600000).toISOString().replace('.000Z','Z');
  const end=new Date(Date.parse(p.end)+38*3600000).toISOString().replace('.000Z','Z');
  const url=new URL('https://app.ticketmaster.com/discovery/v2/events.json');
  url.search=new URLSearchParams({apikey:apiKey,geoPoint:geohash(latitude,longitude),radius:'20',unit:'km',startDateTime:start,endDateTime:end,size:'100',sort:'date,asc',locale:'*',...(CATEGORY[p.category] || {})});
  try {
    const upstream=await fetch(url,{signal:AbortSignal.timeout(10000),headers:{Accept:'application/json'}});
    if(!upstream.ok) {
      if(upstream.status===401 || upstream.status===403) return response(502,{error:'Ticketmaster akzeptiert den hinterlegten API-Schlüssel nicht. Bitte die Backend-Konfiguration prüfen.'},origin);
      if(upstream.status===429) return response(429,{error:'Das Abfragelimit von Ticketmaster ist erreicht. Bitte später erneut versuchen.'},origin,{'Retry-After':'60'});
      return response(502,{error:'Ticketmaster ist gerade nicht verfügbar. Bitte später erneut versuchen.'},origin);
    }
    const raw=await upstream.json();
    if(raw.fault || raw.errors) return response(502,{error:'Ticketmaster konnte die Anfrage nicht verarbeiten.'},origin);
    const events=(raw._embedded?.events || []).map(normalizeEvent).filter(item=>validDate(item.date) && item.date>=p.start && item.date<=p.end && !['cancelled','canceled'].includes(item.status));
    const data={events,source:'Ticketmaster',truncated:(raw.page?.totalPages || 0)>1,notice:(raw.page?.totalPages || 0)>1?'Es werden die ersten 100 Treffer des Zeitraums berücksichtigt. Grenze den Zeitraum bei Bedarf ein.':null};
    if(cache.size>=MAX_CACHE) cache.delete(cache.keys().next().value);
    cache.set(key,{expires:Date.now()+300000,data});return response(200,data,origin);
  } catch(error) {return response(error.name==='TimeoutError'?504:502,{error:'Die Veranstaltungssuche ist gerade nicht erreichbar. Bitte erneut versuchen.'},origin);}
}
exports.handler=handler;
