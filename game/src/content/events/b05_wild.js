// Encuentros especiales de la Ruta 4 (docs/POKEDEX_DISTRIBUCION.md §7.2–7.3): árbol de miel («se unta miel y se
// vuelve tras descansar») y hierba que se agita (Audino 20). Ambos se renuevan con el contador de descansos
// (world/rest.js, var rest_count), así nada se pierde. Módulo puro salvo los guiones (usan ctx).
import { V } from './b05_common.js';
import { RUTA_4_HONEY, RUTA_4_RUSTLE } from '../encounters/b05.js';

const TEXT = Object.freeze({
  bare: 'Un árbol de corteza dulce. Si untaras un poco de Miel en el tronco, quizá se acercaría algún Pokémon.',
  ask: '¿Quieres untar Miel en el tronco?',
  spread: 'Has untado la Miel en el tronco. Habrá que dejar pasar un rato (descansar) y volver.',
  waiting: 'La Miel sigue en el tronco. Todavía no ha venido nadie.',
  came: '¡Un Pokémon salvaje se ha acercado a la Miel!',
  rustle: '¡La hierba se agita!',
});

/** Elige una entrada ponderada de una tabla [[peso, especie, min, max]…] con `rng()` en [0, 1). */
export function pickWeighted(table, rng = Math.random) {
  const total = table.reduce((a, e) => a + e[0], 0);
  let r = rng() * total;
  for (const e of table) {
    r -= e[0];
    if (r < 0) return { species: e[1], level: e[2] + Math.floor(rng() * (e[3] - e[2] + 1)) };
  }
  const last = table[table.length - 1];
  return { species: last[1], level: last[2] };
}

const restCount = (s) => Number(s.var(V.restCount, 0)) || 0;

/** ¿Hay un Pokémon esperando en la miel? */
export function honeyReady(state) {
  const at = Number(state.var(V.honey, 0)) || 0;
  return at > 0 && restCount(state) >= at;
}

/** Árbol de miel: evento sobre el tronco (se usa desde la casilla de abajo). */
export function honeyTreeEvent(id, x, y) {
  return {
    id, x, y, trigger: 'action', noOver: true, solid: true,
    script: async (ctx) => {
      const st = ctx.state;
      if (honeyReady(st)) {
        await ctx.say(TEXT.came);
        ctx.setVar(V.honey, 0);
        await ctx.wildBattle(pickWeighted(RUTA_4_HONEY));
        return;
      }
      if ((Number(st.var(V.honey, 0)) || 0) > 0) { await ctx.say(TEXT.waiting); return; }
      if (!st.hasItem('HONEY')) { await ctx.say(TEXT.bare); return; }
      if (!(await ctx.confirm(TEXT.ask))) return;
      st.removeItem('HONEY', 1);
      ctx.setVar(V.honey, restCount(st) + 1);
      ctx.se('PRSFX- Sweet Scent', { volume: 70 });
      await ctx.say(TEXT.spread);
    },
  };
}

/** ¿Se agita la hierba? (una vez por descanso: tras vencer o huir, espera al siguiente). */
export function rustleActive(state) {
  const last = state.var(V.rustle, null);
  return last === null || last === undefined || restCount(state) > Number(last);
}

/**
 * Hierba que se agita: la mata se sacude en una casilla de hierba alta; al pisarla sale el Audino (nv 20).
 * Tras el combate la hierba se calma hasta el siguiente descanso. Una sola mata activa por mapa (la primera
 * de `spots` según el número de descansos, para que cambie de sitio).
 */
export function rustleEvents(prefix, spots) {
  return spots.map((p, i) => ({
    id: `${prefix}_${i}`, x: p.x, y: p.y,
    pages: [{
      when: (s) => rustleActive(s) && restCount(s) % spots.length === i,
      sprite: 'asset:objects/b05_hierba.png', dir: 2, stepAnime: true, directionFix: true, walkAnime: false,
      through: true, shadow: false, speed: 4, trigger: 'touch',
      script: async (ctx) => {
        await ctx.say(TEXT.rustle);
        ctx.setVar(V.rustle, restCount(ctx.state));
        await ctx.wildBattle(pickWeighted(RUTA_4_RUSTLE));
      },
    }],
  }));
}
