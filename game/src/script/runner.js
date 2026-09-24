// Ejecutor de guiones async (escenas de historia, eventos). Los guiones bloqueantes impiden que el
// jugador se mueva mientras corren; las esperas se miden en fotogramas lógicos (60 Hz) del mapa.
import { engine } from '../core/engine.js';

export class ScriptRunner {
  constructor() {
    this.blocking = 0;
    this.running = new Set();
    this.waits = []; // { frames, resolve }
    this.conditions = []; // { pred, resolve }
  }

  get busy() { return this.blocking > 0; }

  /**
   * Ejecuta `fn(ctx)`; devuelve una promesa con su resultado (o undefined si falla).
   * opts: { blocking = true, name } — los errores se registran y se muestran en modo desarrollo.
   */
  async run(fn, ctx, { blocking = true, name = 'guion' } = {}) {
    if (typeof fn !== 'function') throw new Error(`ScriptRunner: ${name} no es una función`);
    const job = { name, blocking };
    this.running.add(job);
    if (blocking) this.blocking += 1;
    try {
      return await fn(ctx);
    } catch (err) {
      console.error(`Error en ${name}:`, err);
      engine.reportError?.(new Error(`Guion "${name}": ${err?.message || err}`));
      return undefined;
    } finally {
      if (blocking) this.blocking -= 1;
      this.running.delete(job);
      ctx?.onFinish?.();
    }
  }

  /** Espera `frames` fotogramas lógicos. */
  wait(frames) {
    const n = Math.max(0, Math.round(frames));
    if (n === 0) return Promise.resolve();
    return new Promise((resolve) => this.waits.push({ frames: n, resolve }));
  }

  /** Espera hasta que `pred()` sea verdadero (se comprueba cada fotograma). */
  until(pred) {
    if (pred()) return Promise.resolve();
    return new Promise((resolve) => this.conditions.push({ pred, resolve }));
  }

  /** Avanza un fotograma (llamar desde MapScene.update). */
  tick() {
    if (this.waits.length) {
      const done = [];
      for (const w of this.waits) { w.frames -= 1; if (w.frames <= 0) done.push(w); }
      this.waits = this.waits.filter((w) => w.frames > 0);
      for (const w of done) w.resolve();
    }
    if (this.conditions.length) {
      const done = this.conditions.filter((c) => { try { return c.pred(); } catch { return true; } });
      this.conditions = this.conditions.filter((c) => !done.includes(c));
      for (const c of done) c.resolve();
    }
  }

  /** Libera todas las esperas (al salir de la escena). */
  cancelAll() {
    for (const w of this.waits) w.resolve();
    for (const c of this.conditions) c.resolve();
    this.waits = [];
    this.conditions = [];
  }
}
