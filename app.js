(function () {
  'use strict';

  var STORAGE_KEY = 'hoy.v1';
  var CATEGORIES = ['Comida', 'Compra', 'Transporte', 'Ocio', 'Casa', 'Salud', 'Otros'];
  var EMOJIS = ['💧', '🏃', '📖', '🧘', '🥗', '😴', '💊', '✅'];
  var WEEKDAYS = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
  var AUTHOR = 'Javier Lorenzo';

  var money = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function pad(n) { return n < 10 ? '0' + n : String(n); }

  function dateKey(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function todayKey() { return dateKey(new Date()); }

  function addDays(d, n) {
    var r = new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
    return r;
  }

  function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function isDateKey(s) { return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s); }

  /* ---------- Estado ---------- */

  function emptyState() {
    return { name: '', tasks: [], habits: [], expenses: [], notes: [] };
  }

  function str(v, max) {
    return typeof v === 'string' ? v.slice(0, max || 5000) : '';
  }

  function normalize(raw) {
    var s = emptyState();
    if (!raw || typeof raw !== 'object') return s;
    s.name = str(raw.name, 60).trim();
    (Array.isArray(raw.tasks) ? raw.tasks : []).forEach(function (t) {
      if (!t || typeof t !== 'object' || !str(t.text)) return;
      s.tasks.push({
        id: str(t.id, 40) || uid(),
        text: str(t.text, 300),
        done: !!t.done,
        doneOn: isDateKey(t.doneOn) ? t.doneOn : ''
      });
    });
    (Array.isArray(raw.habits) ? raw.habits : []).forEach(function (h) {
      if (!h || typeof h !== 'object' || !str(h.name)) return;
      s.habits.push({
        id: str(h.id, 40) || uid(),
        emoji: str(h.emoji, 8) || '✅',
        name: str(h.name, 80),
        days: (Array.isArray(h.days) ? h.days : []).filter(isDateKey)
      });
    });
    (Array.isArray(raw.expenses) ? raw.expenses : []).forEach(function (e) {
      if (!e || typeof e !== 'object') return;
      var amount = Number(e.amount);
      if (!isFinite(amount) || amount < 0 || !isDateKey(e.date)) return;
      s.expenses.push({
        id: str(e.id, 40) || uid(),
        amount: Math.round(amount * 100) / 100,
        cat: CATEGORIES.indexOf(e.cat) >= 0 ? e.cat : 'Otros',
        concept: str(e.concept, 120),
        date: e.date
      });
    });
    (Array.isArray(raw.notes) ? raw.notes : []).forEach(function (n) {
      if (!n || typeof n !== 'object' || !str(n.text).trim()) return;
      s.notes.push({
        id: str(n.id, 40) || uid(),
        text: str(n.text, 20000),
        updated: Number(n.updated) || Date.now()
      });
    });
    return s;
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? normalize(JSON.parse(raw)) : emptyState();
    } catch (err) {
      return emptyState();
    }
  }

  var state = load();

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      alert('No se pudieron guardar los datos en este dispositivo.');
    }
  }

  var ui = { tab: 'hoy', year: new Date().getFullYear(), month: new Date().getMonth() };

  /* ---------- Utilidades de dominio ---------- */

  function greetingText() {
    var h = new Date().getHours();
    var word = h >= 6 && h < 13 ? 'Buenos días' : h >= 13 && h < 21 ? 'Buenas tardes' : 'Buenas noches';
    return state.name ? word + ', ' + state.name : word;
  }

  function longDate(d) {
    return capitalize(d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }));
  }

  function visibleTasks() {
    var today = todayKey();
    return state.tasks.filter(function (t) { return !t.done || t.doneOn === today; });
  }

  function streak(habit) {
    var set = {};
    habit.days.forEach(function (d) { set[d] = true; });
    var cursor = new Date();
    if (!set[dateKey(cursor)]) cursor = addDays(cursor, -1);
    var n = 0;
    while (set[dateKey(cursor)]) {
      n++;
      cursor = addDays(cursor, -1);
    }
    return n;
  }

  function progress() {
    var today = todayKey();
    var tasks = visibleTasks();
    var total = tasks.length + state.habits.length;
    var done = tasks.filter(function (t) { return t.done; }).length +
      state.habits.filter(function (h) { return h.days.indexOf(today) >= 0; }).length;
    return { total: total, done: done, pct: total ? Math.round((done / total) * 100) : 0 };
  }

  /* ---------- Vistas ---------- */

  var views = {
    hoy: document.getElementById('view-hoy'),
    gastos: document.getElementById('view-gastos'),
    notas: document.getElementById('view-notas'),
    ajustes: document.getElementById('view-ajustes')
  };

  function renderHoy() {
    var today = todayKey();
    var p = progress();
    var R = 36, C = 2 * Math.PI * R;
    var tasks = visibleTasks();

    var taskRows = tasks.length
      ? tasks.map(function (t) {
          return '<div class="row' + (t.done ? ' done' : '') + '">' +
            '<button type="button" class="check' + (t.done ? ' on' : '') + '" data-action="toggle-task" data-id="' + esc(t.id) + '" aria-label="Marcar tarea" aria-pressed="' + t.done + '">✓</button>' +
            '<div class="grow txt">' + esc(t.text) + '</div>' +
            '<button type="button" class="icon-btn" data-action="delete-task" data-id="' + esc(t.id) + '" aria-label="Borrar tarea">✕</button>' +
            '</div>';
        }).join('')
      : '<div class="empty">Sin tareas. ¡Añade la primera!</div>';

    var habitRows = state.habits.length
      ? state.habits.map(function (h) {
          var on = h.days.indexOf(today) >= 0;
          var s = streak(h);
          var dots = '';
          for (var i = 6; i >= 0; i--) {
            var d = addDays(new Date(), -i);
            var k = dateKey(d);
            dots += '<div class="dot' + (h.days.indexOf(k) >= 0 ? ' on' : '') + (i === 0 ? ' today' : '') + '"><i></i>' + WEEKDAYS[d.getDay()] + '</div>';
          }
          return '<div class="row">' +
            '<button type="button" class="check' + (on ? ' on' : '') + '" data-action="toggle-habit" data-id="' + esc(h.id) + '" aria-label="Marcar hábito de hoy" aria-pressed="' + on + '">✓</button>' +
            '<div class="habit-emoji">' + esc(h.emoji) + '</div>' +
            '<div class="grow"><div class="txt">' + esc(h.name) + '</div>' +
            '<div class="habit-meta"><span class="streak">🔥 ' + s + (s === 1 ? ' día' : ' días') + '</span> seguidos</div>' +
            '<div class="dots">' + dots + '</div></div>' +
            '<button type="button" class="icon-btn" data-action="edit-habit" data-id="' + esc(h.id) + '" aria-label="Editar hábito">✎</button>' +
            '</div>';
        }).join('')
      : '<div class="empty">Crea un hábito para seguir tu racha.</div>';

    views.hoy.innerHTML =
      '<div class="hero">' +
        '<div class="grow"><h1>' + esc(greetingText()) + '</h1><p class="sub">' + esc(longDate(new Date())) + '</p></div>' +
        '<div class="ring" role="img" aria-label="Progreso del día: ' + p.pct + '%">' +
          '<svg viewBox="0 0 84 84"><circle class="track" cx="42" cy="42" r="' + R + '" fill="none" stroke-width="8"/>' +
          '<circle class="bar" cx="42" cy="42" r="' + R + '" fill="none" stroke-width="8" stroke-linecap="round" stroke-dasharray="' + C.toFixed(2) + '" stroke-dashoffset="' + (C * (1 - p.pct / 100)).toFixed(2) + '"/></svg>' +
          '<div class="pct" id="ring-pct">' + p.pct + '%</div>' +
        '</div>' +
      '</div>' +
      '<div class="card"><h3>Tareas · ' + p.done + ' de ' + p.total + ' completadas</h3>' +
        '<form class="add-row" id="task-form" autocomplete="off">' +
          '<input type="text" id="task-input" placeholder="Nueva tarea" maxlength="300" aria-label="Nueva tarea" enterkeyhint="done">' +
          '<button type="submit" class="btn">Añadir</button>' +
        '</form>' + taskRows + '</div>' +
      '<div class="card"><h3>Hábitos</h3>' + habitRows +
        '<div style="margin-top:10px"><button type="button" class="btn ghost block" data-action="new-habit">+ Nuevo hábito</button></div></div>';
  }

  function monthKey() { return ui.year + '-' + pad(ui.month + 1); }

  function renderGastos() {
    var key = monthKey();
    var list = state.expenses.filter(function (e) { return e.date.slice(0, 7) === key; })
      .sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; });
    var total = list.reduce(function (acc, e) { return acc + e.amount; }, 0);
    var byCat = {};
    CATEGORIES.forEach(function (c) { byCat[c] = 0; });
    list.forEach(function (e) { byCat[e.cat] += e.amount; });
    var max = Math.max.apply(null, CATEGORIES.map(function (c) { return byCat[c]; }).concat([0]));

    var monthName = capitalize(new Date(ui.year, ui.month, 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }));

    var bars = CATEGORIES.map(function (c) {
      var w = max > 0 ? Math.round((byCat[c] / max) * 100) : 0;
      return '<div class="cat-row"><span>' + esc(c) + '</span><div class="cat-bar"><span style="width:' + w + '%"></span></div><span class="cat-amt">' + esc(money.format(byCat[c])) + '</span></div>';
    }).join('');

    var rows = list.length
      ? list.map(function (e) {
          var d = new Date(e.date + 'T00:00:00');
          return '<div class="row tappable" data-action="edit-expense" data-id="' + esc(e.id) + '" role="button" tabindex="0">' +
            '<div class="grow"><div class="txt">' + esc(e.concept || e.cat) + '</div>' +
            '<div class="pill">' + esc(e.cat) + ' · ' + esc(d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })) + '</div></div>' +
            '<div class="exp-amt">' + esc(money.format(e.amount)) + '</div></div>';
        }).join('')
      : '<div class="empty">No hay gastos este mes.</div>';

    views.gastos.innerHTML =
      '<div class="title-row"><h1>Gastos</h1></div>' +
      '<div class="card total">' +
        '<div class="month-nav"><button type="button" class="icon-btn" data-action="prev-month" aria-label="Mes anterior">‹</button>' +
        '<span class="name">' + esc(monthName) + '</span>' +
        '<button type="button" class="icon-btn" data-action="next-month" aria-label="Mes siguiente">›</button></div>' +
        '<div class="amount" id="month-total">' + esc(money.format(total)) + '</div>' +
        '<div class="pill">Total del mes</div></div>' +
      '<div class="card"><h3>Por categoría</h3>' + bars + '</div>' +
      '<div class="card flush">' + rows + '</div>';
  }

  function noteTitle(text) {
    var first = text.split('\n').map(function (l) { return l.trim(); }).filter(Boolean)[0];
    return first || 'Sin título';
  }

  function notePreview(text) {
    var lines = text.split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
    return lines.slice(1).join(' ');
  }

  function renderNotas() {
    var list = state.notes.slice().sort(function (a, b) { return b.updated - a.updated; });
    var rows = list.length
      ? list.map(function (n) {
          var prev = notePreview(n.text);
          return '<div class="row tappable" data-action="edit-note" data-id="' + esc(n.id) + '" role="button" tabindex="0">' +
            '<div class="grow"><div class="note-title">' + esc(noteTitle(n.text)) + '</div>' +
            (prev ? '<div class="note-prev">' + esc(prev) + '</div>' : '') + '</div></div>';
        }).join('')
      : '<div class="empty">Aún no hay notas. Pulsa + para crear una.</div>';
    views.notas.innerHTML = '<div class="title-row"><h1>Notas</h1></div><div class="card flush">' + rows + '</div>';
  }

  function renderAjustes() {
    views.ajustes.innerHTML =
      '<div class="title-row"><h1>Ajustes</h1></div>' +
      '<div class="card"><h3>Tu nombre</h3>' +
        '<form class="add-row" id="name-form" autocomplete="off">' +
          '<input type="text" id="name-input" placeholder="¿Cómo te llamas?" maxlength="60" value="' + esc(state.name) + '" aria-label="Tu nombre">' +
          '<button type="submit" class="btn">Guardar</button>' +
        '</form><div class="hint" id="name-status" aria-live="polite"></div></div>' +
      '<div class="card stack"><h3>Tus datos</h3>' +
        '<p class="hint">Todo se guarda solo en este dispositivo. Exporta una copia para no perderla.</p>' +
        '<button type="button" class="btn ghost block" data-action="export">Exportar copia (JSON)</button>' +
        '<button type="button" class="btn ghost block" data-action="import">Importar copia (JSON)</button>' +
        '<button type="button" class="btn danger block" data-action="wipe">Borrar todos los datos</button></div>' +
      '<div class="card about"><h3>Acerca de</h3>' +
        '<div class="app-name">Hoy</div>' +
        '<p>Desarrollada por ' + esc(AUTHOR) + '</p>' +
        '<p>© ' + new Date().getFullYear() + ' ' + esc(AUTHOR) + '. Todos los derechos reservados.</p></div>';
  }

  var renderers = { hoy: renderHoy, gastos: renderGastos, notas: renderNotas, ajustes: renderAjustes };

  function render(which) {
    renderers[which || ui.tab]();
  }

  function showTab(tab) {
    ui.tab = tab;
    Object.keys(views).forEach(function (k) { views[k].hidden = k !== tab; });
    Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (b) {
      var on = b.getAttribute('data-tab') === tab;
      b.classList.toggle('active', on);
      if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    document.getElementById('fab').hidden = !(tab === 'gastos' || tab === 'notas');
    render(tab);
    window.scrollTo(0, 0);
  }

  /* ---------- Hoja inferior ---------- */

  var sheet = document.getElementById('sheet');
  var backdrop = document.getElementById('backdrop');
  var sheetForm = document.getElementById('sheet-form');
  var sheetDelete = document.getElementById('sheet-delete');
  var sheetHandlers = null;

  function openSheet(opts) {
    document.getElementById('sheet-title').textContent = opts.title;
    sheetForm.innerHTML = opts.html;
    sheetHandlers = opts;
    sheetDelete.hidden = !opts.onDelete;
    sheetDelete.textContent = opts.deleteLabel || 'Eliminar';
    sheet.hidden = false;
    backdrop.hidden = false;
    sheet.scrollTop = 0;
    var f = sheetForm.querySelector('[data-focus]');
    if (f) setTimeout(function () { f.focus(); }, 60);
  }

  function closeSheet() {
    sheet.hidden = true;
    backdrop.hidden = true;
    sheetForm.innerHTML = '';
    sheetHandlers = null;
  }

  function field(label, id, inner) {
    return '<div class="field"><label for="' + id + '">' + esc(label) + '</label>' + inner + '</div>';
  }

  function submitSheet() {
    if (!sheetHandlers) return;
    if (sheetHandlers.onSave(sheetForm) !== false) closeSheet();
  }

  document.getElementById('sheet-save').addEventListener('click', submitSheet);
  document.getElementById('sheet-cancel').addEventListener('click', closeSheet);
  backdrop.addEventListener('click', closeSheet);
  sheetForm.addEventListener('submit', function (e) { e.preventDefault(); submitSheet(); });
  sheetForm.addEventListener('click', function (e) {
    var b = e.target.closest('[data-emoji]');
    if (b) {
      e.preventDefault();
      sheetForm.elements.emoji.value = b.getAttribute('data-emoji');
    }
  });
  sheetDelete.addEventListener('click', function () {
    if (!sheetHandlers || !sheetHandlers.onDelete) return;
    if (confirm('¿Seguro que quieres eliminarlo?')) {
      sheetHandlers.onDelete();
      closeSheet();
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !sheet.hidden) closeSheet();
  });

  function findById(list, id) {
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  function removeById(list, id) {
    var i = list.findIndex(function (x) { return x.id === id; });
    if (i >= 0) list.splice(i, 1);
  }

  function habitSheet(habit) {
    var chips = EMOJIS.map(function (e) {
      return '<button type="button" class="icon-btn" style="font-size:22px" data-emoji="' + esc(e) + '" aria-label="Emoji ' + esc(e) + '">' + esc(e) + '</button>';
    }).join('');
    openSheet({
      title: habit ? 'Editar hábito' : 'Nuevo hábito',
      html: field('Emoji', 'h-emoji', '<input type="text" id="h-emoji" name="emoji" maxlength="8" value="' + esc(habit ? habit.emoji : '✅') + '">') +
        '<div style="display:flex;flex-wrap:wrap;gap:4px;margin:-6px 0 14px">' + chips + '</div>' +
        field('Nombre', 'h-name', '<input type="text" id="h-name" name="name" maxlength="80" placeholder="Beber agua" data-focus value="' + esc(habit ? habit.name : '') + '">'),
      onSave: function (form) {
        var name = form.elements.name.value.trim();
        var emoji = form.elements.emoji.value.trim() || '✅';
        if (!name) { form.elements.name.focus(); return false; }
        if (habit) { habit.name = name; habit.emoji = emoji; }
        else state.habits.push({ id: uid(), emoji: emoji, name: name, days: [] });
        save(); render('hoy');
      },
      onDelete: habit ? function () { removeById(state.habits, habit.id); save(); render('hoy'); } : null,
      deleteLabel: 'Eliminar hábito'
    });
  }

  function expenseSheet(exp) {
    var cats = CATEGORIES.map(function (c) {
      return '<option value="' + esc(c) + '"' + (exp && exp.cat === c ? ' selected' : '') + '>' + esc(c) + '</option>';
    }).join('');
    var defaultDate = exp ? exp.date : (monthKey() === todayKey().slice(0, 7) ? todayKey() : monthKey() + '-01');
    openSheet({
      title: exp ? 'Editar gasto' : 'Nuevo gasto',
      html: '<div class="cols">' +
          field('Importe (€)', 'e-amount', '<input type="text" inputmode="decimal" id="e-amount" name="amount" placeholder="0,00" data-focus value="' + (exp ? esc(String(exp.amount).replace('.', ',')) : '') + '">') +
          field('Categoría', 'e-cat', '<select id="e-cat" name="cat">' + cats + '</select>') +
        '</div>' +
        field('Concepto', 'e-concept', '<input type="text" id="e-concept" name="concept" maxlength="120" placeholder="Opcional" value="' + esc(exp ? exp.concept : '') + '">') +
        field('Fecha', 'e-date', '<input type="date" id="e-date" name="date" value="' + esc(defaultDate) + '">'),
      onSave: function (form) {
        var amount = parseFloat(form.elements.amount.value.replace(/\s/g, '').replace(',', '.'));
        var date = form.elements.date.value;
        if (!isFinite(amount) || amount <= 0) { form.elements.amount.focus(); return false; }
        if (!isDateKey(date)) { form.elements.date.focus(); return false; }
        amount = Math.round(amount * 100) / 100;
        var data = { amount: amount, cat: form.elements.cat.value, concept: form.elements.concept.value.trim(), date: date };
        if (exp) Object.assign(exp, data);
        else state.expenses.push(Object.assign({ id: uid() }, data));
        ui.year = Number(date.slice(0, 4));
        ui.month = Number(date.slice(5, 7)) - 1;
        save(); render('gastos');
      },
      onDelete: exp ? function () { removeById(state.expenses, exp.id); save(); render('gastos'); } : null,
      deleteLabel: 'Eliminar gasto'
    });
  }

  function noteSheet(note) {
    openSheet({
      title: note ? 'Editar nota' : 'Nueva nota',
      html: '<div class="field"><label for="n-text">La primera línea es el título</label>' +
        '<textarea id="n-text" name="text" maxlength="20000" placeholder="Título&#10;Texto de la nota…" data-focus>' + esc(note ? note.text : '') + '</textarea></div>',
      onSave: function (form) {
        var text = form.elements.text.value.replace(/\s+$/, '');
        if (!text.trim()) {
          if (note) { removeById(state.notes, note.id); save(); render('notas'); return true; }
          form.elements.text.focus();
          return false;
        }
        if (note) { note.text = text; note.updated = Date.now(); }
        else state.notes.push({ id: uid(), text: text, updated: Date.now() });
        save(); render('notas');
      },
      onDelete: note ? function () { removeById(state.notes, note.id); save(); render('notas'); } : null,
      deleteLabel: 'Eliminar nota'
    });
  }

  /* ---------- Copia de seguridad ---------- */

  function exportData() {
    var json = JSON.stringify({ app: 'hoy', version: 1, exportedAt: new Date().toISOString(), data: state }, null, 2);
    var fileName = 'hoy-copia-' + todayKey() + '.json';
    var file = null;
    try { file = new File([json], fileName, { type: 'application/json' }); } catch (err) { file = null; }
    if (file && navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
      navigator.share({ files: [file], title: 'Copia de Hoy' }).catch(function () {});
      return;
    }
    var url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    var a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  }

  function importData(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var parsed = JSON.parse(String(reader.result));
        var data = parsed && parsed.data && typeof parsed.data === 'object' ? parsed.data : parsed;
        if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('formato');
        var next = normalize(data);
        if (!confirm('Se reemplazarán tus datos actuales por los de la copia. ¿Continuar?')) return;
        state = next;
        save();
        render();
        alert('Copia importada correctamente.');
      } catch (err) {
        alert('El archivo no es una copia válida de Hoy.');
      }
    };
    reader.onerror = function () { alert('No se pudo leer el archivo.'); };
    reader.readAsText(file);
  }

  function wipeData() {
    if (!confirm('Se borrarán TODOS tus tareas, hábitos, gastos y notas. ¿Continuar?')) return;
    if (!confirm('Esta acción no se puede deshacer. ¿Borrar definitivamente todos los datos?')) return;
    state = emptyState();
    save();
    render();
  }

  /* ---------- Eventos ---------- */

  document.getElementById('tabbar').addEventListener('click', function (e) {
    var b = e.target.closest('[data-tab]');
    if (b) showTab(b.getAttribute('data-tab'));
  });

  document.getElementById('fab').addEventListener('click', function () {
    if (ui.tab === 'gastos') expenseSheet(null);
    else if (ui.tab === 'notas') noteSheet(null);
  });

  function changeMonth(delta) {
    var d = new Date(ui.year, ui.month + delta, 1);
    ui.year = d.getFullYear();
    ui.month = d.getMonth();
    render('gastos');
  }

  document.getElementById('app').addEventListener('click', function (e) {
    var el = e.target.closest('[data-action]');
    if (!el) return;
    var id = el.getAttribute('data-id');
    switch (el.getAttribute('data-action')) {
      case 'toggle-task':
        var t = findById(state.tasks, id);
        if (t) { t.done = !t.done; t.doneOn = t.done ? todayKey() : ''; save(); render('hoy'); }
        break;
      case 'delete-task':
        removeById(state.tasks, id); save(); render('hoy');
        break;
      case 'toggle-habit':
        var h = findById(state.habits, id);
        if (h) {
          var k = todayKey(), i = h.days.indexOf(k);
          if (i >= 0) h.days.splice(i, 1); else h.days.push(k);
          save(); render('hoy');
        }
        break;
      case 'new-habit': habitSheet(null); break;
      case 'edit-habit': habitSheet(findById(state.habits, id)); break;
      case 'edit-expense': expenseSheet(findById(state.expenses, id)); break;
      case 'edit-note': noteSheet(findById(state.notes, id)); break;
      case 'prev-month': changeMonth(-1); break;
      case 'next-month': changeMonth(1); break;
      case 'export': exportData(); break;
      case 'import': document.getElementById('import-file').click(); break;
      case 'wipe': wipeData(); break;
    }
  });

  document.getElementById('app').addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var el = e.target.closest('.tappable[data-action]');
    if (el) { e.preventDefault(); el.click(); }
  });

  document.getElementById('app').addEventListener('submit', function (e) {
    e.preventDefault();
    if (e.target.id === 'task-form') {
      var input = document.getElementById('task-input');
      var text = input.value.trim();
      if (!text) { input.focus(); return; }
      state.tasks.push({ id: uid(), text: text, done: false, doneOn: '' });
      save();
      render('hoy');
      document.getElementById('task-input').focus();
    } else if (e.target.id === 'name-form') {
      state.name = document.getElementById('name-input').value.trim();
      save();
      document.getElementById('name-status').textContent = state.name ? 'Nombre guardado: ' + state.name : 'Nombre borrado.';
      document.getElementById('name-input').blur();
    }
  });

  document.getElementById('import-file').addEventListener('change', function (e) {
    var f = e.target.files && e.target.files[0];
    if (f) importData(f);
    e.target.value = '';
  });

  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && sheet.hidden && ui.tab !== 'ajustes') render();
  });

  showTab('hoy');

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    });
  }
})();
