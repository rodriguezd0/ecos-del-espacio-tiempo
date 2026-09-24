// Vía del tren regional (CAMPANA §1.7: tren tras P4) en la Ruta 7 y en Ciudad Lúmina. Ni Exterior2 ni Exterior3
// tienen carriles, así que la vía es arte propio (tools/b09a_assets.mjs): tramos de 7 casillas y remates de una, más
// el paso a nivel. Todos los tramos son `through` (decorado); lo que impide andar por la vía son las vallas del mapa y
// los bloqueos invisibles que se piden en `blockAt`. Módulo puro.
import { SPRITE } from './b09a_common.js';

const SEG = 7; // casillas por tramo (b09_via.png: fotogramas de 224 px, centrados en la casilla del evento)
const SINGLE = 'asset:objects/b09_via_1.png';

const deco = { directionFix: true, stepAnime: false, walkAnime: false, shadow: false, through: true, noOver: true };

/**
 * Eventos de vía en la fila `y` de x0 a x1. `crossings`: casillas de paso a nivel (tablones); `blockAt`: casillas donde
 * se pone un bloqueo invisible (bordes del paso a nivel, andén…). `when`: condición para mostrarla.
 */
export function railEvents(prefix, y, x0, x1, { crossings = [], blockAt = [], when = null } = {}) {
  const cross = new Set(crossings);
  const out = [];
  let x = x0;
  while (x <= x1) {
    if (cross.has(x)) {
      out.push({ id: `${prefix}_pn_${x}`, x, y, sprite: SINGLE, dir: 4, ...deco, when: when || undefined });
      x += 1;
      continue;
    }
    let run = 0;
    while (x + run <= x1 && run < SEG && !cross.has(x + run)) run += 1;
    if (run === SEG) {
      out.push({ id: `${prefix}_${x}`, x: x + 3, y, sprite: SPRITE.rails, dir: 2, ...deco, when: when || undefined });
    } else {
      for (let i = 0; i < run; i++) out.push({ id: `${prefix}_${x + i}`, x: x + i, y, sprite: SINGLE, dir: 2, ...deco, when: when || undefined });
    }
    x += run;
  }
  for (const bx of blockAt) out.push({ id: `${prefix}_bloqueo_${bx}`, x: bx, y, solid: true, noOver: true });
  return out;
}

/** Topera de fin de vía. */
export function railStop(id, x, y) {
  return { id, x, y, sprite: SPRITE.railEnd, dir: 2, directionFix: true, shadow: false, solid: true, trigger: 'action',
    script: async (ctx) => { await ctx.say('Fin de la vía. La topera tiene la pintura roja y blanca recién retocada.'); } };
}
