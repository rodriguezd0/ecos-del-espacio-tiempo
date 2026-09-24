// Resolución del sprite de combate de un entrenador (definición de content/trainers: `sprite`). Módulo PURO.
// Acepta, por orden (content/characters.js#getBattleSprite):
//   'gael_front' | 'guardiana_front' | …   hoja propia de tipo battle_front/battle_back
//   'anil:<alias de clase>'                 clase genérica de Añil (content/anilClasses.js): 'anil:bichero' → CAZABICHOS
//   'anil:<ARCHIVO>'                        Graphics/Trainers/<ARCHIVO>.png de Añil ('anil:CHICO')
//   'gael' | 'profesor' | …                 charset registrado con `battle.front` (usa su frontal)
//   'ruta/archivo.png'                      imagen directa
//   'NOMBRE'                                Graphics/Trainers/NOMBRE.png de Añil (compatibilidad)
import { getCharacter, getBattleSprite } from '../../content/characters.js';

/** Sprite genérico si el pedido no existe. */
export const FALLBACK_TRAINER = 'anil:CHICO';

/**
 * @param {string} sprite
 * @param {{ anilUrl?: (path: string) => string }} opts  constructor de URLs de Añil (engine.assets.anil)
 * @returns {{ file: string, cols: number, source: string } | null}
 */
export function resolveTrainerSprite(sprite, { anilUrl = (p) => `/anil/${p}` } = {}) {
  if (typeof sprite !== 'string' || !sprite) return null;
  const direct = getBattleSprite(sprite);
  if (direct?.file) return { file: direct.file, cols: direct.cols || 1, source: sprite.startsWith('anil:') ? 'anil' : 'axis' };
  const front = getCharacter(sprite)?.battle?.front;
  const viaCharset = front ? getBattleSprite(front) : null;
  if (viaCharset?.file) return { file: viaCharset.file, cols: viaCharset.cols || 1, source: 'charset' };
  if (/\.(png|gif)$/i.test(sprite)) return { file: sprite, cols: 1, source: 'file' };
  return { file: anilUrl(`Graphics/Trainers/${sprite}.png`), cols: 1, source: 'anil' };
}
