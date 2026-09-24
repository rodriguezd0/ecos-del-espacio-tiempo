// Utilidades de prueba del mundo: tileset sintético y mapas pequeños en memoria.
import { GameMap } from '../game/src/world/gameMap.js';

export const T = {
  GRASS: 384, WALL: 385, TREETOP: 386, LEDGE: 387, TALL: 388, WATER: 389, COUNTER: 390, NO_UP: 391, ICE: 392, DEEP_TALL: 393,
};

export function testTileset() {
  const n = 400;
  const passages = new Array(n).fill(0);
  const priorities = new Array(n).fill(0);
  const terrainTags = new Array(n).fill(0);
  passages[T.WALL] = 0x0f;
  priorities[T.TREETOP] = 1;
  passages[T.LEDGE] = 0x07; terrainTags[T.LEDGE] = 1; // se salta hacia abajo
  passages[T.TALL] = 0x40; terrainTags[T.TALL] = 2;
  passages[T.WATER] = 0x4f; terrainTags[T.WATER] = 7;
  passages[T.COUNTER] = 0x8f;
  passages[T.NO_UP] = 0x08;
  terrainTags[T.ICE] = 12;
  passages[T.DEEP_TALL] = 0x40; terrainTags[T.DEEP_TALL] = 10;
  return { name: 'prueba', image: 'prueba', autotiles: [], passages, priorities, terrainTags };
}

/**
 * Mapa desde filas de texto (capa 0 = césped; los símbolos se colocan en capa 1):
 *   . césped  # muro  L saliente  g hierba  G hierba alta profunda  w agua  c mostrador  ^ sin salida arriba  i hielo  t copa de árbol
 */
export function mapFromRows(rows, id = 'prueba') {
  const h = rows.length;
  const w = rows[0].length;
  const layers = [new Uint16Array(w * h).fill(T.GRASS), new Uint16Array(w * h), new Uint16Array(w * h)];
  const sym = { '#': T.WALL, L: T.LEDGE, g: T.TALL, G: T.DEEP_TALL, w: T.WATER, c: T.COUNTER, '^': T.NO_UP, i: T.ICE, t: T.TREETOP };
  rows.forEach((row, y) => [...row].forEach((ch, x) => { if (sym[ch]) layers[1][x + y * w] = sym[ch]; }));
  return new GameMap({ id, def: { id }, built: { width: w, height: h, layers }, tileset: testTileset() });
}

/** Mundo mínimo para personajes sin World completo. */
export function miniWorld(map) {
  return {
    map,
    player: null,
    bridge: 0,
    rng: () => 0.5,
    env: () => ({ bridge: 0, surfing: false }),
    onStepTaken: () => {},
    onStepStart: () => {},
  };
}

/** Avanza `n` fotogramas de 1/60 s. */
export function step(ch, n = 1) {
  for (let i = 0; i < n; i++) ch.update(1 / 60);
}
