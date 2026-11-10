'use strict';
(() => {
  const status = document.getElementById('status');
  const buttons = [...document.querySelectorAll('button')];
  function render() {
    try {
      const excluded = localStorage.getItem('ml.analytics.exclude') === '1' || Boolean(localStorage.getItem('umami.disabled'));
      status.textContent = excluded ? 'Dieser Browser ist von der Besucherstatistik ausgeschlossen.' : 'Für diesen Browser ist noch kein Ausschluss eingerichtet.';
      document.getElementById('exclude').disabled = excluded;
      document.getElementById('include').disabled = !excluded;
    } catch (_) {
      status.textContent = 'Dein Browser erlaubt hier keinen lokalen Speicher. Ein dauerhafter Ausschluss kann deshalb nicht gespeichert werden.';
      buttons.forEach(button => { button.disabled = true; });
    }
  }
  function setExcluded(excluded) {
    try {
      for (const key of ['ml.analytics.exclude', 'umami.disabled']) {
        if (excluded) localStorage.setItem(key, '1');
        else localStorage.removeItem(key);
      }
      render();
    } catch (_) {
      status.textContent = 'Die Einstellung konnte nicht gespeichert werden. Bitte prüfe deine Browser-Einstellungen.';
    }
  }
  document.getElementById('exclude').addEventListener('click', () => setExcluded(true));
  document.getElementById('include').addEventListener('click', () => setExcluded(false));
  window.addEventListener('storage', render);
  render();
})();
