import { esc, uid, todayKey, capitalize, parseNum, numStr, isDateKey, parseKey, money, pad } from './util.js';
import { getState, save, CATEGORIES } from './data.js';
import { icon, openSheet, field, findById, removeById, toast } from './ui.js';

const root = () => document.getElementById('view-gastos');
const view = { year: new Date().getFullYear(), month: new Date().getMonth() };

const monthKey = () => view.year + '-' + pad(view.month + 1);

export function render() {
  const key = monthKey();
  const list = getState().expenses.filter((e) => e.date.slice(0, 7) === key)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  const total = list.reduce((n, e) => n + e.amount, 0);
  const byCat = {};
  CATEGORIES.forEach((c) => { byCat[c] = 0; });
  list.forEach((e) => { byCat[e.cat] += e.amount; });
  const max = Math.max.apply(null, CATEGORIES.map((c) => byCat[c]).concat([0]));
  const monthName = capitalize(new Date(view.year, view.month, 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }));

  const bars = CATEGORIES.map((c) => {
    const w = max > 0 ? Math.round((byCat[c] / max) * 100) : 0;
    return '<div class="cat-row"><span>' + esc(c) + '</span><div class="cat-bar"><span style="width:' + w + '%"></span></div><span class="cat-amt">' + esc(money.format(byCat[c])) + '</span></div>';
  }).join('');

  const rows = list.length
    ? list.map((e) => {
      const d = parseKey(e.date);
      return '<div class="row tappable" data-action="gastos:edit" data-id="' + esc(e.id) + '" role="button" tabindex="0">' +
        '<div class="grow"><div class="txt">' + esc(e.concept || e.cat) + '</div>' +
        '<div class="pill">' + esc(e.cat) + ' · ' + esc(d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })) + '</div></div>' +
        '<div class="exp-amt">' + esc(money.format(e.amount)) + '</div></div>';
    }).join('')
    : '<div class="empty">No hay gastos este mes.</div>';

  root().innerHTML =
    '<div class="title-row"><h1>Gastos</h1></div>' +
    '<div class="card total"><div class="month-nav"><button type="button" class="icon-btn" data-action="gastos:prev" aria-label="Mes anterior">' + icon('chevron', 18).replace('class="i"', 'class="i flip"') + '</button>' +
    '<span class="name">' + esc(monthName) + '</span>' +
    '<button type="button" class="icon-btn" data-action="gastos:next" aria-label="Mes siguiente">' + icon('chevron', 18) + '</button></div>' +
    '<div class="amount" id="month-total">' + esc(money.format(total)) + '</div><div class="pill">Total del mes</div></div>' +
    '<div class="card"><h3>Por categoría</h3>' + bars + '</div>' +
    '<div class="card flush">' + rows + '</div>';
}

export function openNew() { expenseSheet(null); }

function expenseSheet(exp) {
  const cats = CATEGORIES.map((c) => '<option value="' + esc(c) + '"' + (exp && exp.cat === c ? ' selected' : '') + '>' + esc(c) + '</option>').join('');
  const defaultDate = exp ? exp.date : (monthKey() === todayKey().slice(0, 7) ? todayKey() : monthKey() + '-01');
  openSheet({
    title: exp ? 'Editar gasto' : 'Nuevo gasto',
    html: '<div class="cols">' +
      field('Importe (€)', 'e-amount', '<input type="text" inputmode="decimal" id="e-amount" name="amount" placeholder="0,00" data-focus value="' + (exp ? esc(numStr(exp.amount)) : '') + '">') +
      field('Categoría', 'e-cat', '<select id="e-cat" name="cat">' + cats + '</select>') + '</div>' +
      field('Concepto', 'e-concept', '<input type="text" id="e-concept" name="concept" maxlength="120" placeholder="Opcional" value="' + esc(exp ? exp.concept : '') + '">') +
      field('Fecha', 'e-date', '<input type="date" id="e-date" name="date" value="' + esc(defaultDate) + '">'),
    onSave: (f) => {
      let amount = parseNum(f.elements.amount.value);
      const date = f.elements.date.value;
      if (!(amount > 0)) { f.elements.amount.focus(); toast('Introduce un importe válido'); return false; }
      if (!isDateKey(date)) { f.elements.date.focus(); return false; }
      amount = Math.round(amount * 100) / 100;
      const data = { amount: amount, cat: f.elements.cat.value, concept: f.elements.concept.value.trim(), date: date };
      if (exp) Object.assign(exp, data);
      else getState().expenses.push(Object.assign({ id: uid() }, data));
      view.year = Number(date.slice(0, 4));
      view.month = Number(date.slice(5, 7)) - 1;
      save();
      render();
    },
    onDelete: exp ? () => { removeById(getState().expenses, exp.id); save(); render(); } : null,
    deleteLabel: 'Eliminar gasto'
  });
}

function changeMonth(delta) {
  const d = new Date(view.year, view.month + delta, 1);
  view.year = d.getFullYear();
  view.month = d.getMonth();
  render();
}

export const actions = {
  'gastos:edit': (el) => { const e = findById(getState().expenses, el.getAttribute('data-id')); if (e) expenseSheet(e); },
  'gastos:prev': () => changeMonth(-1),
  'gastos:next': () => changeMonth(1)
};

