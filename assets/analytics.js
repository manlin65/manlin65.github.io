'use strict';
(async () => {
  const loader = document.currentScript;
  if (!loader || !['mlinner-software.de', 'www.mlinner-software.de'].includes(location.hostname)) return;
  if (navigator.doNotTrack === '1' || navigator.globalPrivacyControl === true) return;
  try {
    if (localStorage.getItem('ml.analytics.exclude') === '1' || localStorage.getItem('umami.disabled')) return;
  } catch (_) {
    // Respect exclusions conservatively when browser storage is unavailable.
    return;
  }
  try {
    const response = await fetch(new URL('analytics-config.json', loader.src), {cache: 'no-store', credentials: 'same-origin'});
    if (!response.ok) return;
    const config = await response.json();
    if (config.enabled !== true || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(config.websiteId)) return;
    // Recheck after the request, in case exclusion was enabled in another tab.
    if (localStorage.getItem('ml.analytics.exclude') === '1' || localStorage.getItem('umami.disabled')) return;
    const tracker = document.createElement('script');
    tracker.src = 'https://cloud.umami.is/script.js';
    tracker.defer = true;
    tracker.dataset.websiteId = config.websiteId;
    tracker.dataset.domains = 'mlinner-software.de,www.mlinner-software.de';
    tracker.dataset.doNotTrack = 'true';
    tracker.dataset.excludeSearch = 'true';
    tracker.dataset.excludeHash = 'true';
    document.head.appendChild(tracker);
  } catch (_) {
    // Analytics must never interfere with the website.
  }
})();
