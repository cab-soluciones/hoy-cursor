import { getState, currentWeight } from './data.js';
import { dateKey, todayKey } from './util.js';
import { dayPlan, legFraction, stepsPerKm, walkKcal, legMinutes } from './calc.js';

export function nowMinutes() {
  const n = new Date();
  return n.getHours() * 60 + n.getMinutes();
}

export function isSkipped(key, blockId) {
  return getState().skips.indexOf(key + '|' + blockId) >= 0;
}

export function plan(date) {
  const s = getState();
  const key = dateKey(date);
  return dayPlan(s.schedule, date, (b) => isSkipped(key, b.id), s.walk.speed);
}

export function loggedSteps(key) {
  const e = getState().stepsLog.find((x) => x.date === key);
  return e ? e.steps : null;
}

/* Resumen de un día. Para hoy, "hecho" avanza con la hora; los días pasados cuentan completos. */
export function stepsFor(date) {
  const s = getState();
  const key = dateKey(date);
  const today = todayKey();
  const p = plan(date);
  const spk = stepsPerKm(s.profile.height);
  const nowMin = key === today ? nowMinutes() : key < today ? 99999 : null;
  let km = 0;
  let doneKm = 0;
  let minutes = 0;
  let doneMin = 0;
  p.legs.forEach((l) => {
    const f = legFraction(l, nowMin);
    km += l.km;
    doneKm += l.km * f;
    const m = legMinutes(l.km, s.walk.speed);
    minutes += m;
    doneMin += m * f;
  });
  const logged = loggedSteps(key);
  const plannedSteps = Math.round(km * spk);
  const doneSteps = Math.round(doneKm * spk);
  const steps = logged != null ? logged : doneSteps;
  const realKm = logged != null ? logged / spk : doneKm;
  const weight = currentWeight() || 75;
  return {
    key: key,
    plan: p,
    nowMin: nowMin,
    plannedKm: km,
    plannedSteps: plannedSteps,
    plannedMin: Math.round(minutes),
    doneKm: doneKm,
    doneMin: Math.round(doneMin),
    logged: logged,
    steps: steps,
    km: realKm,
    kcal: Math.round(walkKcal(realKm, weight, s.walk.speed)),
    spk: spk
  };
}
