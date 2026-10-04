// Encuentros visibles del Porvenir: captura normal y regreso después de descansar.
import { bossBattle } from '../common/bossBattle.js';
import { F, MUSIC, paradoxFlag, restCount } from './b22e_common.js';
import { paradoxByKey, staticIvs, caughtCount } from './b22e_grieta_logic.js';

export function paradoxRequest(key) {
  const p = paradoxByKey(key);
  if (!p) throw new Error(`Paradoja desconocida: ${key}`);
  return { type: 'wild', noCoop: true, wild: { species: p.species, level: p.level, ivs: staticIvs(key) },
    bgm: MUSIC.paradox, battleback: 'Espacio' };
}

export async function paradoxBattle(ctx, key) {
  const p = paradoxByKey(key);
  if (!p) throw new Error(`Paradoja desconocida: ${key}`);
  ctx.setFlag(paradoxFlag.seen(key));
  ctx.cry?.(p.species);
  const result = await bossBattle(ctx, paradoxRequest(key), null,
    { loseText: 'La luz vuelve al campamento. Puedes intentarlo otra vez.' });
  if (result === 'caught') {
    ctx.setFlag(paradoxFlag.caught(key));
    ctx.setVar(paradoxFlag.rest(key), -1);
    if (caughtCount(ctx.state) === 7) ctx.setFlag(F.paradojasTodas);
  } else if (result === 'win') {
    ctx.setVar(paradoxFlag.rest(key), restCount(ctx.state));
    await ctx.say(`${p.name} se aleja. Volverá cuando descanses.`);
  }
  ctx.requestRefresh?.();
  return result;
}
