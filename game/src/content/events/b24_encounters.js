// Captura ordinaria, KO→descanso y derrotas recuperables; ningún guion entrega un legendario salvaje por atajo.
import { bossBattle } from '../common/bossBattle.js';
import { isMounted } from '../../world/zygarde/mount.js';
import { expedition, isActive, registryReady, flag, markHallazgo } from './b24_registry.js';
import { LEGENDS, encounterCondition, encounterRequest, capturedFlag, restVar, restCount } from './b24_conditions.js';

export const BLOCKED_TEXT = Object.freeze({
  story: 'El lugar está en calma. El Registro abre después de tu regreso del Eje.',
  inactive: 'Esta expedición está en pausa. Puedes seguirla desde el Registro de Sabela, en la Aduana Vieja de Nexo.',
  hypothesis: 'Ya tienes una pista: vuelve al Registro y marca en el mapa el lugar de tu hipótesis.',
  caught: 'El encuentro quedó registrado. Ya no espera aquí.', resting: 'Se ha retirado. Volverá después de descansar.',
  reports: 'El Bidoof sigue sobre el agua. Faltan tres informes distintos de las rutas 1, 2, 4, 5 y 11.',
  stealth: 'Las hojas tiemblan. Camina ocho pasos sin correr ni montar antes de acercarte.',
  berry: 'Celebi espera una baya de tu Mochila.', night: 'El brillo aparece de noche, desde las ocho hasta el amanecer.',
  day: 'Este visitante llega de día, desde el amanecer hasta las ocho de la tarde.', clear: 'La roca del deseo necesita una noche sin lluvia, nieve ni tormenta.',
  star: 'Deja un Trozo Estrella en la roca del deseo.', justice: 'Antes de combatir, termina la prueba de justicia de este lugar.',
  swords: 'Cobalion, Terrakion y Virizion deben venir en tu propio equipo, despiertos y sin huevos.',
  choice: 'La Piedra Crisol espera tu elección. Si ya se rompió, lleva sus fragmentos a la Forja de Tizón.',
  ideals: 'Reshiram y Zekrom deben acompañarte en tu propio equipo, despiertos.',
  dusk: 'La voz responde al atardecer: entre las cinco y las ocho de la tarde.', sing: 'Ningún Pokémon despierto de tu equipo conoce Canto con PP.',
  steps: 'Camina 300 pasos por la Reserva sin debilitar un salvaje; puedes capturarlo o huir.',
  streak: 'Faltan diez victorias salvajes seguidas en la Sima. Capturar, huir o perder rompe la cuenta.',
  escort: 'Carbink necesita que lo escoltes y lo defiendas de los tres Sableye.',
  mechanisms: 'Activa el mecanismo de Agua y luego el de Fuego, antes de que pasen 20 pasos.',
  otherLight: 'Trae al otro compañero de la luz en tu propio equipo: Solgaleo o Lunala, despierto.',
  traveler: 'Solo puedes viajar aquí con Solgaleo o Lunala en tu propio equipo, despierto.',
  ultraRule: 'Completa la regla de esta Ultrazona. La puerta de regreso permanece abierta.',
  ultras: 'Registra los once Ultraentes, incluida la evolución de Poipole a Naganadel, antes de volver a investigar la luz.',
  gears: 'La tienda de trastos de Lúmina necesita los cinco Engranajes antiguos para terminar la reparación.',
  electric: 'En la Subestación, usa Danza Lluvia y después Trueno con los movimientos de tu propio equipo.',
});
export function environment(ctx) {
  return { db: ctx.db, hour: ctx.state.hour, weather: ctx.scene?.weather?.type || 'none', running: Boolean(ctx.player?.canRun?.()), mounted: isMounted(ctx.world) };
}
const owned = (s, species) => Boolean(s.flag(capturedFlag(species)) || s.data.dex.caught[species]);
export async function legendFight(ctx, species) {
  const L = typeof species === 'string' && Object.hasOwn(LEGENDS, species) ? LEGENDS[species] : null;
  if (!L) return null;
  const reason = encounterCondition(ctx.state, species, environment(ctx));
  if (reason !== 'ready') { await ctx.say(BLOCKED_TEXT[reason] || 'Todavía no hay un encuentro aquí.'); return null; }
  const name = ctx.db.species[species]?.name || species;
  await ctx.say(`${name}, nivel ${L.level}. Puedes usar tus objetos, huir o capturarlo con una Poké Ball. Si lo debilitas, volverá cuando descanses.`);
  if (!(await ctx.confirm(`¿Acercarte a ${name}?`))) return null;
  ctx.cry?.(species);
  const result = await bossBattle(ctx, encounterRequest(species), null, { loseText: `${name} se aparta. Tu equipo está curado; puedes volver a intentarlo aquí.` });
  if (result === 'caught') {
    ctx.setFlag(capturedFlag(species)); ctx.setVar(restVar(species), -1);
    if (species === 'NECROZMA') { ctx.setFlag('dlc2_necrozma_crisis', false); if (ctx.scene) ctx.scene.darkness = null; }
    const e = expedition(L.expedition);
    if (e.species.every((p) => owned(ctx.state, p))) markHallazgo(ctx.state, e.id);
    const reward = { KYUREM: 'DNASPLICERS', DIANCIE: 'DIANCITE', MAGEARNA: 'MAGEARNITE', ZERAORA: 'ZERAORITE' }[species];
    if (reward && !ctx.state.hasItem(reward)) await ctx.giveItem(reward, 1);
    await ctx.say(`${name} se queda contigo. El hallazgo figura en tu Registro.`);
  } else if (result === 'win') {
    ctx.setVar(restVar(species), restCount(ctx.state)); await ctx.say(`${name} se retira. Descansa y podrás volver a encontrarlo.`);
  }
  ctx.requestRefresh?.(); return result;
}
export function legendVisible(s, species) {
  const L = typeof species === 'string' && Object.hasOwn(LEGENDS, species) ? LEGENDS[species] : null;
  if (!L || !registryReady(s) || !isActive(s, L.expedition) || s.flag(capturedFlag(species))) return false;
  const at = Number(s.var(restVar(species), -1));
  return !Number.isFinite(at) || at < 0 || restCount(s) > at;
}
export function legendEvent(species, { x, y }, { before = null, id = 'dlc2_' + species.toLowerCase(), ...extra } = {}) {
  if (!Object.hasOwn(LEGENDS, species) || !Number.isInteger(x) || !Number.isInteger(y)) throw new Error('B24: encuentro local inválido');
  return { id, x, y, name: species, pages: [{ when: (s) => legendVisible(s, species), sprite: `follower:${species}:0:0`, dir: 2, solid: true, stepAnime: true, trigger: 'action', ...extra,
    script: async (ctx) => { if (before && !(await before(ctx))) return; await legendFight(ctx, species); },
  }] };
}
