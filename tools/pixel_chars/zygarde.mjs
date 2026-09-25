// Core de Zygarde (acompañante de campo) y Célula de Zygarde como charsets 4×4 (nativo 32×32 ×2).
// Sprites ORIGINALES del creador del juego (25-09-2026), tal cual: tools/pixel_chars/originals/. No se redibujan.
//   zygarde_core.png   hoja 128×128 nativa (4×4 frames de 32×32: abajo, izquierda, derecha, arriba).
//   zygarde_celula.png el dibujo de la célula en la esquina de un lienzo de 128×128: la célula va QUIETA en el suelo
//                      (sin flotar ni destellos, por petición del creador), igual en los 16 frames.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Img, compose, sheet } from '../pixel.mjs';
import { NATIVE } from './assemble.mjs';

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'originals');
export const CORE_ORIGINAL = path.join(DIR, 'zygarde_core.png');
export const CELL_ORIGINAL = path.join(DIR, 'zygarde_celula.png');
const SHEET_NATIVE = NATIVE * 4;
/** Última fila del frame en la que se apoya la célula (base de la casilla, con 2 px de margen como los objetos de Añil). */
export const CELL_GROUND_Y = 29;

/** Hoja del Core: el original del creador sin cambios. */
export function buildCoreSheet() {
  const img = Img.load(CORE_ORIGINAL);
  if (img.w !== SHEET_NATIVE || img.h !== SHEET_NATIVE) {
    throw new Error(`zygarde_core original: se esperaba ${SHEET_NATIVE}×${SHEET_NATIVE}, mide ${img.w}×${img.h}`);
  }
  return img;
}

/** Dibujo de la célula recortado a su caja (del lienzo original). */
export function cellDrawing() {
  const src = Img.load(CELL_ORIGINAL);
  const box = src.bbox();
  if (!box || box.w > NATIVE || box.h > NATIVE) throw new Error('zygarde_celula original: dibujo vacío o mayor que un frame');
  return src.crop(box.x, box.y, box.w, box.h);
}

/** Hoja de la Célula: el dibujo original centrado y apoyado en el suelo, quieto, en los 16 frames. */
export function buildCellSheet() {
  const cell = cellDrawing();
  const frame = compose(NATIVE, NATIVE, [{ img: cell, x: Math.round((NATIVE - cell.w) / 2), y: CELL_GROUND_Y + 1 - cell.h }]);
  const row = [frame, frame, frame, frame];
  return sheet([row, row, row, row], NATIVE, NATIVE);
}
