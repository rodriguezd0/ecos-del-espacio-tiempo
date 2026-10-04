// Almenara (CAMPANA B23/D25/D26): historia posterior al epílogo, persistente y en solitario.
import { isPostgame, restCount } from './b22a_common.js';
export { isPostgame, restCount };
export const F = Object.freeze({
  theft: 'dlc1_nodo_robado', letter: 'dlc1_carta', arrival: 'dlc1_almenara',
  pump: 'dlc1_bomba', lighthouse: 'dlc1_faro', salinas: 'dlc1_salinas', oasis: 'dlc1_oasis',
  vessel: 'dlc1_vasija', crisol: 'dlc1_crisol', recording: 'dlc1_grabacion',
  experiment: 'dlc1_experimento', stone: 'dlc1_zygardita', gaelWon: 'dlc1_gael_vencido',
  calm: 'dlc1_hoopa_calmo', sealed: 'dlc1_hoopa_sellado', hoopaCaught: 'dlc1_hoopa_capturado',
  departure: 'dlc1_gael_se_va', nodeReturned: 'dlc1_nodo_devuelto', end: 'dlc1_fin',
});
export const V = Object.freeze({ ko: 'dlc1_hoopa_descanso', gaelLosses: 'dlc1_gael_derrotas' });
export const OBJ = Object.freeze({
  ring: 'asset:objects/b23_anillo.png', crystal: 'asset:objects/b23_cristal.png',
  machine: 'asset:objects/b23_extractor.png', vessel: 'asset:objects/b23_vasija.png',
});
export const canDepart = (s) => isPostgame(s) && s.flag(F.letter);
export const completeZygarde = (s) => s.party.find((p) => p?.species === 'ZYGARDE' && [2, 3].includes(p.form) && !p.egg && p.hp > 0);
export const megaZygardeUsed = (result) => (result?.megaEvolutions || []).some((m) => m.species === 'ZYGARDE' && m.form === 4 && m.side === 0 && m.owner === 0);
export const hoopaReady = (s) => isPostgame(s) && s.flag(F.gaelWon) && !s.flag(F.hoopaCaught) && restCount(s) > Number(s.var(V.ko, -1));
export async function lines(ctx, list, speaker = null) {
  for (const text of list) await ctx.say(text, speaker ? { speaker } : {});
}
export async function onlyAlmenara(ctx) {
  if (canDepart(ctx.state)) return true;
  await ctx.say('El ferri de Almenara todavía no está en servicio para tu viaje.');
  await ctx.warp('ciudad_nexo', 26, 40, 2);
  return false;
}
