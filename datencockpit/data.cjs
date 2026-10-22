'use strict';
const FIELDS=['orderNumber','date','customer','amount','status'];
const HEADERS=['Auftragsnummer','Datum','Kunde','Betrag','Status'];
const MAX_ROWS=1000;
const aliases={auftragsnummer:'orderNumber',auftrag:'orderNumber',ordernumber:'orderNumber',datum:'date',date:'date',kunde:'customer',customer:'customer',betrag:'amount',umsatz:'amount',amount:'amount',status:'status'};
function clean(value){return String(value ?? '').trim();}
function dateValue(value){
  if(value instanceof Date && Number.isFinite(value.getTime())) return `${value.getUTCFullYear()}-${String(value.getUTCMonth()+1).padStart(2,'0')}-${String(value.getUTCDate()).padStart(2,'0')}`;
  const s=clean(value), m=s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  return m?`${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`:s;
}
function cents(value){
  if(typeof value==='number') return Number.isFinite(value) && value>=0 && value<=10000000 && Math.abs(value*100-Math.round(value*100))<0.00001?Math.round(value*100):null;
  let s=clean(value).replace(/\s|€/g,'');
  if(s.includes(',')){
    if(!/^(?:\d+|\d{1,3}(?:\.\d{3})+),\d{1,2}$/.test(s)) return null;
    s=s.replaceAll('.','').replace(',','.');
  }
  if(!/^\d+(?:\.\d{1,2})?$/.test(s)) return null;
  const n=Number(s);return n<=10000000?Math.round(n*100):null;
}
function normalize(row){
  const status=clean(row.status).toLocaleLowerCase('de');
  return {orderNumber:clean(row.orderNumber),date:dateValue(row.date),customer:clean(row.customer),amount:typeof row.amount==='number'?row.amount:clean(row.amount),status};
}
function inspect(rows){
  const normalized=rows.map(normalize), counts=new Map();
  for(const r of normalized){const key=r.orderNumber.toLocaleLowerCase('de');if(key) counts.set(key,(counts.get(key)||0)+1);}
  return normalized.map(row=>{
    const issues=[];
    for(const field of FIELDS) if(row[field]==='') issues.push(`${HEADERS[FIELDS.indexOf(field)]} fehlt`);
    if(row.orderNumber.length>80) issues.push('Auftragsnummer ist zu lang');
    if(row.customer.length>160) issues.push('Kundenname ist zu lang');
    if(row.orderNumber && counts.get(row.orderNumber.toLocaleLowerCase('de'))>1) issues.push('Auftragsnummer doppelt');
    const validDate=/^\d{4}-\d{2}-\d{2}$/.test(row.date) && Number.isFinite(Date.parse(row.date)) && new Date(row.date).toISOString().slice(0,10)===row.date && row.date>='2000-01-01' && row.date<='2100-12-31';
    if(row.date && !validDate) issues.push('Datum ungültig (2000–2100)');
    const amountCents=cents(row.amount);
    if(row.amount!=='' && amountCents===null) issues.push('Betrag ungültig (0–10 Mio. €, max. 2 Nachkommastellen)');
    if(row.status && !['offen','bezahlt','storniert'].includes(row.status)) issues.push('Status: offen, bezahlt oder storniert');
    return {row,amountCents,issues};
  });
}
function parseCSV(text){
  text=text.replace(/^\uFEFF/,'');
  const first=text.split(/\r?\n/)[0];
  const delimiter=(first.match(/;/g)||[]).length>(first.match(/,/g)||[]).length?';':',';
  const rows=[];let row=[],cell='',quoted=false,closed=false;
  function pushCell(){row.push(cell);cell='';closed=false;if(row.length>30)throw Error('Die Datei enthält zu viele Spalten.');}
  function pushRow(){pushCell();if(row.some(v=>v.trim()))rows.push(row);row=[];if(rows.length>MAX_ROWS+1)throw Error('Maximal 1.000 Datenzeilen erlaubt.');}
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(quoted){if(c==='"'){if(text[i+1]==='"'){cell+='"';i++;}else{quoted=false;closed=true;}}else cell+=c;}
    else if(c==='"'){if(cell || closed)throw Error('Ungültige CSV-Anführungszeichen.');quoted=true;}
    else if(c===delimiter)pushCell();
    else if(c==='\n' || c==='\r'){if(c==='\r' && text[i+1]==='\n')i++;pushRow();}
    else {if(closed && !/\s/.test(c))throw Error('Ungültige CSV-Zelle.');if(!closed)cell+=c;}
  }
  if(quoted)throw Error('Ein Anführungszeichen in der CSV-Datei ist nicht geschlossen.');
  if(cell || row.length || closed)pushRow();
  return rows;
}
function fromMatrix(matrix){
  if(matrix.length<2)throw Error('Die Datei braucht eine Kopfzeile und mindestens einen Auftrag.');
  const columns=matrix[0].map(h=>aliases[clean(h).toLocaleLowerCase('de').replace(/[\s_-]/g,'')]);
  if(FIELDS.some(f=>columns.filter(c=>c===f).length!==1))throw Error('Benötigte Spalten: '+HEADERS.join(', ')+'. Jede Spalte muss genau einmal vorkommen.');
  const values=matrix.slice(1).filter(row=>row.some(v=>clean(v)!==''));
  if(values.length>MAX_ROWS)throw Error('Maximal 1.000 Datenzeilen erlaubt.');
  if(!values.length)throw Error('Keine Datenzeilen gefunden.');
  return values.map(row=>normalize(Object.fromEntries(FIELDS.map(f=>[f,row[columns.indexOf(f)] ?? '']))));
}
module.exports={FIELDS,HEADERS,MAX_ROWS,cents,normalize,inspect,parseCSV,fromMatrix};
