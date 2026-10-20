'use strict';
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.main-nav');
const closeMenu = () => {
  if (!menuButton || !navigation) return;
  navigation.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Menü öffnen');
};
if (menuButton && navigation) {
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    navigation.classList.toggle('open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
  });
  navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('click', event => {
    if (!event.target.closest('.site-header')) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      menuButton.focus();
    }
  });
  window.matchMedia('(min-width: 761px)').addEventListener('change', event => {
    if (event.matches) closeMenu();
  });
}

const filters = document.querySelectorAll('[data-filter]');
const projects = document.querySelectorAll('.project-card');
filters.forEach(button => {
  button.addEventListener('click', () => {
    const category = button.dataset.filter;
    filters.forEach(filter => {
      const active = filter === button;
      filter.classList.toggle('active', active);
      filter.setAttribute('aria-pressed', String(active));
    });
    let visible = 0;
    projects.forEach(project => {
      project.hidden = category !== 'alle' && project.dataset.category !== category;
      if (!project.hidden) visible += 1;
    });
    const status = document.querySelector('#project-status');
    if (status) status.textContent = `${visible} ${visible === 1 ? 'Projekt' : 'Projekte'} angezeigt.`;
  });
});

// Native dialogs retain keyboard focus, support Escape, and return focus to the opener.
document.querySelectorAll('[data-modal-open]').forEach(button => {
  button.addEventListener('click', () => {
    const dialog = document.getElementById(button.dataset.modalOpen);
    if (dialog instanceof HTMLDialogElement) dialog.showModal();
  });
});
document.querySelectorAll('dialog.modal').forEach(dialog => {
  dialog.querySelectorAll('[data-modal-close]').forEach(button => {
    button.addEventListener('click', () => dialog.close());
  });
  dialog.addEventListener('click', event => {
    const box = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) dialog.close();
  });
});
// Preserve old legal bookmarks from the previous one-page website.
if (location.pathname === '/' || location.pathname.endsWith('/index.html')) {
  if (location.hash === '#datenschutz') location.replace('datenschutz.html');
  if (location.hash === '#impressum') location.replace('impressum.html');
}
document.querySelectorAll('[data-year]').forEach(element => {
  element.textContent = String(new Date().getFullYear());
});
