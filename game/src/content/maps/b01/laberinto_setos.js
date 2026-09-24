// Setos altos del Laberinto de la Profundidad (tileset 7, piezas del seto florido de Añil, filas 26–30).
// Los setos se describen como TRAMOS: horizontales de 2 filas de alto (copa + cuerpo con cara al sur y su
// sombra en el suelo) y verticales de 1 columna (remate, cuerpo y pie). Módulo puro (mapa, preview, tests).
//
// En el tileset el seto está desplazado media casilla: la fila 26 lleva la copa (60 % inferior de la
// casilla) y la 27 su cara; la 29 el cuerpo inferior y la 30 la cara (pasable). Un seto alto se compone
// con copa (26) en y, cuerpo (29) sobre la cara (27, capa 1) en y+1 y la sombra (30) en y+2.

const id = (col, row) => 384 + row * 8 + col;

export const HEDGE = Object.freeze({
  top: { l: id(0, 26), m: [id(1, 26), id(2, 26), id(3, 26)], r: id(4, 26) },
  body: { l: id(0, 29), m: [id(1, 29), id(2, 29), id(3, 29)], r: id(4, 29) },
  under: { l: id(0, 27), m: [id(1, 27), id(2, 27), id(3, 27)], r: id(4, 27) },
  lip: { l: id(0, 30), m: [id(1, 30), id(2, 30), id(3, 30)], r: id(4, 30) },
  vert: [id(0, 28), id(4, 28)],
  cap: id(5, 26),
  foot: id(5, 27),
});

const pick = (list, x) => list[((x % list.length) + list.length) % list.length];
const piece = (set, endL, endR, x) => (endL ? set.l : endR ? set.r : pick(set.m, x));

/**
 * Tramos → piezas. bands: [[x0, x1, y]] (ocupan y e y+1); verts: [[x, y0, y1]].
 * opts.walls(x, y): casillas de bosque/roca: el tramo que las toca no se remata.
 * Devuelve { cells: Map('x,y' → id capa 2), under: Map('x,y' → id capa 1), lips: [[x, y, id]], isHedge }.
 */
export function layoutHedges(bands, verts, { walls = () => false } = {}) {
  const cells = new Map();
  const under = new Map();
  const bandTop = new Set();
  const lips = [];
  for (const [x0, x1, y] of bands) {
    const freeL = !walls(x0 - 1, y);
    const freeR = !walls(x1 + 1, y);
    for (let x = x0; x <= x1; x++) {
      const endL = x === x0 && freeL;
      const endR = x === x1 && freeR;
      cells.set(`${x},${y}`, piece(HEDGE.top, endL, endR, x));
      cells.set(`${x},${y + 1}`, piece(HEDGE.body, endL, endR, x));
      under.set(`${x},${y + 1}`, piece(HEDGE.under, endL, endR, x));
      lips.push([x, y + 2, piece(HEDGE.lip, endL, endR, x)]);
      bandTop.add(`${x},${y}`);
    }
  }
  for (const [x, y0, y1] of verts) {
    const topFree = !cells.has(`${x},${y0 - 1}`) && !walls(x, y0 - 1);
    const joinsBand = bandTop.has(`${x},${y1 + 1}`);
    const footFree = !joinsBand && !cells.has(`${x},${y1 + 1}`) && !walls(x, y1 + 1);
    for (let y = y0; y <= y1; y++) {
      let tile = pick(HEDGE.vert, y);
      if (y === y0 && topFree) tile = HEDGE.cap;
      if (y === y1 && footFree) tile = HEDGE.foot;
      cells.set(`${x},${y}`, tile);
    }
    // Unión en T con un tramo horizontal de debajo: la copa se sustituye por cuerpo vertical.
    if (joinsBand) cells.set(`${x},${y1 + 1}`, pick(HEDGE.vert, y1 + 1));
  }
  const isHedge = (x, y) => cells.has(`${x},${y}`);
  return { cells, under, isHedge, lips: lips.filter(([x, y]) => !isHedge(x, y)) };
}

/** Pinta los setos (capa 2), su cara (capa 1) y su sombra en el suelo (capa 1) en un MapBuilder. */
export function paintHedges(b, hedges) {
  const at = (key) => key.split(',').map(Number);
  for (const [key, tile] of hedges.under) { const [x, y] = at(key); b.set(1, x, y, tile); }
  for (const [key, tile] of hedges.cells) { const [x, y] = at(key); b.set(2, x, y, tile); }
  for (const [x, y, tile] of hedges.lips) if (!b.get(1, x, y)) b.set(1, x, y, tile);
}
