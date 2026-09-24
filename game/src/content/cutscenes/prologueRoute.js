// Ruta de desarrollo del prólogo (main.js → ?scene=prologue):
//   ?scene=prologue                     solo el prólogo; al acabar vuelve al título
//   &shot=p01|p02|p03|montaje|p04|final empieza en ese plano
//   &skip=1                             START salta (como en partidas posteriores)
//   &full=1                             flujo completo de partida nueva (prólogo → ¿Quién eres? → casa)
//   &noprologue=1 (con full=1)          flujo de partida nueva sin prólogo
import { engine } from '../../core/engine.js';
import { Scene } from '../../core/scenes.js';

export default class PrologueRouteScene extends Scene {
  async enter(params = {}) {
    // Se lanza fuera de enter(): el flujo sustituye la pila de escenas.
    setTimeout(() => this.run(params).catch((err) => engine.reportError(err)), 0);
  }

  async run(params) {
    if (params.full === '1') {
      const { newGameFlow } = await import('../newgame.js');
      await newGameFlow({ skipPrologue: params.noprologue === '1' });
      return;
    }
    const { playPrologue } = await import('./prologue.js');
    const result = await playPrologue({ skippable: params.skip === '1', from: params.shot || 'p01' });
    console.info(`[prólogo] terminado: ${result}`);
    const { default: TitleScene } = await import('../../ui/screens/title.js');
    await engine.scenes.replace(new TitleScene());
  }
}
