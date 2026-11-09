'use strict';

const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#main-nav');

function closeMenu() {
  if (!menuButton || !navigation) return;
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Menü öffnen');
  navigation.classList.remove('open');
}

if (menuButton && navigation) {
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
    navigation.classList.toggle('open', open);
  });
  navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('click', event => {
    if (!event.target.closest('.nav')) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      menuButton.focus();
    }
  });
  window.matchMedia('(min-width: 1025px)').addEventListener('change', event => {
    if (event.matches) closeMenu();
  });
}

document.querySelectorAll('[data-legacy-modal]').forEach(button => {
  button.addEventListener('click', () => {
    const dialog = document.getElementById(button.dataset.legacyModal);
    if (dialog instanceof HTMLDialogElement) dialog.showModal();
  });
});

document.querySelectorAll('dialog.modal').forEach(dialog => {
  dialog.querySelectorAll('[data-modal-close]').forEach(button => {
    button.addEventListener('click', () => dialog.close());
  });
  dialog.addEventListener('click', event => {
    const bounds = dialog.getBoundingClientRect();
    if (event.target === dialog && (
      event.clientX < bounds.left || event.clientX > bounds.right ||
      event.clientY < bounds.top || event.clientY > bounds.bottom
    )) dialog.close();
  });
});

// Keep existing bookmarks from the previous homepage usable.
const legalPages = { '#impressum': 'impressum.html', '#datenschutz': 'datenschutz.html' };
if (legalPages[location.hash]) location.replace(legalPages[location.hash]);
if (location.hash === '#ki-praxis') document.getElementById('projekte')?.scrollIntoView();
if (location.hash === '#ueber-mich') document.getElementById('ueber')?.scrollIntoView();

document.querySelectorAll('[data-year]').forEach(element => {
  element.textContent = String(new Date().getFullYear());
});

// Keep the restored technology ticker independently pausable.
const ticker = document.querySelector('.tech');
const tickerControl = ticker?.querySelector('.tech-control');
if (ticker && tickerControl) {
  tickerControl.addEventListener('click', () => {
    const paused = ticker.dataset.paused !== 'true';
    ticker.dataset.paused = String(paused);
    tickerControl.setAttribute('aria-pressed', String(paused));
    tickerControl.setAttribute('aria-label', paused ? 'Laufleiste fortsetzen' : 'Laufleiste anhalten');
  });
}
