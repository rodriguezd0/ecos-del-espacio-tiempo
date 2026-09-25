// Coordenadas del Bloque 21 — Final: Columna Lanza (docs/CAMPANA.md B21; §1.4 «Cumbre Azur, Columna Lanza»: 30×40,
// tileset 8 + panorama). Fuente única de las casillas que usan el mapa, los eventos, las pruebas y el E2E.
// Módulo PURO (sin DOM ni motor).
//
// Columna Lanza, de sur a norte:
//   · Antecámara (y 25–35): el nodo de la Red de Convergencia (hexágono grabado) donde cae el Salto, el manantial
//     que cura, la estela con la Crónica XIV y dos monolitos. Aquí se vuelve al «Retirarse».
//   · Calzada (y 18–24) bajo un dintel, con columnas rotas: sube hasta la escalinata.
//   · Escalinata ancha (y 15–17) y la Cumbre (y 2–14): el altar de Arceus (hexágono) rodeado por el anillo de los
//     dieciocho zócalos de las Tablillas, columnas y monolitos. Alrededor, el vacío (se ve el panorama).

export const W = 30;
export const H = 40;

/** Rectángulo de casillas [x, y]. */
export function rectCells(x, y, w, h) {
  const out = [];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) out.push([x + i, y + j]);
  return out;
}

/** Rectángulo con las esquinas achaflanadas `c` casillas (octógono). */
export function chamferCells(x, y, w, h, c = 2) {
  return rectCells(x, y, w, h).filter(([cx, cy]) => {
    const dx = Math.min(cx - x, x + w - 1 - cx);
    const dy = Math.min(cy - y, y + h - 1 - cy);
    return dx + dy >= c;
  });
}

/**
 * Panorama de la Columna (render/panorama.js): durante la crisis, el cielo «astral» que se cuela por el Eje; tras
 * Arceus (cielo restablecido), el cielo abierto sobre las nubes.
 */
export const COLUMNA_PANORAMA = Object.freeze({
  crisis: Object.freeze({ image: 'anil:Graphics/Panoramas/astral.png', parallax: 0.2 }),
  calm: Object.freeze({ image: 'anil:Graphics/Panoramas/cielo.png', parallax: 0.1 }),
});

/** Zonas pisables (enlosado). */
export const ZONES = Object.freeze({
  summit: Object.freeze({ x: 5, y: 2, w: 20, h: 13, chamfer: 3 }),
  stairs: Object.freeze({ x: 12, y: 15, w: 5, h: 3 }),
  causeway: Object.freeze({ x: 12, y: 18, w: 5, h: 7 }),
  ante: Object.freeze({ x: 5, y: 25, w: 20, h: 11, chamfer: 3 }),
});

/** Máscara del suelo: lista de [x, y] únicas. */
export function floorCells() {
  const z = ZONES;
  const cells = [
    ...chamferCells(z.summit.x, z.summit.y, z.summit.w, z.summit.h, z.summit.chamfer),
    ...rectCells(z.stairs.x, z.stairs.y, z.stairs.w, z.stairs.h),
    ...rectCells(z.causeway.x, z.causeway.y, z.causeway.w, z.causeway.h),
    ...chamferCells(z.ante.x, z.ante.y, z.ante.w, z.ante.h, z.ante.chamfer),
  ];
  const seen = new Set();
  return cells.filter(([x, y]) => {
    const k = `${x},${y}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

const FLOOR = new Set(floorCells().map(([x, y]) => `${x},${y}`));
/** ¿Es (x, y) suelo de la Columna (antes de las piezas que bloquean)? */
export const isFloor = (x, y) => FLOOR.has(`${x},${y}`);

/**
 * Casillas de vacío que tocan el suelo (4-vecinas): allí va un tope invisible (evento sólido) para no caer al
 * panorama. `under` = las que están justo debajo de un borde sur (llevan además la cara de roca de la Columna).
 */
export function edgeCells() {
  const out = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (isFloor(x, y)) continue;
      const near = [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => isFloor(x + dx, y + dy));
      if (near) out.push({ x, y, under: isFloor(x, y - 1) });
    }
  }
  return out;
}

/** Casillas de roca colgante bajo los bordes sur (una fila más abajo del tope, solo decorado). */
export function undersideDrips() {
  return edgeCells().filter((c) => c.under && !isFloor(c.x, c.y + 1)).map((c) => ({ x: c.x, y: c.y + 1 }));
}

/** Piezas y puntos de la Columna. */
export const COLUMNA = Object.freeze({
  // Antecámara
  node: Object.freeze({ x: 12, y: 29, cx: 14, cy: 31 }), // pilar_camara_nucleo 5×5; el Salto cae en el centro
  arrival: Object.freeze({ x: 14, y: 31, dir: 8 }),
  retreat: Object.freeze({ x: 11, y: 28, dir: 8 }), // «Retirarse»: junto al manantial, con el equipo curado
  spring: Object.freeze({ x: 6, y: 27, w: 3, h: 3 }), // pilar_manantial (bloquea)
  chronicle: Object.freeze({ x: 21, y: 27 }), // pilar_placa_unown 2×2 (la base, y 28, bloquea): Crónica XIV
  monoliths: Object.freeze([Object.freeze({ x: 6, y: 31 }), Object.freeze({ x: 22, y: 31 })]), // 2×3 (base y 33)
  gate: Object.freeze({ x: 12, y: 22 }), // pilar_dintel 5×4 (pilares en x 12 y 16, filas 24–25)
  // Calzada y escalinata
  stairs: Object.freeze({ x: 12, y: 15 }), // pilar_escalinata_ancha 5×3
  brokenColumns: Object.freeze([
    Object.freeze({ x: 12, y: 18 }), Object.freeze({ x: 16, y: 20 }), // calzada (1×2, la base bloquea)
    Object.freeze({ x: 7, y: 20 + 5 }), Object.freeze({ x: 19, y: 34 }), // antecámara (no tapan paso)
  ]),
  // Cumbre
  altar: Object.freeze({ x: 12, y: 6, cx: 14, cy: 8 }), // pilar_camara_nucleo 5×5 bajo Arceus
  arceus: Object.freeze({ x: 14, y: 8 }),
  flute: Object.freeze({ x: 14, y: 9, dir: 8 }), // donde se toca la Flauta (mirando a Arceus)
  question: Object.freeze({ y: 14, x0: 12, x1: 16 }), // franja al llegar a lo alto: la pregunta de Zygarde
  columns: Object.freeze([
    Object.freeze({ x: 6, y: 5 }), Object.freeze({ x: 23, y: 5 }), Object.freeze({ x: 5, y: 9 }), Object.freeze({ x: 24, y: 9 }),
  ]), // pilar_columna 1×3 (la base, y + 2, bloquea)
  brokenSummit: Object.freeze([Object.freeze({ x: 7, y: 12 }), Object.freeze({ x: 22, y: 12 }), Object.freeze({ x: 22, y: 3 })]),
  summitMonoliths: Object.freeze([Object.freeze({ x: 7, y: 2 }), Object.freeze({ x: 20, y: 2 })]), // 2×3
  // pilar_arista 1×2: la base (y + 1) siempre sobre el enlosado (la punta puede asomar al vacío).
  crystals: Object.freeze([Object.freeze({ x: 9, y: 13 }), Object.freeze({ x: 24, y: 6 }), Object.freeze({ x: 23, y: 26 })]),
  // Objetos (en suelo libre: ni sobre los pilares del dintel ni sobre la base de un monolito)
  items: Object.freeze([
    Object.freeze({ id: 'b21_objeto_restauracion', x: 21, y: 33, item: 'FULLRESTORE' }),
    Object.freeze({ id: 'b21_objeto_revivir', x: 6, y: 11, item: 'MAXREVIVE', hidden: true }),
    Object.freeze({ id: 'b21_objeto_elixir', x: 16, y: 19, item: 'MAXELIXIR' }),
  ]),
});

/**
 * Anillo de los dieciocho zócalos alrededor del altar (TABLILLAS §4.7: «Los 18 zócalos de Columna Lanza se encienden
 * al completarse el conjunto»). Ángulos cada 20° desde arriba; radio 6 × 5 casillas.
 */
export const SOCKETS = Object.freeze(Array.from({ length: 18 }, (_, k) => {
  const a = ((-90 + 20 * k) * Math.PI) / 180;
  return Object.freeze({ k, x: COLUMNA.altar.cx + Math.round(6 * Math.cos(a)), y: COLUMNA.altar.cy + Math.round(5 * Math.sin(a)) });
}));

/** Zócalos de las tres Tablillas de Arceus: los de arriba, junto al altar (k 17, 0 y 1). */
export const ARCEUS_SOCKET_KS = Object.freeze([17, 0, 1]);

// ─────────────────────────────── Carguero (epílogo: Vértice en la cubierta) ───────────────────────────────

export const CARGO_W = 30;
export const CARGO_H = 20;
export const CARGO = Object.freeze({
  deck: Object.freeze({ x: 4, y: 6, w: 19, h: 8 }), // tablones de la cubierta
  bow: Object.freeze([[23, 7, 1, 6], [24, 8, 1, 4], [25, 9, 1, 2]]), // proa escalonada (x, y, w, h)
  vertice: Object.freeze({ x: 15, y: 10 }),
  camera: Object.freeze({ x: 14, y: 10 }),
  hidden: Object.freeze({ x: 5, y: 12 }), // donde se deja al jugador (invisible) durante la escena
});
