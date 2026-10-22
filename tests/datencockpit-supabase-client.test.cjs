const {test}=require('node:test');const assert=require('node:assert/strict');
const {createSupabaseClient}=require('../datencockpit/supabase.cjs');
const config={supabaseUrl:'https://example.supabase.co',supabasePublishableKey:'sb_publishable_example'};
test('Supabase transport uses public API key and places capability only in JSON body',async()=>{
 const requests=[];
 const client=createSupabaseClient(config,{fetchImpl:async(url,options)=>{requests.push({url:String(url),options});return new Response(JSON.stringify({ok:true}),{headers:{'content-type':'application/json'}});}});
 await client.request('POST',{rows:[{orderNumber:'A-1',date:'2026-10-22',customer:'Test',amount:'1.234,56',status:'bezahlt'}]});
 assert.equal(requests[0].url,'https://example.supabase.co/rest/v1/rpc/datencockpit_import');
 assert.equal(JSON.parse(requests[0].options.body).p_rows[0].amountCents,123456);
 assert.equal(requests[0].options.headers.apikey,config.supabasePublishableKey);
 assert.equal(requests[0].options.headers.Authorization,undefined);
 const batch={batchId:'12345678-1234-4234-8234-123456789abc',accessToken:'e'.repeat(64)};
 await client.request('GET',null,batch);
 assert.ok(!requests[1].url.includes(batch.accessToken));
 assert.equal(JSON.parse(requests[1].options.body).p_token,batch.accessToken);
});
test('Supabase transport rejects secret keys and invalid rows without network requests',async()=>{
 assert.throws(()=>createSupabaseClient({...config,supabasePublishableKey:'sb_secret_example'}),/Geheime Schlüssel/);
 const jwt=['e30',Buffer.from(JSON.stringify({role:'service_role'})).toString('base64url'),'sig'].join('.');
 assert.throws(()=>createSupabaseClient({...config,supabasePublishableKey:jwt}),/Geheime Schlüssel/);
 const client=createSupabaseClient(config,{fetchImpl:()=>assert.fail('no request expected')});
 await assert.rejects(client.request('POST',{rows:[{orderNumber:'A'}]}),/Auffälligkeiten/);
});
test('Supabase errors distinguish missing setup, expired import and server validation',async()=>{
 for(const [code,message,pattern]of [['PGRST202','missing',/eingerichtet/],['P0002','hidden',/abgelaufen/],['22023','Ungültiger Auftrag',/Ungültiger Auftrag/]]){
  const client=createSupabaseClient(config,{fetchImpl:async()=>new Response(JSON.stringify({code,message}),{status:400,headers:{'content-type':'application/json'}})});
  await assert.rejects(client.status(),pattern);
 }
});
