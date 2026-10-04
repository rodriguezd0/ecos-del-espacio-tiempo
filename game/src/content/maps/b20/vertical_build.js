// Arte vertical P10. Las salas/puzzles conservan sus rejillas; solo se sustituyen las bocas entre plantas.
import { paintPillarExterior } from '../../stamps/pilarVertical.js';

export const ORIGIN_EXTERIOR = Object.freeze({ centerX: 18, doorY: 37 });

export function paintOriginExterior(b) {
  // La roca del Umbral sigue sosteniendo la columna. Retirar el dintel anterior evita que se vea sobre la fachada.
  for (let y = 28; y <= 37; y++) for (let x = 15; x <= 21; x++) b.set(2, x, y, 0);
  paintPillarExterior(b, ORIGIN_EXTERIOR);
}

export function paintOriginStair(b, at) {
  const cells = [];
  for (let y = at.y - 1; y <= at.y + 1; y++) for (let x = at.x - 1; x <= at.x + 1; x++) cells.push([x, y]);
  b.paint('pilar_enlosado', cells);
  b.stamp('pilar_escalinata', at.x - 1, at.y - 1);
}
