'use strict';
const form = document.querySelector('#login');
const locked = document.querySelector('#locked');
const unlocked = document.querySelector('#instructions');
const error = document.querySelector('#login-error');
const decoder = new TextDecoder();
const bytes = text => Uint8Array.from(atob(text), c => c.charCodeAt(0));
form.addEventListener('submit', async event => {
  event.preventDefault();
  const submit = form.querySelector('button'); submit.disabled = true; error.textContent = '';
  try {
    if (!window.crypto?.subtle) throw new Error('crypto');
    const payload = JSON.parse(document.querySelector('#payload').textContent);
    const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(form.elements.username.value.trim().toLowerCase() + ':' + form.elements.password.value), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey({name:'PBKDF2', salt:bytes(payload.salt), iterations:210000, hash:'SHA-256'}, material, {name:'AES-GCM', length:256}, false, ['decrypt']);
    const plain = await crypto.subtle.decrypt({name:'AES-GCM', iv:bytes(payload.iv)}, key, bytes(payload.content));
    unlocked.innerHTML = decoder.decode(plain);
    unlocked.hidden = false; locked.hidden = true; form.reset();
    const heading = unlocked.querySelector('h1'); heading.tabIndex = -1; heading.focus();
    setupNotes();
  } catch {
    error.textContent = window.crypto?.subtle ? 'Anmeldung nicht möglich. Bitte Benutzername und Passwort prüfen.' : 'Bitte die Seite über HTTPS in einem aktuellen Browser öffnen.';
  } finally { submit.disabled = false; }
});
function setupNotes() {
  const storageKey = 'selvamo-sonja-to-do-v1';
  const status = document.querySelector('#feedback-status');
  let notes = {};
  try { const saved = JSON.parse(sessionStorage.getItem(storageKey) || '{}'); if (saved && typeof saved === 'object' && !Array.isArray(saved)) notes = saved; } catch { /* Start empty. */ }
  const fields = unlocked.querySelectorAll('[data-note]');
  for (const field of fields) {
    if (field.type === 'checkbox') field.checked = notes[field.dataset.note] === true;
    else field.value = typeof notes[field.dataset.note] === 'string' ? notes[field.dataset.note] : '';
    field.addEventListener('input', () => {
      notes[field.dataset.note] = field.type === 'checkbox' ? field.checked : field.value;
      try { sessionStorage.setItem(storageKey, JSON.stringify(notes)); }
      catch { status.textContent = 'Zwischenspeichern nicht möglich. Bitte Antworten herunterladen oder kopieren.'; }
    });
  }
  document.querySelector('#download').addEventListener('click', () => {
    const parts = ['Sonjas Rückmeldung – SELVAMO AI', new Date().toLocaleString('de-DE'), ''];
    for (const field of fields) {
      const label = field.id ? unlocked.querySelector(`label[for="${field.id}"]`).textContent : field.closest('label').textContent;
      parts.push(label.trim(), field.type === 'checkbox' ? (field.checked ? 'Erledigt' : 'Offen') : field.value, '');
    }
    const url = URL.createObjectURL(new Blob([parts.join('\n')], {type:'text/plain;charset=utf-8'}));
    const link = document.createElement('a'); link.href=url; link.download='sonja-rueckmeldung.txt'; document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.textContent = 'Textdatei erstellt. Bitte an Manfred weitergeben. Es wurde nichts versendet.';
  });
  document.querySelector('#logout').addEventListener('click', () => {
    unlocked.replaceChildren(); unlocked.hidden=true; locked.hidden=false;
    try { sessionStorage.removeItem(storageKey); } catch { /* Session is optional. */ }
    form.elements.username.focus(); window.scrollTo(0,0);
  });
}
