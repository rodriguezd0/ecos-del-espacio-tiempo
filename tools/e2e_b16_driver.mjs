// Conductor del recorrido E2E del Bloque 16 (teclas reales en Chrome headless + playwright-core). Mismo esquema que
// los de tools/e2e_b11.mjs y e2e_b14_driver.mjs, ampliado para el Pilar del Alma: warps dentro del mismo mapa (salas
// del santuario), controles en espejo (el recuerdo de Gael: se pulsa la tecla contraria), recorridos con la tecla
// mantenida (pasillo del viento de Azelf: parar = volver a la repisa), pasos que esperan al reflejo (salas de espejos),
// nado entre orillas y el ritual del Telar (pulsar A cuando brilla cada hebra, window.__b16Ritual).
import path from 'node:path';
import { installHelpers } from './e2e_b01_page.mjs';
import { installB16Helpers } from './e2e_b16_page.mjs';

export const KEY = { 2: 'ArrowDown', 4: 'ArrowLeft', 6: 'ArrowRight', 8: 'ArrowUp' };
export const DIR = { down: 2, left: 4, right: 6, up: 8 };
export const DV = { 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] };
const MIRRORED = { 2: 2, 8: 8, 4: 6, 6: 4 };
const TAP_SCENES = ['MessageScene', 'VerseScene', 'TravelScene', 'ObtainScene', 'CaptionScene', 'PictureScene'];
const QUIET_SCENES = ['MapScene', 'ChoiceScene', 'BattleScene', 'BattleTransitionScene'];

export class Driver {
  constructor(page, errors, { outDir, root, prefix = 'e2e_b16', loseOnce = [] }) {
    this.page = page;
    this.errors = errors;
    this.outDir = outDir;
    this.root = root;
    this.prefix = prefix;
    this.loseOnce = loseOnce;
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
      vars: window.__b16.vars(),
      surfing: window.__b16.surfing(),
      mirror: window.__b16.mirror(),
      lost: window.__b16.lost.slice(),
      battles: window.__b16.battles.map((b) => b.tag),
      choices: window.__b16.choiceItems(),
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
    const problem = check ? await check(s) : null;
    if (problem) throw new Error(`Hito «${name}»: ${problem}\nestado: ${JSON.stringify({ ...s, flags: Object.keys(s.flags).filter((k) => /^(b16|p8|zyg)/.test(k)) })}`);
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

  /**
   * Atiende mensajes, elecciones, placas y combates hasta que el mapa queda libre. `onBusy(s)` se llama en cada vuelta
   * con el mapa ocupado sin mensaje (ritual del Telar); si devuelve true se considera atendido.
   */
  async settle({ timeout = 300000, choose = null, watch = [], onBusy = null } = {}) {
    const end = Date.now() + timeout;
    let calm = 0;
    let stuck = 0;
    while (Date.now() < end) {
      let s = await this.snapState();
      for (const w of watch) {
        if (w.done) continue;
        const hit = (w.re && w.re.test(s.lastText || '')) || (w.scene && s.top === w.scene) || (w.when && w.when(s));
        if (!hit) continue;
        w.done = true;
        if (w.delay) await this.wait(w.delay);
        await this.shot(w.name);
        s = await this.snapState();
      }
      if (TAP_SCENES.includes(s.top)) { calm = 0; stuck = 0; await this.press('KeyZ', 160); continue; }
      if (s.top === 'ChoiceScene') {
        calm = 0;
        const want = this.pickChoice(s, choose);
        for (let i = s.choiceIndex; i < want; i++) await this.press('ArrowDown', 120);
        for (let i = s.choiceIndex; i > want; i--) await this.press('ArrowUp', 120);
        await this.press('KeyZ', 250);
        continue;
      }
      if (onBusy && s.top === 'MapScene' && s.busy && (await onBusy(s))) { calm = 0; continue; }
      // Escenas desconocidas que esperan una pulsación (tras 3 s quietas)
      if (!QUIET_SCENES.includes(s.top)) {
        stuck += 1;
        if (stuck > 20) { stuck = 0; await this.press('KeyZ', 200); }
      }
      if (s.top === 'MapScene' && s.ready && !s.busy && !s.playerBusy) {
        calm += 1;
        if (calm >= 4) return s;
      } else calm = 0;
      await this.wait(150);
    }
    throw new Error(`settle: el mapa no queda libre\n${JSON.stringify(await this.snapState())}`);
  }

  /** Tecla real para ir hacia `dir` (en el recuerdo de Gael izquierda y derecha van al revés). */
  keyFor(dir, s) { return KEY[s?.mirror ? MIRRORED[dir] : dir]; }

  /** Posición del jugador (consulta ligera). */
  pos() {
    return this.eval(() => {
      const w = window.__map;
      const p = w?.world?.player;
      return { x: p?.x ?? null, y: p?.y ?? null, map: w?.world?.map?.id ?? null, mirror: Boolean(w?.world?.current?.def?.mirrorControls) };
    });
  }

  /**
   * Espera, comprobando en cada fotograma de la página, a que el jugador deje (x, y) o empiece un guion. Así la tecla se
   * suelta en cuanto arranca el paso aunque el equipo vaya cargado (si no, el jugador daría un paso de más).
   */
  waitLeave(x, y, map, timeout = 1500) {
    return this.page.waitForFunction(([px, py, pm]) => {
      const w = window.__map;
      const p = w?.world?.player;
      if (!p) return 'gone';
      if (w.world.map.id !== pm) return 'map';
      if (w.world.scriptBusy()) return 'script';
      return p.x !== px || p.y !== py ? 'moved' : false;
    }, [x, y, map], { polling: 'raf', timeout }).then((h) => h, () => null);
  }

  /** Un paso en `dir` (mantiene la tecla hasta que el jugador se mueve o algo lo interrumpe). */
  async step(dir) {
    const before = await this.pos();
    const key = this.keyFor(dir, before);
    await this.page.keyboard.down(key);
    try {
      await this.waitLeave(before.x, before.y, before.map);
    } finally {
      await this.page.keyboard.up(key);
    }
    await this.until((s) => !s.playerBusy || s.busy || s.top !== 'MapScene', { timeout: 4000, what: 'fin del paso' });
  }

  async turn(dir) {
    const d = typeof dir === 'string' ? DIR[dir] : dir;
    const s = await this.snapState();
    if (s.dir === d) return;
    await this.press(this.keyFor(d, s), 150, 40);
    await this.until((st) => st.dir === d || st.busy, { timeout: 2000, what: 'girar' });
  }

  /** Camina hasta (x, y) (o a su lado con onto: false) atendiendo lo que salte; `face` gira al final. */
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
      const route = await this.eval(([tx, ty, o]) => window.__e2e.route(tx, ty, { onto: o }), [x, y, onto]);
      if (!route || !route.length) throw new Error(`Sin ruta a (${x},${y}) en ${s.map} desde (${s.x},${s.y})`);
      await this.step(route[0]);
    }
    throw new Error(`walkTo(${x},${y}): demasiados pasos`);
  }

  /** Recorre `dirs` con la tecla mantenida (sin pararse entre pasos). Se corta si salta un guion. → pasos dados. */
  async holdPath(dirs) {
    let held = null;
    let n = 0;
    const start = await this.pos();
    let cur = { x: start.x, y: start.y };
    try {
      for (let i = 0; i < dirs.length; i++) {
        const key = this.keyFor(dirs[i], start);
        if (held !== key) {
          await this.page.keyboard.down(key);
          if (held) await this.page.keyboard.up(held);
          held = key;
        }
        const handle = await this.waitLeave(cur.x, cur.y, start.map, 3000);
        // La tecla del paso siguiente se pone YA (antes de mirar por qué se salió): si no, con el equipo cargado el
        // jugador llega a la esquina con la tecla vieja y da un paso de más.
        const next = dirs[i + 1] ? this.keyFor(dirs[i + 1], start) : null;
        if (next !== held) {
          if (next) await this.page.keyboard.down(next);
          if (held) await this.page.keyboard.up(held);
          held = next;
        }
        const why = handle ? await handle.jsonValue() : null;
        if (why !== 'moved' && why !== 'script') break;
        cur = { x: cur.x + DV[dirs[i]][0], y: cur.y + DV[dirs[i]][1] };
        n += 1;
        if (why === 'script') break;
      }
    } finally {
      if (held) await this.page.keyboard.up(held);
    }
    await this.until((s) => !s.playerBusy || s.busy || s.top !== 'MapScene', { timeout: 4000, what: 'fin del recorrido' });
    return n;
  }

  /** Se acerca al evento `id` y lo mira (casilla libre a su lado). */
  async faceEvent(id) {
    for (let i = 0; i < 4; i++) {
      const pos = await this.eval((e) => window.__b16.eventPos(e), id);
      if (!pos) throw new Error(`No existe el evento ${id}`);
      await this.walkTo(pos.x, pos.y, { onto: false });
      const s = await this.snapState();
      const now = await this.eval((e) => window.__b16.eventPos(e), id);
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
      await this.press('KeyZ', 300);
      const s = await this.snapState();
      if (s.busy || s.top !== 'MapScene' || (await this.log()).length > before) break;
      await this.wait(200);
    }
    return this.settle(opts);
  }

  /** Habla desde (x, y) mirando a `face`. */
  async talk(x, y, face, opts = {}) {
    await this.walkTo(x, y, { face });
    return this.interact(opts);
  }

  /**
   * Empuja hacia `dir` (tecla sostenida a golpes) hasta que se cumpla `pred` (warp del mismo mapa o a otro).
   * `opts` son los de settle (watch…) para lo que salte al cruzar.
   */
  async pushUntil(dir, pred, what = 'cruzar', opts = {}) {
    for (let i = 0; i < 10; i++) {
      const s0 = await this.snapState();
      if (pred(s0)) return this.settle(opts);
      const key = this.keyFor(typeof dir === 'string' ? DIR[dir] : dir, s0);
      await this.page.keyboard.down(key);
      await this.wait(350);
      await this.page.keyboard.up(key);
      await this.wait(250);
      const s = await this.snapState();
      if (s.busy || s.top !== 'MapScene') await this.settle(opts);
      if (pred(await this.snapState())) return this.settle(opts);
    }
    throw new Error(`No se pudo ${what}`);
  }

  /** Sale por la casilla (x, y) de una escalinata (warp por dirección `dir`) hasta que se cumpla `pred`. */
  async leave(x, y, dir, pred, what = 'salir', opts = {}) {
    await this.walkTo(x, y, { stopWhen: pred, watch: opts.watch || [] });
    return this.pushUntil(dir, pred, what, opts);
  }

  /** Salir a otro mapa empujando hacia `dir`. */
  exitTo(dir, toMap, opts = {}) { return this.pushUntil(dir, (s) => s.map === toMap, `salir hacia ${toMap}`, opts); }

  /** Nadar hasta (x, y): orilla más cercana, «¿Quieres nadar?» y ruta por el agua. */
  async swimTo(x, y) {
    let s = await this.snapState();
    if (!s.surfing) {
      const shore = await this.eval(([tx, ty]) => window.__b16.shoreFor(tx, ty), [x, y]);
      if (!shore) throw new Error(`Sin orilla hacia (${x},${y}) en ${s.map}`);
      await this.walkTo(shore.x, shore.y, { face: shore.face });
      await this.interact();
      s = await this.until((st) => st.surfing && !st.playerBusy, { timeout: 8000, what: 'empezar a nadar' });
    }
    // Siempre por el agua (una ruta que pisa tierra haría desembarcar a medio camino).
    for (let n = 0; n < 700; n++) {
      s = await this.snapState();
      if (s.busy || s.top !== 'MapScene') s = await this.settle();
      if (s.x === x && s.y === y) return s;
      const route = await this.eval(([tx, ty]) => window.__b16.waterRoute(tx, ty), [x, y]);
      if (!route || !route.length) throw new Error(`Sin ruta nadando a (${x},${y}) desde (${s.x},${s.y}) (nadando ${s.surfing})`);
      await this.step(route[0]);
    }
    throw new Error(`swimTo(${x},${y}): demasiados pasos`);
  }

  async goto(url) {
    await this.page.goto(url, { waitUntil: 'load' });
    await installHelpers(this.page);
    await installB16Helpers(this.page, { loseOnce: this.loseOnce });
    await this.until((s) => s.top === 'MapScene' && s.ready, { timeout: 30000, what: 'el mapa de arranque' });
    await this.settle();
  }
}
