// Piezas gráficas (Three.js) para cinemáticas. Todas se añaden a un grupo con coordenadas en píxeles y
// hacia abajo (raíz con scale.y = -1, ver docs/ARCHITECTURE.md §1): el grupo `fxGroup` del WorldView del mapa,
// la raíz de efectos luminosos (`effects.worldRoot`) o la raíz del escenario del prólogo.
//
//   SpriteStrip   sprite animado de tira horizontal (Graphics/Pokemon/Front|Back) u hoja fija; ancla abajo-centro
//                 o centro; opacidad, tinte (mezcla de color), recorte desde abajo (emerger), espejo y escala.
//   ParticleField partículas aditivas (THREE.Points): hexágonos/puntos con velocidad, arrastre, gravedad,
//                 atracción a un destino y vida.
//   GlowQuad      halo radial aditivo (luz del portal, núcleos).
//   Beam          haz entre dos puntos (ataques).
//   Ring          onda expansiva (anillo).
//   Rift          grieta horizontal que se abre (Giratina rasga el espacio).
import * as THREE from 'three';
import { spriteMaterial, anchoredQuad } from '../../render/characterSprite.js';
import { loadRawTexture, rawTexture, makeCanvas } from '../../render/textures.js';

const ANCHOR_BOTTOM = anchoredQuad();
const ANCHOR_CENTER = (() => {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-0.5, -0.5, 0, 0.5, -0.5, 0, -0.5, 0.5, 0, 0.5, 0.5, 0]), 3));
  g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), 2));
  g.setIndex([0, 2, 1, 1, 2, 3]);
  return g;
})();

const rgb = (c) => (Array.isArray(c) ? new THREE.Color(c[0] / 255, c[1] / 255, c[2] / 255) : new THREE.Color(c ?? 0xffffff));

// ───────────────────────────── SpriteStrip ─────────────────────────────

export class SpriteStrip {
  /**
   * @param {THREE.Object3D} parent
   * @param {object} o url (obligatorio), frameW/frameH (por defecto cuadrados = alto de la imagen), scale (2),
   *   ticks (fotogramas por cuadro), anchor ('bottom'|'center'), order (renderOrder), frame (fijo), row (fila)
   */
  constructor(parent, o) {
    if (!o?.url) throw new Error('SpriteStrip: falta url');
    this.o = { scale: 2, ticks: 2, anchor: 'bottom', order: 0, row: 0, ...o };
    this.material = spriteMaterial();
    this.mesh = new THREE.Mesh(this.o.anchor === 'center' ? ANCHOR_CENTER : ANCHOR_BOTTOM, this.material);
    this.mesh.frustumCulled = false;
    this.mesh.visible = false;
    this.mesh.renderOrder = this.o.order;
    parent.add(this.mesh);
    this.x = 0;
    this.y = 0;
    this.opacity = 1;
    this.scaleMul = 1;
    this.crop = 1; // fracción visible desde arriba (1 = entero)
    this.flip = false;
    this.tint = [0, 0, 0, 0]; // r, g, b (0..1), mezcla
    this.jitter = 0; // temblor en px
    this.t = 0;
    this.speed = 1; // multiplicador de la animación
    this.ready = false;
    this.frames = 1;
  }

  async load() {
    let tex = await loadRawTexture(this.o.url);
    const img = tex.image;
    this.fw = this.o.frameW || img.height;
    this.fh = this.o.frameH || img.height;
    const stripCols = Math.max(1, Math.floor(img.width / this.fw));
    this.frames = this.o.frames || stripCols;
    this.cols = stripCols;
    this.gridRows = 1;
    if (img.width > MAX_TEX && this.fh === img.height) {
      // Las tiras largas (p. ej. DIALGA: 137 fotogramas, 12056 px) superan el tamaño máximo de textura de
      // muchas GPU: se reempaquetan en rejilla para no perder píxeles al redimensionar.
      tex = repackStrip(img, this.fw, this.fh, this.frames);
      this.cols = Math.floor(MAX_TEX / this.fw);
      this.gridRows = Math.ceil(this.frames / this.cols);
      this.ownTex = tex;
    }
    this.tex = tex;
    this.texW = tex.image.width;
    this.texH = tex.image.height;
    this.material.uniforms.map.value = tex;
    this.material.uniforms.uFrameH.value = this.fh;
    this.ready = true;
    this.update(0);
    return this;
  }

  get width() { return (this.fw || 0) * this.o.scale * this.scaleMul; }
  get height() { return (this.fh || 0) * this.o.scale * this.scaleMul; }

  /** Avanza la animación `steps` fotogramas y vuelca el estado al mesh. */
  update(steps = 1) {
    if (!this.ready) return;
    this.t += steps * this.speed;
    const frame = this.o.frame ?? Math.floor(this.t / this.o.ticks) % this.frames;
    const col = frame % this.cols;
    const row = this.gridRows > 1 ? Math.floor(frame / this.cols) : this.o.row;
    const u0 = (col * this.fw) / this.texW;
    const u1 = ((col + 1) * this.fw) / this.texW;
    const v0 = (row * this.fh) / this.texH;
    const k = Math.max(0, Math.min(1, this.crop));
    const v1 = v0 + (this.fh * k) / this.texH;
    const u = this.material.uniforms;
    u.uRect.value.set(this.flip ? u1 : u0, v0, this.flip ? u0 : u1, v1);
    u.uOpacity.value = Math.max(0, Math.min(1, this.opacity));
    u.uColor.value.set(this.tint[0], this.tint[1], this.tint[2], this.tint[3]);
    const s = this.o.scale * this.scaleMul;
    this.mesh.scale.set(this.fw * s, this.fh * s * k, 1);
    const jx = this.jitter ? Math.round((Math.random() - 0.5) * 2 * this.jitter) : 0;
    const jy = this.jitter ? Math.round((Math.random() - 0.5) * 2 * this.jitter) : 0;
    this.mesh.position.set(Math.round(this.x) + jx, Math.round(this.y) + jy, 0);
    this.mesh.visible = this.opacity > 0.003 && k > 0.001;
  }

  dispose() {
    this.mesh.removeFromParent();
    this.material.dispose();
    this.ownTex?.dispose();
  }
}

const MAX_TEX = 4096;

/** Reparte los fotogramas de una tira horizontal en una rejilla de ≤ MAX_TEX px de ancho. */
function repackStrip(img, fw, fh, frames) {
  const cols = Math.floor(MAX_TEX / fw);
  const rows = Math.ceil(frames / cols);
  const { canvas, g } = makeCanvas(cols * fw, rows * fh);
  for (let f = 0; f < frames; f++) {
    g.drawImage(img, f * fw, 0, fw, fh, (f % cols) * fw, Math.floor(f / cols) * fh, fw, fh);
  }
  return rawTexture(canvas);
}

// ───────────────────────────── ParticleField ─────────────────────────────

const POINT_VERT = /* glsl */`
attribute float aSize;
attribute vec4 aColor;
varying vec4 vColor;
void main() {
  vColor = aColor;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize;
}`;

const POINT_FRAG = /* glsl */`
precision highp float;
uniform int uShape;
varying vec4 vColor;
float hexDist(vec2 p) { p = abs(p); return max(dot(p, normalize(vec2(1.0, 1.7320508))), p.x); }
void main() {
  vec2 p = gl_PointCoord * 2.0 - 1.0;
  float d = uShape == 1 ? hexDist(p) * 1.15 : (uShape == 2 ? max(abs(p.x), abs(p.y)) : length(p));
  if (d > 1.0) discard;
  float core = 1.0 - smoothstep(0.15, 0.55, d);
  float halo = (1.0 - d) * 0.55;
  float a = floor((core + halo) * 4.0 + 0.5) / 4.0;
  vec3 c = mix(vColor.rgb, vec3(1.0), core * 0.22);
  gl_FragColor = vec4(c * a * vColor.a, 1.0);
}`;

const SHAPES = { round: 0, hex: 1, square: 2 };

export class ParticleField {
  /** @param {THREE.Object3D} parent @param {{ max?: number, shape?: 'round'|'hex'|'square', order?: number }} o */
  constructor(parent, { max = 600, shape = 'hex', order = 0 } = {}) {
    this.max = max;
    this.list = [];
    this.pos = new Float32Array(max * 3);
    this.size = new Float32Array(max);
    this.color = new Float32Array(max * 4);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aSize', new THREE.BufferAttribute(this.size, 1).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aColor', new THREE.BufferAttribute(this.color, 4).setUsage(THREE.DynamicDrawUsage));
    g.setDrawRange(0, 0);
    this.geometry = g;
    this.material = new THREE.ShaderMaterial({
      vertexShader: POINT_VERT,
      fragmentShader: POINT_FRAG,
      uniforms: { uShape: { value: SHAPES[shape] ?? 1 } },
      transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    this.points = new THREE.Points(g, this.material);
    this.points.frustumCulled = false;
    this.points.renderOrder = order;
    parent.add(this.points);
  }

  /**
   * Añade una partícula. p: { x, y, vx, vy, ax, ay, drag, size, grow, life, color:[r,g,b], alpha,
   *   target:{ x, y, k } (atracción), fadeIn, onDeath(p) }
   */
  spawn(p) {
    if (this.list.length >= this.max) this.list.shift();
    const q = {
      vx: 0, vy: 0, ax: 0, ay: 0, drag: 1, size: 6, grow: 0, life: 60, age: 0, alpha: 1, fadeIn: 0,
      color: [185, 255, 102], ...p,
    };
    this.list.push(q);
    return q;
  }

  get count() { return this.list.length; }

  update(steps = 1) {
    for (let s = 0; s < steps; s++) {
      for (const p of this.list) {
        if (p.target) {
          p.vx += (p.target.x - p.x) * (p.target.k ?? 0.01);
          p.vy += (p.target.y - p.y) * (p.target.k ?? 0.01);
        }
        p.vx = (p.vx + p.ax) * p.drag;
        p.vy = (p.vy + p.ay) * p.drag;
        p.x += p.vx;
        p.y += p.vy;
        p.size = Math.max(0, p.size + p.grow);
        p.age += 1;
      }
      const dead = this.list.filter((p) => p.age >= p.life || (p.target?.kill && Math.hypot(p.target.x - p.x, p.target.y - p.y) < p.target.kill));
      if (dead.length) {
        this.list = this.list.filter((p) => !dead.includes(p));
        for (const p of dead) p.onDeath?.(p);
      }
    }
    this.flush();
  }

  flush() {
    const n = Math.min(this.max, this.list.length);
    for (let i = 0; i < n; i++) {
      const p = this.list[i];
      const lifeK = p.life > 0 ? 1 - p.age / p.life : 1;
      const inK = p.fadeIn > 0 ? Math.min(1, p.age / p.fadeIn) : 1;
      const a = Math.max(0, Math.min(1, p.alpha * Math.min(1, lifeK * 3) * inK));
      this.pos[i * 3] = Math.round(p.x);
      this.pos[i * 3 + 1] = Math.round(p.y);
      this.pos[i * 3 + 2] = 0;
      this.size[i] = Math.max(1, Math.round(p.size / 2) * 2);
      this.color[i * 4] = p.color[0] / 255;
      this.color[i * 4 + 1] = p.color[1] / 255;
      this.color[i * 4 + 2] = p.color[2] / 255;
      this.color[i * 4 + 3] = a;
    }
    const g = this.geometry;
    g.attributes.position.needsUpdate = true;
    g.attributes.aSize.needsUpdate = true;
    g.attributes.aColor.needsUpdate = true;
    g.setDrawRange(0, n);
  }

  clear() { this.list = []; this.flush(); }

  dispose() {
    this.points.removeFromParent();
    this.geometry.dispose();
    this.material.dispose();
  }
}

// ───────────────────────────── Quads con shader ─────────────────────────────

const QUAD_VERT = /* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const NOISE = /* glsl */`
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) { vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }`;

const FRAGS = {
  glow: /* glsl */`
precision highp float; uniform vec3 uColor; uniform float uAlpha; uniform float uTime; varying vec2 vUv;
void main(){
  vec2 p = floor(vUv * 64.0) / 64.0 * 2.0 - 1.0;
  float d = length(p);
  float a = pow(max(0.0, 1.0 - d), 1.6) * (0.85 + 0.15 * sin(uTime * 4.0));
  a = floor(a * 6.0 + 0.5) / 6.0;
  gl_FragColor = vec4(uColor * a * uAlpha, 1.0);
}`,
  beam: /* glsl */`
precision highp float; uniform vec3 uColor; uniform float uAlpha; uniform float uTime; varying vec2 vUv;
${NOISE}
void main(){
  float y = abs(vUv.y - 0.5) * 2.0;
  float w = 0.55 + 0.25 * noise(vec2(vUv.x * 18.0 - uTime * 20.0, uTime * 3.0));
  float core = 1.0 - smoothstep(0.0, w * 0.45, y);
  float glow = (1.0 - smoothstep(0.0, w, y)) * 0.7;
  float ends = smoothstep(0.0, 0.06, vUv.x) * (1.0 - smoothstep(0.94, 1.0, vUv.x));
  float a = floor((core + glow) * ends * 5.0 + 0.5) / 5.0;
  vec3 c = mix(uColor, vec3(1.0), core * 0.7);
  gl_FragColor = vec4(c * a * uAlpha, 1.0);
}`,
  ring: /* glsl */`
precision highp float; uniform vec3 uColor; uniform float uAlpha; uniform float uTime; uniform float uWidth; varying vec2 vUv;
void main(){
  vec2 p = floor(vUv * 96.0) / 96.0 * 2.0 - 1.0;
  float d = length(p);
  float a = 1.0 - smoothstep(0.0, uWidth, abs(d - (1.0 - uWidth)));
  a = floor(a * 4.0 + 0.5) / 4.0;
  gl_FragColor = vec4(uColor * a * uAlpha, 1.0);
}`,
  rift: /* glsl */`
precision highp float; uniform vec3 uColor; uniform float uAlpha; uniform float uTime; uniform float uOpen; varying vec2 vUv;
${NOISE}
void main(){
  vec2 p = floor(vUv * vec2(128.0, 32.0)) / vec2(128.0, 32.0);
  float x = p.x * 2.0 - 1.0;
  float y = (p.y - 0.5) * 2.0;
  float jag = (noise(vec2(p.x * 24.0, 1.7)) - 0.5) * 0.5;
  float h = uOpen * (1.0 - x * x) * (0.75 + jag);
  float d = abs(y + jag * 0.3) - h;
  if (d > 0.35 || abs(x) > 1.0) discard;
  vec3 inside = vec3(0.02, 0.0, 0.05) + uColor * 0.15 * noise(vec2(p.x * 40.0, uTime * 2.0));
  float edge = 1.0 - smoothstep(0.0, 0.35, abs(d));
  vec3 c = d < 0.0 ? mix(inside, vec3(1.0), smoothstep(-0.08, 0.0, d)) : uColor * edge + vec3(edge * edge);
  float a = d < 0.0 ? 1.0 : edge;
  gl_FragColor = vec4(c, floor(a * uAlpha * 4.0 + 0.5) / 4.0);
}`,
};

function quadMaterial(frag, color, { blending = THREE.AdditiveBlending, extra = {} } = {}) {
  return new THREE.ShaderMaterial({
    vertexShader: QUAD_VERT,
    fragmentShader: frag,
    uniforms: { uColor: { value: rgb(color) }, uAlpha: { value: 1 }, uTime: { value: 0 }, ...extra },
    transparent: true, depthTest: false, depthWrite: false, blending, side: THREE.DoubleSide,
  });
}

class ShaderQuad {
  constructor(parent, frag, color, opts = {}) {
    this.material = quadMaterial(frag, color, opts);
    this.mesh = new THREE.Mesh(ANCHOR_CENTER, this.material);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = opts.order ?? 0;
    parent.add(this.mesh);
    this.x = 0;
    this.y = 0;
    this.w = opts.w ?? 64;
    this.h = opts.h ?? 64;
    this.alpha = opts.alpha ?? 1;
    this.angle = 0;
    this.time = 0;
  }

  setColor(c) { this.material.uniforms.uColor.value = rgb(c); }

  update(steps = 1) {
    this.time += steps / 60;
    const u = this.material.uniforms;
    u.uTime.value = this.time;
    u.uAlpha.value = Math.max(0, this.alpha);
    this.mesh.position.set(Math.round(this.x), Math.round(this.y), 0);
    this.mesh.scale.set(Math.max(1, this.w), Math.max(1, this.h), 1);
    this.mesh.rotation.z = this.angle;
    this.mesh.visible = this.alpha > 0.003;
  }

  dispose() {
    this.mesh.removeFromParent();
    this.material.dispose();
  }
}

export class GlowQuad extends ShaderQuad {
  constructor(parent, color, opts = {}) { super(parent, FRAGS.glow, color, opts); }
}

export class Ring extends ShaderQuad {
  constructor(parent, color, opts = {}) {
    super(parent, FRAGS.ring, color, { ...opts, extra: { uWidth: { value: opts.width ?? 0.12 } } });
  }
}

export class Rift extends ShaderQuad {
  constructor(parent, color, opts = {}) {
    super(parent, FRAGS.rift, color, { blending: THREE.NormalBlending, ...opts, extra: { uOpen: { value: 0 } } });
    this.open = 0;
  }

  update(steps = 1) {
    this.material.uniforms.uOpen.value = this.open;
    super.update(steps);
  }
}

/** Haz entre (x0,y0) y (x1,y1). `progress` 0..1 recorta el haz desde el origen. */
export class Beam extends ShaderQuad {
  constructor(parent, color, opts = {}) {
    super(parent, FRAGS.beam, color, opts);
    this.from = { x: 0, y: 0 };
    this.to = { x: 0, y: 0 };
    this.width = opts.width ?? 28;
    this.progress = 1;
  }

  update(steps = 1) {
    const dx = (this.to.x - this.from.x) * this.progress;
    const dy = (this.to.y - this.from.y) * this.progress;
    this.x = this.from.x + dx / 2;
    this.y = this.from.y + dy / 2;
    this.w = Math.hypot(dx, dy);
    this.h = this.width;
    this.angle = Math.atan2(dy, dx);
    super.update(steps);
  }
}

// ───────────────────────────── Utilidades ─────────────────────────────

/** Actualiza en bloque piezas con update(steps) y descarta las marcadas como `done`. */
export class GfxSet {
  constructor() { this.items = new Set(); }
  add(item) { this.items.add(item); return item; }
  remove(item) { if (this.items.delete(item)) item.dispose(); }
  update(steps = 1) { for (const it of this.items) it.update(steps); }
  dispose() { for (const it of this.items) it.dispose(); this.items.clear(); }
}

/** Número aleatorio en [a, b). */
export const rand = (a, b) => a + Math.random() * (b - a);
