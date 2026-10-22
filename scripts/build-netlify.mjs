import {cp, mkdir, readFile, readdir, rm, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import './build-datencockpit.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const source=path.join(root,'wochenende');
const output=path.join(root,'netlify-public');
// This directory contains generated files only. Never publish the repository root.
await rm(output,{recursive:true,force:true});
await mkdir(path.join(output,'assets','flags'),{recursive:true});
await mkdir(path.join(output,'datencockpit'),{recursive:true});
// Share the homepage identity with the cockpit, including locally hosted fonts.
for(const name of ['site.css','site.js','brand','fonts']) {
  await cp(path.join(root,'assets',name),path.join(output,'assets',name),{recursive:true});
}
for(const name of ['index.html','app.js','config.js','styles.css','beispiel.csv','THIRD_PARTY_LICENSES.txt']) {
  await cp(path.join(root,'datencockpit',name),path.join(output,'datencockpit',name));
}
for(const name of ['downloads','assets']) {
  await cp(path.join(root,'datencockpit',name),path.join(output,'datencockpit',name),{recursive:true});
}
// On Netlify use the functions belonging to this deployment, including previews.
const cockpitConfig=await readFile(path.join(root,'datencockpit','config.js'),'utf8');
if(!/provider\s*:\s*['"]supabase['"]/.test(cockpitConfig)) {
  await writeFile(path.join(output,'datencockpit','config.js'),"window.DATENCOCKPIT_CONFIG=Object.freeze({apiUrl:'',dataApiUrl:''});\n");
}
for(const name of ['index.html','app.js','events.js','interests.js','tickets.js','christmas.js','styles.css']) {
  await cp(path.join(source,name),path.join(output,name));
}
for(const item of await readdir(path.join(source,'assets','flags'),{withFileTypes:true})) {
  if(item.isFile() && (/^[a-z]{2}\.svg$/.test(item.name) || ['LICENSE.txt','README.txt'].includes(item.name))) {
    await cp(path.join(source,'assets','flags',item.name),path.join(output,'assets','flags',item.name));
  }
}
// Public same-origin address only. The API key remains in Netlify Functions.
await writeFile(path.join(output,'config.js'),`// Generated for Netlify; contains no credentials.\nwindow.RAUSZEIT_CONFIG = Object.freeze({\n  eventApiUrl: new URL('/.netlify/functions/events', window.location.origin).href,\n  christmasApiUrl: new URL('/.netlify/functions/christmas-markets', window.location.origin).href\n});\n`);
const html=await readFile(path.join(output,'index.html'),'utf8');
if(!html.includes('src="config.js"')) throw new Error('Missing public backend configuration script');
console.log('Netlify build complete: netlify-public (frontend + local flags). Backend: netlify/functions.');
