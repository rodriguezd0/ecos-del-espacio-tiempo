// Genera game/data/audio_index.json: inventario del audio de Añil con metadatos de bucle.
// Uso: node tools/extract_audio.mjs
// El juego lo usa para resolver nombres sin pedir archivos inexistentes (sin 404) y la jukebox
// para listar pistas. Volver a ejecutarlo si cambia la carpeta Audio de Añil.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildAudioIndex, summarizeAudioIndex } from './lib/audio_index.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ANIL = path.join(ROOT, 'Pokemon Anil V4.13');
const OUT = path.join(ROOT, 'game', 'data', 'audio_index.json');

try {
  const t0 = Date.now();
  const index = buildAudioIndex(ANIL, { meta: true });
  fs.writeFileSync(OUT, JSON.stringify(index));
  const s = summarizeAudioIndex(index);
  console.log(`audio_index.json → ${OUT} (${Math.round(fs.statSync(OUT).size / 1024)} KB, ${Date.now() - t0} ms)`);
  console.log(`BGM ${s.bgm} (etiquetas de bucle: ${s.bgmWithLoopTags}, bucle válido: ${s.bgmWithValidLoop}) · ME ${s.me} · BGS ${s.bgs} · SE ${s.se} · gritos ${s.cries}`);
  const broken = Object.entries(index.bgm).filter(([, e]) => e.loopTags && !e.loop).map(([n]) => n);
  if (broken.length) console.log(`Etiquetas de bucle inválidas (se repite el archivo completo): ${broken.join(', ')}`);
} catch (err) {
  console.error(`Error generando el índice de audio: ${err.message}`);
  process.exitCode = 1;
}
