// Ejecución de un combate con la escena real: construye la configuración (setup.js), apila la BattleScene,
// ejecuta el motor (battle/core) con SceneBattleUI y, al terminar, aplica el resultado a la partida:
// equipo, dinero, mochila, Pokédex, capturas (mote, equipo o caja) y evoluciones pendientes.
import { engine } from '../../core/engine.js';
import { Battle } from '../core/index.js';
import { ui } from '../../ui/api.js';
import { getTrainer } from '../../content/trainers/index.js';
import { buildBattleConfig } from './setup.js';
import { applyBattleResult, storeCaught, storedMessage } from './results.js';
import { BattleScene } from './battleScene.js';
import { SceneBattleUI } from './sceneUI.js';

const MAX_NICKNAME = 12;

/** Nombre de especie. */
function speciesName(db, p) {
  return db.species[p.species]?.name || p.species;
}

/** Registro en la Pokédex, mote y almacenamiento de cada Pokémon capturado (con mensajes en el combate). */
async function storeCaptures(sceneUI, state, db, caughtList) {
  for (const original of caughtList) {
    let p = original;
    const name = speciesName(db, p);
    const isNew = !state.data.dex.caught[p.species];
    // Registro en la Pokédex (solo el mensaje: la ficha se consulta desde el menú; la Pokédex de ui/ abre
    // la lista completa y no admite especies fuera del inventario de Axis).
    if (isNew && state.hasPokedex?.()) {
      await sceneUI.message(`Se han registrado en la Pokédex los datos de ${name}.`, { paused: true });
    }
    if (await sceneUI.confirm(`¿Quieres ponerle un mote a ${name}?`)) {
      try {
        const nick = String(await ui.textEntry({ title: `¿Mote para ${name}?`, initial: '', maxLength: MAX_NICKNAME, iconSpecies: p.species, gender: p.gender }) || '').trim();
        if (nick && nick !== name) p = { ...p, nickname: nick };
      } catch (err) {
        console.warn('[combate] Pantalla de mote', err);
      }
    }
    const stored = storeCaught(state, p);
    const shown = p.nickname || name;
    if (stored.where !== 'party') await sceneUI.message(storedMessage(shown, stored), { paused: true });
  }
}

/** Evoluciones tras el combate (con la escena ya en negro). */
async function runEvolutions(result) {
  const list = result.pendingEvolutions || [];
  if (!list.length || !engine.state) return;
  const { evolvePartyMember } = await import('../../ui/screens/progression.js');
  for (const ev of list) {
    try {
      await evolvePartyMember(ev.partyIndex, ev.species);
    } catch (err) {
      console.error('[combate] Evolución fallida', err);
      engine.reportError?.(err);
    }
  }
}

/**
 * Ejecuta un combate completo con presentación. `request` = lo que envía world/battleFlow.js
 * (o un banco de pruebas). Devuelve el resultado del motor + { party, caught, stored, canLose }.
 */
export async function runSceneBattle(request = {}, { state = engine.state, db = engine.data } = {}) {
  const { config, meta } = buildBattleConfig(request, { db, state, getTrainer });
  const scene = new BattleScene(meta);
  const sceneUI = new SceneBattleUI(scene);
  const battle = new Battle(config, sceneUI); // valida la configuración antes de mostrar nada
  sceneUI.attach(battle);
  // push() resuelve al desapilar: se espera aparte a que la escena termine de cargar.
  let entered;
  let enterError = null;
  const ready = new Promise((resolve) => { entered = resolve; });
  const origEnter = scene.enter.bind(scene);
  scene.enter = async (p) => {
    try {
      await origEnter(p);
    } catch (err) {
      enterError = err;
      throw err;
    } finally {
      entered();
    }
  };
  const closed = engine.scenes.push(scene);
  closed.catch(() => {});
  await ready;
  if (enterError) throw new Error(`No se pudo preparar la escena de combate: ${enterError.message}`);
  if (meta.bgm && !request.keepBgm) scene.bgm(meta.bgm);
  let result = null;
  let error = null;
  try {
    result = await battle.run();
    if (state) {
      applyBattleResult(state, result);
      if (result.caughtAll?.length) await storeCaptures(sceneUI, state, db, result.caughtAll);
    }
  } catch (err) {
    error = err;
  }
  try {
    scene.message.clear();
    await scene.fadeTo(1, 20);
    if (!error && result) await runEvolutions(result);
  } finally {
    engine.scenes.pop(undefined, scene);
    await closed;
  }
  if (error) throw error;
  return {
    ...result,
    party: state ? state.party.slice() : (result.playerParty || []).filter(Boolean),
    stored: Boolean(state),
    canLose: meta.canLose,
    trainer: meta.trainer,
  };
}
