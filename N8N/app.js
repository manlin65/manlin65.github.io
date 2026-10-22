'use strict';
const el = id => document.getElementById(id);
let material = null;
let revision = 0;
function invalidateReview() {
  el('approve').checked = false;
  el('download').disabled = true;
  el('save-status').textContent = '';
}
function field(parent, label, record, key) {
  const wrapper = document.createElement('label');
  wrapper.textContent = label;
  const input = document.createElement('textarea');
  input.value = record[key];
  input.addEventListener('input', () => {
    record[key] = input.value;
    revision++;
    invalidateReview();
  });
  wrapper.append(input);
  parent.append(wrapper);
}
function render() {
  el('material').replaceChildren();
  el('source-info').textContent = `Quelle: ${material.source.file}, ${material.source.pageCount} Seite(n)${material.source.sha256 ? ' · SHA-256: ' + material.source.sha256 : ''}`;
  const groups = [
    ['summary', 'Zusammenfassung', [['Text', 'text']]],
    ['glossary', 'Glossar', [['Begriff', 'term'], ['Erklärung', 'definition']]]
  ];
  for (const [key, title, fields] of groups) {
    const heading = document.createElement('h3'); heading.textContent = title;
    el('material').append(heading);
    for (const record of material[key]) {
      const entry = document.createElement('div'); entry.className = 'entry';
      for (const [label, property] of fields) field(entry, label, record, property);
      const quote = document.createElement('blockquote');
      quote.textContent = `${record.page ? 'Seite ' + record.page : 'Quelltext'}: „${record.quote}“`;
      entry.append(quote); el('material').append(entry);
    }
  }
  const quizTitle=document.createElement('h3');quizTitle.textContent='Quiz: erst selbst antworten';el('material').append(quizTitle);
  material.questions.forEach((record,index)=>{
    const entry=document.createElement('div');entry.className='entry';
    const label=document.createElement('label');label.textContent=(index+1)+'. '+record.question;
    const answer=document.createElement('textarea');answer.placeholder='Deine eigene Antwort …';label.append(answer);entry.append(label);
    const solution=document.createElement('details');const summary=document.createElement('summary');summary.textContent='Lösung vergleichen';solution.append(summary);
    field(solution,'Musterlösung',record,'answer');field(solution,'Erklärung',record,'explanation');const quote=document.createElement('blockquote');quote.textContent=`${record.page ? 'Seite ' + record.page : 'Quelltext'}: „${record.quote}“`;solution.append(quote);entry.append(solution);el('material').append(entry);
  });
  el('results').hidden = false;
}
el('approve').addEventListener('change', () => {
  el('download').disabled = !material || !el('approve').checked;
});
el('download').addEventListener('click', () => {
  if (!material || !el('approve').checked) return;
  const output = {...material, review:{status:'user-reviewed', reviewedAt:new Date().toISOString(), revision, note:'Manuell im Testprototyp bestätigt; keine automatische fachliche Verifikation.'}};
  const blob = new Blob([JSON.stringify(output, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a'); link.href = url; link.download = 'ki-lernassistent-test-geprueft.json';
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  el('save-status').textContent = 'Lokaler Download ausgelöst. Bitte die Datei im Downloadordner prüfen. Es wurde nichts in Google Drive gespeichert.';
});
// Render real API results using text-only DOM fields, never model-generated HTML.
function showAnalysis(data, file) {
  if (!data || data.technischePruefung !== 'Bestanden' || !data.quelle || typeof data.zusammenfassung !== 'string' || !Array.isArray(data.glossar) || !Array.isArray(data.uebungsfragen)) throw new Error('Unvollständige Antwort vom Analyse-Workflow.');
  material = {schemaVersion:1, mode:'analysis', source:{file:file.name,pageCount:data.quelle.seitenanzahl},
    summary:[{text:data.zusammenfassung,quote:data.zusammenfassungBeleg}],
    glossary:data.glossar.map(e=>({term:e.begriff,definition:e.erklaerung,quote:e.beleg})),
    questions:data.uebungsfragen.map(e=>({question:e.frage,answer:e.loesung,explanation:e.erklaerung,quote:e.beleg}))};
  revision=0; invalidateReview(); render();
  el('status').textContent='Neue PDF analysiert. Prüfe die Ergebnisse und Quellenzitate. Noch nicht menschlich freigegeben.';
  el('results').scrollIntoView({behavior:'smooth',block:'start'});
}
(async()=>{
 const button=el('analyze'), status=el('analysis-status');
 let endpoint='';
 try {
  const response=await fetch('workflow-config.json',{cache:'no-store'});
  if(!response.ok) throw new Error();
  const config=await response.json();
  if(config.analysisWebhookUrl){
   const url=new URL(config.analysisWebhookUrl);
   if(url.protocol!=='https:' || !url.hostname.endsWith('.app.n8n.cloud') || !url.pathname.startsWith('/webhook/') || url.username || url.password || url.search || url.hash) throw new Error();
   endpoint=url.href;button.disabled=false;status.textContent='Bereit. Wähle deine PDF und bestätige die Übertragung.';
  }
 }catch{status.textContent='Analyse-Verbindung nicht verfügbar. Bitte später erneut versuchen.';}
 button.addEventListener('click',async()=>{
  const file=el('analysis-file').files[0];
  if(!file || !/\.pdf$/i.test(file.name)){status.textContent='Bitte eine PDF-Datei auswählen.';return;}
  if(file.size>10*1024*1024){status.textContent='Die PDF darf höchstens 10 MB groß sein.';return;}
  if(!el('analysis-consent').checked){status.textContent='Bitte die Übertragung an n8n und Gemini bestätigen.';return;}
  const signature=new TextDecoder().decode(await file.slice(0,5).arrayBuffer());
  if(signature!=='%PDF-'){status.textContent='Die Datei hat keinen gültigen PDF-Dateianfang.';return;}
  button.disabled=true; el('results').hidden=true;material=null;invalidateReview();
  status.dataset.state='busy';status.textContent='Deine PDF wird verarbeitet. Das kann etwas dauern. Die Ergebnisse erscheinen anschließend hier.';
  const controller=new AbortController(), timeout=setTimeout(()=>controller.abort(),180000);
  try{
   const body=new FormData();body.append('pdf',file,file.name);
   const response=await fetch(endpoint,{method:'POST',body,signal:controller.signal});
   if(!response.ok){const error=new Error('Die Analyse konnte nicht abgeschlossen werden.');error.httpStatus=response.status;throw error;}
   const data=await response.json();showAnalysis(data,file);status.dataset.state='success';status.textContent='Fertig. Dein Glossar und Quiz stehen unten bereit.';
  }catch(error){
   status.dataset.state='error';
   if(error.name==='AbortError')status.textContent='Die Analyse dauert länger als erwartet. Die Verarbeitung kann noch laufen. Bitte nicht sofort erneut starten.';
   else if(error.httpStatus===500)status.textContent='Der Analysedienst konnte deine PDF gerade nicht verarbeiten. Bitte später erneut versuchen. Für Manfred: n8n-Ausführung prüfen (HTTP 500).';
   else if(error.httpStatus===404)status.textContent='Die Analyse ist gerade nicht erreichbar. Für Manfred: den Web-Analyse-Workflow in n8n veröffentlichen (HTTP 404).';
   else if(error.httpStatus)status.textContent='Der Analysedienst antwortet mit einem Fehler (HTTP '+error.httpStatus+'). Bitte später erneut versuchen.';
   else if(error instanceof TypeError)status.textContent='Keine Verbindung zum Analysedienst. Bitte Internetverbindung prüfen oder später erneut versuchen.';
   else status.textContent='Die Antwort konnte nicht angezeigt werden. Bitte den Analyse-Workflow prüfen lassen.';
  }
  finally{clearTimeout(timeout);button.disabled=false;}
 });
})();
