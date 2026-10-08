import { esc, todayKey } from './util.js';
import { getState, save, replaceState, emptyState, normalize, AUTHOR, VERSION } from './data.js';
import { refreshAll, toast } from './ui.js';

const root = () => document.getElementById('view-ajustes');

export function render() {
  root().innerHTML =
    '<div class="title-row"><h1>Ajustes</h1></div>' +
    '<div class="card"><h3>Tu nombre</h3>' +
    '<form class="add-row" id="name-form" autocomplete="off">' +
    '<input type="text" id="name-input" placeholder="¿Cómo te llamas?" maxlength="60" value="' + esc(getState().name) + '" aria-label="Tu nombre">' +
    '<button type="submit" class="btn">Guardar</button></form><div class="hint" id="name-status" aria-live="polite"></div></div>' +
    '<div class="card stack"><h3>Tus datos</h3>' +
    '<p class="hint">Todo se guarda solo en este dispositivo. Exporta una copia para no perderla.</p>' +
    '<button type="button" class="btn ghost block" data-action="ajustes:export">Exportar copia (JSON)</button>' +
    '<button type="button" class="btn ghost block" data-action="ajustes:import">Importar copia (JSON)</button>' +
    '<button type="button" class="btn danger block" data-action="ajustes:wipe">Borrar todos los datos</button></div>' +
    '<div class="card about"><h3>Acerca de</h3><div class="app-logo"><img src="icons/icon-192.png" alt="" width="64" height="64"></div>' +
    '<div class="app-name">Hoy</div>' +
    '<p>Desarrollada por ' + esc(AUTHOR) + '</p>' +
    '<p>© ' + new Date().getFullYear() + ' ' + esc(AUTHOR) + '. Todos los derechos reservados.</p>' +
    '<p class="ver">Versión ' + esc(VERSION) + '</p></div>';
}

function exportData() {
  const json = JSON.stringify({ app: 'hoy', version: 2, exportedAt: new Date().toISOString(), data: getState() }, null, 2);
  const fileName = 'hoy-copia-' + todayKey() + '.json';
  let file = null;
  try { file = new File([json], fileName, { type: 'application/json' }); } catch (err) { file = null; }
  if (file && navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
    navigator.share({ files: [file], title: 'Copia de Hoy' }).catch(() => {});
    return;
  }
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      const data = parsed && parsed.data && typeof parsed.data === 'object' ? parsed.data : parsed;
      if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('formato');
      const next = normalize(data);
      if (!confirm('Se reemplazarán tus datos actuales por los de la copia. ¿Continuar?')) return;
      replaceState(next);
      save();
      refreshAll();
      toast('Copia importada correctamente');
    } catch (err) {
      alert('El archivo no es una copia válida de Hoy.');
    }
  };
  reader.onerror = () => alert('No se pudo leer el archivo.');
  reader.readAsText(file);
}

function wipeData() {
  if (!confirm('Se borrarán TODAS tus tareas, rutinas, entrenos, gastos y notas. ¿Continuar?')) return;
  if (!confirm('Esta acción no se puede deshacer. ¿Borrar definitivamente todos los datos?')) return;
  replaceState(emptyState());
  save();
  refreshAll();
}

export const actions = {
  'ajustes:export': exportData,
  'ajustes:import': () => document.getElementById('import-file').click(),
  'ajustes:wipe': wipeData
};

export const forms = {
  'name-form': () => {
    const s = getState();
    s.name = document.getElementById('name-input').value.trim();
    save();
    document.getElementById('name-status').textContent = s.name ? 'Nombre guardado: ' + s.name : 'Nombre borrado.';
    document.getElementById('name-input').blur();
  }
};

export function init() {
  document.getElementById('import-file').addEventListener('change', (e) => {
    const f = e.target.files && e.target.files[0];
    if (f) importData(f);
    e.target.value = '';
  });
}
