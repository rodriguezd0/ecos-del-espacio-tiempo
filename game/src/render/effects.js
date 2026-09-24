// Efectos visuales reutilizables (sin contenido narrativo):
//  - Mundo (siguen a la cámara, aditivos tras el tono): 'zygardeCell' (brillo verde hexagonal),
//    'cracks' (grietas luminosas), 'zygardeRebuild' (hexágonos verdes que ascienden),
//    'softLight' (luz ambiental radial que respira), 'visionCone' (haz de linterna de un personaje).
//  - Cielo/pantalla: 'aurora' (cortinas de aurora), 'moon' (luna grande con halo).
// API: const h = fx.add(nombre, opciones); h.remove(fotogramasDeFundido)
import * as THREE from 'three';
import { SCREEN_W, SCREEN_H } from '../core/engine.js';
import { createRng } from '../world/prng.js';

const COMMON = /* glsl */`
precision highp float;
uniform float uTime; uniform float uAlpha; uniform vec3 uColor;
varying vec2 vUv;
float hexDist(vec2 p) { p = abs(p); return max(dot(p, normalize(vec2(1.0, 1.7320508))), p.x); }
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) { vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
`;
const VERT = /* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const SCREEN_VERT = /* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const FRAGS = {
  cell: `${COMMON}
void main() {
  vec2 p = (vUv - 0.5) * 2.0;
  float pulse = 0.65 + 0.35 * sin(uTime * 3.0);
  float d = hexDist(p * 1.6);
  float core = smoothstep(0.34, 0.18, d);
  float ring = smoothstep(0.05, 0.0, abs(d - 0.55 - 0.05 * sin(uTime * 2.0)));
  float halo = exp(-d * 3.2) * 0.6;
  float px = floor(vUv.x * 24.0) / 24.0; float py = floor(vUv.y * 24.0) / 24.0;
  float sparkle = step(0.985, hash(vec2(px, py) + floor(uTime * 6.0))) * smoothstep(1.0, 0.3, d);
  float a = (core * 0.9 + ring * 0.8 + halo) * pulse + sparkle;
  gl_FragColor = vec4(uColor * a * uAlpha, 1.0);
}`,
  crack: `${COMMON}
void main() {
  float glow = exp(-abs(vUv.y - 0.5) * 9.0);
  float core = smoothstep(0.12, 0.0, abs(vUv.y - 0.5));
  float flicker = 0.75 + 0.25 * sin(uTime * 5.0 + vUv.x * 12.0);
  gl_FragColor = vec4((uColor * glow * 0.8 + vec3(core)) * flicker * uAlpha, 1.0);
}`,
  hexes: `${COMMON}
void main() {
  vec2 p = (vUv - 0.5) * 2.0;
  float d = hexDist(p);
  float a = smoothstep(1.0, 0.8, d) * smoothstep(0.55, 0.75, d) + smoothstep(0.6, 0.0, d) * 0.35;
  gl_FragColor = vec4(uColor * a * uAlpha, 1.0);
}`,
  // Luz ambiental suave (radial, por bandas y pixelada a 2 px) que "respira" lentamente.
  light: `${COMMON}
uniform float uSteps; uniform float uPulse; uniform float uIntensity;
void main() {
  vec2 q = (floor(vUv * uSteps) + 0.5) / uSteps;
  float d = length((q - 0.5) * 2.0);
  float breath = 1.0 - uPulse * (0.5 + 0.5 * sin(uTime * 1.3));
  float a = smoothstep(1.0, 0.0, d);
  a = floor(a * a * 7.0 + 0.5) / 7.0;
  gl_FragColor = vec4(uColor * a * uAlpha * uIntensity * breath, 1.0);
}`,
  // Haz de linterna: sale del personaje (x = 0) y se ensancha un poco hacia el final (x = 1).
  beam: `${COMMON}
uniform vec2 uSize;
void main() {
  vec2 uv = (floor(vUv * uSize / 2.0) + 0.5) * 2.0 / uSize;
  float across = abs(uv.y - 0.5) * 2.0;
  float halfW = 0.55 + 0.45 * uv.x;
  float edge = smoothstep(halfW, halfW - 0.3, across);
  float fade = smoothstep(1.0, 0.7, uv.x) * smoothstep(0.0, 0.12, uv.x);
  float flicker = 0.9 + 0.1 * sin(uTime * 11.0) * sin(uTime * 7.3);
  float a = floor(edge * fade * flicker * 5.0 + 0.5) / 5.0;
  gl_FragColor = vec4(uColor * a * uAlpha * 0.6, 1.0);
}`,
  aurora: `${COMMON}
uniform float uCamX;
void main() {
  vec2 p = floor(vec2(vUv.x * ${SCREEN_W}.0 + uCamX * 0.1, (1.0 - vUv.y) * ${SCREEN_H}.0) / 2.0) * 2.0;
  vec3 col = vec3(0.0);
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float center = 36.0 + fi * 24.0 + sin(p.x * 0.008 + uTime * 0.3 + fi * 1.7) * 16.0 + (noise(vec2(p.x * 0.012 + fi * 5.0, uTime * 0.15)) - 0.5) * 28.0;
    float d = p.y - center;
    float curtain = smoothstep(-48.0, 0.0, d) * smoothstep(6.0, 0.0, d);
    float rays = 0.45 + 0.55 * noise(vec2(p.x * 0.09 + fi * 3.0, uTime * 0.8));
    vec3 c = mix(uColor, vec3(0.5, 0.3, 0.95), clamp(fi / 2.0 - d * 0.006, 0.0, 1.0));
    col += c * curtain * rays;
  }
  float fade = smoothstep(200.0, 70.0, p.y);
  col = floor(col * 8.0) / 8.0;
  gl_FragColor = vec4(col * fade * uAlpha * 0.6, 1.0);
}`,
  moon: `${COMMON}
uniform vec3 uMoon; // x, y, radio (px de pantalla)
void main() {
  vec2 p = floor(vec2(vUv.x * ${SCREEN_W}.0, (1.0 - vUv.y) * ${SCREEN_H}.0) / 2.0) * 2.0 + 1.0;
  vec2 d = (p - uMoon.xy) / uMoon.z;
  float r = length(d);
  if (r > 1.0) {
    float halo = exp(-(r - 1.0) * 3.0) * 0.4;
    gl_FragColor = vec4(uColor, floor(halo * uAlpha * 10.0) / 10.0);
    return;
  }
  vec3 n = vec3(d, sqrt(1.0 - r * r));
  float shade = 0.72 + 0.28 * dot(n, normalize(vec3(-0.5, -0.6, 0.65)));
  for (int k = 0; k < 7; k++) {
    float fk = float(k);
    vec2 c = (vec2(hash(vec2(fk, 1.0)), hash(vec2(fk, 7.0))) - 0.5) * 1.3;
    float rk = 0.1 + hash(vec2(fk, 3.0)) * 0.16;
    float dist = distance(d, c);
    if (dist < rk) shade *= 0.84;
    else if (dist < rk + 0.05 && dot(d - c, vec2(-0.7, -0.7)) > 0.0) shade *= 1.06;
  }
  shade *= 0.9 + 0.1 * noise(p * 0.15);
  shade = floor(shade * 7.0) / 7.0;
  gl_FragColor = vec4(uColor * shade, uAlpha);
}`,
};

function shaderMat(frag, extra = {}, { vert = VERT, blending = THREE.AdditiveBlending } = {}) {
  return new THREE.ShaderMaterial({
    vertexShader: vert,
    fragmentShader: frag,
    uniforms: { uTime: { value: 0 }, uAlpha: { value: 1 }, uColor: { value: new THREE.Color(0.3, 1, 0.45) }, ...extra },
    transparent: true, depthTest: false, depthWrite: false, blending, side: THREE.DoubleSide,
  });
}

const colorOf = (c, fallback) => (Array.isArray(c) ? new THREE.Color(c[0] / 255, c[1] / 255, c[2] / 255) : fallback);

export class EffectsLayer {
  constructor() {
    this.worldScene = new THREE.Scene();
    this.worldRoot = new THREE.Group();
    this.worldRoot.scale.y = -1;
    this.worldScene.add(this.worldRoot);
    this.skyScene = new THREE.Scene();
    this.skyCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.items = [];
    this.time = 0;
    this.camX = 0;
  }

  /** Crea un efecto. Coordenadas de mundo en casillas del mapa actual (x, y). */
  add(name, opts = {}) {
    const make = {
      zygardeCell: () => this.makeQuad(FRAGS.cell, (opts.x ?? 0) * 32 + 16, (opts.y ?? 0) * 32 + 16, opts.size ?? 56, colorOf(opts.color, new THREE.Color(0.35, 1, 0.45))),
      cracks: () => this.makeCracks(opts),
      zygardeRebuild: () => this.makeRebuild(opts),
      aurora: () => this.makeSky(FRAGS.aurora, { uCamX: { value: 0 } }, colorOf(opts.color, new THREE.Color(0.2, 1, 0.6)), THREE.AdditiveBlending),
      moon: () => this.makeSky(FRAGS.moon, { uMoon: { value: new THREE.Vector3(opts.x ?? 400, opts.y ?? 80, opts.radius ?? 56) } }, colorOf(opts.color, new THREE.Color(1, 0.96, 0.85)), THREE.NormalBlending),
      softLight: () => this.makeLight(opts),
      visionCone: () => this.makeBeam(opts),
    }[name];
    if (!make) throw new Error(`Efecto desconocido "${name}"`);
    const obj = make();
    const item = { name, obj, alpha: 0, target: opts.alpha ?? 1, fadeIn: opts.fadeIn ?? 20, fadeOut: 0, dead: false, update: obj.userData.update };
    this.items.push(item);
    return {
      remove: (frames = 20) => { item.fadeOut = Math.max(1, frames); item.target = 0; },
      object: obj,
      set: (o) => Object.assign(opts, o),
    };
  }

  makeQuad(frag, cx, cy, size, color) {
    const mat = shaderMat(frag);
    mat.uniforms.uColor.value = color;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
    mesh.scale.set(size, size, 1);
    mesh.position.set(cx, cy, 0);
    mesh.frustumCulled = false;
    this.worldRoot.add(mesh);
    return mesh;
  }

  /** Luz ambiental: opts { x, y (casillas), radius (px, 96), color [r,g,b], intensity (0.5), pulse (0..1, 0.25) } */
  makeLight(opts) {
    const size = (opts.radius ?? 96) * 2;
    const mat = shaderMat(FRAGS.light, {
      uSteps: { value: size / 2 }, uPulse: { value: opts.pulse ?? 0.25 }, uIntensity: { value: opts.intensity ?? 0.5 },
    });
    mat.uniforms.uColor.value = colorOf(opts.color, new THREE.Color(0.45, 1, 0.5));
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
    mesh.scale.set(size, size, 1);
    mesh.position.set((opts.x ?? 0) * 32 + 16, (opts.y ?? 0) * 32 + 16, 0);
    mesh.frustumCulled = false;
    this.worldRoot.add(mesh);
    return mesh;
  }

  /**
   * Haz de linterna / cono de visión que sigue a un personaje (se usa como page.glow de un evento).
   * opts: { event (lo pone WorldView), reach(ev) → casillas visibles | número, width (px, 30), color }
   * El grupo se coloca en el centro del personaje; el haz apunta según su dirección.
   */
  makeBeam(opts) {
    const group = new THREE.Group();
    const width = opts.width ?? 30;
    const mat = shaderMat(FRAGS.beam, { uSize: { value: new THREE.Vector2(32, width) } });
    mat.uniforms.uColor.value = colorOf(opts.color, new THREE.Color(1, 0.92, 0.6));
    const geo = new THREE.PlaneGeometry(1, 1);
    geo.translate(0.5, 0, 0);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    mesh.position.x = 6;
    group.add(mesh);
    const ANGLE = { 6: 0, 2: Math.PI / 2, 4: Math.PI, 8: -Math.PI / 2 };
    group.userData.update = () => {
      const ev = opts.event;
      if (!ev) return;
      const reach = typeof opts.reach === 'function' ? opts.reach(ev) : (opts.reach ?? 4);
      const len = reach > 0 ? reach * 32 + 16 - 6 : 0;
      mesh.visible = len > 0 && !ev.erased;
      mesh.scale.set(Math.max(1, len), width, 1);
      mat.uniforms.uSize.value.set(Math.max(1, len), width);
      group.rotation.z = ANGLE[ev.direction] ?? 0;
    };
    this.worldRoot.add(group);
    return group;
  }

  makeSky(frag, extra, color, blending) {
    const mat = shaderMat(frag, extra, { vert: SCREEN_VERT, blending });
    mat.uniforms.uColor.value = color;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
    mesh.frustumCulled = false;
    this.skyScene.add(mesh);
    if (extra.uCamX) mesh.userData.update = () => { mat.uniforms.uCamX.value = this.camX; };
    return mesh;
  }

  /** Grietas: árbol de segmentos quebrados desde (x,y) en casillas; opts: { length, branches, seed, color } */
  makeCracks(opts) {
    const rng = createRng(opts.seed ?? 7);
    const segs = [];
    const grow = (x, y, ang, len, depth) => {
      let cx = x; let cy = y;
      const steps = 4 + Math.floor(rng() * 4);
      for (let i = 0; i < steps; i++) {
        const a = ang + (rng() - 0.5) * 1.1;
        const l = len / steps;
        const nx = cx + Math.cos(a) * l; const ny = cy + Math.sin(a) * l;
        segs.push([cx, cy, nx, ny, depth]);
        if (depth < 2 && rng() < 0.3) grow(nx, ny, a + (rng() < 0.5 ? 1 : -1) * (0.6 + rng() * 0.6), len * 0.5, depth + 1);
        cx = nx; cy = ny;
      }
    };
    const ox = (opts.x ?? 0) * 32 + 16; const oy = (opts.y ?? 0) * 32 + 16;
    const branches = opts.branches ?? 3;
    for (let b = 0; b < branches; b++) grow(ox, oy, (b / branches) * Math.PI * 2 + rng(), opts.length ?? 120, 0);
    const pos = []; const uv = []; const idx = [];
    segs.forEach(([x0, y0, x1, y1, depth], i) => {
      const w = (depth === 0 ? 10 : 7);
      const dx = x1 - x0; const dy = y1 - y0; const l = Math.hypot(dx, dy) || 1;
      const nx = (-dy / l) * w; const ny = (dx / l) * w;
      pos.push(x0 + nx, y0 + ny, 0, x1 + nx, y1 + ny, 0, x0 - nx, y0 - ny, 0, x1 - nx, y1 - ny, 0);
      uv.push(0, 0, 1, 0, 0, 1, 1, 1);
      const k = i * 4;
      idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3);
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    const mat = shaderMat(FRAGS.crack);
    mat.uniforms.uColor.value = colorOf(opts.color, new THREE.Color(0.6, 0.85, 1));
    const mesh = new THREE.Mesh(g, mat);
    mesh.frustumCulled = false;
    this.worldRoot.add(mesh);
    return mesh;
  }

  /** Hexágonos verdes que ascienden sobre las casillas reconstruidas. */
  makeRebuild(opts) {
    const group = new THREE.Group();
    const mat = shaderMat(FRAGS.hexes);
    const parts = [];
    for (const [tx, ty] of opts.tiles || []) {
      for (let i = 0; i < 3; i++) {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
        m.frustumCulled = false;
        const p = { m, x: tx * 32 + 8 + Math.random() * 16, y: ty * 32 + 24, vy: -0.6 - Math.random() * 0.8, size: 8 + Math.random() * 10, t: Math.random() * 40 };
        parts.push(p);
        group.add(m);
      }
    }
    group.userData.update = () => {
      for (const p of parts) {
        p.t += 1;
        const k = (p.t % 60) / 60;
        p.m.position.set(p.x, p.y + p.vy * (p.t % 60) * 1.5, 0);
        p.m.scale.set(p.size * (1 - k * 0.5), p.size * (1 - k * 0.5), 1);
      }
    };
    this.worldRoot.add(group);
    return group;
  }

  /** Posición de cámara (px) para los efectos de mundo. */
  setCamera(x, y) {
    this.worldRoot.position.set(-x, y, 0);
    this.camX = x;
  }

  update(dt) {
    this.time += dt;
    for (const it of this.items) {
      if (it.fadeOut > 0) it.alpha = Math.max(0, it.alpha - 1 / it.fadeOut);
      else it.alpha = Math.min(it.target, it.alpha + 1 / Math.max(1, it.fadeIn));
      it.obj.traverse((o) => {
        if (o.material?.uniforms) { o.material.uniforms.uTime.value = this.time; o.material.uniforms.uAlpha.value = it.alpha; }
      });
      it.update?.();
      if (it.fadeOut > 0 && it.alpha <= 0) it.dead = true;
    }
    for (const it of this.items.filter((i) => i.dead)) this.dispose(it);
    this.items = this.items.filter((i) => !i.dead);
  }

  dispose(it) {
    it.obj.removeFromParent();
    it.obj.traverse((o) => { o.geometry?.dispose?.(); o.material?.dispose?.(); });
  }

  get hasWorld() { return this.worldRoot.children.length > 0; }
  get hasSky() { return this.skyScene.children.length > 0; }

  renderWorld(renderer, camera) { if (this.hasWorld) renderer.render(this.worldScene, camera); }
  renderSky(renderer) { if (this.hasSky) renderer.render(this.skyScene, this.skyCamera); }

  clear() {
    for (const it of this.items) this.dispose(it);
    this.items = [];
  }
}
