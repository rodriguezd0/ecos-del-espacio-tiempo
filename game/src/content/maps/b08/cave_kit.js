// Salas de cueva enlazadas para los mapas del Bloque 8 (Mina Galena, Cerro Plomo, galería honda, Cueva de las Dunas).
// Misma técnica que las Ruinas del Dintel (maps/b02/ruinas_dintel_build.js), con la variante de color de Cueva1 como
// parámetro: salas rectangulares con el pincel `sala<variante>`, fusión de las paredes que se tocan (sin rendijas
// negras), pasos verticales de 3 casillas y túneles horizontales de 1 casilla pegados a la pared norte. Módulo puro.

const T = (x, y) => 384 + y * 8 + x;
/** Fila base de cada variante de Cueva1 (content/stamps/Cueva1.js, VARIANTS). */
export const CAVE_ROW = Object.freeze({ '': 0, _arcilla: 97, _hielo: 194, _volcan: 302, _gris: 402, _morada: 501 });

export function cells(x, y, w, h) {
  const out = [];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) out.push([x + i, y + j]);
  return out;
}

/** Utilidades de una variante: suelo (mosaico 3×3) y anillo de paredes (8×7 desde la fila +19). */
export function caveKit(variant = '') {
  const row = CAVE_ROW[variant];
  if (row === undefined) throw new Error(`cave_kit: variante desconocida "${variant}"`);
  const floorId = (x, y) => T(((x % 3) + 3) % 3, row + (((y % 3) + 3) % 3));
  const ring = (col, r) => T(col, row + 19 + r);
  const first = ring(0, 0);
  const last = ring(7, 6);
  const ringCell = (id) => {
    if (id < first || id > last) return null;
    return { col: (id - 384) % 8, row: Math.floor((id - 384) / 8) - row - 19 };
  };

  /** Pinta las salas (rectángulos de suelo x0..x1, y0..y1) con el pincel de la variante. */
  function paintRooms(b, rooms) {
    b.fill(null, 'vacio');
    for (const r of rooms) b.rect(null, r.x0, r.y0, r.x1 - r.x0 + 1, r.y1 - r.y0 + 1, `sala${variant}`);
  }

  /** Funde las paredes de salas vecinas (el borde con filo negro que toca otra pared pasa a roca maciza). */
  function mergeRock(b) {
    const rock = (x, y) => Boolean(ringCell(b.get(1, x, y)));
    const writes = [];
    for (let y = 0; y < b.height; y++) {
      for (let x = 0; x < b.width; x++) {
        const c = ringCell(b.get(1, x, y));
        if (!c) continue;
        let { col, row: r } = c;
        if (col === 0 && rock(x - 1, y)) col = 1;
        if (col === 7 && rock(x + 1, y)) col = 6;
        if (r === 0 && rock(x, y - 1)) r = 1;
        if (r === 6 && rock(x, y + 1)) {
          // Bajo la pared sur hay más roca: en el centro, roca maciza; en los lados, la pared lateral sigue recta.
          if (col >= 3 && col <= 4) r = 2;
          else r = 4 + (((y % 2) + 2) % 2);
        }
        if ((r === 4 || r === 5) && col >= 3 && col <= 4) continue;
        if (col !== c.col || r !== c.row) writes.push([x, y, ring(col, r)]);
      }
    }
    for (const [x, y, id] of writes) b.set(1, x, y, id);
  }

  /** Paso vertical de 3 casillas (x..x+2) en las filas rows[0]..rows[1]: quita la pared y pone suelo. */
  function carveVertical(b, { x, rows }) {
    for (let y = rows[0]; y <= rows[1]; y++) {
      for (let i = 0; i < 3; i++) { b.set(1, x + i, y, 0); b.set(0, x + i, y, floorId(x + i, y)); }
    }
  }

  /**
   * Túnel horizontal de una casilla de alto en la fila `y` (la primera fila de suelo de las dos salas), de x0 a x1:
   * encima sigue la cara norte continua y debajo queda el borde de la pared sur.
   */
  function carveTunnel(b, { x0, x1, y }) {
    for (let x = x0; x <= x1; x++) {
      for (let r = 0; r < 4; r++) b.set(1, x, y - 4 + r, ring(3 + (((x % 2) + 2) % 2), r));
      b.set(1, x, y, 0);
      b.set(0, x, y, floorId(x, y));
      b.set(0, x, y - 1, floorId(x, y - 1));
      b.set(1, x, y + 1, ring(3 + (((x % 2) + 2) % 2), 6));
      b.set(0, x, y + 1, floorId(x, y + 1));
    }
  }

  return { row, floorId, ring, paintRooms, mergeRock, carveVertical, carveTunnel };
}
