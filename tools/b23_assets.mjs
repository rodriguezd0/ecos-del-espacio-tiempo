// Hojas4×4 de objetos de Almenara. Pixel art procedural con fondo transparente, reproducible y verificable.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'game/assets/objects'); fs.mkdirSync(out, { recursive: true });
function generate(name, w, h, paint) {
  const png = new PNG({ width: w * 4, height: h * 4 });
  for (let row = 0; row < 4; row++) for (let frame = 0; frame < 4; frame++) {
    const pixel = (x, y, color) => {
      if (x < 0 || x >= w || y < 0 || y >= h) return;
      const i = ((row * h + y) * png.width + frame * w + x) * 4;
      png.data[i] = color[0]; png.data[i + 1] = color[1]; png.data[i + 2] = color[2]; png.data[i + 3] = color[3] ?? 255;
    };
    paint(pixel, row, frame);
  }
  const file = path.join(out, `${name}.png`), data = PNG.sync.write(png);
  if (process.argv.includes('--check')) { if (!fs.existsSync(file) || !fs.readFileSync(file).equals(data)) throw new Error(`Arte pendiente: ${name}`); }
  else fs.writeFileSync(file, data);
}
generate('b23_anillo', 48, 48, (p, row, frame) => {
  for (let y = 0; y < 46; y++) for (let x = 0; x < 48; x++) {
    const r = Math.hypot((x - 23.5) * 0.9, y - 22.5);
    if (r > 15 && r < 19) p(x, y, r > 18 ? [67, 38, 65] : ((x + y + frame) % 5 ? [219, 165, 71] : [255, 233, 159]));
    if (r < 15 && (x + y + frame) % 7 === 0) p(x, y, [107, 66, 134, row === 3 ? 60 : 170]);
  }
});
generate('b23_cristal', 16, 32, (p, row, frame) => {
  for (let y = 5; y < 27; y++) for (let x = 2; x < 14; x++) if (Math.abs(x - 7.5) < Math.min((y - 4) * 0.7, (28 - y) * 0.7))
    p(x, y, (x + frame) % 4 ? [85, 190 + row * 14, 114] : [205, 255, 162]);
});
generate('b23_extractor', 32, 40, (p, row, frame) => {
  for (let y = 10; y < 38; y++) for (let x = 3; x < 29; x++)
    p(x, y, x === 3 || x === 28 || y === 10 || y === 37 ? [36, 44, 56] : [104 + (x % 4) * 9, 116, 121]);
  for (let y = 14; y < 25; y++) for (let x = 7; x < 25; x++) p(x, y, [22, 34, 40]);
  for (let y = 17; y < 22; y++) for (let x = 9; x < 23; x++) p(x, y, row === 1 ? [89, 203, 140] : [170 + frame * 12, 86, 100]);
  for (let y = 2; y < 11; y++) for (let x = 12; x < 20; x++) p(x, y, [91, 110, 119]);
  for (const x of [8, 14, 20, 25]) p(x, 30, [234, 199, 92]);
});
generate('b23_vasija', 16, 24, (p, row, frame) => {
  for (let y = 4; y < 21; y++) for (let x = 3; x < 13; x++) if (y < 7 ? x > 4 && x < 11 : y > 18 ? x > 4 && x < 11 : true)
    p(x, y, x < 5 ? [97, 54, 40] : x > 10 ? [80, 48, 45] : [177 + frame * 3, 122, 77]);
  for (let x = 4; x < 12; x++) p(x, 6, [219, 178, 103]);
  for (const [x, y] of [[7, 11], [8, 12], [9, 13], [8, 14], [7, 15], [6, 14], [5, 13], [6, 12]]) p(x, y, [94, 60, 122]);
});
console.log('Almenara: 4 hojas de objetos listas');
