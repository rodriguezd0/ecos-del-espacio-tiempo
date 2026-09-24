// Flujo de PARTIDA NUEVA (guion B01 §0): lo llama la pantalla de título (ui/screens/title.js → newGameFlow()).
//   1. Prólogo cinemático (la primera vez no se puede saltar; después START lo salta). Recordado en
//      localStorage ('ecos.prologue_seen') y como flag `prologue_seen` de la partida.
//   2. "¿Quién eres?": chico/chica + nombre (1–10 caracteres, sin nombre por defecto).
//   3. GameState nuevo en engine.state (opciones globales, reloj por la mañana).
//   4. Rótulo "Axis. Tres días después." y fundido a la habitación (casa_prota_2f; si aún no existe, dev_test).
// Nunca deja el juego sin escena: ante cualquier error se registra y se continúa con valores seguros.
import { engine } from '../core/engine.js';
import { applyOptions, globalOptionsForNewGame } from '../ui/core/options.js';
import { loadMapDefinition } from './maps/index.js';
import {
  createNewGameState, prologueSeen, markPrologueSeen, resolveStartMap, TIME_CAPTION,
} from './newgameRules.js';

/** @param {{ skipPrologue?: boolean }} opts (skipPrologue solo para desarrollo) */
export async function newGameFlow({ skipPrologue = false } = {}) {
  engine.state = null;
  if (!skipPrologue) await runPrologue();
  const identity = await askIdentity();
  const state = createNewGameState({ ...identity, options: globalOptionsForNewGame() });
  engine.state = state;
  applyOptions(state.options);
  await caption();
  await startWorld();
}

async function runPrologue() {
  try {
    const { playPrologue } = await import('./cutscenes/prologue.js');
    const result = await playPrologue({ skippable: prologueSeen() });
    if (result !== 'error') markPrologueSeen();
  } catch (err) {
    console.error('[partida nueva] No se pudo reproducir el prólogo', err);
  }
}

async function askIdentity() {
  try {
    const { chooseIdentity } = await import('./cutscenes/identity.js');
    const r = await chooseIdentity();
    if (r && r.name && (r.gender === 'M' || r.gender === 'F')) return r;
    console.warn('[partida nueva] "¿Quién eres?" sin resultado válido', r);
  } catch (err) {
    console.error('[partida nueva] Error en "¿Quién eres?"', err);
    engine.reportError(err);
  }
  // Valores seguros para no bloquear la partida (solo si la pantalla falló).
  return { gender: 'M', name: 'Axis' };
}

async function caption() {
  try {
    const { showCaption } = await import('./cutscenes/identity.js');
    await showCaption(TIME_CAPTION);
  } catch (err) {
    console.error('[partida nueva] Error en el rótulo', err);
  }
}

/** Abre la habitación del protagonista con un fundido desde negro. */
async function startWorld() {
  const start = await resolveStartMap(loadMapDefinition);
  const { default: MapScene } = await import('../world/mapScene.js');
  const scene = new MapScene();
  const enter = scene.enter.bind(scene);
  scene.enter = async (params) => {
    await enter(params);
    scene.fx.fadeAmount = 1;
    scene.fx.fadeIn(40);
  };
  const params = { map: start.map };
  if (Number.isInteger(start.x) && Number.isInteger(start.y)) Object.assign(params, { x: start.x, y: start.y, dir: start.dir });
  engine.scenes.replace(scene, params).catch((err) => engine.reportError(err));
}
