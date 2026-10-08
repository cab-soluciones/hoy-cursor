import {
  esc, uid, dateKey, todayKey, addDays, mondayOf, parseKey, parseNum, numStr, fmt, longDate, capitalize
} from './util.js';
import { getState, save, WEEKDAY_ORDER, WEEKDAY_LETTERS, BLOCK_KINDS } from './data.js';
import { fmtClock, legMinutes } from './calc.js';
import { stepsFor, plan, isSkipped, nowMinutes } from './walk.js';
import { icon, openSheet, closeSheet, field, findById, removeById, refresh, toast } from './ui.js';

const root = () => document.getElementById('view-actividad');
const DAY_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const ui = { sel: '', prevPct: null };

const selected = () => (ui.sel ? parseKey(ui.sel) : new Date());

function daysLabel(days) {
  if (!days.length) return 'Sin días';
  if (days.length === 7) return 'Todos los días';
  return WEEKDAY_ORDER.filter((d) => days.indexOf(d) >= 0).map((d) => DAY_SHORT[d]).join(' · ');
}

function dur(min) {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h ? h + ' h' + (m ? ' ' + m + ' min' : '') : m + ' min';
}

/* ---------- Línea de tiempo del día ---------- */

export function timelineHtml(date) {
  const key = dateKey(date);
  const p = plan(date);
  const isToday = key === todayKey();
  const now = nowMinutes();
  const items = [];
  p.blocks.forEach((b) => items.push({ type: 'block', start: b.startMin, end: b.endMin, b: b }));
  p.legs.forEach((l) => items.push({ type: 'leg', start: l.startMin, end: l.endMin, l: l }));
  items.sort((a, b) => a.start - b.start || (a.type === 'leg' ? -1 : 1));
  if (!items.length) return '<div class="empty">Sin actividades programadas este día.</div>';

  const rows = items.map((it) => {
    const status = !isToday ? '' : now >= it.end ? 'past' : now >= it.start ? 'now' : 'next';
    const badge = status === 'now' ? '<span class="now-badge">Ahora</span>' : '';
    if (it.type === 'leg') {
      const l = it.l;
      const m = legMinutes(l.km, getState().walk.speed);
      return '<div class="tl-item leg ' + status + '"><div class="tl-time">' + fmtClock(it.start) + '</div><div class="tl-dot">' + icon('walk', 14) + '</div>' +
        '<div class="tl-body"><div class="tl-title">' + (l.dir === 'to' ? 'Ida a ' : 'Vuelta de ') + esc(l.name) + badge + '</div>' +
        '<div class="tl-sub">' + m + ' min · ' + fmt(l.km, 2) + ' km · ' + fmt(l.km * stepsFor(date).spk, 0) + ' pasos</div></div></div>';
    }
    const b = it.b;
    return '<div class="tl-item block ' + status + (b.skipped ? ' skipped' : '') + ' tappable" data-action="act:block" data-id="' + esc(b.id) + '" data-date="' + key + '" role="button" tabindex="0">' +
      '<div class="tl-time">' + fmtClock(it.start) + '</div><div class="tl-dot emoji">' + esc(b.emoji) + '</div>' +
      '<div class="tl-body"><div class="tl-title">' + esc(b.name) + badge + '</div>' +
      '<div class="tl-sub">' + fmtClock(it.start) + ' – ' + fmtClock(it.end) + ' · ' + dur(it.end - it.start) + (b.skipped ? ' · No voy' : '') + '</div></div></div>';
  }).join('');
  return '<div class="timeline">' + rows + '</div>';
}

function statChips(sum) {
  return '<div class="stat-chips"><div><b>' + fmt(sum.km, 1) + '</b><span>km</span></div><div><b>' + dur(sum.doneMin || 0) + '</b><span>andando</span></div><div><b>' + fmt(sum.kcal, 0) + '</b><span>kcal</span></div></div>';
}

/* Tarjeta compacta para la pestaña Hoy */
export function todayCard() {
  const s = getState();
  const date = new Date();
  const sum = stepsFor(date);
  if (!sum.plan.blocks.length && sum.logged == null) return '';
  const goal = s.walk.goal;
  const pct = Math.min(100, Math.round((sum.steps / goal) * 100));
  const walking = sum.plan.legs.some((l) => sum.nowMin >= l.startMin && sum.nowMin < l.endMin);
  return '<div class="card today-walk"><div class="card-head"><h3>Mi día</h3><button type="button" class="link" data-action="app:go" data-tab="actividad">Ver actividad ' + icon('chevron', 14) + '</button></div>' +
    '<div class="walk-mini"><div class="wm-ring" style="--p:' + pct + '"><span>' + icon('walk', 20) + '</span></div>' +
    '<div class="grow"><div class="wm-steps"><b>' + fmt(sum.steps, 0) + '</b> <span>/ ' + fmt(goal, 0) + ' pasos</span>' + (walking ? '<span class="now-badge">En marcha</span>' : '') + '</div>' +
    '<div class="wm-sub">' + fmt(sum.km, 1) + ' km · hoy previstos ' + fmt(sum.plannedKm, 1) + ' km</div></div></div>' +
    timelineHtml(date) + '</div>';
}

/* ---------- Pestaña Actividad ---------- */

function weekBars() {
  const s = getState();
  const monday = mondayOf(new Date());
  const today = todayKey();
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = addDays(monday, i);
    const k = dateKey(d);
    const sum = stepsFor(d);
    const future = k > today;
    days.push({ d: d, k: k, steps: future ? sum.plannedSteps : sum.steps, future: future, sum: sum });
  }
  const goal = s.walk.goal;
  const max = Math.max(goal * 1.15, Math.max.apply(null, days.map((x) => x.steps)));
  const bars = days.map((x) => {
    const h = Math.round((x.steps / max) * 100);
    const reached = !x.future && x.steps >= goal;
    return '<button type="button" class="ws-day' + (x.k === (ui.sel || today) ? ' sel' : '') + (x.future ? ' future' : '') + (reached ? ' reached' : '') + '" data-action="act:day" data-date="' + x.k + '" aria-label="' + esc(longDate(x.d)) + ': ' + fmt(x.steps, 0) + ' pasos">' +
      '<b>' + (x.steps ? fmt(x.steps / 1000, 1) + 'k' : '—') + '</b><div class="ws-track"><span style="height:' + Math.max(x.steps ? 5 : 0, h) + '%"></span></div><em>' + WEEKDAY_LETTERS[x.d.getDay()] + '</em></button>';
  }).join('');
  const goalPos = (goal / max).toFixed(3);

  let km = 0, steps = 0, min = 0, plannedKm = 0;
  days.forEach((x) => {
    plannedKm += x.sum.plannedKm;
    if (!x.future) { km += x.sum.km; steps += x.sum.steps; min += x.sum.doneMin; }
  });
  return '<div class="card"><h3>Esta semana</h3><div class="tiles">' +
    '<div class="tile"><b>' + fmt(km, 1) + '</b><span>km</span></div>' +
    '<div class="tile"><b>' + fmt(steps, 0) + '</b><span>pasos</span></div>' +
    '<div class="tile"><b>' + dur(min) + '</b><span>andando</span></div></div>' +
    '<div class="wsteps" style="--goal:' + goalPos + '">' + bars + '<i class="goal-line" aria-hidden="true"></i></div>' +
    '<p class="hint">Meta diaria: ' + fmt(goal, 0) + ' pasos. Previsto toda la semana: ' + fmt(plannedKm, 1) + ' km.</p></div>';
}

function scheduleCard() {
  const s = getState();
  const rows = s.schedule.length
    ? s.schedule.map((b) => {
      const trips = (b.walkTo ? 1 : 0) + (b.walkBack ? 1 : 0);
      return '<div class="row tappable sched" data-action="act:edit" data-id="' + esc(b.id) + '" role="button" tabindex="0">' +
        '<div class="h-emoji">' + esc(b.emoji) + '</div>' +
        '<div class="grow"><div class="txt">' + esc(b.name) + '</div>' +
        '<div class="pill">' + esc(daysLabel(b.days)) + ' · ' + esc(b.start) + '–' + esc(b.end) + '</div>' +
        '<div class="pill">' + (trips ? fmt(b.km, 2) + ' km por trayecto · ' + trips + (trips === 1 ? ' trayecto' : ' trayectos') + ' al día' : 'Sin desplazamiento a pie') + '</div></div>' +
        '<span class="chev">' + icon('chevron', 18) + '</span></div>';
    }).join('')
    : '<div class="empty">Añade tu trabajo, curso o actividades para calcular tus trayectos.</div>';
  return '<div class="card"><div class="card-head"><h3>Mi horario</h3><button type="button" class="link" data-action="act:new">' + icon('plus', 16) + ' Añadir</button></div>' + rows + '</div>';
}

export function render() {
  const s = getState();
  const date = selected();
  const key = dateKey(date);
  const today = todayKey();
  const isToday = key === today;
  const sum = stepsFor(date);
  const goal = s.walk.goal;
  const pct = Math.min(100, Math.round((sum.steps / goal) * 100));
  const R = 40;
  const C = 2 * Math.PI * R;
  const from = ui.prevPct == null ? pct : ui.prevPct;
  const walking = isToday && sum.plan.legs.some((l) => sum.nowMin >= l.startMin && sum.nowMin < l.endMin);
  const future = key > today;
  const title = isToday ? 'Hoy' : capitalize(date.toLocaleDateString('es-ES', { weekday: 'long' }));

  const banner = !s.walk.configured && s.schedule.length
    ? '<div class="card notice"><div class="grow"><b>Ajusta tus distancias</b><p>Ahora cada trayecto cuenta 1,5 km de ejemplo. Pon la distancia real para que los pasos y kilómetros sean exactos.</p></div>' +
      '<button type="button" class="btn sm" data-action="act:dist">Ajustar</button></div>'
    : '';

  root().innerHTML =
    '<div class="title-row"><h1>Actividad</h1><button type="button" class="icon-btn" data-action="act:settings" aria-label="Ajustes de caminar">' + icon('target', 22) + '</button></div>' +
    banner +
    '<div class="hero walk-hero"><div class="ring big" role="img" aria-label="' + pct + '% de la meta de pasos">' +
    '<svg viewBox="0 0 96 96"><circle class="track" cx="48" cy="48" r="' + R + '" fill="none" stroke-width="9"/>' +
    '<circle class="bar" id="walk-bar" cx="48" cy="48" r="' + R + '" fill="none" stroke-width="9" stroke-linecap="round" stroke-dasharray="' + C.toFixed(2) + '" stroke-dashoffset="' + (C * (1 - from / 100)).toFixed(2) + '"/></svg>' +
    '<div class="pct walker' + (walking ? ' go' : '') + '">' + icon('walk', 30) + '</div></div>' +
    '<div class="grow"><div class="hero-kicker">' + esc(title) + (walking ? '<span class="now-badge">En marcha</span>' : '') + '</div>' +
    '<div class="hero-num"><span id="walk-steps">' + fmt(sum.steps, 0) + '</span><small>pasos</small></div>' +
    '<p class="sub">' + (future ? 'Previstos: ' + fmt(sum.plannedSteps, 0) + ' pasos' : 'Meta ' + fmt(goal, 0) + ' · ' + pct + '%') + '</p></div></div>' +
    '<div class="card">' + statChips(sum) +
    (sum.logged != null
      ? '<p class="hint">Pasos registrados a mano. Previstos por tu horario: ' + fmt(sum.plannedSteps, 0) + ' (' + fmt(sum.plannedKm, 1) + ' km).</p>'
      : '<p class="hint">' + (future ? 'Estimado' : 'Estimado por tu horario') + ': ' + fmt(sum.plannedSteps, 0) + ' pasos en total (' + fmt(sum.plannedKm, 1) + ' km, ' + dur(sum.plannedMin) + ').</p>') +
    (key <= today ? '<button type="button" class="btn ghost block mt" data-action="act:log">' + icon('edit', 16) + ' ' + (sum.logged != null ? 'Editar pasos reales' : 'Registrar pasos reales (app Salud)') + '</button>' : '') + '</div>' +
    weekBars() +
    '<div class="card"><h3>' + esc(isToday ? 'Mi día' : longDate(date)) + '</h3>' + timelineHtml(date) + '</div>' +
    scheduleCard();

  const bar = document.getElementById('walk-bar');
  if (bar && from !== pct) {
    requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.strokeDashoffset = (C * (1 - pct / 100)).toFixed(2); }));
    const label = document.getElementById('walk-steps');
    const t0 = performance.now();
    const target = sum.steps;
    const start = Math.round((target / Math.max(pct, 1)) * from);
    (function tick(now) {
      const k = Math.min(1, (now - t0) / 700);
      if (label) label.textContent = fmt(Math.round(start + (target - start) * k), 0);
      if (k < 1) requestAnimationFrame(tick);
    })(t0);
  }
  ui.prevPct = pct;
}

/* ---------- Hojas ---------- */

function blockSheet(block) {
  const b = block || { name: '', emoji: '📍', kind: 'other', days: [1, 2, 3, 4, 5], start: '09:00', end: '14:00', km: 1.5, walkTo: true, walkBack: true };
  const kinds = BLOCK_KINDS.map((k) => '<option value="' + k.value + '"' + (b.kind === k.value ? ' selected' : '') + '>' + esc(k.label) + '</option>').join('');
  const dayChips = WEEKDAY_ORDER.map((d) => '<label class="chip"><input type="checkbox" name="day" value="' + d + '"' + (b.days.indexOf(d) >= 0 ? ' checked' : '') + '><span>' + WEEKDAY_LETTERS[d] + '</span></label>').join('');
  openSheet({
    title: block ? 'Editar actividad' : 'Nueva actividad',
    html: '<div class="cols c-emoji">' +
      field('Emoji', 'b-emoji', '<input type="text" id="b-emoji" name="emoji" maxlength="8" value="' + esc(b.emoji) + '">') +
      field('Nombre', 'b-name', '<input type="text" id="b-name" name="name" maxlength="60" placeholder="Trabajo" data-focus value="' + esc(b.name) + '">') + '</div>' +
      field('Tipo', 'b-kind', '<select id="b-kind" name="kind">' + kinds + '</select>') +
      '<div class="field"><label>Días</label><div class="chips">' + dayChips + '</div></div>' +
      '<div class="cols">' + field('Empieza', 'b-start', '<input type="time" id="b-start" name="start" value="' + esc(b.start) + '">') +
      field('Termina', 'b-end', '<input type="time" id="b-end" name="end" value="' + esc(b.end) + '">') + '</div>' +
      field('Distancia andando por trayecto (km)', 'b-km', '<input type="text" inputmode="decimal" id="b-km" name="km" value="' + esc(numStr(b.km)) + '">') +
      '<label class="switch"><input type="checkbox" name="walkTo"' + (b.walkTo ? ' checked' : '') + '><span>Voy andando</span></label>' +
      '<label class="switch"><input type="checkbox" name="walkBack"' + (b.walkBack ? ' checked' : '') + '><span>Vuelvo andando</span></label>',
    onSave: (f) => {
      const name = f.elements.name.value.trim();
      const start = f.elements.start.value;
      const end = f.elements.end.value;
      const km = parseNum(f.elements.km.value);
      if (!name) { f.elements.name.focus(); return false; }
      if (!start || !end) { toast('Indica la hora de inicio y fin'); return false; }
      if (end <= start) { toast('La hora de fin debe ser posterior al inicio'); return false; }
      const days = Array.prototype.map.call(f.querySelectorAll('input[name=day]:checked'), (i) => Number(i.value));
      if (!days.length) { toast('Elige al menos un día'); return false; }
      const data = {
        name: name, emoji: f.elements.emoji.value.trim() || '📍', kind: f.elements.kind.value, days: days,
        start: start, end: end, km: isFinite(km) && km > 0 ? Math.min(100, Math.round(km * 100) / 100) : 0,
        walkTo: f.elements.walkTo.checked, walkBack: f.elements.walkBack.checked
      };
      const s = getState();
      if (block) Object.assign(block, data); else s.schedule.push(Object.assign({ id: uid() }, data));
      s.walk.configured = true;
      save();
      refresh('actividad');
      refresh('hoy');
    },
    onDelete: block ? () => { removeById(getState().schedule, block.id); save(); refresh('actividad'); refresh('hoy'); } : null,
    deleteLabel: 'Eliminar actividad'
  });
}

function logSheet(key) {
  const cur = stepsFor(parseKey(key));
  openSheet({
    title: 'Pasos de ' + (key === todayKey() ? 'hoy' : parseKey(key).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })),
    html: field('Pasos reales', 'l-steps', '<input type="text" inputmode="numeric" id="l-steps" name="steps" placeholder="' + fmt(cur.plannedSteps, 0) + '" data-focus value="' + (cur.logged != null ? cur.logged : '') + '">') +
      '<p class="hint">Copia aquí el dato de la app Salud del iPhone. Safari no puede leerlo directamente, así que por defecto la app estima los pasos con tu horario y tus trayectos.</p>',
    onSave: (f) => {
      const v = Math.round(parseNum(f.elements.steps.value));
      if (!isFinite(v) || v < 0 || v > 200000) { f.elements.steps.focus(); toast('Introduce un número de pasos válido'); return false; }
      const s = getState();
      const e = s.stepsLog.find((x) => x.date === key);
      if (e) e.steps = v; else s.stepsLog.push({ date: key, steps: v });
      save();
      refresh('actividad');
      refresh('hoy');
    },
    onDelete: cur.logged != null ? () => {
      const s = getState();
      s.stepsLog = s.stepsLog.filter((x) => x.date !== key);
      save();
      refresh('actividad');
      refresh('hoy');
    } : null,
    deleteLabel: 'Quitar registro manual'
  });
}

function distSheet() {
  const s = getState();
  openSheet({
    title: 'Distancias de tus trayectos',
    html: '<p class="hint">Distancia andando de ida (la vuelta cuenta igual). Puedes medirla en Mapas.</p>' +
      s.schedule.map((b, i) => field(b.emoji + ' ' + b.name + ' (km)', 'd-' + i, '<input type="text" inputmode="decimal" id="d-' + i + '" name="km-' + i + '" value="' + esc(numStr(b.km)) + '">')).join(''),
    onSave: (f) => {
      s.schedule.forEach((b, i) => {
        const v = parseNum(f.elements['km-' + i].value);
        if (isFinite(v) && v >= 0) b.km = Math.min(100, Math.round(v * 100) / 100);
      });
      s.walk.configured = true;
      save();
      refresh('actividad');
      refresh('hoy');
    }
  });
}

function settingsSheet() {
  const w = getState().walk;
  openSheet({
    title: 'Meta y ritmo',
    html: '<div class="cols">' +
      field('Meta diaria (pasos)', 'w-goal', '<input type="text" inputmode="numeric" id="w-goal" name="goal" value="' + w.goal + '">') +
      field('Ritmo al caminar (km/h)', 'w-speed', '<input type="text" inputmode="decimal" id="w-speed" name="speed" value="' + esc(numStr(w.speed)) + '">') + '</div>' +
      '<p class="hint">La longitud del paso se calcula con tu altura (Gym &gt; Cuerpo). Un ritmo normal ronda los 5 km/h.</p>',
    onSave: (f) => {
      const goal = Math.round(parseNum(f.elements.goal.value));
      const speed = parseNum(f.elements.speed.value);
      if (!(goal >= 1000 && goal <= 50000)) { toast('La meta debe estar entre 1.000 y 50.000 pasos'); return false; }
      if (!(speed >= 2 && speed <= 8)) { toast('El ritmo debe estar entre 2 y 8 km/h'); return false; }
      w.goal = goal;
      w.speed = Math.round(speed * 10) / 10;
      save();
      refresh('actividad');
      refresh('hoy');
    }
  });
}

function blockInfo(blockId, key) {
  const b = findById(getState().schedule, blockId);
  if (!b) return;
  const skipped = isSkipped(key, blockId);
  const date = parseKey(key);
  openSheet({
    title: b.emoji + ' ' + b.name,
    saveLabel: null,
    cancelLabel: 'Cerrar',
    html: '<div class="kv"><span>Día</span><b>' + esc(longDate(date)) + '</b></div>' +
      '<div class="kv"><span>Horario</span><b>' + esc(b.start) + ' – ' + esc(b.end) + '</b></div>' +
      '<div class="kv"><span>Trayecto andando</span><b>' + fmt(b.km, 2) + ' km (' + legMinutes(b.km, getState().walk.speed) + ' min)</b></div>' +
      '<button type="button" class="btn ' + (skipped ? '' : 'ghost') + ' block mt" data-action="act:skip" data-id="' + esc(blockId) + '" data-date="' + key + '">' + (skipped ? 'Sí voy este día' : 'No voy este día') + '</button>' +
      '<button type="button" class="btn ghost block mt" data-action="act:edit" data-id="' + esc(blockId) + '">' + icon('edit', 16) + ' Editar horario</button>'
  });
}

/* ---------- Acciones ---------- */

export const actions = {
  'act:day': (el) => { ui.sel = el.getAttribute('data-date') === todayKey() ? '' : el.getAttribute('data-date'); render(); },
  'act:new': () => blockSheet(null),
  'act:edit': (el) => { const b = findById(getState().schedule, el.getAttribute('data-id')); if (b) blockSheet(b); },
  'act:block': (el) => blockInfo(el.getAttribute('data-id'), el.getAttribute('data-date')),
  'act:skip': (el) => {
    const s = getState();
    const k = el.getAttribute('data-date') + '|' + el.getAttribute('data-id');
    const i = s.skips.indexOf(k);
    if (i >= 0) s.skips.splice(i, 1); else s.skips.push(k);
    save();
    closeSheet(false);
    refresh('actividad');
    refresh('hoy');
  },
  'act:log': () => logSheet(ui.sel || todayKey()),
  'act:dist': () => distSheet(),
  'act:settings': () => settingsSheet()
};

export function init() {
  setInterval(() => {
    if (document.hidden) return;
    const sel = document.getElementById('view-actividad');
    if (sel && !sel.hidden) {
      const sheetOpen = !document.getElementById('sheet').hidden;
      if (!sheetOpen) render();
    }
  }, 60000);
}

