// Piezas comunes de las salas de Antea (docs/CAMPANA.md B14): respiraderos del presente, ecos de los vecinos de Antea
// (semitransparentes, repiten lo que dijeron aquel día), puertas de casas del eco, corrientes que empujan fuera de un
// paso y el manantial de curación del eco. Módulo puro salvo los guiones.
import { F, SPEAKER, OBJ, lines, zygardeSays, byGender } from './b14_common.js';

/** Respiraderos verdes (solo en el presente). */
export function ventEvents(prefix, list) {
  return list.map((v, i) => ({ id: `${prefix}_${i}`, type: 'diveVent', x: v.x, y: v.y }));
}

const ECHO_OPACITY = 150;

/**
 * Vecino del eco: dice sus líneas como si fuera aquel día (no ve del todo al jugador). La primera vez, Zygarde explica
 * qué son. `text` = [líneas] o (state) => [líneas].
 */
export function echoCitizen(id, x, y, sprite, dir, text, { move = 'still', name = 'Eco' } = {}) {
  return {
    id, x, y, name, sprite, dir, move, opacity: ECHO_OPACITY, trigger: 'action',
    script: async (ctx) => {
      const list = typeof text === 'function' ? text(ctx.state) : text;
      await lines(ctx, name, list);
      if (!ctx.flag(F.echoPeople)) {
        ctx.setFlag(F.echoPeople);
        await zygardeSays(ctx, 'Son ecos. Repiten lo que dijeron aquel día. No nos ven… del todo.');
      }
    },
  };
}

/** Puerta de una casa del eco (no se entra): las voces repiten la misma conversación. */
export function echoDoor(id, x, y) {
  return {
    id, x, y, trigger: 'action', noOver: true,
    script: async (ctx) => {
      await ctx.say('La puerta no cede. Dentro, unas voces repiten la misma conversación una y otra vez.');
    },
  };
}

/**
 * Corriente que sale de un paso mientras `open(state)`: al pisarla empuja `length` casillas en `dir`. La primera vez
 * (flag `seenFlag`) se explica con `firstText` y una línea de Zygarde.
 */
export function outflowCurrent(id, x, y, { dir = 2, length = 4, open, seenFlag, firstText, coreText }) {
  const DIR = { 2: 'down', 4: 'left', 6: 'right', 8: 'up' };
  return {
    id, x, y,
    pages: [{
      when: (s) => Boolean(s) && open(s),
      through: true, trigger: 'touch', lock: false,
      glow: { name: 'zygardeCurrent', dir },
      script: async (ctx) => {
        ctx.se('PRSFX- Water Sport', { volume: 60 });
        ctx.face('player', 10 - dir);
        await ctx.move('player', ['direction_fix_on', ...Array(length).fill(DIR[dir]), 'direction_fix_off'], { through: false, speed: 5 });
        if (seenFlag && !ctx.flag(seenFlag)) {
          ctx.setFlag(seenFlag);
          if (firstText) await ctx.say(firstText);
          if (coreText) await zygardeSays(ctx, coreText);
        }
      },
    }],
  };
}

/** Manantial de curación del eco: cura al equipo (y en el presente recarga la burbuja). */
export function springEvent(id, x, y, era) {
  return {
    id, x, y, name: 'Manantial', solid: true, noOver: true, trigger: 'action',
    glow: { name: 'softLight', radius: 60, intensity: 0.5, pulse: 0.6, color: [104, 216, 192] },
    script: async (ctx) => {
      ctx.me('heal');
      await ctx.flash([104, 216, 192], 12, 120);
      ctx.heal();
      ctx.scene?.zygarde?.refillDive?.(ctx.player.x, ctx.player.y, { silent: true });
      await ctx.say(era === 'primigenia'
        ? 'Un manantial tibio brota entre las piedras. El agua tiene un brillo verde. Tu equipo recupera fuerzas.'
        : 'El agua del manantial brilla con un verde tenue, como el de Zygarde. Tu equipo recupera fuerzas.');
    },
  };
}

/** Objetos del suelo (visibles u ocultos). list = [{ id, x, y, item, hidden, count }] */
export function itemEvents(list) {
  return list.map((it) => ({ id: it.id, type: 'item', x: it.x, y: it.y, item: it.item, count: it.count ?? 1, hidden: Boolean(it.hidden) }));
}

/** Gráfico de una caja de sprite grande con bloqueos invisibles a los lados. */
export function bigSprite(id, x, y, sprite, dir, text, { block = [], when = null, extra = {} } = {}) {
  const pageBase = { sprite, dir, directionFix: true, walkAnime: false, solid: true, noOver: true, trigger: 'action', ...extra };
  const script = async (ctx) => { for (const t of [].concat(typeof text === 'function' ? text(ctx.state) : text)) await ctx.say(t); };
  const main = { id, x, y, pages: [{ ...pageBase, ...(when ? { when } : {}), script }] };
  const side = block.map(([bx, by]) => ({
    id: `${id}_${bx}_${by}`, x: bx, y: by,
    pages: [{ ...(when ? { when } : {}), solid: true, noOver: true, trigger: 'action', script }],
  }));
  return [main, ...side];
}

export { SPEAKER, OBJ, byGender };
