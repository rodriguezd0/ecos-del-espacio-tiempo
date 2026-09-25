// Ala del Sentir (Mesprit) — reglas puras de las salas de espejos (docs/CAMPANA.md B16: «el reflejo del jugador se
// mueve invertido. Mesprit se esconde entre reflejos; hay que llevar el reflejo propio hasta el suyo»; D17). Sin ctx ni
// DOM: lo usan los eventos (b16_sentir.js), la construcción del mapa y las pruebas (solucionador).
//
// Cada sala es una rejilla de 17×8 (el suelo de la habitación): columnas 0–7 = mundo del jugador, 8 = el espejo,
// 9–16 = el reflejo. Al dar el jugador un paso hacia `d`, su reflejo intenta darlo hacia el espejo de `d` (izquierda y
// derecha se invierten; arriba y abajo no). Si el reflejo choca, se queda quieto: así se descompensan y se puede llevar
// el reflejo a la casilla de Mesprit (M). La casilla simétrica de M en el lado del jugador siempre está ocupada (no
// basta con ir «al mismo sitio»). Los señuelos (d) son reflejos de Mesprit que se desvanecen: solo decoran.
// Leyenda: '#' obstáculo · '.' suelo · '|' espejo · 'P' entrada del jugador · 'M' Mesprit · 'd' señuelo.

export const ROOM_W = 17;
export const ROOM_H = 8;
export const MIRROR_X = 8;

/** Dirección del reflejo para un paso del jugador (2 abajo, 4 izquierda, 6 derecha, 8 arriba). */
export const MIRROR_DIR = Object.freeze({ 2: 2, 8: 8, 4: 6, 6: 4 });
const DV = Object.freeze({ 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] });

/** Casilla simétrica respecto al espejo. */
export const mirrorX = (x) => 2 * MIRROR_X - x;

const ROOMS_ASCII = Object.freeze({
  // «El orgullo de Leandro» (12 pasos como mínimo)
  1: [
    '........|......#.',
    '......#.|.M......',
    '.#..#...|........',
    '....#...|.d......',
    '.#...#..|...#....',
    '.....#..|......d.',
    '....#...|.#...#..',
    '#P.#....|.#.#...#',
  ],
  // «La carga de Fermín» (20)
  2: [
    '.##..#..|#....#M.',
    '..#.....|.d......',
    '...#....|...###.#',
    '.#...#..|......#.',
    '...##...|.#......',
    '.......#|..##.##.',
    '....#..#|....#.d.',
    '#P#..#.#|.#.....#',
  ],
  // «El miedo de Fausto» (28)
  3: [
    '####....|..#..#..',
    '.......#|M..#....',
    '...#.#..|....##..',
    '....#.#.|........',
    '.##....#|...d....',
    '#.......|.......#',
    '...##...|......d.',
    '#P......|.......#',
  ],
});

/** Sala `n` (1–3): { n, rows, start: [x, y], reflection: [x, y], target: [x, y], decoys: [[x, y]…], blocked(x, y) }. */
export function mirrorRoom(n) {
  const rows = ROOMS_ASCII[n];
  if (!rows) throw new Error(`Sala de espejos inexistente: ${n}`);
  let start = null;
  let target = null;
  const decoys = [];
  rows.forEach((r, y) => {
    if (r.length !== ROOM_W) throw new Error(`Sala ${n}: la fila ${y} mide ${r.length} (se esperaban ${ROOM_W})`);
    [...r].forEach((c, x) => {
      if (c === 'P') start = [x, y];
      if (c === 'M') target = [x, y];
      if (c === 'd') decoys.push([x, y]);
    });
  });
  const obstacle = (x, y) => rows[y][x] === '#';
  const blocked = (x, y) => x < 0 || y < 0 || x >= ROOM_W || y >= ROOM_H || x === MIRROR_X || obstacle(x, y);
  const obstacles = [];
  rows.forEach((r, y) => [...r].forEach((c, x) => { if (c === '#') obstacles.push([x, y]); }));
  return Object.freeze({ n, rows, start, reflection: [mirrorX(start[0]), start[1]], target, decoys, obstacles, blocked });
}

export const MIRROR_ROOMS = Object.freeze([1, 2, 3].map(mirrorRoom));

/**
 * Un paso: el jugador intenta ir hacia `d` desde `s` = [px, py, rx, ry]. Si el jugador choca no pasa nada (null);
 * si no, el reflejo intenta el paso espejado y se queda quieto si choca. → nuevo estado o null.
 */
export function mirrorStep(room, s, d) {
  const [dx, dy] = DV[d];
  const px = s[0] + dx;
  const py = s[1] + dy;
  if (room.blocked(px, py)) return null;
  const [mdx, mdy] = DV[MIRROR_DIR[d]];
  let rx = s[2] + mdx;
  let ry = s[3] + mdy;
  if (room.blocked(rx, ry)) { rx = s[2]; ry = s[3]; }
  return [px, py, rx, ry];
}

/** ¿El reflejo está sobre Mesprit? */
export const reachedTarget = (room, s) => s[2] === room.target[0] && s[3] === room.target[1];

/** Camino más corto (lista de direcciones del jugador) desde el estado `from` (por defecto, el inicial) o null. */
export function solveMirror(room, from = null) {
  const start = from || [...room.start, ...room.reflection];
  const k = (s) => s.join(',');
  const prev = new Map([[k(start), null]]);
  const queue = [start];
  while (queue.length) {
    const s = queue.shift();
    if (reachedTarget(room, s)) {
      const path = [];
      let c = k(s);
      while (prev.get(c)) { const [pk, d] = prev.get(c); path.unshift(d); c = pk; }
      return path;
    }
    for (const d of [2, 4, 6, 8]) {
      const n = mirrorStep(room, s, d);
      if (!n || prev.has(k(n))) continue;
      prev.set(k(n), [k(s), d]);
      queue.push(n);
    }
  }
  return null;
}

/** Emoción que muestra cada captura (CAMPANA B16: «el orgullo de Leandro, la carga de Fermín, el miedo de Fausto»). */
export const MIRROR_EMOTIONS = Object.freeze({
  1: Object.freeze({ who: 'leandro', emotion: 'el orgullo de Leandro' }),
  2: Object.freeze({ who: 'fermin', emotion: 'la carga de Fermín' }),
  3: Object.freeze({ who: 'fausto', emotion: 'el miedo de Fausto' }),
});
