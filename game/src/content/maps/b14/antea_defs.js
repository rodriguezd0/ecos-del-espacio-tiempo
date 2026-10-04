// Definición común de los mapas gemelos de las Ruinas de Antea (docs/CAMPANA.md B14 y §1.8: «Buceo, P7 presente · Sub;
// P7 eco · Templo (Antea) / Pradera3 (primigenia)»). Cada sala existe en varias capas con el mismo tamaño: roomDef
// fija tileset, tono, oscuridad, Buceo, música, fondo y encuentros según la capa. Módulo PURO.
import { ROOMS, roomMap } from './layout.js';
import { CAVE_BRUSHES } from './paint.js';
import { TONES, MUSIC } from '../../events/b14_common.js';
import { ANTEA_PRESENTE, ANTEA_ECO, ANTEA_PRIMIGENIA } from '../../encounters/b14.js';
import { pilarTone } from '../../stamps/pilar.js';

/** Suma dos tonos [r, g, b, gris]. */
const addTone = (a, b) => a.map((v, i) => v + (b[i] || 0));

const ERA_DEFAULTS = Object.freeze({
  presente: () => ({
    tileset: 15, cave: true, brushes: CAVE_BRUSHES, bgm: MUSIC.reef, battleback: 'Sub', encounters: ANTEA_PRESENTE,
    dark: { amount: 0.84 }, tone: addTone(TONES.presente, pilarTone('P7', 0.25)), noFollower: true,
  }),
  anteaCity: () => ({
    tileset: 7, outdoor: false, bgm: MUSIC.echo, battleback: 'Templo', encounters: ANTEA_ECO, tone: TONES.antea, crisis: false,
  }),
  anteaStone: () => ({
    tileset: 2, cave: true, brushes: CAVE_BRUSHES, bgm: MUSIC.echo, battleback: 'Templo', encounters: ANTEA_ECO,
    tone: addTone(TONES.anteaStone, pilarTone('P7', 0.2)),
  }),
  primigenia: () => ({
    tileset: 7, outdoor: false, bgm: MUSIC.primal, battleback: 'Pradera3', encounters: ANTEA_PRIMIGENIA, tone: TONES.primigenia, crisis: false,
  }),
});

/**
 * Mapa de una sala en una capa. opts: { build, events, warps, shallow (presente: zonas sin gasto de burbuja), onEnter }.
 * La aparición por defecto es la llegada sur en el presente y la primera caracola en las capas de eco.
 */
export function roomDef(room, era, { build, events = [], warps = [], shallow = [], onEnter = null, ...extra } = {}) {
  const R = ROOMS[room];
  const kind = era === 'antea' ? (room <= 2 ? 'anteaCity' : 'anteaStone') : era;
  const c = R.caracolas[0];
  const start = era === 'presente' ? R.south.arrival : { x: c.stand.x, y: c.stand.y, dir: c.stand.dir };
  const def = {
    id: roomMap(room, era),
    name: 'Pilar de los Ecos',
    pillar: { id: 'P7', floor: 2 },
    width: R.w,
    height: R.h,
    ...ERA_DEFAULTS[kind](),
    start: { x: start.x, y: start.y, dir: start.dir },
    build,
    warps,
    events,
    ...extra,
  };
  if (era === 'presente') def.underwater = { shallow };
  if (onEnter) def.onEnter = onEnter;
  return def;
}
