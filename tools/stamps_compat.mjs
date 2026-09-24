// Compatibilidad de una biblioteca de stamps con otro tileset: lista los stamps/brushes cuyos tiles son
// idénticos píxel a píxel (y cuyos autotiles tienen el mismo gráfico) en el tileset destino.
// Uso: node tools/stamps_compat.mjs <tilesetOrigen> <tilesetDestino> [--js]
//   --js imprime las listas como constantes JS para pegarlas en la definición del destino.
import { loadStampLibrary } from '../game/src/content/stamps/index.js';
import { paintBrush, brushDemo } from '../game/src/content/stamps/brushes.js';
import { originalTileset, sameTile, tilesetInfo } from './stamps_lib.mjs';
import { FIRST_REGULAR_TILE, isAutotile, autotileSlot } from '../game/src/shared/autotile.js';

function compatible(ids, pngA, pngB, tsA, tsB) {
  for (const id of ids) {
    if (!id) continue;
    if (id >= FIRST_REGULAR_TILE) {
      if (!sameTile(pngA, pngB, id)) return false;
    } else if (isAutotile(id) && tsA.autotiles[autotileSlot(id)] !== tsB.autotiles[autotileSlot(id)]) return false;
  }
  return true;
}

async function main() {
  const [from, to] = process.argv.slice(2).filter((a) => !a.startsWith('--')).map(Number);
  if (!Number.isFinite(from) || !Number.isFinite(to)) throw new Error('Uso: node tools/stamps_compat.mjs <origen> <destino> [--js]');
  const lib = await loadStampLibrary(from);
  const tsA = tilesetInfo(lib.tileset); const tsB = tilesetInfo(to);
  const pngA = originalTileset(tsA.image); const pngB = originalTileset(tsB.image);
  const okStamps = []; const badStamps = [];
  for (const s of Object.values(lib.stamps)) {
    const ids = s.layers.flatMap((g) => g || []);
    (compatible(ids, pngA, pngB, tsA, tsB) ? okStamps : badStamps).push(s.name);
  }
  const okBrushes = []; const badBrushes = [];
  for (const [name, b] of Object.entries(lib.brushes)) {
    const ids = paintBrush(b, brushDemo(b).cells, { seed: 1 }).map((w) => w.id);
    (compatible(ids, pngA, pngB, tsA, tsB) ? okBrushes : badBrushes).push(name);
  }
  if (process.argv.includes('--js')) {
    console.log(`const SHARED_STAMPS = ${JSON.stringify(okStamps)};`);
    console.log(`const SHARED_BRUSHES = ${JSON.stringify(okBrushes)};`);
    return;
  }
  console.log(`${lib.image} → ${tsB.image}`);
  console.log(`stamps compatibles (${okStamps.length}): ${okStamps.join(', ')}`);
  console.log(`stamps distintos (${badStamps.length}): ${badStamps.join(', ')}`);
  console.log(`brushes compatibles (${okBrushes.length}): ${okBrushes.join(', ')}`);
  console.log(`brushes distintos (${badBrushes.length}): ${badBrushes.join(', ')}`);
}

main().catch((err) => {
  console.error(`stamps_compat: ${err.message}`);
  process.exit(1);
});
