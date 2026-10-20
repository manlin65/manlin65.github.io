const {test,after}=require('node:test');
const assert=require('node:assert/strict');
const {createHandler,mergeEvents}=require('../netlify/functions/events.js');
const {loadCalendar,validSource}=require('../netlify/lib/calendars.js');
const {top,matchesAudience}=require('../wochenende/interests.js');
const oldFetch=global.fetch;after(()=>global.fetch=oldFetch);
const request=(changes={})=>({httpMethod:'GET',headers:{origin:'https://mlinner-software.de'},queryStringParameters:{latitude:'49.477',longitude:'10.989',start:'2026-10-23',end:'2026-11-14',category:'all',...changes}});
const fixture={id:'dance-night',name:'Disco Ü60',date:'2026-10-23',time:'20:00',venue:'Tanzsaal',city:'Fürth',latitude:49.477,longitude:10.989,source:'Lokaler Kalender',sourceId:'dance-calendar',classifications:['Disco']};
const tm=async()=>({statusCode:200,body:JSON.stringify({events:[{...fixture,source:undefined,sourceId:undefined}],truncated:false})});
test('aggregates providers, combines duplicate source attribution and preserves distinct times',async()=>{
 const handler=createHandler({ticketmasterHandler:tm,calendars:[{id:'dance-calendar',name:'Tanzkalender'}],calendarLoader:async()=>({events:[fixture,{...fixture,id:'late-night',time:'23:00'}]}),manual:[]});
 const result=await handler(request());assert.equal(result.statusCode,200);const body=JSON.parse(result.body);
 assert.equal(body.events.length,2);assert.deepEqual(body.events[0].sources,['Ticketmaster','Lokaler Kalender']);assert.equal(body.sources.filter(item=>item.status==='ok').length,2);
 assert.equal(top(body.events,['2026-10-23'],['dance'],'60').length,2);
});
test('partial provider failure leaves local results and reports safe source errors',async()=>{
 const handler=createHandler({ticketmasterHandler:async()=>({statusCode:503,body:JSON.stringify({error:'TICKETMASTER_API_KEY fehlt.'})}),calendars:[{id:'broken',name:'Kalender'}],calendarLoader:async()=>{throw new Error('secret=do-not-return');},manual:[fixture]});
 const body=JSON.parse((await handler(request())).body);assert.equal(body.events.length,1);assert.ok(body.sources.some(item=>item.status==='error'));assert.ok(body.sources.some(item=>item.status==='not_configured'));assert.ok(!JSON.stringify(body).includes('do-not-return'));
});
test('manual screenshot event only appears near Fürth on its exact date; all cities supported',async()=>{
 const handler=createHandler({ticketmasterHandler:async()=>({statusCode:200,body:'{"events":[]}'}),calendars:[]});
 const nearby=JSON.parse((await handler(request({start:'2026-11-14',end:'2026-11-14'}))).body);assert.equal(nearby.events.length,1);assert.match(nearby.events[0].source,/manuell/);assert.equal(nearby.events[0].time,'20:00');assert.equal(nearby.events[0].endDate,'2026-11-15');
 assert.equal(JSON.parse((await handler(request({latitude:'48.8566',longitude:'2.3522'}))).body).events.length,0);
 assert.equal(JSON.parse((await handler(request({end:'2026-10-25'}))).body).events.length,0);
 assert.ok(nearby.sources.some(item=>item.id==='calendars' && item.status==='not_configured'));
});
test('multi-source route validates origins, dates, methods before reading providers',async()=>{
 const handler=createHandler({ticketmasterHandler:()=>assert.fail('must not query'),calendars:[],manual:[]});
 assert.equal((await handler(request({latitude:'91'}))).statusCode,400);
 assert.equal((await handler(request({start:'2026-02-30'}))).statusCode,400);
 assert.equal((await handler({...request(),headers:{origin:'https://evil.example'}})).statusCode,403);
 assert.equal((await handler({...request(),httpMethod:'POST'})).statusCode,405);
 assert.equal((await handler({...request(),httpMethod:'OPTIONS'})).statusCode,204);
});
const source={id:'weekly-dance',name:'Tanzkalender',url:'https://calendar.example.org/tanzen.ics',homepage:'https://calendar.example.org/',city:'Fürth',latitude:49.477,longitude:10.989,timezone:'Europe/Berlin'};
const ics=(extra='')=>`BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nUID:weekly\r\nDTSTART;TZID=Europe/Berlin:20261023T200000\r\nDTEND;TZID=Europe/Berlin:20261023T230000\r\nRRULE:FREQ=WEEKLY;COUNT=4\r\nEXDATE;TZID=Europe/Berlin:20261030T200000\r\nSUMMARY:Disco Ü60\r\nDESCRIPTION:Oldies und Dance Classics\r\nLOCATION:Tanzsaal\r\n${extra}END:VEVENT\r\nEND:VCALENDAR\r\n`;
test('calendar feeds expand real recurrences and exclusions across DST without changing local time',async()=>{
 global.fetch=async()=>new Response(ics(),{headers:{'content-type':'text/calendar'}});
 const result=await loadCalendar(source,{latitude:49.477,longitude:10.989,start:'2026-10-23',end:'2026-11-14'});
 assert.deepEqual(result.events.map(item=>item.date),['2026-10-23','2026-11-06','2026-11-13']);assert.ok(result.events.every(item=>item.time==='20:00'));assert.equal(result.events[0].source,'Tanzkalender');assert.equal(result.events[0].description,'Oldies und Dance Classics');
});
test('floating dates use source timezone; foreign-city calendar excludes unrelated cities',async()=>{
 global.fetch=async()=>new Response(ics().replaceAll(';TZID=Europe/Berlin',''));
 const foreign={...source,id:'paris-dance',url:'https://calendar.example.org/paris.ics',city:'Paris',latitude:48.8566,longitude:2.3522,timezone:'Europe/Paris'};
 const near=await loadCalendar(foreign,{latitude:48.8566,longitude:2.3522,start:'2026-10-23',end:'2026-10-23'});assert.equal(near.events[0].time,'20:00');assert.equal(near.events[0].city,'Paris');
 const far=await loadCalendar(foreign,{latitude:49.477,longitude:10.989,start:'2026-10-23',end:'2026-10-23'});assert.equal(far.events.length,0);
});
test('rejects unsafe feed addresses, redirects and HTML responses',async()=>{
 for(const url of ['http://calendar.example.org/a.ics','https://127.0.0.1/','https://[::1]/','https://user:secret@calendar.example.org/','https://localhost/']) assert.throws(()=>validSource({...source,url}));
 global.fetch=async(url,options)=>{assert.equal(options.redirect,'error');return new Response('<html>Login</html>');};
 await assert.rejects(loadCalendar({...source,url:'https://calendar.example.org/login'},request().queryStringParameters),/iCalendar/);
});
test('age matching is explicit, does not guess age suitability, and combines with interests',()=>{
 assert.ok(matchesAudience({...fixture,name:'Ü 60 Tanzparty'},'60'));assert.ok(matchesAudience({...fixture,name:'Disco 60+'},'60'));assert.ok(!matchesAudience({...fixture,name:'Ü30 Party'},'60'));assert.ok(!matchesAudience({...fixture,name:'Oldies Disco'},'60'));
 assert.equal(top([fixture],['2026-10-23'],['oldies'],'60').length,0);
 assert.equal(top([{...fixture,description:'70er und 80er Oldies'}],['2026-10-23'],['oldies'],'60').length,1);
});

test('all-day Christmas markets span chosen dates without shifting dates in America',async()=>{
 const sourceNY={...source,id:'ny-markets',url:'https://calendar.example.org/ny-markets.ics',city:'New York',latitude:40.7128,longitude:-74.006,timezone:'America/New_York'};
 global.fetch=async()=>new Response('BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nUID:christmas\r\nDTSTART;VALUE=DATE:20261201\r\nDTEND;VALUE=DATE:20261225\r\nSUMMARY:Christmas Market\r\nEND:VEVENT\r\nEND:VCALENDAR');
 const data=await loadCalendar(sourceNY,{latitude:40.7128,longitude:-74.006,start:'2026-12-05',end:'2026-12-07'});
 assert.deepEqual(data.events.map(item=>item.date),['2026-12-05','2026-12-06','2026-12-07']);assert.ok(data.events.every(item=>item.time===null));assert.equal(new Set(data.events.map(item=>item.id)).size,3);
});
