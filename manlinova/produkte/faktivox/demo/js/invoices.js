/* Domain model and exact decimal arithmetic; no UI or network dependencies. */
(function(root){
'use strict'; const F=root.FAKTIVOX=root.FAKTIVOX||{};
F.escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// A decimal is a BigInt coefficient plus its base-10 scale. No floating-point sums.
F.decimal=function(value){
 let s=String(value??'').trim(); if(!s)throw Error('Zahl fehlt.');
 if(s.includes(',')){if(!/^[+-]?(?:\d+|\d{1,3}(?:\.\d{3})+),\d{1,6}$/.test(s))throw Error('Ungültiges Zahlenformat.');s=s.replace(/\./g,'').replace(',','.');}
 if(!/^[+-]?\d+(?:\.\d{1,6})?$/.test(s))throw Error('Ungültiges Zahlenformat (maximal 6 Nachkommastellen).');
 const [whole,frac='']=s.split('.'); return {n:BigInt(whole+frac),scale:frac.length};
};
F.roundDiv=(n,d)=>n<0n?-F.roundDiv(-n,d):(n+d/2n)/d;
F.lineAmount=function(line){const q=F.decimal(line.quantity),p=F.decimal(line.price);if(q.n<=0n||p.n<0n)throw Error('Menge muss positiv, Preis darf nicht negativ sein.');return F.roundDiv(q.n*p.n*100n,10n**BigInt(q.scale+p.scale));};
F.taxRate=function(v){const d=F.decimal(v);if(d.n!==7n*10n**BigInt(d.scale)&&d.n!==19n*10n**BigInt(d.scale))throw Error('In der Demo werden nur 7 % und 19 % unterstützt.');return Number(d.n/10n**BigInt(d.scale));};
F.calculate=function(invoice){let net=0n;const groups={};const lines=invoice.lines.map(line=>{const cents=F.lineAmount(line),rate=F.taxRate(line.tax);net+=cents;groups[rate]=(groups[rate]||0n)+cents;return {...line,cents,rate};});if(!lines.length)throw Error('Keine Rechnungspositionen vorhanden.');let tax=0n;const taxes=Object.entries(groups).map(([rate,base])=>{const cents=F.roundDiv(base*BigInt(rate),100n);tax+=cents;return{rate:Number(rate),base,cents};});return{net,tax,gross:net+tax,taxes,lines};};
F.money=function(cents){if(cents==null)return 'Nicht berechenbar';let n=BigInt(cents),sign=n<0n?'-':'';if(n<0n)n=-n;const whole=(n/100n).toString().replace(/\B(?=(\d{3})+(?!\d))/g,'.');return `${sign}${whole},${(n%100n).toString().padStart(2,'0')} €`;};
F.amountXML=n=>`${n/100n}.${(n%100n).toString().padStart(2,'0')}`;
F.dateLabel=s=>/^\d{4}-\d{2}-\d{2}$/.test(s)?s.split('-').reverse().join('.'):s||'Fehlt';
F.validDate=s=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&!isNaN(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
F.sampleTables=function(){return {
 Stammdaten:[
 {ID:'V01',Name:'Musterwerk Digital GmbH (fiktiv)',Strasse:'Beispielweg 12',PLZ:'91126',Ort:'Musterstadt',Land:'DE',UStID:'DE-DEMO-000',IBAN:'DEMO – keine Bankverbindung'},
 {ID:'K01',Name:'Nordstern Handel GmbH (fiktiv)',Strasse:'Musterallee 8',PLZ:'90402',Ort:'Beispielstadt',Land:'DE',UStID:'',IBAN:''},
 {ID:'K02',Name:'Papier & Plan OHG (fiktiv)',Strasse:'Testgasse 21',PLZ:'80331',Ort:'Demostadt',Land:'DE',UStID:'',IBAN:''},
 {ID:'K03',Name:'Demoamt Beispielstadt (fiktiv)',Strasse:'',PLZ:'',Ort:'Beispielstadt',Land:'DE',UStID:'',IBAN:''}],
 Rechnungen:[
 {ID:'R01',Nummer:'RE-2026-012',Datum:'2026-11-10',Leistungsdatum:'2026-11-08',VerkaeuferID:'V01',KaeuferID:'K01',Kaeuferreferenz:'BEST-1042',Fall:'B2B'},
 {ID:'R02',Nummer:'RE-2026-013',Datum:'2026-11-10',Leistungsdatum:'2026-11-09',VerkaeuferID:'V01',KaeuferID:'K02',Kaeuferreferenz:'PROJEKT-28',Fall:'B2B'},
 {ID:'R03',Nummer:'RE-2026-014',Datum:'',Leistungsdatum:'2026-11-09',VerkaeuferID:'V01',KaeuferID:'K03',Kaeuferreferenz:'',Fall:'B2G'}],
 Positionen:[
 {RechnungID:'R01',Position:1,Beschreibung:'Softwareintegration · Beratung',Menge:8,Einzelpreis:120,Steuersatz:19},
 {RechnungID:'R01',Position:2,Beschreibung:'Schnittstellenkonfiguration',Menge:1,Einzelpreis:480,Steuersatz:19},
 {RechnungID:'R02',Position:1,Beschreibung:'Softwarekonfiguration',Menge:3,Einzelpreis:120,Steuersatz:19},
 {RechnungID:'R02',Position:2,Beschreibung:'Gedruckte Fachbücher (Demobeispiel)',Menge:10,Einzelpreis:24.5,Steuersatz:7},
 {RechnungID:'R03',Position:1,Beschreibung:'Datenaufbereitung',Menge:2,Einzelpreis:120,Steuersatz:19}]
};};
F.columns={Stammdaten:['ID','Name','Strasse','PLZ','Ort','Land','UStID','IBAN'],Rechnungen:['ID','Nummer','Datum','Leistungsdatum','VerkaeuferID','KaeuferID','Kaeuferreferenz','Fall'],Positionen:['RechnungID','Position','Beschreibung','Menge','Einzelpreis','Steuersatz']};
F.partyFrom=r=>({name:String(r.Name??''),street:String(r.Strasse??''),zip:String(r.PLZ??''),city:String(r.Ort??''),country:String(r.Land??''),taxId:String(r.UStID??''),iban:String(r.IBAN??'')});
F.fromTables=function(tables){
 for(const key of Object.keys(F.columns))if(!Array.isArray(tables[key])||!tables[key].length)throw Error(`Tabellenblatt „${key}“ fehlt oder enthält keine Datensätze.`);
 const parties=new Map();for(const r of tables.Stammdaten){const id=String(r.ID??'').trim();if(!id||parties.has(id))throw Error('Stammdaten: IDs fehlen oder sind doppelt.');parties.set(id,F.partyFrom(r));}
 const seen=new Set();const list=tables.Rechnungen.map((r,i)=>{const id=String(r.ID??'').trim();if(!id||seen.has(id))throw Error(`Rechnungen, Zeile ${r._row||i+2}: Rechnungs-ID fehlt oder ist doppelt.`);seen.add(id);return{id,number:String(r.Nummer??''),date:String(r.Datum??''),serviceDate:String(r.Leistungsdatum??''),reference:String(r.Kaeuferreferenz??''),case:String(r.Fall??'B2B').toUpperCase(),seller:parties.get(String(r.VerkaeuferID))||{},buyer:parties.get(String(r.KaeuferID))||{},sourceRow:r._row||i+2,sourceSheet:'Rechnungen',lines:[],importIssues:[]};});
 for(const [i,r]of tables.Positionen.entries()){const inv=list.find(x=>x.id===String(r.RechnungID));if(!inv)throw Error(`Positionen, Zeile ${r._row||i+2}: RechnungID „${r.RechnungID??''}“ ist keiner Rechnung zugeordnet.`);inv.lines.push({position:String(r.Position??''),description:String(r.Beschreibung??''),quantity:String(r.Menge??''),price:String(r.Einzelpreis??''),tax:String(r.Steuersatz??''),sourceRow:r._row||i+2,sourceSheet:'Positionen'});}
 return list;
};
F.sampleInvoices=()=>F.fromTables(F.sampleTables());
})(globalThis);
