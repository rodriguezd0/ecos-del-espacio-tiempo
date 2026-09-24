// Planificador de tareas por fotograma lógico (60 Hz) para las animaciones de combate. Módulo PURO.
// Cada tarea es una función `step()` que se llama una vez por fotograma y devuelve true al terminar;
// la promesa asociada se resuelve entonces. Permite escribir secuencias como código async:
//   await tasks.tween(20, (k) => { sprite.x = lerp(a, b, k); }, Ease.outQuad);
//   await tasks.wait(8);

export const Ease = Object.freeze({
  linear: (k) => k,
  inQuad: (k) => k * k,
  outQuad: (k) => 1 - (1 - k) * (1 - k),
  inOutQuad: (k) => (k < 0.5 ? 2 * k * k : 1 - ((-2 * k + 2) ** 2) / 2),
  outCubic: (k) => 1 - (1 - k) ** 3,
  inCubic: (k) => k * k * k,
  inOutSine: (k) => -(Math.cos(Math.PI * k) - 1) / 2,
  outBack: (k) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * (k - 1) ** 3 + c1 * (k - 1) ** 2;
  },
});

export const lerp = (a, b, k) => a + (b - a) * k;
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export class Tasks {
  constructor() {
    this.items = [];
    this.frame = 0;
  }

  get busy() {
    return this.items.length > 0;
  }

  /** Añade una tarea; `step()` → true cuando termina. Devuelve una promesa. */
  add(step) {
    return new Promise((resolve) => {
      this.items.push({ step, resolve });
    });
  }

  /** Espera `frames` fotogramas lógicos. */
  wait(frames) {
    let left = Math.max(0, Math.round(frames));
    if (left === 0) return Promise.resolve();
    return this.add(() => --left <= 0);
  }

  /**
   * Interpola k de 0 a 1 en `frames` fotogramas llamando a fn(easedK, rawK). fn(…1) se llama siempre al final.
   */
  tween(frames, fn, ease = Ease.linear) {
    const total = Math.max(1, Math.round(frames));
    let t = 0;
    return this.add(() => {
      t += 1;
      const k = Math.min(1, t / total);
      fn(ease(k), k);
      return t >= total;
    });
  }

  /** Llama a fn(t) cada fotograma hasta que devuelva true (o hasta `max` fotogramas). */
  until(fn, max = Infinity) {
    let t = 0;
    return this.add(() => {
      t += 1;
      return Boolean(fn(t)) || t >= max;
    });
  }

  /** Avanza un fotograma. Los errores de una tarea la terminan (se registran) sin romper las demás. */
  update() {
    this.frame += 1;
    const current = this.items;
    this.items = [];
    const keep = [];
    for (const it of current) {
      let done = true;
      try {
        done = it.step();
      } catch (err) {
        console.error('[combate] Error en una animación:', err);
      }
      if (done) it.resolve();
      else keep.push(it);
    }
    this.items = keep.concat(this.items);
  }

  /** Termina todas las tareas pendientes (resuelve sus promesas). */
  clear() {
    const all = this.items;
    this.items = [];
    for (const it of all) it.resolve();
  }
}

/** Ejecuta varias animaciones en paralelo y espera a todas. */
export function all(...promises) {
  return Promise.all(promises.flat().filter(Boolean));
}
