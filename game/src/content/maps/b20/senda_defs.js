// Definición común de los tramos de la Senda del Origen (docs/CAMPANA.md B20: «9 tramos de 24×18, cada uno eco de un
// Pilar»). Cada tramo lleva el tinte de su Pilar con un poco del oro del Origen (content/stamps/pilar.js), la música
// de la Senda y, en los de recorrido libre, los encuentros de la zona. Módulo PURO.
import { tramoId, TRAMO_W, TRAMO_H, ARRIVE } from './layout.js';
import { TRAMO_BRUSHES } from './paint.js';
import { pilarTone } from '../../stamps/pilar.js';
import { SENDA_ORIGEN, TRAMOS_CON_ENCUENTROS } from '../../encounters/b20.js';
import { tramoWarps, tramoOnEnter } from '../../events/b20_senda.js';
import { MUSIC } from '../../events/b20_common.js';

/** Suma de tonos [r, g, b, gris]. */
export const addTone = (a, b) => a.map((v, i) => v + (b[i] || 0));
/** Tinte del tramo n: su Pilar (0,7) y el oro del Origen (0,3). */
export const tramoTone = (n) => addTone(pilarTone(`P${n}`, 0.7), pilarTone('P10', 0.3));

/**
 * Mapa de un tramo. opts: { build, events, onEnter (guion extra al entrar), tileset (2), warps (sustituye a los de
 * tramoWarps), id (otra capa del mismo tramo), ...extra }.
 */
export function tramoDef(n, { build, events = [], onEnter = null, tileset = 2, warps = null, id = null, ...extra } = {}) {
  return {
    id: id || tramoId(n),
    name: 'Senda del Origen',
    tileset,
    width: TRAMO_W,
    height: TRAMO_H,
    outdoor: false,
    cave: true,
    bgm: MUSIC.path,
    battleback: 'Cielo',
    tone: tramoTone(n),
    brushes: TRAMO_BRUSHES,
    start: { ...ARRIVE },
    escapeRope: true,
    encounters: TRAMOS_CON_ENCUENTROS.includes(n) ? SENDA_ORIGEN : {},
    build,
    warps: warps || tramoWarps(n),
    events,
    onEnter: tramoOnEnter(n, onEnter),
    ...extra,
  };
}
