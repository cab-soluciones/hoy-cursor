import { uid, isDateKey, slug } from './util.js';

export const STORAGE_KEY = 'hoy.v1';
export const AUTHOR = 'Javier Lorenzo';
export const VERSION = '3.0';

export const CATEGORIES = ['Comida', 'Compra', 'Transporte', 'Ocio', 'Casa', 'Salud', 'Otros'];
export const WEEKDAY_LETTERS = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
export const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
export const WEEKDAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
export const EMOJIS = ['💊', '💧', '🏋️', '🥩', '😴', '🧘', '🏃', '📖', '🌿', '🍽️'];

export const MUSCLE_GROUPS = ['Pecho', 'Espalda', 'Hombros', 'Bíceps', 'Tríceps', 'Piernas', 'Glúteos', 'Core', 'Otros'];

export const ACTIVITY_LEVELS = [
  { value: 1.2, label: 'Sedentario (poco o nada de ejercicio)' },
  { value: 1.375, label: 'Ligero (1-3 días por semana)' },
  { value: 1.55, label: 'Moderado (3-5 días por semana)' },
  { value: 1.725, label: 'Alto (6-7 días por semana)' },
  { value: 1.9, label: 'Muy alto (entreno doble o trabajo físico)' }
];

export const GOALS = [
  { value: 'cut', label: 'Definir', factor: 0.85, protein: 2.2 },
  { value: 'maintain', label: 'Mantener', factor: 1, protein: 1.8 },
  { value: 'bulk', label: 'Volumen', factor: 1.1, protein: 2 }
];

function ex(group, names) {
  return names.map((name) => ({ id: 'p-' + slug(name), name: name, group: group }));
}

export const PRESET_EXERCISES = [].concat(
  ex('Pecho', ['Press banca', 'Press banca inclinado', 'Press con mancuernas', 'Aperturas con mancuernas', 'Fondos en paralelas', 'Cruces en polea', 'Press de pecho en máquina']),
  ex('Espalda', ['Dominadas', 'Jalón al pecho', 'Remo con barra', 'Remo con mancuerna', 'Remo en polea baja', 'Peso muerto', 'Remo en máquina']),
  ex('Hombros', ['Press militar', 'Press con mancuernas sentado', 'Elevaciones laterales', 'Pájaros', 'Face pull', 'Encogimientos']),
  ex('Bíceps', ['Curl con barra', 'Curl con mancuernas', 'Curl martillo', 'Curl predicador']),
  ex('Tríceps', ['Extensión de tríceps en polea', 'Press francés', 'Fondos en banco', 'Extensión sobre la cabeza']),
  ex('Piernas', ['Sentadilla', 'Prensa de piernas', 'Zancadas', 'Peso muerto rumano', 'Extensión de cuádriceps', 'Curl femoral', 'Elevación de gemelos', 'Sentadilla búlgara']),
  ex('Glúteos', ['Hip thrust', 'Patada de glúteo en polea', 'Abducción en máquina']),
  ex('Core', ['Crunch abdominal', 'Elevación de piernas', 'Rueda abdominal', 'Crunch en polea', 'Giro ruso'])
);

const presetByName = {};
PRESET_EXERCISES.forEach((e) => { presetByName[e.name] = e; });

function tpl(name, days, rows) {
  return {
    name: name,
    days: days,
    items: rows.map((r) => ({ exId: presetByName[r[0]].id, sets: r[1], reps: r[2] }))
  };
}

export const TEMPLATES = [
  {
    key: 'ppl',
    name: 'Push / Pull / Legs',
    desc: '3 días: empuje, tirón y pierna',
    routines: [
      tpl('Push · Pecho, hombro y tríceps', [1], [['Press banca', 4, 8], ['Press banca inclinado', 3, 10], ['Press militar', 3, 10], ['Elevaciones laterales', 3, 15], ['Extensión de tríceps en polea', 3, 12]]),
      tpl('Pull · Espalda y bíceps', [3], [['Dominadas', 4, 8], ['Remo con barra', 4, 8], ['Jalón al pecho', 3, 10], ['Face pull', 3, 15], ['Curl con barra', 3, 10], ['Curl martillo', 3, 12]]),
      tpl('Legs · Pierna y core', [5], [['Sentadilla', 4, 8], ['Peso muerto rumano', 3, 10], ['Prensa de piernas', 3, 12], ['Curl femoral', 3, 12], ['Elevación de gemelos', 4, 15], ['Crunch abdominal', 3, 15]])
    ]
  },
  {
    key: 'fullbody',
    name: 'Full body',
    desc: '3 días: cuerpo completo',
    routines: [
      tpl('Full body A', [1], [['Sentadilla', 4, 8], ['Press banca', 4, 8], ['Remo con barra', 4, 8], ['Press militar', 3, 10], ['Curl con mancuernas', 2, 12]]),
      tpl('Full body B', [3], [['Peso muerto rumano', 4, 8], ['Press banca inclinado', 4, 10], ['Jalón al pecho', 4, 10], ['Zancadas', 3, 12], ['Extensión de tríceps en polea', 3, 12]]),
      tpl('Full body C', [5], [['Prensa de piernas', 4, 10], ['Press con mancuernas', 4, 10], ['Remo en polea baja', 4, 10], ['Elevaciones laterales', 3, 15], ['Crunch abdominal', 3, 15]])
    ]
  },
  {
    key: 'upperlower',
    name: 'Torso / Pierna',
    desc: '4 días: dos de torso y dos de pierna',
    routines: [
      tpl('Torso A', [1], [['Press banca', 4, 6], ['Remo con barra', 4, 6], ['Press militar', 3, 8], ['Jalón al pecho', 3, 10], ['Curl con barra', 2, 10], ['Press francés', 2, 10]]),
      tpl('Pierna A', [2], [['Sentadilla', 4, 6], ['Peso muerto rumano', 3, 8], ['Prensa de piernas', 3, 10], ['Curl femoral', 3, 12], ['Elevación de gemelos', 4, 12]]),
      tpl('Torso B', [4], [['Press banca inclinado', 4, 8], ['Remo con mancuerna', 4, 8], ['Elevaciones laterales', 4, 15], ['Dominadas', 3, 8], ['Curl martillo', 3, 12], ['Extensión sobre la cabeza', 3, 12]]),
      tpl('Pierna B', [5], [['Peso muerto', 3, 5], ['Sentadilla búlgara', 3, 10], ['Hip thrust', 3, 10], ['Extensión de cuádriceps', 3, 15], ['Elevación de gemelos', 4, 15]])
    ]
  }
];

export const HABIT_PRESETS = [
  { emoji: '💊', name: 'Tomar creatina', target: 1, unit: '', weekdays: [], auto: '' },
  { emoji: '💧', name: 'Beber agua', target: 10, unit: 'vasos', weekdays: [], auto: '' },
  { emoji: '🏋️', name: 'Ir al gym', target: 1, unit: '', weekdays: [1, 2, 3, 4, 5], auto: 'gym' },
  { emoji: '🥩', name: 'Llegar a mi proteína', target: 1, unit: '', weekdays: [], auto: '' },
  { emoji: '😴', name: 'Dormir 7-8 horas', target: 1, unit: '', weekdays: [], auto: '' },
  { emoji: '🌿', name: 'Tomar vitaminas', target: 1, unit: '', weekdays: [], auto: '' },
  { emoji: '🚶', name: 'Llegar a mis pasos', target: 1, unit: '', weekdays: [], auto: 'steps' },
  { emoji: '🧘', name: 'Estirar / movilidad', target: 1, unit: '', weekdays: [], auto: '' },
  { emoji: '🍽️', name: 'Comidas del plan', target: 4, unit: 'comidas', weekdays: [], auto: '' }
];

export const HABIT_PACK = ['Tomar creatina', 'Beber agua', 'Ir al gym', 'Llegar a mis pasos', 'Llegar a mi proteína', 'Dormir 7-8 horas'];

export const BLOCK_KINDS = [
  { value: 'work', label: 'Trabajo', emoji: '💼' },
  { value: 'class', label: 'Curso / clase', emoji: '🎓' },
  { value: 'other', label: 'Otro', emoji: '📍' }
];

export function defaultSchedule() {
  return [
    { id: 'b-work', name: 'Trabajo', emoji: '💼', kind: 'work', days: [1, 2, 3, 4, 5], start: '09:00', end: '14:00', km: 1.5, walkTo: true, walkBack: true },
    { id: 'b-course', name: 'Curso', emoji: '🎓', kind: 'class', days: [1, 2, 3, 4], start: '16:00', end: '20:00', km: 1.5, walkTo: true, walkBack: true }
  ];
}

/* ---------- Estado ---------- */

export function emptyState() {
  return {
    name: '',
    tasks: [],
    habits: [],
    expenses: [],
    notes: [],
    exercises: [],
    routines: [],
    sessions: [],
    weights: [],
    profile: { height: null, age: null, sex: 'm', activity: 1.55, goal: 'maintain', weight: null },
    restSeconds: 90,
    active: null,
    weeklyGoal: 4,
    schedule: defaultSchedule(),
    walk: { speed: 5, goal: 10000, configured: false },
    stepsLog: [],
    skips: []
  };
}

function str(v, max) {
  return typeof v === 'string' ? v.slice(0, max || 5000) : '';
}

function num(v, min, max, fallback) {
  const n = Number(v);
  if (v === '' || v == null || !isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function intList(v, min, max) {
  const out = [];
  (Array.isArray(v) ? v : []).forEach((x) => {
    const n = Number(x);
    if (Number.isInteger(n) && n >= min && n <= max && out.indexOf(n) < 0) out.push(n);
  });
  return out.sort((a, b) => a - b);
}

function normSets(sets, withDone) {
  return (Array.isArray(sets) ? sets : [])
    .filter((s) => s && typeof s === 'object')
    .slice(0, 60)
    .map((s) => {
      const out = {
        kg: s.kg === '' || s.kg == null ? (withDone ? '' : 0) : num(s.kg, 0, 1000, 0),
        reps: s.reps === '' || s.reps == null ? (withDone ? '' : 0) : Math.round(num(s.reps, 0, 1000, 0))
      };
      if (withDone) out.done = !!s.done;
      return out;
    });
}

function normEntries(list, withDone) {
  return (Array.isArray(list) ? list : [])
    .filter((e) => e && typeof e === 'object' && str(e.exId, 60))
    .slice(0, 60)
    .map((e) => ({ exId: str(e.exId, 60), name: str(e.name, 80), sets: normSets(e.sets, withDone) }));
}

export function normalize(raw) {
  const s = emptyState();
  if (!raw || typeof raw !== 'object') return s;

  s.name = str(raw.name, 60).trim();

  (Array.isArray(raw.tasks) ? raw.tasks : []).forEach((t) => {
    if (!t || typeof t !== 'object' || !str(t.text)) return;
    s.tasks.push({ id: str(t.id, 40) || uid(), text: str(t.text, 300), done: !!t.done, doneOn: isDateKey(t.doneOn) ? t.doneOn : '' });
  });

  (Array.isArray(raw.habits) ? raw.habits : []).forEach((h) => {
    if (!h || typeof h !== 'object' || !str(h.name)) return;
    const counts = {};
    if (h.counts && typeof h.counts === 'object') {
      Object.keys(h.counts).forEach((k) => {
        const c = Math.round(Number(h.counts[k]));
        if (isDateKey(k) && isFinite(c) && c > 0) counts[k] = Math.min(c, 999);
      });
    }
    s.habits.push({
      id: str(h.id, 40) || uid(),
      emoji: str(h.emoji, 12) || '✅',
      name: str(h.name, 80),
      target: Math.round(num(h.target, 1, 99, 1)),
      unit: str(h.unit, 20),
      weekdays: intList(h.weekdays, 0, 6),
      auto: h.auto === 'gym' || h.auto === 'steps' ? h.auto : '',
      days: (Array.isArray(h.days) ? h.days : []).filter(isDateKey),
      counts: counts
    });
  });

  (Array.isArray(raw.expenses) ? raw.expenses : []).forEach((e) => {
    if (!e || typeof e !== 'object') return;
    const amount = Number(e.amount);
    if (!isFinite(amount) || amount < 0 || !isDateKey(e.date)) return;
    s.expenses.push({
      id: str(e.id, 40) || uid(),
      amount: Math.round(amount * 100) / 100,
      cat: CATEGORIES.indexOf(e.cat) >= 0 ? e.cat : 'Otros',
      concept: str(e.concept, 120),
      date: e.date
    });
  });

  (Array.isArray(raw.notes) ? raw.notes : []).forEach((n) => {
    if (!n || typeof n !== 'object' || !str(n.text).trim()) return;
    s.notes.push({ id: str(n.id, 40) || uid(), text: str(n.text, 20000), updated: Number(n.updated) || Date.now() });
  });

  (Array.isArray(raw.exercises) ? raw.exercises : []).forEach((e) => {
    if (!e || typeof e !== 'object' || !str(e.name).trim()) return;
    s.exercises.push({
      id: str(e.id, 40) || uid(),
      name: str(e.name, 80).trim(),
      group: MUSCLE_GROUPS.indexOf(e.group) >= 0 ? e.group : 'Otros'
    });
  });

  (Array.isArray(raw.routines) ? raw.routines : []).forEach((r) => {
    if (!r || typeof r !== 'object' || !str(r.name).trim()) return;
    s.routines.push({
      id: str(r.id, 40) || uid(),
      name: str(r.name, 80).trim(),
      days: intList(r.days, 0, 6),
      items: (Array.isArray(r.items) ? r.items : [])
        .filter((i) => i && typeof i === 'object' && str(i.exId, 60))
        .slice(0, 40)
        .map((i) => ({ exId: str(i.exId, 60), sets: Math.round(num(i.sets, 1, 20, 3)), reps: Math.round(num(i.reps, 1, 100, 10)) }))
    });
  });

  (Array.isArray(raw.sessions) ? raw.sessions : []).forEach((x) => {
    if (!x || typeof x !== 'object' || !isDateKey(x.date)) return;
    s.sessions.push({
      id: str(x.id, 40) || uid(),
      date: x.date,
      name: str(x.name, 80) || 'Entreno',
      routineId: str(x.routineId, 40),
      startedAt: Number(x.startedAt) || 0,
      durationMin: Math.round(num(x.durationMin, 0, 1440, 0)),
      entries: normEntries(x.entries, false),
      prs: (Array.isArray(x.prs) ? x.prs : []).map((p) => str(p, 60)).filter(Boolean)
    });
  });

  (Array.isArray(raw.weights) ? raw.weights : []).forEach((w) => {
    if (!w || typeof w !== 'object' || !isDateKey(w.date)) return;
    const kg = Number(w.kg);
    if (!isFinite(kg) || kg < 20 || kg > 400) return;
    s.weights.push({ id: str(w.id, 40) || uid(), date: w.date, kg: Math.round(kg * 10) / 10 });
  });

  if (raw.profile && typeof raw.profile === 'object') {
    const p = raw.profile;
    s.profile = {
      height: num(p.height, 100, 250, null),
      age: Math.round(num(p.age, 10, 100, 0)) || null,
      sex: p.sex === 'f' ? 'f' : 'm',
      activity: ACTIVITY_LEVELS.some((a) => a.value === Number(p.activity)) ? Number(p.activity) : 1.55,
      goal: GOALS.some((g) => g.value === p.goal) ? p.goal : 'maintain',
      weight: num(p.weight, 20, 400, null)
    };
  }

  s.restSeconds = Math.round(num(raw.restSeconds, 15, 600, 90));

  if (raw.active && typeof raw.active === 'object' && isDateKey(raw.active.date)) {
    const a = raw.active;
    s.active = {
      id: str(a.id, 40) || uid(),
      date: a.date,
      name: str(a.name, 80) || 'Entreno',
      routineId: str(a.routineId, 40),
      startedAt: Number(a.startedAt) || Date.now(),
      entries: normEntries(a.entries, true)
    };
  }

  s.weeklyGoal = Math.round(num(raw.weeklyGoal, 1, 7, 4));

  if (Array.isArray(raw.schedule)) {
    s.schedule = raw.schedule
      .filter((b) => b && typeof b === 'object' && str(b.name).trim() && /^\d{2}:\d{2}$/.test(str(b.start, 5)) && /^\d{2}:\d{2}$/.test(str(b.end, 5)))
      .slice(0, 12)
      .map((b) => ({
        id: str(b.id, 40) || uid(),
        name: str(b.name, 60).trim(),
        emoji: str(b.emoji, 12) || '📍',
        kind: BLOCK_KINDS.some((k) => k.value === b.kind) ? b.kind : 'other',
        days: intList(b.days, 0, 6),
        start: b.start,
        end: b.end,
        km: Math.round(num(b.km, 0, 100, 0) * 100) / 100,
        walkTo: b.walkTo !== false,
        walkBack: b.walkBack !== false
      }));
  }

  if (raw.walk && typeof raw.walk === 'object') {
    s.walk = {
      speed: num(raw.walk.speed, 2, 8, 5),
      goal: Math.round(num(raw.walk.goal, 1000, 50000, 10000)),
      configured: !!raw.walk.configured
    };
  }

  (Array.isArray(raw.stepsLog) ? raw.stepsLog : []).forEach((x) => {
    if (!x || typeof x !== 'object' || !isDateKey(x.date)) return;
    const steps = Math.round(Number(x.steps));
    if (isFinite(steps) && steps >= 0 && steps <= 200000) s.stepsLog.push({ date: x.date, steps: steps });
  });

  s.skips = (Array.isArray(raw.skips) ? raw.skips : []).map((k) => str(k, 60)).filter((k) => /^\d{4}-\d{2}-\d{2}\|/.test(k)).slice(-400);

  return s;
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? normalize(JSON.parse(raw)) : emptyState();
  } catch (err) {
    return emptyState();
  }
}

export const store = { state: load() };

export const getState = () => store.state;

export function replaceState(next) {
  store.state = next;
}

export function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store.state));
    return true;
  } catch (err) {
    alert('No se pudieron guardar los datos en este dispositivo.');
    return false;
  }
}

/* ---------- Consultas ---------- */

export function allExercises() {
  return PRESET_EXERCISES.concat(store.state.exercises);
}

export function findExercise(id) {
  const custom = store.state.exercises.find((e) => e.id === id);
  if (custom) return custom;
  return PRESET_EXERCISES.find((e) => e.id === id) || null;
}

export function exerciseName(id, fallback) {
  const e = findExercise(id);
  return e ? e.name : fallback || 'Ejercicio eliminado';
}

export function isCustomExercise(id) {
  return store.state.exercises.some((e) => e.id === id);
}

export function lastEntryFor(exId) {
  const sessions = store.state.sessions.slice().sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.startedAt - a.startedAt));
  for (let i = 0; i < sessions.length; i++) {
    for (let j = 0; j < sessions[i].entries.length; j++) {
      if (sessions[i].entries[j].exId === exId && sessions[i].entries[j].sets.length) {
        return { date: sessions[i].date, sets: sessions[i].entries[j].sets };
      }
    }
  }
  return null;
}

export function addHabitFromPreset(preset) {
  const s = store.state;
  s.habits.push({
    id: uid(),
    emoji: preset.emoji,
    name: preset.name,
    target: preset.target,
    unit: preset.unit,
    weekdays: preset.weekdays.slice(),
    auto: preset.auto,
    days: [],
    counts: {}
  });
}

export function applyTemplate(key) {
  const t = TEMPLATES.find((x) => x.key === key);
  if (!t) return 0;
  t.routines.forEach((r) => {
    store.state.routines.push({
      id: uid(),
      name: r.name,
      days: r.days.slice(),
      items: r.items.map((i) => ({ exId: i.exId, sets: i.sets, reps: i.reps }))
    });
  });
  return t.routines.length;
}

export function currentWeight() {
  const s = store.state;
  if (s.weights.length) {
    const last = s.weights.slice().sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0)).pop();
    return last.kg;
  }
  return s.profile.weight;
}
