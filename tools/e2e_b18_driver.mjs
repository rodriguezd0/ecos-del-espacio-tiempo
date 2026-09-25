// Conductor del recorrido E2E del Bloque 18: el de B16 (tools/e2e_b16_driver.mjs: teclas reales, settle, walkTo,
// faceEvent, pushUntil…) con el piloto de combate de B18 (tools/e2e_b18_page.mjs) y los pasos de la Cámara del Cruce:
// ejecutar el plan del solucionador (world/axis/logic.js) sala a sala, comprobando tras cada paso que el jugador está
// donde dicen las reglas (corrientes, pliegues, escombros).
import { Driver } from './e2e_b16_driver.mjs';
import { installHelpers } from './e2e_b01_page.mjs';
import { installB16Helpers } from './e2e_b16_page.mjs';
import { installB18Helpers } from './e2e_b18_page.mjs';
import { stepResult, afterTension } from '../game/src/world/axis/logic.js';
import { AXIS_EVENT_TEXT } from '../game/src/world/axis/eventTypes.js';

const OPTION = { time: AXIS_EVENT_TEXT.options[0], space: AXIS_EVENT_TEXT.options[1] };

export class Driver18 extends Driver {
  constructor(page, errors, { loseOnce = [], ...opts }) {
    super(page, errors, { ...opts, prefix: 'e2e_b18' });
    this.loseTags = loseOnce;
  }

  async goto(url) {
    await this.page.goto(url, { waitUntil: 'load' });
    await installHelpers(this.page);
    await installB16Helpers(this.page, {});
    await installB18Helpers(this.page, { loseOnce: this.loseTags });
    await this.until((s) => s.top === 'MapScene' && s.ready, { timeout: 30000, what: 'el mapa de arranque' });
    await this.settle();
  }

  b18(fn, arg) { return this.eval(fn, arg); }
  axis() { return this.eval(() => window.__b18.axis()); }
  battles() { return this.eval(() => window.__b18.battles.slice()); }

  /**
   * Ejecuta el plan de una sala (acciones del solucionador) desde el estado { x, y, mode } de la sala colocada en
   * (ox, oy). Tras cada acción comprueba la casilla y el eje con las reglas. → estado final
   */
  async playRoom(place, plan, from) {
    let s = { ...from };
    for (const [i, a] of plan.actions.entries()) {
      let want;
      if (a.type === 'move') {
        const r = stepResult(place.grid, s.x, s.y, a.dir, s.mode);
        if (!r) throw new Error(`${place.name}: paso ${i} imposible según las reglas`);
        want = r.fell ? { ...place.grid.entry, mode: s.mode } : { x: r.x, y: r.y, mode: s.mode };
        await this.step(a.dir);
      } else {
        const r = afterTension(place.grid, s.x, s.y, a.mode);
        want = r.fell ? { ...place.grid.entry, mode: a.mode } : { x: r.x, y: r.y, mode: a.mode };
        await this.turn(a.face);
        this.want.push(OPTION[a.mode]);
        await this.interact();
        this.want = [];
      }
      const now = await this.settle();
      const axis = await this.axis();
      const gx = now.x - place.ox;
      const gy = now.y - place.oy;
      if (now.map !== 'camara_cruce' || gx !== want.x || gy !== want.y || (axis ?? null) !== (want.mode ?? null)) {
        throw new Error(`${place.name}: tras la acción ${i} (${JSON.stringify(a)}) el jugador está en (${gx},${gy}) con ${axis}; las reglas dicen (${want.x},${want.y}) con ${want.mode}`);
      }
      s = want;
    }
    return s;
  }
}
