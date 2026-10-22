'use strict';
const {inspect}=require('./data.cjs');
function createSupabaseClient(config,{fetchImpl=globalThis.fetch}={}){
 let url;
 try{url=new URL(config.supabaseUrl);}catch{throw Error('Die Supabase-Projektadresse fehlt.');}
 if(url.protocol!=='https:' || !url.hostname.endsWith('.supabase.co') || url.username || url.password)throw Error('Ungültige Supabase-Projektadresse.');
 const key=config.supabasePublishableKey || '';
 let legacy=false;
 if(!/^sb_publishable_[a-zA-Z0-9_-]+$/.test(key)){
  try{const payload=JSON.parse(globalThis.atob(key.split('.')[1].replaceAll('-','+').replaceAll('_','/')));legacy=payload.role==='anon';}catch{}
  if(!legacy)throw Error('Ein öffentlicher Supabase Publishable- oder anon-Key fehlt. Geheime Schlüssel sind hier nicht erlaubt.');
 }
 async function rpc(name,params){
  const headers={apikey:key,'Content-Type':'application/json',Accept:'application/json'};
  if(legacy)headers.Authorization='Bearer '+key;
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),25000);
  try{
   const response=await fetchImpl(new URL('/rest/v1/rpc/'+name,url),{method:'POST',headers,body:JSON.stringify(params),cache:'no-store',signal:controller.signal});
   if(!response.headers.get('content-type')?.includes('application/json'))throw Error('Supabase ist momentan nicht erreichbar.');
   const data=await response.json();
   if(!response.ok){
    if(['PGRST202','42P01','42883','42501'].includes(data.code))throw Error('Die Supabase-Funktionen und Zugriffsrechte müssen noch eingerichtet werden.');
    if(data.code==='P0002')throw Error('Import nicht gefunden oder nach 24 Stunden abgelaufen.');
    if(data.code==='22023')throw Error(data.message || 'Die Auftragsdaten sind ungültig.');
    if(response.status===401 || response.status===403)throw Error('Der öffentliche Supabase-Schlüssel wurde nicht akzeptiert.');
    throw Error('Die Datenbankanfrage konnte nicht ausgeführt werden. Bitte erneut versuchen.');
   }
   return data;
  }catch(error){if(error.name==='AbortError')throw Error('Die Anfrage dauert zu lange. Bitte erneut versuchen.');throw error;}
  finally{clearTimeout(timer);}
 }
 return {
  status:()=>rpc('datencockpit_status',{}),
  async request(method,body,batch){
   if(method==='POST'){
    if(!Array.isArray(body?.rows) || !body.rows.length || body.rows.length>1000)throw Error('1 bis 1.000 Aufträge sind erlaubt.');
    const checked=inspect(body.rows);
    if(checked.some(r=>r.issues.length))throw Error('Bitte alle Auffälligkeiten vor der Freigabe korrigieren.');
    return rpc('datencockpit_import',{p_rows:checked.map(({row,amountCents})=>({orderNumber:row.orderNumber,date:row.date,customer:row.customer,status:row.status,amountCents}))});
   }
   if(!batch)throw Error('Kein freigegebener Import verfügbar.');
   if(!['GET','DELETE'].includes(method))throw Error('Methode nicht unterstützt.');
   return rpc(method==='GET'?'datencockpit_report':'datencockpit_delete',{p_batch_id:batch.batchId,p_token:batch.accessToken});
  }
 };
}
module.exports={createSupabaseClient};
