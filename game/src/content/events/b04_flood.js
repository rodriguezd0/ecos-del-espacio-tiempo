// Desbordamiento del Albo (CAMPANA §3.1, fase 0: «el Albo se desborda de día y se seca de noche (P2)»): charcos
// de agua estancada en las orillas de la Ruta 3 y la Garganta hasta que se restaura el Pilar de la Corriente, y la
// pesca, que solo vuelve con el río en su cauce (B04 «Cambio en el mundo»: «vuelve la pesca»). Módulo PURO.
import { nineId } from '../../world/mapBuilder.js';
import { F } from './b04_common.js';

/** Estanque con marco de hierba de Exterior1 (brush `estanque`, nine en [0, 18]). */
const POND = Object.freeze({ nine: [0, 18], inner: [3, 18] });

/** Parche de los charcos: inundado (agua con marco) o seco (se ve el césped de la capa 0). */
export function floodPatch(cells, flooded) {
  const set = new Set(cells.map(([x, y]) => `${x},${y}`));
  const inside = (x, y) => set.has(`${x},${y}`);
  return cells.map(([x, y]) => [x, y, 1, flooded ? nineId(POND, x, y, inside) : 0]);
}

/** Evento invisible con los charcos del desbordamiento (hasta p2_restored). */
export function floodEvent(id, cells) {
  const [x, y] = cells[0];
  return {
    id, x, y, through: true,
    pages: [
      { when: (s) => !s.flag(F.restored), patch: floodPatch(cells, true), through: true },
      { when: (s) => s.flag(F.restored), patch: floodPatch(cells, false), through: true },
    ],
  };
}

/**
 * Evento paralelo del río: mientras el Pilar no esté restaurado, en el Albo no pica nada (se retira la tabla de
 * la Caña Vieja del sistema de encuentros del mapa actual). Se reaplica al entrar en el mapa.
 */
export function riverFishingEvent(id, x, y) {
  return {
    id, x, y, through: true,
    pages: [{
      when: (s) => !s.flag(F.restored), trigger: 'parallel',
      script: async (ctx) => {
        const enc = ctx.world?.encounters;
        if (enc?.tables && enc.tables.fish_old) delete enc.tables.fish_old;
        await ctx.wait(30);
      },
    }],
  };
}
