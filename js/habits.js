import { getState } from './data.js';
import { stepsFor } from './walk.js';
import { parseKey, todayKey } from './util.js';

export function isScheduled(habit, date) {
  return !habit.weekdays.length || habit.weekdays.length >= 7 || habit.weekdays.indexOf(date.getDay()) >= 0;
}

export function isHabitDone(habit, key) {
  const s = getState();
  if (habit.auto === 'gym') return s.sessions.some((x) => x.date === key);
  if (habit.auto === 'steps') {
    if (key > todayKey()) return false;
    return stepsFor(parseKey(key)).steps >= s.walk.goal;
  }
  return habit.days.indexOf(key) >= 0;
}

export function habitCount(habit, key) {
  if (habit.target <= 1) return isHabitDone(habit, key) ? 1 : 0;
  return habit.counts[key] || 0;
}
