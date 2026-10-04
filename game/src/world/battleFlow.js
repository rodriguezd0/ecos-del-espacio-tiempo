// Inicio de combates desde el mapa: destellos + transición (estilo pbBattleAnimation de Essentials),
// llamada a battle() de battle/api.js, aplicación del resultado y derrota (volver al último punto de cura).
import { engine } from '../core/engine.js';
import { battle, battleBGM } from '../battle/api.js';
import { applyBattleResult, caughtList, finalizeBattleResult, storeCaught, whiteoutText } from '../battle/scene/results.js';
import { createPokemon, healed } from '../battle/core/pokemon.js';
import { ui } from '../ui/api.js';
import { isNightHour } from '../render/dayNight.js';
import { observeBattle } from '../content/events/b24_observers.js';

const WILD_ANIMS = { day: ['snakeSquares', 'diagonalBubbleTL', 'diagonalBubbleBR', 'risingSplash'], night: ['snakeSquares', 'diagonalBubbleBR', 'diagonalBubbleBR', 'risingSplash'] };
const TRAINER_ANIMS = { day: ['spinBall', 'bars', 'shrinkingPieces', 'risingSplash'], night: ['spinBall', 'mosaic', 'shrinkingPieces', 'risingSplash'] };

/** 0 exterior, 1 interior, 2 cueva, 3 agua (como Essentials). */
function battleLocation(scene) {
  const def = scene.world.current.def;
  if (scene.world.player.surfing) return 3;
  if (scene.world.encounters.hasBase('cave') || def.cave) return 2;
  if (!def.outdoor) return 1;
  return 0;
}

function toPokemon(db, spec, extra = {}) {
  if (spec?.uid) return spec;
  if (!spec?.species) throw new Error(`Pokémon de combate inválido: ${JSON.stringify(spec)}`);
  return createPokemon(db, spec.species, spec.level ?? 5, { ...spec, ...extra });
}

/** Animación de entrada: 2 destellos y transición. */
export async function battleIntro(scene, { trainer = false, transition = null } = {}) {
  const loc = battleLocation(scene);
  const night = isNightHour(engine.state.hour) && scene.world.current.def.outdoor;
  const c = loc === 2 || night ? 0 : 255;
  for (let i = 0; i < 2; i++) {
    await scene.fx.fadeTo(1, 12, [c, c, c]);
    await scene.fx.fadeTo(0, 12, [c, c, c]);
  }
  const set = trainer ? TRAINER_ANIMS : WILD_ANIMS;
  const name = transition || set[night ? 'night' : 'day'][loc];
  const p = scene.world.player;
  await scene.fx.playTransition(name, 50, { center: { x: p.realX + 16 - scene.camera.renderX, y: p.realY + 16 - scene.camera.renderY } });
  await scene.runner.wait(6);
}

/**
 * Construye la configuración completa (docs/ARCHITECTURE.md §7), ejecuta el combate y aplica el resultado.
 * @returns {Promise<{ outcome, ... }>}
 */
export async function runBattle(scene, config = {}) {
  const state = engine.state;
  const db = engine.data;
  const audio = engine.audio;
  const isTrainer = config.type === 'trainer' || (!config.type && Boolean(config.trainer));
  const def = scene.world.current.def;
  const terrain = scene.world.player.terrainTag();
  const opponent = { ...(config.opponent || {}) };
  // Atajo de ARCHITECTURE §6: ctx.battle({ wild: { species, level, … } })
  if (!isTrainer && config.wild && !opponent.party) opponent.party = [toPokemon(db, config.wild, { shiny: config.wild.shiny })];
  if (Array.isArray(opponent.party)) opponent.party = opponent.party.map((s) => toPokemon(db, s));
  const full = {
    format: 'single',
    battleback: def.battleback || null,
    environment: terrain.battleEnvironment || null,
    weather: scene.weather.type !== 'none' ? scene.weather.type : null,
    time: isNightHour(state.hour) ? 'night' : 'day',
    bgm: config.bgm || battleBGM({ ...config, type: isTrainer ? 'trainer' : config.type }) || (isTrainer ? 'Entrenador' : 'Salvaje'),
    ...config,
    type: isTrainer ? 'trainer' : (config.type || 'wild'),
    player: { name: state.player.name, gender: state.player.gender, id: state.player.id,
      party: state.party, bag: state.data.bag, ...(config.exhibition ? config.player : {}) },
    opponent,
    rules: { canRun: !isTrainer, canCatch: !isTrainer, expGain: true, ...(config.rules || {}) },
  };
  if (full.type === 'wild') for (const p of opponent.party || []) state.registerSeen(p.species);

  audio?.pushBGM?.();
  audio?.playBGM?.(full.bgm);
  await battleIntro(scene, { trainer: isTrainer, transition: config.transition });
  scene.inBattle = true;
  let result;
  try {
    // Contrato único (battle/scene/results.js#finalizeBattleResult): { outcome, party, caught, stored, canLose }.
    const raw = (await battle(full)) || { outcome: 'win' };
    result = finalizeBattleResult(raw, { stored: Boolean(raw.stored), canLose: Boolean(raw.canLose) });
  } catch (err) {
    console.error('Error en el combate:', err);
    engine.reportError?.(err);
    result = finalizeBattleResult({ outcome: 'forfeit', error: err }, { stored: true });
  }
  scene.inBattle = false;
  // Sin escena (o con una implementación instalada que no toca la partida) se aplica aquí.
  if (!result.stored && !config.exhibition) {
    applyBattleResult(state, result);
    for (const p of caughtList(result)) storeCaught(state, p);
  }
  if (observeBattle(state, { mapId: def.id, type: full.type, outcome: result.outcome,
    opponentSpecies: (opponent.party || []).map((p) => p.species), exhibition: Boolean(config.exhibition) })) scene.world.requestRefresh?.();
  audio?.resumeBGM?.(20);
  scene.world.encounters.reset();
  scene.fx.clearTransition();
  scene.fx.fadeAmount = 1;
  scene.fx.fadeColor = [0, 0, 0];
  scene.refreshFollower();
  // canLose puede venir de la petición, de sus reglas o del entrenador (battle/scene lo resuelve y lo devuelve).
  const canLose = Boolean(config.canLose || config.rules?.canLose || result.canLose);
  // Derrota: la pantalla sigue en negro hasta el punto de cura (como pbStartOver de Essentials).
  if (result.outcome === 'lose' && !canLose) await whiteout(scene, result);
  else await scene.fx.fadeIn(24);
  return result;
}

/** Combate salvaje a partir de un encuentro { species, level, form, shiny }. */
export function runWildBattle(scene, enc) {
  return runBattle(scene, { type: 'wild', wild: enc });
}

/** Derrota: (aviso si el combate no lo dio), curación y regreso al último punto de cura (o al inicio del mapa). */
export async function whiteout(scene, result = null) {
  const state = engine.state;
  await scene.fx.fadeOut(20);
  const text = whiteoutText(result);
  if (text) await ui.message(text);
  state.setParty(state.party.map((p) => healed(engine.data, p)));
  const heal = state.healPoint;
  const def = scene.world.current.def;
  if (heal) await scene.transfer(heal.mapId, heal.x, heal.y, heal.dir ?? 2, { fade: false });
  else await scene.transfer(def.id, def.start?.x ?? scene.world.player.x, def.start?.y ?? scene.world.player.y, 2, { fade: false });
  await scene.fx.fadeIn(20);
}
