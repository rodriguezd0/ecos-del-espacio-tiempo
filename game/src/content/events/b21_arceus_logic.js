// Reglas del combate final contra Arceus (docs/CAMPANA.md B21 §4; D23). Módulo PURO: construye la petición de combate
// con el sistema de fases de jefe del motor (battle/core/bossPhases.js) y los ganchos que aplican las reglas:
//   · Tres fases de orden fijo: Tierra (Tabla Terrax) → Fantasma (Tabla Terror) → Normal (sin objeto; la Tabla
//     Legendaria NO se equipa: es lo que suelta al final). Arceus nivel 75, Multitipo, un único combate.
//   · Transición: al llegar a 0 PS en las fases 1 y 2 no se debilita: suelta la Tabla, cambia de tipo, recupera todos
//     sus PS, se borran los cambios de estadísticas y las trampas del campo, y el equipo del jugador recupera el 25 %
//     de sus PS máximos (los debilitados siguen debilitados).
//   · Captura: bloqueada en las fases 1 y 2 («Arceus aún sostiene la Tabla X»; el motor no gasta Ball ni turno) y en
//     la 3 hasta que Arceus baja del 50 % y suelta la Tabla Legendaria; desde entonces no usa Recuperación (en la
//     fase 3 la usa una sola vez). La Master Ball solo sirve entonces (y garantiza la captura). Ratio 3; no huye.
//   · Cada transición guarda una instantánea del equipo y la mochila («Reintentar fase» vuelve a ella).
import { BATTLE_STATS } from '../../battle/core/constants.js';
import { createPokemon, maxHP } from '../../battle/core/pokemon.js';
import { makeUnmega } from '../../battle/core/pokemonUtil.js';
import { bossBattleRequest } from '../common/bossBattle.js';
import { PHASE_TEXT, BATTLE_TEXT } from './b21_texts.js';
import { MUSIC, BATTLEBACK, cloneJson } from './b21_common.js';

export const ARCEUS_LEVEL = 75;
export const PLAYER_BOON = 0.25; // +25 % de PS al equipo en cada transición (canon)
export const FINAL_PHASE = 2;

/** Fases en orden fijo (forma de ARCEUS en species.json: 4 Tierra, 7 Fantasma, 0 Normal). */
export const ARCEUS_PHASES = Object.freeze([
  Object.freeze({ key: 'tierra', form: 4, item: 'EARTHPLATE', plate: 'EARTHPLATE', moves: Object.freeze(['JUDGMENT', 'STONEEDGE', 'SWORDSDANCE', 'RECOVER']) }),
  Object.freeze({ key: 'fantasma', form: 7, item: 'SPOOKYPLATE', plate: 'SPOOKYPLATE', moves: Object.freeze(['JUDGMENT', 'SHADOWBALL', 'CALMMIND', 'RECOVER']) }),
  Object.freeze({ key: 'normal', form: 0, item: null, plate: 'LEGENDPLATE', moves: Object.freeze(['JUDGMENT', 'EXTREMESPEED', 'HYPERBEAM', 'RECOVER']) }),
]);

/** Fase entre 0 y 2 (la variable guardada puede venir vacía o fuera de rango). */
export function clampPhase(n) {
  const v = Number(n);
  return Number.isInteger(v) ? Math.max(0, Math.min(FINAL_PHASE, v)) : 0;
}

/** Música y fondo de una fase (CAMPANA §1.8). */
export function phaseStage(phase) {
  const final = clampPhase(phase) === FINAL_PHASE;
  return { bgm: final ? MUSIC.battleFinal : MUSIC.battle, battleback: final ? BATTLEBACK.phase3 : BATTLEBACK.phases12 };
}

/** Fase absoluta en curso dentro de un combate que empezó en `startPhase`. */
export const absolutePhase = (battle, startPhase) => clampPhase(startPhase + (battle?.phaseState?.index || 0));

/** Arceus de la fase `phase` (Pokémon serializable): forma, Tabla equipada, movimientos y Recuperación única en la 3. */
export function createArceus(db, phase, { rng } = {}) {
  const p = ARCEUS_PHASES[clampPhase(phase)];
  const pk = createPokemon(db, 'ARCEUS', ARCEUS_LEVEL, {
    form: p.form, heldItem: p.item, moves: [...p.moves], ability: 'MULTITYPE', shiny: false, rng,
    ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
  });
  if (clampPhase(phase) === FINAL_PHASE) return { ...pk, moves: pk.moves.map((m) => (m.id === 'RECOVER' ? { ...m, pp: 1 } : m)) };
  return pk;
}

/**
 * Copia de un Pokémon del combate tal como quedaría fuera de él (lo mismo que hace pbEndOfBattle): sin Megaevolución
 * y con el objeto que llevaba al empezar. Si no, «Reintentar fase» dejaría un Mega en el mapa (o dos Megas en el
 * siguiente combate) y perdería para siempre un objeto robado o quemado en la fase anterior.
 */
function outOfBattleCopy(db, pkmn, heldItem) {
  const copy = cloneJson(pkmn);
  if (db) {
    makeUnmega(db, copy);
    const max = maxHP(db, copy);
    if (copy.hp > max) copy.hp = max;
  }
  if (heldItem !== undefined) copy.heldItem = heldItem;
  return copy;
}

/** Instantánea del equipo y la mochila del jugador dentro del combate (tras la cura de la transición). */
export function battleSnapshot(battle) {
  const count = battle.party1starts?.length > 1 ? battle.party1starts[1] : battle.party1.length;
  const initial = battle.initialItems?.[0] || [];
  const party = battle.party1.slice(0, count)
    .map((p, i) => (p ? outOfBattleCopy(battle.db, p, initial[i]) : null))
    .filter(Boolean);
  return { party, bag: { ...(battle.bag || {}) } };
}

/** Instantánea de la partida (equipo y mochila) antes de empezar un combate. */
export function stateSnapshot(state) {
  return { party: cloneJson(state.party), bag: { ...(state.data.bag || {}) } };
}

/** Borra trampas de los dos bandos (Púas, Púas Tóxicas, Trampa Rocas, Red Viscosa). */
export function clearHazards(battle) {
  for (const side of battle.sides || []) {
    const e = side.effects;
    e.Spikes = 0;
    e.ToxicSpikes = 0;
    e.StealthRock = false;
    e.StickyWeb = false;
  }
}

/** Borra los cambios de estadísticas de todos los combatientes en pie. */
export function resetAllStages(battle) {
  for (const b of battle.allBattlers?.() || []) for (const s of BATTLE_STATS) b.stages[s] = 0;
}

/** El equipo del jugador recupera `frac` de sus PS máximos (los debilitados no). → PS recuperados en total. */
export function boostPlayerTeam(battle, frac = PLAYER_BOON) {
  let total = 0;
  const count = battle.party1starts?.length > 1 ? battle.party1starts[1] : battle.party1.length;
  battle.party1.slice(0, count).forEach((pkmn, i) => {
    if (!pkmn || pkmn.egg || !(pkmn.hp > 0)) return;
    const active = battle.battlers.find((b) => b && !b.opposes(0) && b.pokemonIndex === i && b.pokemon === pkmn);
    const max = active ? active.totalhp : battle.maxHPOf(pkmn);
    const amount = Math.max(1, Math.floor(max * frac));
    if (active) total += active.pbRecoverHP(amount);
    else {
      const next = Math.min(max, pkmn.hp + amount);
      total += next - pkmn.hp;
      pkmn.hp = next;
    }
  });
  return total;
}

/** Recuperación solo una vez (fase 3) o nunca más (tras soltar la Tabla Legendaria). */
export function limitRecover(battler, pp) {
  for (const m of battler?.moves || []) if (m.id === 'RECOVER') m.pp = Math.min(m.pp, pp);
}

/**
 * Condición de captura (rules.catchCondition del motor). Fases 1–2: «Arceus aún sostiene la Tabla X»; fase 3: solo
 * tras soltar la Tabla Legendaria (por debajo del 50 %).
 */
export function arceusCatchRule(battle, startPhase) {
  const phase = absolutePhase(battle, startPhase);
  if (phase < FINAL_PHASE) return { allowed: false, reason: BATTLE_TEXT.held(PHASE_TEXT[phase].plate) };
  if (!battle.b21LegendDropped) return { allowed: false, reason: BATTLE_TEXT.held(PHASE_TEXT[FINAL_PHASE].plate) };
  return { allowed: true, reason: null };
}

/** Final de ronda (rules.onEndOfRound): en la fase 3, al bajar del 50 %, suelta la Tabla Legendaria. */
export function arceusRoundRule(battle, startPhase) {
  if (battle.b21LegendDropped || absolutePhase(battle, startPhase) !== FINAL_PHASE) return false;
  const arceus = battle.battlers[1];
  if (!arceus || arceus.isFainted() || arceus.hp * 2 > arceus.totalhp) return false;
  battle.b21LegendDropped = true;
  limitRecover(arceus, 0);
  battle.pbDisplay(BATTLE_TEXT.legend);
  battle.pbDisplay(BATTLE_TEXT.catchable);
  return true;
}

/** Transición hacia la fase absoluta `phase` (1 o 2) para config.phases. `session.snapshots[phase]` se rellena. */
export function phaseTransition(phase, session) {
  const p = ARCEUS_PHASES[phase];
  const prev = PHASE_TEXT[phase - 1];
  const txt = PHASE_TEXT[phase];
  return {
    name: p.key,
    form: p.form,
    item: p.item,
    moves: [...p.moves],
    heal: 1,
    cureStatus: true,
    resetStages: true,
    clearEffects: true,
    message: BATTLE_TEXT.change(txt.type),
    before: (battle) => { battle.pbDisplay(BATTLE_TEXT.drop(prev.plate)); },
    onEnter: (battle, battler) => {
      clearHazards(battle);
      resetAllStages(battle);
      battle.pbDisplay(BATTLE_TEXT.boon);
      boostPlayerTeam(battle, PLAYER_BOON);
      if (phase === FINAL_PHASE) limitRecover(battler, 1);
      const stage = phaseStage(phase);
      battle.queueEvent('bossPhase', { bgm: stage.bgm, backdrop: stage.battleback });
      battle.pbDisplay(BATTLE_TEXT.question(txt.question));
      if (session) session.snapshots[phase] = battleSnapshot(battle);
    },
  };
}

/**
 * Petición de combate para ctx.scene.startBattle / world/battleFlow.js#runBattle, empezando en `startPhase` (0–2).
 * opts: { db, session: { snapshots }, rng }. Devuelve un objeto nuevo en cada llamada.
 * Las reglas de combate de guion salen del helper común (BALANCE.md: `bossBattleRequest` → canLose + noMoneyLoss).
 * El guion no usa `bossBattle()` entero porque D23 pide otra salida al perder: «Reintentar fase» devuelve el equipo
 * y la Mochila a como estaban al empezar la fase (sin curar) y «Retirarse» cura en la antecámara (b21_arceus.js).
 */
export function arceusRequest({ db, startPhase = 0, session = null, rng } = {}) {
  const start = clampPhase(startPhase);
  const stage = phaseStage(start);
  const phases = [];
  for (let k = start + 1; k <= FINAL_PHASE; k++) phases.push(phaseTransition(k, session));
  return bossBattleRequest({
    type: 'wild',
    wild: createArceus(db, start, { rng }),
    bgm: stage.bgm,
    battleback: stage.battleback,
    transition: 'zoomIn',
    phases,
    phaseTarget: 1,
    rules: {
      canRun: false,
      catchCondition: (battle) => arceusCatchRule(battle, start),
      onEndOfRound: (battle) => { arceusRoundRule(battle, start); },
    },
  });
}

/** Fase alcanzada al terminar un combate que empezó en `startPhase` (resultado del motor: result.phase.index). */
export function reachedPhase(startPhase, result) {
  return clampPhase(clampPhase(startPhase) + (Number(result?.phase?.index) || 0));
}

/** PS máximos de un Pokémon (ayuda para pruebas). */
export const maxHPOf = (db, p) => maxHP(db, p);
