const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {parseCSV,fromMatrix,inspect,cents}=require('../datencockpit/data.cjs');
const {createHandler}=require('../netlify/functions/datencockpit-data');
const row={orderNumber:'A-1',date:'2026-10-10',customer:'Testfirma',amount:'1.234,56',status:'bezahlt'};
test('CSV handles BOM, quoted delimiters, multiline cells and escaped quotes',()=>{
  const rows=fromMatrix(parseCSV('\uFEFFAuftragsnummer;Datum;Kunde;Betrag;Status\r\nA-1;10.10.2026;"Firma; \"\"Nord\"\"\nGmbH";"1.234,56";bezahlt'));
  assert.equal(rows[0].customer,'Firma; "Nord"\nGmbH');assert.equal(rows[0].date,'2026-10-10');assert.equal(inspect(rows)[0].amountCents,123456);
  assert.throws(()=>parseCSV('A;B\n"unclosed'),/nicht geschlossen/);
  assert.throws(()=>fromMatrix([['Datum','Kunde'],['2026-01-01','Test']]),/Benötigte Spalten/);
});
test('missing values, case-insensitive duplicates, impossible dates and invalid amounts block release',()=>{
  const result=inspect([row,{...row,orderNumber:'a-1',date:'2026-02-30',amount:'12abc',customer:''}]);
  assert.ok(result[0].issues.some(s=>s.includes('doppelt')));
  for(const phrase of ['doppelt','Datum ungültig','Betrag ungültig','Kunde fehlt'])assert.ok(result[1].issues.some(s=>s.includes(phrase)),phrase);
  assert.equal(inspect([row])[0].issues.length,0);
  for(const amount of ['-1','NaN','1e3','12.3456','10000000.01'])assert.equal(cents(amount),null);
  assert.equal(cents(0),0);assert.equal(cents('0,01'),1);assert.equal(cents('840,50'),84050);
});
test('sample import has exactly the intended duplicate and missing-customer rows',()=>{
  const rows=fromMatrix(parseCSV(fs.readFileSync(path.join(__dirname,'../datencockpit/beispiel.csv'),'utf8')));
  assert.equal(rows.length,8);assert.equal(inspect(rows).filter(r=>r.issues.length).length,3);
  const fixed=rows.filter((_,i)=>i!==3);fixed[3].customer='Musterbetrieb';
  assert.ok(inspect(fixed).every(r=>!r.issues.length));
});
test('API validates all input before SQL and enforces per-import authorization',async()=>{
  const handler=createHandler({connectionString:()=> 'configured',connect:()=>assert.fail('no SQL expected')});
  const post=rows=>handler({httpMethod:'POST',headers:{},body:JSON.stringify({rows})});
  assert.equal((await post([{...row,customer:''}])).statusCode,422);
  assert.equal((await post([row,{...row,orderNumber:'a-1'}])).statusCode,422);
  assert.equal((await post([])).statusCode,400);
  assert.equal((await handler({httpMethod:'POST',headers:{},body:'null'})).statusCode,400);
  assert.equal((await handler({httpMethod:'GET',headers:{},queryStringParameters:{}})).statusCode,401);
  assert.equal((await handler({httpMethod:'POST',headers:{origin:'https://evil.example'},body:'{}'})).statusCode,403);
});
