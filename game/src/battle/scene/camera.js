// Cámara del combate al estilo de Negro 2/Blanco 2 (emulada en 2D): encuadre (centro + zoom) que se
// interpola suavemente, balanceo en reposo, sacudidas y paralaje (el fondo se mueve menos que el campo).
// La matemática es PURA (se prueba en Node); `apply` escribe la transformación en grupos de Three.js.
//
// DECIDIDO (autor, 25-09-2026): el combate se ve como en Añil. Los fondos (512×384) y los sprites (×2/×3) de Añil
// solo son nítidos a escala entera: un zoom de 1,1–1,4 con muestreo al vecino más cercano repartía los píxeles de
// forma irregular (fondo «muy pixelado», entrenadores «cuadrados»). La cámara conserva paneos, balanceo y
// sacudidas, siempre con zoom 1 y desplazamientos enteros (`pixelPerfect`).
import { SCREEN_W, SCREEN_H } from './layout.js';

export const CAMERA_PRESETS = Object.freeze({
  default: { x: SCREEN_W / 2, y: SCREEN_H / 2, zoom: 1 },
  introFoe: { x: SCREEN_W / 2, y: SCREEN_H / 2, zoom: 1 },
  introTrainer: { x: SCREEN_W / 2, y: SCREEN_H / 2, zoom: 1 },
  focusFoe: { x: 300, y: 176, zoom: 1 },
  focusPlayer: { x: 220, y: 206, zoom: 1 },
  wide: { x: SCREEN_W / 2, y: SCREEN_H / 2 + 6, zoom: 1 },
});

/**
 * Transformación de una capa con factor de paralaje `f` (1 = campo, <1 = fondo lejano):
 * pantalla = mundo × escala + (tx, ty).
 */
export function layerTransform(view, f = 1) {
  const cx = SCREEN_W / 2 + (view.x - SCREEN_W / 2) * f;
  const cy = SCREEN_H / 2 + (view.y - SCREEN_H / 2) * f;
  const scale = 1 + (view.zoom - 1) * f;
  return { scale, tx: SCREEN_W / 2 - cx * scale, ty: SCREEN_H / 2 - cy * scale };
}

/** Punto del mundo (campo) → pantalla con la vista dada. */
export function worldToScreen(view, x, y, f = 1) {
  const t = layerTransform(view, f);
  return { x: x * t.scale + t.tx, y: y * t.scale + t.ty };
}

export class BattleCamera {
  constructor() {
    this.view = { ...CAMERA_PRESETS.default }; // encuadre actual
    this.target = { ...CAMERA_PRESETS.default }; // encuadre objetivo
    this.speed = 0.08; // fracción por fotograma hacia el objetivo
    this.idle = false; // balanceo suave de reposo
    this.idleT = 0;
    this.shakeAmp = 0;
    this.shakeFrames = 0;
    this.shakeT = 0;
    this.offset = { x: 0, y: 0 };
    this.pixelPerfect = true; // zoom siempre 1 (ver cabecera)
  }

  /** Cambia el objetivo. `speed` 0..1 (1 = instantáneo). */
  to(preset, speed = 0.08) {
    const p = typeof preset === 'string' ? CAMERA_PRESETS[preset] || CAMERA_PRESETS.default : preset;
    this.target = { x: p.x, y: p.y, zoom: this.pixelPerfect ? 1 : p.zoom };
    this.speed = speed;
  }

  /** Encuadre inmediato. */
  snap(preset) {
    this.to(preset, 1);
    this.view = { ...this.target };
  }

  /** Enfoca el punto medio entre dos posiciones con un zoom. */
  focusBetween(a, b, zoom = 1.1, bias = 0.6) {
    this.to({ x: a.x + (b.x - a.x) * bias, y: a.y + (b.y - a.y) * bias, zoom }, 0.1);
  }

  shake(amp = 6, frames = 16) {
    this.shakeAmp = Math.max(this.shakeAmp, amp);
    this.shakeFrames = Math.max(this.shakeFrames, frames);
    this.shakeT = 0;
  }

  get settled() {
    const v = this.view;
    const t = this.target;
    return Math.abs(v.x - t.x) < 0.5 && Math.abs(v.y - t.y) < 0.5 && Math.abs(v.zoom - t.zoom) < 0.002;
  }

  update() {
    const k = this.speed;
    const v = this.view;
    const t = this.target;
    v.x += (t.x - v.x) * k;
    v.y += (t.y - v.y) * k;
    v.zoom += (t.zoom - v.zoom) * k;
    if (this.settled) Object.assign(v, t);
    this.idleT = this.idle ? this.idleT + 1 : 0;
    let ox = 0;
    let oy = 0;
    if (this.idle) {
      ox = Math.sin(this.idleT / 150) * 6;
      oy = Math.sin(this.idleT / 110) * 3;
    }
    if (this.shakeFrames > 0) {
      this.shakeT += 1;
      const left = Math.max(0, 1 - this.shakeT / this.shakeFrames);
      ox += Math.sin(this.shakeT * 2.1) * this.shakeAmp * left;
      oy += Math.cos(this.shakeT * 2.9) * this.shakeAmp * 0.5 * left;
      if (this.shakeT >= this.shakeFrames) { this.shakeFrames = 0; this.shakeAmp = 0; }
    }
    this.offset = { x: ox, y: oy };
  }

  /** Vista efectiva (con balanceo y sacudida). */
  current() {
    return { x: this.view.x + this.offset.x, y: this.view.y + this.offset.y, zoom: this.view.zoom };
  }

  /** Escribe la transformación en un grupo Three.js (escala y negativa: y hacia abajo). */
  apply(group, f = 1) {
    const tr = layerTransform(this.current(), f);
    const snapPx = Math.abs(tr.scale - 1) < 1e-4;
    group.position.set(snapPx ? Math.round(tr.tx) : tr.tx, snapPx ? -Math.round(tr.ty) : -tr.ty, 0);
    group.scale.set(tr.scale, -tr.scale, 1);
  }
}
