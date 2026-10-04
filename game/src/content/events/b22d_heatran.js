// B22: Piedra Magma de la Forja y calzada hacia el cráter activo de Heatran.
import { F, SPRITE, postgame, legendPresent } from './b22d_common.js';
import { legendBattle } from './b22d_battle.js';
import { HOOKS } from '../maps/b22d/layout.js';
import { extraTiles } from '../stamps/extraTiles.js';

export const HEATRAN_SPEC = Object.freeze({ species: 'HEATRAN', level: 72, moves: ['MAGMASTORM', 'EARTHPOWER', 'FLASHCANNON', 'ANCIENTPOWER'] });

export async function giveMagmaStone(ctx) {
  if (ctx.flag(F.magmaStone)) { await ctx.say('La Piedra Magma reconoce el cráter activo. Busca la orilla sur del lago de magma.', { speaker: 'Brasa' }); return; }
  await ctx.say('La forja ha soltado esta piedra. No se enfría, pero tampoco quema. Es una Piedra Magma.', { speaker: 'Brasa' });
  await ctx.giveItem('MAGMASTONE');
  ctx.setFlag(F.magmaStone);
  await ctx.say('Llévala a la orilla sur del cráter activo. Debajo de ese magma se mueve algo que no es roca.', { speaker: 'Brasa' });
}

export function withHeatranForge(events) {
  return events.map((e) => e.id !== 'brasa' ? e : { ...e, pages: [...(e.pages || [{ script: e.script }]),
    { when: postgame, sprite: e.sprite, dir: e.dir, trigger: 'action', script: giveMagmaStone }] });
}

export function heatranCraterEvents() {
  const C = HOOKS.crater;
  const tile = extraTiles('Cueva1').find((t) => t.name === 'pilar_enlosado')?.id;
  if (!tile) throw new Error('B22d: falta el suelo de la calzada');
  const patch = C.causeway.flatMap(([x, y]) => [[x, y, 0, 0], [x, y, 1, tile]]);
  const open = (s) => postgame(s) && s.flag(F.causeway);
  return [
    { id: 'b22d_calzada', ...C.shore, pages: [
      { when: postgame, through: true, trigger: 'action',
        script: async (ctx) => {
          if (!ctx.state.hasItem('MAGMASTONE')) { await ctx.say('El magma oculta el paso. Brasa conoce las piedras de esta forja.'); return; }
          await ctx.say('La Piedra Magma vibra. Una hilera de losas de basalto sube hasta la boca del cráter.');
          ctx.setFlag(F.causeway); ctx.requestRefresh?.();
        } },
      { when: open, patch, through: true, trigger: 'action', script: async (ctx) => { await ctx.say('La calzada llega hasta el cráter activo.'); } },
    ] },
    { id: 'heatran', ...C.vent, pages: [{ when: (s) => open(s) && legendPresent(s, 'heatran'),
      sprite: SPRITE.heatran, solid: true, move: 'still', trigger: 'action',
      script: async (ctx) => { ctx.cry('HEATRAN'); await legendBattle(ctx, 'heatran', HEATRAN_SPEC, { retry: C.retry, battleback: 'Volcan', environment: 'Cave' }); } }] },
  ];
}

/** Un solo guion de acción en la orilla: conserva la descripción previa al postgame. */
export function withHeatranCrater(events) {
  return [...events.map((e) => e.id !== 'orilla_lava_20' ? e : { ...e,
    pages: [{ trigger: 'action', noOver: true, script: e.script }, { when: postgame, through: true, script: null, trigger: null }] }),
  ...heatranCraterEvents()];
}
