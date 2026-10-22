'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs/promises');
const {chromium}=require('playwright-core');
const base=process.env.DATENCOCKPIT_TEST_URL || 'http://127.0.0.1:8888';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:1440,height:1100},acceptDownloads:true});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 async function waitReport(){await page.waitForFunction(()=>!document.getElementById('report').hidden,{timeout:30000});}
 async function deleteBatch(){page.once('dialog',d=>d.accept());await page.locator('#delete').click();await page.waitForFunction(()=>!document.getElementById('upload').hidden);}
 async function cleanup(){await page.evaluate(async()=>{try{const batch=JSON.parse(sessionStorage.getItem('manlin.datencockpit.import.v1'));if(batch)await fetch('/.netlify/functions/datencockpit-data?batchId='+batch.batchId,{method:'DELETE',headers:{Authorization:'Bearer '+batch.accessToken}});}catch{}}).catch(()=>{});}
 try{
  await page.goto(base+'/datencockpit/');
  await page.waitForTimeout(400);await page.screenshot({path:'/tmp/datencockpit-upload.png',fullPage:true});
  assert.equal((await page.request.get(base+'/.env.local')).status(),404);
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
   const batch=JSON.parse(sessionStorage.getItem('manlin.datencockpit.import.v1'));
   const url='/.netlify/functions/datencockpit-data?batchId='+batch.batchId;
   return [(await fetch(url)).status,(await fetch(url,{headers:{Authorization:'Bearer '+'0'.repeat(64)}})).status];
  });assert.deepEqual(blocked,[401,404]);console.log('PASS access isolation: missing token 401, wrong token 404.');
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
