'use strict';
const {distance}=require('../lib/calendars.js');
const cache=new Map(),pending=new Map();
function response(statusCode,data,origin) {return {statusCode,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Vary':'Origin',...(origin?{'Access-Control-Allow-Origin':origin}:{})},body:JSON.stringify(data)};}
function safeLink(value) {try {const url=new URL(value);return url.protocol==='https:' && !url.username && !url.password?url.href:null;} catch {return null;}}
function normalize(elements,point) {
  const matches=new Map();
  for(const element of elements) {
    if(!['node','way','relation'].includes(element.type) || !Number.isSafeInteger(element.id) || element.id<=0) continue;
    const latitude=Number(element.lat ?? element.center?.lat),longitude=Number(element.lon ?? element.center?.lon);
    if(!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude)>90 || Math.abs(longitude)>180) continue;
    const km=distance(point,{latitude,longitude});if(km>100) continue;
    const tags=element.tags || {},name=String(tags.name || 'Weihnachtsmarkt');
    if(tags['xmas:feature']!=='market' && !/weihnachtsm[aä]rkt|christkind(?:les|l|el)?markt|adventsm[aä]rkt|christmas market|march[eé] de no[eë]l|mercat.{0,5} natale|mercado navide[nñ]o/i.test(name)) continue;
    const key=name.normalize('NFKC').toLocaleLowerCase('de-DE')+'|'+latitude.toFixed(3)+'|'+longitude.toFixed(3);
    if(matches.has(key)) continue;
    matches.set(key,{id:`${element.type}/${element.id}`,name:name.slice(0,300),latitude,longitude,distanceKm:Math.round(km*10)/10,description:String(tags['description:de'] || tags.description || '').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim().slice(0,650) || null,city:String(tags['addr:city'] || '').slice(0,150),address:[tags['addr:street'],tags['addr:housenumber']].filter(Boolean).join(' ').slice(0,250),openingHours:String(tags.opening_hours || '').slice(0,300) || null,website:safeLink(tags.website || tags['contact:website']),mapUrl:`https://www.openstreetmap.org/${element.type}/${element.id}`});
  }
  return [...matches.values()].sort((a,b)=>a.distanceKm-b.distanceKm);
}
async function queryServer(endpoint,query) {
  const upstream=await fetch(endpoint,{method:'POST',body:new URLSearchParams({data:query}),headers:{Accept:'application/json','User-Agent':'Rauszeit/1.0 (Christmas market locations)'},signal:AbortSignal.timeout(18000)});
  if(!upstream.ok) {const error=new Error('OSM_HTTP');error.sourceCode='http_'+upstream.status;throw error;}
  const reader=upstream.body?.getReader();if(!reader) throw new Error('OSM_EMPTY');
  const chunks=[];let size=0;
  try {for(;;) {const {value,done}=await reader.read();if(done) break;size+=value.byteLength;if(size>3*1024*1024){await reader.cancel();throw new Error('OSM_TOO_LARGE');}chunks.push(Buffer.from(value));}} finally {reader.releaseLock();}
  let data;
  try {data=JSON.parse(Buffer.concat(chunks).toString('utf8'));} catch {const error=new Error('OSM_FORMAT');error.sourceCode='invalid_response';throw error;}
  if(data.remark || !Array.isArray(data.elements)) {const error=new Error('OSM_INCOMPLETE');error.sourceCode=String(data.remark || '').includes('timed out')?'query_timeout':'incomplete_response';throw error;}
  return data;
}
async function search(point) {
  const key=[point.latitude.toFixed(6),point.longitude.toFixed(6)].join(',');
  const saved=cache.get(key);if(saved && saved.expires>Date.now()) return saved.data;
  if(pending.has(key)) return pending.get(key);
  const work=(async()=>{
    const around=`around:100000,${point.latitude},${point.longitude}`;
    const query=`[out:json][timeout:14];(nwr(${around})["xmas:feature"="market"];nwr(${around})["name"~"Weihnachtsmarkt|Weihnachtsmärkte|Christkindlesmarkt|Christkindlmarkt|Christkindelmarkt|Adventsmarkt|Adventsmärkte|Christmas Market|Marché de Noël|Mercato di Natale|Mercado Navideño",i];);out tags center;`;
    let raw;const sourceErrors=[];
    for(const endpoint of ['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter']) {
      try {raw=await queryServer(endpoint,query);break;}
      catch(error) {sourceErrors.push({source:new URL(endpoint).hostname,code:error.name==='TimeoutError'?'timeout':error.sourceCode || 'network_error'});}
    }
    if(!raw) {const error=new Error('OSM_UNAVAILABLE');error.sourceErrors=sourceErrors;throw error;}
    const markets=normalize(raw.elements,point);
    const data={markets:markets.slice(0,100),radiusKm:100,total:markets.length,truncated:markets.length>100,source:'OpenStreetMap',sourceUrl:'https://www.openstreetmap.org/copyright',checkedAt:new Date().toISOString(),notice:'Verzeichnete Marktstandorte, keine Bestätigung für die aktuelle Saison oder heutige Öffnung. Saisontermine bitte beim Veranstalter prüfen.'};
    if(cache.size>=60) cache.delete(cache.keys().next().value);cache.set(key,{expires:Date.now()+900000,data});return data;
  })();
  pending.set(key,work);try {return await work;} finally {pending.delete(key);}
}
async function handler(event) {
  const origin=event.headers?.origin || event.headers?.Origin || '';
  const allowed=(process.env.RAUSZEIT_ALLOWED_ORIGINS || 'https://www.mlinner-software.de,https://mlinner-software.de,https://manlin65.github.io').split(',').map(item=>item.trim());
  if(process.env.URL) {try {allowed.push(new URL(process.env.URL).origin);} catch {}}
  if(origin && !allowed.includes(origin)) return response(403,{error:'Diese Website ist für die Umkreissuche nicht freigegeben.'},null);
  if(event.httpMethod==='OPTIONS') {const result=response(204,{},origin);Object.assign(result.headers,{'Access-Control-Allow-Methods':'GET, OPTIONS'});return result;}
  if(event.httpMethod!=='GET') {const result=response(405,{error:'Nur GET-Anfragen sind erlaubt.'},origin);result.headers.Allow='GET, OPTIONS';return result;}
  const p=event.queryStringParameters || {},point={latitude:Number(p.latitude),longitude:Number(p.longitude)};
  if(!p.latitude?.trim() || !p.longitude?.trim() || !Number.isFinite(point.latitude) || Math.abs(point.latitude)>90 || !Number.isFinite(point.longitude) || Math.abs(point.longitude)>180) return response(400,{error:'Bitte einen gültigen Ausgangspunkt wählen.'},origin);
  try {return response(200,await search(point),origin);} catch(error) {return response(503,{error:'Die Weihnachtsmarkt-Karte ist gerade nicht erreichbar. Bitte später erneut versuchen.',sourceErrors:error.sourceErrors || []},origin);}
}
exports.handler=handler;
exports.normalize=normalize;
