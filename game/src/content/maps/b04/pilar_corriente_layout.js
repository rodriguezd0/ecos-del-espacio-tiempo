// Geometría del Pilar de la Corriente (CAMPANA B04: «Escalera de Estanques», tileset 15 + kit de Pilar, 40×40).
// Módulo PURO: vasos de los seis estanques (borde de roca + fondo), escaleras de bajada, losas, zonas transitables,
// mandos y puntos de escena. Fuente única de coordenadas para el mapa (pilar_corriente.js), sus eventos
// (content/events/b04_pilar*.js) y los tests (tests/b04_pilar.test.mjs comprueba con el mapa construido que cada
// zona conecta exactamente como dice el grafo de content/events/b04_hydraulics.js en todos los estados del agua).
//
//   x:  3-4    5-11     12-15      16-23        24-25   26-28     29-34   35-36
//   y4  [C4]   ·······  NORIA ║    repisa C3 ······┐    alcoba    ~~~~canal~~~~
//   y5  [C4]   E6       NORIA ║    E1 (cabecera)   │    alcoba    E2      [C2]
//   y11 [C4]   E6       ▓▓▓▓       franja norte ═══╧═══ pasillo   E2      [C2]
//   y14 ▓▓     paso     ▓▓   foso · ISLA DEL NÚCLEO · foso pasillo ▓canal E2↔E3▓
//   y20 ▓▓     E5       ▓▓         terraza sur (y 25)     pasillo  E3 (islote)
//   y27 oeste  E5  ── oeste ── E4 ─────────────────────── pasillo
//   y31 saliente (salto al rellano)          ·   E4 ·
//   y32-37 RELLANO DE ENTRADA: manantial, palanca de reinicio, mando C1, estela · salida sur (20, 38)

export const W = 40;
export const H = 40;
/** Suelo de la sala (el pincel `sala_gris` pone las paredes alrededor). */
export const HALL = Object.freeze({ x: 3, y: 4, w: 34, h: 35 });

export function rect(x, y, w, h) {
  const out = [];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) out.push([x + i, y + j]);
  return out;
}
export const cellKey = (x, y) => `${x},${y}`;
export const cellSet = (cells) => new Set(cells.map(([x, y]) => cellKey(x, y)));
export const minus = (cells, remove) => { const r = cellSet(remove); return cells.filter(([x, y]) => !r.has(cellKey(x, y))); };

/**
 * Estanques. `outer` = [x, y, w, h] del vaso con su borde de roca (el borde es el anillo exterior).
 * `stairs` = bajadas al fondo que atraviesan el borde: { dir: 'n'|'s' (3 de ancho, escalones horizontales) |
 * 'o'|'e' (2 de ancho × 3 de alto; se cruza por la fila central), x, y } (esquina superior izquierda).
 * `slabs` = losas flotantes que suben con el vaso lleno; `debris` = charcos y piedras del fondo vacío.
 * `gate` = casilla del borde donde está la compuerta de salida (sprite). `label` = rótulo tallado.
 */
export const PONDS = Object.freeze([
  Object.freeze({
    id: 'E1', outer: [16, 5, 8, 6],
    stairs: [{ dir: 'n', x: 19, y: 5 }, { dir: 's', x: 19, y: 9 }],
    // Agua de cabecera: sus losas no hacen puente hacia la repisa de C3 (se cruza por el fondo).
    slabs: [[17, 7], [18, 8], [22, 7]], debris: [[17, 8], [22, 8], [18, 7]],
    outlet: { gate: 0, at: [23, 7] },
  }),
  Object.freeze({
    id: 'E2', outer: [29, 5, 6, 9],
    stairs: [{ dir: 'o', x: 29, y: 8 }, { dir: 'e', x: 33, y: 8 }],
    slabs: [[31, 9], [32, 9]], debris: [[30, 6], [32, 12], [31, 11], [33, 6]],
    outlet: { gate: null, at: [31, 13] }, // vaso comunicado con E3 (canal sin compuerta)
  }),
  Object.freeze({
    id: 'E3', outer: [29, 21, 6, 9], islet: [31, 24, 2, 3],
    stairs: [{ dir: 'o', x: 29, y: 24 }],
    slabs: [[31, 23], [32, 23], [31, 27], [32, 27], [33, 25]], debris: [[30, 22], [33, 28], [30, 28]],
    outlet: { gate: 1, at: [30, 29] },
  }),
  Object.freeze({
    id: 'E4', outer: [16, 26, 8, 6],
    stairs: [{ dir: 's', x: 19, y: 30 }, { dir: 'o', x: 16, y: 27 }],
    slabs: [[18, 27], [21, 28], [22, 29]], debris: [[18, 29], [22, 27], [21, 29]],
    outlet: { gate: 2, at: [16, 30] },
  }),
  Object.freeze({
    id: 'E5', outer: [5, 20, 7, 9],
    stairs: [{ dir: 'n', x: 7, y: 20 }, { dir: 'e', x: 10, y: 26 }],
    slabs: [[8, 22], [8, 23], [8, 24], [8, 25], [8, 26], [8, 27], [9, 27]], debris: [[6, 22], [10, 23], [6, 27]],
    outlet: { gate: 3, at: [6, 20] },
  }),
  Object.freeze({
    id: 'E6', outer: [5, 5, 7, 9],
    stairs: [{ dir: 's', x: 7, y: 12 }, { dir: 'o', x: 5, y: 8 }],
    slabs: [[8, 11], [8, 10], [8, 9], [7, 9]], debris: [[6, 6], [10, 7], [10, 11], [6, 11]],
    outlet: { gate: null, at: [11, 8] }, // la noria toma el agua por el borde este
  }),
]);

/** Casillas del borde, del fondo y de las escaleras de un estanque. */
export function pondParts(pond) {
  const [x, y, w, h] = pond.outer;
  const all = rect(x, y, w, h);
  const inner = rect(x + 1, y + 1, w - 2, h - 2);
  const steps = pond.stairs.flatMap(stairCells);
  const islet = pond.islet ? rect(...pond.islet) : [];
  const floor = minus(minus(inner, steps), islet);
  const rim = minus(minus(all, inner), steps);
  return { all, inner, floor, rim, stairs: steps, stairSet: cellSet(steps), islet };
}

/** Casillas de una escalera (ver PONDS). */
export function stairCells(s) {
  if (s.dir === 'n' || s.dir === 's') return rect(s.x, s.y, 3, 2);
  return rect(s.x, s.y, 2, 3);
}
/** Casilla por la que se cruza una escalera lateral (fila central). */
export const stairPassRow = (s) => (s.dir === 'o' || s.dir === 'e' ? s.y + 1 : null);

/** Foso del núcleo (agua fija) y losas del puente norte que suben con el ciclo completo. */
export const ISLAND = Object.freeze({ x: 16, y: 15, w: 8, h: 8 });
export const MOAT = Object.freeze(minus(rect(14, 13, 12, 12), rect(ISLAND.x, ISLAND.y, ISLAND.w, ISLAND.h)));
export const CORE_BRIDGE = Object.freeze(rect(19, 13, 2, 2));
/** Cámara del núcleo (calco 5×5), casilla del núcleo, Leandro y la llegada del jugador por el puente. */
export const CORE = Object.freeze({
  chamber: [17, 16], x: 19, y: 18, inscription: [21, 15], inscriptionEvent: { x: 21, y: 16 },
  leandro: { x: 20, y: 16, dir: 8 }, arrive: [[19, 15], [20, 15]],
});

/** Zonas transitables fijas por nombre de zona del grafo (b04_hydraulics.EDGES) + islote y salida. */
export const ZONES = Object.freeze({
  entrada: [...rect(3, 32, 34, 6), ...rect(19, 38, 3, 1)],
  este: [...rect(26, 11, 3, 21), ...rect(27, 5, 2, 6), ...rect(14, 25, 12, 1), ...rect(24, 26, 2, 6), ...rect(29, 30, 8, 2), ...rect(35, 21, 2, 9)],
  norte: rect(14, 11, 12, 2),
  c3: [...rect(16, 4, 10, 1), ...rect(24, 5, 2, 5)],
  c2: rect(35, 5, 2, 9),
  oeste: [...rect(12, 27, 4, 4), ...rect(3, 29, 9, 2)],
  paso: rect(5, 14, 7, 6),
  c4: rect(3, 5, 2, 9),
  nucleo: rect(ISLAND.x, ISLAND.y, ISLAND.w, ISLAND.h),
});
/** Salientes (se saltan hacia el sur): salida de la repisa de C3 y del paso oeste. */
export const LEDGES = Object.freeze([rect(24, 10, 2, 1), rect(3, 31, 13, 1)]);

/** Canales de resonancia (agua luminosa, bloquean): acueducto de la noria, rebosadero norte y vaso E2–E3. */
export const CANALS = Object.freeze({
  h: [[27, 4, 36, 4]],
  v: [[15, 4, 15, 10], [31, 14, 31, 20]],
});

/** Noria (sprite 3×4 anclado abajo-centro) y su base sólida (entre E6 y el acueducto de E1). */
export const NORIA = Object.freeze({ x: 13, y: 9, cells: rect(12, 6, 3, 4) });

/** Mandos (el jugador se pone al lado mirándolos), palancas y compuertas. */
export const CONTROLS = Object.freeze({
  mando_c1: { x: 24, y: 33 },
  mando_c2: { x: 36, y: 7 },
  mando_c3: { x: 16, y: 4 },
  mando_c4: { x: 3, y: 6 },
  palanca_noria: { x: 20, y: 27 },
  palanca_reinicio: { x: 15, y: 33 },
});

/** Otros puntos: llegada, Leandro, manantial, estela de las compuertas, placa del trinquete, células. */
export const SPOTS = Object.freeze({
  arrival: { x: 20, y: 37, dir: 8 },
  exitWarp: { x: 20, y: 38 },
  leandro: { x: 17, y: 34, dir: 2 },
  spring: [5, 33], springEvent: { x: 6, y: 35 },
  stela: [29, 33], stelaEvent: { x: 29, y: 34 },
  ratchet: { x: 4, y: 5 },
});
export const CELL_SPOTS = Object.freeze({
  cell_corriente_1: { x: 20, y: 7 }, // fondo de E1, camino del mando de C3
  cell_corriente_2: { x: 20, y: 29 }, // fondo de E4, junto a la palanca de la noria
  cell_corriente_3: { x: 7, y: 9 }, // fondo de E6, camino del mando de C4
});
/** Entrenadores de la Escalera (Pescador/Buceadora, CAMPANA B04). */
export const TRAINER_SPOTS = Object.freeze({
  pescador_bruno: { x: 11, y: 33, dir: 6 },
  buceadora_marta: { x: 27, y: 22, dir: 2 },
  pescador_tomas: { x: 5, y: 16, dir: 6 },
  buceadora_ines: { x: 14, y: 12, dir: 6 },
});
export const ITEM_SPOTS = Object.freeze({
  agua_mistica: { x: 31, y: 25, item: 'MYSTICWATER' },
  superpocion: { x: 36, y: 12, item: 'SUPERPOTION' },
  revivir: { x: 10, y: 17, item: 'REVIVE' },
  perla: { x: 3, y: 30, item: 'PEARL', hidden: true },
});
