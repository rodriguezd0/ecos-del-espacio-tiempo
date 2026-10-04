// Postgame III: CAMPANA B22 y POKEDEX_DISTRIBUCION. Estado serializable, sin azar ni esperas reales.
import { stormActive } from '../../world/rest.js';

export const F = Object.freeze({
  ramon: 'b22c_ramon_pista', ash: 'b22c_ceniza_sagrada', brazier: 'b22c_brasero_encendido',
  blue: 'b22c_prisma_azul', red: 'b22c_prisma_rojo', dew: 'b22c_rocio_bondad',
  rain: 'b22c_danza_lluvia', sun: 'b22c_dia_soleado', latiasSeen: 'b22c_latias_vista',
  latiasite: 'b22c_latiasita', latiosite: 'b22c_latiosita',
});
export const LEGENDS = Object.freeze(Object.fromEntries([
  ['lugia','LUGIA',75,['AEROBLAST','HYDROPUMP','PSYCHIC','RECOVER']],
  ['hooh','HOOH',75,['SACREDFIRE','BRAVEBIRD','EXTRASENSORY','RECOVER']],
  ['kyogre','KYOGRE',75,['ORIGINPULSE','ICEBEAM','THUNDER','CALMMIND']],
  ['groudon','GROUDON',75,['PRECIPICEBLADES','FIREBLAST','SOLARBEAM','BULKUP']],
  ['rayquaza','RAYQUAZA',78,['DRAGONASCENT','DRAGONPULSE','EXTREMESPEED','FLY']],
  ['latias','LATIAS',70,['MISTBALL','DRAGONPULSE','RECOVER','CALMMIND']],
  ['latios','LATIOS',70,['LUSTERPURGE','DRAGONPULSE','PSYCHIC','RECOVER']],
].map(([key,species,level,moves])=>[key,Object.freeze({key,species,level,moves:Object.freeze(moves),
  caught:`b22c_${key}_capturado`,beaten:`b22c_${key}_vencido`,rest:`b22c_${key}_descanso`})])));

export const postgame = (s) => Boolean(s?.flag?.('game_cleared') && s.flag('b21_fin'));
export const restCount = (s) => Number(s.var('rest_count',0)) || 0;
export const atDawn = (s) => s.hour >= 6 && s.hour < 9;
export const partyHas = (s,sp) => s.party.some(p=>p && !p.egg && p.species===sp);
export function partyMove(s,id) {
  const i=s.party.findIndex(p=>p && !p.egg && p.hp>0 && p.moves.some(m=>m.id===id));
  return i<0 ? null : i;
}
export function relicMissing(s,id,source) {
  const held=[...s.party,...s.boxes.flat()].some(p=>p?.heldItem===id);
  return held?'La reliquia está equipada: retira el objeto del Pokémon del equipo o del PC y guárdalo en la Mochila.':`Necesitas ${source} en la Mochila.`;
}
export function latiosSite(s) {
  const n=Number(s.var('b22c_latios_ruta',0));
  return Number.isInteger(n) && n>=0 && n<3 ? n : 0;
}
export function available(s,key) {
  const L=LEGENDS[key];
  return Boolean(L && postgame(s) && !s.flag(L.caught)
    && (!s.flag(L.beaten) || restCount(s)>Number(s.var(L.rest,-1))));
}
export function recordOutcome(s,key,outcome) {
  const L=LEGENDS[key];
  if(!L) throw new Error(`B22c: legendario desconocido ${key}`);
  if(outcome==='caught') s.setFlag(L.caught);
  if(outcome==='win') { s.setFlag(L.beaten); s.setVar(L.rest,restCount(s)); return 'beaten'; }
  return outcome;
}
/** Motivo de bloqueo para páginas y scripts, siempre comprobado de nuevo antes del combate. */
export function gateFor(s,key) {
  if(!postgame(s)) return 'Este lugar sigue en silencio. Termina el epílogo antes de volver.';
  if(key==='lugia' && (!s.zygardeAbility('dive') || !s.flag(F.ramon))) return 'Ramón, en el faro de Caleta, conoce la Sima Marina. Necesitas Buceo y su pista.';
  if(key==='hooh' && (!s.flag(F.brazier) || !atDawn(s))) return 'Olvido guarda Ceniza Sagrada. Enciende el brasero del Cerro del Alba al amanecer, entre las seis y las nueve.';
  if(key==='kyogre' && !s.hasItem('BLUEORB'))return relicMissing(s,'BLUEORB','el Prisma Azul del eco de Antea');
  if(key==='kyogre' && !s.flag(F.rain)) return 'Usa Danza Lluvia en el remolino del sudeste del Mar del Sur con el Prisma Azul.';
  if(key==='groudon' && !s.hasItem('REDORB'))return relicMissing(s,'REDORB','el Prisma Rojo de la galería honda de Mina Galena');
  if(key==='groudon' && !s.flag(F.sun)) return 'Usa Día Soleado con el Prisma Rojo en la Veta Magmática.';
  if(key==='rayquaza' && (!partyHas(s,'KYOGRE') || !partyHas(s,'GROUDON') || !stormActive(s))) return 'Trae a Kyogre y Groudon en tu equipo durante una tormenta. Puedes descansar hasta tormenta en el Hotel Mirador de Lúmina.';
  if(key==='latias' && !s.hasItem('SOULDEW')) return relicMissing(s,'SOULDEW','Rocío Bondad, guardado en el eco de Antea');
  if(key==='latios' && !s.flag(F.latiasSeen) && !s.data.dex.seen.LATIAS) return 'Primero debes ver a Latias en el Lago del Sentir.';
  return null;
}
