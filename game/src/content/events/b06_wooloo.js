// Encargo opcional del Bloque 6: el viento sin rumbo del P3 dispersa los rebaños de Wooloo (docs/CAMPANA.md B06,
// «Problema humano»). Un pastor de la Ruta 5 ha perdido dos: una en la Ruta 5 y otra en la Meseta. Al encontrarlas
// vuelven solas al redil; el pastor da las gracias con un objeto. Sin estado de fallo.
import { F, SPEAKER, SPRITE, lines } from './b06_common.js';

const STRAY_FLAGS = Object.freeze({ 1: F.wooloo1, 2: F.wooloo2 });
export const PASTOR_REWARD = 'LEFTOVERS';

/** Oveja perdida `n` (1 = Ruta 5, 2 = Meseta). */
export function woolooStray(n, { x, y }) {
  const flag = STRAY_FLAGS[n];
  return {
    id: `wooloo_perdida_${n}`, x, y, name: 'Wooloo',
    pages: [{
      when: (s) => Boolean(s) && !s.flag(flag), sprite: SPRITE.wooloo, dir: 2, move: { wander: 1 }, freq: 2, speed: 2,
      stepAnime: true, trigger: 'action',
      script: async (ctx) => {
        ctx.cry('WOOLOO');
        await ctx.say('¡Beee!');
        await ctx.say('La Wooloo lleva un cencerro con una marca pintada. Se asusta, da media vuelta y sale trotando hacia el redil de la Ruta 5.');
        await ctx.move('this', ['down', 'down', 'left', 'left', 'left'], { through: true, speed: 4.5 });
        ctx.setFlag(flag);
        ctx.erase('this');
      },
    }],
  };
}

async function pastorTalk(ctx) {
  const found = [F.wooloo1, F.wooloo2].filter((f) => ctx.flag(f)).length;
  if (ctx.flag(F.woolooReward)) {
    await ctx.say(ctx.flag(F.restored)
      ? 'Desde que el viento sopla derecho, el rebaño no se me mueve del redil. Da gusto.'
      : 'Todas en casa. A ver cuánto duran, con este viento loco.', { speaker: SPEAKER.pastor });
    return;
  }
  if (found < 2) {
    await lines(ctx, SPEAKER.pastor, [
      'Este viento no sabe de dónde viene ni adónde va. Sopla de un lado, luego del otro… y el rebaño se me desperdiga.',
      found === 0
        ? 'Me faltan dos Wooloo. Una se fue por la ruta, la otra subió hasta la meseta. Si las ves, dales un susto: saben volver solas.'
        : 'Ya ha vuelto una. Me falta la otra. Si la ves, dale un susto: sabe volver sola.',
    ]);
    return;
  }
  await lines(ctx, SPEAKER.pastor, [
    '¡Han vuelto las dos! Con la lana llena de abrojos, pero enteras.',
    'Toma. No es gran cosa, pero a los Pokémon les sienta bien llevarlo encima.',
  ]);
  await ctx.giveItem(PASTOR_REWARD, 1);
  ctx.setFlag(F.woolooReward);
}

/** El pastor junto al redil. */
export function pastorEvent({ x, y, dir = 2 }) {
  return { id: 'pastor', x, y, name: SPEAKER.pastor, sprite: 'anil:veterano', dir, move: 'still', trigger: 'action', script: pastorTalk };
}

/** Wooloo del redil: tres siempre; las perdidas aparecen al volver. `spots` = [[x, y]…] (5 casillas). */
export function penWooloo(spots) {
  return spots.map(([x, y], i) => {
    const needs = i === 3 ? F.wooloo1 : i === 4 ? F.wooloo2 : null;
    return {
      id: `wooloo_redil_${i}`, x, y, name: 'Wooloo',
      pages: [{
        when: (s) => Boolean(s) && (!needs || s.flag(needs)), sprite: SPRITE.wooloo, dir: [2, 4, 6, 8][i % 4],
        move: { wander: 1 }, freq: 2, speed: 2, stepAnime: true, trigger: 'action',
        script: async (ctx) => { ctx.cry('WOOLOO'); await ctx.say('¡Beee!'); },
      }],
    };
  });
}
