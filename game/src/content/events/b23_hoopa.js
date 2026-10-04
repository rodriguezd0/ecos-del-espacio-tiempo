import { F, V, isPostgame, restCount, hoopaReady, megaZygardeUsed, completeZygarde, lines } from './b23_common.js';
import { bossBattleRequest, recoverAfterLoss } from '../common/bossBattle.js';
import { calcStats } from '../../battle/core/pokemon.js';

export function hoopaRequest(state) {
  const sealed = state.flag(F.sealed);
  return bossBattleRequest({ type: 'wild', noCoop: true, bgm: 'Legendario', battleback: 'Templo',
    wild: { species: 'HOOPA', form: sealed ? 0 : 1, level: 80,
      moves: sealed ? ['PSYCHIC', 'SHADOWBALL', 'DRAINPUNCH', 'NASTYPLOT'] : ['HYPERSPACEFURY', 'PSYCHIC', 'DRAINPUNCH', 'NASTYPLOT'],
      ivs: { hp: 26, atk: 26, def: 26, spa: 26, spd: 26, spe: 26 } },
    rules: { canRun: true, catchCondition: (battle) => sealed || (state.itemCount('PRISONBOTTLE') && megaZygardeUsed({ megaEvolutions: battle.megaEvolved }))
      ? { allowed: true } : { allowed: false, reason: 'Primero debes calmarlo con Mega Zygarde y la Vasija Castigo. La Ball no se gastará.' } },
  });
}
async function leaveThroughRing(ctx) {
  if (ctx.flag(F.departure)) return;
  await lines(ctx, ['No vuelvo con las manos vacías.', 'Los que quieran seguirme, ahora.'], 'Gael');
  const routes = { b23_gael: ['right', 'right', 'right', 'right', 'right'],
    b23_fiel_o: Array(9).fill('right'), b23_fiel_e: ['up', 'up', 'up', 'up', 'right'] };
  for (const [id, route] of Object.entries(routes)) {
    const ch = ctx.world?.events.find((e) => e.id === id);
    if (ch) { await ctx.move(ch, route, { through: false, speed: 4 }); ctx.erase(ch); }
  }
  ctx.setFlag(F.departure);
  await ctx.say('Gael y los dos técnicos atraviesan el último anillo. La abertura se cierra tras ellos.');
}
async function seal(ctx, result) {
  if (ctx.flag(F.sealed)) return;
  ctx.setFlag(F.calm);
  await ctx.say('Las ondas verdes de Mega Zygarde contienen la abertura. Hoopa vuelve a escuchar.');
  await ctx.say('La Vasija Castigo absorbe el exceso de energía. Hoopa recupera su forma contenida.');
  ctx.se?.('PRSFX- Teleport'); await ctx.flash?.([165, 225, 150], 18, 130);
  ctx.setFlag(F.sealed);
  if (result.caught?.uid) for (const p of [...ctx.state.party, ...ctx.state.data.boxes.flat()].filter(Boolean)) {
    if (p.uid !== result.caught.uid) continue;
    p.form = 0; p.stats = calcStats(ctx.db, p); p.hp = Math.min(p.hp, p.stats.hp);
  }
  await leaveThroughRing(ctx);
  ctx.setFlag('dlc1_nodo_devuelto'); ctx.setFlag(F.end);
  await ctx.say('La piedra-nodo cae entre las tuberías. La Red puede devolverla al Laberinto. En Almenara vuelve a correr el agua y el faro permanece encendido.');
  await ctx.say('La piedra respondió a nosotros. Eso no le daba derecho a forzarla.', { telepathy: true });
}
export async function hoopaFight(ctx) {
  if (!isPostgame(ctx.state) || !ctx.flag(F.gaelWon)) { await ctx.say('Gael se interpone entre tú y el anillo.'); return null; }
  if (!hoopaReady(ctx.state)) { await ctx.say(ctx.flag(F.hoopaCaught) ? 'El anillo está en calma. Hoopa se fue contigo.' : 'Hoopa se ha retirado. Volverá cuando descanses.'); return null; }
  if (!ctx.flag(F.sealed) && (!ctx.state.itemCount('PRISONBOTTLE') || !completeZygarde(ctx.state))) {
    await ctx.say('Trae la Vasija Castigo de las ruinas del Oasis y a Zygarde Completo. El Centro de Almenara tiene PC.'); return null;
  }
  if (!await ctx.confirm(ctx.flag(F.sealed) ? 'Hoopa está en calma. ¿Acercarte para combatir o capturarlo?' : 'Hoopa Desatado está fuera de control. ¿Calmarlo con Mega Zygarde?')) return null;
  await ctx.say(ctx.flag(F.sealed) ? 'La captura es opcional. Si lo debilitas, reaparecerá después de descansar.' : 'Megaevoluciona a Zygarde desde el menú de movimientos. Después puedes capturar a Hoopa con una Ball o debilitarlo; la Vasija sellará la abertura.');
  const result = await ctx.battleResult(hoopaRequest(ctx.state));
  if (result.outcome === 'lose' || result.outcome === 'forfeit') {
    await recoverAfterLoss(ctx, null, { loseText: 'El anillo se repliega. Tu equipo está curado; puedes volver a intentarlo.' });
  } else if (['win', 'caught'].includes(result.outcome)) {
    if (result.outcome === 'win') ctx.setVar(V.ko, restCount(ctx.state));
    if (!ctx.flag(F.sealed) && megaZygardeUsed(result)) await seal(ctx, result);
    if (result.outcome === 'caught') ctx.setFlag(F.hoopaCaught);
    else if (!ctx.flag(F.sealed)) await ctx.say('Hoopa se retira, pero el anillo sigue inestable. Solo Mega Zygarde puede contenerlo. Volverá después de descansar.');
  }
  ctx.requestRefresh?.(); return result.outcome;
}
export function hoopaEvents() {
  return [{ id: 'b23_hoopa', x: 17, y: 13, pages: [
    { when: (s) => s.flag(F.gaelWon) && !s.flag(F.sealed) && hoopaReady(s), sprite: 'follower:HOOPA:1:0', dir: 2, solid: true, trigger: 'action', script: hoopaFight },
    { when: (s) => s.flag(F.sealed) && hoopaReady(s), sprite: 'HOOPA', dir: 2, solid: true, trigger: 'action', script: hoopaFight },
    { when: (s) => s.flag(F.gaelWon) && !hoopaReady(s), through: true, trigger: 'action', script: hoopaFight },
  ] }];
}
