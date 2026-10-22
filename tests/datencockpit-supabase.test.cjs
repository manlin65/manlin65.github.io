const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {PGlite}=require('@electric-sql/pglite');
const {fromMatrix,parseCSV,inspect}=require('../datencockpit/data.cjs');
test('Supabase SQL: private tables, validated imports, capability isolation, totals, expiry and deletion',async()=>{
 const db=new PGlite();
 try{
  await db.exec('CREATE ROLE anon; CREATE ROLE authenticated;');
  for(const name of ['202610220001_datencockpit_tables.sql','202610220002_datencockpit_functions.sql'])await db.exec(fs.readFileSync(path.join(__dirname,'../supabase/migrations',name),'utf8'));
  await db.exec('SET ROLE anon');
  await assert.rejects(db.query('SELECT * FROM public.datencockpit_orders'),/permission denied/);
  await assert.rejects(db.query('SELECT * FROM public.datencockpit_batches'),/permission denied/);
  const rows=fromMatrix(parseCSV(fs.readFileSync(path.join(__dirname,'../datencockpit/beispiel.csv'),'utf8'))).filter((_,i)=>i!==3);rows[3].customer='Musterbetrieb';
  const payload=inspect(rows).map(({row,amountCents})=>({...row,amountCents}));
  const invoke=async(name,args)=>{const result=await db.query(`SELECT public.${name}(${args.map((_,i)=>'$'+(i+1)).join(',')}) AS result`,args);return result.rows[0].result;};
  const batch=await invoke('datencockpit_import',[JSON.stringify(payload)]);
  assert.equal(batch.count,7);assert.match(batch.accessToken,/^[a-f0-9]{64}$/);
  const report=await invoke('datencockpit_report',[batch.batchId,batch.accessToken]);
  assert.deepEqual(report.totals,{orders:7,openOrders:2,revenueCents:465000,openCents:149050,cancelledOrders:1});
  assert.deepEqual(report.months.map(m=>m.month),['2026-09','2026-10']);
  await assert.rejects(invoke('datencockpit_report',[batch.batchId,'0'.repeat(64)]),/nicht gefunden/);
  await assert.rejects(invoke('datencockpit_delete',[batch.batchId,'0'.repeat(64)]),/nicht gefunden/);
  for(const bad of [[{...payload[0],customer:''}],[payload[0],{...payload[0],orderNumber:payload[0].orderNumber.toLowerCase()}],[{...payload[0],date:'2026-02-30'}],[{...payload[0],amountCents:1.5}],[{...payload[0],status:'invalid'}],[{...payload[0],amountCents:-1}],[]])await assert.rejects(invoke('datencockpit_import',[JSON.stringify(bad)]));
  await db.exec('RESET ROLE');
  assert.equal((await db.query('SELECT count(*)::int AS n FROM public.datencockpit_batches')).rows[0].n,1,'invalid imports must roll back');
  await db.exec('SET ROLE authenticated');
  await assert.rejects(db.query('SELECT * FROM public.datencockpit_orders'),/permission denied/);
  assert.deepEqual(await invoke('datencockpit_delete',[batch.batchId,batch.accessToken]),{deleted:true});
  await db.exec('RESET ROLE');
  assert.equal((await db.query('SELECT count(*)::int AS n FROM public.datencockpit_orders')).rows[0].n,0);
  await db.exec('SET ROLE anon');const expiring=await invoke('datencockpit_import',[JSON.stringify([payload[0]])]);await db.exec('RESET ROLE');
  await db.query("UPDATE public.datencockpit_batches SET expires_at=now()-interval '1 hour' WHERE id=$1",[expiring.batchId]);await db.exec('SET ROLE anon');
  await assert.rejects(invoke('datencockpit_report',[expiring.batchId,expiring.accessToken]),/abgelaufen/);
  const final=await invoke('datencockpit_import',[JSON.stringify([payload[0]])]);await invoke('datencockpit_delete',[final.batchId,final.accessToken]);await db.exec('RESET ROLE');
  assert.equal((await db.query('SELECT count(*)::int AS n FROM public.datencockpit_batches')).rows[0].n,0,'expired imports removed on next import');
 }finally{await db.close();}
});
