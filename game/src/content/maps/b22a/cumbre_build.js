// Construcción de la Cumbre Azur (tileset 1, 30×40): una cresta de nieve y roca por encima del mar de nubes. La base
// (llegada desde el mirador de la Senda del Lazo), dos mesetas escalonadas con caras de terraza nevada (las mismas
// piezas que la Senda, B15) y, arriba, el dintel de los Custodios bajo la columna de luz. Ruinas del kit exterior de
// Pilar (monolitos, columnas quebradas, glifos, una estela partida). El mar de nubes rodea la cresta y no se pisa (muro
// invisible). Coordenadas en ./layout.js; piezas nevadas de ../b15/pieces.js y ayudas de ../b15/paint.js (solo lectura).
import { CUMBRE as C, rect } from './layout.js';
import { safeStamp, decorate, reservedFrom, openMask, hash } from '../b15/paint.js';
import { cumbreEvents } from '../../events/b22a_senda.js';

const key = (x, y) => `${x},${y}`;
const inRect = (r, x, y) => x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1;

/** ¿Es (x, y) suelo pisable de la cresta (antes de los detalles)? */
export function cumbreFloor(x, y) {
  return Object.values(C.floors).some((r) => inRect(r, x, y));
}

/** Casillas del camino de la subida (tramos rectos entre los puntos de C.route). */
export function routeCells() {
  const out = [];
  for (let i = 0; i + 1 < C.route.length; i++) {
    const [x0, y0] = C.route[i];
    const [x1, y1] = C.route[i + 1];
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let k = 0; k <= n; k++) out.push([x0 + Math.sign(x1 - x0) * k, y0 + Math.sign(y1 - y0) * k]);
  }
  return out;
}

/** ¿Está (x, y) dentro de la cresta (suelo o roca de las terrazas)? Fuera, el mar de nubes. */
function ridge(x, y) {
  if (inRect(C.floors.base, x, y)) return true;
  return C.plateaus.some((p) => x >= p.x0 && x <= p.x1 && y <= p.faceBottom);
}

export function buildCumbre(b) {
  const W = C.width;
  const H = C.height;
  b.fill(0, 'nieve');
  const clouds = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!ridge(x, y)) clouds.push([x, y]);
  b.paint('mar_nubes', clouds, { layer: 0 });
  // Mesetas escalonadas (la de arriba dentro de la de abajo) y sus escaleras.
  for (const p of C.plateaus) b.blob(null, rect(p.x0, -4, p.x1, p.faceBottom), 'terraza_nevada');
  C.stairs.forEach((s) => b.stamp('escalera_terraza', s.x, s.y));
  // Sendero pisado en la nieve.
  const route = routeCells();
  b.paint('nieve_parche', route.filter(([x, y]) => cumbreFloor(x, y) && y > 3));
  // Dintel de los Custodios bajo la columna de luz y ruinas.
  b.stamp('pilar_dintel', C.gate.x, C.gate.y);
  for (const [x, y] of C.ruins.monoliths) b.stamp('pilar_monolito', x, y);
  for (const [x, y] of C.ruins.broken) b.stamp('pilar_columna_quebrada', x, y);
  for (const [x, y] of C.ruins.glyphs) b.stamp('pilar_glifo', x, y);
  b.stamp('pilar_placa_unown', C.stele.x, C.stele.y);
  // Detalles nevados solo en suelo despejado, lejos del camino, de los eventos y de las escaleras.
  const events = cumbreEvents();
  const stairs = C.stairs.flatMap((s) => rect(s.x - 1, s.y - 1, s.x + 3, s.y + 3));
  const reserved = reservedFrom(events, [...route, ...stairs, ...rect(12, 1, 18, 5)]);
  const nearRoute = openMask([route], 1);
  const avoid = (x, y) => reserved(x, y) || nearRoute(x, y) || !cumbreFloor(x, y);
  decorate(b, [
    ['pino_nevado_peque', 11, 31], ['pino_nevado_peque', 18, 33], ['roca_gris', 12, 38], ['arbusto_nevado', 18, 38],
    ['tocon_nevado', 11, 34], ['montones_nieve', 17, 36],
    ['pino_nevado_peque', 19, 17], ['roca_grande', 10, 17], ['arbusto_nevado', 20, 26], ['roca_gris', 17, 19],
    ['tocon_nevado', 14, 25], ['montones_nieve', 18, 21],
    ['roca_gris', 17, 12], ['arbusto_nevado', 13, 7], ['tocon_nevado', 18, 10], ['montones_nieve', 16, 9],
  ], { avoid });
  // Brotes y guijarros sueltos (1×1) repartidos con semilla, para que la nieve no quede vacía.
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (avoid(x, y) || hash(x, y, 71) > 0.07) continue;
      safeStamp(b, hash(y, x, 73) < 0.5 ? 'guijarros' : 'matas_nieve', x, y, { avoid });
    }
  }
  // Mar de nubes y rincones sin salida: muro invisible (tile vacío que bloquea) donde no hay nada en la capa 2.
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (cumbreFloor(x, y) || b.get(2, x, y)) continue;
      if (!ridge(x, y) || y <= 2) b.paint('muro_invisible', [[x, y]]);
    }
  }
}

export { key };
