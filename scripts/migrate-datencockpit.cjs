'use strict';
require('./datencockpit-proxy.cjs');
const fs=require('node:fs');
const path=require('node:path');
const {neon}=require('@neondatabase/serverless');
(async()=>{
  const url=process.env.DATABASE_URL_UNPOOLED;
  if(!url)throw Error('DATABASE_URL_UNPOOLED fehlt.');
  const statements=fs.readFileSync(path.join(__dirname,'../migrations/datencockpit/001_orders.sql'),'utf8').split(';').map(s=>s.trim()).filter(Boolean);
  const sql=neon(url);
  await sql.transaction(statements.map(s=>sql.query(s,[])));
  console.log('PASS migration: DatenCockpit tables and indexes are available.');
})().catch(()=>{console.error('Migration fehlgeschlagen. Verbindung und Datenbankrechte prüfen; Zugangsdaten werden nicht protokolliert.');process.exitCode=1;});
