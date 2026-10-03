// Escaleras de piedra del P6. El suelo se reserva antes de pintar las islas para no recortar sus accesos.
import { rectSet } from './paint.js';

export function stairFloor(...stairs) {
  return rectSet(...stairs.map((s) => ({ x0: s.x - 1, y0: s.y - 1, x1: s.x + 1, y1: s.y + 1 })));
}

export function paintStair(b, stair) {
  b.stamp('pilar_escalinata', stair.x - 1, stair.y - 1);
}
