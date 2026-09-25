// Casillas de Feebas del Lago del Sentir (docs/POKEDEX_DISTRIBUCION.md §7.3: «Caña Buena · Feebas · 6 casillas
// especiales del Lago del Sentir (cambian cada día de juego)»). Módulo PURO.
//
// Día de juego (TÉCNICO, el guardado no lleva un contador de días): cada 24 min de juego jugados (1 min de reloj por
// segundo real, TEC-06) y cada descanso (var `rest_count` de world/rest.js, que siempre adelanta el reloj) cuentan
// como un día nuevo. Con el mismo día salen siempre las mismas 6 casillas de agua del lago.
import { createRng } from '../../world/prng.js';
import { SENTIR_ZONE } from '../maps/b16/lagos_layout.js';

export const FEEBAS_TILE_COUNT = 6;
const FRAMES_PER_GAME_DAY = 60 * 60 * 24; // 24 min reales a 60 fps

/** Día de juego para las casillas de Feebas. */
export function feebasDay(state) {
  const played = Math.floor((Number(state?.data?.playTimeFrames) || 0) / FRAMES_PER_GAME_DAY);
  const rests = Number(state?.var?.('rest_count', 0)) || 0;
  return played + rests;
}

/** Casillas de agua candidatas del Lago del Sentir (las de la zona que son agua navegable en el mapa). */
export function feebasCandidates(isWater) {
  const out = [];
  const z = SENTIR_ZONE;
  for (let y = z.y0; y <= z.y1; y++) for (let x = z.x0; x <= z.x1; x++) if (isWater(x, y)) out.push([x, y]);
  return out;
}

/** Las 6 casillas del día (deterministas por día y lista de candidatas). */
export function feebasTiles(candidates, day) {
  const rng = createRng(`feebas:${day}`);
  const pool = candidates.slice();
  const out = [];
  while (pool.length && out.length < FEEBAS_TILE_COUNT) out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  return out;
}

/** ¿Es (x, y) casilla de Feebas hoy? `candidates` = feebasCandidates(...) precalculado. */
export function isFeebasTile(state, candidates, x, y) {
  return feebasTiles(candidates, feebasDay(state)).some(([a, b]) => a === x && b === y);
}
