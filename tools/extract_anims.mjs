// Extrae las animaciones de combate de Añil (Data/PkmnAnimations.rxdata) a game/data/anims/:
//   index.json  { moves, oppMoves, common, names }  (como move2anim.dat + nombres para las variantes "hit N")
//   <n>.json    animación n (ver tools/lib/anilAnims.mjs), se cargan bajo demanda al usar el movimiento
// Uso: node tools/extract_anims.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadMarshal } from './lib/marshal.mjs';
import { convertAnimation, buildIndex } from './lib/anilAnims.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'Pokemon Anil V4.13', 'Data', 'PkmnAnimations.rxdata');
const OUT = path.join(ROOT, 'game', 'data', 'anims');

try {
  const anims = loadMarshal(fs.readFileSync(SRC), { keepIvars: true }).array || [];
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  let bytes = 0;
  let n = 0;
  anims.forEach((a, i) => {
    if (!a) return;
    const json = JSON.stringify(convertAnimation(a));
    fs.writeFileSync(path.join(OUT, `${i}.json`), json);
    bytes += json.length;
    n += 1;
  });
  const index = buildIndex(anims);
  fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(index));
  console.log(`Animaciones: ${n} (${Math.round(bytes / 1024)} KB) · movimientos ${Object.keys(index.moves).length} · rival ${Object.keys(index.oppMoves).length} · comunes ${Object.keys(index.common).length}`);
} catch (err) {
  console.error(`Error extrayendo animaciones: ${err.message}`);
  process.exitCode = 1;
}
