// Cubierta de un carguero en alta mar, de noche (docs/CAMPANA.md B21 §6, D24: «En la cubierta, Vértice busca un
// cuaderno que no encuentra»). Solo escena del epílogo (b21_cine.js#shipScene): el jugador no está, sin seguidores ni
// Zygarde. Tileset 1 (Exterior1): cubierta de tablones con borde y barandilla metálica, costado del casco con espuma,
// proa escalonada, contenedores, cajas, barriles, norays y farolas de hierro; lluvia fina y tono nocturno.
import { CARGO_W, CARGO_H, CARGO } from './layout.js';
import { SPRITE } from '../../events/b21_common.js';

const t = (col, row) => 384 + row * 8 + col;
/** Piezas de Exterior1 (disposición original de 8 columnas): tablero de muelle, barandilla y costado. */
const DECK = Object.freeze({
  top: Object.freeze({ l: t(3, 523), m: [t(4, 523), t(5, 523), t(6, 523)], r: t(7, 523) }),
  mid: Object.freeze({ l: t(3, 524), m: [t(4, 524), t(5, 524), t(6, 524), t(4, 525), t(5, 525), t(6, 525)], r: t(7, 524) }),
  bot: Object.freeze({ l: t(3, 526), m: [t(4, 526), t(5, 526), t(6, 526)], r: t(7, 526) }),
  rail: Object.freeze([t(0, 537), t(1, 537), t(2, 537), t(3, 537), t(4, 537)]),
  hull: Object.freeze([t(0, 409), t(1, 409), t(2, 409), t(3, 409)]),
  foam: Object.freeze([t(0, 410), t(1, 410), t(2, 410)]),
  bollard: t(3, 410),
});

/** Filas de la cubierta: [y, x0, x1] (cuerpo rectangular y proa escalonada al este). */
export function deckRows() {
  const d = CARGO.deck;
  const rows = [];
  for (let y = d.y; y < d.y + d.h; y++) {
    let x1 = d.x + d.w - 1;
    for (const [bx, by, bw, bh] of CARGO.bow) if (y >= by && y < by + bh) x1 = Math.max(x1, bx + bw - 1);
    rows.push([y, d.x, x1]);
  }
  return rows;
}

function buildCarguero(b) {
  b.fill(null, 'agua');
  const rows = deckRows();
  const d = CARGO.deck;
  const top = d.y;
  const bottom = d.y + d.h - 1;
  for (const [y, x0, x1] of rows) {
    const part = y === top ? DECK.top : y === bottom ? DECK.bot : DECK.mid;
    for (let x = x0; x <= x1; x++) {
      const id = x === x0 ? part.l : x === x1 ? part.r : part.m[(x + y * 2) % part.m.length];
      b.set(1, x, y, id);
    }
  }
  // Costado del casco con espuma bajo la cubierta y bajo cada escalón de la proa.
  for (let x = d.x; x < d.x + d.w; x++) {
    b.set(1, x, bottom + 1, DECK.hull[x % 3]);
    b.set(1, x, bottom + 2, DECK.foam[x % 3]);
  }
  for (const [bx, by, bw, bh] of CARGO.bow) {
    for (let x = bx; x < bx + bw; x++) {
      b.set(1, x, by + bh, DECK.hull[x % 3]);
      b.set(1, x, by + bh + 1, DECK.foam[x % 3]);
    }
  }
  // Barandilla metálica a lo largo de la borda norte.
  for (let x = d.x; x < d.x + d.w; x++) b.set(2, x, top, DECK.rail[x % DECK.rail.length]);
  // Carga y aparejos.
  b.stamp('contenedores', 5, 7);
  b.stamp('contenedores', 9, 7);
  b.stamp('cajas_madera', 17, 7);
  b.stamp('barriles', 22, 8);
  b.stamp('barriles', 6, 11);
  b.stamp('farola_hierro', 14, 6);
  b.stamp('farola_hierro', 21, 10);
  for (const x of [4, 11, 18]) b.set(2, x, bottom, DECK.bollard);
}

export default {
  id: 'carguero',
  name: 'Carguero',
  tileset: 1,
  width: CARGO_W,
  height: CARGO_H,
  outdoor: false, // escena nocturna fija (sin reloj ni capa de crisis)
  tone: [-78, -64, -18, 60],
  weather: { type: 'rain', power: 3 },
  bgm: 'Barco',
  showLocation: false,
  noFollower: true,
  noCore: true,
  escapeRope: false,
  fly: false,
  encounters: {},
  start: { x: CARGO.hidden.x, y: CARGO.hidden.y, dir: 8 },
  build: buildCarguero,
  events: [
    {
      id: 'b21_vertice', x: CARGO.vertice.x, y: CARGO.vertice.y, name: 'Dr. Vértice', sprite: SPRITE.vertice, dir: 8,
      trigger: 'action', script: async (ctx) => { await ctx.say('…', { speaker: 'Dr. Vértice' }); },
    },
  ],
};
