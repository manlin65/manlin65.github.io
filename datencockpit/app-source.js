import {readSheet} from 'read-excel-file/browser';
import data from './data.cjs';
import supabase from './supabase.cjs';
const {FIELDS,HEADERS,parseCSV,fromMatrix,inspect}=data;
const $=id=>document.getElementById(id);
const money=cents=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(cents/100);
const monthLabel=value=>new Intl.DateTimeFormat('de-DE',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(value+'-01T00:00:00Z'));
const state={rows:[],excluded:new Set(),issuesOnly:false,batch:null,report:null,busy:false,fileName:''};
const useSupabase=window.DATENCOCKPIT_CONFIG?.provider==='supabase';
const sessionKey=useSupabase?'manlin.datencockpit.supabase.v1':'manlin.datencockpit.import.v1';
try{const b=JSON.parse(sessionStorage.getItem(sessionKey));if(b && /^[0-9a-f-]{36}$/.test(b.batchId) && /^[0-9a-f]{64}$/.test(b.accessToken))state.batch=b;}catch{}
function notice(message,error=false){$('notice').textContent=message;$('notice').classList.toggle('error',error);$('notice').hidden=!message;}
function step(name){
  for(const id of ['upload','review','report'])$(id).hidden=id!==name;
  document.querySelectorAll('[data-step]').forEach(button=>{
    if(button.dataset.step===name)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');
    button.disabled=state.busy || (button.dataset.step==='review' && !state.rows.length) || (button.dataset.step==='report' && !state.report);
  });
}
function api(kind){
  const config=window.DATENCOCKPIT_CONFIG || {};
  if(kind==='status')return config.apiUrl || '/.netlify/functions/datencockpit-status';
  return config.dataApiUrl || (config.apiUrl?config.apiUrl.replace(/datencockpit-status(?:\?.*)?$/,'datencockpit-data'):'/.netlify/functions/datencockpit-data');
}
async function request(method,body,batch=state.batch){
  if(useSupabase)return supabase.createSupabaseClient(window.DATENCOCKPIT_CONFIG).request(method,body,batch);
  const url=new URL(api('data'),window.location.href),headers={Accept:'application/json'};
  if(method!=='POST'){
    if(!batch)throw Error('Kein freigegebener Import verfügbar.');
    url.searchParams.set('batchId',batch.batchId);headers.Authorization='Bearer '+batch.accessToken;
  }
  if(body)headers['Content-Type']='application/json';
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),25000);
  try{
    const response=await fetch(url,{method,headers,body:body?JSON.stringify(body):undefined,cache:'no-store',signal:controller.signal});
    if(!response.headers.get('content-type')?.includes('application/json'))throw Error('Das Backend ist nicht eingerichtet oder nicht erreichbar. Ihre Prüfliste bleibt erhalten.');
    const result=await response.json();
    if(!response.ok)throw Error(result.error || 'Die Anfrage konnte nicht ausgeführt werden.');
    return result;
  }catch(error){if(error.name==='AbortError')throw Error('Die Anfrage dauert zu lange. Bitte erneut versuchen.');throw error;}
  finally{clearTimeout(timer);}
}
function activeCheck(){const indexes=[];state.rows.forEach((_,i)=>{if(!state.excluded.has(i))indexes.push(i);});const checked=inspect(indexes.map(i=>state.rows[i]));return {indexes,checked,byIndex:new Map(indexes.map((i,k)=>[i,checked[k]]))};}
function updateQuality(){
  const {checked}=activeCheck(),bad=checked.filter(r=>r.issues.length).length;
  $('row-count').textContent=state.rows.length;$('valid-count').textContent=checked.length-bad;$('issue-count').textContent=bad;$('excluded-count').textContent=state.excluded.size;
  $('save').disabled=state.busy || bad>0 || !checked.length || !$('approval').checked;
  $('approval-hint').textContent=bad?`${bad} Zeile${bad===1?'':'n'} noch korrigieren oder ausschließen.`:checked.length?`${checked.length} Auftrag${checked.length===1?'':'e'} zur Freigabe bereit.`:'Mindestens einen Auftrag auswählen.';
  $('file-label').textContent=state.fileName+' · Werte lassen sich vor dem Speichern ändern.';
}
function renderReview(){
  const {byIndex}=activeCheck(),body=$('review-body');body.replaceChildren();
  state.rows.forEach((row,index)=>{
    const excluded=state.excluded.has(index),issues=byIndex.get(index)?.issues || [];
    if(state.issuesOnly && !issues.length)return;
    const tr=document.createElement('tr');tr.className=excluded?'row-excluded':issues.length?'row-issue':'';
    const nr=document.createElement('td');nr.textContent=index+2;tr.append(nr);
    FIELDS.forEach((field,j)=>{
      const td=document.createElement('td');let input;
      if(field==='status'){
        input=document.createElement('select');
        for(const value of [...new Set(['','offen','bezahlt','storniert',row.status])]){const option=document.createElement('option');option.value=value;option.textContent=value || 'Bitte wählen';input.append(option);}
      }else{input=document.createElement('input');input.type='text';input.maxLength=field==='customer'?160:field==='orderNumber'?80:200;if(field==='amount')input.inputMode='decimal';}
      input.value=row[field];input.dataset.field=field;input.setAttribute('aria-label',`${HEADERS[j]}, Zeile ${index+2}`);input.disabled=excluded || state.busy;
      input.addEventListener('change',()=>{state.rows[index][field]=input.value;$('approval').checked=false;renderReview();});
      td.append(input);tr.append(td);
    });
    const result=document.createElement('td');result.className=issues.length?'issue-label':'row-good';result.textContent=excluded?'Ausgeschlossen':issues.length?issues.join(' · '):'✓ Geprüft';tr.append(result);
    const choice=document.createElement('td'),checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.checked=!excluded;checkbox.disabled=state.busy;checkbox.setAttribute('aria-label',`Zeile ${index+2} übernehmen`);
    checkbox.addEventListener('change',()=>{if(checkbox.checked)state.excluded.delete(index);else state.excluded.add(index);$('approval').checked=false;renderReview();});choice.append(checkbox);tr.append(choice);body.append(tr);
  });
  if(!body.children.length){const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=8;td.textContent='Keine Auffälligkeiten in den ausgewählten Zeilen.';tr.append(td);body.append(tr);}
  updateQuality();
}
async function loadFile(file){
  if(!file || state.busy)return;
  if(file.size>2*1024*1024){notice('Die Datei ist größer als 2 MB.',true);return;}
  state.busy=true;$('sample').disabled=true;notice('Datei wird eingelesen …');
  try{
    const extension=file.name.split('.').pop().toLowerCase();let matrix;
    if(extension==='csv')matrix=parseCSV(await file.text());
    else if(extension==='xlsx')matrix=await readSheet(file);
    else throw Error('Bitte eine CSV- oder XLSX-Datei wählen. Alte XLS-Dateien bitte zuerst als XLSX speichern.');
    state.rows=fromMatrix(matrix);state.excluded=new Set();state.fileName=file.name;state.issuesOnly=false;state.report=null;$('approval').checked=false;
    $('filter-all').classList.add('active');$('filter-issues').classList.remove('active');
    notice('Datei eingelesen. Prüfen Sie die markierten Zeilen vor der Freigabe.');
    state.busy=false;renderReview();step('review');
  }catch(error){notice(error.message || 'Die Datei konnte nicht gelesen werden.',true);}
  finally{state.busy=false;$('sample').disabled=false;$('file').value='';}
}
$('file').addEventListener('change',event=>loadFile(event.target.files[0]));
const zone=$('dropzone');
for(const type of ['dragenter','dragover'])zone.addEventListener(type,event=>{event.preventDefault();zone.classList.add('drag');});
for(const type of ['dragleave','drop'])zone.addEventListener(type,event=>{event.preventDefault();zone.classList.remove('drag');});
zone.addEventListener('drop',event=>loadFile(event.dataTransfer.files[0]));
$('sample').addEventListener('click',async()=>{
  try{const response=await fetch('beispiel.csv');if(!response.ok)throw Error('Beispieldatei nicht erreichbar.');await loadFile(new File([await response.text()],'datencockpit-beispiel.csv',{type:'text/csv'}));}catch(error){notice(error.message,true);}
});
$('new-import').addEventListener('click',()=>{if(!state.busy){notice('');step('upload');}});
for(const [id,issues] of [['filter-all',false],['filter-issues',true]])$(id).addEventListener('click',()=>{state.issuesOnly=issues;$('filter-all').classList.toggle('active',!issues);$('filter-issues').classList.toggle('active',issues);renderReview();});
$('approval').addEventListener('change',updateQuality);
$('save').addEventListener('click',async()=>{
  const {checked}=activeCheck();if(state.busy || !$('approval').checked || !checked.length || checked.some(r=>r.issues.length))return;
  state.busy=true;$('approval').disabled=true;renderReview();step('review');notice('Freigegebene Aufträge werden gespeichert und per SQL ausgewertet …');
  try{
    const result=await request('POST',{rows:checked.map(r=>r.row)});state.batch={batchId:result.batchId,accessToken:result.accessToken};
    try{sessionStorage.setItem(sessionKey,JSON.stringify(state.batch));}catch{}
    state.report=await request('GET');renderReport();step('report');notice(`${result.count} Aufträge freigegeben. Der Monatsbericht wurde aus PostgreSQL geladen.`);
  }catch(error){notice(error.message || 'Speichern fehlgeschlagen.',true);}
  finally{state.busy=false;$('approval').disabled=false;renderReview();document.querySelectorAll('[data-step]').forEach(b=>b.disabled=(b.dataset.step==='review'&&!state.rows.length)||(b.dataset.step==='report'&&!state.report));}
});
function renderReport(){
  const {totals,months}=state.report;
  $('revenue').textContent=money(totals.revenueCents);$('open-value').textContent=money(totals.openCents);$('orders').textContent=totals.orders;
  $('open-count').textContent=`${totals.openOrders} offene Aufträge`;$('cancelled-count').textContent=`Davon ${totals.cancelledOrders} storniert`;
  const body=$('report-body'),chart=$('chart');body.replaceChildren();chart.replaceChildren();
  const max=Math.max(1,...months.flatMap(m=>[m.revenueCents,m.openCents]));
  for(const month of months){
    const tr=document.createElement('tr');
    for(const value of [monthLabel(month.month),month.orders,money(month.revenueCents),month.openOrders,money(month.openCents)]){const td=document.createElement('td');td.textContent=value;tr.append(td);}body.append(tr);
    const group=document.createElement('div'),label=document.createElement('div');label.className='chart-month';label.textContent=monthLabel(month.month);group.append(label);
    for(const [key,type] of [['revenueCents','paid'],['openCents','open']]){
      const line=document.createElement('div'),track=document.createElement('div'),bar=document.createElement('span'),value=document.createElement('span');
      line.className='bar-line';track.className='bar-track';bar.className='bar-fill '+type;bar.style.width=month[key]/max*100+'%';value.className='bar-value';value.textContent=money(month[key]);track.append(bar);line.append(track,value);group.append(line);
    }chart.append(group);
  }
}
async function refresh(){if(state.busy)return;state.busy=true;$('refresh').disabled=true;try{state.report=await request('GET');renderReport();step('report');notice('Bericht aktuell aus PostgreSQL geladen.');}catch(error){notice(error.message,true);}finally{state.busy=false;$('refresh').disabled=false;step(state.report?'report':'upload');}}
$('refresh').addEventListener('click',refresh);
$('delete').addEventListener('click',async()=>{
  if(state.busy || !state.batch)return;
  if(!window.confirm('Diesen Import und seine Aufträge endgültig aus der Datenbank löschen?'))return;
  state.busy=true;$('delete').disabled=true;
  try{await request('DELETE');state.batch=null;state.report=null;state.rows=[];state.excluded=new Set();try{sessionStorage.removeItem(sessionKey);}catch{}step('upload');notice('Der Import und alle zugehörigen Aufträge wurden gelöscht.');}
  catch(error){notice(error.message,true);}
  finally{state.busy=false;$('delete').disabled=false;step(state.report?'report':'upload');}
});
$('show-sql').addEventListener('click',()=>{const hidden=$('sql').hidden;$('sql').hidden=!hidden;$('show-sql').setAttribute('aria-expanded',String(hidden));if(hidden)$('sql').scrollIntoView({behavior:'smooth',block:'nearest'});});
$('export').addEventListener('click',()=>{
  if(!state.report)return;
  const rows=[['Monat','Aufträge','Umsatz bezahlt EUR','Offene Aufträge','Offenes Volumen EUR'],...state.report.months.map(m=>[m.month,m.orders,(m.revenueCents/100).toFixed(2).replace('.',','),m.openOrders,(m.openCents/100).toFixed(2).replace('.',',')])];
  const blob=new Blob(['\uFEFF'+rows.map(r=>r.join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='datencockpit-monatsbericht.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
$('check').addEventListener('click',async()=>{
  $('check').disabled=true;$('status').textContent='Verbindung wird geprüft …';
  try{if(useSupabase){const result=await supabase.createSupabaseClient(window.DATENCOCKPIT_CONFIG).status();$('status').textContent=result.connected?'Supabase verbunden · SQL-Test erfolgreich':'Verbindung fehlgeschlagen.';}else{const response=await fetch(api('status'),{cache:'no-store'});const result=await response.json();$('status').textContent=response.ok&&result.connected?'PostgreSQL verbunden · SQL-Test erfolgreich':(result.error || 'Verbindung fehlgeschlagen.');}}
  catch{$('status').textContent='Backend nicht erreichbar. API-Adresse und Verbindung prüfen.';}
  finally{$('check').disabled=false;}
});
document.querySelectorAll('[data-step]').forEach(button=>button.addEventListener('click',()=>{if(!state.busy)step(button.dataset.step);}));
step('upload');if(state.batch)refresh();
