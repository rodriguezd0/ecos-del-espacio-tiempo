// Resolución de nombres de audio → rutas de Añil (módulo PURO, sin DOM).
// Usa el índice generado (game/data/audio_index.json, ver tools/extract_audio.mjs) para:
//  - aceptar nombres sin extensión y sin distinguir mayúsculas ('gui sel cursor' → 'GUI sel cursor.ogg'),
//  - no pedir nunca archivos que no existen (sin errores 404 en consola),
//  - elegir la variante de forma de un grito (CHARIZARD_1 → CHARIZARD si no existe).
// Sin índice (no cargó), se adivina '<nombre>.ogg' y el reproductor tolera el fallo.

export const KIND_DIRS = { bgm: 'BGM', me: 'ME', bgs: 'BGS', se: 'SE', cry: 'SE/Cries' };
const EXT_RE = /\.(ogg|wav|mp3|mid)$/i;
// Preferencia ante duplicados con distinta extensión (Essentials resuelve SE como "", .wav, .ogg).
const EXT_PRIORITY = {
  se: ['.wav', '.ogg', '.mp3'],
  default: ['.ogg', '.wav', '.mp3'],
};

function extOf(file) {
  const m = EXT_RE.exec(file);
  return m ? `.${m[1].toLowerCase()}` : '';
}

function stripExt(file) {
  return file.replace(EXT_RE, '');
}

function priority(kind, file) {
  const list = EXT_PRIORITY[kind] || EXT_PRIORITY.default;
  const i = list.indexOf(extOf(file));
  return i < 0 ? list.length : i;
}

function addEntry(index, kind, name, file, meta = null) {
  const entry = { name, file, meta };
  index.files[kind].set(file.toLowerCase(), entry);
  const key = name.toLowerCase();
  const prev = index[kind].get(key);
  if (prev && priority(kind, prev.file) <= priority(kind, file)) return;
  index[kind].set(key, entry);
}

/**
 * Convierte el JSON del índice en tablas de búsqueda.
 * → { bgm, me, bgs, se, cry: Map(nombre en minúsculas → { name, file, meta }),
 *     files: { <tipo>: Map(archivo en minúsculas → entrada) } }
 */
export function createAudioIndex(json) {
  if (!json || typeof json !== 'object') throw new TypeError('Índice de audio inválido.');
  const kinds = Object.keys(KIND_DIRS);
  const index = Object.fromEntries(kinds.map((k) => [k, new Map()]));
  index.files = Object.fromEntries(kinds.map((k) => [k, new Map()]));
  for (const kind of ['bgm', 'me', 'bgs']) {
    for (const [name, entry] of Object.entries(json[kind] || {})) {
      if (entry && entry.file && extOf(entry.file) !== '.mid') addEntry(index, kind, name, entry.file, entry);
    }
  }
  for (const file of json.se || []) addEntry(index, 'se', stripExt(file), file);
  for (const file of json.cries || []) addEntry(index, 'cry', stripExt(file), file);
  return index;
}

/** Normaliza un nombre: quita 'Audio/<CARPETA>/', barras invertidas y espacios de los extremos. */
export function normalizeName(kind, name) {
  if (typeof name !== 'string') return '';
  let n = name.replace(/\\/g, '/').trim();
  const dir = KIND_DIRS[kind];
  const prefix = `audio/${dir}/`.toLowerCase();
  if (n.toLowerCase().startsWith(prefix)) n = n.slice(prefix.length);
  else if (n.toLowerCase().startsWith(`${dir.toLowerCase()}/`)) n = n.slice(dir.length + 1);
  return n;
}

function describe(kind, entry) {
  return { kind, name: entry.name, file: entry.file, path: `Audio/${KIND_DIRS[kind]}/${entry.file}`, meta: entry.meta };
}

/**
 * Busca un archivo de audio. `kind`: 'bgm'|'me'|'bgs'|'se'|'cry'.
 * → { kind, name, file, path ('Audio/SE/…'), meta } o null si no existe.
 * Con index = null devuelve una suposición (path con .ogg si no trae extensión) marcada guessed: true.
 */
export function resolveFile(index, kind, name) {
  if (!KIND_DIRS[kind]) throw new Error(`Tipo de audio desconocido: ${kind}`);
  const n = normalizeName(kind, name);
  if (!n) return null;
  if (!index) {
    const file = extOf(n) ? n : `${n}.ogg`;
    return { kind, name: stripExt(n), file, path: `Audio/${KIND_DIRS[kind]}/${file}`, meta: null, guessed: true };
  }
  const lower = n.toLowerCase();
  // pbSEPlay("Cries/<ID>") de Essentials: los gritos viven en SE/Cries.
  if (kind === 'se' && lower.startsWith('cries/')) return resolveFile(index, 'cry', n.slice(6));
  // Con extensión explícita se respeta el archivo pedido; si no existe, se busca por nombre.
  let entry = extOf(n) ? index.files[kind].get(lower) : null;
  const base = stripExt(lower);
  if (!entry) entry = index[kind].get(base);
  // Como las animaciones de Essentials ('Anim/<nombre>'), un SE puede estar en la subcarpeta Anim.
  if (!entry && kind === 'se' && !base.startsWith('anim/')) entry = index.se.get(`anim/${base}`);
  return entry ? describe(kind, entry) : null;
}

/**
 * Grito de una especie (ID de Añil en mayúsculas, p. ej. 'PIKACHU') con su forma.
 * Como Essentials (check_cry_file): prueba '<ID>_<forma><sufijo>' y después '<ID><sufijo>'.
 * `suffix` = '_faint' busca el grito específico de debilitado (p. ej. PIKACHU_faint.ogg).
 */
export function resolveCry(index, speciesId, form = 0, suffix = '') {
  if (!speciesId) return null;
  const id = String(speciesId).toUpperCase();
  const f = Number(form) || 0;
  if (!index) return resolveFile(null, 'cry', f > 0 ? `${id}_${f}${suffix}` : `${id}${suffix}`);
  if (f > 0) {
    const withForm = resolveFile(index, 'cry', `${id}_${f}${suffix}`);
    if (withForm) return withForm;
  }
  return resolveFile(index, 'cry', `${id}${suffix}`);
}

/** Lista de nombres canónicos de un tipo (para la jukebox), ordenada. */
export function listNames(index, kind) {
  if (!index || !index[kind]) return [];
  return [...index[kind].values()].map((e) => e.name).sort((a, b) => a.localeCompare(b, 'es'));
}

/** Información de bucle en segundos a partir de la entrada del índice → { startSec, endSec } | null. */
export function loopSecondsFromMeta(meta) {
  if (!meta || !meta.loop || !meta.rate) return null;
  const [start, length] = meta.loop;
  return { startSec: start / meta.rate, endSec: (start + length) / meta.rate };
}
