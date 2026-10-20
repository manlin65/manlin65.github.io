const {test,after}=require('node:test');
const assert=require('node:assert/strict');
const {handler,normalize}=require('../netlify/functions/christmas-markets.js');
const originalFetch=global.fetch;after(()=>global.fetch=originalFetch);
const request=(changes={})=>({httpMethod:'GET',headers:{origin:'https://mlinner-software.de'},queryStringParameters:{latitude:'49.45',longitude:'11.08',...changes}});
test('radius search validates coordinates and origin without requiring dates or API keys',async()=>{
 global.fetch=()=>assert.fail('must not request');
 for(const query of [{latitude:'91'},{latitude:' '},{longitude:'-181'},{longitude:'bad'}]) assert.equal((await handler(request(query))).statusCode,400);
 assert.equal((await handler({...request(),headers:{origin:'https://evil.example'}})).statusCode,403);
 assert.equal((await handler({...request(),httpMethod:'POST'})).statusCode,405);
 assert.equal((await handler({...request(),httpMethod:'OPTIONS'})).statusCode,204);
});
test('market locations are filtered to 100 km, sorted, deduplicated and safely linked',()=>{
 const data=normalize([
  {type:'node',id:1,lat:49.46,lon:11.08,tags:{name:'Christkindlesmarkt',description:'Markt auf dem Hauptplatz',website:'https://market.example.org'}},
  {type:'way',id:2,center:{lat:49.46,lon:11.08},tags:{name:'Christkindlesmarkt'}},
  {type:'node',id:3,lat:50.6,lon:11.08,tags:{name:'Weihnachtsmarkt'}},
  {type:'relation',id:4,center:{lat:49.45,lon:11.08},tags:{name:'Adventsmarkt',website:'javascript:alert(1)'}},
  {type:'node',id:5,lat:49.46,lon:11.08,tags:{name:'Konzertsaal'}},
 ],{latitude:49.45,longitude:11.08});
 assert.equal(data.length,2);assert.equal(data[0].id,'relation/4');assert.equal(data[0].website,null);assert.equal(data[1].description,'Markt auf dem Hauptplatz');assert.ok(data.every(item=>item.distanceKm<=100));
});
test('real Overpass request has a fixed radius, no date restriction, no weather; results cache',async()=>{
 let calls=0;global.fetch=async(url,options)=>{
  calls++;assert.equal(url,'https://overpass-api.de/api/interpreter');assert.equal(options.method,'POST');const query=options.body.get('data');assert.match(query,/around:100000,49.45,11.08/);assert.ok(!query.includes('date:'));
  return new Response(JSON.stringify({elements:[{type:'node',id:9,lat:49.45,lon:11.08,tags:{name:'Weihnachtsmarkt'}}]}));
 };
 const first=await handler(request());assert.equal(first.statusCode,200);const body=JSON.parse(first.body);assert.equal(body.radiusKm,100);assert.equal(body.markets.length,1);assert.match(body.notice,/keine Bestätigung/);
 await handler(request());assert.equal(calls,1);
});
test('partial or unavailable OSM data is an explicit error rather than an empty market list',async()=>{
 global.fetch=async()=>new Response(JSON.stringify({remark:'runtime error: timeout',elements:[]}));
 const result=await handler(request({latitude:'48.85',longitude:'2.35'}));assert.equal(result.statusCode,503);assert.match(result.body,/nicht erreichbar/);
});

test('a failing primary Overpass server falls back to another public OSM server',async()=>{
 const calls=[];global.fetch=async url=>{calls.push(url);return url.includes('overpass-api.de')?new Response('Busy',{status:503}):new Response(JSON.stringify({elements:[{type:'node',id:8,lat:52.52,lon:13.4,tags:{name:'Weihnachtsmarkt'}}]}));};
 const result=await handler(request({latitude:'52.52',longitude:'13.4'}));assert.equal(result.statusCode,200);assert.equal(JSON.parse(result.body).markets.length,1);assert.deepEqual(calls,['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter']);
});
