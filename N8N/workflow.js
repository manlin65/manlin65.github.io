'use strict';
(async () => {
  const status = document.getElementById('workflow-status');
  const start = document.getElementById('start-workflow');
  try {
    const response = await fetch('workflow-config.json', {cache: 'no-store'});
    if (!response.ok) throw new Error('Konfiguration nicht verfügbar');
    const config = await response.json();
    if (!config.productionFormUrl) return;
    const url = new URL(config.productionFormUrl);
    if (url.protocol !== 'https:' || !url.hostname.endsWith('.app.n8n.cloud') || !/^\/form\/[^/]+\/?$/.test(url.pathname) || url.username || url.password || url.search || url.hash) throw new Error('Ungültige Formularadresse');
    start.href = url.href;
    start.hidden = false;
    status.textContent = 'Die Auswertung erfolgt im n8n-Formular. Nach dem Upload die dort angezeigten Schritte zur Prüfung befolgen.';
  } catch {
    status.textContent = 'Der PDF-Workflow ist gerade nicht verfügbar. Die Beispieldemo unten kannst du weiterhin verwenden.';
  }
})();
