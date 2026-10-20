// Public backend address only. Never put an API key here.
// The Netlify build replaces this with its own same-origin address.
window.RAUSZEIT_CONFIG = Object.freeze({
  eventApiUrl: 'https://rauszeitml.netlify.app/.netlify/functions/events',
  christmasApiUrl: 'https://rauszeitml.netlify.app/.netlify/functions/christmas-markets'
});
