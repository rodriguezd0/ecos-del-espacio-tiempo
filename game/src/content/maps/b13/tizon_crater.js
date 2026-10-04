import { withB22bEvents } from '../../events/b22b_maps.js';
// Cráter del Tizón (docs/CAMPANA.md §1.4: Volcán Tizón, tercer mapa; TABLILLAS T12; §8 postgame: cráter frío de Moltres
// y cráter activo de Heatran, aquí solo decorado). Caldera abierta al cielo (tileset 13 con día y noche): lago de magma,
// la sonda de Genesis y su jefa, la vieja fragua de piedra con columnas rotas (la Tabla Llama) y la costra de basalto
// del cráter frío. Se llega desde la Cueva del Tizón. Eventos: b13_tizon_crater.js.
import { CRATER as C, craterEvents } from '../../events/b13_tizon_crater.js';
import { TIZON_CUEVA } from '../../encounters/b13.js';
import { EXITS } from './tizon_cueva_layout.js';
import { withHeatranCrater } from '../../events/b22d_heatran.js';

const BACK = EXITS.r3North;

export default {
  id: 'tizon_crater',
  name: 'Cráter del Tizón',
  bgm: 'MansionQuemada',
  battleback: 'Volcan',
  tileset: 13,
  width: C.width,
  height: C.height,
  outdoor: true,
  noSwim: true,
  mount: true,
  tone: [24, -4, -18, 0],
  start: { x: C.arrive.x, y: C.arrive.y, dir: C.arrive.dir },
  encounters: TIZON_CUEVA,
  build(b) {
    b.fill(null, 'vacio');
    b.rect(null, C.floor.x, C.floor.y, C.floor.w, C.floor.h, 'sala_volcan');
    b.stamp('salida_luz_sur_volcan', C.exit.x - 1, C.floor.y + C.floor.h - 1);
    b.rect(0, C.lava.x, C.lava.y, C.lava.w, C.lava.h, 'agua'); // lava (autotile 6 de Cueva Volcán)
    for (const [x, y, w, h] of C.streams) b.rect(0, x, y, w, h, 'agua');
    const p = C.platform;
    b.rect(null, p.x, p.y, p.w, p.h, 'pilar_enlosado');
    for (const [x, y] of C.columns) b.stamp('pilar_columna_quebrada', x, y - 1);
    b.rect(null, C.cold.x, C.cold.y, C.cold.w, C.cold.h, 'estanque_volcan');
    for (const [x, y] of C.ridges) b.stamp('roca_grande_volcan', x, y);
    for (const [s, x, y] of [
      ['roca_grande_volcan', 7, 9], ['matojo_cueva_volcan', 9, 14], ['roca_musgo_volcan', 31, 7], ['roca_peque_volcan', 21, 27],
      ['matojo_cueva_volcan', 18, 36], ['roca_peque_volcan', 12, 44], ['roca_musgo_volcan', 27, 42], ['roca_peque_volcan', 33, 36],
      ['matojo_cueva_volcan', 11, 32], ['roca_peque_volcan', 25, 25],
      // Orillas del este y restos del campamento de la sonda: que la caldera no quede vacía.
      ['roca_grande_volcan', 31, 13], ['roca_peque_volcan', 33, 24], ['roca_musgo_volcan', 31, 33], ['roca_peque_volcan', 29, 34],
      ['roca_grande_volcan', 32, 41], ['roca_peque_volcan', 6, 19], ['roca_musgo_volcan', 11, 7], ['matojo_cueva_volcan', 26, 44],
      ['tronco_h_volcan', 15, 23], ['tronco_h_volcan', 23, 24], ['roca_peque_volcan', 6, 33],
    ]) b.stamp(s, x, y);
  },
  warps: [{ x: C.exit.x, y: C.exit.y, to: 'tizon_cueva', tx: BACK.door.x, ty: BACK.door.y + 2, dir: 2 }],
  events: withB22bEvents('tizon_crater', withHeatranCrater(craterEvents())),
};
