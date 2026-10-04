// Cueva del Tizón (docs/TABLILLAS.md T12: «en la Cueva Volcán hay que empujar bloques de obsidiana para desviar las
// coladas… Así se reabren tres respiraderos»; CAMPANA §1.4: Volcán Tizón, tileset 13, fondo CuevaRoja). Vestíbulo y
// tres galerías de coladas unidas por túneles; al fondo, la salida al cráter. `noSwim`: en Cueva Volcán el autotile de
// lava lleva el terrain tag de agua de Añil y no se nada en él (world/waterAccess.js). Eventos: b13_tizon_cueva.js.
import { W, H, FLOORS, EXITS, START } from './tizon_cueva_layout.js';
import { ROOMS, ROOM_IDS } from '../../events/b13_lava_logic.js';
import { TIZON_CUEVA } from '../../encounters/b13.js';
import { caveEvents, caveWarps, caveOnEnter } from '../../events/b13_tizon_cueva.js';
import { withB22cEvents } from '../../events/b22c_maps.js';

/** Rocas del vestíbulo (las galerías solo llevan las rocas de sus reglas, para que el puzle sea el de la lógica). */
const DECOR = Object.freeze([['roca_grande_volcan', 33, 41], ['roca_peque_volcan', 26, 42], ['matojo_cueva_volcan', 32, 45]]);

export default {
  id: 'tizon_cueva',
  name: 'Cueva del Tizón',
  bgm: 'MansionQuemada',
  battleback: 'CuevaRoja',
  tileset: 13,
  width: W,
  height: H,
  cave: true,
  noSwim: true,
  dark: { amount: 0.55, radius: 96 },
  tone: [30, -6, -24, 0],
  start: START,
  encounters: TIZON_CUEVA,
  build(b) {
    b.fill(null, 'vacio');
    for (const f of Object.values(FLOORS)) b.rect(null, f.x0, f.y0, f.w, f.h, 'sala_volcan');
    for (const e of Object.values(EXITS)) b.stamp(e.stamp, e.x, e.y);
    // Las coladas son eventos sobre el suelo (b13_tizon_cueva.js): lava viva sólida o costra fría que se pisa.
    for (const n of ROOM_IDS) for (const [x, y] of ROOMS[n].rocks) b.stamp('roca_peque_volcan', x, y - 1);
    for (const [s, x, y] of DECOR) b.stamp(s, x, y);
  },
  warps: caveWarps(),
  onEnter: caveOnEnter,
  events: withB22cEvents('tizon_cueva', caveEvents()),
};
