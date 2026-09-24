// Vuelo de Zygarde Completo (CAMPANA §1.7): "Zygarde se disgrega en su red de hexágonos verdes y se
// rehace en el destino con el jugador". Tira de 8 frames de 48×48 nativos (96×96 exportados):
//   0 aura verde · 1 red hexagonal sobre la figura · 2–6 la figura se deshace de los pies a la cabeza en
//   hexágonos que suben · 7 últimas chispas arriba. Al revés (7 → 0) es la llegada.
// Además, una hoja de partículas sueltas (zygarde_hex). PROVISIONALES (D30).
import { Img, compose, fromRows, hex } from '../pixel.mjs';
import { ACTION_SIZE } from './actions.mjs';
import { prota, WALK_BAG } from './rider.mjs';
import { buildFrame } from './assemble.mjs';

const S = ACTION_SIZE;
export const FLIGHT_FRAMES = 8;
const CELL = 4; // lado de la celda hexagonal (filas alternas desplazadas medio lado)

const GREEN = { edge: '#3E9A30', mid: '#6CD040', bright: '#B9FF66', white: '#E8FFD0' };
const PARTICLES = {
  big: fromRows(['.gg.', 'gWWg', 'gWWg', '.gg.'], { g: GREEN.mid, W: GREEN.bright }),
  mid: fromRows(['.g.', 'gWg', '.g.'], { g: GREEN.mid, W: GREEN.white }),
  spark: fromRows(['WW', 'WW'], { W: GREEN.bright }),
};

function hash(x, y, seed) {
  let h = (x * 374761393 + y * 668265263 + seed * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const cellOf = (x, y) => {
  const row = Math.floor(y / CELL);
  const col = Math.floor((x + (row % 2) * (CELL / 2)) / CELL);
  return { row, col, key: `${row},${col}` };
};

/** Figura de partida: el protagonista de frente (con mochila) en el lienzo, pies en la fila 46. */
function standing(id) {
  const { heads, palette } = prota(id);
  const p = WALK_BAG.down[0];
  return compose(S, S, [{ img: buildFrame({ head: heads.down, body: p.body, lift: p.lift }, palette), x: 8, y: 16 }]);
}

/** Celdas ocupadas por la figura con su umbral de disgregación (los pies antes que la cabeza). */
function cellsOf(body) {
  const cells = new Map();
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      if (!body.alpha(x, y)) continue;
      const c = cellOf(x, y);
      if (!cells.has(c.key)) cells.set(c.key, { ...c, xs: 0, ys: 0, n: 0 });
      const e = cells.get(c.key);
      e.xs += x; e.ys += y; e.n += 1;
    }
  }
  for (const e of cells.values()) {
    e.cx = e.xs / e.n;
    e.cy = e.ys / e.n;
    e.t = 0.05 + 0.6 * ((S - e.cy) / S) + 0.2 * hash(e.row, e.col, 3);
  }
  return cells;
}

/** Aura: anillo verde de 1 px por fuera de la silueta. */
function aura(img) {
  const out = img.clone();
  const c = hex(GREEN.bright);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      if (img.alpha(x, y)) continue;
      if (img.alpha(x - 1, y) || img.alpha(x + 1, y) || img.alpha(x, y - 1) || img.alpha(x, y + 1)) out.set(x, y, c);
    }
  }
  return out;
}

/**
 * Red hexagonal: los bordes de una parte de las celdas (fracción `amount`, las más cercanas a los pies
 * primero) se iluminan de verde; el resto de la figura sigue viéndose.
 */
function lattice(img, cells, amount) {
  const out = img.clone();
  const c = hex(GREEN.mid);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      if (!img.alpha(x, y)) continue;
      const cell = cellOf(x, y);
      const info = cells.get(cell.key);
      if (!info || info.t > amount) continue;
      if (cellOf(x + 1, y).key !== cell.key || cellOf(x, y + 1).key !== cell.key) out.set(x, y, c);
    }
  }
  return out;
}

function flightFrame(body, cells, k) {
  if (k === 0) return aura(body);
  const T = (k - 1) / (FLIGHT_FRAMES - 3); // 0 en el frame 1 → 1,5 en el 7
  const gone = new Set([...cells.values()].filter((c) => c.t < T).map((c) => c.key));
  const rest = new Img(S, S);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) if (body.alpha(x, y) && !gone.has(cellOf(x, y).key)) rest.set(x, y, body.get(x, y));
  let out = lattice(rest, cells, T + 0.35);
  if (k <= 2) out = aura(out);
  for (const c of cells.values()) {
    if (!gone.has(c.key)) continue;
    const q = T - c.t; // progreso de la partícula desde que se soltó
    const drift = (hash(c.row, c.col, 7) - 0.5) * 18;
    const x = Math.round(c.cx + drift * q - 2);
    const y = Math.round(c.cy - q * 30 - q * q * 6 - 2);
    if (y < 0) continue; // la partícula entera o nada (sin píxeles sueltos en el borde)
    if (hash(c.row, c.col, 11) < q * 0.4) continue; // se van apagando
    const sprite = q < 0.3 ? PARTICLES.big : q < 0.65 ? PARTICLES.mid : PARTICLES.spark;
    out.blit(sprite, x, y);
  }
  return out;
}

/** Tira nativa (384×48) de disgregación en hexágonos del protagonista. */
export function buildFlightStrip(id) {
  const body = standing(id);
  const cells = cellsOf(body);
  const strip = new Img(S * FLIGHT_FRAMES, S);
  for (let k = 0; k < FLIGHT_FRAMES; k++) strip.blit(flightFrame(body, cells, k), k * S, 0);
  return strip;
}

/**
 * Partículas sueltas (tira 4×2 de 16×16 nativos): fila 0 = celda hexagonal de la red (brillante,
 * media, tenue, chispa); fila 1 = partícula que se apaga (grande, media, chispa, chispa pequeña).
 */
export function buildHexParticles() {
  const P = 16;
  const pal = { k: GREEN.edge, g: GREEN.mid, W: GREEN.bright, w: GREEN.white };
  const ring = (inner) => fromRows([
    '....kkkk....', '..kkggggkk..', '.kgg....ggk.', 'kgg......ggk', 'kg........gk', 'kg........gk',
    'kg........gk', 'kg........gk', 'kgg......ggk', '.kgg....ggk.', '..kkggggkk..', '....kkkk....',
  ].map((r) => r.replace(/g/g, inner)), pal);
  const row0 = [ring('W'), ring('g'), ring('k'), fromRows(['.WW.', 'WwwW', 'WwwW', '.WW.'], pal)];
  const row1 = [PARTICLES.big, PARTICLES.mid, PARTICLES.spark, fromRows(['W'], pal).scale(2)];
  const out = new Img(P * 4, P * 2);
  [row0, row1].forEach((row, r) => row.forEach((img, c) => out.blit(img, c * P + Math.floor((P - img.w) / 2), r * P + Math.floor((P - img.h) / 2))));
  return out;
}
