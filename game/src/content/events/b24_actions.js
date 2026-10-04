// Acciones de campo del Registro. Recursos consumidos solo al aceptar, siempre del equipo propio.
import { isActive, registryReady, flag, markHallazgo } from './b24_registry.js';
import { learnedMoves, capturedFlag } from './b24_conditions.js';
import { environment, BLOCKED_TEXT } from './b24_encounters.js';
import { createEgg, addEggToParty } from '../../world/eggs.js';
import { bossBattle } from '../common/bossBattle.js';
import { walkEventTo } from './b01_town_path.js';

export const readyAction = (ctx, id, maps) => isActive(ctx.state, id) && ctx.state.flag(flag(id, 'confirmada')) && maps.includes(ctx.map?.id);
const refresh = (ctx) => ctx.requestRefresh?.();
const received = (s, species) => s.flag(capturedFlag(species)) || s.data.dex.caught[species];
async function walk(ctx, id, x, y) {
  return Boolean(ctx.map?.passable && await walkEventTo(ctx, id, x, y, { speed: 4, fallback: false }));
}
export async function reportImpostor(ctx) {
  const maps = ['ruta_1', 'ruta_2', 'ruta_4', 'ruta_5', 'ruta_11'];
  if (!isActive(ctx.state, 'mew') || !maps.includes(ctx.map?.id)) return false;
  const raw = ctx.state.var('dlc2_mew_informes', []);
  const reports = Array.isArray(raw) ? [...new Set(raw.filter((v) => maps.includes(v)))] : [];
  if (!reports.includes(ctx.map.id)) ctx.setVar('dlc2_mew_informes', [...reports, ctx.map.id]);
  ctx.setFlag('dlc2_mew_indicio');
  await ctx.say(`El Bidoof camina sobre el agua sin mojarse. Informe ${ctx.state.var('dlc2_mew_informes').length} de 3. El rastro vuelve hacia la Ruta 1.`);
  return true;
}
export async function offerBerry(ctx) {
  if (!readyAction(ctx, 'celebi', ['b24_santuario_neblino'])) return false;
  if (ctx.flag('dlc2_celebi_baya')) return true;
  const env = environment(ctx);
  if (env.running || env.mounted || Number(ctx.var('dlc2_celebi_sigilo', 0)) < 8) { await ctx.say(BLOCKED_TEXT.stealth); return false; }
  const berries = Object.keys(ctx.db.items).filter((id) => ctx.state.hasItem(id) && (ctx.db.items[id].flags || []).includes('Berry'));
  if (!berries.length) { await ctx.say('Necesitas una baya. Sabela vende Bayas Aranja en la Aduana.'); return false; }
  const i = await ctx.choice([...berries.map((id) => ctx.db.items[id].name), 'Cancelar']);
  if (!Number.isInteger(i) || !berries[i] || !await ctx.confirm('¿Dejar esta baya en la piedra?')) return false;
  ctx.state.removeItem(berries[i], 1); ctx.setFlag('dlc2_celebi_baya'); await ctx.say('La baya queda entre las hojas. Celebi acepta que te acerques.'); return true;
}
export async function offerStar(ctx) {
  if (!readyAction(ctx, 'jirachi', ['mesa_vientos'])) return false;
  if (ctx.flag('dlc2_jirachi_estrella')) return true;
  const env = environment(ctx);
  if (!(env.hour >= 20 || env.hour < 6)) { await ctx.say(BLOCKED_TEXT.night); return false; }
  if (env.weather !== 'none') { await ctx.say(BLOCKED_TEXT.clear); return false; }
  if (!ctx.state.hasItem('STARPIECE')) { await ctx.say('La roca necesita un Trozo Estrella. Sabela vende algunos en el Registro.'); return false; }
  if (!await ctx.confirm('¿Ofrecer un Trozo Estrella?')) return false;
  ctx.state.removeItem('STARPIECE', 1); ctx.setFlag('dlc2_jirachi_estrella'); await ctx.say('Una estrella responde al deseo.'); return true;
}
export async function collectManaphy(ctx) {
  if (!readyAction(ctx, 'manaphy', ['b24_cuna_coral']) || ctx.flag('dlc2_manaphy_huevo')) return false;
  if (!ctx.state.zygardeAbility('dive')) { await ctx.say('La cuna queda bajo el agua. Necesitas Buceo.'); return false; }
  if (ctx.state.party.length >= 6) { await ctx.say('El Huevo sigue protegido. Vuelve con un hueco en el equipo.'); return false; }
  if (!await ctx.confirm('¿Recoger el Huevo de la cuna?')) return false;
  const egg = createEgg(ctx.db, 'MANAPHY', { ot: { name: ctx.state.player.name, id: ctx.state.player.id }, metMap: ctx.map.id });
  if (!addEggToParty(ctx.state, egg)) return false;
  ctx.setFlag('dlc2_manaphy_huevo'); markHallazgo(ctx.state, 'manaphy'); refresh(ctx); await ctx.say('Has recogido un Huevo de Manaphy. Eclosionará mientras caminas.'); return true;
}
export async function rescueCosmog(ctx) {
  if (!readyAction(ctx, 'cosmog', ['b24_crater_lucero']) || ctx.flag('dlc2_cosmog_rescatado')) return false;
  if (ctx.state.party.length >= 6 && ctx.state.data.boxes.every((box) => box.every(Boolean))) { await ctx.say('Cosmog espera protegido. Deja un hueco en el equipo o en el PC y vuelve.'); return false; }
  if (!await ctx.confirm('Cosmog está atrapado bajo una losa. ¿Apartarla y ayudarlo?')) return false;
  if (!await ctx.givePokemon({ species: 'COSMOG', level: 40 })) return false;
  ctx.setFlag('dlc2_cosmog_rescatado'); markHallazgo(ctx.state, 'cosmog');
  await ctx.giveItem('SHINYSTONE', 1); await ctx.giveItem('DUSKSTONE', 1);
  await ctx.say('Cosmog quiere viajar contigo. Al nivel 43 será Cosmoem: Piedra Día para Solgaleo, Piedra Noche para Lunala. El otro espera en la Cumbre Azur con el primero en tu equipo.'); refresh(ctx); return true;
}
export async function chooseIdeal(ctx) {
  if (!readyAction(ctx, 'ideales', ['b24_dos_ideales'])) return false;
  if (!ctx.flag('dlc2_crisol_entregada')) { await ctx.giveItem('CRUCIBLESTONE', 1); ctx.setFlag('dlc2_crisol_entregada'); }
  if (!ctx.state.hasItem('CRUCIBLESTONE')) { await ctx.say(BLOCKED_TEXT.choice); return false; }
  const options = ['RESHIRAM', 'ZEKROM'].filter((id) => !received(ctx.state, id));
  if (!options.length) return false;
  const i = await ctx.choice([...options.map((id) => ctx.db.species[id].name), 'Cancelar'], { message: '¿Qué ideal quieres despertar?' });
  if (!Number.isInteger(i) || !options[i] || !await ctx.confirm('La Piedra se romperá. Sus fragmentos podrán volver a forjarse. ¿Continuar?')) return false;
  ctx.state.removeItem('CRUCIBLESTONE', 1); await ctx.giveItem('CRUCIBLEFRAGMENTS', 1); ctx.setVar('dlc2_ideales_elegido', options[i]);
  await ctx.say(`${ctx.db.species[options[i]].name} despierta. Si lo debilitas, descansa: no necesitas elegir de nuevo. Tras capturarlo, lleva los fragmentos a la Forja de Tizón.`); refresh(ctx); return true;
}
export async function forgeIdeal(ctx) {
  if (!readyAction(ctx, 'ideales', ['volcan_tizon'])) return false;
  if (!ctx.state.hasItem('CRUCIBLEFRAGMENTS') || !['RESHIRAM', 'ZEKROM'].some((s) => received(ctx.state, s))) { await ctx.say('Trae los Fragmentos Crisol después de capturar el primer ideal.'); return false; }
  if (!await ctx.confirm('¿Reunir los fragmentos en una Piedra Crisol?')) return false;
  ctx.state.removeItem('CRUCIBLEFRAGMENTS', 1); await ctx.giveItem('CRUCIBLESTONE', 1); await ctx.say('La piedra vuelve a ser una. En la Sima podrás despertar el otro ideal.'); return true;
}
const gearMaps = ['ciudad_estrato', 'estacion_talasa', 'villa_brontia', 'lumina_museo', 'nexo_astillero'];
export async function collectGear(ctx) {
  if (!registryReady(ctx.state) || !isActive(ctx.state, 'magearna') || !gearMaps.includes(ctx.map?.id)) return false;
  const key = `dlc2_magearna_engranaje_${ctx.map.id}`;
  if (ctx.flag(key)) { await ctx.say('La pieza de este lugar ya está en tu Registro.'); return false; }
  await ctx.giveItem('ANCIENTGEAR', 1); ctx.setFlag(key); ctx.setFlag('dlc2_magearna_indicio'); return true;
}
export async function repairMagearna(ctx) {
  if (!readyAction(ctx, 'magearna', ['lumina_trastos'])) return false;
  if (ctx.flag('dlc2_magearna_reparada')) return true;
  if (!gearMaps.every((id) => ctx.flag(`dlc2_magearna_engranaje_${id}`)) || ctx.state.itemCount('ANCIENTGEAR') < 5) { await ctx.say(BLOCKED_TEXT.gears); return false; }
  if (!await ctx.confirm('¿Entregar los cinco engranajes para reparar la máquina?')) return false;
  ctx.state.removeItem('ANCIENTGEAR', 5); ctx.setFlag('dlc2_magearna_reparada'); await ctx.say('Los engranajes encajan. Magearna despierta: puedes acercarte y capturarla.'); refresh(ctx); return true;
}
const actions = Object.freeze({
 water: { expedition: 'volcanion', maps: ['b24_termas_tizon'], types: ['WATER'], text: 'activar el agua' },
 fire: { expedition: 'volcanion', maps: ['b24_termas_tizon'], types: ['FIRE'], text: 'encender el fuego' },
 rain: { expedition: 'zeraora', maps: ['brontia_subestacion'], ids: ['RAINDANCE'], text: 'usar Danza Lluvia' },
 thunder: { expedition: 'zeraora', maps: ['brontia_subestacion'], ids: ['THUNDER'], text: 'usar Trueno' },
 sing: { expedition: 'meloetta', maps: ['aldea_mnemos'], ids: ['SING'], text: 'usar Canto' },
});
export async function fieldAction(ctx, key) {
  const a = typeof key === 'string' && Object.hasOwn(actions, key) ? actions[key] : null;
  if (!a || !readyAction(ctx, a.expedition, a.maps)) return false;
  if (key === 'fire' && Number(ctx.var('dlc2_volcanion_agua_pasos', 0)) <= 0) { await ctx.say('El agua se ha apagado. Actívala de nuevo y alcanza el fuego antes de 20 pasos.'); return false; }
  if (key === 'thunder' && !ctx.flag('dlc2_zeraora_lluvia')) { await ctx.say('Primero Danza Lluvia, después Trueno.'); return false; }
  if (key === 'sing' && !(ctx.state.hour >= 17 && ctx.state.hour < 20)) { await ctx.say(BLOCKED_TEXT.dusk); return false; }
  const moves = learnedMoves(ctx.state, ctx.db, a);
  if (!moves.length) { await ctx.say('Ningún Pokémon despierto de tu equipo conoce un movimiento válido con PP.'); return false; }
  const i = await ctx.choice([...moves.map((m) => m.label), 'Cancelar']);
  if (!Number.isInteger(i) || !moves[i] || !await ctx.confirm(`¿${a.text} con tu Pokémon?`)) return false;
  ctx.se?.('PRSFX- Psychic');
  if (key === 'water') ctx.setVar('dlc2_volcanion_agua_pasos', 20);
  if (key === 'fire') ctx.setFlag('dlc2_volcanion_mecanismos');
  if (key === 'rain') ctx.setFlag('dlc2_zeraora_lluvia');
  if (key === 'thunder') ctx.setFlag('dlc2_zeraora_tormenta');
  if (key === 'sing') ctx.setFlag('dlc2_meloetta_canto');
  await ctx.say(key === 'water' ? 'El agua fluye durante 20 pasos. El fuego espera al otro lado.' : 'El lugar responde al movimiento.'); refresh(ctx); return true;
}
const justiceMaps = { cobalion: 'b24_canteria_justicia', terrakion: 'b24_cueva_dunas', virizion: 'b24_claro_justicia' };
export async function justiceAction(ctx, id, index) {
  if (!Object.hasOwn(justiceMaps, id) || !readyAction(ctx, id, [justiceMaps[id]]) || !Number.isInteger(index) || index < 0 || index > 2) return false;
  const key = flag(id, 'rescates'); const raw = ctx.var(key, []); const done = Array.isArray(raw) ? raw.filter((n) => Number.isInteger(n) && n >= 0 && n < 3) : [];
  if (done.includes(index)) { await ctx.say('Este paso ya es seguro.'); return true; }
  if (!await ctx.confirm(id === 'cobalion' ? '¿Apuntalar esta roca para proteger a Timburr?' : id === 'terrakion' ? '¿Colocar el apoyo de este tramo?' : '¿Ayudar a este Pokémon a reunirse con sus compañeros?')) return false;
  const actor = id === 'virizion' ? `dlc2_justicia_${index}` : id === 'cobalion' ? `dlc2_timburr_${index}` : null;
  if (actor && !await walk(ctx, actor, 11 + index, 18)) { await ctx.say('Deja libre el camino hasta la zona segura y vuelve a ayudarlo.'); return false; }
  const next = [...new Set([...done, index])]; ctx.setVar(key, next);
  if (next.length === 3) ctx.setFlag(flag(id, 'prueba'));
  await ctx.say(next.length === 3 ? 'Los tres están a salvo. El guardián acepta tu ayuda.' : 'Un tramo más queda protegido.'); refresh(ctx); return true;
}
export async function escortCarbink(ctx) {
  if (!readyAction(ctx, 'diancie', ['b24_mina_diamante'])) return false;
  const stage = Math.max(0, Math.min(3, Number(ctx.var('dlc2_diancie_escolta', 0)) || 0));
  if (stage >= 3) { await ctx.say('Carbink ya está a salvo junto a Diancie.'); return true; }
  if (!await ctx.confirm(`Un Sableye bloquea a Carbink (${stage + 1} de 3). ¿Defenderlo?`)) return false;
  const outcome = await bossBattle(ctx, { type: 'wild', noCoop: true, wild: { species: 'SABLEYE', level: 65 + stage }, rules: { canCatch: false, canRun: false } }, null, { loseText: 'Carbink espera a tu lado. Tu equipo se ha curado; puedes intentarlo de nuevo.' });
  if (outcome !== 'win') return false;
  if (!await walk(ctx, 'dlc2_carbink', 13, 16 - stage * 4)) { await ctx.say('Carbink espera. Aparta a tu personaje del camino para poder acompañarlo.'); return false; }
  ctx.setVar('dlc2_diancie_escolta', stage + 1); await ctx.say(stage === 2 ? 'Carbink alcanza la cámara. Diancie sale a recibirlo.' : 'Carbink avanza contigo hacia la siguiente galería.'); refresh(ctx); return true;
}
