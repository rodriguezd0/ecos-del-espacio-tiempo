// Guiones de campo genéricos: hablar con el Pokémon acompañante y el hook de nado (Zygarde "swim").
// Textos genéricos, sin contenido narrativo.
import { displayName, maxHP } from '../battle/core/pokemon.js';

const FOLLOWER_LINES = {
  high: ['{n} está muy contento de caminar a tu lado.', '{n} da saltitos de alegría.', '{n} te mira con cariño.'],
  mid: ['{n} mira a su alrededor con curiosidad.', '{n} olfatea el aire.', '{n} sigue tus pasos atentamente.'],
  low: ['{n} parece un poco distante.', '{n} te observa en silencio.'],
  hurt: ['{n} parece cansado…', '{n} necesita descansar.'],
};

/** Hablar con el seguidor: se gira hacia el jugador, globo y frase breve según su estado. */
export async function followerTalk(ctx, follower) {
  const pkmn = follower.pokemon;
  if (!pkmn) return;
  follower.turnToward(ctx.player);
  const name = displayName(ctx.db, pkmn);
  let max = 0;
  try { max = maxHP(ctx.db, pkmn); } catch { max = 0; }
  let pool = FOLLOWER_LINES.mid;
  if (max && pkmn.hp < max / 3) pool = FOLLOWER_LINES.hurt;
  else if ((pkmn.happiness ?? 70) >= 170) pool = FOLLOWER_LINES.high;
  else if ((pkmn.happiness ?? 70) < 50) pool = FOLLOWER_LINES.low;
  ctx.cry(pkmn.species, pkmn.form || 0);
  await ctx.emote(follower, pool === FOLLOWER_LINES.high ? '♥' : pool === FOLLOWER_LINES.hurt ? '…' : '♪');
  const line = pool[Math.floor(Math.random() * pool.length)].replace('{n}', name);
  await ctx.say(line);
}

/** Hook de campo: el jugador mira al agua y pulsa A. Requiere la capacidad de Zygarde "swim". */
export async function swimHook(ctx) {
  if (!ctx.zygarde('swim')) {
    await ctx.say('El agua es de un azul profundo.');
    return;
  }
  const r = await ctx.choice(['Sí', 'No'], { message: 'El agua es de un azul profundo. ¿Quieres nadar?', cancel: 1 });
  if (r !== 0) return;
  ctx.se('PRSFX- Surf');
  if (ctx.player.startSurf()) await ctx.scene.runner.until(() => !ctx.player.busy());
}
