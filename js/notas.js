import { esc, uid } from './util.js';
import { getState, save } from './data.js';
import { openSheet, findById, removeById } from './ui.js';

const root = () => document.getElementById('view-notas');

function noteTitle(text) {
  const first = text.split('\n').map((l) => l.trim()).filter(Boolean)[0];
  return first || 'Sin título';
}

function notePreview(text) {
  return text.split('\n').map((l) => l.trim()).filter(Boolean).slice(1).join(' ');
}

export function render() {
  const list = getState().notes.slice().sort((a, b) => b.updated - a.updated);
  const rows = list.length
    ? list.map((n) => {
      const prev = notePreview(n.text);
      return '<div class="row tappable" data-action="notas:edit" data-id="' + esc(n.id) + '" role="button" tabindex="0">' +
        '<div class="grow"><div class="note-title">' + esc(noteTitle(n.text)) + '</div>' +
        (prev ? '<div class="note-prev">' + esc(prev) + '</div>' : '') + '</div></div>';
    }).join('')
    : '<div class="empty">Aún no hay notas. Pulsa + para crear una.</div>';
  root().innerHTML = '<div class="title-row"><h1>Notas</h1></div><div class="card flush">' + rows + '</div>';
}

export function openNew() { noteSheet(null); }

function noteSheet(note) {
  openSheet({
    title: note ? 'Editar nota' : 'Nueva nota',
    html: '<div class="field"><label for="n-text">La primera línea es el título</label>' +
      '<textarea id="n-text" name="text" maxlength="20000" placeholder="Título&#10;Texto de la nota…" data-focus>' + esc(note ? note.text : '') + '</textarea></div>',
    onSave: (f) => {
      const text = f.elements.text.value.replace(/\s+$/, '');
      if (!text.trim()) {
        if (note) { removeById(getState().notes, note.id); save(); render(); return true; }
        f.elements.text.focus();
        return false;
      }
      if (note) { note.text = text; note.updated = Date.now(); }
      else getState().notes.push({ id: uid(), text: text, updated: Date.now() });
      save();
      render();
    },
    onDelete: note ? () => { removeById(getState().notes, note.id); save(); render(); } : null,
    deleteLabel: 'Eliminar nota'
  });
}

export const actions = {
  'notas:edit': (el) => { const n = findById(getState().notes, el.getAttribute('data-id')); if (n) noteSheet(n); }
};
