(function(root){'use strict';const F=root.FAKTIVOX;
F.validate=function(inv){const issues=[...(inv.importIssues||[])];const add=(severity,field,message,line)=>issues.push({severity,field,message,row:line?.sourceRow||inv.sourceRow,sheet:line?.sourceSheet||inv.sourceSheet});
 if(!inv.number.trim())add('error','Rechnungsnummer','Rechnungsnummer fehlt.');
 if(!inv.date.trim())add('error','Rechnungsdatum','Rechnungsdatum fehlt.');else if(!F.validDate(inv.date))add('error','Rechnungsdatum','Rechnungsdatum ist ungültig. Erwartet: JJJJ-MM-TT.');
 if(!inv.serviceDate)add('warning','Leistungsdatum','Leistungsdatum fehlt. Bitte ergänzen.');else if(!F.validDate(inv.serviceDate))add('error','Leistungsdatum','Leistungsdatum ist ungültig.');
 for(const[key,label]of[['seller','Verkäufer'],['buyer','Käufer']])for(const[field,name]of[['name','Name'],['street','Straße'],['zip','Postleitzahl'],['city','Ort'],['country','Land']])if(!String(inv[key][field]||'').trim())add('error',label+' · '+name,`${label}: ${name} fehlt.`);
 if(!inv.seller.taxId)add('warning','Verkäufer · UStID','Steuerkennung des Verkäufers fehlt.');
 if(!['B2B','B2G'].includes(inv.case))add('error','Fall','Die Demo unterstützt B2B oder B2G.');
 if(inv.case==='B2G'&&!inv.reference.trim())add('error','Käuferreferenz','Käuferreferenz fehlt (Demo-Fall B2G).');
 if(!inv.lines.length)add('error','Positionen','Keine Rechnungspositionen vorhanden.');
 const positions=new Set();for(const l of inv.lines){if(!l.description.trim())add('error','Beschreibung','Positionsbeschreibung fehlt.',l);if(!l.position||positions.has(l.position))add('error','Position','Positionsnummer fehlt oder ist doppelt.',l);positions.add(l.position);
 for(const[key,label,positive]of[['quantity','Menge',true],['price','Einzelpreis',false]])try{const v=F.decimal(l[key]);if(positive?v.n<=0n:v.n<0n)throw Error(positive?'Menge muss größer als null sein.':'Einzelpreis darf nicht negativ sein.');}catch(e){add('error',label,`${label}: ${e.message}`,l);}
 try{F.taxRate(l.tax);}catch(e){add('error','Steuersatz',e.message,l);}}
 add('info','Demo-Regelwerk','Basisprüfung ausgeführt. Keine vollständige EN-16931- oder Profilvalidierung.');return issues;
};
F.process=list=>list.map(inv=>{const issues=F.validate(inv);let totals=null;try{totals=F.calculate(inv);}catch{}return{...inv,issues,totals,status:issues.some(i=>i.severity==='error')?'error':issues.some(i=>i.severity==='warning')?'warning':'valid'};});
})(globalThis);
