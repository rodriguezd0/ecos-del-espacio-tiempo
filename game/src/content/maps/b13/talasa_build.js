// Construcción de la Estación Talasa (MapBuilder + Exterior3): cubiertas de hormigón con bordillo sobre el mar,
// dársena central, barandilla blanca en todo el perímetro (salvo el pantalán y la escalerilla), invernadero (cúpula),
// laboratorio (pabellón azul), torre de dirección, depósitos, tuberías y contenedores. Módulo puro.
import { W, H, DECKS, JETTY, OPENINGS, INNER_RAILS, BUILDINGS, PROPS } from './talasa_layout.js';
import { rect, key } from './paint.js';

/** Todas las casillas de cubierta. */
export function deckCells() {
  const seen = new Set();
  const out = [];
  for (const d of Object.values(DECKS)) {
    for (const [x, y] of rect(d.x, d.y, d.w, d.h)) {
      if (seen.has(key(x, y))) continue;
      seen.add(key(x, y));
      out.push([x, y]);
    }
  }
  return out;
}

/**
 * Casillas de barandilla: el borde de las cubiertas que da al agua (o al límite del mapa), salvo los huecos, más las
 * barandillas interiores. → { h: [[x, y]…] horizontales, v: [[x, y]…] verticales }
 */
export function railCells() {
  const deck = new Set(deckCells().map(([x, y]) => key(x, y)));
  const open = new Set(OPENINGS.map(([x, y]) => key(x, y)));
  const isDeck = (x, y) => deck.has(key(x, y));
  const h = [];
  const v = [];
  for (const k of deck) {
    const [x, y] = k.split(',').map(Number);
    if (open.has(k)) continue;
    const up = !isDeck(x, y - 1);
    const down = !isDeck(x, y + 1);
    const side = !isDeck(x - 1, y) || !isDeck(x + 1, y);
    if (up || down) h.push([x, y]);
    else if (side) v.push([x, y]);
  }
  for (const [x0, y0, x1, y1] of INNER_RAILS) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (!h.some(([a, b]) => a === x && b === y)) h.push([x, y]);
  return { h, v };
}

export function buildTalasa(b) {
  b.fill(0, 'agua');
  b.paint('calzada', deckCells());
  b.stamp('muelle_tablas', JETTY.x, JETTY.y);
  const rails = railCells();
  b.paint('valla_blanca', rails.h);
  b.paint('valla_blanca_v', rails.v);
  for (const bd of Object.values(BUILDINGS)) b.stamp(bd.stamp, bd.x, bd.y);
  for (const [s, x, y] of PROPS) b.stamp(s, x, y);
  for (const [x, y] of [[1, 4], [37, 8], [37, 30], [1, 26], [2, 38], [38, 38], [12, 5], [28, 3], [9, 2], [33, 1]]) b.stamp('roca_agua', x, y);
}

export { W, H };
