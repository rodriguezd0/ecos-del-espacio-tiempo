// B22: Casilda avisa de una sombra de las piedras del Umbral que no sigue el compás de las demás.
import { F, V, SPRITE, OBJ, postgame, isNight, legendPresent } from './b22d_common.js';
import { legendBattle } from './b22d_battle.js';
import { HOOKS } from '../maps/b22d/layout.js';

export const MARSHADOW_SPEC = Object.freeze({ species: 'MARSHADOW', level: 70, moves: ['SPECTRALTHIEF', 'CLOSECOMBAT', 'SHADOWSNEAK', 'ICEPUNCH'] });

export async function casildaHint(ctx) {
  if (!postgame(ctx.state) || ctx.flag(F.casildaWarn)) return;
  await ctx.say('De noche, las sombras de la explanada se mecen juntas. Una llega tarde a todos los movimientos. Síguela hasta el dintel: algo se esconde dentro.', { speaker: 'Casilda' });
  ctx.setFlag(F.casildaWarn);
}

export function withMarshadowHint(events) {
  const wrap = (p) => !p.script ? p : { ...p, script: async (ctx) => { await casildaHint(ctx); return p.script(ctx); } };
  return events.map((e) => e.id !== 'casilda' ? e : { ...wrap(e), pages: e.pages?.map(wrap) });
}

export function umbralShadowEvents() {
  const U = HOOKS.explanada;
  const ready = (s) => postgame(s) && isNight(s) && s.flag(F.casildaWarn) && !s.flag(F.shadowFound);
  return [
    ...U.shadows.filter((a) => !a.odd).map((a) => ({ id: `b22d_${a.id}`, x: a.x, y: a.y, when: ready,
      sprite: OBJ.shadow, dir: 2, stepAnime: true, speed: 1, pattern: 0, directionFix: true, through: true, shadow: false,
      trigger: 'action', script: async (ctx) => { await ctx.say('Esta sombra sigue el compás de las piedras.'); } })),
    ...U.route.map(([x, y], i) => ({ id: i ? `b22d_sombra_impar_${i}` : 'b22d_sombra_impar', x, y, pages: [{
      when: (s) => ready(s) && Number(s.var(V.shadowStep, 0)) === i,
      sprite: OBJ.shadow, dir: 2, stepAnime: true, speed: 3, pattern: 2, directionFix: true, through: true, shadow: false,
      trigger: 'action', script: async (ctx) => {
        ctx.setVar(V.shadowStep, i + 1);
        if (i === U.route.length - 1) { ctx.setFlag(F.shadowFound); await ctx.say('La sombra llega al dintel. Dos ojos se abren dentro de ella.'); }
        else await ctx.say('Esta sombra se mueve a destiempo. Se escurre hacia otra piedra de la explanada.');
        ctx.requestRefresh?.();
      },
    }] })),
    { id: 'marshadow', ...U.marshadow, pages: [{ when: (s) => s.flag(F.shadowFound) && isNight(s) && legendPresent(s, 'marshadow'),
      sprite: SPRITE.marshadow, solid: true, trigger: 'action',
      script: async (ctx) => { ctx.cry('MARSHADOW'); await legendBattle(ctx, 'marshadow', MARSHADOW_SPEC, { retry: U.battle, battleback: 'Templo' }); },
    }] },
  ];
}
