// Índice de audio de Añil (Node): lista BGM/ME/BGS/SE/gritos y, opcionalmente, lee metadatos
// (frecuencia, duración, bucle LOOPSTART/LOOPLENGTH) con el parser compartido del juego.
// Lo usan tools/extract_audio.mjs (→ game/data/audio_index.json) y los tests.
import fs from 'node:fs';
import path from 'node:path';
import { parseAudioMeta } from '../../game/src/audio/oggMeta.js';

export const AUDIO_EXTENSIONS = ['.ogg', '.wav', '.mp3'];
const MUSIC_DIRS = { bgm: 'BGM', me: 'ME', bgs: 'BGS' };

function listFiles(dir, prefix = '') {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && AUDIO_EXTENSIONS.includes(path.extname(e.name).toLowerCase()))
    .map((e) => prefix + e.name)
    .sort((a, b) => a.localeCompare(b, 'en'));
}

function round(n, digits = 3) {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}

function musicEntry(dir, file, withMeta) {
  const entry = { file };
  if (!withMeta) return entry;
  try {
    const meta = parseAudioMeta(fs.readFileSync(path.join(dir, file)));
    if (!meta) return entry;
    entry.rate = meta.sampleRate;
    entry.duration = round(meta.duration);
    if (meta.loopTags) entry.loopTags = true;
    if (meta.loop) entry.loop = [meta.loop.start, meta.loop.length];
  } catch (err) {
    entry.error = String(err.message || err);
  }
  return entry;
}

/**
 * Construye el índice a partir de `<anilRoot>/Audio`.
 * opts.meta = false → solo nombres (rápido; sin leer los archivos de música).
 */
export function buildAudioIndex(anilRoot, { meta = true } = {}) {
  const audioRoot = path.join(anilRoot, 'Audio');
  if (!fs.existsSync(audioRoot)) throw new Error(`No existe la carpeta de audio de Añil: ${audioRoot}`);
  const index = { version: 1, source: 'Pokemon Anil V4.13/Audio' };
  for (const [kind, dirName] of Object.entries(MUSIC_DIRS)) {
    const dir = path.join(audioRoot, dirName);
    index[kind] = {};
    for (const file of listFiles(dir)) {
      const name = file.slice(0, -path.extname(file).length);
      const prev = index[kind][name];
      // Si existen "X.ogg" y "X.wav", se conserva el Ogg (mismo criterio que el reproductor).
      if (prev && path.extname(prev.file).toLowerCase() === '.ogg') continue;
      index[kind][name] = musicEntry(dir, file, meta);
    }
  }
  const seDir = path.join(audioRoot, 'SE');
  index.se = [...listFiles(seDir), ...listFiles(path.join(seDir, 'Anim'), 'Anim/')];
  index.cries = listFiles(path.join(seDir, 'Cries'));
  return index;
}

/** Resumen legible (para la salida de la herramienta). */
export function summarizeAudioIndex(index) {
  const bgm = Object.values(index.bgm);
  return {
    bgm: bgm.length,
    bgmWithLoopTags: bgm.filter((e) => e.loopTags).length,
    bgmWithValidLoop: bgm.filter((e) => e.loop).length,
    me: Object.keys(index.me).length,
    bgs: Object.keys(index.bgs).length,
    se: index.se.length,
    cries: index.cries.length,
  };
}
