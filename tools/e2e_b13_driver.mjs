// Conductor del recorrido E2E del Bloque 13 (teclas reales sobre Chrome headless): estado resumido, esperas, capturas,
// hitos, transcripción, atender mensajes/elecciones/combates, caminar, hablar, puertas, bordes de mapa y NADAR (orilla
// → «¿Quieres nadar?» → ruta solo por agua → desembarcar). Basado en el de tools/e2e_b09b.mjs (solo lectura).
import path from 'node:path';
import { installHelpers } from './e2e_b01_page.mjs';
import { installB13Helpers } from './e2e_b13_page.mjs';

export const KEY = { 2: 'ArrowDown', 4: 'ArrowLeft', 6: 'ArrowRight', 8: 'ArrowUp' };
export const DIR = { down: 2, left: 4, right: 6, up: 8 };
const ITEM_IDS = ['PIXIEPLATE', 'FLAMEPLATE', 'CLEFABLITE', 'HOUNDOOMINITE', 'MOONSTONE', 'UPGRADE'];

/** Elige la primera opción cuya etiqueta empiece por alguna de `labels` (en orden de preferencia); si no, la 0. */
export const prefer = (...labels) => (s) => {
  for (const l of labels) {
    const i = s.choices.findIndex((c) => c === l || c.startsWith(l));
    if (i >= 0) return i;
  }
  return 0;
};

export class Driver {
  constructor(page, errors, { outDir, root, prefix = 'e2e_b13' }) {
    Object.assign(this, { page, errors, outDir, root, prefix });
    this.shots = 0;
    this.milestones = [];
  }

  eval(fn, arg) { return this.page.evaluate(fn, arg); }
  wait(ms) { return this.page.waitForTimeout(ms); }
  snapState() {
    return this.eval((ids) => ({
      ...window.__e2e.snap(),
      surfing: window.__b13.surfing(),
      vars: window.__b13.vars(),
      clues: window.__b13.clues(),
      tablets: window.__b13.tablets(),
      items: window.__b13.items(ids),
      choices: window.__b13.choiceItems(),
      lost: window.__b13.lost.slice(),
      hour: window.__b13.hour(),
      night: window.__b13.night(),
      abilities: window.__b13.abilities(),
      cellCount: window.__b13.cellCount(),
      party: window.__b13.party(),
    }), ITEM_IDS);
  }

  async goto(url, { loseOnce = [] } = {}) {
    await this.page.goto(url, { waitUntil: 'load' });
    await installHelpers(this.page);
    await installB13Helpers(this.page, { loseOnce });
    await this.until((s) => s.top !== null && (s.top === 'MapScene' || s.busy), { timeout: 30000, what: 'el mapa de arranque' });
  }

  async press(key, after = 180) {
    await this.page.keyboard.down(key);
    await this.wait(70);
    await this.page.keyboard.up(key);
    await this.wait(after);
  }

  async until(fn, { timeout = 20000, what = 'condición', poll = 120 } = {}) {
    const end = Date.now() + timeout;
    for (;;) {
      const s = await this.snapState();
      if (fn(s)) return s;
      if (Date.now() > end) throw new Error(`Tiempo agotado esperando: ${what}\nestado: ${JSON.stringify({ ...s, vars: undefined })}\n${this.errors.slice(-6).join('\n')}`);
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
    const problem = check ? check(s) : null;
    if (problem) throw new Error(`Hito «${name}»: ${problem}\nestado: ${JSON.stringify({ ...s, vars: undefined })}`);
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
    if (log.some((l) => re.test(l.text))) throw new Error(`Se dijo ${what} y no debía (${re})`);
  }

  /** Atiende mensajes, elecciones y combates hasta que el mapa queda libre. `choose(s)` → índice de la opción. */
  async settle({ timeout = 300000, choose = () => 0, watch = [] } = {}) {
    const end = Date.now() + timeout;
    let calm = 0;
    while (Date.now() < end) {
      let s = await this.snapState();
      for (const w of watch) {
        if (w.done) continue;
        const hit = (w.re && w.re.test(s.lastText || '')) || (w.scene && s.top === w.scene);
        if (!hit) continue;
        w.done = true;
        if (w.delay) await this.wait(w.delay);
        await this.shot(w.name);
        s = await this.snapState();
      }
      if (['MessageScene', 'VerseScene', 'TravelScene', 'ObtainScene'].includes(s.top)) { calm = 0; await this.press('KeyZ', 160); continue; }
      if (s.top === 'ChoiceScene') {
        calm = 0;
        const want = choose(s);
        for (let i = s.choiceIndex; i < want; i++) await this.press('ArrowDown', 120);
        for (let i = s.choiceIndex; i > want; i--) await this.press('ArrowUp', 120);
        await this.press('KeyZ', 250);
        continue;
      }
      if (s.top === 'MapScene' && s.ready && !s.busy && !s.playerBusy) {
        calm += 1;
        if (calm >= 4) return s;
      } else if (s.top !== 'MapScene' && s.top !== 'BattleScene' && !s.busy) {
        calm = 0;
        await this.press('KeyZ', 200);
      } else calm = 0;
      await this.wait(150);
    }
    throw new Error(`settle: el mapa no queda libre\n${JSON.stringify(await this.snapState())}`);
  }

  /** Posición y estado mínimos (consulta ligera: con la máquina cargada, snapState tarda más que un paso). */
  quickPos() {
    return this.eval(() => {
      const m = window.__map;
      const p = m?.world?.player;
      const top = window.__e2e?.engine?.scenes?.top?.constructor?.name || null;
      return { map: m?.world?.map?.id ?? null, x: p?.x ?? null, y: p?.y ?? null, busy: (m ? Boolean(m.world.scriptBusy()) : false) || top !== 'MapScene' };
    });
  }

  async step(dir) {
    const before = await this.quickPos();
    const key = KEY[dir];
    await this.page.keyboard.down(key);
    try {
      const end = Date.now() + 1500;
      while (Date.now() < end) {
        const s = await this.quickPos();
        // Se suelta en cuanto empieza el paso (la posición lógica cambia al empezar): así no se encadena un segundo
        // paso cuando la consulta tarda (bordes de mapa: un paso de más cruza al vecino).
        if (s.map !== before.map || s.x !== before.x || s.y !== before.y || s.busy) break;
        await this.wait(15);
      }
    } finally {
      await this.page.keyboard.up(key);
    }
    await this.until((s) => !s.playerBusy || s.busy || s.top !== 'MapScene', { timeout: 6000, what: 'fin del paso' });
  }

  /**
   * Un solo paso (o un solo choque) hacia `dir`: pulsación corta (más que el giro de 75 ms, menos que un paso) y
   * espera a que el jugador y los guiones que dispare terminen. Para puzles donde un paso de más estropea la sala.
   */
  async tap(dir, { hold = 120 } = {}) {
    await this.until((s) => !s.playerBusy && !s.busy && s.top === 'MapScene', { timeout: 10000, what: 'jugador libre' });
    const key = KEY[dir];
    await this.page.keyboard.down(key);
    await this.wait(hold);
    await this.page.keyboard.up(key);
    await this.wait(60);
    await this.until((s) => !s.playerBusy || s.busy || s.top !== 'MapScene', { timeout: 6000, what: 'fin del paso' });
    return this.settle();
  }

  async turn(dir) {
    const d = typeof dir === 'string' ? DIR[dir] : dir;
    const s = await this.snapState();
    if (s.dir === d) return;
    await this.press(KEY[d], 150);
    await this.until((st) => st.dir === d || st.busy, { timeout: 2000, what: 'girar' });
  }

  /**
   * Camina hasta (x, y) (o a su lado con `onto: false`), atendiendo las escenas que salten. `router(x, y)` sustituye
   * a la ruta a pie normal (p. ej. evitar las piedras del corro).
   */
  async walkTo(x, y, { onto = true, face = null, maxSteps = 600, stopWhen = null, watch = [], choose, router = null } = {}) {
    for (let n = 0; n < maxSteps; n++) {
      let s = await this.snapState();
      if (s.busy || s.top !== 'MapScene') s = await this.settle({ watch, choose });
      if (stopWhen && stopWhen(s)) return s;
      const done = onto ? s.x === x && s.y === y : Math.abs(s.x - x) + Math.abs(s.y - y) === 1;
      if (done) {
        if (face) await this.turn(face);
        return s;
      }
      const route = router
        ? await router(x, y)
        : await this.eval(([tx, ty, o]) => window.__e2e.route(tx, ty, { onto: o }), [x, y, onto]);
      if (!route || !route.length) throw new Error(`Sin ruta a (${x},${y}) en ${s.map} desde (${s.x},${s.y})${s.surfing ? ' nadando' : ''}`);
      await this.step(route[0]);
    }
    throw new Error(`walkTo(${x},${y}): demasiados pasos`);
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

  /** Se acerca a (x, y) por la casilla vecina más corta, la mira y pulsa A. */
  async talkTo(x, y, opts = {}) {
    const s = await this.walkTo(x, y, { onto: false, choose: opts.choose, watch: opts.watch });
    const dir = s.x < x ? 6 : s.x > x ? 4 : s.y < y ? 2 : 8;
    await this.turn(dir);
    return this.interact(opts);
  }

  /** Va a (x, y), mira hacia `dir` y habla. */
  async talk(x, y, dir, opts = {}) {
    await this.walkTo(x, y, { face: dir, choose: opts.choose, watch: opts.watch });
    return this.interact(opts);
  }

  /** Empuja desde (x, y) hacia `dir` (puerta con warp o evento de contacto) hasta entrar en `toMap`. */
  async push(x, y, dir, toMap, opts = {}) {
    const at = await this.walkTo(x, y, { stopWhen: (s) => s.map === toMap, watch: opts.watch });
    for (let i = 0; i < 4 && at.map !== toMap; i++) {
      await this.step(DIR[dir]);
      const s = await this.snapState();
      if (s.map === toMap) break;
      if (s.busy || s.top !== 'MapScene') await this.settle(opts);
      if ((await this.snapState()).map === toMap) break;
    }
    await this.until((s) => s.map === toMap && s.ready, { timeout: 20000, what: `entrar en ${toMap}` });
    return this.settle(opts);
  }

  /** Sale por una alfombra: se coloca en (x, y) y pulsa hacia `dir` hasta cambiar a `toMap`. */
  async leave(x, y, dir, toMap, opts = {}) {
    const at = await this.walkTo(x, y, { stopWhen: (s) => s.map === toMap, watch: opts.watch, choose: opts.choose });
    if (at.map !== toMap) await this.step(DIR[dir]);
    await this.until((s) => s.map === toMap && s.ready, { timeout: 20000, what: `salir a ${toMap}` });
    return this.settle(opts);
  }

  /** Cruza el borde del mapa hacia `dir` (a pie o nadando) hasta llegar a `toMap`. */
  async crossEdge(dir, toMap, opts = {}) {
    for (let i = 0; i < 6; i++) {
      await this.step(DIR[dir]);
      const s = await this.snapState();
      if (s.map === toMap) return this.settle(opts);
      if (s.busy || s.top !== 'MapScene') await this.settle(opts);
      if ((await this.snapState()).map === toMap) return this.settle(opts);
    }
    throw new Error(`No se cruzó a ${toMap}`);
  }

  /** Empieza a nadar desde la orilla más cercana a (x, y) (A mirando al agua → «Sí»). */
  async startSwim(x, y) {
    const shore = await this.eval(([tx, ty]) => window.__b13.shoreFor(tx, ty), [x, y]);
    if (!shore) throw new Error(`Sin orilla hacia (${x},${y})`);
    await this.walkTo(shore.x, shore.y, { face: shore.face });
    await this.interact({ choose: prefer('Sí') });
    return this.until((s) => s.surfing && !s.playerBusy, { timeout: 8000, what: 'empezar a nadar' });
  }

  /** Nada hasta (x, y) solo por agua (si el destino es tierra, desembarca en él). */
  async swimTo(x, y, opts = {}) {
    let s = await this.snapState();
    if (!s.surfing) s = await this.startSwim(x, y);
    const router = (tx, ty) => this.eval(([a, b]) => window.__b13.routeMixed(a, b), [tx, ty]);
    return this.walkTo(x, y, { ...opts, router });
  }
}
