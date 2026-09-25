// Integración del sistema de campo de Zygarde con MapScene (una instancia por escena: scene.zygarde).
// MapScene llama: applyDevParams(params) · onEnterMap(entry) · onFollowerRefresh() · update(dt, { paused })
// tras World#update · drawUI(g) · dispose(). Aquí viven la montura (tecla R = E), el latido de detección,
// la flecha de Detección mejorada, el rótulo «Células: n/m», la sesión de Buceo y el Salto de Convergencia.
import { engine } from '../../core/engine.js';
import { ui } from '../../ui/api.js';
import './fx.js';
import { CELLS } from '../../content/zygarde/cells.js';
import { CORE_IDS, FORM_ORDER } from '../../content/zygarde/thresholds.js';
import { FIELD_TEXT } from '../../content/zygarde/texts.js';
import { coreTalk } from '../../content/companion.js';
import { registerFieldItem, registerFieldAction } from '../fieldActions.js';
import { syncMount, setRiding, canRide, mountState, mountAllowed, isRiding, hasDiveArt } from './mount.js';
import { DiveMeter, underwaterConfig, isShallow, diveLightRadius } from './dive.js';
import { nearestCell, heartbeatInterval, heartbeatStrength, cellLabel, vectorAngle } from './detection.js';
import { drawDiveMeter, drawDetectArrow, drawJumpOverlay } from './hud.js';
import { diveDepleted, runZygardeAction } from './actions.js';
import { remindMissing } from './scenes.js';
import { naturalForm, joinCore, setForm } from './progression.js';

const MOUNT_BUTTON = 'R';

// El Arca desde la Mochila abre la pantalla de Zygarde; sus acciones (volar, forma) se ejecutan en el mapa.
registerFieldItem('ZYGARDECUBE', async (ctx) => {
  const r = await ctx.ui.openZygarde({ arca: true });
  if (r?.type === 'zygarde') await runZygardeAction(ctx, r);
  else ctx.scene?.refreshFollower?.();
  return true;
});
registerFieldAction('zygarde', (ctx, action) => runZygardeAction(ctx, action));

/** Hablar con el Core: si un hito espera células, lo recuerda («Me faltan dos partes»); si no, su frase. */
async function zygardeTalk(ctx, core) {
  core.turnToward?.(ctx.player);
  if (await remindMissing(ctx)) return;
  await coreTalk(ctx, core);
}

export class ZygardeField {
  constructor(scene) {
    this.scene = scene;
    this.t = 0;
    this.nextBeat = 0;
    this.beatFx = null;
    this.near = null;
    this.dive = null; // { meter, vent: { x, y, dir }, bubble, lastSegments }
    this.jump = null; // { t, frames, skippable, resolve }
  }

  get world() { return this.scene.world; }
  get state() { return this.scene.state; }

  /**
   * Parámetros de desarrollo: ?zform=core|10|50|complete · ?zcells=N (primeras N del registro) ·
   * ?zcores=N (N1…Nn) · ?zmount=1 (monta el 10 %). Con ?zygarde=… sin forma, adopta la forma natural.
   */
  applyDevParams(params = {}) {
    const st = this.state;
    const n = (v) => Math.max(0, Math.min(1000, Number.parseInt(v, 10) || 0));
    if (params.zcores) for (const id of CORE_IDS.slice(0, n(params.zcores))) joinCore(st, id);
    if (params.zcells) for (const c of CELLS.slice(0, n(params.zcells))) st.addCell(c.key);
    if (params.zygarde && (!st.zygardeForm || st.zygardeForm === 'core')) setForm(st, naturalForm(st) || 'core');
    if (params.zform && FORM_ORDER.includes(String(params.zform))) setForm(st, String(params.zform));
    if (params.zmount === '1') setRiding(this.world, true);
  }

  // ------------------------------------------------------------ mapas
  onEnterMap(entry) {
    const def = entry?.def;
    if (!def) return;
    this.stopDive();
    this.near = null;
    this.nextBeat = this.t + 30;
    if (isRiding(this.world) && !mountAllowed(def) && !mountState(this.world).forced) setRiding(this.world, false);
    if (underwaterConfig(def)) this.startDive(def);
    if (this.state.zygardeForm && !this.scene.cinematic) { // sin rótulo en montajes y créditos (aditivo B21)
      const label = cellLabel(this.state, def.id, def);
      if (label) ui.toast(label);
    }
  }

  onFollowerRefresh() {
    const core = this.world?.core;
    if (!core) return;
    core.talk = zygardeTalk;
    if (mountState(this.world).form) core.hidden = true;
  }

  onMountChange(prev, form) {
    const core = this.world.core;
    if (form) core.hidden = true;
    else this.scene.refreshFollower?.();
  }

  // ------------------------------------------------------------ montura
  toggleMount() {
    const w = this.world;
    const st = this.state;
    if (isRiding(w)) {
      const p = w.player;
      const onGravel = w.events.some((ev) => ev.def?.type === 'gravelSlope' && ev.x === p.x && ev.y === p.y);
      if (onGravel) { this.say(FIELD_TEXT.cantDismount); return false; }
      setRiding(w, false);
      engine.audio?.playSE?.('Player jump', { volume: 50 });
      return true;
    }
    if (!canRide(w)) {
      if (st.zygardeAbility('run') && st.zygardeForm && !w.player.surfing) this.say(FIELD_TEXT.cantMount);
      return false;
    }
    setRiding(w, true);
    engine.audio?.playSE?.('core_signal', { volume: 35 });
    this.burst(w.player, 'in', 12);
    return true;
  }

  say(text) {
    this.scene.runScript((ctx) => ctx.say(text), null, 'zygarde:aviso');
  }

  burst(ch, mode = 'out', count = 14) {
    try {
      return this.scene.effects.add('zygardeHexBurst', { x: ch.x, y: ch.y, mode, count });
    } catch (err) {
      console.warn('[zygarde] efecto', err);
      return null;
    }
  }

  // ------------------------------------------------------------ Buceo
  startDive(def) {
    this.dive = { meter: new DiveMeter(), vent: null, bubble: null, lastSegments: 8 };
    const p = this.world.player;
    this.dive.vent = { x: p.x, y: p.y, dir: p.direction };
    this.dive.lastSegments = this.dive.meter.segments;
    this.scene.darkness = { amount: def.dark?.amount ?? 0.9, radius: diveLightRadius(this.state) };
    // Con arte propio (`<protagonista>_dive`: el jugador dentro de la burbuja) no hace falta el efecto.
    if (hasDiveArt(this.world)) return;
    try {
      this.dive.bubble = this.scene.effects.add('zygardeBubble', { target: p, size: 96, dy: 0, alpha: 0.9 });
    } catch (err) {
      console.warn('[zygarde] burbuja', err);
    }
  }

  stopDive() {
    this.dive?.bubble?.remove?.(10);
    this.dive = null;
  }

  /** Recarga la burbuja y fija el punto de regreso. Devuelve true si faltaba resonancia. */
  refillDive(x, y, { silent = false } = {}) {
    if (!this.dive) return false;
    this.dive.vent = { x, y, dir: this.world.player.direction };
    const was = this.dive.meter.refill();
    this.dive.lastSegments = this.dive.meter.segments;
    if (was && !silent) this.burst(this.world.player, 'in', 10);
    return was;
  }

  updateDive() {
    const d = this.dive;
    if (!d || this.world.scriptBusy()) return;
    const p = this.world.player;
    const def = this.world.current.def;
    const deep = !isShallow(def, p.x, p.y);
    const depleted = d.meter.tick(deep);
    if (d.meter.segments < d.lastSegments) engine.audio?.playSE?.('PRSFX- Bubble', { volume: d.meter.segments <= 2 ? 70 : 35 });
    d.lastSegments = d.meter.segments;
    if (depleted) {
      const vent = { ...d.vent };
      this.scene.runScript((ctx) => diveDepleted(ctx, vent), null, 'zygarde:buceo');
    }
  }

  // ------------------------------------------------------------ detección
  actor() {
    const m = mountState(this.world);
    if (m.form && m.char?.visible) return m.char;
    const core = this.world.core;
    return core?.visible ? core : null;
  }

  updateHeartbeat(paused) {
    const w = this.world;
    const p = w.player;
    const actor = this.state.zygardeForm ? this.actor() : null;
    this.near = actor ? nearestCell(w.events, p.x, p.y) : null;
    const interval = this.near ? heartbeatInterval(this.near.dist) : 0;
    if (!interval) {
      this.beatFx?.set({ strength: 0 });
      return;
    }
    if (!this.beatFx) {
      try {
        this.beatFx = this.scene.effects.add('zygardeHeartbeat', { target: actor, dy: 20, strength: 0, fadeIn: 1 });
      } catch (err) {
        console.warn('[zygarde] latido', err);
        return;
      }
    }
    this.beatFx.set({ target: actor });
    if (this.t < this.nextBeat) return;
    this.nextBeat = this.t + interval;
    const strength = heartbeatStrength(this.near.dist);
    this.beatFx.set({ beatAt: this.scene.effects.time, strength });
    if (!paused && !w.scriptBusy()) {
      engine.audio?.playSE?.('Mining ping', { volume: Math.round(20 + strength * 45), pitch: Math.round(90 + strength * 30) });
    }
  }

  /** Hundirse un poco al pisar barro/arena/nieve a pie (lectura del Terreno complicado). */
  updateSinking() {
    const w = this.world;
    const p = w.player;
    if (mountState(w).form || p.jumping()) return;
    const onRough = w.events.some((ev) => ev.def?.type === 'roughTerrain' && ev.x === p.x && ev.y === p.y && ev.page?.through);
    if (onRough) p.bushDepth = Math.max(p.bushDepth || 0, 10);
  }

  // ------------------------------------------------------------ Salto de Convergencia
  /**
   * Superposición del salto; se resuelve al terminar (o al saltarla con A/B si `skippable`). `draw(g, k, t)` (aditivo
   * B21) dibuja una capa propia del guion encima (p. ej. la escritura Unown que pasa de largo).
   */
  playJump({ frames = 1500, skippable = false, draw = null } = {}) {
    return new Promise((resolve) => {
      this.jump?.resolve?.();
      this.jump = { t: 0, frames: Math.max(60, frames), skippable, resolve, done: false, draw: typeof draw === 'function' ? draw : null };
    });
  }

  stopJump() {
    this.jump?.resolve?.();
    this.jump = null;
  }

  updateJump() {
    const j = this.jump;
    if (!j || j.done) return;
    j.t += 1;
    const input = engine.input;
    const skip = j.skippable && j.t > 30 && (input.pressed('A') || input.pressed('B'));
    if (j.t >= j.frames || skip) {
      j.done = true;
      j.t = Math.max(j.t, j.frames * 0.93);
      j.resolve();
    }
  }

  // ------------------------------------------------------------ bucle
  update(_dt, { paused = false } = {}) {
    this.t += 1;
    const w = this.world;
    if (!w?.current) return;
    syncMount(w, { onFormChange: (prev, form) => this.onMountChange(prev, form) });
    if (!paused) {
      const idle = !w.scriptBusy() && !w.player.busy();
      if (idle && engine.input?.pressed?.(MOUNT_BUTTON)) this.toggleMount();
      this.updateDive();
      this.updateJump();
    }
    this.updateHeartbeat(paused);
    this.updateSinking();
  }

  drawUI(g) {
    if (this.dive) drawDiveMeter(g, this.dive.meter, this.t);
    const w = this.world;
    if (this.near && this.state.zygardeAbility('detect') && !w.scriptBusy() && this.near.dist > 0) {
      const p = w.player;
      const cam = this.scene.camera;
      const px = p.realX + 16 - cam.renderX;
      const py = p.realY + 4 + (p.yOffset || 0) - cam.renderY;
      drawDetectArrow(g, px, py, vectorAngle(this.near.dx, this.near.dy), this.t, heartbeatStrength(this.near.dist) || 0.3);
    }
    if (this.jump) {
      const k = Math.min(1, this.jump.t / this.jump.frames);
      drawJumpOverlay(g, k, this.jump.t);
      if (this.jump.draw) {
        try {
          this.jump.draw(g, k, this.jump.t);
        } catch (err) {
          console.warn('[zygarde] capa del salto', err);
          this.jump.draw = null;
        }
      }
    }
  }

  dispose() {
    this.jump?.resolve?.();
    this.jump = null;
    this.dive = null;
    this.beatFx = null;
  }
}
