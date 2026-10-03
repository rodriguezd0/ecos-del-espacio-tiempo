// P6 vertical: escaleras entre los tres pisos de puzzles y columna exterior del aljibe (X36).
import { F, EXT } from './b12_common.js';
import { VESTIBULO, MIRADA, NUCLEO, P6_VERTICAL as P } from '../maps/b12/layout.js';
import { extraTiles } from '../stamps/extraTiles.js';

/** Los ascensos de revisita exigen haber resuelto el puzzle correspondiente; los descensos siempre están abiertos. */
export function stairEvent(id, at, to, { required = null, flag = null,
  closedText = 'Las vetas de la escalera aún no encajan. El camino de La Cara Vuelta lleva hasta el otro lado.' } = {}) {
  return {
    id, x: at.x, y: at.y, through: true, trigger: 'touch',
    script: async (ctx) => {
      if (required && !ctx.flag(required) && !ctx.flag(EXT.restored)) {
        await ctx.say(closedText);
        return;
      }
      if (flag) ctx.setFlag(flag);
      ctx.se('PRSFX- Teleport', { volume: 50 });
      await ctx.warp(to.map, to.x, to.y, to.dir ?? 8, { fade: true, frames: 20 });
    },
  };
}

export const baseStairs = () => [stairEvent('b12_subida_mirada', P.baseUp,
  { map: 'pilar_invertido_mirada', ...MIRADA.start }, { required: F.caraVueltaHecha })];
export const miradaDownstairs = () => [stairEvent('b12_baja_cara', P.miradaDown,
  { map: 'pilar_invertido', ...P.baseReturn })];
export const sumideroStairs = () => [
  stairEvent('b12_baja_mirada', P.sumideroDown, { map: 'pilar_invertido_mirada', ...P.miradaReturn }),
  stairEvent('b12_subida_sello', P.sumideroUp, { map: 'pilar_invertido_nucleo', ...NUCLEO.arrival },
    { required: F.sumideroHecho, closedText: 'Las cascadas aún no han abierto el paso al sello.' }),
];
export const nucleoDownstairs = () => [stairEvent('b12_vuelve_sumidero', P.nucleoDown,
  { map: 'pilar_invertido_sumidero', ...P.sumideroReturn })];

/** Glifo en la llegada física de cada gemelo: A permite salir sin perder los objetos ni el progreso guardado. */
export function facetReturn(x, y) {
  return {
    id: 'b12_cara_regreso', x, y, through: true, trigger: 'action',
    script: async (ctx) => {
      ctx.se('PRSFX- Teleport', { volume: 50 });
      await ctx.warp('pilar_invertido', VESTIBULO.portalCara.x - 1, VESTIBULO.portalCara.y, 4, { fade: true, frames: 20 });
    },
  };
}

/**
 * Las ocho filas altas de la columna común aparecen DETRÁS del brocal. La base y la puerta no se dibujan:
 * se conserva el aljibe horizontal del prólogo y su colisión. Las páginas dejan el escenario del prólogo intacto.
 */
export function exteriorColumnEvent() {
  const high = extraTiles('Exterior1').filter((t) => t.name === 'pilar_torre' && t.dy < P.exterior.h);
  const clear = high.map((t) => [P.exterior.x + t.dx, P.exterior.y + t.dy, 2, 0]);
  const column = high.map((t) => [P.exterior.x + t.dx, P.exterior.y + t.dy, 2, t.id]);
  return {
    id: 'b12_columna_exterior', x: 0, y: 0, through: true,
    pages: [
      { when: (s) => Boolean(s?.flag(EXT.leftTown)), through: true, patch: clear },
      { when: (s) => Boolean(s?.flag(EXT.leftTown) && (s.flag('p5_restored') || s.flag(EXT.restored))), through: true, patch: column },
    ],
  };
}
