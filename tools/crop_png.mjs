// Recorta una región de un PNG (p. ej. una previsualización grande de tools/preview_map.mjs) para revisarla de cerca.
// Uso: node tools/crop_png.mjs <entrada.png> <x> <y> <w> <h> [salida.png] [--tiles]   (--tiles: coordenadas en casillas de 32 px)
import fs from 'node:fs';
import { PNG } from 'pngjs';

const args = process.argv.slice(2);
const tiles = args.includes('--tiles');
const [input, ...rest] = args.filter((a) => !a.startsWith('--'));
if (!input || rest.length < 4) {
  console.error('Uso: node tools/crop_png.mjs <entrada.png> <x> <y> <w> <h> [salida.png] [--tiles]');
  process.exit(1);
}
const k = tiles ? 32 : 1;
const [x, y, w, h] = rest.slice(0, 4).map((v) => Number(v) * k);
const out = rest[4] || input.replace(/\.png$/i, `_crop.png`);
const src = PNG.sync.read(fs.readFileSync(input));
const cw = Math.max(1, Math.min(w, src.width - x));
const ch = Math.max(1, Math.min(h, src.height - y));
const dst = new PNG({ width: cw, height: ch });
PNG.bitblt(src, dst, x, y, cw, ch, 0, 0);
fs.writeFileSync(out, PNG.sync.write(dst));
console.log(`${out} (${cw}×${ch})`);
