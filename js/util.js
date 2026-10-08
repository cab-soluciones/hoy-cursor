export function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export const pad = (n) => (n < 10 ? '0' + n : String(n));

export function dateKey(d) {
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

export const todayKey = () => dateKey(new Date());

export function addDays(d, n) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

export function parseKey(k) {
  return new Date(Number(k.slice(0, 4)), Number(k.slice(5, 7)) - 1, Number(k.slice(8, 10)));
}

export const isDateKey = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);

export const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

export function mondayOf(d) {
  const dow = (d.getDay() + 6) % 7;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - dow);
}

export function parseNum(v) {
  if (typeof v === 'number') return isFinite(v) ? v : NaN;
  const n = parseFloat(String(v == null ? '' : v).replace(/\s/g, '').replace(',', '.'));
  return isFinite(n) ? n : NaN;
}

export function numStr(v) {
  return v === '' || v == null || !isFinite(Number(v)) ? '' : String(v).replace('.', ',');
}

const nf = {};
export function fmt(n, max) {
  const d = max == null ? 1 : max;
  if (!nf[d]) nf[d] = new Intl.NumberFormat('es-ES', { maximumFractionDigits: d });
  return nf[d].format(n);
}

export const money = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

export function fmtDur(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return (h ? h + ':' + pad(m) : pad(m)) + ':' + pad(sec);
}

export function fmtMinutes(min) {
  if (min < 60) return min + ' min';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h + ' h' + (m ? ' ' + m + ' min' : '');
}

export function shortDate(key) {
  return parseKey(key).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

export function longDate(d) {
  return capitalize(d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }));
}

export function slug(s) {
  return String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
