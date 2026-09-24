// Conductor del recorrido E2E del Bloque 2 (teclas reales en Chrome headless + playwright-core). Basado en el de
// tools/e2e_b01.mjs y ampliado con puertas-evento (empujar contra la puerta), mantener una tecla y elecciones por
// texto. Usa los ayudantes de página de tools/e2e_b02_page.mjs (window.__e2e).
import path from 'node:path';

const KEY = { 2: 'ArrowDown', 4: 'ArrowLeft', 6: 'ArrowRight', 8: 'ArrowUp' };
const DIR = { down: 2, left: 4, right: 6, up: 8 };

export class Driver {
  constructor(page, errors, { outDir, prefix = 'e2e_b02', root = process.cwd() } = {}) {
    this.page = page;
    this.errors = errors;
    this.outDir = outDir;
    this.prefix = prefix;
    this.root = root;
    this.shots = 0;
    this.milestones = [];
    /** Reglas de elección: [{ re, index }] (la primera que case con el último texto). Por defecto, la 1.ª opción. */
    this.choiceRules = [{ re: /mote/i, index: 1 }];
  }

  eval(fn, arg) { return this.page.evaluate(fn, arg); }
  wait(ms) { return this.page.waitForTimeout(ms); }
  snap() { return this.eval(() => ({ ...window.__e2e.snap(), b02: window.__e2e.b02() })); }

  async press(key, after = 180) {
    await this.page.keyboard.down(key);
    await this.wait(70);
    await this.page.keyboard.up(key);
    await this.wait(after);
  }

  async hold(key, ms) {
    await this.page.keyboard.down(key);
    await this.wait(ms);
    await this.page.keyboard.up(key);
  }

  async until(fn, { timeout = 20000, what = 'condición', poll = 120 } = {}) {
    const end = Date.now() + timeout;
    for (;;) {
      const s = await this.snap();
      if (fn(s)) return s;
      if (Date.now() > end) throw new Error(`Tiempo agotado esperando: ${what}\nestado: ${JSON.stringify(s)}\n${this.errors.slice(-6).join('\n')}`);
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
    const s = await this.snap();
    const problem = check ? check(s) : null;
    if (problem) throw new Error(`Hito «${name}»: ${problem}\nestado: ${JSON.stringify(s)}`);
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

  chooseFor(s) {
    for (const r of this.choiceRules) if (r.re.test(s.lastText || '')) return r.index;
    return 0;
  }

  /** Atiende mensajes, elecciones, combates y fundidos hasta volver al mapa libre. `watch` = capturas por texto. */
  async settle({ timeout = 240000, watch = [], onText = null } = {}) {
    const end = Date.now() + timeout;
    let calm = 0;
    while (Date.now() < end) {
      let s = await this.snap();
      for (const w of watch) {
        if (w.done) continue;
        const hit = (w.re && w.re.test(s.lastText || '')) || (w.scene && s.top === w.scene);
        if (!hit) continue;
        w.done = true;
        if (w.delay) await this.wait(w.delay);
        await this.shot(w.name);
        s = await this.snap();
      }
      if (onText && s.top === 'MessageScene' && (await onText(s))) { calm = 0; continue; }
      if (s.top === 'MessageScene') { calm = 0; await this.press('KeyZ', 160); continue; }
      // Placas y pantallas que se cierran con A (verso Unown, rótulo de viaje…).
      if (s.top === 'VerseScene' || s.top === 'TravelScene') { calm = 0; await this.wait(600); await this.press('KeyZ', 300); continue; }
      if (s.top === 'ChoiceScene') {
        calm = 0;
        const want = this.chooseFor(s);
        for (let i = s.choiceIndex; i < want; i++) await this.press('ArrowDown', 120);
        for (let i = s.choiceIndex; i > want; i--) await this.press('ArrowUp', 120);
        await this.press('KeyZ', 250);
        continue;
      }
      if (s.top === 'MapScene' && s.ready && !s.busy && !s.playerBusy) {
        calm += 1;
        if (calm >= 4) return s;
      } else calm = 0;
      await this.wait(150);
    }
    throw new Error(`settle: el mapa no queda libre\n${JSON.stringify(await this.snap())}`);
  }

  async step(dir) {
    const before = await this.snap();
    await this.page.keyboard.down(KEY[dir]);
    try {
      const end = Date.now() + 1500;
      while (Date.now() < end) {
        const s = await this.snap();
        if (s.map !== before.map || s.x !== before.x || s.y !== before.y || s.busy || s.top !== 'MapScene') break;
        await this.wait(25);
      }
    } finally {
      await this.page.keyboard.up(KEY[dir]);
    }
    await this.until((s) => !s.playerBusy || s.busy || s.top !== 'MapScene', { timeout: 4000, what: 'fin del paso' });
  }

  /** Camina hasta (x, y) por la ruta más corta; atiende lo que salte por el camino. */
  async walkTo(x, y, { onto = true, face = null, maxSteps = 500, stopWhen = null, watch = [] } = {}) {
    for (let n = 0; n < maxSteps; n++) {
      let s = await this.snap();
      if (s.busy || s.top !== 'MapScene') {
        s = await this.settle({ watch });
        const hp = await this.eval(() => window.__e2e.usePotionIfLow());
        if (hp !== null) console.log(`  (Poción de la Mochila: PS → ${hp})`);
      }
      if (stopWhen && stopWhen(s)) return s;
      const done = onto ? s.x === x && s.y === y : Math.abs(s.x - x) + Math.abs(s.y - y) === 1;
      if (done) {
        if (face) await this.turn(face);
        return s;
      }
      const route = await this.eval(([tx, ty, o]) => window.__e2e.route(tx, ty, { onto: o }), [x, y, onto]);
      if (!route || !route.length) throw new Error(`Sin ruta a (${x},${y}) en ${s.map} desde (${s.x},${s.y})`);
      await this.step(route[0]);
    }
    throw new Error(`walkTo(${x},${y}): demasiados pasos`);
  }

  async turn(dir) {
    const d = typeof dir === 'string' ? DIR[dir] : dir;
    const s = await this.snap();
    if (s.dir === d) return;
    await this.press(KEY[d], 150);
    await this.until((st) => st.dir === d || st.busy, { timeout: 2000, what: 'girar' });
  }

  /** Delante de (x, y) mirando hacia ella y pulsa A. */
  async interact(x, y, from = 'down') {
    const [fx, fy] = { down: [x, y + 1], up: [x, y - 1], left: [x - 1, y], right: [x + 1, y] }[from];
    const face = { down: 'up', up: 'down', left: 'right', right: 'left' }[from];
    await this.walkTo(fx, fy, { face });
    // Tras girar el jugador puede seguir ocupado unos fotogramas: si la A no arranca nada, se repite.
    for (let i = 0; i < 3; i++) {
      await this.until((s) => !s.playerBusy || s.busy, { timeout: 3000, what: 'jugador quieto' });
      await this.press('KeyZ', 250);
      const s = await this.snap();
      if (s.busy || s.top !== 'MapScene') return s;
      await this.wait(300);
      const again = await this.snap();
      if (again.busy || again.top !== 'MapScene') return again;
    }
    throw new Error(`interact(${x},${y}): la A no arrancó ningún evento`);
  }

  /** Puerta sobre tile no pasable (Exterior1): se coloca debajo y empuja hacia arriba. */
  async enterDoor(x, y, toMap) {
    await this.walkTo(x, y + 1);
    for (let i = 0; i < 5; i++) {
      await this.hold('ArrowUp', 350);
      const s = await this.snap();
      if (s.map === toMap) break;
    }
    return this.until((st) => st.map === toMap && st.ready, { timeout: 15000, what: `entrar en ${toMap}` });
  }

  /** Sale por un warp hacia `toMap` (felpudo con dirección o casilla pisable). */
  async exitTo(toMap) {
    const warp = await this.eval((to) => window.__e2e.warpTo(to), toMap);
    if (!warp) throw new Error(`No hay salida hacia ${toMap}`);
    await this.walkTo(warp.x, warp.y, { stopWhen: (s) => s.map === toMap });
    let s = await this.snap();
    if (s.map !== toMap && warp.dirTrigger) await this.hold(KEY[warp.dirTrigger], 300);
    s = await this.until((st) => st.map === toMap && st.ready, { timeout: 15000, what: `llegar a ${toMap}` });
    return s;
  }

  /** Cruza el borde por una conexión (sin fundido). */
  async crossEdge(dir, toMap) {
    const d = DIR[dir];
    for (let i = 0; i < 6; i++) {
      await this.step(d);
      const s = await this.snap();
      if (s.map === toMap) return s;
      if (s.busy || s.top !== 'MapScene') await this.settle();
    }
    throw new Error(`No se cruzó a ${toMap}`);
  }
}
