// Campo de combate en Three.js: fondo de Añil (espejado en los bordes para los movimientos de cámara),
// bases del suelo dibujadas a partir de los colores del fondo, capas de actores y de efectos.
import * as THREE from 'three';
import { engine } from '../../../core/engine.js';
import { rawTexture } from '../../../render/textures.js';
import { backgroundMaterial, flatMaterial, spriteMaterial, GEOM } from './materials.js';
import { Particles } from './particles.js';
import { BattleCamera } from '../camera.js';
import { SCREEN_W, SCREEN_H, BASE_ELLIPSES } from '../layout.js';

const BG_PARALLAX = 0.55;
const TERRAIN_COLORS = {
  Electric: [1, 0.92, 0.3], Grassy: [0.35, 0.85, 0.35], Misty: [1, 0.6, 0.85], Psychic: [0.7, 0.4, 1],
};

/** Color medio de una zona de la imagen (para teñir las bases). */
function averageColor(img, x, y, w, h) {
  try {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(img, x, y, w, h, 0, 0, w, h);
    const d = g.getImageData(0, 0, w, h).data;
    let r = 0; let gg = 0; let b = 0; let n = 0;
    for (let i = 0; i < d.length; i += 16) { r += d[i]; gg += d[i + 1]; b += d[i + 2]; n += 1; }
    return n ? [r / n, gg / n, b / n] : [120, 150, 90];
  } catch (err) {
    console.warn('[combate] No se pudo muestrear el fondo', err);
    return [120, 150, 90];
  }
}

const hex = (c) => `rgb(${c.map((v) => Math.max(0, Math.min(255, Math.round(v)))).join(',')})`;
const mix = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);

/** Textura de base elíptica al estilo BW: plataforma con borde claro y sombra interior (pixelada ×2). */
function baseTexture(color, rx, ry) {
  const w = rx;
  const h = ry;
  const c = document.createElement('canvas');
  c.width = w * 2;
  c.height = h * 2;
  const g = c.getContext('2d');
  const dark = mix(color, [0, 0, 0], 0.28);
  const mid = mix(color, [0, 0, 0], 0.12);
  const light = mix(color, [255, 255, 255], 0.42);
  const rim = mix(color, [255, 255, 255], 0.22);
  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const nx = (px + 0.5 - w / 2) / (w / 2);
      const ny = (py + 0.5 - h / 2) / (h / 2);
      const d = nx * nx + ny * ny;
      if (d > 1) continue;
      let col;
      if (d > 0.86) col = ny < 0 ? light : dark;
      else if (d > 0.72) col = ny < -0.1 ? rim : mid;
      else col = ny > 0.35 ? mid : mix(color, [0, 0, 0], 0.06);
      g.fillStyle = hex(col);
      g.fillRect(px * 2, py * 2, 2, 2);
    }
  }
  return rawTexture(c);
}

export class BattleField {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera3 = new THREE.OrthographicCamera(0, SCREEN_W, 0, -SCREEN_H, -100, 100);
    this.cam = new BattleCamera();
    this.bgLayer = new THREE.Group();
    this.fieldLayer = new THREE.Group();
    this.scene.add(this.bgLayer, this.fieldLayer);
    this.particles = new Particles(this.fieldLayer);
    this.bgMesh = null;
    this.bases = [];
    this.terrainMesh = new THREE.Mesh(GEOM.center, flatMaterial([1, 1, 1], 0));
    this.terrainMesh.position.set(SCREEN_W / 2, 260, 0);
    this.terrainMesh.scale.set(SCREEN_W * 3, 240, 1);
    this.terrainMesh.renderOrder = 5;
    this.terrainMesh.frustumCulled = false;
    this.fieldLayer.add(this.terrainMesh);
    this.terrain = 'None';
    this.ownedTextures = [];
    this.frame = 0;
    this.baseOffsets = { 0: { x: 0, y: 0 }, 1: { x: 0, y: 0 } };
    this.bgOffset = 0;
  }

  /** Carga el fondo (Graphics/Battlebacks) y genera las bases. */
  async load(backdrop) {
    let img = await engine.assets.tryImage(engine.assets.anil(backdrop.file));
    if (!img) {
      console.warn(`[combate] Fondo no encontrado (${backdrop.file}); se usa Pradera.`);
      img = await engine.assets.tryImage(engine.assets.anil('Graphics/Battlebacks/Pradera_bg.png'));
    }
    if (img) {
      const tex = rawTexture(img);
      tex.wrapS = THREE.MirroredRepeatWrapping;
      tex.wrapT = THREE.MirroredRepeatWrapping;
      this.ownedTextures.push(tex);
      const geo = new THREE.PlaneGeometry(1, 1);
      // UV de -1 a 2 (3×3 copias espejadas). En las capas y hacia abajo, y = -0.5 es el borde superior,
      // que en PlaneGeometry tiene uv.y = 0; con flipY = false, v = 0 es la fila superior de la imagen.
      const uv = geo.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 3 - 1, uv.getY(i) * 3 - 1);
      this.bgMesh = new THREE.Mesh(geo, backgroundMaterial(tex));
      this.bgMesh.scale.set(SCREEN_W * 3, SCREEN_H * 3, 1);
      this.bgMesh.position.set(SCREEN_W / 2, SCREEN_H / 2, 0);
      this.bgMesh.renderOrder = 0;
      this.bgMesh.frustumCulled = false;
      this.bgLayer.add(this.bgMesh);
      if (backdrop.night) this.bgMesh.material.uniforms.uTone.value.set(-0.22, -0.2, -0.04);
    }
    for (const side of [0, 1]) {
      const e = BASE_ELLIPSES[side];
      const color = img ? averageColor(img, Math.max(0, e.cx - e.rx), Math.max(0, Math.min(img.height - 8, e.cy - e.ry)), Math.min(img.width, e.rx * 2), Math.min(e.ry * 2, 60)) : [120, 150, 90];
      const tex = baseTexture(backdrop.night ? mix(color, [20, 30, 70], 0.3) : color, e.rx, e.ry);
      this.ownedTextures.push(tex);
      const m = new THREE.Mesh(GEOM.center, spriteMaterial(tex));
      m.material.uniforms.uOpacity.value = 0.78;
      m.scale.set(e.rx * 2, e.ry * 2, 1);
      m.position.set(e.cx, e.cy, 0);
      m.renderOrder = 8;
      m.frustumCulled = false;
      this.fieldLayer.add(m);
      this.bases[side] = m;
    }
  }

  setTerrain(t) {
    this.terrain = t || 'None';
  }

  /** Desplaza una base (animación de entrada). */
  setBaseOffset(side, x, y = 0) {
    this.baseOffsets[side] = { x, y };
  }

  update() {
    this.frame += 1;
    this.cam.update();
    this.cam.apply(this.bgLayer, BG_PARALLAX);
    this.cam.apply(this.fieldLayer, 1);
    if (this.bgMesh) this.bgMesh.position.x = SCREEN_W / 2 + this.bgOffset;
    for (const side of [0, 1]) {
      const m = this.bases[side];
      if (!m) continue;
      const e = BASE_ELLIPSES[side];
      m.position.set(e.cx + this.baseOffsets[side].x, e.cy + this.baseOffsets[side].y, 0);
    }
    const tc = TERRAIN_COLORS[this.terrain];
    const u = this.terrainMesh.material.uniforms;
    const targetA = tc ? 0.16 + 0.04 * Math.sin(this.frame / 30) : 0;
    u.uAlpha.value += (targetA - u.uAlpha.value) * 0.08;
    if (tc) u.uColor.value.set(...tc);
    this.terrainMesh.visible = u.uAlpha.value > 0.005;
    this.particles.update();
  }

  render(renderer) {
    renderer.render(this.scene, this.camera3);
  }

  dispose() {
    this.particles.dispose();
    this.scene.traverse((o) => { if (o.material) o.material.dispose(); });
    for (const t of this.ownedTextures) t.dispose();
    this.ownedTextures = [];
  }
}
