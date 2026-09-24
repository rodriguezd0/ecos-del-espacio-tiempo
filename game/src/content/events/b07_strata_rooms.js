// Salas del rescate estratigráfico de la Cantería Solano (docs/TABLILLAS.md T04). Cada sala es una cadena ASCII
// (reglas y leyenda en ./b07_strata_logic.js): lo que se pinta en content/maps/b07/canteria_solano.js, lo que
// crean los eventos de content/events/b07_galerias.js y lo que resuelve tests/b07_strata.test.mjs es lo mismo.
// Las pilas se leen de arriba abajo en la pantalla: arriba (norte) la capa más joven, abajo la más antigua. Quien
// entra por el sur topa primero con la capa que sostiene a las demás: hay que dar la vuelta y empezar por arriba.
//
//   'U' cuerda para volver a la sala anterior   'V' veta de piedra activadora (pared; despierta con la Tablilla)
//   'P' tabla de tiza de Quino con el orden de las capas (cartel)
import { parseRoom } from './b07_strata_logic.js';

/** Sala 1 · Galería del Ocre (tutorial): una pila de dos capas sobre el primer Timburr. */
export const SALA1 = Object.freeze([
  '#.........#',
  '#.###a###.#',
  '#.##.bT##.#',
  '#.#P.####.#',
  '#.........#',
  '#E...S....#',
]);

/** Sala 2 · Galería de la Arcilla: dos pilas de tres capas; a sus cimas se baja por salientes desde la pasarela. */
export const SALA2 = Object.freeze([
  '#o............#',
  '###v######v##.#',
  '###.######.##.#',
  '###a######b##.#',
  '###b######cT#.#',
  '##Tc######.##.#',
  '###.######.##a#',
  '#.............#',
  '#E....US......#',
]);

/** Sala 3 · El último estrato: Quino bajo tres capas y la gran pila de cuatro sobre la Tablilla. */
export const SALA3 = Object.freeze([
  '#.............#',
  '#.##v#####vv#.#',
  '#.##.#####..#.#',
  '#.##a#####ab#.#',
  '#.##b#####cb#.#',
  '#.#Qc#####dcV.#',
  '#a##.#####.d#.#',
  '#.............#',
  '#.....US.....o#',
]);

/** Metadatos por sala: nombre, suelo de cueva y rótulo de la placa de Quino a la entrada. */
export const ROOMS = Object.freeze({
  1: Object.freeze({ n: 1, ascii: SALA1, name: 'Galería del Ocre', floor: 'sala', strata: ['a', 'b'] }),
  2: Object.freeze({ n: 2, ascii: SALA2, name: 'Galería de la Arcilla', floor: 'sala_arcilla', strata: ['a', 'b', 'c'] }),
  3: Object.freeze({ n: 3, ascii: SALA3, name: 'El último estrato', floor: 'sala_gris', strata: ['a', 'b', 'c', 'd'] }),
});

const parsed = new Map();
/** Sala analizada (cacheada) por número 1–3. */
export function room(n) {
  if (!ROOMS[n]) throw new Error(`b07: sala desconocida ${n}`);
  if (!parsed.has(n)) {
    const r = parseRoom(ROOMS[n].ascii);
    // Marcas propias de las galerías (no son suelo: cuentan como pared para el solucionador).
    const extra = { U: [], V: [], P: [] };
    r.rows.forEach((row, y) => [...row].forEach((ch, x) => { if (extra[ch]) extra[ch].push([x, y]); }));
    parsed.set(n, Object.freeze({ ...r, marks: { ...r.marks, ...extra } }));
  }
  return parsed.get(n);
}

/** Casillas del mapa de una marca de la sala (offset de la sala en el mapa). */
export function marksInMap(n, mark, ox, oy) {
  return room(n).marks[mark].map(([x, y]) => [x + ox, y + oy]);
}
