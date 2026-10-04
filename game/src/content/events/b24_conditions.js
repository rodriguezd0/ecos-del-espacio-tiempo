// Condiciones de hallazgo y encuentros normales del Registro (puras, compartidas por guiones y pruebas).
import { EXPEDITIONS, registryReady, isActive, flag } from './b24_registry.js';

const giftOrEvolution = new Set(['MANAPHY', 'PHIONE', 'COSMOG', 'NAGANADEL']);
const expeditionBySpecies = new Map(EXPEDITIONS.flatMap((e) => e.species.map((s) => [s, e.id])));
export const speciesExpedition = (species) => typeof species === 'string' ? expeditionBySpecies.get(species) || null : null;
const levels = { RESHIRAM: 75, ZEKROM: 75, KYUREM: 75, NECROZMA: 80, POIPOLE: 49 };
export const LEGENDS = Object.freeze(Object.fromEntries([...expeditionBySpecies].filter(([s]) => !giftOrEvolution.has(s)).map(([s, id]) => [s, Object.freeze({ species: s, expedition: id, level: levels[s] || (id.startsWith('ultra_') ? 75 : 70) })])));
export const ULTRA_SPECIES = Object.freeze(['NIHILEGO', 'BUZZWOLE', 'PHEROMOSA', 'XURKITREE', 'CELESTEELA', 'KARTANA', 'GUZZLORD', 'STAKATAKA', 'BLACEPHALON', 'POIPOLE', 'NAGANADEL']);
export const capturedFlag = (species) => flag(species.toLowerCase(), 'capturado');
export const restVar = (species) => flag(species.toLowerCase(), 'descanso');
export const restCount = (s) => { const n = Number(s.var('rest_count', 0)); return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0; };
export const partyHas = (s, species) => (s?.party || []).some((p) => p && !p.egg && p.hp > 0 && p.species === species);
export function learnedMoves(s, db, { ids = [], types = [] } = {}) {
  return (s?.party || []).flatMap((p, partyIndex) => !p || p.egg || p.hp <= 0 ? [] : (p.moves || []).flatMap((m) => {
    const id = typeof m === 'string' ? m : m?.id;
    const move = db?.moves?.[id];
    if (!move || (!ids.includes(id) && !types.includes(move.type)) || (typeof m !== 'string' && (!Number.isFinite(Number(m.pp)) || Number(m.pp) <= 0))) return [];
    return [{ partyIndex, move: id, label: `${p.nickname || db.species?.[p.species]?.name || p.species}: ${move.name}` }];
  }));
}
export function encounterCondition(s, species, env = {}) {
  const L = typeof species === 'string' && Object.hasOwn(LEGENDS, species) ? LEGENDS[species] : null;
  if (!L) return 'unknown';
  if (!registryReady(s)) return 'story';
  if (s.flag(capturedFlag(species))) return 'caught';
  if (!isActive(s, L.expedition)) return 'inactive';
  if (!s.flag(flag(L.expedition, 'confirmada'))) return 'hypothesis';
  const rested = Number(s.var(restVar(species), -1));
  if (Number.isFinite(rested) && rested >= 0 && restCount(s) <= rested) return 'resting';
  const hour = Number(env.hour ?? s.hour);
  switch (species) {
    case 'MEW': {
      const raw = s.var('dlc2_mew_informes', []);
      const reports = Array.isArray(raw) ? new Set(raw.filter((v) => ['ruta_1', 'ruta_2', 'ruta_4', 'ruta_5', 'ruta_11'].includes(v))) : new Set();
      if (reports.size < 3) return 'reports'; break;
    }
    case 'CELEBI':
      if (env.running || env.mounted || Number(s.var('dlc2_celebi_sigilo', 0)) < 8) return 'stealth';
      if (!s.flag('dlc2_celebi_baya')) return 'berry'; break;
    case 'JIRACHI':
      if (!(hour >= 20 || hour < 6)) return 'night';
      if ((env.weather || 'none') !== 'none') return 'clear';
      if (!s.flag('dlc2_jirachi_estrella')) return 'star'; break;
    case 'COBALION': case 'TERRAKION': case 'VIRIZION':
      if (!s.flag(flag(L.expedition, 'prueba'))) return 'justice'; break;
    case 'KELDEO':
      if (!['COBALION', 'TERRAKION', 'VIRIZION'].every((p) => partyHas(s, p))) return 'swords'; break;
    case 'RESHIRAM': case 'ZEKROM':
      if (s.var('dlc2_ideales_elegido', null) !== species) return 'choice'; break;
    case 'KYUREM':
      if (!partyHas(s, 'RESHIRAM') || !partyHas(s, 'ZEKROM')) return 'ideals'; break;
    case 'MELOETTA':
      if (!(hour >= 17 && hour < 20)) return 'dusk';
      if (!learnedMoves(s, env.db, { ids: ['SING'] }).length) return 'sing'; break;
    case 'XERNEAS':
      if (Number(s.var('dlc2_xerneas_pasos', 0)) < 300) return 'steps'; break;
    case 'YVELTAL':
      if (Number(s.var('dlc2_yveltal_racha', 0)) < 10) return 'streak'; break;
    case 'DIANCIE':
      if (Number(s.var('dlc2_diancie_escolta', 0)) < 3) return 'escort'; break;
    case 'VOLCANION':
      if (!s.flag('dlc2_volcanion_mecanismos')) return 'mechanisms'; break;
    case 'SOLGALEO': case 'LUNALA':
      if (!partyHas(s, species === 'SOLGALEO' ? 'LUNALA' : 'SOLGALEO')) return 'otherLight';
      if (species === 'SOLGALEO' ? !(hour >= 6 && hour < 20) : !(hour >= 20 || hour < 6)) return species === 'SOLGALEO' ? 'day' : 'night'; break;
    case 'NECROZMA':
      if (!ULTRA_SPECIES.every((p) => s.data.dex.caught[p])) return 'ultras'; break;
    case 'MAGEARNA':
      if (!s.flag('dlc2_magearna_reparada')) return 'gears'; break;
    case 'ZERAORA':
      if (!s.flag('dlc2_zeraora_tormenta')) return 'electric'; break;
    default:
      if (L.expedition.startsWith('ultra_')) {
        if (!partyHas(s, 'SOLGALEO') && !partyHas(s, 'LUNALA')) return 'traveler';
        if (!s.flag(flag(L.expedition, 'prueba'))) return 'ultraRule';
      }
  }
  return 'ready';
}
export function encounterRequest(species) {
  const L = typeof species === 'string' && Object.hasOwn(LEGENDS, species) ? LEGENDS[species] : null;
  if (!L) throw new Error(`B24: especie sin encuentro ${String(species)}`);
  return { type: 'wild', noCoop: true, wild: { species, level: L.level }, bgm: 'Legendario', rules: { canCatch: true, canRun: true } };
}
