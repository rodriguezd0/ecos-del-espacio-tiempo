// Conductor del recorrido E2E del Bloque 8 (teclas reales en Chrome headless + playwright-core). Mismo esquema que
// el de tools/e2e_b07.mjs, ampliado para la Cámara de los Contrapesos: montar/desmontar (tecla E = botón R), girar sin
// andar (toque corto: el jugador de Essentials gira si la tecla dura menos de 75 ms), empujar parando en cuanto
// cambia el estado del puzle (sin segundos empujones) y tirar (A mantenida delante del contrapeso + «Tirar»).
import path from 'node:path';

export const KEY = { 2: 'ArrowDown', 4: 'ArrowLeft', 6: 'ArrowRight', 8: 'ArrowUp' };
export const DIR = { down: 2, left: 4, right: 6, up: 8 };
const TAP_SCENES = ['MessageScene', 'VerseScene', 'TravelScene', 'ObtainScene', 'CaptionScene', 'PictureScene'];

export class Driver {
  constructor(page, errors, { outDir, root, prefix = 'e2e_b08' }) {
    this.page = page;
    this.errors = errors;
    this.outDir = outDir;
    this.root = root;
    this.prefix = prefix;
    this.shots = 0;
    this.milestones = [];
    /** Índice que se elige en la próxima ChoiceScene (se consume); si no, `choose` de settle o la 1.ª opción. */
    this.nextChoice = null;
  }

  eval(fn, arg) { return this.page.evaluate(fn, arg); }
  wait(ms) { return this.page.waitForTimeout(ms); }
  snapState() {
    return this.eval(() => ({
      ...window.__e2e.snap(), vars: window.__b08.vars(), riding: window.__b08.riding(), lost: window.__b08.lost.slice(),
      battles: window.__b08.battles.slice(), lastDir: window.__map?.world?.player?.lastDir ?? 0,
    }));
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
      if (Date.now() > end) throw new Error(`Tiempo agotado esperando: ${what}\nestado: ${JSON.stringify({ ...s, battles: undefined })}\n${this.errors.slice(-6).join('\n')}`);
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
    if (problem) throw new Error(`Hito «${name}»: ${problem}\nestado: ${JSON.stringify({ ...s, battles: undefined })}`);
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

  /** Atiende mensajes, elecciones y combates hasta que el mapa queda libre. */
  async settle({ timeout = 240000, choose = () => 0, watch = [] } = {}) {
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
      if (TAP_SCENES.includes(s.top)) { calm = 0; await this.press('KeyZ', 160); continue; }
      if (s.top === 'ChoiceScene') {
        calm = 0;
        const want = this.nextChoice ?? choose(s);
        this.nextChoice = null;
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
    throw new Error(`settle: el mapa no queda libre\n${JSON.stringify(await this.snapState())}`);
  }

  /**
   * Un paso en `dir`: mantiene la tecla hasta que el jugador se mueve, cambia de mapa, salta un guion o cambia el
   * estado del puzle de la Cámara (un empujón), y entonces la suelta.
   */
  async step(dir, { settle = true } = {}) {
    const before = await this.snapState();
    const watchFor = { x: before.x, y: before.y, map: before.map, puzzle: JSON.stringify(before.vars.b08_camara ?? null), timeout: 1500 };
    const key = KEY[dir];
    await this.page.keyboard.down(key);
    try {
      // La espera corre dentro de la página: la tecla se suelta en cuanto empieza el paso (nunca da dos).
      await this.eval((a) => window.__b08.waitChange(a), watchFor);
    } finally {
      await this.page.keyboard.up(key);
    }
    await this.until((s) => !s.playerBusy || s.busy || s.top !== 'MapScene', { timeout: 4000, what: 'fin del paso' });
    if (!settle) return;
    const s = await this.snapState();
    if (s.busy || s.top !== 'MapScene') await this.settle();
  }

  /** Gira sin andar (toque corto). Si la tecla coincide con la última dirección pulsada, antes gira a otra. */
  async face(dir) {
    const d = typeof dir === 'string' ? DIR[dir] : dir;
    let s = await this.snapState();
    if (s.dir === d) return;
    if (s.lastDir === d) {
      const other = [2, 4, 6, 8].find((x) => x !== d && x !== s.dir) || [2, 4, 6, 8].find((x) => x !== d);
      await this.press(KEY[other], 120, 25);
    }
    await this.press(KEY[d], 150, 25);
    s = await this.until((st) => st.dir === d || st.busy, { timeout: 2000, what: 'girar' });
    if (s.busy) await this.settle();
  }

  /** Monta o desmonta el 10 % (tecla E = botón R). */
  async setMount(want) {
    const s = await this.snapState();
    if (s.riding === want) return;
    await this.press('KeyE', 350);
    await this.until((st) => st.riding === want || st.busy, { timeout: 5000, what: want ? 'montar' : 'desmontar' });
    const after = await this.snapState();
    if (after.busy || after.top !== 'MapScene') await this.settle();
  }

  /** Tira del contrapeso que hay en `dir`: A mantenida (el guion lee «A pulsada») y la opción «Tirar». */
  async pull(dir) {
    await this.face(dir);
    this.nextChoice = 1;
    await this.page.keyboard.down('KeyZ');
    await this.wait(260);
    await this.page.keyboard.up('KeyZ');
    await this.wait(120);
    await this.settle();
    this.nextChoice = null;
  }

  /** Camina hasta (x, y) con la ruta de window.__e2e atendiendo lo que salte por el camino. */
  async walkTo(x, y, { onto = true, face = null, maxSteps = 500, stopWhen = null, watch = [] } = {}) {
    for (let n = 0; n < maxSteps; n++) {
      let s = await this.snapState();
      if (s.busy || s.top !== 'MapScene') s = await this.settle({ watch });
      if (stopWhen && stopWhen(s)) return s;
      const done = onto ? s.x === x && s.y === y : Math.abs(s.x - x) + Math.abs(s.y - y) === 1;
      if (done) {
        if (face) await this.face(face);
        return s;
      }
      const route = await this.eval(([tx, ty, o]) => window.__e2e.route(tx, ty, { onto: o }), [x, y, onto]);
      if (!route || !route.length) throw new Error(`Sin ruta a (${x},${y}) en ${s.map} desde (${s.x},${s.y})`);
      await this.step(route[0], { settle: false }); // lo que salte lo atiende la vuelta siguiente (con `watch`)
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

  async crossEdge(dir, toMap) {
    for (let i = 0; i < 6; i++) {
      await this.step(DIR[dir]);
      const s = await this.snapState();
      if (s.map === toMap) return s;
    }
    throw new Error(`No se cruzó a ${toMap}`);
  }

  /** Entra por una puerta-warp: se coloca delante y empuja hacia ella hasta cambiar de mapa. */
  async enter(x, y, dir, toMap) {
    const [ox, oy] = { 2: [0, -1], 4: [1, 0], 6: [-1, 0], 8: [0, 1] }[DIR[dir]];
    await this.walkTo(x + ox, y + oy);
    for (let i = 0; i < 4; i++) {
      await this.step(DIR[dir]);
      const s = await this.snapState();
      if (s.map === toMap) break;
    }
    await this.until((s) => s.map === toMap && s.ready, { timeout: 15000, what: `entrar en ${toMap}` });
    return this.settle();
  }
}
