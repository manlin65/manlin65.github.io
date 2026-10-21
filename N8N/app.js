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
  el('source-info').textContent = `Quelle: ${material.source.file}, 1 Seite · SHA-256: ${material.source.sha256}`;
  const groups = [
    ['summary', 'Zusammenfassung', [['Text', 'text']]],
    ['glossary', 'Glossar', [['Begriff', 'term'], ['Erklärung', 'definition']]],
    ['questions', 'Übungsfragen mit Lösungen', [['Frage', 'question'], ['Lösung', 'answer'], ['Warum ist das richtig?', 'explanation']]]
  ];
  for (const [key, title, fields] of groups) {
    const heading = document.createElement('h3'); heading.textContent = title;
    el('material').append(heading);
    for (const record of material[key]) {
      const entry = document.createElement('div'); entry.className = 'entry';
      for (const [label, property] of fields) field(entry, label, record, property);
      const quote = document.createElement('blockquote');
      quote.textContent = `Test-PDF, Seite ${record.page}: „${record.quote}“`;
      entry.append(quote); el('material').append(entry);
    }
  }
  el('results').hidden = false;
}
el('load').addEventListener('click', async () => {
  el('load').disabled = true;
  invalidateReview();
  el('results').hidden = true;
  material = null;
  try {
    const response = await fetch('fixtures/lernmaterial.json', {cache:'no-store'});
    if (!response.ok) throw new Error('Testdaten nicht erreichbar');
    const data = await response.json();
    if (data.mode !== 'demo' || data.schemaVersion !== 1) throw new Error('Unbekannte Testdaten');
    material = data; revision = 0;
    render();
    el('status').textContent = 'Testdaten geladen. Keine PDF verarbeitet und kein externer Dienst aufgerufen.';
  } catch {
    el('status').textContent = 'Testdaten konnten nicht geladen werden. Bitte die Seite über einen lokalen Webserver öffnen und erneut versuchen.';
  } finally { el('load').disabled = false; }
});
el('pdf').addEventListener('change', () => {
  const file = el('pdf').files[0];
  el('file-status').textContent = file ? `Ausgewählt: ${file.name}. Nur Oberflächen-Demo: kein Lesen, Upload oder Auswerten. Die Testdaten gehören weiterhin ausschließlich zur mitgelieferten Test-PDF.` : 'Eine eigene Auswahl wird weder gelesen noch ausgewertet.';
  invalidateReview();
});
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
const dropzone = el('dropzone');
dropzone.addEventListener('dragover', event => { event.preventDefault(); dropzone.classList.add('dragover'); });
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
dropzone.addEventListener('drop', event => {
  event.preventDefault(); dropzone.classList.remove('dragover');
  const file = event.dataTransfer.files[0];
  el('file-status').textContent = file ? `Abgelegt: ${file.name}. Nur Dateiname, kein Lesen oder Upload. Der Test nutzt weiterhin die mitgelieferte Test-PDF.` : 'Keine Datei abgelegt.';
  invalidateReview();
});
