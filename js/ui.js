import { esc, fmt, shortDate, parseKey } from './util.js';

/* ---------- Registro de vistas (evita dependencias circulares) ---------- */

const renderers = {};
let navigator_ = null;

export function registerView(name, fn) { renderers[name] = fn; }
export function refresh(name) { if (renderers[name]) renderers[name](); }
export function refreshAll() { Object.keys(renderers).forEach((k) => renderers[k]()); }
export function setNavigator(fn) { navigator_ = fn; }
export function goTo(tab) { if (navigator_) navigator_(tab); }

/* ---------- Iconos ---------- */

const PATHS = {
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6"/>',
  dumbbell: '<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/>',
  wallet: '<path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H17v3"/><path d="M3 7.5V18a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1H5.5A2.5 2.5 0 0 1 3 7.5z"/><circle cx="16.5" cy="14.5" r="1.1"/>',
  note: '<path d="M6 3h8.5L19 7.5V21H6z"/><path d="M14 3v5h5M9 13h7M9 17h5"/>',
  sliders: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
  flame: '<path d="M12 3c.6 3 4.5 4.8 4.5 9.5a4.5 4.5 0 0 1-9 0c0-1.8.8-3 1.8-4 .1 1.6.9 2.4 1.9 2.6C11 8.5 10.6 5.5 12 3z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
  chevron: '<path d="M9 6l6 6-6 6"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.5 20h7M10 17h4"/>',
  timer: '<circle cx="12" cy="13" r="7.5"/><path d="M12 9v4l2.5 1.5M9.5 3h5"/>',
  play: '<path d="M8 5.5v13l11-6.5z"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  scale: '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M8.5 9.5a5 5 0 0 1 7 0M12 9.5l1.8-1.6"/>',
  up: '<path d="M6 14l6-6 6 6"/>',
  down: '<path d="M6 10l6 6 6-6"/>',
  list: '<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
  zap: '<path d="M13 3L5 13.5h6L10 21l8-10.5h-6z"/>',
  walk: '<circle cx="13.5" cy="4.5" r="1.8"/><path d="M9.5 21l2.2-6.200M11.700 14.800l2.300 2v4.200M11.700 14.800L11 9.500l4 1.300 2 3.200M11 9.500L8 11.500"/>',
  calendar: '<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M4 10h16M8.500 3v4M15.500 3v4"/>',
  pin: '<path d="M12 21s6-5.500 6-10.500a6 6 0 0 0-12 0C6 15.500 12 21 12 21z"/><circle cx="12" cy="10.500" r="2"/>',
  target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r=".6"/>',
  repeat: '<path d="M4 12a8 8 0 0 1 13.500-5.800L20 8.500M20 4v4.500h-4.500M20 12a8 8 0 0 1-13.500 5.800L4 15.500M4 20v-4.500h4.500"/>'
};

export function icon(name, size) {
  const s = size || 22;
  return '<svg class="i" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (PATHS[name] || '') + '</svg>';
}

export function flame(size, cls) {
  const px = size || 18;
  return '<span class="flame' + (cls ? ' ' + cls : '') + '" style="width:' + px + 'px;height:' + px + 'px" aria-hidden="true">' +
    '<svg viewBox="0 0 24 24" width="' + px + '" height="' + px + '"><path class="out" d="M12 2.5c.8 3.2 5.5 5.5 5.5 11a5.5 5.5 0 0 1-11 0c0-2.2 1-3.8 2.2-5 .2 1.8 1 2.8 2 3.2C10.300 8 10.800 5 12 2.5z" fill="url(#flameOut)"/>' +
    '<path class="in" d="M12 12.500c.4 1.400 2.300 2.300 2.300 4.200a2.300 2.300 0 0 1-4.600 0c0-1 .5-1.600 1-2.100.1.700.5 1.100.9 1.200-.2-1 .1-2.300.4-3.300z" fill="url(#flameIn)"/></svg></span>';
}

export function mountTabIcons() {
  Array.prototype.forEach.call(document.querySelectorAll('[data-icon]'), (el) => {
    el.innerHTML = icon(el.getAttribute('data-icon'), 24);
  });
}

/* ---------- Háptica y sonido ---------- */

export function haptic(ms) {
  try { if (navigator.vibrate) navigator.vibrate(ms || 10); } catch (e) { /* sin soporte */ }
}

let audio = null;
export function unlockAudio() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!audio) audio = new AC();
    if (audio.state === 'suspended') audio.resume();
  } catch (e) { /* sin audio */ }
}

export function beep() {
  if (!audio) return;
  try {
    [0, 0.22, 0.44].forEach((delay, i) => {
      const o = audio.createOscillator();
      const g = audio.createGain();
      o.type = 'sine';
      o.frequency.value = i === 2 ? 1046 : 784;
      g.gain.setValueAtTime(0.0001, audio.currentTime + delay);
      g.gain.exponentialRampToValueAtTime(0.25, audio.currentTime + delay + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + delay + 0.18);
      o.connect(g);
      g.connect(audio.destination);
      o.start(audio.currentTime + delay);
      o.stop(audio.currentTime + delay + 0.2);
    });
  } catch (e) { /* sin audio */ }
}

/* ---------- Aviso (toast) ---------- */

let toastTimer = 0;
export function toast(message) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = message;
  el.hidden = false;
  el.classList.remove('show');
  void el.offsetWidth;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.classList.remove('show'); el.hidden = true; }, 2600);
}

/* ---------- Confeti ---------- */

export function confetti() {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'confetti';
  const w = (canvas.width = window.innerWidth);
  const h = (canvas.height = window.innerHeight);
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const colors = ['#5fd8ff', '#14a9eb', '#aee9ff', '#ffffff', '#0b79b0', '#7be3ff'];
  const parts = [];
  for (let i = 0; i < 90; i++) {
    parts.push({
      x: w / 2 + (Math.random() - 0.5) * 80,
      y: h * 0.28,
      vx: (Math.random() - 0.5) * 11,
      vy: -Math.random() * 11 - 3,
      s: 5 + Math.random() * 6,
      r: Math.random() * 6.28,
      vr: (Math.random() - 0.5) * 0.4,
      c: colors[i % colors.length]
    });
  }
  const start = performance.now();
  (function frame(now) {
    const t = now - start;
    ctx.clearRect(0, 0, w, h);
    parts.forEach((p) => {
      p.vy += 0.32;
      p.x += p.vx;
      p.y += p.vy;
      p.r += p.vr;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - t / 1800);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * 0.6);
      ctx.restore();
    });
    if (t < 1800) requestAnimationFrame(frame);
    else canvas.remove();
  })(start);
}

/* ---------- Gráfica de líneas ---------- */

export function lineChart(points, opts) {
  const o = opts || {};
  const unit = o.unit || '';
  const dec = o.decimals == null ? 1 : o.decimals;
  if (!points.length) return '<div class="empty">Aún no hay datos.</div>';
  const W = 320, H = 150, L = 8, R = 8, T = 14, B = 26;
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs);
  let minY = Math.min.apply(null, ys), maxY = Math.max.apply(null, ys);
  const padY = (maxY - minY) * 0.18 || Math.max(1, maxY * 0.05);
  minY -= padY; maxY += padY;
  const px = (x) => (maxX === minX ? (L + W - R) / 2 : L + ((x - minX) / (maxX - minX)) * (W - L - R));
  const py = (y) => T + (1 - (y - minY) / (maxY - minY)) * (H - T - B);
  const coords = points.map((p) => px(p.x).toFixed(1) + ',' + py(p.y).toFixed(1));
  const last = points[points.length - 1];
  const first = points[0];
  const id = 'g' + Math.random().toString(36).slice(2, 7);
  let line = '';
  if (points.length > 1) {
    line = '<path d="M' + coords.join(' L') + ' L' + px(last.x).toFixed(1) + ',' + (H - B) + ' L' + px(first.x).toFixed(1) + ',' + (H - B) + ' Z" fill="url(#' + id + 'a)" stroke="none"/>' +
      '<polyline points="' + coords.join(' ') + '" fill="none" stroke="url(#' + id + 'l)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>';
  }
  const dots = points.length <= 24 ? points.map((p) => '<circle cx="' + px(p.x).toFixed(1) + '" cy="' + py(p.y).toFixed(1) + '" r="3" class="cdot"/>').join('') : '';
  const lastDot = '<circle cx="' + px(last.x).toFixed(1) + '" cy="' + py(last.y).toFixed(1) + '" r="5" class="cdot-last"/>';
  const label = (p, anchor) => '<text x="' + (anchor === 'end' ? W - R : L) + '" y="' + (H - 8) + '" text-anchor="' + anchor + '" class="clabel">' + esc(shortDate(toKey(p.x))) + '</text>';
  return '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(o.label || 'Gráfica') + '">' +
    '<defs><linearGradient id="' + id + 'l" x1="0" x2="1"><stop offset="0" stop-color="#14a9eb"/><stop offset="1" stop-color="#7be3ff"/></linearGradient>' +
    '<linearGradient id="' + id + 'a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#38c7ff" stop-opacity=".32"/><stop offset="1" stop-color="#38c7ff" stop-opacity="0"/></linearGradient></defs>' +
    '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + (H - B) + '" y2="' + (H - B) + '" class="caxis"/>' +
    line + dots + lastDot +
    '<text x="' + (W - R) + '" y="' + (T - 3) + '" text-anchor="end" class="clabel strong">' + esc(fmt(last.y, dec) + unit) + '</text>' +
    (points.length > 1 ? label(first, 'start') + label(last, 'end') : label(last, 'start')) +
    '</svg>';
}

function toKey(ts) {
  const d = new Date(ts);
  return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
}

export function pointsFromDates(items, getKey, getVal) {
  return items
    .map((it) => ({ x: parseKey(getKey(it)).getTime(), y: getVal(it) }))
    .sort((a, b) => a.x - b.x);
}

/* ---------- Hoja inferior ---------- */

const sheet = () => document.getElementById('sheet');
const backdrop = () => document.getElementById('backdrop');
const form = () => document.getElementById('sheet-form');
let handlers = null;

export function openSheet(opts) {
  const sh = sheet();
  const wasHidden = sh.hidden;
  document.getElementById('sheet-title').textContent = opts.title;
  form().innerHTML = opts.html;
  handlers = opts;
  const saveBtn = document.getElementById('sheet-save');
  saveBtn.hidden = opts.saveLabel === null;
  saveBtn.textContent = opts.saveLabel || 'Guardar';
  document.getElementById('sheet-cancel').textContent = opts.cancelLabel || 'Cancelar';
  const del = document.getElementById('sheet-delete');
  del.hidden = !opts.onDelete;
  del.textContent = opts.deleteLabel || 'Eliminar';
  sh.hidden = false;
  backdrop().hidden = false;
  sh.style.transform = '';
  if (wasHidden) {
    sh.classList.remove('enter');
    void sh.offsetWidth;
    sh.classList.add('enter');
    document.body.classList.add('sheet-open');
  }
  if (wasHidden) {
    sh.scrollTop = 0;
    const f = form().querySelector('[data-focus]');
    if (f) setTimeout(() => { f.focus(); }, 80);
  }
}

export function closeSheet(cancelled) {
  const h = handlers;
  handlers = null;
  sheet().hidden = true;
  backdrop().hidden = true;
  form().innerHTML = '';
  document.body.classList.remove('sheet-open');
  if (cancelled && h && h.onCancel) h.onCancel();
}

export function isSheetOpen() { return !sheet().hidden; }
export function sheetForm() { return form(); }

export function field(label, id, inner, extra) {
  return '<div class="field' + (extra ? ' ' + extra : '') + '"><label for="' + id + '">' + esc(label) + '</label>' + inner + '</div>';
}

export function initSheet() {
  const sh = sheet();
  document.getElementById('sheet-save').addEventListener('click', submit);
  document.getElementById('sheet-cancel').addEventListener('click', () => closeSheet(true));
  backdrop().addEventListener('click', () => closeSheet(true));
  form().addEventListener('submit', (e) => { e.preventDefault(); submit(); });
  document.getElementById('sheet-delete').addEventListener('click', () => {
    if (!handlers || !handlers.onDelete) return;
    if (confirm('¿Seguro que quieres eliminarlo?')) {
      const fn = handlers.onDelete;
      closeSheet(false);
      fn();
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !sh.hidden) closeSheet(true);
  });

  let startY = 0, dy = 0, dragging = false;
  const grab = sh.querySelector('.grabber');
  const head = sh.querySelector('.sheet-head');
  [grab, head].forEach((el) => {
    el.addEventListener('touchstart', (e) => {
      if (e.target.closest('button')) return;
      dragging = true; startY = e.touches[0].clientY; dy = 0;
      sh.style.transition = 'none';
    }, { passive: true });
    el.addEventListener('touchmove', (e) => {
      if (!dragging) return;
      dy = Math.max(0, e.touches[0].clientY - startY);
      sh.style.transform = 'translateY(' + dy + 'px)';
    }, { passive: true });
    el.addEventListener('touchend', () => {
      if (!dragging) return;
      dragging = false;
      sh.style.transition = '';
      if (dy > 110) closeSheet(true); else sh.style.transform = '';
    });
  });
}

function submit() {
  if (!handlers || !handlers.onSave) return;
  const h = handlers;
  const result = h.onSave(form());
  if (result !== false && handlers === h) closeSheet(false);
}

/* ---------- Helpers de datos ---------- */

export function findById(list, id) {
  for (let i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
  return null;
}

export function removeById(list, id) {
  const i = list.findIndex((x) => x.id === id);
  if (i >= 0) list.splice(i, 1);
}
