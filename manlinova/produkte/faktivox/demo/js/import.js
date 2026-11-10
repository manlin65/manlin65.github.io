(function(root){'use strict';const F=root.FAKTIVOX;
F.parseCSV=function(text){
 if(!text||!text.trim())throw Error('Die CSV-Datei ist leer.');text=text.replace(/^\uFEFF/,'');
 const first=text.split(/\r?\n/)[0];const sep=first.includes(';')?';':',';
 let rows=[],row=[],field='',quoted=false,line=1,start=1,after=false;
 for(let i=0;i<text.length;i++){let c=text[i];if(quoted){if(c==='"'&&text[i+1]==='"'){field+='"';i++;}else if(c==='"'){quoted=false;after=true;}else{field+=c;if(c==='\n')line++;}continue;}
 if(c==='"'){if(field||after)throw Error(`CSV, Zeile ${line}: Unerwartetes Anführungszeichen.`);quoted=true;}
 else if(c===sep){row.push(field);field='';after=false;}
 else if(c==='\r'&&text[i+1]==='\n'){}else if(c==='\n'||c==='\r'){row.push(field);if(row.some(v=>v.trim()))rows.push({values:row,line:start});row=[];field='';after=false;line++;start=line;}
 else{if(after)throw Error(`CSV, Zeile ${line}: Ungültiges Zeichen nach einem geschlossenen Feld.`);field+=c;}}
 if(quoted)throw Error('CSV: Ein Feld mit Anführungszeichen wurde nicht geschlossen.');row.push(field);if(row.some(v=>v.trim()))rows.push({values:row,line:start});if(rows.length<2)throw Error('Die CSV-Datei enthält keine Datenzeilen.');
 const headers=rows.shift().values.map(s=>s.trim());if(new Set(headers).size!==headers.length||headers.includes(''))throw Error('CSV: Leere oder doppelte Spaltenüberschriften.');
 return rows.map(r=>{if(r.values.length!==headers.length)throw Error(`CSV, Zeile ${r.line}: ${r.values.length} statt ${headers.length} Spalten. Bitte das Trennzeichen prüfen.`);return Object.assign(Object.fromEntries(headers.map((h,i)=>[h,r.values[i].trim()])),{_row:r.line});});
};
F.csvColumns=['ID','Nummer','Datum','Leistungsdatum','Fall','Kaeuferreferenz','V_Name','V_Strasse','V_PLZ','V_Ort','V_Land','V_UStID','V_IBAN','K_Name','K_Strasse','K_PLZ','K_Ort','K_Land','Position','Beschreibung','Menge','Einzelpreis','Steuersatz'];
F.fromCSV=function(text){const rows=F.parseCSV(text);for(const h of ['ID','Nummer','Datum','V_Name','K_Name','Beschreibung','Menge','Einzelpreis','Steuersatz'])if(!(h in rows[0]))throw Error(`CSV-Spalte „${h}“ fehlt. Nutzen Sie bitte die Beispieldatei.`);
 const group=new Map();for(const r of rows){const id=r.ID||`fehlend-Zeile-${r._row}`;let inv=group.get(id);const party=prefix=>F.partyFrom(Object.fromEntries(['Name','Strasse','PLZ','Ort','Land','UStID','IBAN'].map(k=>[k,r[prefix+k]||''])));if(!inv){inv={id,number:r.Nummer,date:r.Datum,serviceDate:r.Leistungsdatum||'',reference:r.Kaeuferreferenz||'',case:(r.Fall||'B2B').toUpperCase(),seller:party('V_'),buyer:party('K_'),sourceRow:r._row,sourceSheet:'CSV',lines:[],importIssues:[]};if(!r.ID)inv.importIssues.push({severity:'error',field:'ID',row:r._row,sheet:'CSV',message:'Rechnungs-ID fehlt.'});group.set(id,inv);}else{
 const base=rows.find(x=>x.ID===id);for(const k of ['Nummer','Datum','Leistungsdatum','Fall','Kaeuferreferenz',...F.csvColumns.filter(k=>k.startsWith('V_')||k.startsWith('K_'))])if((r[k]||'')!==(base[k]||''))throw Error(`CSV, Zeile ${r._row}: Widersprüchliche Kopfdaten für Rechnungs-ID „${id}“ (${k}).`);
 }inv.lines.push({position:r.Position||'',description:r.Beschreibung,quantity:r.Menge,price:r.Einzelpreis,tax:r.Steuersatz,sourceRow:r._row,sourceSheet:'CSV'});}return [...group.values()];};
F.sampleCSV=function(){let rows=[F.csvColumns];for(const inv of F.sampleInvoices())for(const l of inv.lines){const r={ID:inv.id,Nummer:inv.number,Datum:inv.date,Leistungsdatum:inv.serviceDate,Fall:inv.case,Kaeuferreferenz:inv.reference,Position:l.position,Beschreibung:l.description,Menge:l.quantity,Einzelpreis:l.price,Steuersatz:l.tax};for(const[prefix,p]of[['V_',inv.seller],['K_',inv.buyer]])Object.assign(r,{[prefix+'Name']:p.name,[prefix+'Strasse']:p.street,[prefix+'PLZ']:p.zip,[prefix+'Ort']:p.city,[prefix+'Land']:p.country,[prefix+'UStID']:p.taxId||'',[prefix+'IBAN']:p.iban||''});rows.push(F.csvColumns.map(k=>r[k]??''));}return '\uFEFF'+rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(';')).join('\r\n');};
// XLSX is ZIP + OOXML. This narrow reader accepts data cells in our documented schema.
// JSZip 3.10.1 (MIT) is vendored. No CDN, macros, formula evaluation or external links.
F.readXlsx=async function(data){
 if(!root.JSZip)throw Error('Die lokale Excel-Komponente konnte nicht geladen werden.');
 let zip;try{zip=await root.JSZip.loadAsync(data);}catch{throw Error('Keine lesbare XLSX-Datei. Bitte eine unverschlüsselte .xlsx-Datei verwenden.');}
 const entries=Object.values(zip.files);if(entries.length>300)throw Error('Die Arbeitsmappe enthält zu viele ZIP-Einträge (maximal 300).');
 let size=0;for(const e of entries){size+=e._data?.uncompressedSize||0;}if(size>25*1024*1024)throw Error('Die entpackte Arbeitsmappe ist zu groß (maximal 25 MB).');
 const parse=txt=>{const doc=new DOMParser().parseFromString(txt,'application/xml');if(doc.getElementsByTagName('parsererror').length)throw Error('Die Excel-Datei enthält ungültiges XML.');return doc;};
 const nodes=(doc,name)=>Array.from(doc.getElementsByTagNameNS('*',name));
 const xml=async path=>{const e=zip.file(path);if(!e)throw Error(`Excel-Dateibestandteil fehlt: ${path}`);return parse(await e.async('string'));};
 const book=await xml('xl/workbook.xml');if(nodes(book,'workbookPr').some(x=>['1','true'].includes(x.getAttribute('date1904'))))throw Error('Arbeitsmappen mit 1904-Datumssystem werden in der Demo nicht unterstützt.');
 const rels=nodes(await xml('xl/_rels/workbook.xml.rels'),'Relationship');const shared=zip.file('xl/sharedStrings.xml')?nodes(await xml('xl/sharedStrings.xml'),'si').map(si=>nodes(si,'t').map(t=>t.textContent).join('')):[];
 const tables={};for(const name of Object.keys(F.columns)){const sheet=nodes(book,'sheet').find(x=>x.getAttribute('name')===name);if(!sheet)throw Error(`Excel-Tabellenblatt „${name}“ fehlt.`);const rid=sheet.getAttribute('r:id')||sheet.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id');const rel=rels.find(x=>x.getAttribute('Id')===rid);if(!rel||rel.getAttribute('TargetMode')==='External')throw Error('Ungültige Excel-Tabellenverknüpfung.');let target=rel.getAttribute('Target');target=target.startsWith('/')?target.slice(1):'xl/'+target;target=target.replace(/\/\.\//g,'/');if(target.includes('..'))throw Error('Nicht unterstützter Excel-Pfad.');
 const rowNodes=nodes(await xml(target),'row');if(rowNodes.length>10001)throw Error('Maximal 10.000 Datenzeilen pro Tabellenblatt.');let headers;const rows=[];
 for(const row of rowNodes){const cells=[];for(const c of nodes(row,'c')){const addr=c.getAttribute('r')||'';let idx=0;for(const ch of addr.replace(/\d/g,''))idx=idx*26+ch.charCodeAt(0)-64;if(idx<1||idx>100)throw Error('Ungültige Excel-Spaltenadresse.');let value='';const type=c.getAttribute('t');if(nodes(c,'f').length)throw Error(`Excel, ${name}, Zeile ${row.getAttribute('r')}: Formeln werden nicht ausgewertet. Bitte Werte einfügen.`);if(type==='e')throw Error(`Excel, ${name}: Eine Zelle enthält einen Excel-Fehler.`);if(type==='inlineStr')value=nodes(c,'t').map(t=>t.textContent).join('');else{value=nodes(c,'v')[0]?.textContent||'';if(type==='s'){const n=Number(value);if(!Number.isInteger(n)||n<0||n>=shared.length)throw Error('Ungültiger Excel-Textindex.');value=shared[n];}}cells[idx-1]=value;}
 if(!cells.some(v=>String(v||'').trim()))continue;
 if(!headers){headers=Array.from(cells,v=>String(v??'').trim());if(headers.includes('')||new Set(headers).size!==headers.length)throw Error(`Excel, ${name}: Leere oder doppelte Spaltenüberschriften.`);for(const h of F.columns[name])if(!headers.includes(h))throw Error(`Excel, ${name}: Spalte „${h}“ fehlt.`);continue;}
 const r=Object.fromEntries(headers.map((h,i)=>[h,cells[i]??'']));r._row=Number(row.getAttribute('r'))||rows.length+2;
 if(name==='Rechnungen')for(const k of['Datum','Leistungsdatum']){if(/^\d{4}-\d{2}-\d{2}T00:00:00(?:\.000)?Z$/.test(r[k]))r[k]=r[k].slice(0,10);if(/^\d+(\.\d+)?$/.test(r[k])){const n=Number(r[k]);if(n<61||n>2958465)throw Error('Excel-Datum liegt außerhalb des unterstützten Bereichs.');r[k]=new Date(Date.UTC(1899,11,30)+Math.floor(n)*86400000).toISOString().slice(0,10);}}
 rows.push(r);
 }tables[name]=rows;}
 return F.fromTables(tables);
};
F.importFile=async function(file){if(!file||file.size===0)throw Error('Die Datei ist leer.');if(file.size>5*1024*1024)throw Error('Die Demo unterstützt Dateien bis 5 MB.');if(/\.csv$/i.test(file.name))return F.fromCSV(await file.text());if(/\.xlsx$/i.test(file.name))return F.readXlsx(await file.arrayBuffer());throw Error('Bitte eine CSV- oder XLSX-Datei wählen. Alte XLS-Dateien bitte zuvor als XLSX speichern.');};
})(globalThis);
