// Actores del campo de combate: sprite animado de Pokémon (con sombra) y sprite de entrenador.
// Las tiras animadas de Añil (frames cuadrados en horizontal) pueden medir >8192 px de ancho: se
// reempaquetan en una rejilla para no superar el tamaño máximo de textura de WebGL.
import * as THREE from 'three';
import { engine } from '../../../core/engine.js';
import { rawTexture } from '../../../render/textures.js';
import { spriteMaterial, GEOM } from './materials.js';
import {
  battlerPosition, spriteScale, speciesMetrics, spriteOffset, shadowPlacement, spriteFrameTicks, SHADOW_OPACITY,
  stripFrames, spriteFileCandidates,
} from '../layout.js';

const ATLAS_MAX = 4096;

/**
 * Imagen → { tex, frames, fw, fh, cols, rows } (rejilla si la tira es demasiado ancha). Sin `frameW`, los frames
 * se deducen como DeluxeBitmapWrapper (tira de frames cuadrados si el ancho supera el doble del alto).
 */
export function stripAtlas(img, frameW = null) {
  const auto = frameW ? null : stripFrames(img.width, img.height);
  const fs = frameW || auto.fw;
  const fh = img.height;
  const frames = auto ? auto.frames : Math.max(1, Math.round(img.width / fs));
  if (img.width <= ATLAS_MAX) {
    return { tex: rawTexture(img), frames, fw: fs, fh, cols: frames, rows: 1, w: img.width, h: fh };
  }
  const cols = Math.max(1, Math.floor(ATLAS_MAX / fs));
  const rows = Math.ceil(frames / cols);
  const c = document.createElement('canvas');
  c.width = cols * fs;
  c.height = rows * fh;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  for (let i = 0; i < frames; i++) {
    g.drawImage(img, i * fs, 0, fs, fh, (i % cols) * fs, Math.floor(i / cols) * fh, fs, fh);
  }
  return { tex: rawTexture(c), frames, fw: fs, fh, cols, rows, w: c.width, h: c.height };
}

/** Rectángulo UV del frame i de un atlas. */
export function atlasRect(a, i) {
  const f = ((i % a.frames) + a.frames) % a.frames;
  const x = (f % a.cols) * a.fw;
  const y = Math.floor(f / a.cols) * a.fh;
  return [x / a.w, y / a.h, (x + a.fw) / a.w, (y + a.fh) / a.h];
}

function spriteCandidates(view, back) {
  const req = { species: view.species, form: view.form || 0, female: view.gender === 'F', shiny: Boolean(view.shiny) };
  return spriteFileCandidates(req, back ? 'Back' : 'Front').map((p) => engine.assets.anil(p));
}

/** Primera imagen existente del sprite (espalda → frente como último recurso). */
export async function loadPokemonImage(view, back) {
  const lists = back ? [spriteCandidates(view, true), spriteCandidates(view, false)] : [spriteCandidates(view, false)];
  for (const urls of lists) {
    for (const url of urls) {
      const im = await engine.assets.tryImage(url);
      if (im) return im;
    }
  }
  return null;
}

/** Sprite de Pokémon en combate (BattlerSprite + BattlerShadowSprite de Añil). */
export class BattlerSprite {
  constructor(group, index, sideSize) {
    this.group = group;
    this.index = index;
    this.sideSize = sideSize;
    this.mesh = new THREE.Mesh(GEOM.bottom, spriteMaterial());
    this.shadow = new THREE.Mesh(GEOM.center, spriteMaterial());
    this.shadow.material.uniforms.uSilhouette.value = 1;
    for (const m of [this.mesh, this.shadow]) { m.frustumCulled = false; m.visible = false; group.add(m); }
    this.atlas = null;
    this.view = null;
    this.visible = false;
    this.opacity = 1;
    this.offX = 0;
    this.offY = 0;
    this.scaleX = 1;
    this.scaleY = 1;
    this.rot = 0;
    this.color = [1, 1, 1, 0];
    this.tone = [0, 0, 0];
    this.clipV = 1.01;
    this.stripe = null; // { color: [r,g,b] 0..1, amount, dir }
    this.selected = 0; // 1 = elige comando (bamboleo), 2 = objetivo (parpadeo)
    this.shadowVisible = true;
    this.frame = 0;
    this.tick = 0;
    this.paused = false;
    this.loadToken = 0;
    this.ownedTextures = [];
  }

  get side() { return this.index & 1; }
  get back() { return this.side === 0; }
  get scale() { return spriteScale(this.index, this.metrics); }
  get width() { return this.atlas ? this.atlas.fw * this.scale : 96; }
  get height() { return this.atlas ? this.atlas.fh * this.scale : 96; }
  /** Alto del bitmap de trabajo de DBK (cuadrado del ancho del frame): lo usan la sombra y las animaciones. */
  get squareHeight() { return this.atlas ? this.atlas.fw * this.scale : 96; }

  /** Posición base (centro inferior con métricas). */
  get anchor() {
    const p = battlerPosition(this.index, this.sideSize);
    const off = spriteOffset(this.metrics, this.index);
    return { x: p.x + off.dx, y: p.y + off.dy };
  }

  /** Centro visual actual (para efectos). */
  get center() {
    const a = this.anchor;
    return { x: a.x + this.offX, y: a.y + this.offY - this.height * 0.45 * this.scaleY };
  }

  /** Carga el sprite para una BattlerView (especie, forma, variocolor). */
  async setPokemon(view) {
    const token = ++this.loadToken;
    this.view = view;
    this.metrics = speciesMetrics(engine.data, view.species, view.form, view.gender === 'F');
    this.ticks = spriteFrameTicks(this.metrics, this.back);
    const img = await loadPokemonImage(view, this.back);
    if (token !== this.loadToken) return;
    if (!img) {
      console.warn(`[combate] Sin sprite para ${view.species}`);
      this.atlas = null;
      return;
    }
    const atlas = stripAtlas(img);
    this.ownedTextures.push(atlas.tex);
    this.atlas = atlas;
    this.frame = 0;
    this.tick = 0;
    for (const m of [this.mesh, this.shadow]) m.material.uniforms.map.value = atlas.tex;
  }

  /** Reinicia los efectos visuales temporales. */
  resetFx() {
    this.opacity = 1;
    this.offX = 0; this.offY = 0;
    this.scaleX = 1; this.scaleY = 1; this.rot = 0;
    this.color = [1, 1, 1, 0];
    this.tone = [0, 0, 0];
    this.clipV = 1.01;
    this.stripe = null;
  }

  update(frame) {
    if (this.atlas && this.ticks > 0 && !this.paused) {
      this.tick += 1;
      if (this.tick >= this.ticks) { this.tick = 0; this.frame = (this.frame + 1) % this.atlas.frames; }
    }
    const show = this.visible && Boolean(this.atlas) && this.opacity > 0;
    let bob = 0;
    if (this.selected === 1) {
      const ph = Math.floor(((frame % 36) / 36) * 4);
      bob = ph === 1 ? 2 : ph === 3 ? -2 : 0;
    }
    const blinkHidden = this.selected === 2 && Math.floor(((frame % 18) / 18) * 3) === 0;
    this.mesh.visible = show && !blinkHidden;
    const shadowShow = show && this.shadowVisible;
    if (!show) { this.shadow.visible = false; return; }
    const a = this.anchor;
    const rect = atlasRect(this.atlas, this.frame);
    const u = this.mesh.material.uniforms;
    u.uRect.value.set(...rect);
    u.uOpacity.value = this.opacity;
    u.uColor.value.set(...this.color);
    u.uTone.value.set(...this.tone);
    u.uClipV.value = this.clipV;
    if (this.stripe) {
      u.uStripe.value.set(this.stripe.color[0], this.stripe.color[1], this.stripe.color[2], this.stripe.amount);
      u.uStripeT.value = (frame / 20) * (this.stripe.dir || 1);
    } else u.uStripe.value.set(0, 0, 0, 0);
    this.mesh.position.set(Math.round(a.x + this.offX), Math.round(a.y + this.offY + bob), 0);
    this.mesh.scale.set(this.width * this.scaleX, this.height * this.scaleY, 1);
    this.mesh.rotation.z = this.rot;
    // Sombra: silueta aplastada (no sigue el bamboleo ni los saltos verticales)
    const sh = shadowPlacement(this.metrics, this.index, this.squareHeight);
    this.shadow.visible = shadowShow && sh.visible;
    if (this.shadow.visible) {
      const base = battlerPosition(this.index, this.sideSize);
      const su = this.shadow.material.uniforms;
      su.uRect.value.set(...rect);
      su.uOpacity.value = SHADOW_OPACITY * this.opacity * Math.min(1, this.scaleX);
      su.uClipV.value = 1.01;
      this.shadow.position.set(Math.round(base.x + sh.dx + this.offX), Math.round(base.y + sh.dy), 0);
      this.shadow.scale.set(this.width * sh.zoomX * this.scaleX, this.height * sh.zoomY * this.scaleY, 1);
    }
    this.mesh.renderOrder = this.back ? 60 + this.index : 30 + (3 - this.index);
    this.shadow.renderOrder = 12;
  }

  dispose() {
    for (const m of [this.mesh, this.shadow]) { m.removeFromParent(); m.material.dispose(); }
    for (const t of this.ownedTextures) t.dispose();
    this.ownedTextures = [];
  }
}

/** Sprite de entrenador (frontal de 1 frame o espalda de 5 frames de lanzamiento). */
export class TrainerSprite {
  constructor(group, { side, x, y }) {
    this.group = group;
    this.side = side;
    this.baseX = x;
    this.baseY = y;
    this.offX = 0;
    this.offY = 0;
    this.opacity = 1;
    this.frame = 0;
    this.visible = false;
    this.atlas = null;
    this.color = [1, 1, 1, 0];
    this.mesh = new THREE.Mesh(GEOM.bottom, spriteMaterial());
    this.mesh.frustumCulled = false;
    this.mesh.visible = false;
    group.add(this.mesh);
  }

  /** Carga el sprite: url de imagen y número de frames horizontales (1 o 5). */
  async load(url, frames = 1) {
    const img = url ? await engine.assets.tryImage(url) : null;
    if (!img) return false;
    this.atlas = stripAtlas(img, Math.floor(img.width / Math.max(1, frames)));
    this.mesh.material.uniforms.map.value = this.atlas.tex;
    return true;
  }

  update() {
    const show = this.visible && Boolean(this.atlas) && this.opacity > 0;
    this.mesh.visible = show;
    if (!show) return;
    const u = this.mesh.material.uniforms;
    u.uRect.value.set(...atlasRect(this.atlas, this.frame));
    u.uOpacity.value = this.opacity;
    u.uColor.value.set(...this.color);
    this.mesh.position.set(Math.round(this.baseX + this.offX), Math.round(this.baseY + this.offY), 0);
    this.mesh.scale.set(this.atlas.fw, this.atlas.fh, 1);
    this.mesh.renderOrder = this.side === 0 ? 70 : 20;
  }

  dispose() {
    this.mesh.removeFromParent();
    this.mesh.material.dispose();
    this.atlas?.tex.dispose();
  }
}
