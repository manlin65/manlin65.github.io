const {test}=require('node:test');
const assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
function files(dir) {return fs.readdirSync(dir,{withFileTypes:true}).flatMap(item=>item.isDirectory()?files(path.join(dir,item.name)):[path.join(dir,item.name)]).sort();}
function build() {const result=spawnSync(process.execPath,['scripts/build-netlify.mjs'],{cwd:root,env:{...process.env,TICKETMASTER_API_KEY:'TEST_ONLY_NOT_A_REAL_API_KEY'},encoding:'utf8'});assert.equal(result.status,0,result.stderr);return result.stdout;}
function digest(dir) {const hash=crypto.createHash('sha256');for(const file of files(dir)){hash.update(path.relative(dir,file));hash.update(fs.readFileSync(file));}return hash.digest('hex');}
test('Netlify output runs at the site root and excludes server code, docs and secrets',()=>{
 const log=build();assert.ok(!log.includes('TEST_ONLY_NOT_A_REAL_API_KEY'));
 const publicDir=path.join(root,'netlify-public'),output=files(publicDir);
 for(const file of ['index.html','app.js','events.js','tickets.js','config.js','styles.css','assets/flags/cz.svg','assets/flags/de.svg','assets/flags/LICENSE.txt']) assert.ok(fs.existsSync(path.join(publicDir,file)),file);
 assert.ok(!output.some(file=>/\.(?:php|md)$/.test(file) || path.basename(file).startsWith('.env') || path.basename(file)==='rauszeit.env'));
 for(const file of output)assert.ok(!fs.readFileSync(file).includes(Buffer.from('TEST_ONLY_NOT_A_REAL_API_KEY')),'secret marker in '+file);
 const config=fs.readFileSync(path.join(publicDir,'config.js'),'utf8');assert.match(config,/window.location.origin/);assert.match(config,/\.netlify\/functions\/events/);
 const first=digest(publicDir);build();assert.equal(digest(publicDir),first);
});
