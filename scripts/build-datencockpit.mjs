import {build} from 'esbuild';
import {fileURLToPath} from 'node:url';
import {readFile,writeFile,readdir} from 'node:fs/promises';
const root=fileURLToPath(new URL('../',import.meta.url));
const result=await build({absWorkingDir:root,entryPoints:[root+'datencockpit/app-source.js'],bundle:true,outfile:root+'datencockpit/app.js',platform:'browser',target:['es2022'],minify:true,legalComments:'eof',metafile:true});
const packages=[...new Set(Object.keys(result.metafile.inputs).map(p=>p.match(/node_modules\/((?:@[^/]+\/)?[^/]+)/)?.[1]).filter(Boolean))].sort();
const notices=[];
for(const name of packages){
 const dir=root+'node_modules/'+name;
 const pkg=JSON.parse(await readFile(dir+'/package.json','utf8'));
 const license=(await readdir(dir)).find(p=>/^licen[cs]e(?:\.|$)/i.test(p));
 notices.push(`${name} ${pkg.version} (${pkg.license || 'see license'})\n\n${license?await readFile(dir+'/'+license,'utf8'):'See the package distribution for its license.'}`);
}
await writeFile(root+'datencockpit/THIRD_PARTY_LICENSES.txt',notices.join('\n\n--------------------\n\n').replace(/\r\n/g,'\n'));
console.log('DatenCockpit frontend built (CSV + XLSX).');
