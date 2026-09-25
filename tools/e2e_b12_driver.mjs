// Conductor del recorrido E2E del Bloque 12 (teclas reales en Chrome headless + playwright-core). Mismo esquema que
// tools/e2e_b08_driver.mjs, con lo propio del espacio imposible: rutas que no pisan el vacío (window.__b12.safeRoute),
// pasos que sueltan la tecla en cuanto empiezan (sin dobles pasos junto al vacío), girar sin andar (toque corto: el
// jugador gira si la tecla dura menos de 75 ms), empujar un poste (Ancla) y vigilar estados en `settle` con funciones.
import path from 'node:path';
import { installHelpers } from './e2e_b01_page.mjs';
import { installB12Helpers } from './e2e_b12_page.mjs';

export const KEY = { 2: 'ArrowDown', 4: 'ArrowLeft', 6: 'ArrowRight', 8: 'ArrowUp' };
export const DIR = { down: 2, left: 4, right: 6, up: 8 };
const OFF = { 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] };
/** Escenas que se despachan con A. Cualquier otra que no sea mapa, elección o combate también se toca con A. */
const QUIET = new Set(['MapScene', 'ChoiceScene', 'BattleScene']);

/** Dirección de (ax, ay) a una casilla vecina (bx, by). */
export const dirTo = (ax, ay, bx, by) => Number(Object.entries(OFF).find(([, [dx, dy]]) => ax + dx === bx && ay + dy === by)?.[0] || 0);

export class Driver {
  constructor(page, errors, { outDir, root, prefix = 'e2e_b12' }) {
    Object.assign(this, { page, errors, outDir, root, prefix });
    this.shots = 0;
    this.milestones = [];
    /** Índice que se elige en la próxima ChoiceScene (se consume); si no, `choose` de settle o la 1.ª opción. */
    this.nextChoice = null;
  }

  eval(fn, arg) { return this.page.evaluate(fn, arg); }
  wait(ms) { return this.page.waitForTimeout(ms); }
  snapState() {
    return this.eval(() => ({
      ...window.__e2e.snap(), anchor: window.__b12.anchor(), rot: window.__b12.rotation(), sil: window.__b12.silhouettes(),
      silK: window.__b12.silhouetteProgress?.() ?? -1,
      still: window.__b12.coreStill(), lastDir: window.__map?.world?.player?.lastDir ?? 0,
    }));
  }

  async goto(url) {
    await this.page.goto(url, { waitUntil: 'load' });
    await installHelpers(this.page);
    await installB12Helpers(this.page);
    await this.until((s) => s.top === 'MapScene' && s.ready, { timeout: 30000, what: 'el mapa de arranque' });
    await this.settle();
  }

  async press(key, after = 180, hold = 70) {
    await this.page.keyboard.down(key);
    await this.wait(hold);
    await this.page.keyboard.up(key);
    await this.wait(after);
  }

  async until(fn, { timeout = 20000, what = 'condición', poll = 120 } = {}) {
    const end = Date.now() + timeout;
    for (;;) {
      const s = await this.snapState();
      if (fn(s)) return s;
      if (Date.now() > end) throw new Error(`Tiempo agotado esperando: ${what}\nestado: ${JSON.stringify({ ...s, flags: undefined })}\n${this.errors.slice(-6).join('\n')}`);
      await this.wait(poll);
    }
  }

  async shot(name) {
    this.shots += 1;
    const file = path.join(this.outDir, `${this.prefix}_${String(this.shots).padStart(2, '0')}_${name}.png`);
    await this.page.locator('#stage').screenshot({ path: file });
    console.log(`  captura → ${path.relative(this.root, file)}`);
    return file;
  }

  async milestone(name, check) {
    const s = await this.snapState();
    const problem = check ? await check(s) : null;
    if (problem) {
      const flags = Object.keys(s.flags).filter((k) => /^(b12|p6|zyg)/.test(k));
      throw new Error(`Hito «${name}»: ${problem}\nestado: ${JSON.stringify({ ...s, flags })}`);
    }
    await this.shot(name);
    this.milestones.push(name);
    console.log(`  ✔ ${name}`);
    return s;
  }

  log() { return this.eval(() => window.__e2e.log.slice()); }

  async expectSaid(re, what) {
    const log = await this.log();
    if (!log.some((l) => re.test(l.text))) throw new Error(`No se dijo ${what} (${re})\nÚltimos: ${log.slice(-8).map((l) => `${l.speaker}: ${l.text}`).join(' | ')}`);
  }

  async expectNotSaid(re, what) {
    const log = await this.log();
    if (log.some((l) => re.test(l.text))) throw new Error(`Se dijo ${what} y no tocaba (${re})`);
  }

  /** Atiende mensajes, elecciones, placas y combates hasta que el mapa queda libre. watch: [{ re | scene | fn, name, delay }] */
  async settle({ timeout = 240000, choose = () => 0, watch = [] } = {}) {
    const end = Date.now() + timeout;
    let calm = 0;
    while (Date.now() < end) {
      let s = await this.snapState();
      for (const w of watch) {
        if (w.done) continue;
        const hit = (w.re && w.re.test(s.lastText || '')) || (w.scene && s.top === w.scene) || (w.fn && w.fn(s));
        if (!hit) continue;
        w.done = true;
        if (w.delay) await this.wait(w.delay);
        await this.shot(w.name);
        s = await this.snapState();
      }
      if (s.top === 'ChoiceScene') {
        calm = 0;
        const want = this.nextChoice ?? choose(s);
        this.nextChoice = null;
        for (let i = s.choiceIndex; i < want; i++) await this.press('ArrowDown', 120);
        for (let i = s.choiceIndex; i > want; i--) await this.press('ArrowUp', 120);
        await this.press('KeyZ', 250);
        continue;
      }
      if (s.top && !QUIET.has(s.top)) { calm = 0; await this.press('KeyZ', 160); continue; }
      if (s.top === 'MapScene' && s.ready && !s.busy && !s.playerBusy) {
        calm += 1;
        if (calm >= 4) return s;
      } else calm = 0;
      await this.wait(150);
    }
    throw new Error(`settle: el mapa no queda libre\n${JSON.stringify({ ...(await this.snapState()), flags: undefined })}`);
  }

  /** Un paso en `dir`: la tecla se suelta en cuanto el paso empieza o algo lo interrumpe (nunca da dos). */
  async step(dir, { settle = true, watch = [] } = {}) {
    const before = await this.snapState();
    const key = KEY[dir];
    await this.page.keyboard.down(key);
    try {
      await this.eval((a) => window.__b12.waitChange(a), { x: before.x, y: before.y, map: before.map, timeout: 1500 });
    } finally {
      await this.page.keyboard.up(key);
    }
    await this.until((s) => !s.playerBusy || s.busy || s.top !== 'MapScene', { timeout: 6000, what: 'fin del paso' });
    if (!settle) return this.snapState();
    const s = await this.snapState();
    if (s.busy || s.top !== 'MapScene') return this.settle({ watch });
    return s;
  }

  /** Gira sin andar (toque corto). Si la tecla coincide con la última pulsada, antes gira a otra en el mismo sitio. */
  async face(dir) {
    const d = typeof dir === 'string' ? DIR[dir] : dir;
    let s = await this.snapState();
    for (let i = 0; i < 4 && s.dir !== d; i++) {
      if (s.lastDir === d) {
        const other = [2, 4, 6, 8].find((x) => x !== d && x !== s.dir) || [2, 4, 6, 8].find((x) => x !== d);
        await this.press(KEY[other], 120, 25);
      }
      await this.press(KEY[d], 150, 25);
      s = await this.snapState();
      if (s.busy || s.top !== 'MapScene') s = await this.settle();
    }
    if (s.dir !== d) throw new Error(`No se pudo girar a ${d} en (${s.x},${s.y})`);
    return s;
  }

  /** Camina hasta (x, y) (o a su lado con onto: false) sin pisar el vacío, atendiendo lo que salte. */
  async walkTo(x, y, { onto = true, face = null, maxSteps = 600, stopWhen = null, watch = [] } = {}) {
    for (let n = 0; n < maxSteps; n++) {
      let s = await this.snapState();
      if (s.busy || s.top !== 'MapScene') s = await this.settle({ watch });
      if (stopWhen && stopWhen(s)) return s;
      const done = onto ? s.x === x && s.y === y : Math.abs(s.x - x) + Math.abs(s.y - y) === 1;
      if (done) {
        if (face) await this.face(face);
        return s;
      }
      const route = await this.eval(([tx, ty, o]) => window.__b12.safeRoute(tx, ty, { onto: o }), [x, y, onto]);
      if (!route || !route.length) throw new Error(`Sin ruta a (${x},${y}) en ${s.map} desde (${s.x},${s.y})`);
      await this.step(route[0], { settle: false });
    }
    throw new Error(`walkTo(${x},${y}): demasiados pasos`);
  }

  /** Se pone al lado de (x, y) y lo encara (para pulsar A o empujar un poste). */
  async approach(x, y, { watch = [] } = {}) {
    const s = await this.walkTo(x, y, { onto: false, watch });
    return this.face(dirTo(s.x, s.y, x, y));
  }

  /** Empuja un evento sólido de contacto (Ancla, poste del núcleo) desde su lado y atiende lo que pase. */
  async bump(x, y, opts = {}) {
    const s = await this.approach(x, y);
    const d = dirTo(s.x, s.y, x, y);
    for (let i = 0; i < 3; i++) {
      await this.page.keyboard.down(KEY[d]);
      let fired = false;
      try {
        fired = await this.eval(() => window.__b12.waitBusy(1200));
      } finally {
        await this.page.keyboard.up(KEY[d]);
      }
      if (fired) break;
      await this.wait(200);
    }
    return this.settle(opts);
  }

  /** Pulsa A delante de algo (reintenta si la pulsación se pierde) y atiende lo que pase. */
  async interact(opts = {}) {
    const before = (await this.log()).length;
    for (let i = 0; i < 3; i++) {
      await this.press('KeyZ', 300);
      const s = await this.snapState();
      if (s.busy || s.top !== 'MapScene' || (await this.log()).length > before) break;
      await this.wait(200);
    }
    return this.settle(opts);
  }

  /** Espera a estar en `id` con el mapa listo y libre. */
  async arrive(id, what = `llegar a ${id}`) {
    await this.until((s) => s.map === id && s.ready, { timeout: 20000, what });
    return this.settle();
  }
}
