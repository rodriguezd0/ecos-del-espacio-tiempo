// Prólogo cinemático de Ecos (guion B01 §1, biblia §4): P-01 Mundo Distorsión → P-02 montaña y portal →
// P-03 Zygarde responde → montaje de dos días y tercera noche → P-04 victoria y dispersión. Sin narrador.
// Se acelera manteniendo A (×3); con `skippable` START lo salta. Termina con la pantalla en negro.
//
//   const r = await playPrologue({ skippable });   // 'done' | 'skipped' | 'error'
//   Desarrollo: ?scene=prologue[&shot=p01|p02|p03|montaje|p04|final][&skip=1][&full=1]  (ver prologueRoute.js)
import { engine } from '../../core/engine.js';
import { Scene } from '../../core/scenes.js';
import { GameState } from '../../core/state.js';
import { globalOptionsForNewGame } from '../../ui/core/options.js';
import { Director, isCancel } from './director.js';
import { CineOverlay, stageScene, untilFrame } from './cineOverlay.js';
import PrologueStage from './prologueStage.js';
import { shotDistortion } from './prologueP01.js';
import { enterMountain, shotMountain } from './prologueMountain.js';
import { shotZygarde, shotMontage, shotVictory, stageActors } from './prologueBattle.js';
import { shotScatter, shotVillage } from './prologueFinale.js';
import { stopBgm } from './prologueAudio.js';
import { SHOTS } from './prologueData.js';

export { SHOTS };

/** Escena vacía (pantalla negra) para los cortes. */
export class BlackScene extends Scene {}

/** Partida provisional solo para rodar sobre MapScene (sin equipo ni seguidor); se descarta al acabar. */
function cinemaState() {
  const st = GameState.create({ name: '', gender: 'M' });
  st.data.options = { ...st.data.options, ...globalOptionsForNewGame(), followerEnabled: false };
  return st;
}

async function runShots(d, overlay, from) {
  const start = Math.max(0, SHOTS.indexOf(from));
  const at = (name) => start <= SHOTS.indexOf(name);
  if (at('p01')) {
    const stage = new PrologueStage();
    await stageScene(overlay, stage);
    await shotDistortion(d, stage);
  }
  if (at('p04')) {
    const { set } = await enterMountain(d, overlay, { x: 36, y: 40 });
    try {
      let actors;
      if (at('p02')) actors = await shotMountain(d, set);
      else actors = await stageActors(set, from);
      if (at('p03')) Object.assign(actors, await shotZygarde(d, set, actors.giratina));
      if (from !== 'p04') {
        await set.fadeIn(1);
        Object.assign(actors, await shotMontage(d, set, actors));
      } else {
        await set.fadeIn(30);
      }
      await shotVictory(d, set, actors);
    } finally {
      set.dispose();
    }
  }
  const stage = new PrologueStage();
  await stageScene(overlay, stage);
  await shotScatter(d, stage);
  await shotVillage(d, stage);
}

/**
 * Reproduce el prólogo. Nunca lanza: devuelve 'done', 'skipped' (START) o 'error' (registrado en consola).
 * @param {{ skippable?: boolean, from?: string }} opts
 */
export async function playPrologue({ skippable = false, from = 'p01' } = {}) {
  const d = new Director({ skippable });
  const overlay = new CineOverlay(d);
  const prevState = engine.state;
  engine.state = cinemaState();
  let result = 'done';
  try {
    await runShots(d, overlay, from);
  } catch (err) {
    if (isCancel(err)) {
      result = 'skipped';
    } else {
      result = 'error';
      console.error('[prólogo] Error en la cinemática; se continúa con la partida nueva.', err);
    }
  } finally {
    d.cancel();
    stopBgm(result === 'done' ? 0 : 20);
    engine.state = prevState;
    const black = new BlackScene();
    engine.scenes.replace(black).catch(() => {});
    await untilFrame(() => engine.scenes.top === black, 5000).catch(() => {});
  }
  return result;
}
