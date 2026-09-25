// Conductor del recorrido E2E del Bloque 14 (teclas reales en Chrome headless + playwright-core). Mismo esquema que
// el de tools/e2e_b11.mjs, ampliado para el Pilar de los Ecos: elecciones por etiqueta (caracolas de tres capas,
// paradas de Fausto), buceo con desvío a un respiradero cuando el medidor baja, nado en Caleta Sonda (orilla →
// remolino → tierra) y sigilo contra la Bramaluna Alfa con el planificador de la página (window.__b14.stealthNext).
import path from 'node:path';
import { installHelpers } from './e2e_b01_page.mjs';
import { installB14Helpers } from './e2e_b14_page.mjs';

export const KEY = { 2: 'ArrowDown', 4: 'ArrowLeft', 6: 'ArrowRight', 8: 'ArrowUp' };
export const DIR = { down: 2, left: 4, right: 6, up: 8 };
const TAP_SCENES = ['MessageScene', 'VerseScene', 'TravelScene', 'ObtainScene', 'CaptionScene', 'PictureScene'];
/** Segmentos de resonancia por debajo de los que se desvía a un respiradero (si hay uno cerca). */
const DIVE_LOW = 3;

export class Driver {
  constructor(page, errors, { outDir, root, prefix = 'e2e_b14', loseOnce = [], leadMoves = null }) {
    this.page = page;
    this.errors = errors;
    this.outDir = outDir;
    this.root = root;
    this.prefix = prefix;
    this.loseOnce = loseOnce;
    /** Movimientos del primer Pokémon al cargar (el piloto automático usa el primero de daño). */
    this.leadMoves = leadMoves;
    this.shots = 0;
    this.milestones = [];
    /** Etiquetas que se eligen en las próximas ChoiceScene (en orden; se consumen). */
    this.want = [];
  }

  eval(fn, arg) { return this.page.evaluate(fn, arg); }
  wait(ms) { return this.page.waitForTimeout(ms); }
  snapState() {
    return this.eval(() => ({
      ...window.__e2e.snap(),
      vars: window.__b14.vars(),
      dive: window.__b14.dive(),
      surfing: window.__b14.surfing(),
      lost: window.__b14.lost.slice(),
      battles: window.__b14.battles.map((b) => b.tag),
      choices: window.__b14.choiceItems(),
      choiceReady: window.__b14.choiceReady(),
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
    const problem = check ? check(s) : null;
    if (problem) throw new Error(`Hito «${name}»: ${problem}\nestado: ${JSON.stringify({ ...s, flags: Object.keys(s.flags).filter((k) => /^(b14|p7)/.test(k)) })}`);
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

  /** Índice a elegir: la siguiente etiqueta pedida (this.want) si está; «No» a los motes; si no, la primera. */
  pickChoice(s, choose) {
    const items = s.choices || [];
    if (this.want.length && items.includes(this.want[0])) return items.indexOf(this.want.shift());
    if (choose) return choose(s);
    if (/mote/i.test(s.lastText || '')) return Math.max(0, items.indexOf('No'));
    return 0;
  }

  /** Atiende mensajes, elecciones, placas y combates hasta que el mapa queda libre. */
  async settle({ timeout = 300000, choose = null, watch = [] } = {}) {
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
        // La escena de elección puede estar ya arriba sin sus opciones (o con las de antes): se espera a que aparezcan
        // (y, si se pidió una etiqueta, a que esté entre ellas) antes de elegir.
        const ready = (st) => st.choiceReady && (st.choices || []).length > 0 && (!this.want.length || st.choices.includes(this.want[0]));
        for (let k = 0; k < 15 && s.top === 'ChoiceScene' && !ready(s); k++) {
          await this.wait(100);
          s = await this.snapState();
        }
        if (s.top !== 'ChoiceScene') continue;
        const want = this.pickChoice(s, choose);
        // Con la máquina cargada una pulsación puede perderse: se comprueba el cursor antes de confirmar.
        let now = s;
        for (let tries = 0; tries < 30 && now.top === 'ChoiceScene' && !(now.choiceReady && now.choiceIndex === want); tries++) {
          if (now.choiceReady) await this.press(now.choiceIndex < want ? 'ArrowDown' : 'ArrowUp', 120);
          else await this.wait(100);
          now = await this.snapState();
        }
        if (now.top !== 'ChoiceScene') continue;
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

  /** Un paso en `dir` (mantiene la tecla hasta que el jugador se mueve o algo lo interrumpe). */
  async step(dir) {
    const before = await this.snapState();
    const key = KEY[dir];
    await this.page.keyboard.down(key);
    try {
      const end = Date.now() + 1500;
      while (Date.now() < end) {
        const s = await this.snapState();
        if (s.map !== before.map || s.x !== before.x || s.y !== before.y || s.busy || s.top !== 'MapScene') break;
        await this.wait(20);
      }
    } finally {
      await this.page.keyboard.up(key);
    }
    await this.until((s) => !s.playerBusy || s.busy || s.top !== 'MapScene', { timeout: 4000, what: 'fin del paso' });
  }

  async turn(dir) {
    const d = typeof dir === 'string' ? DIR[dir] : dir;
    const s = await this.snapState();
    if (s.dir === d) return;
    await this.press(KEY[d], 150, 40);
    await this.until((st) => st.dir === d || st.busy, { timeout: 2000, what: 'girar' });
  }

  /**
   * Camina hasta (x, y) (o a su lado con onto: false) atendiendo lo que salte; `face` gira al final. Bajo el agua,
   * si la resonancia baja de DIVE_LOW, se desvía antes al respiradero más cercano.
   */
  async walkTo(x, y, { onto = true, face = null, maxSteps = 700, stopWhen = null, watch = [], choose } = {}) {
    for (let n = 0; n < maxSteps; n++) {
      let s = await this.snapState();
      if (s.busy || s.top !== 'MapScene') s = await this.settle({ watch, choose });
      if (stopWhen && stopWhen(s)) return s;
      const done = onto ? s.x === x && s.y === y : Math.abs(s.x - x) + Math.abs(s.y - y) === 1;
      if (done) {
        if (face) await this.turn(face);
        return s;
      }
      let route = null;
      if (s.dive && s.dive.segments <= DIVE_LOW) {
        const vent = await this.eval(() => window.__b14.ventRoute());
        if (vent && vent.route.length && vent.route.length <= 30) route = vent.route;
      }
      if (!route) route = await this.eval(([tx, ty, o]) => window.__e2e.route(tx, ty, { onto: o }), [x, y, onto]);
      if (!route || !route.length) throw new Error(`Sin ruta a (${x},${y}) en ${s.map} desde (${s.x},${s.y})`);
      await this.step(route[0]);
    }
    throw new Error(`walkTo(${x},${y}): demasiados pasos`);
  }

  /** Se acerca al evento `id` y lo mira (casilla libre a su lado). */
  async faceEvent(id) {
    // El evento puede moverse mientras se llega (un entrenador que se acerca tras vernos): se recalcula.
    for (let i = 0; i < 4; i++) {
      const pos = await this.eval((e) => window.__b14.eventPos(e), id);
      if (!pos) throw new Error(`No existe el evento ${id}`);
      await this.walkTo(pos.x, pos.y, { onto: false });
      const s = await this.snapState();
      const now = await this.eval((e) => window.__b14.eventPos(e), id);
      if (Math.abs(now.x - s.x) + Math.abs(now.y - s.y) !== 1) continue;
      await this.turn(now.x > s.x ? 6 : now.x < s.x ? 4 : now.y > s.y ? 2 : 8);
      return now;
    }
    throw new Error(`No se pudo llegar junto a ${id}`);
  }

  /** Pulsa A delante de algo (reintenta si la pulsación se pierde) y atiende lo que pase. */
  async interact(opts = {}) {
    const before = (await this.log()).length;
    for (let i = 0; i < 3; i++) {
      await this.press('KeyZ', 120);
      // Con la máquina cargada el guion puede tardar en arrancar: si se repitiera la pulsación antes de verlo, caería
      // sobre la primera elección (p. ej. la de Fausto) y la confirmaría. Se espera a ver la reacción.
      const end = Date.now() + 1800;
      let reacted = false;
      while (!reacted && Date.now() < end) {
        const s = await this.snapState();
        reacted = s.busy || s.top !== 'MapScene' || (await this.log()).length > before;
        if (!reacted) await this.wait(100);
      }
      if (reacted) break;
    }
    return this.settle(opts);
  }

  /** Salir por una puerta o un borde empujando hacia `dir` hasta cambiar de mapa (atiende lo que salte). */
  async exitTo(dir, toMap) {
    for (let i = 0; i < 8; i++) {
      await this.page.keyboard.down(KEY[DIR[dir]]);
      await this.wait(350);
      await this.page.keyboard.up(KEY[DIR[dir]]);
      await this.wait(250);
      const s = await this.snapState();
      if (s.busy || s.top !== 'MapScene') await this.settle();
      if ((await this.snapState()).map === toMap) return this.settle();
    }
    throw new Error(`No se salió hacia ${toMap}`);
  }

  /** Pared de Trepar (raíz): ponerse delante, mirar y aceptar. */
  async climb(fromX, fromY, face, expect) {
    await this.walkTo(fromX, fromY, { face });
    await this.interact();
    await this.until((s) => s.x === expect[0] && s.y === expect[1], { timeout: 8000, what: `trepar hasta (${expect})` });
    await this.settle();
  }

  /** Golpea la caracola desde su casilla (stand) eligiendo la capa `label` (o «Golpearla» en las salas de dos). */
  async caracola(stand, label, toMap) {
    await this.walkTo(stand.x, stand.y, { face: stand.dir });
    this.want = [label];
    await this.interact();
    this.want = [];
    await this.until((s) => s.map === toMap && s.ready, { timeout: 15000, what: `cambiar a ${toMap}` });
    return this.settle();
  }

  /**
   * Sigilo en la era primigenia: avanza con el planificador hasta una de `goals` y (opcional) mira hacia `face`.
   * Si la Bramaluna embiste, el jugador vuelve a la caracola y se replanifica. → número de embestidas.
   */
  async sneakTo(goals, { face = null, hold = 150, maxActions = 900 } = {}) {
    const caughtBefore = Number((await this.snapState()).vars.b14_bramaluna_pillado || 0);
    for (let n = 0; n < maxActions; n++) {
      let s = await this.snapState();
      if (s.busy || s.top !== 'MapScene') s = await this.settle();
      if (goals.some(([gx, gy]) => gx === s.x && gy === s.y)) {
        const ok = await this.eval(([g, h]) => window.__b14.stealthNext(g, { hold: h }), [[[s.x, s.y]], hold]);
        if (ok === 0) {
          if (face) await this.turn(face);
          return Number(s.vars.b14_bramaluna_pillado || 0) - caughtBefore;
        }
      }
      const a = await this.eval(([g, h]) => window.__b14.stealthNext(g, { hold: h }), [goals, hold]);
      if (a === null) { await this.wait(120); continue; }
      if (a === 0) { await this.wait(60); continue; }
      await this.step(a);
    }
    throw new Error(`sneakTo(${JSON.stringify(goals)}): sin llegar`);
  }

  /** Nadar en Caleta Sonda hasta (x, y): orilla más cercana, «¿Quieres nadar?» y ruta por el agua. */
  async swimTo(x, y) {
    let s = await this.snapState();
    if (!s.surfing) {
      const shore = await this.eval(([tx, ty]) => window.__b14.shoreFor(tx, ty), [x, y]);
      if (!shore) throw new Error(`Sin orilla hacia (${x},${y}) en ${s.map}`);
      await this.walkTo(shore.x, shore.y, { face: shore.face });
      await this.interact();
      s = await this.until((st) => st.surfing && !st.playerBusy, { timeout: 8000, what: 'empezar a nadar' });
    }
    return this.walkTo(x, y);
  }

  /** Nadando: vuelve a la tierra más cercana. */
  async toLand() {
    const r = await this.eval(() => window.__b14.landRoute());
    if (!r) throw new Error('Sin tierra a la vista');
    for (const d of r.route) {
      await this.step(d);
      const s = await this.snapState();
      if (!s.surfing) break;
    }
    return this.settle();
  }

  async goto(url) {
    await this.page.goto(url, { waitUntil: 'load' });
    await installHelpers(this.page);
    await installB14Helpers(this.page, { loseOnce: this.loseOnce });
    await this.until((s) => s.top === 'MapScene' && s.ready, { timeout: 30000, what: 'el mapa de arranque' });
    if (this.leadMoves) {
      const ok = await this.eval((ids) => window.__b14.setMoves(0, ids), this.leadMoves);
      if (!ok) throw new Error(`No se pudieron poner los movimientos ${this.leadMoves}`);
    }
    await this.settle();
  }
}
