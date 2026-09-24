// Pila de escenas. Solo la escena superior recibe update/input; las transparentes
// dejan ver (renderizar) la de debajo.

export class Scene {
  constructor() {
    this.engine = null;
  }
  async enter(_params) {}
  exit() {}
  update(_dt) {}
  render(_renderer) {}
  drawUI(_g) {}
  get transparent() {
    return false;
  }
}

export class SceneManager {
  constructor(engine) {
    this.engine = engine;
    this.stack = []; // [{ scene, resolve }]
    this.busy = false;
  }

  get top() {
    return this.stack.length ? this.stack[this.stack.length - 1].scene : null;
  }

  /** Apila una escena; la promesa se resuelve con el valor pasado a pop(). */
  async push(scene, params) {
    scene.engine = this.engine;
    let resolve;
    const done = new Promise((r) => { resolve = r; });
    await scene.enter(params);
    this.stack.push({ scene, resolve });
    this.engine.input.flush();
    return done;
  }

  /** Desapila la escena superior (o la indicada) devolviendo `result` a quien la apiló. */
  pop(result, scene = this.top) {
    const idx = this.stack.findIndex((e) => e.scene === scene);
    if (idx < 0) return;
    const [entry] = this.stack.splice(idx, 1);
    try {
      entry.scene.exit();
    } catch (err) {
      // Un fallo al liberar recursos no debe dejar colgado a quien espera el resultado.
      console.error('Error al salir de la escena', err);
    }
    this.engine.input.flush();
    entry.resolve(result);
  }

  /** Sustituye toda la pila por una escena nueva. */
  async replace(scene, params) {
    const old = this.stack.splice(0);
    for (const e of old.reverse()) {
      try {
        e.scene.exit();
      } catch (err) {
        console.error('Error al salir de la escena', err);
      }
      e.resolve(undefined);
    }
    return this.push(scene, params);
  }

  update(dt) {
    const top = this.top;
    if (top) top.update(dt);
  }

  /** Renderiza desde la última escena opaca hacia arriba. */
  render(renderer, g) {
    let start = this.stack.length - 1;
    while (start > 0 && this.stack[start].scene.transparent) start -= 1;
    renderer.setRenderTarget(null);
    renderer.clear();
    for (let i = Math.max(start, 0); i < this.stack.length; i++) this.stack[i].scene.render(renderer);
    g.clearRect(0, 0, g.canvas.width, g.canvas.height);
    for (let i = Math.max(start, 0); i < this.stack.length; i++) this.stack[i].scene.drawUI(g);
  }
}
