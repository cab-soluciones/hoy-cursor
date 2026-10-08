import {
  esc, uid, todayKey, dateKey, mondayOf, parseKey, parseNum, numStr, fmt, fmtDur, fmtMinutes, shortDate, clamp
} from './util.js';
import {
  getState, save, MUSCLE_GROUPS, WEEKDAY_ORDER, WEEKDAY_LETTERS, ACTIVITY_LEVELS, GOALS, TEMPLATES,
  allExercises, findExercise, exerciseName, isCustomExercise, lastEntryFor, applyTemplate, currentWeight
} from './data.js';
import {
  epley, brzycki, percentTable, platesPerSide, bmi, bmiCategory, nutrition, sessionVolume, sessionSets,
  bestScore, bestSet, findPRs, setScore
} from './calc.js';
import {
  icon, openSheet, closeSheet, field, sheetForm, findById, removeById, refresh, goTo, toast, haptic,
  unlockAudio, beep, lineChart, pointsFromDates
} from './ui.js';

const root = () => document.getElementById('view-gym');
const DAY_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const SEGMENTS = [['entrenar', 'Entrenar'], ['rutinas', 'Rutinas'], ['cuerpo', 'Cuerpo'], ['calcular', 'Calcular']];

const ui = {
  seg: 'entrenar',
  openGroups: {},
  rm: { kg: '', reps: '' },
  plate: { target: '', bar: 20 },
  rest: null
};

/* ---------- Render general ---------- */

export function render() {
  const s = getState();
  const seg = '<div class="seg" role="tablist" aria-label="Secciones del gimnasio">' +
    SEGMENTS.map((x) => '<button type="button" role="tab" class="' + (ui.seg === x[0] ? 'on' : '') + '" aria-selected="' + (ui.seg === x[0]) + '" data-action="gym:seg" data-seg="' + x[0] + '">' + x[1] +
      (x[0] === 'entrenar' && s.active ? '<i class="live-dot"></i>' : '') + '</button>').join('') + '</div>';
  let body = '';
  if (ui.seg === 'entrenar') body = s.active ? renderActive() : renderIdle();
  else if (ui.seg === 'rutinas') body = renderRutinas();
  else if (ui.seg === 'cuerpo') body = renderCuerpo();
  else body = renderCalc();
  root().innerHTML = '<div class="title-row"><h1>Gym</h1></div>' + seg + body;
  tick();
}

function daysLabel(days) {
  if (!days.length) return 'Sin día fijo';
  return WEEKDAY_ORDER.filter((d) => days.indexOf(d) >= 0).map((d) => DAY_SHORT[d]).join(' · ');
}

/* ---------- Entrenar: reposo ---------- */

function weekStats() {
  const s = getState();
  const from = dateKey(mondayOf(new Date()));
  const list = s.sessions.filter((x) => x.date >= from);
  return {
    count: list.length,
    volume: list.reduce((n, x) => n + sessionVolume(x), 0),
    minutes: list.reduce((n, x) => n + x.durationMin, 0)
  };
}

function renderIdle() {
  const s = getState();
  const now = new Date();
  const dow = now.getDay();
  const todays = s.routines.filter((r) => r.days.indexOf(dow) >= 0);
  const others = s.routines.filter((r) => r.days.indexOf(dow) < 0);
  const st = weekStats();

  const today = todayKey();
  const routineCard = (r, highlight) => {
    const sets = r.items.reduce((n, i) => n + i.sets, 0);
    const doneToday = s.sessions.some((x) => x.date === today && x.routineId === r.id);
    return '<div class="card routine-pick' + (highlight ? ' hl' : '') + '"><div class="grow">' +
      (highlight ? '<div class="gt-kicker">' + (doneToday ? 'Completada hoy' : 'Hoy toca') + '</div>' : '') +
      '<div class="gt-title">' + esc(r.name) + '</div><div class="gt-sub">' + r.items.length + ' ejercicios · ' + sets + ' series</div></div>' +
      '<button type="button" class="btn sm" data-action="gym:start" data-id="' + esc(r.id) + '">' + icon('play', 14) + ' Empezar</button></div>';
  };

  let start = '';
  if (todays.length) start += todays.map((r) => routineCard(r, true)).join('');
  if (others.length) start += '<div class="sub-label">' + (todays.length ? 'Otras rutinas' : 'Elige una rutina') + '</div>' + others.map((r) => routineCard(r, false)).join('');
  if (!s.routines.length) {
    start = '<div class="card empty-state"><div class="big">🏋️</div><p>Crea tu primera rutina o añade una plantilla para empezar a registrar series y ver tu progreso.</p>' +
      '<button type="button" class="btn" data-action="gym:seg" data-seg="rutinas">Ir a Rutinas</button></div>';
  }

  const history = s.sessions.slice().sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.startedAt - a.startedAt)).slice(0, 20);
  const histHtml = history.length
    ? history.map((x) => {
      const d = parseKey(x.date);
      return '<div class="row tappable" data-action="gym:session" data-id="' + esc(x.id) + '" role="button" tabindex="0">' +
        '<div class="date-badge"><b>' + d.getDate() + '</b><span>' + esc(d.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '')) + '</span></div>' +
        '<div class="grow"><div class="txt">' + esc(x.name) + '</div><div class="pill">' + x.entries.length + ' ejerc. · ' + sessionSets(x) + ' series · ' + fmt(sessionVolume(x), 0) + ' kg' + (x.durationMin ? ' · ' + fmtMinutes(x.durationMin) : '') + '</div></div>' +
        (x.prs.length ? '<span class="pr-badge" title="Récord personal">' + icon('trophy', 16) + x.prs.length + '</span>' : '') + '</div>';
    }).join('')
    : '<div class="empty">Todavía no has registrado entrenos.</div>';

  return '<div class="card"><h3>Esta semana</h3><div class="tiles">' +
    '<div class="tile"><b>' + st.count + '</b><span>Entrenos</span></div>' +
    '<div class="tile"><b>' + fmt(st.volume / 1000, 1) + ' t</b><span>Volumen</span></div>' +
    '<div class="tile"><b>' + (st.minutes ? fmtMinutes(st.minutes) : '0 min') + '</b><span>Tiempo</span></div></div></div>' +
    start +
    '<button type="button" class="btn ghost block" data-action="gym:start" data-id="">' + icon('plus', 16) + ' Entreno libre</button>' +
    '<div class="card flush"><div class="card-head pad"><h3>Historial</h3></div>' + histHtml + '</div>';
}

/* ---------- Entrenar: sesión activa ---------- */

function previousHint(exId) {
  const last = lastEntryFor(exId);
  if (!last) return 'Primera vez con este ejercicio';
  const b = bestSet(last.sets);
  return 'Última vez (' + shortDate(last.date) + '): ' + last.sets.length + ' series · mejor ' + (b.kg ? fmt(b.kg, 2) + ' kg × ' : '') + b.reps;
}

function renderActive() {
  const a = getState().active;
  const rest = getState().restSeconds;
  const entries = a.entries.map((e, ei) => {
    const rows = e.sets.map((st, si) =>
      '<div class="set-row' + (st.done ? ' done' : '') + '"><span class="set-n">' + (si + 1) + '</span>' +
      '<input class="set-input" type="text" inputmode="decimal" placeholder="kg" aria-label="Kilos de la serie ' + (si + 1) + '" data-ei="' + ei + '" data-si="' + si + '" data-f="kg" value="' + esc(numStr(st.kg)) + '">' +
      '<input class="set-input" type="text" inputmode="numeric" placeholder="reps" aria-label="Repeticiones de la serie ' + (si + 1) + '" data-ei="' + ei + '" data-si="' + si + '" data-f="reps" value="' + esc(numStr(st.reps)) + '">' +
      '<button type="button" class="check' + (st.done ? ' on' : '') + '" data-action="gym:set-done" data-ei="' + ei + '" data-si="' + si + '" aria-label="Serie ' + (si + 1) + ' hecha" aria-pressed="' + !!st.done + '">' + icon('check', 16) + '</button></div>').join('');
    return '<div class="card ex-card"><div class="ex-head"><div class="grow"><button type="button" class="ex-title" data-action="gym:ex-info" data-id="' + esc(e.exId) + '">' + esc(exerciseName(e.exId, e.name)) + '</button>' +
      '<div class="pill">' + esc(previousHint(e.exId)) + '</div></div>' +
      '<button type="button" class="icon-btn" data-action="gym:remove-ex" data-ei="' + ei + '" aria-label="Quitar ejercicio">' + icon('x', 18) + '</button></div>' +
      '<div class="set-head"><span>Serie</span><span>Kg</span><span>Reps</span><span></span></div>' + rows +
      '<div class="set-actions"><button type="button" class="btn ghost sm" data-action="gym:add-set" data-ei="' + ei + '">' + icon('plus', 14) + ' Serie</button>' +
      (e.sets.length ? '<button type="button" class="btn ghost sm" data-action="gym:del-set" data-ei="' + ei + '">' + icon('minus', 14) + ' Quitar</button>' : '') + '</div></div>';
  }).join('');

  const restChips = [60, 90, 120, 180].map((n) =>
    '<button type="button" class="pchip' + (rest === n ? ' on' : '') + '" data-action="gym:rest-set" data-s="' + n + '">' + (n >= 120 ? n / 60 + ' min' : n + ' s') + '</button>').join('');

  return '<div class="card workout-head"><div class="wh-top"><div class="grow"><div class="gt-kicker">Entreno en curso</div><div class="gt-title">' + esc(a.name) + '</div></div>' +
    '<div class="elapsed" id="elapsed">' + icon('timer', 16) + '<span>' + fmtDur((Date.now() - a.startedAt) / 1000) + '</span></div></div>' +
    '<div class="rest-set"><span>Descanso</span><div class="chips">' + restChips + '</div></div>' +
    '<div class="wh-actions"><button type="button" class="btn" data-action="gym:finish">Terminar entreno</button>' +
    '<button type="button" class="btn ghost" data-action="gym:cancel">Descartar</button></div></div>' +
    (entries || '<div class="card empty">Añade tu primer ejercicio.</div>') +
    '<button type="button" class="btn ghost block" data-action="gym:add-ex">' + icon('plus', 16) + ' Añadir ejercicio</button>';
}

/* ---------- Temporizadores ---------- */

function tick() {
  const a = getState().active;
  const el = document.querySelector('#elapsed span');
  if (el && a) el.textContent = fmtDur((Date.now() - a.startedAt) / 1000);
  updateRest();
}

function updateRest() {
  const bar = document.getElementById('rest-bar');
  if (!bar) return;
  const r = ui.rest;
  if (!r || !getState().active) { bar.hidden = true; if (r && !getState().active) ui.rest = null; return; }
  bar.hidden = false;
  const rem = Math.ceil((r.end - Date.now()) / 1000);
  const label = document.getElementById('rest-label');
  const time = document.getElementById('rest-time');
  const fill = document.getElementById('rest-fill');
  if (rem <= 0) {
    if (!r.finished) {
      r.finished = true;
      r.hideAt = Date.now() + 5000;
      beep();
      haptic(200);
    }
    label.textContent = '¡Descanso terminado!';
    time.textContent = '00:00';
    fill.style.width = '100%';
    bar.classList.add('ready');
    if (Date.now() > r.hideAt) { ui.rest = null; bar.hidden = true; bar.classList.remove('ready'); }
    return;
  }
  bar.classList.remove('ready');
  label.textContent = 'Descanso';
  time.textContent = fmtDur(rem);
  fill.style.width = clamp(100 - (rem / r.total) * 100, 0, 100) + '%';
}

function startRest() {
  const sec = getState().restSeconds;
  ui.rest = { end: Date.now() + sec * 1000, total: sec, finished: false, hideAt: 0 };
  updateRest();
}

let wake = null;
function requestWake() {
  try {
    if ('wakeLock' in navigator && getState().active && !wake) {
      navigator.wakeLock.request('screen').then((w) => {
        wake = w;
        w.addEventListener('release', () => { wake = null; });
      }).catch(() => {});
    }
  } catch (e) { /* sin wake lock */ }
}
function releaseWake() {
  if (wake) { wake.release().catch(() => {}); wake = null; }
}

/* ---------- Entrenar: acciones de sesión ---------- */

function buildEntry(exId, sets, reps) {
  const last = lastEntryFor(exId);
  const arr = [];
  for (let i = 0; i < sets; i++) {
    const prev = last ? last.sets[i] || last.sets[last.sets.length - 1] : null;
    arr.push({ kg: prev ? prev.kg : '', reps: reps || (prev ? prev.reps : ''), done: false });
  }
  return { exId: exId, name: exerciseName(exId), sets: arr };
}

function startWorkout(routineId) {
  const s = getState();
  ui.seg = 'entrenar';
  if (!s.active) {
    const r = routineId ? findById(s.routines, routineId) : null;
    s.active = {
      id: uid(),
      date: todayKey(),
      name: r ? r.name : 'Entreno libre',
      routineId: r ? r.id : '',
      startedAt: Date.now(),
      entries: r ? r.items.map((i) => buildEntry(i.exId, i.sets, i.reps)) : []
    };
    save();
    requestWake();
  }
  goTo('gym');
  refresh('hoy');
}

function finishWorkout() {
  const s = getState();
  const a = s.active;
  if (!a) return;
  const entries = a.entries
    .map((e) => ({
      exId: e.exId,
      name: exerciseName(e.exId, e.name),
      sets: e.sets.filter((x) => x.done && Number(x.reps) > 0).map((x) => ({ kg: Number(x.kg) || 0, reps: Number(x.reps) }))
    }))
    .filter((e) => e.sets.length);
  if (!entries.length) {
    if (confirm('No has completado ninguna serie. ¿Descartar el entreno?')) discardWorkout(true);
    return;
  }
  const pending = a.entries.reduce((n, e) => n + e.sets.filter((x) => !x.done).length, 0);
  if (pending && !confirm('Hay ' + pending + (pending === 1 ? ' serie' : ' series') + ' sin marcar que no se guardarán. ¿Terminar el entreno?')) return;

  const prs = findPRs(entries, s.sessions);
  const session = {
    id: a.id,
    date: a.date,
    name: a.name,
    routineId: a.routineId,
    startedAt: a.startedAt,
    durationMin: Math.max(1, Math.round((Date.now() - a.startedAt) / 60000)),
    entries: entries,
    prs: prs
  };
  s.sessions.push(session);
  s.active = null;
  ui.rest = null;
  releaseWake();
  save();
  render();
  refresh('hoy');
  summarySheet(session);
}

function discardWorkout(skipConfirm) {
  if (!skipConfirm && !confirm('¿Descartar este entreno? Se perderán las series registradas.')) return;
  getState().active = null;
  ui.rest = null;
  releaseWake();
  save();
  render();
  refresh('hoy');
}

function summarySheet(session) {
  const prs = session.prs.map((id) => '<li>' + icon('trophy', 16) + ' ' + esc(exerciseName(id)) + '</li>').join('');
  openSheet({
    title: 'Entreno guardado',
    saveLabel: null,
    cancelLabel: 'Cerrar',
    html: '<div class="summary"><div class="big">🎉</div><h2>' + esc(session.name) + '</h2></div>' +
      '<div class="tiles"><div class="tile"><b>' + fmtMinutes(session.durationMin) + '</b><span>Duración</span></div>' +
      '<div class="tile"><b>' + sessionSets(session) + '</b><span>Series</span></div>' +
      '<div class="tile"><b>' + fmt(sessionVolume(session), 0) + ' kg</b><span>Volumen</span></div></div>' +
      (prs ? '<h3 class="mt">Récords personales</h3><ul class="pr-list">' + prs + '</ul>' : '')
  });
}

function sessionSheet(session) {
  const entries = session.entries.map((e) =>
    '<div class="sd-ex"><div class="sd-name">' + esc(exerciseName(e.exId, e.name)) + (session.prs.indexOf(e.exId) >= 0 ? ' <span class="pr-badge">' + icon('trophy', 14) + 'PR</span>' : '') + '</div>' +
    '<div class="sd-sets">' + e.sets.map((x, i) => '<span>' + (i + 1) + '. ' + (x.kg ? fmt(x.kg, 2) + ' kg × ' : '') + x.reps + '</span>').join('') + '</div></div>').join('');
  openSheet({
    title: shortDate(session.date) + ' · ' + session.name,
    saveLabel: null,
    cancelLabel: 'Cerrar',
    html: '<div class="tiles"><div class="tile"><b>' + (session.durationMin ? fmtMinutes(session.durationMin) : '—') + '</b><span>Duración</span></div>' +
      '<div class="tile"><b>' + sessionSets(session) + '</b><span>Series</span></div>' +
      '<div class="tile"><b>' + fmt(sessionVolume(session), 0) + ' kg</b><span>Volumen</span></div></div>' + entries,
    onDelete: () => { removeById(getState().sessions, session.id); save(); render(); refresh('hoy'); },
    deleteLabel: 'Eliminar entreno'
  });
}

/* ---------- Ejercicios ---------- */

let pickCb = null;
let pickCancel = null;

function pickerSheet(onPick, onCancel) {
  pickCb = onPick;
  pickCancel = onCancel || null;
  const list = allExercises();
  const groups = MUSCLE_GROUPS.map((g) => {
    const items = list.filter((e) => e.group === g).sort((a, b) => a.name.localeCompare(b.name, 'es'));
    if (!items.length) return '';
    return '<div class="pick-group" data-group><div class="sub-label">' + esc(g) + '</div>' +
      items.map((e) => '<button type="button" class="pick-row" data-action="gym:pick" data-id="' + esc(e.id) + '" data-name="' + esc(e.name.toLowerCase()) + '"><span>' + esc(e.name) + '</span>' + icon('plus', 16) + '</button>').join('') + '</div>';
  }).join('');
  openSheet({
    title: 'Elegir ejercicio',
    saveLabel: null,
    html: '<input type="search" id="pick-q" class="search" placeholder="Buscar ejercicio" autocomplete="off" aria-label="Buscar ejercicio">' + groups +
      '<button type="button" class="btn ghost block" data-action="gym:pick-new">' + icon('plus', 16) + ' Crear ejercicio nuevo</button>',
    onCancel: onCancel
  });
}

function exerciseSheet(ex, onDone, onCancel) {
  const opts = MUSCLE_GROUPS.map((g) => '<option' + (ex && ex.group === g ? ' selected' : '') + '>' + esc(g) + '</option>').join('');
  openSheet({
    title: ex ? 'Editar ejercicio' : 'Nuevo ejercicio',
    html: field('Nombre', 'x-name', '<input type="text" id="x-name" name="name" maxlength="80" placeholder="Press inclinado en Smith" data-focus value="' + esc(ex ? ex.name : '') + '">') +
      field('Grupo muscular', 'x-group', '<select id="x-group" name="group">' + opts + '</select>'),
    onCancel: onCancel,
    onSave: (f) => {
      const name = f.elements.name.value.trim();
      if (!name) { f.elements.name.focus(); return false; }
      const data = { name: name, group: f.elements.group.value };
      let target = ex;
      if (ex) Object.assign(ex, data);
      else { target = Object.assign({ id: uid() }, data); getState().exercises.push(target); }
      save();
      render();
      if (onDone) onDone(target);
    },
    onDelete: ex ? () => {
      const s = getState();
      removeById(s.exercises, ex.id);
      s.routines.forEach((r) => { r.items = r.items.filter((i) => i.exId !== ex.id); });
      save();
      render();
    } : null,
    deleteLabel: 'Eliminar ejercicio'
  });
}

function exerciseHistory(exId) {
  const out = [];
  getState().sessions.forEach((s) => {
    s.entries.forEach((e) => {
      if (e.exId === exId && e.sets.length) out.push({ date: s.date, startedAt: s.startedAt, sets: e.sets, score: bestScore(e.sets) });
    });
  });
  return out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.startedAt - b.startedAt));
}

function exerciseInfo(exId) {
  const ex = findExercise(exId);
  const name = ex ? ex.name : exerciseName(exId);
  const hist = exerciseHistory(exId);
  let stats = '<div class="empty">Aún no hay registros de este ejercicio.</div>';
  if (hist.length) {
    let maxKg = 0;
    let best1 = 0;
    hist.forEach((h) => h.sets.forEach((x) => { maxKg = Math.max(maxKg, x.kg); best1 = Math.max(best1, setScore(x)); }));
    const pts = hist.map((h) => ({ x: h.startedAt || parseKey(h.date).getTime(), y: h.score }));
    const last = hist.slice(-6).reverse().map((h) =>
      '<div class="row slim"><div class="grow"><div class="txt">' + esc(shortDate(h.date)) + '</div><div class="pill">' +
      h.sets.map((x) => (x.kg ? fmt(x.kg, 2) + '×' : '') + x.reps).join('  ·  ') + '</div></div></div>').join('');
    stats = '<div class="tiles"><div class="tile"><b>' + (maxKg ? fmt(maxKg, 2) + ' kg' : '—') + '</b><span>Peso máximo</span></div>' +
      '<div class="tile"><b>' + (maxKg ? fmt(best1, 1) + ' kg' : fmt(best1, 0)) + '</b><span>' + (maxKg ? '1RM estimado' : 'Máx. reps') + '</span></div>' +
      '<div class="tile"><b>' + hist.length + '</b><span>Sesiones</span></div></div>' +
      '<h3 class="mt">Progreso</h3>' + lineChart(pts, { unit: maxKg ? ' kg' : '', decimals: 1, label: 'Progreso de ' + name }) +
      '<h3 class="mt">Últimas sesiones</h3>' + last;
  }
  openSheet({
    title: name,
    saveLabel: null,
    cancelLabel: 'Cerrar',
    html: '<p class="hint">' + esc(ex ? ex.group : 'Ejercicio eliminado') + '</p>' + stats +
      (isCustomExercise(exId) ? '<button type="button" class="btn ghost block mt" data-action="gym:ex-edit" data-id="' + esc(exId) + '">' + icon('edit', 16) + ' Editar ejercicio</button>' : '')
  });
}

/* ---------- Rutinas ---------- */

let draft = null;

function renderRutinas() {
  const s = getState();
  const cards = s.routines.map((r) =>
    '<div class="card routine-card"><div class="rc-main tappable" data-action="gym:routine-edit" data-id="' + esc(r.id) + '" role="button" tabindex="0">' +
    '<div class="gt-title">' + esc(r.name) + '</div><div class="gt-sub">' + esc(daysLabel(r.days)) + ' · ' + r.items.length + ' ejercicios</div>' +
    '<div class="rc-list">' + esc(r.items.slice(0, 4).map((i) => exerciseName(i.exId)).join(', ') + (r.items.length > 4 ? '…' : '')) + '</div></div>' +
    '<button type="button" class="btn sm" data-action="gym:start" data-id="' + esc(r.id) + '" aria-label="Empezar ' + esc(r.name) + '">' + icon('play', 14) + '</button></div>').join('');
  const tpls = TEMPLATES.map((t) =>
    '<div class="row"><div class="grow"><div class="txt">' + esc(t.name) + '</div><div class="pill">' + esc(t.desc) + '</div></div>' +
    '<button type="button" class="btn ghost sm" data-action="gym:tpl" data-key="' + t.key + '">Añadir</button></div>').join('');

  const lib = MUSCLE_GROUPS.map((g) => {
    const items = allExercises().filter((e) => e.group === g).sort((a, b) => a.name.localeCompare(b.name, 'es'));
    if (!items.length) return '';
    const open = !!ui.openGroups[g];
    return '<div class="lib-group"><button type="button" class="lib-head" data-action="gym:group" data-g="' + esc(g) + '" aria-expanded="' + open + '"><span>' + esc(g) + ' <em>' + items.length + '</em></span><span class="chev' + (open ? ' open' : '') + '">' + icon('chevron', 18) + '</span></button>' +
      (open ? items.map((e) => '<button type="button" class="lib-row" data-action="gym:ex-info" data-id="' + esc(e.id) + '"><span>' + esc(e.name) + '</span>' + (isCustomExercise(e.id) ? '<small>Mío</small>' : '') + '</button>').join('') : '') + '</div>';
  }).join('');

  return (cards || '<div class="card empty-state"><div class="big">📋</div><p>Aún no tienes rutinas. Crea una o parte de una plantilla.</p></div>') +
    '<button type="button" class="btn block" data-action="gym:routine-new">' + icon('plus', 16) + ' Nueva rutina</button>' +
    '<div class="card"><h3>Plantillas</h3>' + tpls + '</div>' +
    '<div class="card"><div class="card-head"><h3>Biblioteca de ejercicios</h3><button type="button" class="link" data-action="gym:ex-new">' + icon('plus', 16) + ' Nuevo</button></div>' + lib + '</div>';
}

function captureDraft() {
  const f = sheetForm();
  if (!draft || !f.elements.name) return;
  draft.name = f.elements.name.value;
  draft.days = Array.prototype.map.call(f.querySelectorAll('input[name=day]:checked'), (i) => Number(i.value));
  const sets = f.querySelectorAll('input[name=sets]');
  const reps = f.querySelectorAll('input[name=reps]');
  draft.items.forEach((it, i) => {
    const sv = parseInt(sets[i] && sets[i].value, 10);
    const rv = parseInt(reps[i] && reps[i].value, 10);
    if (isFinite(sv)) it.sets = clamp(sv, 1, 20);
    if (isFinite(rv)) it.reps = clamp(rv, 1, 100);
  });
}

function routineSheet() {
  const d = draft;
  const dayChips = WEEKDAY_ORDER.map((n) =>
    '<label class="chip"><input type="checkbox" name="day" value="' + n + '"' + (d.days.indexOf(n) >= 0 ? ' checked' : '') + '><span>' + WEEKDAY_LETTERS[n] + '</span></label>').join('');
  const items = d.items.length
    ? d.items.map((it, i) =>
      '<div class="r-item"><div class="r-name">' + esc(exerciseName(it.exId)) + '</div>' +
      '<div class="r-nums"><input type="text" inputmode="numeric" name="sets" value="' + it.sets + '" aria-label="Series"><span>×</span><input type="text" inputmode="numeric" name="reps" value="' + it.reps + '" aria-label="Repeticiones"></div>' +
      '<div class="r-btns"><button type="button" class="icon-btn" data-action="gym:r-up" data-i="' + i + '" aria-label="Subir"' + (i === 0 ? ' disabled' : '') + '>' + icon('up', 16) + '</button>' +
      '<button type="button" class="icon-btn" data-action="gym:r-down" data-i="' + i + '" aria-label="Bajar"' + (i === d.items.length - 1 ? ' disabled' : '') + '>' + icon('down', 16) + '</button>' +
      '<button type="button" class="icon-btn" data-action="gym:r-del" data-i="' + i + '" aria-label="Quitar">' + icon('x', 16) + '</button></div></div>').join('')
    : '<div class="empty">Sin ejercicios todavía.</div>';
  const existing = d.id ? findById(getState().routines, d.id) : null;
  openSheet({
    title: d.id ? 'Editar rutina' : 'Nueva rutina',
    html: field('Nombre', 'r-name', '<input type="text" id="r-name" name="name" maxlength="80" placeholder="Pecho y tríceps" data-focus value="' + esc(d.name) + '">') +
      '<div class="field"><label>Días de la semana</label><div class="chips">' + dayChips + '</div></div>' +
      '<div class="field"><label>Ejercicios (series × repeticiones)</label>' + items + '</div>' +
      '<button type="button" class="btn ghost block mb" data-action="gym:r-add">' + icon('plus', 16) + ' Añadir ejercicio</button>',
    onSave: (f) => {
      captureDraft();
      const name = draft.name.trim();
      if (!name) { f.elements.name.focus(); toast('Ponle un nombre a la rutina'); return false; }
      if (!draft.items.length) { toast('Añade al menos un ejercicio'); return false; }
      const data = { name: name, days: draft.days.slice().sort((a, b) => a - b), items: draft.items.map((i) => ({ exId: i.exId, sets: i.sets, reps: i.reps })) };
      if (existing) Object.assign(existing, data);
      else getState().routines.push(Object.assign({ id: uid() }, data));
      draft = null;
      save();
      render();
      refresh('hoy');
    },
    onCancel: () => { draft = null; },
    onDelete: existing ? () => { removeById(getState().routines, existing.id); draft = null; save(); render(); refresh('hoy'); } : null,
    deleteLabel: 'Eliminar rutina'
  });
}

/* ---------- Cuerpo ---------- */

function sortedWeights() {
  return getState().weights.slice().sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

function renderCuerpo() {
  const s = getState();
  const p = s.profile;
  const ws = sortedWeights();
  const w = currentWeight();
  let delta = '';
  if (ws.length >= 2) {
    const d = Math.round((ws[ws.length - 1].kg - ws[ws.length - 2].kg) * 10) / 10;
    delta = '<span class="delta ' + (d > 0 ? 'up' : d < 0 ? 'down' : '') + '">' + (d > 0 ? '+' : '') + fmt(d, 1) + ' kg</span>';
  }
  const chart = lineChart(pointsFromDates(ws.slice(-60), (x) => x.date, (x) => x.kg), { unit: ' kg', decimals: 1, label: 'Evolución del peso' });
  const recent = ws.slice(-5).reverse().map((x) =>
    '<div class="row slim tappable" data-action="gym:weight-edit" data-id="' + esc(x.id) + '" role="button" tabindex="0"><div class="grow txt">' + esc(shortDate(x.date)) + '</div><b>' + fmt(x.kg, 1) + ' kg</b></div>').join('');

  const weightCard = '<div class="card"><div class="card-head"><h3>Peso corporal</h3><button type="button" class="link" data-action="gym:weight-new">' + icon('plus', 16) + ' Registrar</button></div>' +
    (w ? '<div class="big-num">' + fmt(w, 1) + '<small> kg</small> ' + delta + '</div>' : '<div class="empty">Registra tu peso para calcular tus objetivos.</div>') +
    (ws.length ? chart + recent : '') + '</div>';

  const complete = w && p.height && p.age;
  const profileCard = '<div class="card"><div class="card-head"><h3>Tu perfil</h3><button type="button" class="link" data-action="gym:profile">' + icon('edit', 16) + ' Editar</button></div>' +
    (complete
      ? '<div class="kv"><span>Altura</span><b>' + fmt(p.height, 0) + ' cm</b></div><div class="kv"><span>Edad</span><b>' + p.age + ' años</b></div>' +
        '<div class="kv"><span>Sexo</span><b>' + (p.sex === 'f' ? 'Mujer' : 'Hombre') + '</b></div>' +
        '<div class="kv"><span>Actividad</span><b>' + esc(ACTIVITY_LEVELS.find((a) => a.value === p.activity).label.split(' (')[0]) + '</b></div>'
      : '<div class="empty">Añade tu altura, edad y peso para ver el IMC, las calorías y los macros.</div>' +
        '<button type="button" class="btn block" data-action="gym:profile">Completar perfil</button>') + '</div>';

  if (!complete) return weightCard + profileCard;

  const goal = GOALS.find((g) => g.value === p.goal) || GOALS[1];
  const data = Object.assign({}, p, { weight: w });
  const n = nutrition(data, goal);
  const b = bmi(w, p.height);
  const cat = bmiCategory(b);
  const pos = clamp(((b - 15) / 25) * 100, 2, 98);
  const kcalP = n.protein * 4, kcalC = n.carbs * 4, kcalF = n.fat * 9;
  const totalK = kcalP + kcalC + kcalF || 1;
  const macro = (label, g, kc, cls) =>
    '<div class="macro"><div class="m-top"><span>' + label + '</span><b>' + fmt(g, 0) + ' g</b></div><div class="pbar ' + cls + '"><span style="width:' + Math.round((kc / totalK) * 100) + '%"></span></div><small>' + Math.round((kc / totalK) * 100) + '% de las calorías</small></div>';
  const goalChips = GOALS.map((g) => '<button type="button" class="pchip' + (g.value === goal.value ? ' on' : '') + '" data-action="gym:goal" data-v="' + g.value + '">' + g.label + '</button>').join('');

  const results =
    '<div class="card"><h3>IMC</h3><div class="big-num">' + fmt(b, 1) + ' <span class="tone ' + cat.tone + '">' + cat.label + '</span></div>' +
    '<div class="bmi-bar"><i style="left:' + pos.toFixed(1) + '%"></i></div><div class="bmi-scale"><span>15</span><span>18,5</span><span>25</span><span>30</span><span>40</span></div>' +
    '<p class="hint">El IMC no distingue músculo de grasa: si entrenas fuerza, tómalo solo como referencia.</p></div>' +
    '<div class="card"><h3>Calorías y macros</h3><div class="chips wrap mb">' + goalChips + '</div>' +
    '<div class="kcal"><b>' + fmt(Math.round(n.kcal / 10) * 10, 0) + '</b><span>kcal al día</span></div>' +
    '<div class="kv"><span>Metabolismo basal</span><b>' + fmt(Math.round(n.bmr), 0) + ' kcal</b></div>' +
    '<div class="kv"><span>Gasto diario estimado</span><b>' + fmt(Math.round(n.tdee), 0) + ' kcal</b></div>' +
    macro('Proteína', n.protein, kcalP, 'm-p') + macro('Carbohidratos', n.carbs, kcalC, 'm-c') + macro('Grasas', n.fat, kcalF, 'm-f') + '</div>' +
    '<div class="card"><h3>Hidratación y creatina</h3>' +
    '<div class="kv"><span>Agua recomendada</span><b>' + fmt(n.waterL, 1) + ' L ≈ ' + n.glasses + ' vasos</b></div>' +
    '<div class="kv"><span>Creatina (mantenimiento)</span><b>' + fmt(n.creatine, 1) + ' g al día</b></div>' +
    '<p class="hint">Valores orientativos (fórmula Mifflin-St Jeor, 35 ml de agua por kg y 3-5 g de creatina). No sustituyen el consejo de un profesional sanitario.</p></div>';
  return weightCard + profileCard + results;
}

function weightSheet(entry) {
  openSheet({
    title: entry ? 'Editar peso' : 'Registrar peso',
    html: '<div class="cols">' +
      field('Peso (kg)', 'w-kg', '<input type="text" inputmode="decimal" id="w-kg" name="kg" placeholder="75,0" data-focus value="' + (entry ? esc(numStr(entry.kg)) : esc(numStr(currentWeight() || ''))) + '">') +
      field('Fecha', 'w-date', '<input type="date" id="w-date" name="date" value="' + esc(entry ? entry.date : todayKey()) + '">') + '</div>',
    onSave: (f) => {
      const kg = parseNum(f.elements.kg.value);
      const date = f.elements.date.value;
      if (!(kg >= 20 && kg <= 400)) { f.elements.kg.focus(); toast('Introduce un peso válido'); return false; }
      if (!date) { f.elements.date.focus(); return false; }
      const data = { kg: Math.round(kg * 10) / 10, date: date };
      if (entry) Object.assign(entry, data);
      else getState().weights.push(Object.assign({ id: uid() }, data));
      const latest = sortedWeights().pop();
      getState().profile.weight = latest.kg;
      save();
      render();
    },
    onDelete: entry ? () => {
      removeById(getState().weights, entry.id);
      const latest = sortedWeights().pop();
      if (latest) getState().profile.weight = latest.kg;
      save();
      render();
    } : null
  });
}

function profileSheet() {
  const p = getState().profile;
  const acts = ACTIVITY_LEVELS.map((a) => '<option value="' + a.value + '"' + (a.value === p.activity ? ' selected' : '') + '>' + esc(a.label) + '</option>').join('');
  const goals = GOALS.map((g) => '<option value="' + g.value + '"' + (g.value === p.goal ? ' selected' : '') + '>' + g.label + '</option>').join('');
  openSheet({
    title: 'Tu perfil',
    html: '<div class="cols">' +
      field('Peso (kg)', 'p-w', '<input type="text" inputmode="decimal" id="p-w" name="weight" data-focus value="' + esc(numStr(currentWeight() || '')) + '">') +
      field('Altura (cm)', 'p-h', '<input type="text" inputmode="numeric" id="p-h" name="height" value="' + esc(numStr(p.height || '')) + '">') + '</div>' +
      '<div class="cols">' +
      field('Edad', 'p-a', '<input type="text" inputmode="numeric" id="p-a" name="age" value="' + esc(numStr(p.age || '')) + '">') +
      field('Sexo', 'p-s', '<select id="p-s" name="sex"><option value="m"' + (p.sex === 'm' ? ' selected' : '') + '>Hombre</option><option value="f"' + (p.sex === 'f' ? ' selected' : '') + '>Mujer</option></select>') + '</div>' +
      field('Nivel de actividad', 'p-act', '<select id="p-act" name="activity">' + acts + '</select>') +
      field('Objetivo', 'p-g', '<select id="p-g" name="goal">' + goals + '</select>'),
    onSave: (f) => {
      const weight = parseNum(f.elements.weight.value);
      const height = parseNum(f.elements.height.value);
      const age = parseNum(f.elements.age.value);
      if (!(weight >= 20 && weight <= 400)) { f.elements.weight.focus(); toast('Introduce un peso válido'); return false; }
      if (!(height >= 100 && height <= 250)) { f.elements.height.focus(); toast('Introduce una altura válida (cm)'); return false; }
      if (!(age >= 10 && age <= 100)) { f.elements.age.focus(); toast('Introduce una edad válida'); return false; }
      const s = getState();
      const wr = Math.round(weight * 10) / 10;
      if (currentWeight() !== wr) {
        const today = todayKey();
        const same = s.weights.find((x) => x.date === today);
        if (same) same.kg = wr; else s.weights.push({ id: uid(), date: today, kg: wr });
      }
      s.profile = {
        weight: wr,
        height: Math.round(height),
        age: Math.round(age),
        sex: f.elements.sex.value === 'f' ? 'f' : 'm',
        activity: Number(f.elements.activity.value),
        goal: f.elements.goal.value
      };
      save();
      render();
    }
  });
}

/* ---------- Calcular ---------- */

const PLATE_COLORS = { 25: ['#e5484d', '#fff'], 20: ['#3b82f6', '#fff'], 15: ['#eab308', '#222'], 10: ['#22c55e', '#fff'], 5: ['#e5e7eb', '#222'], 2.5: ['#4b5563', '#fff'], 1.25: ['#9ca3af', '#222'] };

function rmHtml() {
  const kg = parseNum(ui.rm.kg);
  const reps = parseNum(ui.rm.reps);
  if (!(kg > 0) || !(reps >= 1) || reps > 30) return '<p class="hint">Introduce el peso y las repeticiones de una serie al fallo (hasta 30).</p>';
  const e = epley(kg, reps);
  const b = brzycki(kg, reps);
  const avg = b ? (e + b) / 2 : e;
  const rows = percentTable(avg).map((r) =>
    '<tr><td>' + r.pct + '%</td><td>' + fmt(r.kg, 1) + ' kg</td><td>≈ ' + r.reps + (r.reps === 1 ? ' rep' : ' reps') + '</td></tr>').join('');
  return '<div class="kcal"><b>' + fmt(avg, 1) + '</b><span>kg · 1RM estimado</span></div>' +
    '<div class="kv"><span>Epley</span><b>' + fmt(e, 1) + ' kg</b></div><div class="kv"><span>Brzycki</span><b>' + (b ? fmt(b, 1) + ' kg' : '—') + '</b></div>' +
    '<table class="ptable"><thead><tr><th>% 1RM</th><th>Peso</th><th>Reps</th></tr></thead><tbody>' + rows + '</tbody></table>';
}

function platesHtml() {
  const target = parseNum(ui.plate.target);
  if (!(target > 0)) return '<p class="hint">Introduce el peso total que quieres montar en la barra.</p>';
  const r = platesPerSide(target, Number(ui.plate.bar));
  if (!r) return '';
  if (r.error) return '<p class="hint warn">' + esc(r.error) + '</p>';
  const chips = r.perSide.length
    ? r.perSide.map((x) => {
      const c = PLATE_COLORS[x.plate] || ['#999', '#fff'];
      return '<span class="plate" style="background:' + c[0] + ';color:' + c[1] + '">' + fmt(x.plate, 2) + ' kg<b>×' + x.count + '</b></span>';
    }).join('')
    : '<span class="muted">Solo la barra</span>';
  return '<div class="sub-label">Por cada lado</div><div class="plates">' + chips + '</div>' +
    (r.missing > 0.001
      ? '<p class="hint warn">Con estos discos puedes llegar a ' + fmt(r.achievable, 2) + ' kg (faltan ' + fmt(r.missing, 2) + ' kg).</p>'
      : '<p class="hint">Total: ' + fmt(r.achievable, 2) + ' kg con barra de ' + ui.plate.bar + ' kg.</p>');
}

function renderCalc() {
  const bars = [20, 15, 10].map((b) => '<option value="' + b + '"' + (Number(ui.plate.bar) === b ? ' selected' : '') + '>' + b + ' kg</option>').join('');
  return '<div class="card"><h3>1RM y porcentajes</h3>' +
    '<div class="cols" data-calc="rm">' +
    field('Peso (kg)', 'rm-kg', '<input type="text" inputmode="decimal" id="rm-kg" name="rmkg" placeholder="80" value="' + esc(ui.rm.kg) + '">') +
    field('Repeticiones', 'rm-reps', '<input type="text" inputmode="numeric" id="rm-reps" name="rmreps" placeholder="8" value="' + esc(ui.rm.reps) + '">') + '</div>' +
    '<div id="rm-out">' + rmHtml() + '</div></div>' +
    '<div class="card"><h3>Calculadora de discos</h3>' +
    '<div class="cols" data-calc="pl">' +
    field('Peso total (kg)', 'pl-target', '<input type="text" inputmode="decimal" id="pl-target" name="pltarget" placeholder="100" value="' + esc(ui.plate.target) + '">') +
    field('Barra', 'pl-bar', '<select id="pl-bar" name="plbar">' + bars + '</select>') + '</div>' +
    '<div id="pl-out">' + platesHtml() + '</div></div>';
}

function onInput(e) {
  const t = e.target;
  if (t.matches && t.matches('input.set-input')) {
    const a = getState().active;
    if (!a) return;
    const set = a.entries[Number(t.getAttribute('data-ei'))] && a.entries[Number(t.getAttribute('data-ei'))].sets[Number(t.getAttribute('data-si'))];
    if (!set) return;
    const v = parseNum(t.value);
    const f = t.getAttribute('data-f');
    set[f] = t.value.trim() === '' || !isFinite(v) || v < 0 ? '' : f === 'reps' ? Math.round(v) : v;
    save();
    return;
  }
  const calc = t.closest && t.closest('[data-calc]');
  if (!calc) return;
  if (calc.getAttribute('data-calc') === 'rm') {
    ui.rm.kg = document.getElementById('rm-kg').value;
    ui.rm.reps = document.getElementById('rm-reps').value;
    document.getElementById('rm-out').innerHTML = rmHtml();
  } else {
    ui.plate.target = document.getElementById('pl-target').value;
    ui.plate.bar = document.getElementById('pl-bar').value;
    document.getElementById('pl-out').innerHTML = platesHtml();
  }
}

/* ---------- Acciones ---------- */

function activeEntry(el) {
  const a = getState().active;
  return a ? a.entries[Number(el.getAttribute('data-ei'))] : null;
}

export const actions = {
  'gym:seg': (el) => { ui.seg = el.getAttribute('data-seg'); render(); window.scrollTo(0, 0); },
  'gym:start': (el) => startWorkout(el.getAttribute('data-id') || ''),
  'gym:finish': () => finishWorkout(),
  'gym:cancel': () => discardWorkout(false),
  'gym:set-done': (el) => {
    const e = activeEntry(el);
    const set = e && e.sets[Number(el.getAttribute('data-si'))];
    if (!set) return;
    if (!set.done && !(Number(set.reps) > 0)) { toast('Indica las repeticiones de la serie'); return; }
    set.done = !set.done;
    save();
    render();
    if (set.done) { unlockAudio(); haptic(15); startRest(); } else { ui.rest = null; updateRest(); }
  },
  'gym:add-set': (el) => {
    const e = activeEntry(el);
    if (!e) return;
    const last = e.sets[e.sets.length - 1];
    e.sets.push({ kg: last ? last.kg : '', reps: last ? last.reps : '', done: false });
    save();
    render();
  },
  'gym:del-set': (el) => {
    const e = activeEntry(el);
    if (e && e.sets.length) { e.sets.pop(); save(); render(); }
  },
  'gym:remove-ex': (el) => {
    const a = getState().active;
    const i = Number(el.getAttribute('data-ei'));
    if (a && a.entries[i] && confirm('¿Quitar este ejercicio del entreno?')) { a.entries.splice(i, 1); save(); render(); }
  },
  'gym:add-ex': () => {
    pickerSheet((id) => {
      const a = getState().active;
      if (!a) return;
      a.entries.push(buildEntry(id, 3, ''));
      save();
      render();
    });
  },
  'gym:rest-set': (el) => { getState().restSeconds = Number(el.getAttribute('data-s')); save(); render(); },
  'gym:rest-add': (el) => {
    if (!ui.rest) return;
    ui.rest.end += Number(el.getAttribute('data-s')) * 1000;
    ui.rest.total = Math.max(5, ui.rest.total + Number(el.getAttribute('data-s')));
    ui.rest.finished = false;
    updateRest();
  },
  'gym:rest-skip': () => { ui.rest = null; updateRest(); },
  'gym:session': (el) => { const x = findById(getState().sessions, el.getAttribute('data-id')); if (x) sessionSheet(x); },
  'gym:ex-info': (el) => exerciseInfo(el.getAttribute('data-id')),
  'gym:ex-new': () => exerciseSheet(null, null, null),
  'gym:ex-edit': (el) => {
    const ex = findById(getState().exercises, el.getAttribute('data-id'));
    if (ex) exerciseSheet(ex, null, null);
  },
  'gym:group': (el) => { const g = el.getAttribute('data-g'); ui.openGroups[g] = !ui.openGroups[g]; render(); },
  'gym:pick': (el) => {
    const cb = pickCb;
    const id = el.getAttribute('data-id');
    closeSheet(false);
    if (cb) cb(id);
  },
  'gym:pick-new': () => {
    const cb = pickCb;
    const cancel = pickCancel;
    exerciseSheet(null, (ex) => { if (cb) cb(ex.id); }, () => pickerSheet(cb, cancel));
  },
  'gym:tpl': (el) => {
    const n = applyTemplate(el.getAttribute('data-key'));
    save();
    render();
    refresh('hoy');
    toast(n + (n === 1 ? ' rutina añadida' : ' rutinas añadidas'));
  },
  'gym:routine-new': () => {
    draft = { id: '', name: '', days: [], items: [] };
    routineSheet();
  },
  'gym:routine-edit': (el) => {
    const r = findById(getState().routines, el.getAttribute('data-id'));
    if (!r) return;
    draft = { id: r.id, name: r.name, days: r.days.slice(), items: r.items.map((i) => ({ exId: i.exId, sets: i.sets, reps: i.reps })) };
    routineSheet();
  },
  'gym:r-add': () => {
    captureDraft();
    const keep = draft;
    pickerSheet((id) => { draft = keep; draft.items.push({ exId: id, sets: 3, reps: 10 }); routineSheet(); }, () => { draft = keep; routineSheet(); });
  },
  'gym:r-up': (el) => { captureDraft(); const i = Number(el.getAttribute('data-i')); if (i > 0) { const t = draft.items[i]; draft.items[i] = draft.items[i - 1]; draft.items[i - 1] = t; } routineSheet(); },
  'gym:r-down': (el) => { captureDraft(); const i = Number(el.getAttribute('data-i')); if (i < draft.items.length - 1) { const t = draft.items[i]; draft.items[i] = draft.items[i + 1]; draft.items[i + 1] = t; } routineSheet(); },
  'gym:r-del': (el) => { captureDraft(); draft.items.splice(Number(el.getAttribute('data-i')), 1); routineSheet(); },
  'gym:weight-new': () => weightSheet(null),
  'gym:weight-edit': (el) => { const w = findById(getState().weights, el.getAttribute('data-id')); if (w) weightSheet(w); },
  'gym:profile': () => profileSheet(),
  'gym:goal': (el) => { getState().profile.goal = el.getAttribute('data-v'); save(); render(); }
};

/* ---------- Inicio ---------- */

export function init() {
  root().addEventListener('input', onInput);
  sheetForm().addEventListener('input', (e) => {
    if (e.target.id !== 'pick-q') return;
    const q = e.target.value.trim().toLowerCase();
    Array.prototype.forEach.call(sheetForm().querySelectorAll('.pick-row'), (b) => {
      b.hidden = q && b.getAttribute('data-name').indexOf(q) < 0;
    });
    Array.prototype.forEach.call(sheetForm().querySelectorAll('[data-group]'), (g) => {
      g.hidden = !g.querySelector('.pick-row:not([hidden])');
    });
  });
  setInterval(tick, 500);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) { requestWake(); tick(); }
  });
  requestWake();
}
