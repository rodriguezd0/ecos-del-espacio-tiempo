// B22b: condiciones persistentes y peticiones individuales de las Nubes, aves y bestias (CAMPANA §8).
import { isPostgame } from './b22a_common.js';
export { isPostgame };

const legend = (key, name, level, moves, extra = {}) => Object.freeze({
  species: key.toUpperCase(), name, level, moves: Object.freeze(moves),
  caught: `b22b_${key}_capturado`, rest: `b22b_${key}_descanso`, ...extra,
});
export const hintFlag = (key) => `b22b_pista_${key}`;
export const LEGENDS = Object.freeze({
  tornadus: legend('tornadus', 'Tornadus', 70, ['HURRICANE','AIRSLASH','NASTYPLOT','DARKPULSE'], { hint: hintFlag('tornadus'), battleback: 'Acantilado' }),
  thundurus: legend('thundurus', 'Thundurus', 70, ['THUNDERBOLT','DARKPULSE','FOCUSBLAST','THUNDERWAVE'], { hint: hintFlag('thundurus'), battleback: 'Desierto' }),
  landorus: legend('landorus', 'Landorus', 72, ['EARTHPOWER','ROCKSLIDE','EXTRASENSORY','SWORDSDANCE'], { battleback: 'Cueva' }),
  articuno: legend('articuno', 'Articuno', 70, ['ICEBEAM','HURRICANE','ROOST','ANCIENTPOWER'], { hint: hintFlag('articuno'), open: 'b22b_articuno_hielo_abierto', types: Object.freeze(['FIRE']), battleback: 'CuevaHielo' }),
  zapdos: legend('zapdos', 'Zapdos', 70, ['THUNDERBOLT','DRILLPECK','ROOST','ANCIENTPOWER'], { hint: hintFlag('zapdos'), open: 'b22b_zapdos_fulgurita_abierta', types: Object.freeze(['ROCK','ICE']), battleback: 'Central' }),
  moltres: legend('moltres', 'Moltres', 70, ['FLAMETHROWER','AIRSLASH','ROOST','ANCIENTPOWER'], { hint: hintFlag('moltres'), open: 'b22b_moltres_basalto_abierto', types: Object.freeze(['WATER']), battleback: 'Volcan' }),
  raikou: legend('raikou', 'Raikou', 70, ['THUNDERBOLT','EXTRASENSORY','CALMMIND','CRUNCH'], { beast: true, battleback: 'Acantilado' }),
  entei: legend('entei', 'Entei', 70, ['FLAMETHROWER','STONEEDGE','EXTRASENSORY','CRUNCH'], { beast: true, battleback: 'ZonaEscarpada' }),
  suicune: legend('suicune', 'Suicune', 70, ['SURF','ICEBEAM','CALMMIND','EXTRASENSORY'], { beast: true, battleback: 'Agua' }),
});
export const restCount = (s) => Number(s?.var('rest_count', 0)) || 0;
export function legendAvailable(s, key) {
  const L = LEGENDS[key];
  if (!L || !isPostgame(s) || s.flag(L.caught)) return false;
  const at = s.var(L.rest, null);
  return at === null || at === undefined || at === '' || Number(at) < 0 || restCount(s) > Number(at);
}
export function beastSeen(s, key) {
  const seen = s?.var(`b22b_${key}_avistamientos`, []);
  return Array.isArray(seen) ? [...new Set(seen.filter((v) => typeof v === 'string'))].slice(0, 3) : [];
}
/** Requisitos del encuentro; verlos/vencerlos no equivale a capturar los dos de las Nubes. */
export function condition(s, key, { mounted = false } = {}) {
  const L = LEGENDS[key];
  if (!isPostgame(s)) return 'story';
  if (s.flag(L.caught)) return 'caught';
  if (!legendAvailable(s, key)) return 'resting';
  if (L.hint && !s.flag(L.hint)) return 'hint';
  if (key === 'tornadus' && !mounted) return 'mount';
  if (key === 'thundurus' && Number(s.var('b22b_rayos', 0)) < 3) return 'lightning';
  if (key === 'landorus' && (!s.flag(LEGENDS.tornadus.caught) || !s.flag(LEGENDS.thundurus.caught))) return 'clouds';
  if (L.open && !s.flag(L.open)) return 'seal';
  if (L.beast && beastSeen(s, key).length < 3) return 'sightings';
  return 'ready';
}
/** Movimientos aprendidos del propio equipo. Huevos, debilitados y movimientos sin PP no actúan. */
export function fieldMoves(s, db, types) {
  return (s?.party || []).flatMap((p, partyIndex) => !p || p.egg || p.hp <= 0 ? [] :
    (p.moves || []).flatMap((m) => {
      const id = typeof m === 'string' ? m : m.id;
      const move = db?.moves?.[id];
      if (!move || !types.includes(move.type) || (typeof m !== 'string' && Number(m.pp) <= 0)) return [];
      return [{ partyIndex, move: id, label: `${p.nickname || db.species?.[p.species]?.name || p.species}: ${move.name}` }];
    }));
}
export function encounterRequest(key) {
  const L = LEGENDS[key];
  if (!L) throw new Error(`B22b: legendario desconocido ${key}`);
  return { type: 'wild', noCoop: true, wild: { species: L.species, level: L.level, moves: [...L.moves] }, bgm: 'Legendario', battleback: L.battleback };
}
