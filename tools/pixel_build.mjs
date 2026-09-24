// Construye los sprites PROVISIONALES de personajes de Axis (D30) desde tools/pixel_chars/.
// Uso: node tools/pixel_build.mjs [id ...] [--preview] [--lineup] [--out=<carpeta>]
//   Escribe game/assets/characters/<id>.png (frames 64×64, nativo 32×32 ×2) y, con --preview,
//   vistas ampliadas en tools/cache/pixel/<id>.png para revisión. Con --out, los PNG van a otra
//   carpeta (p. ej. tools/cache/pixel/draft) para iterar sin tocar el juego en marcha.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Img, preview, strayPixels } from './pixel.mjs';
import { buildHumanSheet, exportSheet, SCALE } from './pixel_chars/assemble.mjs';
import { CHARACTERS } from './pixel_chars/roster.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outFlag = process.argv.find((a) => a.startsWith('--out='));
const OUT_DIR = outFlag ? path.resolve(ROOT, outFlag.slice(6)) : path.join(ROOT, 'game', 'assets', 'characters');
const PREVIEW_DIR = path.join(ROOT, 'tools', 'cache', 'pixel');

function buildOne(spec, only = null) {
  const outputs = [];
  for (const sheetSpec of spec.sheets) {
    if (only && !only.includes(spec.id) && !only.includes(sheetSpec.id)) continue;
    const native = sheetSpec.build ? sheetSpec.build() : buildHumanSheet(spec, sheetSpec.poses);
    const strays = strayPixels(native);
    if (strays.length) console.warn(`  aviso: ${sheetSpec.id} tiene ${strays.length} píxeles sueltos, p. ej. ${JSON.stringify(strays.slice(0, 4))}`);
    const file = path.join(OUT_DIR, `${sheetSpec.id}.png`);
    exportSheet(native, sheetSpec.scale).save(file);
    outputs.push({ id: sheetSpec.id, file, native, grid: sheetSpec.grid || 32, kind: sheetSpec.kind || 'charset' });
  }
  return outputs;
}

const LINEUP_PAGE = 12; // hojas por página de la alineación

/**
 * Alineación de los charsets (4 direcciones, patrones 0 y 1) sobre césped real de Añil, a escala de
 * juego y ampliada ×2 → tools/cache/pixel/_lineup.png, _lineup_2.png… (12 hojas por página).
 * Cada frame se alinea abajo-centro en celdas del tamaño del mayor frame de la página (como en el mapa).
 */
function lineup(outputs) {
  const grassSrc = Img.load(path.join(ROOT, 'Pokemon Anil V4.13', 'Graphics', 'Tilesets', 'Exterior1.png')).crop(0, 0, 128, 128);
  const charsets = outputs.filter((o) => o.kind === 'charset');
  const cols = 8;
  for (let page = 0; page * LINEUP_PAGE < charsets.length; page++) {
    const list = charsets.slice(page * LINEUP_PAGE, (page + 1) * LINEUP_PAGE);
    const cell = Math.max(...list.map((o) => o.grid)) * SCALE;
    const out = new Img(cols * cell, list.length * cell);
    for (let y = 0; y < out.h; y += 128) for (let x = 0; x < out.w; x += 128) out.blit(grassSrc, x, y);
    list.forEach((o, r) => {
      const frame = o.grid * SCALE;
      const sheetImg = exportSheet(o.native);
      for (let c = 0; c < cols; c++) {
        const dirRow = c % 4;
        const pattern = c < 4 ? 0 : 1;
        const f = sheetImg.crop(pattern * frame, dirRow * frame, frame, frame);
        out.blit(f, c * cell + (cell - frame) / 2, r * cell + cell - frame);
      }
    });
    const file = path.join(PREVIEW_DIR, page ? `_lineup_${page + 1}.png` : '_lineup.png');
    out.scale(2).save(file);
    console.log(`  alineación → ${path.relative(ROOT, file)} (${list.map((o) => o.id).join(', ')})`);
  }
}

function main() {
  const args = process.argv.slice(2);
  const wantPreview = args.includes('--preview');
  const wantLineup = args.includes('--lineup');
  const ids = args.filter((a) => !a.startsWith('--'));
  // Un id puede ser el de un personaje (todas sus hojas) o el de una hoja concreta.
  const list = CHARACTERS.filter((c) => !ids.length || ids.includes(c.id) || c.sheets.some((s) => ids.includes(s.id)));
  if (!list.length) throw new Error(`Ningún personaje ni hoja coincide con: ${ids.join(', ')}`);
  const all = [];
  for (const spec of list) {
    for (const out of buildOne(spec, ids.length ? ids : null)) {
      all.push(out);
      console.log(`✓ ${path.relative(ROOT, out.file)}`);
      if (wantPreview) {
        const file = path.join(PREVIEW_DIR, `${out.id}.png`);
        preview(out.native, { scale: 6, grid: out.grid, bg: '#88C070' }).save(file);
        console.log(`  vista → ${path.relative(ROOT, file)}`);
      }
    }
  }
  if (wantLineup) lineup(all);
}

try {
  main();
} catch (err) {
  console.error(`Error: ${err.message}`);
  process.exitCode = 1;
}
