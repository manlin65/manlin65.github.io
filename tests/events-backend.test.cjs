const {test,after}=require('node:test');
const assert=require('node:assert/strict');
const {handler}=require('../netlify/lib/ticketmaster.js');
const originalFetch=global.fetch;
const originalKey=process.env.TICKETMASTER_API_KEY;
const originalOrigins=process.env.RAUSZEIT_ALLOWED_ORIGINS;
process.env.RAUSZEIT_ALLOWED_ORIGINS='https://www.mlinner-software.de';
const request=(overrides={})=>({httpMethod:'GET',headers:{origin:'https://www.mlinner-software.de'},queryStringParameters:{latitude:'49.89',longitude:'10.89',start:'2026-10-23',end:'2026-10-25',category:'all',...overrides}});
after(()=>{global.fetch=originalFetch;if(originalKey===undefined)delete process.env.TICKETMASTER_API_KEY;else process.env.TICKETMASTER_API_KEY=originalKey;if(originalOrigins===undefined)delete process.env.RAUSZEIT_ALLOWED_ORIGINS;else process.env.RAUSZEIT_ALLOWED_ORIGINS=originalOrigins;});
test('missing key produces actionable error without requesting upstream',async()=>{
 delete process.env.TICKETMASTER_API_KEY;global.fetch=()=>assert.fail('must not fetch');
 const result=await handler(request());assert.equal(result.statusCode,503);assert.match(result.body,/TICKETMASTER_API_KEY/);
});
test('rejects invalid coordinates, dates, category and excessive range',async()=>{
 global.fetch=()=>assert.fail('must not fetch');
 for(const input of [{latitude:'91'},{longitude:'invalid'},{start:'2026-02-30'},{end:'2026-10-01'},{end:'2026-12-31'},{category:'arbitrary'},{latitude:''}]) assert.equal((await handler(request(input))).statusCode,400);
});
test('CORS restricts origins and supports preflight',async()=>{
 assert.equal((await handler({...request(),headers:{origin:'https://untrusted.example'}})).statusCode,403);
 const options=await handler({...request(),httpMethod:'OPTIONS'});assert.equal(options.statusCode,204);assert.equal(options.headers['Access-Control-Allow-Origin'],'https://www.mlinner-software.de');
 assert.equal((await handler({...request(),httpMethod:'POST'})).statusCode,405);
});
test('default origins support the website with and without www',async()=>{
 const saved=process.env.RAUSZEIT_ALLOWED_ORIGINS;delete process.env.RAUSZEIT_ALLOWED_ORIGINS;
 const savedKey=process.env.TICKETMASTER_API_KEY;delete process.env.TICKETMASTER_API_KEY;
 try {for(const origin of ['https://www.mlinner-software.de','https://mlinner-software.de']) {const result=await handler({...request(),headers:{origin}});assert.equal(result.statusCode,503);assert.equal(result.headers['Access-Control-Allow-Origin'],origin);}}
 finally {if(saved===undefined)delete process.env.RAUSZEIT_ALLOWED_ORIGINS;else process.env.RAUSZEIT_ALLOWED_ORIGINS=saved;if(savedKey===undefined)delete process.env.TICKETMASTER_API_KEY;else process.env.TICKETMASTER_API_KEY=savedKey;}
});
test('normalizes real API schema, filters cancelled/out-of-range events, guards URLs and caches',async()=>{
 process.env.TICKETMASTER_API_KEY='test-fixture-not-a-real-key';let calls=0;
 global.fetch=async(url)=>{
  calls++;assert.equal(url.hostname,'app.ticketmaster.com');assert.equal(url.searchParams.get('apikey'),'test-fixture-not-a-real-key');assert.equal(url.searchParams.get('radius'),'20');assert.equal(url.searchParams.get('geoPoint').length,8);
  const event=(id,date,status='onsale',url='https://www.ticketmaster.de/event/123')=>({id,name:'Concert <script>',classifications:[{segment:{name:'Music'},genre:{name:'Dance/Electronic'},subGenre:{name:'House'}}],url,dates:{start:{localDate:date,localTime:'19:30:00'},status:{code:status}},_embedded:{venues:[{name:'Arena',city:{name:'Bamberg'},country:{name:'Deutschland'}}]}});
  return {ok:true,json:async()=>({_embedded:{events:[event('ok','2026-10-24'),event('cancelled','2026-10-24','cancelled'),event('outside','2026-10-26'),event('unsafe','2026-10-25','onsale','https://ticketmaster.evil.example/'),{...event('tba','2026-10-25'),dates:{start:{localDate:'2026-10-25',timeTBA:true},status:{code:'onsale'}}}]},page:{totalPages:2}})};
 };
 const result=await handler(request()),body=JSON.parse(result.body);assert.equal(result.statusCode,200);assert.equal(body.events.length,3);assert.equal(body.truncated,true);assert.equal(body.events[0].time,'19:30');assert.deepEqual(body.events[0].classifications,['Music','Dance/Electronic','House']);assert.equal(body.events[1].url,null);assert.equal(body.events[2].time,null);assert.ok(!result.body.includes(process.env.TICKETMASTER_API_KEY));
 await handler(request());assert.equal(calls,1);
});
test('upstream credential and quota errors do not expose credentials',async()=>{
 for(const [upstream,status] of [[401,502],[403,502],[429,429],[500,502]]) {
  global.fetch=async()=>({ok:false,status:upstream});
  const result=await handler(request({category:'music',latitude:String(40+upstream/1000)}));assert.equal(result.statusCode,status);assert.ok(!result.body.includes(process.env.TICKETMASTER_API_KEY));
 }
});
test('unsupported market filter has an honest empty state without fake results',async()=>{
 global.fetch=()=>assert.fail('must not fetch');
 const result=await handler(request({category:'markets'}));assert.equal(result.statusCode,200);const body=JSON.parse(result.body);assert.deepEqual(body.events,[]);assert.match(body.notice,/lokalen Kalender/);
});
test('transport errors remain generic and never reveal upstream URL',async()=>{
 global.fetch=async()=>{throw new Error('https://upstream/?apikey='+process.env.TICKETMASTER_API_KEY);};
 const result=await handler(request({latitude:'41'}));assert.equal(result.statusCode,502);assert.ok(!result.body.includes('apikey='));assert.ok(!result.body.includes(process.env.TICKETMASTER_API_KEY));
});
