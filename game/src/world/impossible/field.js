// Integración del espacio imposible con MapScene (una instancia por escena: scene.impossible). Solo actúa en mapas
// cuya definición lleva `impossible` (docs/ARCHITECTURE.md §16):
//   impossible: { section: 'cara_1', spawn: { x, y, dir }, reach: 4, onFirstFall: async (ctx) => {}, fallFlag }
// Cada fotograma (tras World#update): puentes de la mirada (visibilidad y opacidad), giro sobre un puente y caída
// al vacío (casilla sin tiles) → guion fallToAnchor. Al llegar por warp a otra «sección», la casilla de llegada pasa a
// ser el punto seguro (no se vuelve a la sala anterior al caer). MapScene llama: onEnterMap(entry) · update(dt,
// { paused }) · dispose(); las acciones (actions.js) avisan con markArrival() / resetTracking().
import { isVoidCell, inGaze, GAZE_REACH, ANCHOR_VAR, encodeAnchor, decodeAnchor } from './logic.js';
import { fallToAnchor } from './actions.js';

const FADE_STEP = 36; // opacidad por fotograma de los puentes (≈ 7 fotogramas de 0 a 255)
const key = (x, y) => `${x},${y}`;

export class ImpossibleField {
  constructor(scene) {
    this.scene = scene;
    this.def = null;
    this.cfg = null;
    this.bridges = [];
    this.prev = null; // { x, y, dir } del fotograma anterior
    this.turnedOn = null; // clave del puente sobre el que el jugador ha girado
    this.arrival = null; // 'turn' | 'fall' | null: cómo se entró en el mapa actual
    this.falling = false;
  }

  get world() { return this.scene.world; }
  get state() { return this.scene.state; }
  get active() { return Boolean(this.cfg); }

  markArrival(kind) { this.arrival = kind; }

  resetTracking() {
    const p = this.world?.player;
    this.prev = p ? { x: p.x, y: p.y, dir: p.direction } : null;
    this.turnedOn = null;
  }

  onEnterMap(entry) {
    const def = entry?.def;
    this.def = def || null;
    this.cfg = def?.impossible ? { reach: GAZE_REACH, ...def.impossible } : null;
    this.bridges = [];
    this.falling = false;
    const arrival = this.arrival;
    this.arrival = null;
    if (!this.cfg) return;
    this.bridges = (entry.events || []).filter((ev) => ev.def?.type === 'puenteMirada');
    this.resetTracking();
    // Llegada por warp a otra sección: la casilla de llegada es el punto seguro provisional.
    if (arrival !== 'turn' && arrival !== 'fall') this.maybeSectionAnchor(def);
  }

  /** Si la última Ancla es de otra sección (o no hay), la llegada actual pasa a ser el punto seguro. */
  maybeSectionAnchor(def) {
    const st = this.state;
    const a = decodeAnchor(st.var(ANCHOR_VAR, null));
    const maps = [def.id, ...(this.cfg.sectionMaps || [])];
    if (a && maps.includes(a.map)) return;
    const p = this.world.player;
    st.setVar(ANCHOR_VAR, encodeAnchor({ map: def.id, x: p.x, y: p.y, dir: p.direction }));
    this.world.requestRefresh?.();
  }

  /** ¿Pisa el jugador el vacío (sin puente)? MapScene no tira encuentros ahí: el paso acaba en caída. */
  overVoid() {
    const w = this.world;
    const p = w?.player;
    if (!this.cfg || !w?.map || !p) return false;
    return !this.bridgeAt(p.x, p.y) && isVoidCell(w.map, p.x, p.y);
  }

  /** ¿Existe ahora un puente de la mirada en (x, y)? */
  bridgeAt(x, y) {
    return this.bridges.find((b) => !b.erased && b.page && b.x === x && b.y === y) || null;
  }

  bridgeExists(ev) {
    const p = this.world.player;
    if (p.x === ev.x && p.y === ev.y) return this.turnedOn !== key(ev.x, ev.y);
    return inGaze(p.x, p.y, p.direction, ev.x, ev.y, this.cfg.reach);
  }

  updateBridges() {
    for (const ev of this.bridges) {
      if (ev.erased || !ev.page) continue;
      const target = this.bridgeExists(ev) ? 255 : 0;
      if (ev.opacity < target) ev.opacity = Math.min(target, ev.opacity + FADE_STEP);
      else if (ev.opacity > target) ev.opacity = Math.max(target, ev.opacity - FADE_STEP);
    }
  }

  update(_dt, { paused = false } = {}) {
    if (!this.cfg || !this.world?.current) return;
    this.updateBridges();
    if (paused || this.falling) return;
    const w = this.world;
    const p = w.player;
    // Giro encima de un puente: el giro ocurre en la casilla del fotograma anterior (el paso nuevo, si lo hay,
    // empieza en el mismo fotograma); ese puente deja de existir y el jugador cae en cuanto termine de moverse.
    const prev = this.prev;
    if (prev && !this.turnedOn && !w.scriptBusy() && p.direction !== prev.dir && this.bridgeAt(prev.x, prev.y)) {
      this.turnedOn = key(prev.x, prev.y);
    }
    this.prev = { x: p.x, y: p.y, dir: p.direction };
    if (w.scriptBusy() || this.scene.transferring || p.busy()) return;
    if (this.turnedOn) { this.startFall(); return; }
    if (!this.bridgeAt(p.x, p.y) && isVoidCell(w.map, p.x, p.y)) this.startFall();
  }

  startFall() {
    if (this.falling) return;
    this.falling = true;
    const cfg = this.cfg;
    const def = this.def;
    const spawn = cfg.spawn || def.start || null;
    const fallback = spawn ? { map: def.id, x: spawn.x, y: spawn.y, dir: spawn.dir || 2 } : null;
    this.scene.runScript(async (ctx) => {
      try {
        await fallToAnchor(ctx, { fallback, onFirst: cfg.onFirstFall || null, firstFlag: cfg.fallFlag || null });
      } finally {
        this.falling = false;
        this.resetTracking();
      }
    }, null, 'espacio imposible: caída');
  }

  dispose() {
    this.bridges = [];
    this.cfg = null;
    this.def = null;
  }
}
