import {
  esc, uid, dateKey, todayKey, addDays, longDate, fmt, fmtMinutes
} from './util.js';
import {
  getState, save, WEEKDAY_LETTERS, WEEKDAY_ORDER, WEEKDAY_NAMES, EMOJIS, HABIT_PRESETS, HABIT_PACK,
  addHabitFromPreset, isHabitDone, habitCount, isScheduled
} from './data.js';
import { habitStreak, sessionVolume } from './calc.js';
import {
  icon, openSheet, field, findById, removeById, refresh, confetti, haptic, toast, sheetForm
} from './ui.js';

const root = () => document.getElementById('view-hoy');
let prevPct = null;
let popId = '';

function visibleTasks() {
  const today = todayKey();
  return getState().tasks.filter((t) => !t.done || t.doneOn === today);
}

function todaysHabits() {
  const now = new Date();
  return getState().habits.filter((h) => isScheduled(h, now));
}

function progress() {
  const today = todayKey();
  const tasks = visibleTasks();
  const habits = todaysHabits();
  let sum = 0;
  let done = 0;
  tasks.forEach((t) => { if (t.done) { sum += 1; done += 1; } });
  habits.forEach((h) => {
    const c = habitCount(h, today);
    sum += Math.min(1, c / h.target);
    if (c >= h.target) done += 1;
  });
  const total = tasks.length + habits.length;
  return { total: total, done: done, pct: total ? Math.round((sum / total) * 100) : 0 };
}

function statusLine(p) {
  if (!p.total) return 'Añade tareas o rutinas para empezar';
  if (p.pct === 100) return '¡Día completado!';
  if (p.pct >= 70) return 'Ya casi lo tienes';
  if (p.pct >= 30) return 'Vas muy bien';
  if (p.pct > 0) return 'Buen comienzo';
  return 'Empieza por lo más fácil';
}

function gymCard() {
  const s = getState();
  const now = new Date();
  const today = todayKey();
  if (s.active) {
    return '<div class="card gym-today live"><div class="gt-icon">' + icon('dumbbell', 24) + '</div>' +
      '<div class="grow"><div class="gt-kicker">Entreno en curso</div><div class="gt-title">' + esc(s.active.name) + '</div></div>' +
      '<button type="button" class="btn sm" data-action="app:go" data-tab="gym">Continuar</button></div>';
  }
  const doneToday = s.sessions.filter((x) => x.date === today);
  if (doneToday.length) {
    const vol = doneToday.reduce((n, x) => n + sessionVolume(x), 0);
    return '<div class="card gym-today done"><div class="gt-icon">' + icon('trophy', 24) + '</div>' +
      '<div class="grow"><div class="gt-kicker">Entreno completado</div><div class="gt-title">' + esc(doneToday[0].name) + '</div>' +
      '<div class="gt-sub">' + fmt(vol, 0) + ' kg de volumen</div></div></div>';
  }
  const routines = s.routines.filter((r) => r.days.indexOf(now.getDay()) >= 0);
  if (!routines.length) return '';
  return routines.map((r) => {
    const sets = r.items.reduce((n, i) => n + i.sets, 0);
    return '<div class="card gym-today"><div class="gt-icon">' + icon('dumbbell', 24) + '</div>' +
      '<div class="grow"><div class="gt-kicker">Hoy toca</div><div class="gt-title">' + esc(r.name) + '</div>' +
      '<div class="gt-sub">' + r.items.length + ' ejercicios · ' + sets + ' series</div></div>' +
      '<button type="button" class="btn sm" data-action="gym:start" data-id="' + esc(r.id) + '">Empezar</button></div>';
  }).join('');
}

function dotsHtml(h) {
  let out = '';
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = addDays(now, -i);
    const on = isHabitDone(h, dateKey(d));
    const off = !isScheduled(h, d);
    out += '<div class="dot' + (on ? ' on' : '') + (off ? ' off' : '') + (i === 0 ? ' today' : '') + '"><i></i>' + WEEKDAY_LETTERS[d.getDay()] + '</div>';
  }
  return out;
}

function habitRow(h, active) {
  const today = todayKey();
  const c = habitCount(h, today);
  const done = c >= h.target;
  const counter = h.target > 1;
  const streak = habitStreak(h, (hb, k) => isHabitDone(hb, k), isScheduled, new Date());
  const pct = Math.min(100, Math.round((c / h.target) * 100));
  const streakHtml = streak > 0
    ? '<span class="streak">' + icon('flame', 14) + streak + (streak === 1 ? ' día' : ' días') + '</span>'
    : '<span class="muted">Sin racha</span>';
  let meta = streakHtml;
  if (counter) meta = '<span class="count-txt">' + c + '/' + h.target + (h.unit ? ' ' + esc(h.unit) : '') + '</span>' + streakHtml;
  if (!active) meta = '<span>Hoy descansa</span>' + streakHtml;

  let control = '';
  if (active && counter) {
    control = '<div class="stepper"><button type="button" class="step" data-action="hoy:dec" data-id="' + esc(h.id) + '" aria-label="Quitar uno">' + icon('minus', 18) + '</button>' +
      '<button type="button" class="step plus' + (done ? ' full' : '') + '" data-action="hoy:inc" data-id="' + esc(h.id) + '" aria-label="Añadir uno">' + icon('plus', 18) + '</button></div>';
  } else if (active && h.auto === 'gym') {
    control = '<button type="button" class="check' + (done ? ' on' : '') + '" data-action="' + (done ? 'hoy:noop' : 'app:go') + '" data-tab="gym" data-id="' + esc(h.id) + '" aria-label="Se marca al entrenar">' + icon('check', 16) + '</button>';
  } else if (active) {
    control = '<button type="button" class="check' + (done ? ' on' : '') + '" data-action="hoy:toggle-habit" data-id="' + esc(h.id) + '" aria-label="Marcar ' + esc(h.name) + '" aria-pressed="' + done + '">' + icon('check', 16) + '</button>';
  }

  return '<div class="habit' + (active ? '' : ' rest') + (done && active ? ' is-done' : '') + '" data-hid="' + esc(h.id) + '">' +
    '<div class="h-emoji">' + esc(h.emoji) + '</div>' +
    '<div class="grow"><div class="h-name">' + esc(h.name) + '</div>' +
    '<div class="h-meta">' + meta + (h.auto === 'gym' && active && !done ? '<span>Se marca al entrenar</span>' : '') + '</div>' +
    (counter && active ? '<div class="pbar"><span style="width:' + pct + '%"></span></div>' : '') +
    (active ? '<div class="dots">' + dotsHtml(h) + '</div>' : '') +
    '</div>' + control +
    '<button type="button" class="icon-btn" data-action="hoy:edit-habit" data-id="' + esc(h.id) + '" aria-label="Editar ' + esc(h.name) + '">' + icon('edit', 18) + '</button>' +
    '</div>';
}

function weekCard() {
  const s = getState();
  const now = new Date();
  const days = [];
  let possible = 0;
  let achieved = 0;
  for (let i = 6; i >= 0; i--) {
    const d = addDays(now, -i);
    const k = dateKey(d);
    let sched = 0;
    let ok = 0;
    s.habits.forEach((h) => {
      if (!isScheduled(h, d)) return;
      sched += 1;
      if (habitCount(h, k) >= h.target) ok += 1;
    });
    possible += sched;
    achieved += ok;
    days.push({ d: d, pct: sched ? Math.round((ok / sched) * 100) : 0, sched: sched, today: i === 0 });
  }
  const from = dateKey(addDays(now, -6));
  const sessions = s.sessions.filter((x) => x.date >= from);
  const tasks = s.tasks.filter((t) => t.done && t.doneOn >= from).length;
  const minutes = sessions.reduce((n, x) => n + x.durationMin, 0);
  const compliance = possible ? Math.round((achieved / possible) * 100) : 0;
  const bars = days.map((x) =>
    '<div class="wbar' + (x.today ? ' today' : '') + '"><div class="wtrack"><span style="height:' + Math.max(x.sched ? 6 : 0, x.pct) + '%"></span></div>' +
    '<em>' + WEEKDAY_LETTERS[x.d.getDay()] + '</em></div>').join('');
  return '<div class="card"><h3>Últimos 7 días</h3>' +
    '<div class="tiles">' +
    '<div class="tile"><b>' + compliance + '%</b><span>Rutina cumplida</span></div>' +
    '<div class="tile"><b>' + sessions.length + '</b><span>Entrenos' + (minutes ? ' · ' + fmtMinutes(minutes) : '') + '</span></div>' +
    '<div class="tile"><b>' + tasks + '</b><span>Tareas hechas</span></div></div>' +
    '<div class="wbars" role="img" aria-label="Cumplimiento diario de la rutina">' + bars + '</div></div>';
}

export function render() {
  const s = getState();
  const p = progress();
  const R = 36;
  const C = 2 * Math.PI * R;
  const tasks = visibleTasks();
  const now = new Date();
  const habitsToday = s.habits.filter((h) => isScheduled(h, now));
  const habitsRest = s.habits.filter((h) => !isScheduled(h, now));

  const taskRows = tasks.length
    ? tasks.map((t) =>
      '<div class="row' + (t.done ? ' done' : '') + '">' +
      '<button type="button" class="check' + (t.done ? ' on' : '') + '" data-action="hoy:toggle-task" data-id="' + esc(t.id) + '" aria-label="Marcar tarea" aria-pressed="' + t.done + '">' + icon('check', 16) + '</button>' +
      '<div class="grow txt">' + esc(t.text) + '</div>' +
      '<button type="button" class="icon-btn" data-action="hoy:delete-task" data-id="' + esc(t.id) + '" aria-label="Borrar tarea">' + icon('x', 18) + '</button></div>').join('')
    : '<div class="empty">Sin tareas pendientes.</div>';

  let routineHtml;
  if (s.habits.length) {
    routineHtml = habitsToday.map((h) => habitRow(h, true)).join('') +
      (habitsRest.length ? '<div class="sub-label">Hoy descansan</div>' + habitsRest.map((h) => habitRow(h, false)).join('') : '');
  } else {
    routineHtml = '<div class="empty-state"><div class="big">💪</div><p>Crea tu rutina diaria: creatina, agua, gym, proteína…</p>' +
      '<button type="button" class="btn" data-action="hoy:pack">Añadir rutina recomendada</button></div>';
  }

  const offset = prevPct == null ? C * (1 - p.pct / 100) : C * (1 - prevPct / 100);

  root().innerHTML =
    '<div class="hero">' +
    '<div class="grow"><h1>' + esc(greeting()) + '</h1><p class="sub">' + esc(longDate(now)) + '</p><p class="status">' + esc(statusLine(p)) + '</p></div>' +
    '<div class="ring" role="img" aria-label="Progreso del día: ' + p.pct + '%">' +
    '<svg viewBox="0 0 84 84"><circle class="track" cx="42" cy="42" r="' + R + '" fill="none" stroke-width="8"/>' +
    '<circle class="bar" id="ring-bar" cx="42" cy="42" r="' + R + '" fill="none" stroke-width="8" stroke-linecap="round" stroke-dasharray="' + C.toFixed(2) + '" stroke-dashoffset="' + offset.toFixed(2) + '"/></svg>' +
    '<div class="pct" id="ring-pct">' + (prevPct == null ? p.pct : prevPct) + '%</div></div></div>' +
    gymCard() +
    '<div class="card"><div class="card-head"><h3>Rutina diaria</h3><button type="button" class="link" data-action="hoy:new-habit">' + icon('plus', 16) + ' Nueva</button></div>' + routineHtml + '</div>' +
    '<div class="card"><h3>Tareas · ' + tasks.filter((t) => t.done).length + ' de ' + tasks.length + '</h3>' +
    '<form class="add-row" id="task-form" autocomplete="off">' +
    '<input type="text" id="task-input" placeholder="Nueva tarea" maxlength="300" aria-label="Nueva tarea" enterkeyhint="done">' +
    '<button type="submit" class="btn">Añadir</button></form>' + taskRows + '</div>' +
    weekCard();

  animateRing(p, C);
  if (popId) {
    const el = root().querySelector('[data-id="' + popId + '"].check, [data-hid="' + popId + '"] .step.plus');
    if (el) { el.classList.add('pop'); }
    popId = '';
  }
}

function animateRing(p, C) {
  const bar = document.getElementById('ring-bar');
  const label = document.getElementById('ring-pct');
  const from = prevPct == null ? p.pct : prevPct;
  const celebrate = prevPct != null && prevPct < 100 && p.pct === 100 && p.total > 0;
  prevPct = p.pct;
  if (from === p.pct) return;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => { if (bar) bar.style.strokeDashoffset = (C * (1 - p.pct / 100)).toFixed(2); });
  });
  const t0 = performance.now();
  (function tick(now) {
    const k = Math.min(1, (now - t0) / 500);
    if (label) label.textContent = Math.round(from + (p.pct - from) * k) + '%';
    if (k < 1) requestAnimationFrame(tick);
  })(t0);
  if (celebrate) { confetti(); haptic(30); }
}

function greeting() {
  const h = new Date().getHours();
  const word = h >= 6 && h < 13 ? 'Buenos días' : h >= 13 && h < 21 ? 'Buenas tardes' : 'Buenas noches';
  const n = getState().name;
  return n ? word + ', ' + n : word;
}

/* ---------- Hoja de hábito ---------- */

function habitSheet(habit) {
  const dayChips = WEEKDAY_ORDER.map((d) =>
    '<label class="chip"><input type="checkbox" name="day" value="' + d + '"' + (habit && habit.weekdays.indexOf(d) >= 0 ? ' checked' : '') + '><span title="' + WEEKDAY_NAMES[d] + '">' + WEEKDAY_LETTERS[d] + '</span></label>').join('');
  const presetChips = habit ? '' :
    '<div class="field"><label>Sugerencias</label><div class="chips wrap">' +
    HABIT_PRESETS.map((pr, i) => '<button type="button" class="pchip" data-action="hoy:preset" data-i="' + i + '">' + esc(pr.emoji) + ' ' + esc(pr.name) + '</button>').join('') +
    '</div></div>';
  const emojiChips = EMOJIS.map((e) => '<button type="button" class="emoji-pick" data-action="hoy:emoji" data-emoji="' + esc(e) + '" aria-label="Emoji ' + esc(e) + '">' + esc(e) + '</button>').join('');

  openSheet({
    title: habit ? 'Editar rutina' : 'Nueva rutina',
    html: presetChips +
      '<div class="cols c-emoji">' +
      field('Emoji', 'h-emoji', '<input type="text" id="h-emoji" name="emoji" maxlength="8" value="' + esc(habit ? habit.emoji : '✅') + '">') +
      field('Nombre', 'h-name', '<input type="text" id="h-name" name="name" maxlength="80" placeholder="Tomar creatina" data-focus value="' + esc(habit ? habit.name : '') + '">') +
      '</div><div class="chips wrap tight">' + emojiChips + '</div>' +
      '<div class="cols">' +
      field('Veces al día', 'h-target', '<input type="text" inputmode="numeric" id="h-target" name="target" value="' + (habit ? habit.target : 1) + '">') +
      field('Unidad', 'h-unit', '<input type="text" id="h-unit" name="unit" maxlength="20" placeholder="vasos" value="' + esc(habit ? habit.unit : '') + '">') +
      '</div><p class="hint">1 vez = casilla. Más de 1 = contador (por ejemplo 10 vasos de agua).</p>' +
      '<div class="field"><label>Días (sin marcar = todos)</label><div class="chips">' + dayChips + '</div></div>' +
      '<label class="switch"><input type="checkbox" name="auto"' + (habit && habit.auto === 'gym' ? ' checked' : '') + '><span>Marcar automáticamente al registrar un entreno</span></label>',
    onSave: (f) => {
      const name = f.elements.name.value.trim();
      const emoji = f.elements.emoji.value.trim() || '✅';
      let target = parseInt(f.elements.target.value, 10);
      if (!name) { f.elements.name.focus(); return false; }
      if (!isFinite(target) || target < 1) target = 1;
      target = Math.min(99, target);
      const weekdays = Array.prototype.map.call(f.querySelectorAll('input[name=day]:checked'), (i) => Number(i.value));
      const auto = f.elements.auto.checked ? 'gym' : '';
      const data = { name: name, emoji: emoji, target: auto ? 1 : target, unit: auto ? '' : f.elements.unit.value.trim(), weekdays: weekdays, auto: auto };
      if (habit) Object.assign(habit, data);
      else getState().habits.push(Object.assign({ id: uid(), days: [], counts: {} }, data));
      save();
      refresh('hoy');
    },
    onDelete: habit ? () => { removeById(getState().habits, habit.id); save(); refresh('hoy'); } : null,
    deleteLabel: 'Eliminar rutina'
  });
}

function setCount(h, n) {
  const key = todayKey();
  const c = Math.max(0, Math.min(999, n));
  if (c > 0) h.counts[key] = c; else delete h.counts[key];
  const i = h.days.indexOf(key);
  if (c >= h.target && i < 0) h.days.push(key);
  if (c < h.target && i >= 0) h.days.splice(i, 1);
}

/* ---------- Acciones ---------- */

export const actions = {
  'hoy:toggle-task': (el) => {
    const t = findById(getState().tasks, el.getAttribute('data-id'));
    if (!t) return;
    t.done = !t.done;
    t.doneOn = t.done ? todayKey() : '';
    popId = t.id;
    haptic(10);
    save();
    render();
  },
  'hoy:delete-task': (el) => {
    removeById(getState().tasks, el.getAttribute('data-id'));
    save();
    render();
  },
  'hoy:toggle-habit': (el) => {
    const h = findById(getState().habits, el.getAttribute('data-id'));
    if (!h) return;
    const key = todayKey();
    const i = h.days.indexOf(key);
    if (i >= 0) h.days.splice(i, 1); else h.days.push(key);
    popId = h.id;
    haptic(10);
    save();
    render();
  },
  'hoy:inc': (el) => {
    const h = findById(getState().habits, el.getAttribute('data-id'));
    if (!h) return;
    setCount(h, habitCount(h, todayKey()) + 1);
    popId = h.id;
    haptic(8);
    save();
    render();
  },
  'hoy:dec': (el) => {
    const h = findById(getState().habits, el.getAttribute('data-id'));
    if (!h) return;
    setCount(h, habitCount(h, todayKey()) - 1);
    save();
    render();
  },
  'hoy:noop': () => {},
  'hoy:new-habit': () => habitSheet(null),
  'hoy:edit-habit': (el) => {
    const h = findById(getState().habits, el.getAttribute('data-id'));
    if (h) habitSheet(h);
  },
  'hoy:pack': () => {
    const s = getState();
    HABIT_PACK.forEach((name) => {
      const preset = HABIT_PRESETS.find((p) => p.name === name);
      if (preset && !s.habits.some((h) => h.name === preset.name)) addHabitFromPreset(preset);
    });
    save();
    render();
    toast('Rutina recomendada añadida. Puedes editarla cuando quieras.');
  },
  'hoy:emoji': (el) => {
    sheetForm().elements.emoji.value = el.getAttribute('data-emoji');
  },
  'hoy:preset': (el) => {
    const pr = HABIT_PRESETS[Number(el.getAttribute('data-i'))];
    const f = sheetForm();
    if (!pr) return;
    f.elements.emoji.value = pr.emoji;
    f.elements.name.value = pr.name;
    f.elements.target.value = pr.target;
    f.elements.unit.value = pr.unit;
    f.elements.auto.checked = pr.auto === 'gym';
    Array.prototype.forEach.call(f.querySelectorAll('input[name=day]'), (i) => { i.checked = pr.weekdays.indexOf(Number(i.value)) >= 0; });
  }
};

export const forms = {
  'task-form': () => {
    const input = document.getElementById('task-input');
    const text = input.value.trim();
    if (!text) { input.focus(); return; }
    getState().tasks.push({ id: uid(), text: text, done: false, doneOn: '' });
    save();
    render();
    document.getElementById('task-input').focus();
  }
};
