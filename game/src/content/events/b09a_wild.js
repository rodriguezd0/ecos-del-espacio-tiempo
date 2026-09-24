// Encuentros especiales del Bloque 9a (docs/POKEDEX_DISTRIBUCION.md §7.2–7.3): hierba que se agita en la Ruta 7
// (Audino 33), árbol de miel de la Reserva, Pokémon visibles fijos (Applin del huerto) y el Alfa de historia que
// reaparece al descansar (CAMPANA §2.6). Todo se renueva con el contador de descansos (world/rest.js, var rest_count),
// así nada se pierde. Módulo puro salvo los guiones (usan ctx).
import { pickWeighted } from './b05_wild.js';
import { restCount } from './b09a_common.js';

export { pickWeighted };

const TEXT = Object.freeze({
  bare: 'Un árbol de corteza dulce. Si untaras un poco de Miel en el tronco, quizá se acercaría algún Pokémon.',
  ask: '¿Quieres untar Miel en el tronco?',
  spread: 'Has untado la Miel en el tronco. Habrá que dejar pasar un rato (descansar) y volver.',
  waiting: 'La Miel sigue en el tronco. Todavía no ha venido nadie.',
  came: '¡Un Pokémon salvaje se ha acercado a la Miel!',
  rustle: '¡La hierba se agita!',
});

/** ¿Hay un Pokémon esperando en la miel? (var = rest_count a partir del cual aparece; 0 = sin untar) */
export function honeyReady(state, varName) {
  const at = Number(state.var(varName, 0)) || 0;
  return at > 0 && restCount(state) >= at;
}

/** Árbol de miel: evento sobre el tronco (se usa desde una casilla vecina). */
export function honeyTreeEvent(id, x, y, { varName, table }) {
  return {
    id, x, y, trigger: 'action', noOver: true, solid: true,
    script: async (ctx) => {
      const st = ctx.state;
      if (honeyReady(st, varName)) {
        await ctx.say(TEXT.came);
        ctx.setVar(varName, 0);
        await ctx.wildBattle(pickWeighted(table));
        return;
      }
      if ((Number(st.var(varName, 0)) || 0) > 0) { await ctx.say(TEXT.waiting); return; }
      if (!st.hasItem('HONEY')) { await ctx.say(TEXT.bare); return; }
      if (!(await ctx.confirm(TEXT.ask))) return;
      st.removeItem('HONEY', 1);
      ctx.setVar(varName, restCount(st) + 1);
      ctx.se('PRSFX- Sweet Scent', { volume: 70 });
      await ctx.say(TEXT.spread);
    },
  };
}

/** ¿Se agita la hierba? (una vez por descanso). */
export function rustleActive(state, varName) {
  const last = state.var(varName, null);
  return last === null || last === undefined || restCount(state) > Number(last);
}

/**
 * Hierba que se agita: una sola mata activa por mapa (la de `spots` que toca según los descansos, para que cambie de
 * sitio); al pisarla sale el Pokémon de `table`. Tras el combate la hierba se calma hasta el siguiente descanso.
 */
export function rustleEvents(prefix, spots, { varName, table }) {
  return spots.map((p, i) => ({
    id: `${prefix}_${i}`, x: p.x, y: p.y,
    pages: [{
      when: (s) => Boolean(s) && rustleActive(s, varName) && restCount(s) % spots.length === i,
      sprite: 'asset:objects/b05_hierba.png', dir: 2, stepAnime: true, directionFix: true, walkAnime: false,
      through: true, shadow: false, speed: 4, trigger: 'touch',
      script: async (ctx) => {
        await ctx.say(TEXT.rustle);
        ctx.setVar(varName, restCount(ctx.state));
        await ctx.wildBattle(pickWeighted(table));
      },
    }],
  }));
}

/**
 * Pokémon visible fijo (captura o combate al tocarlo). Si se vence sin capturarlo, reaparece tras el siguiente
 * descanso (var `restVar`); capturado, desaparece (flag `caughtFlag`). opts: { species, level, sprite, text, move,
 * extra (propiedades del Pokémon, p. ej. alpha), request (petición de combate extra), when }.
 */
export function visibleWildEvent(id, x, y, { species, level, sprite, text, caughtFlag, restVar, move = { wander: 2 }, extra = {}, request = {}, when = null }) {
  const visible = (s) => Boolean(s) && !s.flag(caughtFlag) && restCount(s) > Number(s.var(restVar, -1)) && (!when || when(s));
  return {
    id, x, y, name: species,
    pages: [{
      when: visible, sprite, dir: 2, move, speed: 3, freq: 4, stepAnime: true, trigger: 'action',
      script: async (ctx) => {
        ctx.cry?.(species);
        if (text) await ctx.say(text);
        const outcome = await ctx.battle({ type: 'wild', wild: { species, level, ...extra }, ...request });
        if (outcome === 'caught') ctx.setFlag(caughtFlag);
        else if (outcome === 'win') ctx.setVar(restVar, restCount(ctx.state));
      },
    }],
  };
}
