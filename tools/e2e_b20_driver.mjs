// Conductor del recorrido E2E del Bloque 20 (teclas reales en Chrome headless + playwright-core). Es el de B16
// (tools/e2e_b16_driver.mjs: mensajes, elecciones, nado, controles en espejo, recorridos con la tecla mantenida) con las
// rutas del Bloque 20 (window.__b20.route: no pisan el vacío del espacio imposible ni las trampas, ráfagas y pliegues) y
// los ayudantes de tools/e2e_b20_page.mjs (derrotas simuladas del Trío y de Gael).
import path from 'node:path';
import { Driver as B16Driver } from './e2e_b16_driver.mjs';
import { installHelpers } from './e2e_b01_page.mjs';
import { installB16Helpers } from './e2e_b16_page.mjs';
import { installB20Helpers } from './e2e_b20_page.mjs';

export class Driver extends B16Driver {
  constructor(page, errors, opts) {
    super(page, errors, { ...opts, prefix: 'e2e_b20' });
  }

  async goto(url) {
    await this.page.goto(url, { waitUntil: 'load' });
    await installHelpers(this.page);
    await installB16Helpers(this.page, { loseOnce: [] });
    await installB20Helpers(this.page, { loseOnce: this.loseOnce });
    await this.until((s) => s.top === 'MapScene' && s.ready, { timeout: 30000, what: 'el mapa de arranque' });
    await this.settle();
  }

  async milestone(name, check) {
    const s = await this.snapState();
    const problem = check ? await check(s) : null;
    if (problem) throw new Error(`Hito «${name}»: ${problem}\nestado: ${JSON.stringify({ ...s, flags: Object.keys(s.flags).filter((k) => /^(b20|p10|verse_10)/.test(k)) })}`);
    await this.shot(name);
    this.milestones.push(name);
    console.log(`  ✔ ${name}`);
    return s;
  }

  /** Camina hasta (x, y) (o a su lado con onto: false) con las rutas del bloque; `face` gira al final. */
  async walkTo(x, y, { onto = true, face = null, maxSteps = 700, stopWhen = null, watch = [], choose, avoid } = {}) {
    for (let n = 0; n < maxSteps; n++) {
      let s = await this.snapState();
      if (s.busy || s.top !== 'MapScene') s = await this.settle({ watch, choose });
      if (stopWhen && stopWhen(s)) return s;
      const done = onto ? s.x === x && s.y === y : Math.abs(s.x - x) + Math.abs(s.y - y) === 1;
      if (done) {
        if (face) await this.turn(face);
        return s;
      }
      const opts = avoid ? { onto, avoid } : { onto };
      const route = await this.eval(([tx, ty, o]) => window.__b20.route(tx, ty, o), [x, y, opts]);
      if (!route || !route.length) throw new Error(`Sin ruta a (${x},${y}) en ${s.map} desde (${s.x},${s.y})`);
      await this.step(route[0]);
    }
    throw new Error(`walkTo(${x},${y}): demasiados pasos`);
  }

  /** Pulsa A `n` veces delante de algo, atendiendo lo que salte entre medias. */
  async interactTimes(n, opts = {}) {
    for (let i = 0; i < n; i++) await this.interact(opts);
  }

  /** Mira hacia (x, y) desde una casilla vecina ya alcanzada. */
  async faceTo(x, y) {
    const s = await this.snapState();
    await this.turn(x > s.x ? 6 : x < s.x ? 4 : y > s.y ? 2 : 8);
  }

  shotPath(name) { return path.join(this.outDir, `${this.prefix}_${name}.png`); }
}
