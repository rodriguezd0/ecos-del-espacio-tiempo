// Ala del Querer (Azelf) — reglas puras del pasillo del viento (docs/CAMPANA.md B16: «pasillo donde el viento de Azelf
// empuja hacia atrás si el jugador se detiene (sin castigo: vuelve a la última repisa)»). Sin ctx ni DOM.
//
// El pasillo es una serpentina de 9×17 casillas (suelo de la sala): carriles horizontales separados por canales de
// resonancia ('#') con un solo hueco que se alterna a izquierda y derecha. Las repisas ('R', losas claras) son los
// únicos sitios donde se puede parar. 'S' = entrada (también repisa). Quien se detiene fuera de una repisa más de
// STILL_FRAMES fotogramas vuelve empujado, por el camino más corto, a la última repisa que pisó.

export const STILL_FRAMES = 45; // 0,75 s a 60 Hz: margen para girar en los huecos sin soltar la dirección
export const CORRIDOR_W = 9;

export const CORRIDOR_ROWS = Object.freeze([
  '....R....',
  '#.#######',
  '.........',
  '#######.#',
  '.........',
  '#.#######',
  'R........',
  '#######.#',
  '.........',
  '#.#######',
  '.........',
  '#######.#',
  '........R',
  '#.#######',
  '.........',
  '#######.#',
  '#...S...#',
]);
export const CORRIDOR_H = CORRIDOR_ROWS.length;

const DV = Object.freeze({ 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] });
const cell = (x, y) => (x >= 0 && y >= 0 && x < CORRIDOR_W && y < CORRIDOR_H ? CORRIDOR_ROWS[y][x] : '#');

/** ¿Casilla de suelo del pasillo? (coordenadas locales) */
export const isFloor = (x, y) => cell(x, y) !== '#';
/** ¿Repisa (se puede parar)? La entrada y la salida también lo son. */
export const isLedge = (x, y) => cell(x, y) === 'R' || cell(x, y) === 'S';

const find = (ch) => {
  const out = [];
  CORRIDOR_ROWS.forEach((r, y) => [...r].forEach((c, x) => { if (c === ch) out.push([x, y]); }));
  return out;
};
export const START = Object.freeze(find('S')[0]);
export const LEDGES = Object.freeze([START, ...find('R')].map((c) => Object.freeze(c)));
/** Repisa de salida (la de arriba del todo): desde ella se sube a la cámara de Azelf. */
export const EXIT = Object.freeze(LEDGES.reduce((a, b) => (b[1] < a[1] ? b : a)));
/** Obstáculos (canales) en coordenadas locales. */
export const WALLS = Object.freeze(find('#').map((c) => Object.freeze(c)));

/** Camino más corto dentro del pasillo de (x0, y0) a (x1, y1) → lista de direcciones (2/4/6/8) o null. */
export function corridorPath(x0, y0, x1, y1) {
  if (!isFloor(x0, y0) || !isFloor(x1, y1)) return null;
  const key = (x, y) => `${x},${y}`;
  const prev = new Map([[key(x0, y0), null]]);
  const queue = [[x0, y0]];
  while (queue.length) {
    const [x, y] = queue.shift();
    if (x === x1 && y === y1) {
      const out = [];
      let k = key(x, y);
      while (prev.get(k)) { const [pk, d] = prev.get(k); out.unshift(d); k = pk; }
      return out;
    }
    for (const d of [8, 2, 4, 6]) {
      const nx = x + DV[d][0];
      const ny = y + DV[d][1];
      if (!isFloor(nx, ny) || prev.has(key(nx, ny))) continue;
      prev.set(key(nx, ny), [key(x, y), d]);
      queue.push([nx, ny]);
    }
  }
  return null;
}

/** Tramos sin repisa entre repisas consecutivas (longitud en pasos), para las pruebas y el E2E. */
export function ledgeLegs() {
  const order = [...LEDGES].sort((a, b) => b[1] - a[1]);
  const legs = [];
  for (let i = 0; i + 1 < order.length; i++) legs.push(corridorPath(...order[i], ...order[i + 1]).length);
  return legs;
}
