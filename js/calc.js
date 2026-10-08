import { addDays, dateKey, clamp } from './util.js';

export function epley(kg, reps) {
  if (!(kg > 0) || !(reps > 0)) return 0;
  return reps === 1 ? kg : kg * (1 + reps / 30);
}

export function brzycki(kg, reps) {
  if (!(kg > 0) || !(reps > 0) || reps >= 37) return 0;
  return reps === 1 ? kg : (kg * 36) / (37 - reps);
}

export function roundTo(n, step) {
  return Math.round(n / step) * step;
}

export function percentTable(oneRm) {
  const rows = [];
  for (let pct = 100; pct >= 60; pct -= 5) {
    const reps = pct === 100 ? 1 : Math.max(1, Math.round(30 * (100 / pct - 1)));
    rows.push({ pct: pct, kg: roundTo((oneRm * pct) / 100, 0.5), reps: reps });
  }
  return rows;
}

export function platesPerSide(target, bar, plates) {
  const list = (plates || [25, 20, 15, 10, 5, 2.5, 1.25]).slice().sort((a, b) => b - a);
  if (!(target > 0) || !(bar >= 0)) return null;
  if (target < bar) return { error: 'El peso objetivo es menor que el de la barra.' };
  let side = (target - bar) / 2;
  const result = [];
  list.forEach((p) => {
    const count = Math.floor((side + 1e-9) / p);
    if (count > 0) {
      result.push({ plate: p, count: count });
      side -= count * p;
    }
  });
  const achievable = target - side * 2;
  return { perSide: result, achievable: Math.round(achievable * 100) / 100, missing: Math.round(side * 2 * 100) / 100 };
}

export function bmi(weight, height) {
  if (!(weight > 0) || !(height > 0)) return 0;
  const m = height / 100;
  return weight / (m * m);
}

export function bmiCategory(v) {
  if (v < 18.5) return { label: 'Bajo peso', tone: 'warn' };
  if (v < 25) return { label: 'Peso normal', tone: 'ok' };
  if (v < 30) return { label: 'Sobrepeso', tone: 'warn' };
  return { label: 'Obesidad', tone: 'bad' };
}

export function bmr(p) {
  if (!(p.weight > 0) || !(p.height > 0) || !(p.age > 0)) return 0;
  return 10 * p.weight + 6.25 * p.height - 5 * p.age + (p.sex === 'f' ? -161 : 5);
}

export function nutrition(p, goal) {
  const base = bmr(p);
  if (!base) return null;
  const tdee = base * p.activity;
  const kcal = tdee * goal.factor;
  const protein = goal.protein * p.weight;
  const fat = 0.9 * p.weight;
  const carbs = Math.max(0, (kcal - protein * 4 - fat * 9) / 4);
  const waterMl = 35 * p.weight;
  return {
    bmr: base,
    tdee: tdee,
    kcal: kcal,
    protein: protein,
    fat: fat,
    carbs: carbs,
    waterL: waterMl / 1000,
    glasses: Math.round(waterMl / 250),
    creatine: Math.round(clamp(0.03 * p.weight, 3, 5) * 10) / 10
  };
}

export function sessionVolume(session) {
  let v = 0;
  session.entries.forEach((e) => e.sets.forEach((s) => { v += (s.kg || 0) * (s.reps || 0); }));
  return v;
}

export function sessionSets(session) {
  return session.entries.reduce((n, e) => n + e.sets.length, 0);
}

export function setScore(set) {
  return set.kg > 0 ? epley(set.kg, set.reps) : set.reps || 0;
}

export function bestScore(sets) {
  return sets.reduce((m, s) => Math.max(m, setScore(s)), 0);
}

export function bestSet(sets) {
  let best = null;
  sets.forEach((s) => {
    if (!best || setScore(s) > setScore(best)) best = s;
  });
  return best;
}

export function findPRs(entries, previousSessions) {
  const prs = [];
  entries.forEach((e) => {
    let prev = 0;
    let seen = false;
    previousSessions.forEach((s) => {
      s.entries.forEach((pe) => {
        if (pe.exId === e.exId && pe.sets.length) {
          seen = true;
          prev = Math.max(prev, bestScore(pe.sets));
        }
      });
    });
    if (seen && bestScore(e.sets) > prev + 0.001) prs.push(e.exId);
  });
  return prs;
}

export function habitStreak(habit, isDone, isScheduled, now) {
  let cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let n = 0;
  for (let i = 0; i < 3700; i++) {
    if (isScheduled(habit, cursor)) {
      if (isDone(habit, dateKey(cursor))) n++;
      else if (i > 0) break;
    }
    cursor = addDays(cursor, -1);
  }
  return n;
}
