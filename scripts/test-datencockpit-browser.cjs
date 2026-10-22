'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs/promises');
const {chromium}=require('playwright-core');
const base=process.env.DATENCOCKPIT_TEST_URL || 'http://127.0.0.1:8888';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:1440,height:1100},acceptDownloads:true});
 // Forward external browser requests through the managed proxy, preserving TLS checks.
 if(process.env.HTTPS_PROXY || process.env.HTTP_PROXY){
  const {fetch,EnvHttpProxyAgent}=require('undici');const dispatcher=new EnvHttpProxyAgent();
  await context.route('**/*',async route=>{
   const request=route.request(),url=new URL(request.url());
   if(!['http:','https:'].includes(url.protocol)||['127.0.0.1','localhost'].includes(url.hostname))return route.continue();
   try{const response=await fetch(request.url(),{method:request.method(),headers:await request.allHeaders(),body:['GET','HEAD'].includes(request.method())?undefined:request.postDataBuffer(),dispatcher});
    const headers=Object.fromEntries(response.headers);delete headers['content-encoding'];delete headers['content-length'];delete headers['transfer-encoding'];
    await route.fulfill({status:response.status,headers,body:Buffer.from(await response.arrayBuffer())});
   }catch{await route.abort('failed');}
  });
 }
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 async function waitReport(){await page.waitForFunction(()=>!document.getElementById('report').hidden,{timeout:30000});}
 async function deleteBatch(){page.once('dialog',d=>d.accept());await page.locator('#delete').click();await page.waitForFunction(()=>!document.getElementById('upload').hidden);}
 async function cleanup(){await page.evaluate(async()=>{try{
  const config=window.DATENCOCKPIT_CONFIG || {},supabase=config.provider==='supabase';
  const batch=JSON.parse(sessionStorage.getItem(supabase?'manlin.datencockpit.supabase.v1':'manlin.datencockpit.import.v1'));
  if(batch){if(supabase)await fetch(config.supabaseUrl+'/rest/v1/rpc/datencockpit_delete',{method:'POST',headers:{apikey:config.supabasePublishableKey,'Content-Type':'application/json'},body:JSON.stringify({p_batch_id:batch.batchId,p_token:batch.accessToken})});else await fetch('/.netlify/functions/datencockpit-data?batchId='+batch.batchId,{method:'DELETE',headers:{Authorization:'Bearer '+batch.accessToken}});}
 }catch{}}).catch(()=>{});}
 try{
  await page.goto(base+'/datencockpit/');
  await page.waitForTimeout(400);await page.screenshot({path:'/tmp/datencockpit-upload.png',fullPage:true});
  if(base.includes('127.0.0.1'))assert.equal((await page.request.get(base+'/.env.local')).status(),404);
  await page.locator('#sample').click();await page.waitForFunction(()=>document.getElementById('row-count').textContent==='8');
  console.log('CSV loaded');assert.equal(await page.locator('#issue-count').textContent(),'3');assert.ok(await page.locator('#save').isDisabled());
  await page.getByRole('checkbox',{name:'Zeile 5 übernehmen',exact:true}).uncheck();
  assert.equal(await page.locator('#issue-count').textContent(),'1');
  await page.getByRole('textbox',{name:'Kunde, Zeile 6',exact:true}).fill('Musterbetrieb');
  await page.getByRole('textbox',{name:'Kunde, Zeile 6',exact:true}).press('Tab');
  await page.waitForFunction(()=>document.getElementById('issue-count').textContent==='0');
  await page.locator('#approval').check();assert.ok(await page.locator('#save').isEnabled());
  console.log('Submitting import');await page.locator('#save').click();await waitReport();
  assert.equal(await page.locator('#orders').textContent(),'7');
  assert.match(await page.locator('#revenue').textContent(),/4\.650,00/);
  assert.match(await page.locator('#open-value').textContent(),/1\.490,50/);
  assert.equal(await page.locator('#report-body tr').count(),2);
  await page.screenshot({path:'/tmp/datencockpit-report.png',fullPage:true});
  console.log('PASS browser CSV: sample -> 3 issues -> correction/exclusion -> approval -> SQL totals (7 orders, EUR 4650 paid, EUR 1490.50 open).');
  const blocked=await page.evaluate(async()=>{
   const config=window.DATENCOCKPIT_CONFIG || {};
   if(config.provider==='supabase'){
    const batch=JSON.parse(sessionStorage.getItem('manlin.datencockpit.supabase.v1'));
    const rpc=token=>fetch(config.supabaseUrl+'/rest/v1/rpc/datencockpit_report',{method:'POST',headers:{apikey:config.supabasePublishableKey,'Content-Type':'application/json'},body:JSON.stringify({p_batch_id:batch.batchId,p_token:token})});
    const results=[];for(const token of [null,'0'.repeat(64)]){const response=await rpc(token),body=await response.json();results.push({status:response.status,code:body.code,hasReport:!!body.months || !!body.totals});}return {provider:'supabase',results};
   }
   const batch=JSON.parse(sessionStorage.getItem('manlin.datencockpit.import.v1'));
   const url='/.netlify/functions/datencockpit-data?batchId='+batch.batchId;
   return [(await fetch(url)).status,(await fetch(url,{headers:{Authorization:'Bearer '+'0'.repeat(64)}})).status];
  });if(blocked.provider==='supabase'){for(const result of blocked.results){assert.ok(result.status>=400);assert.equal(result.code,'P0002');assert.equal(result.hasReport,false);}}else{assert.deepEqual(blocked,[401,404]);}console.log('PASS access isolation: missing and wrong import keys rejected with no report data.');
  const downloadPromise=page.waitForEvent('download');await page.locator('#export').click();const download=await downloadPromise;
  const csv=await fs.readFile(await download.path(),'utf8');assert.ok(csv.includes('2026-09;3;1570,00;1;840,50'));assert.ok(csv.includes('2026-10;4;3080,00;1;650,00'));
  await page.reload();await waitReport();assert.equal(await page.locator('#orders').textContent(),'7');
  console.log('PASS report CSV export and reload with tab-local import key.');
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:'/tmp/datencockpit-mobile.png',fullPage:true});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
  console.log('PASS mobile layout: no page overflow at 390px.');
  await deleteBatch();console.log('PASS delete: CSV test import removed.');
  await page.locator('#file').setInputFiles(path.join(__dirname,'../tests/fixtures/datencockpit.xlsx'));
  await page.waitForFunction(()=>document.getElementById('row-count').textContent==='2');
  assert.equal(await page.locator('#issue-count').textContent(),'0');await page.locator('#approval').check();console.log('Submitting import');await page.locator('#save').click();await waitReport();
  assert.equal(await page.locator('#orders').textContent(),'2');assert.match(await page.locator('#revenue').textContent(),/123,45/);assert.match(await page.locator('#open-value').textContent(),/50,00/);
  console.log('PASS browser XLSX: upload -> approval -> SQL report (EUR 123.45 paid, EUR 50 open).');
  await deleteBatch();console.log('PASS delete: XLSX test import removed.');
  assert.deepEqual(errors,[]);console.log('PASS browser: no JavaScript errors.');
 }catch(error){console.log('UI notice:',await page.locator('#notice').textContent());console.log('Browser errors:',errors);await page.screenshot({path:'/tmp/datencockpit-failure.png',fullPage:true});throw error;}finally{await cleanup();await browser.close();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
