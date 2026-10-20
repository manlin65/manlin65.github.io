'use strict';
const ticketmaster=require('../lib/ticketmaster.js');
const {loadCalendar,distance,validCoordinates}=require('../lib/calendars.js');
const configuredCalendars=require('../calendar-sources.json');
const localEvents=require('../local-events.json');
const {score}=require('../../wochenende/interests.js');
const validDate=value=>typeof value==='string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0,10)===value;
function response(statusCode,data,origin) {return {statusCode,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Vary':'Origin',...(origin?{'Access-Control-Allow-Origin':origin}:{})},body:JSON.stringify(data)};}
function identity(value) {return String(value || '').normalize('NFKC').toLocaleLowerCase('de-DE').replace(/[^\p{L}\p{N}]+/gu,' ').trim();}
function mergeEvents(events) {
  const merged=new Map();
  for(const event of events) {
    // A shared title is insufficient: different times/venues must remain distinct.
    const key=event.time && event.venue?[event.date,event.time,identity(event.name),identity(event.venue),identity(event.city)].join('|'):`${event.sourceId}:${event.id}`;
    const existing=merged.get(key);
    if(existing) {
      existing.sources=[...new Set([...existing.sources,...(event.sources || [event.source])])];
      existing.classifications=[...new Set([...(existing.classifications || []),...(event.classifications || [])])];
      if(!existing.url && event.url) existing.url=event.url;
    } else merged.set(key,{...event,sources:event.sources || [event.source]});
  }
  return [...merged.values()].sort((a,b)=>`${a.date}T${a.time || '23:59'}`.localeCompare(`${b.date}T${b.time || '23:59'}`));
}
function createHandler({ticketmasterHandler=ticketmaster.handler,calendarLoader=loadCalendar,calendars=configuredCalendars,manual=localEvents}={}) {
  return async function handler(event) {
    const origin=event.headers?.origin || event.headers?.Origin || '';
    const allowed=(process.env.RAUSZEIT_ALLOWED_ORIGINS || 'https://www.mlinner-software.de,https://mlinner-software.de,https://manlin65.github.io').split(',').map(v=>v.trim()).filter(Boolean);
    if(process.env.URL) {try {allowed.push(new URL(process.env.URL).origin);} catch {}}
    if(origin && !allowed.includes(origin)) return response(403,{error:'Diese Website ist für die Veranstaltungssuche nicht freigegeben.'},null);
    if(event.httpMethod==='OPTIONS') {const result=response(204,{},origin);Object.assign(result.headers,{'Access-Control-Allow-Methods':'GET, OPTIONS','Access-Control-Allow-Headers':'Content-Type'});return result;}
    if(event.httpMethod!=='GET') {const result=response(405,{error:'Nur GET-Anfragen sind erlaubt.'},origin);result.headers.Allow='GET, OPTIONS';return result;}
    const p=event.queryStringParameters || {};
    const query={latitude:Number(p.latitude),longitude:Number(p.longitude),start:p.start,end:p.end};
    if(!p.latitude || !p.longitude || !validCoordinates(query) || !validDate(p.start) || !validDate(p.end) || p.start>p.end || Date.parse(p.end)-Date.parse(p.start)>30*86400000 || !['all','music','culture','family','outdoor','markets'].includes(p.category || 'all')) return response(400,{error:'Bitte gültige Koordinaten und einen Zeitraum von maximal 31 Tagen angeben.'},origin);
    const jobs=[(async()=>{
      try {
        const result=await ticketmasterHandler(event),body=JSON.parse(result.body);
        if(result.statusCode!==200) return {events:[],status:{id:'ticketmaster',name:'Ticketmaster',status:result.statusCode===503?'not_configured':'error',notice:body.error || 'Quelle derzeit nicht erreichbar.'}};
        return {events:body.events.map(item=>({...item,id:'ticketmaster:'+item.id,source:'Ticketmaster',sourceId:'ticketmaster'})),truncated:body.truncated,status:{id:'ticketmaster',name:'Ticketmaster',status:'ok',notice:body.notice || null}};
      } catch {return {events:[],status:{id:'ticketmaster',name:'Ticketmaster',status:'error',notice:'Quelle derzeit nicht erreichbar.'}};}
    })()];
    for(const source of calendars.slice(0,8)) jobs.push((async()=>{
      try {const data=await calendarLoader(source,query);return {...data,status:{id:source.id,name:source.name,status:'ok',notice:data.truncated?'Einige Kalendereinträge konnten nicht berücksichtigt werden.':null}};}
      catch {return {events:[],status:{id:String(source?.id || 'calendar'),name:String(source?.name || 'Kalender'),status:'error',notice:'Kalender nicht erreichbar oder ungültig. Bitte Feed-Adresse und Kalenderkonfiguration prüfen.'}};}
    })());
    const results=await Promise.all(jobs);
    const manualMatches=manual.filter(item=>validCoordinates(item) && validDate(item.date) && item.date>=p.start && item.date<=p.end && distance(query,item)<=20 && !['cancelled','canceled'].includes(item.status)).map(item=>({...item,sourceId:'local',id:'local:'+item.id}));
    results.push({events:manualMatches,status:{id:'local',name:'Einzeln hinterlegte Termine',status:'manual',notice:'Manuell erfasst, kein automatischer Abgleich mit Facebook.'}});
    if(!calendars.length) results.push({events:[],status:{id:'calendars',name:'Öffentliche Kalender',status:'not_configured',notice:'Noch keine zusätzlichen öffentlichen Kalenderfeeds angeschlossen. Rausgegangen, meinestadt.de und Facebook werden nicht automatisch durchsucht.'}});
    const events=mergeEvents(results.flatMap(result=>result.events)).filter(item=>validDate(item.date) && item.date>=p.start && item.date<=p.end && !['cancelled','canceled'].includes(item.status) && (!p.category || p.category==='all' || score(item,[p.category])>0));
    const sources=results.map(result=>({...result.status,count:result.events.length}));
    return response(200,{events,source:'Rauszeit · mehrere Quellen',sources,truncated:results.some(result=>result.truncated),notice:results.some(result=>result.truncated)?'Die Quellen liefern nur einen begrenzten Ausschnitt. Zeitraum bei Bedarf eingrenzen.':null},origin);
  };
}
exports.handler=createHandler();
exports.createHandler=createHandler;
exports.mergeEvents=mergeEvents;
