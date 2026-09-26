// Transición entre dos caminos de material distinto (arena ↔ tierra, tierra ↔ grava…), como en Añil: en vez de cambiar
// de golpe en una línea recta (típico en la costura entre dos mapas), el camino nuevo «entra» sobre el viejo con su
// borde irregular. Módulo puro (MapBuilder).
//
// Funciona con dos pinceles `nine` de capa 1 cuyos bordes llevan transparencia (los caminos de los tilesets de
// exterior): en las casillas de la franja (`blend`) queda en la capa 1 el material de partida (`from`, como interior)
// y encima, en la capa 2 (prioridad 0: se pisa y no tapa al personaje), el borde del material de llegada (`to`).
//
//   blendPath(b, { from: 'camino_arena', to: 'camino_tierra', blend, fromMask, toMask, fromCells })
//     blend     casillas de la franja de transición (p. ej. una columna del camino)
//     fromMask  (x, y) → ¿es camino `from`? (incluye la franja; fuera del mapa, lo que siga en el mapa vecino)
//     toMask    (x, y) → ¿es camino `to`? (incluye la franja)
//     fromCells casillas que pasan a ser del material de partida (p. ej. las de la costura antes de la franja)

const key = (x, y) => `${x},${y}`;

/** Casillas de `cells` y sus 8 vecinas dentro del mapa (sin repetir). */
function withRing(b, cells) {
  const seen = new Set();
  const out = [];
  for (const [x, y] of cells) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx; const ny = y + dy;
        if (!b.inBounds(nx, ny) || seen.has(key(nx, ny))) continue;
        seen.add(key(nx, ny));
        out.push([nx, ny]);
      }
    }
  }
  return out;
}

export function blendPath(b, { from, to, blend, fromMask, toMask, fromCells = [] }) {
  const around = withRing(b, [...blend, ...fromCells]);
  // 1) el material de partida bajo la franja (y alrededor, con sus bordes reales según fromMask)
  b.paint(from, around.filter(([x, y]) => fromMask(x, y)), { mask: fromMask });
  const under = blend.map(([x, y]) => [x, y, b.get(1, x, y)]);
  // 2) el de llegada: la franja recibe su borde (la casilla vecina del lado `from` queda fuera de toMask)
  b.paint(to, withRing(b, blend).filter(([x, y]) => toMask(x, y)), { mask: toMask });
  // 3) el borde de llegada sube a la capa 2 y el material de partida vuelve a la capa 1
  for (const [x, y, id] of under) {
    b.set(2, x, y, b.get(1, x, y));
    b.set(1, x, y, id);
  }
}

/**
 * Máscara para pintar un camino (pincel `nine`) que sale por el borde del mapa: fuera del mapa cuenta como camino si
 * la casilla del borde más cercana lo es. Así el camino llega a la costura sin su borde de hierba (sigue en el mapa
 * vecino) y no se «estrecha» en la línea de la conexión.
 *   b.paint('camino_tierra', cells, { mask: edgeMask(b, cells) })
 */
export function edgeMask(b, cells) {
  const set = new Set(cells.map(([x, y]) => key(x, y)));
  const clamp = (v, n) => Math.max(0, Math.min(n - 1, v));
  return (x, y) => {
    if (b.inBounds(x, y)) return set.has(key(x, y));
    return set.has(key(clamp(x, b.width), clamp(y, b.height)));
  };
}
