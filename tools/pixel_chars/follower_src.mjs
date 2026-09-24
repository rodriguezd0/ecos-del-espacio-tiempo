// Lectura de las tiras de seguidor de Añil (Graphics/Characters/Followers) como frames NATIVOS
// (se muestrea 1 de cada 2 píxeles: las hojas de Añil están dibujadas a ×2, casi siempre exacto).
// Se usan como BASE de las monturas de Zygarde (CAMPANA §2.7): 10% = ZYGARDE_1.png, 50% = ZYGARDE.png.
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Img } from '../pixel.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const FOLLOWERS = path.join(ROOT, 'Pokemon Anil V4.13', 'Graphics', 'Characters', 'Followers');

const cache = new Map();

/** Hoja de seguidor → frames[fila][col] nativos (Img). Lanza si falta el archivo. */
export function followerFrames(name) {
  if (cache.has(name)) return cache.get(name);
  const file = path.join(FOLLOWERS, `${name}.png`);
  if (!fs.existsSync(file)) throw new Error(`Falta el seguidor de Añil ${file}`);
  const src = Img.load(file);
  const fw = src.w / 4;
  const fh = src.h / 4;
  const frames = [];
  for (let r = 0; r < 4; r++) {
    const row = [];
    for (let c = 0; c < 4; c++) {
      const f = new Img(fw / 2, fh / 2);
      for (let y = 0; y < f.h; y++) {
        for (let x = 0; x < f.w; x++) {
          const p = src.get(c * fw + x * 2, r * fh + y * 2);
          f.set(x, y, p[3] >= 128 ? [p[0], p[1], p[2], 255] : [0, 0, 0, 0]);
        }
      }
      row.push(f);
    }
    frames.push(row);
  }
  cache.set(name, frames);
  return frames;
}

/** Desplazamiento vertical (bote) de cada patrón respecto al patrón 0 de la misma fila. */
export function bobOffsets(row) {
  const top = (img) => img.bbox()?.y ?? 0;
  const t0 = top(row[0]);
  return row.map((f) => top(f) - t0);
}
