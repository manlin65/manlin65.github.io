'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const {fetch,EnvHttpProxyAgent}=require('undici');
const {createSupabaseClient}=require('../datencockpit/supabase.cjs');
const {parseCSV,fromMatrix}=require('../datencockpit/data.cjs');
(async()=>{
 const scope={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../datencockpit/config.js'),'utf8'),scope);
 const config=scope.window.DATENCOCKPIT_CONFIG;
 assert.equal(config.provider,'supabase');
 const dispatcher=new EnvHttpProxyAgent(),request=(url,init)=>fetch(url,{...init,dispatcher});
 const client=createSupabaseClient(config,{fetchImpl:request});
 let batch;
 try{
  assert.equal((await client.status()).connected,true);console.log('PASS live Supabase status: PostgreSQL RPC connected.');
  for(const table of ['datencockpit_batches','datencockpit_orders']){
   const response=await request(config.supabaseUrl+'/rest/v1/'+table+'?select=*',{headers:{apikey:config.supabasePublishableKey}});
   assert.ok([401,403].includes(response.status),'Direct table access must be denied');
  }
  console.log('PASS live Supabase: direct access to both tables denied.');
  const rows=fromMatrix(parseCSV(fs.readFileSync(path.join(__dirname,'../datencockpit/beispiel.csv'),'utf8'))).filter((_,i)=>i!==3);rows[3].customer='Musterbetrieb';
  batch=await client.request('POST',{rows});assert.equal(batch.count,7);
  const report=await client.request('GET',null,batch);
  assert.deepEqual(report.totals,{orders:7,openOrders:2,revenueCents:465000,openCents:149050,cancelledOrders:1});
  assert.equal(report.months.length,2);console.log('PASS live Supabase import/report: 7 orders, EUR 4650 paid, EUR 1490.50 open.');
  await assert.rejects(client.request('GET',null,{...batch,accessToken:'0'.repeat(64)}),/nicht gefunden/);
  await assert.rejects(client.request('DELETE',null,{...batch,accessToken:'0'.repeat(64)}),/nicht gefunden/);
  console.log('PASS live Supabase: foreign import key rejected for report and deletion.');
  assert.equal((await client.request('DELETE',null,batch)).deleted,true);
  await assert.rejects(client.request('GET',null,batch),/nicht gefunden/);batch=null;
  console.log('PASS live Supabase delete: test import removed and no longer readable.');
 }finally{if(batch)await client.request('DELETE',null,batch);}
})().catch(e=>{console.error('Live Supabase check failed:',e.message);process.exitCode=1;});
