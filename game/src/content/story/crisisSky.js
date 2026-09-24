// Capa de cielo de la crisis en el mapa (docs/CAMPANA.md §3.1): la instancia MapScene y la sincroniza cada
// fotograma. Usa los efectos de render/effects.js (aurora, luna, grietas) y aporta un tono que se suma al de
// día/noche. Independiente del reloj (TEC-06): la fase sale de los flags (content/story/crisis.js).
// Solo en mapas exteriores (def.outdoor) salvo `crisis: false`. Los destellos/temblores ambientales solo
// se lanzan con el jugador libre (sin guion, menú ni combate) y nunca durante el Bloque 1.
import { engine } from '../../core/engine.js';
import { crisisPhase, crisisIntensity, crisisLayer, crisisTone, crisisAppliesTo } from './crisis.js';
import { createRng } from '../../world/prng.js';

const FRAMES_PER_SECOND = 60;
/** Durante el Bloque 1 (hasta salir del pueblo) no hay destellos ni temblores ambientales. */
const AMBIENT_GATE_FLAG = 'b01_left_town';

export class CrisisSky {
  constructor(scene) {
    this.scene = scene;
    this.key = null;
    this.handles = [];
    this.layer = null;
    this.intensity = 1;
    this.active = false;
    this.nextAmbient = 0;
    this.frame = 0;
  }

  /** Reconstruye los efectos si cambió el mapa o la fase. Barato si no hay cambios. */
  sync() {
    const s = this.scene;
    const entry = s.world?.current;
    if (!entry || !s.state) return;
    const def = entry.def;
    const phase = crisisPhase(s.state);
    const intensity = crisisIntensity(s.state, phase);
    const applies = crisisAppliesTo(def);
    const key = `${entry.id}|${phase}|${intensity}|${applies}`;
    if (key === this.key) return;
    this.key = key;
    // Cambio de fase en el mismo mapa: fundido lento; cambio de mapa: fuera ya (las grietas son del mapa).
    this.clearHandles(this.mapId === entry.id ? 40 : 1);
    this.mapId = entry.id;
    this.active = applies;
    this.phase = phase;
    this.intensity = intensity;
    this.layer = applies ? crisisLayer(phase) : null;
    this.nextAmbient = 0;
    if (!applies) return;
    try {
      this.spawn(def, entry.id);
    } catch (err) {
      console.error('[crisis] No se pudo crear la capa de cielo', err);
    }
  }

  spawn(def, mapId) {
    const lay = this.layer;
    const fx = this.scene.effects;
    const k = this.intensity;
    if (lay.aurora) this.handles.push(fx.add('aurora', { color: lay.aurora.color, alpha: (lay.aurora.alpha ?? 1) * k, fadeIn: 60 }));
    if (lay.moon) this.handles.push(fx.add('moon', { ...lay.moon, alpha: (lay.moon.alpha ?? 1) * k, fadeIn: 60 }));
    if (lay.cracks > 0) {
      const rng = createRng(`crisis:${mapId}`);
      const w = Math.max(4, def.width || 16);
      const h = Math.max(4, def.height || 12);
      for (let i = 0; i < lay.cracks; i++) {
        this.handles.push(fx.add('cracks', {
          x: Math.floor(2 + rng() * (w - 4)), y: Math.floor(2 + rng() * (h - 4)),
          length: 70 + Math.floor(rng() * 60), branches: 2 + Math.floor(rng() * 2), seed: Math.floor(rng() * 1000),
          color: [190, 140, 255], alpha: 0.75 * k, fadeIn: 60,
        }));
      }
    }
  }

  /** Tono de la capa (o null fuera de exteriores). */
  tone() {
    if (!this.active || !this.layer) return null;
    return crisisTone(this.layer, this.scene.state.data.clock.minutes, this.intensity);
  }

  /** Destellos y temblores ambientales (fases 0 y 1). Llamar desde update() del mapa. */
  update() {
    this.frame += 1;
    const amb = this.active ? this.layer?.ambient : null;
    if (!amb) return;
    const s = this.scene;
    if (!s.state.flag(AMBIENT_GATE_FLAG)) return;
    if (this.nextAmbient === 0) { this.schedule(amb); return; }
    if (this.frame < this.nextAmbient) return;
    this.schedule(amb);
    const busy = s.world?.scriptBusy?.() || s.inBattle || s.menuOpen || s.transferring;
    if (busy) return;
    if (amb.night && s.state.isDay()) return;
    this.playAmbient(amb);
  }

  schedule(amb) {
    const [a, b] = amb.every;
    this.nextAmbient = this.frame + Math.round((a + Math.random() * (b - a)) * FRAMES_PER_SECOND);
  }

  playAmbient(amb) {
    const s = this.scene;
    try {
      s.fx.flashScreen(amb.color, Math.round(amb.alpha * this.intensity), amb.kind === 'tremor' ? 30 : 14);
      if (amb.kind === 'tremor') s.camera.shake(2, 6, 36);
      else engine.audio?.playSE?.('Thunder4', { volume: 45 });
    } catch (err) {
      console.warn('[crisis] efecto ambiental', err);
    }
  }

  clearHandles(frames = 30) {
    for (const h of this.handles) {
      try { h.remove(frames); } catch (err) { console.warn('[crisis] retirar efecto', err); }
    }
    this.handles = [];
  }

  dispose() {
    this.clearHandles(1);
    this.key = null;
  }
}
