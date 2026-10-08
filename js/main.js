import { registerView, setNavigator, initSheet, mountTabIcons, isSheetOpen, unlockAudio } from './ui.js';
import * as hoy from './hoy.js';
import * as gym from './gym.js';
import * as gastos from './gastos.js';
import * as notas from './notas.js';
import * as ajustes from './ajustes.js';
import * as actividad from './actividad.js';

const TABS = ['hoy', 'gym', 'actividad', 'gastos', 'notas', 'ajustes'];
const views = {};
TABS.forEach((t) => { views[t] = document.getElementById('view-' + t); });

const modules = { hoy: hoy, gym: gym, actividad: actividad, gastos: gastos, notas: notas, ajustes: ajustes };
Object.keys(modules).forEach((k) => registerView(k, () => {
  if (current === k || k === 'hoy' || k === 'gym' || k === 'actividad') modules[k].render();
}));

const actions = Object.assign({}, hoy.actions, gym.actions, actividad.actions, gastos.actions, notas.actions, ajustes.actions, {
  'app:go': (el) => showTab(el.getAttribute('data-tab'))
});
const forms = Object.assign({}, hoy.forms, ajustes.forms);

let current = 'hoy';

function showTab(tab) {
  if (TABS.indexOf(tab) < 0) return;
  current = tab;
  TABS.forEach((t) => { views[t].hidden = t !== tab; });
  Array.prototype.forEach.call(document.querySelectorAll('.tab'), (b) => {
    const on = b.getAttribute('data-tab') === tab;
    b.classList.toggle('active', on);
    if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
  });
  document.getElementById('fab').hidden = !(tab === 'gastos' || tab === 'notas');
  modules[tab].render();
  const v = views[tab];
  v.classList.remove('enter');
  void v.offsetWidth;
  v.classList.add('enter');
  setTimeout(() => v.classList.remove('enter'), 800);
  window.scrollTo(0, 0);
}

setNavigator(showTab);
mountTabIcons();
initSheet();
gym.init();
hoy.init();
actividad.init();
ajustes.init();

document.getElementById('tabbar').addEventListener('click', (e) => {
  const b = e.target.closest('[data-tab]');
  if (b) showTab(b.getAttribute('data-tab'));
});

document.getElementById('fab').addEventListener('click', () => {
  if (current === 'gastos') gastos.openNew();
  else if (current === 'notas') notas.openNew();
});

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el || el.disabled) return;
  const fn = actions[el.getAttribute('data-action')];
  if (fn) { unlockAudio(); fn(el, e); }
});

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const el = e.target.closest && e.target.closest('.tappable[data-action]');
  if (el) { e.preventDefault(); el.click(); }
});

document.addEventListener('submit', (e) => {
  const fn = forms[e.target.id];
  if (fn) { e.preventDefault(); fn(e); }
});

document.addEventListener('visibilitychange', () => {
  if (!document.hidden && !isSheetOpen() && current !== 'ajustes') modules[current].render();
});

showTab('hoy');

if ('serviceWorker' in navigator) {
  const hadController = !!navigator.serviceWorker.controller;
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloaded || isSheetOpen()) return;
    reloaded = true;
    window.location.reload();
  });
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
