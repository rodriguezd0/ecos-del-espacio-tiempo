// Detecta objetos en un tileset original: componentes conexas (4 vecinos) de tiles no transparentes.
// Útil para obtener rectángulos `src` de edificios y objetos separados por tiles vacíos.
// Uso: node tools/stamps_components.mjs <Imagen> [--rows=a-b] [--min=2]
import { originalTileset, isEmptyTile } from './stamps_lib.mjs';
import { FIRST_REGULAR_TILE } from '../game/src/shared/autotile.js';

function main() {
  const args = process.argv.slice(2);
  const image = args.find((a) => !a.startsWith('--'));
  if (!image) throw new Error('Uso: node tools/stamps_components.mjs <Imagen> [--rows=a-b] [--min=2]');
  const opt = (k, d) => { const a = args.find((s) => s.startsWith(`--${k}=`)); return a ? a.split('=')[1] : d; };
  const png = originalTileset(image);
  const rows = Math.floor(png.height / 32);
  const [r0, r1] = String(opt('rows', `0-${rows - 1}`)).split('-').map(Number);
  const min = Number(opt('min', 2));
  const filled = (x, y) => y >= r0 && y <= r1 && x >= 0 && x < 8 && !isEmptyTile(png, FIRST_REGULAR_TILE + y * 8 + x);
  const seen = new Set();
  const comps = [];
  for (let y = r0; y <= r1; y++) {
    for (let x = 0; x < 8; x++) {
      const k = `${x},${y}`;
      if (seen.has(k) || !filled(x, y)) continue;
      const stack = [[x, y]]; seen.add(k);
      let minX = x; let maxX = x; let minY = y; let maxY = y; let n = 0;
      while (stack.length) {
        const [cx, cy] = stack.pop(); n++;
        minX = Math.min(minX, cx); maxX = Math.max(maxX, cx); minY = Math.min(minY, cy); maxY = Math.max(maxY, cy);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = cx + dx; const ny = cy + dy; const nk = `${nx},${ny}`;
          if (!seen.has(nk) && filled(nx, ny)) { seen.add(nk); stack.push([nx, ny]); }
        }
      }
      if (n >= min) comps.push({ src: [minX, minY, maxX - minX + 1, maxY - minY + 1], tiles: n });
    }
  }
  comps.sort((a, b) => a.src[1] - b.src[1] || a.src[0] - b.src[0]);
  for (const c of comps) console.log(`src: [${c.src.join(', ')}]  (${c.tiles} tiles)`);
}

try {
  main();
} catch (err) {
  console.error(`stamps_components: ${err.message}`);
  process.exit(1);
}
