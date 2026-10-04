// Construcción común de los Pilares verticales: columna exterior y salas de piedra.
// Las coordenadas up/down son la casilla central de cada escalera, lista para un warp.
import { rectCells } from './brushes.js';

export function paintPillarExterior(b, { centerX, doorY }) {
  if (doorY < 9) throw new Error('La columna del Pilar necesita diez filas completas');
  if (centerX < 3 || centerX + 3 >= b.width || doorY >= b.height) throw new Error('La columna del Pilar debe caber entera en el mapa');
  return b.stamp('pilar_torre', centerX - 3, doorY - 9);
}

export function buildPilarHall(b, { floor, up = null, down = null, pedestal = null, columns = true }) {
  b.fill(0, 'vacio');
  const r = floor || { x: 3, y: 4, w: b.width - 6, h: b.height - 6 };
  const cells = rectCells(r.x, r.y, r.w, r.h).filter(([x, y]) => {
    const dx = Math.min(x - r.x, r.x + r.w - 1 - x);
    const dy = Math.min(y - r.y, r.y + r.h - 1 - y);
    return dx + dy >= 2;
  });
  b.paint('pilar_enlosado', cells);
  if (columns) for (const x of [r.x + 1, r.x + r.w - 2]) {
    for (const y of [r.y + 1, r.y + r.h - 5]) b.stamp('pilar_columna', x, y);
  }
  for (const s of [up, down].filter(Boolean)) {
    b.paint('pilar_enlosado', rectCells(s.x - 1, s.y - 1, 3, 4));
    b.stamp('pilar_escalinata', s.x - 1, s.y - 1);
  }
  if (pedestal) {
    b.stamp('pilar_camara_nucleo', pedestal.x - 2, pedestal.y - 2);
    b.stamp('pilar_pedestal', pedestal.x, pedestal.y - 1);
  }
}
