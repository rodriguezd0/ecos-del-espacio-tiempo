// B22: sueño determinista de Villa Alba; Mamá orienta y teje el acceso a Cresselia.
import { F, V, LEGENDS, SPRITE, postgameAwake, postgame, isNight, legendPresent } from './b22d_common.js';
import { legendBattle } from './b22d_battle.js';
import { HOOKS, PESADILLA as P } from '../maps/b22d/layout.js';

export const DARKRAI_SPEC = Object.freeze({ species: 'DARKRAI', level: 70, moves: ['DARKVOID', 'DARKPULSE', 'DREAMEATER', 'NASTYPLOT'] });
export const CRESSELIA_SPEC = Object.freeze({ species: 'CRESSELIA', level: 70, moves: ['PSYCHIC', 'MOONBLAST', 'MOONLIGHT', 'AURORABEAM'] });
const SILHOUETTES = Object.freeze({ mama: SPRITE.mom, policia: 'policia', profesor: 'profesor', gael: 'gael' });

/** El primer sueño comienza de noche; después de encontrarse con Darkrai basta el siguiente sueño profundo. */
export function dreamEligible(s, { kind, mode, startedAtNight } = {}) {
  return postgameAwake(s) && s.flag(F.rumor) && !s.flag(LEGENDS.darkrai.caught)
    && kind === 'home' && mode === 'deep' && (startedAtNight || s.flag(F.darkraiMet));
}

export async function momPostgameTalk(ctx) {
  if (!ctx.flag(F.rumor)) {
    await ctx.say('Tienes mala cara, ¿duermes bien? Si vuelve esa pesadilla, duerme profundamente en tu cama, esta noche.', { speaker: 'Mamá' });
    ctx.setFlag(F.rumor);
  } else if (ctx.flag(F.darkraiMet) && !ctx.flag(F.dreamcatcher)) {
    await ctx.say('Anoche te oí hablar dormido. He tejido esto mientras esperaba que amaneciese.', { speaker: 'Mamá' });
    await ctx.giveItem('DREAMCATCHER');
    ctx.setFlag(F.dreamcatcher);
    await ctx.say('Es un Atrapasueños. Llévalo al Islote Lumbre de noche: allí cuentan que la luz de la luna ahuyenta las pesadillas.', { speaker: 'Mamá' });
  } else {
    await ctx.say(ctx.flag(F.dreamcatcher) ? 'La luna de Lumbre se ve mejor de noche. Y tu cama sigue aquí, cuando quieras.' : 'Si vuelve la pesadilla, duerme profundamente. Por la mañana estaré abajo.', { speaker: 'Mamá' });
  }
}

export function withDreamMom(event) {
  return { ...event, pages: [...(event.pages || []), { when: postgameAwake, trigger: 'action', script: momPostgameTalk }] };
}

async function homeSleep(ctx) {
  if (!ctx.flag('b01_left_town')) { await ctx.say('Tu cama. Sigue deshecha.'); return; }
  const i = await ctx.choice(['Descansar', 'Dormir profundamente', 'Cancelar'], { message: '¿Cómo quieres descansar?', cancel: 2 });
  if (i !== 0 && i !== 1) return;
  const mode = i === 1 ? 'deep' : 'rest';
  const night = isNight(ctx.state);
  ctx.setVar(V.sleepNight, night ? 1 : 0);
  const result = await ctx.rest({ kind: 'home', mode });
  if (!result?.rested || !dreamEligible(ctx.state, { kind: 'home', mode, startedAtNight: night })) return;
  ctx.setFlag(F.nightmare);
  ctx.setFlag(F.nightmareIntro, false);
  for (const a of P.silhouettes) ctx.setFlag(`b22d_${a.id}_vista`, false);
  await ctx.warp(P.id, P.arrive.x, P.arrive.y, P.arrive.dir, { fade: true });
}

export function homeBedEvents() {
  return HOOKS.bed.tiles.map(([x, y], i) => ({ id: `b22d_cama_${i}`, x, y, trigger: 'action', noOver: true, solid: true, script: homeSleep }));
}

export async function wakeFromDream(ctx) {
  ctx.setFlag(F.nightmare, false);
  ctx.setFlag(F.nightmareIntro, false);
  const a = HOOKS.bed.wake;
  await ctx.warp('casa_prota_2f', a.x, a.y, a.dir, { fade: true });
}

async function darkraiScript(ctx) {
  ctx.setFlag(F.darkraiMet);
  await ctx.say('La sombra no pertenece a ninguna casa. Se levanta del suelo y te mira.');
  ctx.cry('DARKRAI');
  try {
    await legendBattle(ctx, 'darkrai', DARKRAI_SPEC, { retry: null, battleback: 'Nocturno', bgm: 'Legendario' });
  } finally {
    await wakeFromDream(ctx);
  }
}

export function nightmareEvents() {
  return [
    { id: 'b22d_pesadilla_llegada', x: 0, y: 0, trigger: 'auto', through: true,
      when: (s) => s.flag(F.nightmare) && !s.flag(F.nightmareIntro),
      script: async (ctx) => { ctx.setFlag(F.nightmareIntro); await ctx.say('Villa Alba está en silencio. Hay luz en las ventanas, pero detrás no vive nadie.'); } },
    { id: 'b22d_sueno_puerta', ...P.door, trigger: 'action', through: true,
      script: async (ctx) => { if (await ctx.confirm('¿Despertar?')) await wakeFromDream(ctx); } },
    { id: 'darkrai', ...P.darkrai, pages: [{ when: (s) => s.flag(F.nightmare) && legendPresent(s, 'darkrai'),
      sprite: SPRITE.darkrai, move: 'still', solid: true, trigger: 'action', script: darkraiScript }] },
    ...P.silhouettes.map((a) => ({ id: a.id, x: a.x, y: a.y, pages: [{ when: (s) => s.flag(F.nightmare) && !s.flag(`b22d_${a.id}_vista`),
      sprite: SILHOUETTES[a.who], opacity: 100, through: true, trigger: 'touch',
      script: async (ctx) => { ctx.setFlag(`b22d_${a.id}_vista`); await ctx.say('Al acercarte, la silueta se deshace.'); } }] })),
  ];
}

export function lumbreEvents() {
  const a = HOOKS.lumbre;
  return [{ id: 'cresselia', ...a.cresselia, pages: [{
    when: (s) => legendPresent(s, 'cresselia', (st) => isNight(st) && st.hasItem('DREAMCATCHER')),
    sprite: SPRITE.cresselia, solid: true, move: 'still', trigger: 'action',
    script: async (ctx) => {
      await ctx.say('El Atrapasueños recoge la luz de la luna. Sobre el mar, una figura brilla sin hacer ruido.');
      ctx.cry('CRESSELIA');
      await legendBattle(ctx, 'cresselia', CRESSELIA_SPEC, { retry: a.retry, battleback: 'water' });
    },
  }] }];
}
