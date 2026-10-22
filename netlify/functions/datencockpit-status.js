'use strict';
const {neon}=require('@neondatabase/serverless');

function createHandler({connectionString=()=>process.env.DATABASE_URL,connect=neon}={}) {
  return async event=>{
    const origin=event.headers?.origin || event.headers?.Origin;
    const allowed=new Set(['https://mlinner-software.de','https://www.mlinner-software.de','https://manlin65.github.io']);
    if(process.env.URL) allowed.add(process.env.URL);
    const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Vary':'Origin'};
    const reply=(statusCode,data)=>({statusCode,headers,body:JSON.stringify(data)});
    if(origin && !allowed.has(origin)) return reply(403,{error:'Diese Website ist nicht freigegeben.'});
    if(origin) headers['Access-Control-Allow-Origin']=origin;
    if(event.httpMethod==='OPTIONS') {
      headers['Access-Control-Allow-Methods']='GET, OPTIONS';
      return {statusCode:204,headers,body:''};
    }
    if(event.httpMethod!=='GET') {
      headers.Allow='GET, OPTIONS';
      return reply(405,{error:'Nur GET ist erlaubt.'});
    }
    if(!connectionString()) return reply(503,{connected:false,error:'Die Datenbank ist im Backend noch nicht konfiguriert.'});
    try {
      const sql=connect(connectionString());
      // A real, read-only round trip. Never accept arbitrary SQL from the browser.
      const rows=await sql`SELECT 1::int AS ok`;
      if(rows[0]?.ok!==1) throw new Error('Unexpected database response');
      return reply(200,{connected:true,service:'PostgreSQL',message:'Die Datenbankverbindung funktioniert.'});
    } catch {
      // Driver errors can include connection details; do not send them to clients.
      return reply(503,{connected:false,error:'Die Datenbank ist momentan nicht erreichbar.'});
    }
  };
}
exports.createHandler=createHandler;
exports.handler=createHandler();
