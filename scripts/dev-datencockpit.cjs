'use strict';
const http=require('node:http');
const fs=require('node:fs/promises');
const path=require('node:path');
const envFile=path.resolve(__dirname,'../.env.local');
if(require('node:fs').existsSync(envFile))process.loadEnvFile(envFile);
require('./datencockpit-proxy.cjs');
// Match the browser's local Origin header without broadening production CORS.
process.env.URL='http://127.0.0.1:'+Number(process.env.PORT || 8888);
const handlers={
 '/.netlify/functions/datencockpit-status':require('../netlify/functions/datencockpit-status.js').handler,
 '/.netlify/functions/datencockpit-data':require('../netlify/functions/datencockpit-data.js').handler
};
const root=path.resolve(__dirname,'../datencockpit');
const assets=path.resolve(__dirname,'../assets');
const publicAssets=new Map([['/assets/site.css','text/css'],['/assets/site.js','text/javascript']]);
for(const name of require('node:fs').readdirSync(path.join(assets,'brand')))publicAssets.set('/assets/brand/'+name,name.endsWith('.svg')?'image/svg+xml':'image/png');
for(const name of require('node:fs').readdirSync(path.join(assets,'fonts')))publicAssets.set('/assets/fonts/'+name,'font/ttf');
const files={
 '/datencockpit/':['index.html','text/html; charset=utf-8'],
 '/datencockpit/styles.css':['styles.css','text/css; charset=utf-8'],
 '/datencockpit/app.js':['app.js','text/javascript; charset=utf-8'],
 '/datencockpit/config.js':['config.js','text/javascript; charset=utf-8'],
 '/datencockpit/beispiel.csv':['beispiel.csv','text/csv; charset=utf-8']
};
files['/datencockpit/downloads/DatenCockpit-Howto.pdf']=['downloads/DatenCockpit-Howto.pdf','application/pdf'];
files['/datencockpit/downloads/DatenCockpit-Anleitung-und-Beispiele.zip']=['downloads/DatenCockpit-Anleitung-und-Beispiele.zip','application/zip'];
http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost');
 if(handlers[url.pathname]){
  let body='',size=0;
  try{
   for await(const chunk of req){size+=chunk.length;if(size>1024*1024){res.writeHead(413);res.end();return;}body+=chunk;}
   const result=await handlers[url.pathname]({httpMethod:req.method,headers:req.headers,queryStringParameters:Object.fromEntries(url.searchParams),body});
   res.writeHead(result.statusCode,result.headers);res.end(result.body);
  }catch{res.writeHead(500);res.end();}
  return;
 }
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
 if(publicAssets.has(url.pathname)){
  try{const body=await fs.readFile(path.join(assets,url.pathname.slice('/assets/'.length)));res.writeHead(200,{'Content-Type':publicAssets.get(url.pathname)});res.end(req.method==='HEAD'?undefined:body);}
  catch{res.writeHead(404);res.end();}
  return;
 }
 const file=files[url.pathname];
 if(!file){res.writeHead(404);res.end('Not found');return;}
 if(file[0]==='config.js'){
  const config=await fs.readFile(path.join(root,'config.js'),'utf8');
  res.writeHead(200,{'Content-Type':'text/javascript; charset=utf-8','Cache-Control':'no-store'});
  res.end(req.method==='HEAD'?undefined:/provider\s*:\s*['"]supabase['"]/.test(config)?config:"window.DATENCOCKPIT_CONFIG=Object.freeze({apiUrl:'',dataApiUrl:''});");return;
 }
 try{const body=await fs.readFile(path.join(root,file[0]));res.writeHead(200,{'Content-Type':file[1],'Cache-Control':'no-store'});res.end(req.method==='HEAD'?undefined:body);}
 catch{res.writeHead(500);res.end('File unavailable');}
}).listen(Number(process.env.PORT || 8888),'127.0.0.1',()=>console.log('DatenCockpit development server started on port '+(process.env.PORT || 8888)));
