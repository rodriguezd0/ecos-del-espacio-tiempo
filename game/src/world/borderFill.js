// Relleno del exterior de un mapa (módulo puro, sin Three.js). Como en Pokémon, la cámara sigue siempre al jugador
// centrado (render/camera.js) y más allá del borde «sigue habiendo mapa»: igual que los bloques de borde de los juegos
// oficiales, cada casilla exterior repite el terreno del borde. Solo es decorado (World.entryAt no lo ve: no se pisa).
//
// Modos (`def.border`, por defecto según el mapa, ver borderMode):
//   'edge'   continúa el borde hacia fuera. Por cada fila/columna se detecta su periodo (mosaico de césped 4×4, bosque
//            de 2×4, agua 2×2, camino recto…) y se repite con su fase; si la línea no tiene periodo propio se salta un
//            objeto suelto del borde (cartel, farola) o se usa el periodo mayoritario del lado (bosques poco profundos).
//            Suelo (capa 0) y decorado (capas 1–2) se analizan por separado: sus periodos no tienen por qué coincidir.
//   'none'   negro (o el panorama del mapa): interiores, mapas que caben en pantalla y el espacio imposible.
//   { brush } patrón propio: un pincel del tileset o del mapa (p. ej. 'bosque', 'agua', 'acantilado' o un objeto de
//            pincel) pintado en un anillo alrededor del mapa (buildBorderPattern, lo calcula MapScene al cargar).
import { SCREEN_W, SCREEN_H } from '../core/screen.js';
import { MapBuilder } from './mapBuilder.js';

const TILE = 32;
/** Tilesets de interior (tilesets.json: Interior, InteriorLiga, Creditos, InteriorTorre): fuera del mapa, negro. */
export const INTERIOR_TILESETS = new Set([4, 8, 10, 11]);
/** Periodo máximo que se busca en una línea (bosque 4, césped 4, sabana 3…; 8 cubre sus combinaciones). */
export const MAX_PERIOD = 8;
/** Casillas de objeto suelto en el borde que se pueden saltar para encontrar el periodo de la línea. */
export const MAX_SKIP = 2;
/** Anillo (casillas) que cubre el patrón propio de un mapa ({ brush }). */
export const PATTERN_MARGIN_X = 12;
export const PATTERN_MARGIN_Y = 10;

const KEY = 16384; // ids < 16384 (tileCount ≈ 5000–6000 + 384 de autotiles)
const CHANNELS = [[0], [1, 2]]; // suelo · decorado
const mod = (a, n) => ((a % n) + n) % n;

/** ¿El mapa cabe entero en la pantalla? */
export function fitsScreen(def) {
  return (def?.width || 0) * TILE <= SCREEN_W && (def?.height || 0) * TILE <= SCREEN_H;
}

/** Modo de relleno del exterior: 'edge' | 'none' | 'pattern'. */
export function borderMode(def) {
  const b = def?.border;
  if (b === false || b === 'none') return 'none';
  if (b === true || b === 'edge') return 'edge';
  if (b && typeof b === 'object' && b.brush) return 'pattern';
  if (def?.impossible || INTERIOR_TILESETS.has(def?.tileset) || fitsScreen(def)) return 'none';
  return 'edge';
}

/** Mejor periodo con evidencia desde `k` (al menos una repetición completa): { k, p, run } o null. */
function bestFrom(seq, k, maxPeriod) {
  const n = seq.length;
  let best = null;
  for (let p = 1; p <= maxPeriod && k + 2 * p <= n; p++) {
    let run = 0;
    while (k + run + p < n && seq[k + run] === seq[k + run + p]) run++;
    if (run < p) continue;
    if (!best || run + p > best.run + best.p) best = { k, p, run };
  }
  return best;
}

/** Regla propia de una línea (seq[0] = casilla del borde): periodo desde el borde o saltando un objeto suelto. */
export function lineRule(seq, { maxPeriod = MAX_PERIOD, maxSkip = MAX_SKIP } = {}) {
  for (let k = 0; k <= maxSkip; k++) {
    const r = bestFrom(seq, k, maxPeriod);
    if (r) return { k: r.k, p: r.p };
  }
  return null;
}

/** Periodo mayoritario (≥ 2) entre las reglas propias sin salto de un lado; 0 si no hay. */
export function sidePeriod(rules) {
  const votes = new Map();
  for (const r of rules) if (r && r.k === 0 && r.p >= 2) votes.set(r.p, (votes.get(r.p) || 0) + 1);
  let best = 0;
  for (const [p, n] of votes) if (!best || n > votes.get(best) || (n === votes.get(best) && p < best)) best = p;
  return best;
}

/** Índice de origen (distancia al borde, 0 = el borde) de la casilla exterior a distancia d ≥ 1. */
export const ruleIndex = (rule, d) => rule.k + mod(-d - rule.k, rule.p);

/** Regla de una línea: la propia o, si no tiene, el periodo `p` de su lado (desde el borde) o la de reserva. */
const withPeriod = (own, seq, p, fallback) => own || (p && seq.length >= p ? { k: 0, p } : fallback);

/**
 * Periodos de los dos lados de un eje a partir de las reglas propias de sus líneas: el de cada lado o, si no tiene
 * (p. ej. dos filas de árboles distintos, sin repetición visible), el del lado opuesto.
 */
function axisPeriods(ownA, ownB) {
  const both = sidePeriod([...ownA, ...ownB]);
  return [sidePeriod(ownA) || both, sidePeriod(ownB) || both];
}

/** Relleno 'edge' de un canal (capas) de un mapa: source(x, y) → [sx, sy] | null (casilla que se copia). */
class ChannelFill {
  constructor(map, layers, fallback) {
    this.map = map;
    this.layers = layers;
    this.fallback = fallback;
    const { width: w, height: h } = map;
    const row = (y, fromEast) => Array.from({ length: w }, (_, i) => this.key(fromEast ? w - 1 - i : i, y));
    const rowsW = Array.from({ length: h }, (_, y) => row(y, false));
    const rowsE = Array.from({ length: h }, (_, y) => row(y, true));
    const ownW = rowsW.map((s) => lineRule(s));
    const ownE = rowsE.map((s) => lineRule(s));
    const [pw, pe] = axisPeriods(ownW, ownE);
    this.west = ownW.map((r, y) => withPeriod(r, rowsW[y], pw, fallback));
    this.east = ownE.map((r, y) => withPeriod(r, rowsE[y], pe, fallback));
    this.col = (x, fromSouth) => Array.from({ length: h }, (_, i) => this.vkey(x, fromSouth ? h - 1 - i : i));
    const ownN = Array.from({ length: w }, (_, x) => lineRule(this.col(x, false)));
    const ownS = Array.from({ length: w }, (_, x) => lineRule(this.col(x, true)));
    [this.northP, this.southP] = axisPeriods(ownN, ownS);
    this.cols = new Map(); // x → { north, south } (columnas, también las virtuales de fuera; perezoso)
  }

  key(x, y) {
    let k = 0;
    for (const l of this.layers) k = k * KEY + this.map.data(x, y, l);
    return k;
  }

  /** Columna de origen de (x, y) con y dentro del mapa (-1 = nada que copiar). */
  vx(x, y) {
    const w = this.map.width;
    if (x >= 0 && x < w) return x;
    const rule = x < 0 ? this.west[y] : this.east[y];
    if (!rule) return -1;
    return x < 0 ? ruleIndex(rule, -x) : w - 1 - ruleIndex(rule, x - w + 1);
  }

  vkey(x, y) {
    const sx = this.vx(x, y);
    return sx < 0 ? 0 : this.key(sx, y);
  }

  colRules(x) {
    let r = this.cols.get(x);
    if (!r) {
      const pick = (seq, p) => withPeriod(lineRule(seq), seq, p, this.fallback);
      r = { north: pick(this.col(x, false), this.northP), south: pick(this.col(x, true), this.southP) };
      this.cols.set(x, r);
    }
    return r;
  }

  source(x, y) {
    const h = this.map.height;
    let sy = y;
    if (y < 0 || y >= h) {
      const { north, south } = this.colRules(x);
      const rule = y < 0 ? north : south;
      if (!rule) return null;
      sy = y < 0 ? ruleIndex(rule, -y) : h - 1 - ruleIndex(rule, y - h + 1);
    }
    const sx = this.vx(x, sy);
    return sx < 0 ? null : [sx, sy];
  }
}

/**
 * Relleno 'edge' de un mapa: source(x, y) → { ground: [sx, sy] | null, upper: [sx, sy] | null } para una casilla
 * exterior en coordenadas locales. Sin periodo, el suelo repite la casilla del borde y el decorado queda vacío.
 */
export function createEdgeFill(map) {
  const ground = new ChannelFill(map, CHANNELS[0], { k: 0, p: 1 });
  const upper = new ChannelFill(map, CHANNELS[1], null);
  return { source: (x, y) => ({ ground: ground.source(x, y), upper: upper.source(x, y) }) };
}

/**
 * Patrón propio ({ brush }) pintado en un anillo alrededor del mapa con el MapBuilder (mismos pinceles que el mapa).
 * deps: { library, paintBrush }. Devuelve Map 'x,y' → [id0, id1, id2] en coordenadas locales, o null.
 */
export function buildBorderPattern(def, deps = {}) {
  const spec = def?.border;
  if (borderMode(def) !== 'pattern') return null;
  const mx = spec.marginX ?? PATTERN_MARGIN_X;
  const my = spec.marginY ?? PATTERN_MARGIN_Y;
  const W = def.width + 2 * mx;
  const H = def.height + 2 * my;
  const b = new MapBuilder({
    width: W, height: H, tileset: def.tileset, id: `${def.id}:borde`, seed: def.seed, library: deps.library,
    paintBrush: deps.paintBrush, stamps: def.stamps, brushes: def.brushes, fallback: def.fallback, warn: deps.warn,
  });
  const cells = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (x < mx || y < my || x >= mx + def.width || y >= my + def.height) cells.push([x, y]);
    }
  }
  const brushes = Array.isArray(spec.brush) ? spec.brush : [spec.brush];
  for (const brush of brushes) b.paint(brush, cells);
  const out = new Map();
  for (const [x, y] of cells) {
    const ids = [0, 1, 2].map((l) => b.get(l, x, y));
    if (ids.some(Boolean)) out.set(`${x - mx},${y - my}`, ids);
  }
  return out;
}
