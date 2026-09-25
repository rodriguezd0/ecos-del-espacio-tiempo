// Coordenadas del Lago Viejo de Villa Boreal (docs/TABLILLAS.md T13 «La torre de hielo»: el hielo del lago, con capas
// antiguas de la glaciación-eco; Rosendo saca de aquí los bloques de la Torre de Hielo). Mapa exterior pequeño
// (tileset 1) al noreste del pueblo. El plano del lago (casillas, bloques, rocas y bloque antiguo) está en
// content/events/b15_lago_logic.js; aquí solo se coloca en el mapa. Módulo puro.
import { LAKE } from '../../events/b15_lago_logic.js';

export const LAGO = Object.freeze({
  width: 24,
  height: 18,
  /** Casilla del mapa de la esquina (0, 0) del plano del lago. */
  origin: { x: 6, y: 3 },
  /** Llegada desde Villa Boreal (borde oeste, filas 12–14) y salida de vuelta. */
  entry: { x: 1, y: 12, dir: 6 },
  exit: { x: 0, y0: 12, y1: 14, back: { map: 'villa_boreal', x: 42, y: 3, dir: 4 } },
  /** Orilla: casilla de regreso tras caerse al agua (delante del embarcadero) y puesto de Nieves. */
  respawn: { x: 11, y: 13, dir: 8 },
  nieves: { x: 13, y: 12, dir: 8 },
  hut: { x: 17, y: 11 }, sled: { x: 14, y: 14 }, sign: { x: 8, y: 13 },
});

/** Casilla del mapa de una casilla (x, y) del plano del lago. */
export const lakeToMap = (x, y) => [x + LAGO.origin.x, y + LAGO.origin.y];
/** Casilla del plano del lago de una casilla del mapa (o null si cae fuera). */
export function mapToLake(x, y) {
  const lx = x - LAGO.origin.x; const ly = y - LAGO.origin.y;
  return lx >= 0 && ly >= 0 && lx < LAKE.w && ly < LAKE.h ? [lx, ly] : null;
}
