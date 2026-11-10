(function(root){'use strict';const F=root.FAKTIVOX;
F.download=function(name,content,type){const a=document.createElement('a'),url=URL.createObjectURL(new Blob([content],{type}));a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);};
F.safeName=s=>String(s||'rechnung').replace(/[^a-zA-Z0-9_-]/g,'_').slice(0,70);
F.demoXML=function(inv){if(!inv.totals)throw Error('Beträge sind nicht berechenbar.');const e=F.escape,t=inv.totals;
return `<?xml version="1.0" encoding="UTF-8"?>
<!-- DEMO: kein XRechnung-CII-Dokument; illustrative Datenstruktur.
     Nicht produktiv validiert. Nicht zur Einreichung oder Buchung verwenden. -->
<FAKTIVOXDemo formatziel="XRechnung-CII" produktivValidiert="false">
  <Rechnung nummer="${e(inv.number)}" datum="${e(inv.date)}" waehrung="EUR">
    <Leistungsdatum>${e(inv.serviceDate)}</Leistungsdatum>
    <Kaeuferreferenz>${e(inv.reference)}</Kaeuferreferenz>
    <Verkaeufer>
      <Name>${e(inv.seller.name)}</Name>
      <Strasse>${e(inv.seller.street)}</Strasse>
      <PLZ>${e(inv.seller.zip)}</PLZ><Ort>${e(inv.seller.city)}</Ort>
      <Land>${e(inv.seller.country)}</Land>
    </Verkaeufer>
    <Kaeufer>
      <Name>${e(inv.buyer.name)}</Name>
      <Strasse>${e(inv.buyer.street)}</Strasse>
      <PLZ>${e(inv.buyer.zip)}</PLZ><Ort>${e(inv.buyer.city)}</Ort>
      <Land>${e(inv.buyer.country)}</Land>
    </Kaeufer>
    <Positionen>
${t.lines.map(l=>`      <Position nummer="${e(l.position)}">
        <Beschreibung>${e(l.description)}</Beschreibung>
        <Menge>${e(l.quantity)}</Menge><Einzelpreis>${e(l.price)}</Einzelpreis>
        <Steuersatz>${l.rate}</Steuersatz><Netto>${F.amountXML(l.cents)}</Netto>
      </Position>`).join('\n')}
    </Positionen>
${t.taxes.map(r=>`    <Steuer satz="${r.rate}" basis="${F.amountXML(r.base)}">${F.amountXML(r.cents)}</Steuer>`).join('\n')}
    <Netto>${F.amountXML(t.net)}</Netto>
    <Umsatzsteuer>${F.amountXML(t.tax)}</Umsatzsteuer>
    <Brutto>${F.amountXML(t.gross)}</Brutto>
  </Rechnung>
</FAKTIVOXDemo>`;};
// A readable demo overview, deliberately not DATEV booking records or a tax return.
F.accountingCSV=function(invoices){
 const rows=[['Rechnungsnummer','Datum','Kaeufer','Netto_EUR','USt_7_EUR','USt_19_EUR','Brutto_EUR','Hinweis']];
 for(const inv of invoices.filter(i=>i.status!=='error'&&i.totals)){
 const t=inv.totals,tax=r=>t.taxes.find(x=>x.rate===r)?.cents||0n;
 rows.push([inv.number,inv.date,inv.buyer.name,F.amountXML(t.net),F.amountXML(tax(7)),F.amountXML(tax(19)),F.amountXML(t.gross),'DEMO – keine Buchung / kein DATEV-Format']);
 }
 const cell=v=>'"'+String(v??'').replace(/^[=+@-]/,c=>"'"+c).replace(/"/g,'""')+'"';
 return '\uFEFF'+rows.map(r=>r.map(cell).join(';')).join('\r\n');
};
F.pdfBytes=async function(inv){if(!inv.totals)throw Error('Beträge sind nicht berechenbar.');if(!root.PDFLib)throw Error('Die lokale PDF-Komponente fehlt.');const{PDFDocument,StandardFonts,rgb}=root.PDFLib;const doc=await PDFDocument.create();doc.setTitle('FAKTIVOX DEMO – '+inv.number);doc.setSubject('Visuelle Demo-Rechnung. Kein ZUGFeRD, kein PDF/A-3, kein XML-Anhang.');const font=await doc.embedFont(StandardFonts.Helvetica),bold=await doc.embedFont(StandardFonts.HelveticaBold),petrol=rgb(.071,.247,.282),gold=rgb(.725,.604,.333);let page,y;
 const safe=s=>Array.from(String(s??'')).map(c=>{try{font.encodeText(c);return c;}catch{return '?';}}).join('');
 function newPage(){page=doc.addPage([595.28,841.89]);y=790;page.drawText('FAKTIVOX',{x:44,y,font:bold,size:24,color:petrol});page.drawText('by manliNova',{x:44,y:y-18,font,size:10,color:petrol});page.drawText('DEMO',{x:470,y,font:bold,size:17,color:gold});page.drawText('Visuelle Vorschau – kein ZUGFeRD / PDF/A-3 / XML-Anhang',{x:44,y:30,font,size:8,color:petrol});y-=65;}
 function text(s,size=10,strong=false,x=44){if(y<75)newPage();page.drawText(safe(s),{x,y,font:strong?bold:font,size,color:petrol});y-=size+7;}
 function wrapped(s,max=85){const words=safe(s).split(/\s+/);let row='';for(const word of words){if((row+word).length>max&&row){text(row);row='';}if(word.length>max){if(row){text(row);row='';}for(let i=0;i<word.length;i+=max)text(word.slice(i,i+max));}else row+=(row?' ':'')+word;}if(row)text(row);}
 newPage();text('Rechnung '+inv.number,18,true);text('Rechnungsdatum: '+F.dateLabel(inv.date));text('Leistungsdatum: '+F.dateLabel(inv.serviceDate));text('Käuferreferenz: '+(inv.reference||'—'));y-=12;
 for(const [label,p]of[['VERKÄUFER',inv.seller],['KÄUFER',inv.buyer]]){text(label,9,true);wrapped(p.name);wrapped(p.street);wrapped((p.zip||'')+' '+(p.city||'')+' · '+(p.country||''));y-=10;}
 text('POSITIONEN',10,true);for(const l of inv.totals.lines){if(y<130)newPage();wrapped(l.position+'. '+l.description);wrapped(`${l.quantity} × ${l.price} EUR · ${l.rate} % USt. · Netto ${F.money(l.cents)}`);y-=5;}
 y-=15;text('Nettosumme: '+F.money(inv.totals.net),11,true);for(const t of inv.totals.taxes)text(`Umsatzsteuer ${t.rate} %: ${F.money(t.cents)}`);text('Gesamtsumme: '+F.money(inv.totals.gross),15,true);y-=15;wrapped('DEMO – nicht zur Zahlung, Buchung oder Einreichung verwenden. Alle Beispieldaten sind fiktiv.');return doc.save();};
})(globalThis);
