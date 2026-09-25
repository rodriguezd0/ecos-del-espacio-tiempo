// Panorama de fondo del mapa (el «panorama» de RMXP): se dibuja DETRÁS de los tilemaps, así que asoma en las
// casillas sin tiles (el vacío). Con paralaje respecto a la cámara. Definición del mapa:
//   panorama: { shader: 'distorsion', parallax?: 0.3, alpha?: 1 }              fondo procedural (Mundo Distorsión)
//   panorama: { shader: 'sima', parallax?: 0.3 }                               abismo de la Sima del Eje (B18)
//   panorama: { image: 'assets/panoramas/x.png' | 'anil:Graphics/Panoramas/x', parallax?: 0.5, scroll?: [sx, sy] }
// Siluetas: `layer.silhouette({ url, frameW?, scale, from: [x, y], to: [x, y], frames, alpha, color })` cruza el
// fondo (p. ej. la sombra de Giratina en El Sumidero, B12) y devuelve una promesa que se resuelve al terminar.
// Lo usa MapScene (cambio aditivo): set() en applyEnvironment, update() cada fotograma y render() antes del mundo.
import * as THREE from 'three';
import { engine, SCREEN_W, SCREEN_H } from '../core/engine.js';
import { tryRawTexture, loadRepeatTexture } from './textures.js';

const VERT = /* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const NOISE = /* glsl */`
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) { vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y); }
float fbm(vec2 p) { float v = 0.0; float a = 0.5; for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.03 + 11.7; a *= 0.5; } return v; }
`;

// Mundo Distorsión: vacío índigo con nebulosas violeta y verde agua, islas lejanas a contraluz y motas que suben.
const DISTORSION_FRAG = /* glsl */`
precision highp float;
uniform vec2 uCam; uniform float uTime; uniform float uAlpha; uniform float uPar;
varying vec2 vUv;
${NOISE}
void main() {
  vec2 px = floor(vec2(vUv.x * ${SCREEN_W}.0, (1.0 - vUv.y) * ${SCREEN_H}.0) / 2.0) * 2.0;
  vec2 far = (px + uCam * (uPar * 0.4)) / 220.0 + vec2(uTime * 0.004, uTime * 0.0025);
  float n1 = fbm(far);
  vec3 col = mix(vec3(0.020, 0.020, 0.050), vec3(0.060, 0.052, 0.110), smoothstep(0.25, 0.85, n1));
  vec2 mid = (px + uCam * (uPar * 0.8)) / 110.0 + vec2(-uTime * 0.009, uTime * 0.005);
  float warp = fbm(mid * 0.6 + 4.1);
  float n2 = fbm(mid + warp * 1.4);
  col += vec3(0.15, 0.07, 0.22) * smoothstep(0.52, 0.84, n2) * 0.45;
  col += vec3(0.05, 0.15, 0.16) * smoothstep(0.58, 0.88, fbm(mid * 1.6 + 9.3)) * 0.45;
  // islas lejanas: cuerpos oscuros de copa plana y fondo desflecado, con el borde superior iluminado
  vec2 isl = (px + uCam * (uPar * 1.4)) / vec2(150.0, 70.0);
  vec2 cell = floor(isl);
  vec2 f = fract(isl);
  float r = hash(cell + 3.7);
  if (r > 0.62) {
    float cx = 0.3 + 0.4 * hash(cell + 1.3);
    float wdt = 0.16 + 0.18 * hash(cell + 8.1);
    float dx = abs(f.x - cx) / wdt;
    float topY = 0.42 + 0.12 * hash(cell + 5.9);
    float depth = (1.0 - dx * dx) * (0.34 + 0.2 * hash(cell + 2.2)) + (noise(vec2(f.x * 18.0, cell.y)) - 0.5) * 0.08;
    if (dx < 1.0 && f.y > topY && f.y < topY + depth) {
      float lit = step(f.y, topY + 0.035);
      col = mix(col, vec3(0.105, 0.080, 0.165), 0.85);
      col += vec3(0.18, 0.12, 0.26) * lit * 0.8;
    }
  }
  // motas que ascienden despacio
  vec2 mp = px + uCam * (uPar * 2.0);
  vec2 mc = floor(mp / 26.0);
  float mh = hash(mc + 0.5);
  if (mh > 0.9) {
    vec2 ml = mod(mp, 26.0);
    float my = mod(13.0 - uTime * (6.0 + 8.0 * mh) + mh * 300.0, 26.0);
    float mx = 13.0 + 5.0 * sin(uTime * 0.8 + mh * 40.0);
    float d = length(ml - vec2(mx, my));
    vec3 tint = mh > 0.97 ? vec3(0.45, 0.95, 0.55) : vec3(0.70, 0.52, 1.0);
    col += tint * (1.0 - smoothstep(1.0, 2.2, d)) * 0.55;
  }
  col = floor(col * 28.0 + 0.5) / 28.0;
  gl_FragColor = vec4(col * uAlpha, 1.0);
}`;

// Sima del Eje (aditivo B18): abismo visto desde arriba. Negro azulado que se aclara hacia el fondo, bancos de niebla
// a dos profundidades (paralaje distinto), salientes de roca lejanos, un resplandor plata-violeta muy abajo (lo que
// queda del cruce de ejes) y motas de polvo que caen hacia el fondo.
const SIMA_FRAG = /* glsl */`
precision highp float;
uniform vec2 uCam; uniform float uTime; uniform float uAlpha; uniform float uPar;
varying vec2 vUv;
${NOISE}
void main() {
  vec2 px = floor(vec2(vUv.x * ${SCREEN_W}.0, (1.0 - vUv.y) * ${SCREEN_H}.0) / 2.0) * 2.0;
  vec2 deep = (px + uCam * (uPar * 0.35)) / 260.0;
  float n0 = fbm(deep + vec2(0.0, uTime * 0.004));
  vec3 col = mix(vec3(0.012, 0.016, 0.034), vec3(0.040, 0.046, 0.082), smoothstep(0.30, 0.80, n0));
  // resplandor del fondo: bandas lentas plata y violeta
  float glow = fbm(deep * 1.7 + vec2(uTime * 0.006, -uTime * 0.003));
  col += vec3(0.11, 0.10, 0.16) * smoothstep(0.62, 0.92, glow) * 0.55;
  col += vec3(0.16, 0.08, 0.20) * smoothstep(0.70, 0.95, fbm(deep * 3.1 + 7.7)) * 0.30;
  // salientes lejanos: masas oscuras de borde superior claro
  vec2 led = (px + uCam * (uPar * 0.9)) / vec2(120.0, 46.0);
  vec2 lc = floor(led); vec2 lf = fract(led);
  float lr = hash(lc + 2.3);
  if (lr > 0.66) {
    float cx = 0.25 + 0.5 * hash(lc + 9.1);
    float hw = 0.12 + 0.20 * hash(lc + 4.4);
    float dxl = abs(lf.x - cx) / hw;
    float top = 0.35 + 0.2 * hash(lc + 6.6);
    float h = (1.0 - dxl * dxl) * 0.35 + (noise(vec2(lf.x * 22.0, lc.y)) - 0.5) * 0.06;
    if (dxl < 1.0 && lf.y > top && lf.y < top + h) {
      col = mix(col, vec3(0.020, 0.022, 0.040), 0.85);
      col += vec3(0.09, 0.09, 0.13) * step(lf.y, top + 0.03);
    }
  }
  // niebla cercana que se desliza
  vec2 mist = (px + uCam * (uPar * 1.6)) / 150.0 + vec2(uTime * 0.012, 0.0);
  float m = fbm(mist + fbm(mist * 0.7 + 3.0) * 0.8);
  col = mix(col, vec3(0.20, 0.21, 0.28), smoothstep(0.58, 0.90, m) * 0.34);
  // motas de polvo que caen
  vec2 mp = px + uCam * (uPar * 2.2);
  vec2 mc = floor(mp / 24.0);
  float mh = hash(mc + 0.7);
  if (mh > 0.88) {
    vec2 ml = mod(mp, 24.0);
    float my = mod(mh * 300.0 + uTime * (10.0 + 12.0 * mh), 24.0);
    float d = length(ml - vec2(12.0 + 4.0 * sin(uTime * 0.6 + mh * 30.0), my));
    col += vec3(0.62, 0.64, 0.78) * (1.0 - smoothstep(0.8, 2.0, d)) * 0.45;
  }
  col = floor(col * 28.0 + 0.5) / 28.0;
  gl_FragColor = vec4(col * uAlpha, 1.0);
}`;

const IMAGE_FRAG = /* glsl */`
precision highp float;
uniform sampler2D map; uniform vec2 uCam; uniform vec2 uScale; uniform float uAlpha; uniform float uPar; uniform vec2 uScroll; uniform float uTime;
varying vec2 vUv;
void main() {
  vec2 p = vec2(vUv.x * ${SCREEN_W}.0, (1.0 - vUv.y) * ${SCREEN_H}.0) + uCam * uPar + uScroll * uTime;
  vec4 c = texture2D(map, fract(p / uScale));
  gl_FragColor = vec4(c.rgb * uAlpha, 1.0);
}`;

// Silueta: primer fotograma de una tira (sprites de Pokémon de Añil) como masa oscura (más oscura que el fondo, tapa
// nebulosas y motas) con un contorno tenue del color `rim` para que se lea sobre el vacío.
const SIL_VERT = /* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const SIL_FRAG = /* glsl */`
precision highp float;
uniform sampler2D map; uniform vec4 uRect; uniform float uAlpha; uniform vec3 uColor; uniform vec3 uRim; uniform vec2 uTexel;
varying vec2 vUv;
void main() {
  vec2 uv = mix(uRect.xy, uRect.zw, vUv);
  vec4 c = texture2D(map, uv);
  if (c.a < 0.05) discard;
  float l = dot(c.rgb, vec3(0.3, 0.59, 0.11));
  float edge = 0.0;
  edge = max(edge, step(texture2D(map, uv + vec2(uTexel.x, 0.0)).a, 0.05));
  edge = max(edge, step(texture2D(map, uv - vec2(uTexel.x, 0.0)).a, 0.05));
  edge = max(edge, step(texture2D(map, uv + vec2(0.0, uTexel.y)).a, 0.05));
  edge = max(edge, step(texture2D(map, uv - vec2(0.0, uTexel.y)).a, 0.05));
  vec3 col = mix(uColor * (0.6 + 0.8 * l), uRim, edge);
  gl_FragColor = vec4(col, c.a * uAlpha);
}`;

function screenQuad(material) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  mesh.frustumCulled = false;
  return mesh;
}

const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

export class PanoramaLayer {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.silScene = new THREE.Scene();
    this.silRoot = new THREE.Group();
    this.silRoot.scale.y = -1;
    this.silScene.add(this.silRoot);
    this.silCamera = new THREE.OrthographicCamera(0, SCREEN_W, 0, -SCREEN_H, -10, 10);
    this.def = null;
    this.mesh = null;
    this.time = 0;
    this.camX = 0;
    this.camY = 0;
    this.silhouettes = [];
    this.token = 0;
  }

  get active() { return Boolean(this.mesh); }

  clearMesh() {
    if (!this.mesh) return;
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
    this.mesh = null;
  }

  /** Cambia el panorama (null lo quita). No lanza: un fallo de carga deja el fondo negro. */
  async set(def) {
    const key = def ? JSON.stringify(def) : null;
    if (key === this.key) return;
    this.key = key;
    const token = ++this.token;
    this.clearMesh();
    this.def = def || null;
    if (!def) return;
    try {
      const common = { uCam: { value: new THREE.Vector2() }, uTime: { value: 0 }, uAlpha: { value: def.alpha ?? 1 }, uPar: { value: def.parallax ?? 0.3 } };
      let material;
      if (def.shader === 'distorsion') {
        material = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: DISTORSION_FRAG, uniforms: common, depthTest: false, depthWrite: false });
      } else if (def.shader === 'sima') { // aditivo B18: abismo de la Sima del Eje
        material = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: SIMA_FRAG, uniforms: common, depthTest: false, depthWrite: false });
      } else if (def.image) {
        const url = def.image.startsWith('anil:') ? engine.assets.anil(def.image.slice(5)) : def.image;
        const tex = await loadRepeatTexture(url);
        if (token !== this.token) return;
        material = new THREE.ShaderMaterial({
          vertexShader: VERT, fragmentShader: IMAGE_FRAG, depthTest: false, depthWrite: false,
          uniforms: { ...common, map: { value: tex }, uScale: { value: new THREE.Vector2(tex.image.width, tex.image.height) }, uScroll: { value: new THREE.Vector2(...(def.scroll || [0, 0])) } },
        });
      } else {
        throw new Error(`panorama sin shader ni imagen: ${key}`);
      }
      if (token !== this.token) { material.dispose(); return; }
      this.mesh = screenQuad(material);
      this.scene.add(this.mesh);
    } catch (err) {
      console.warn('[panorama]', err.message || err);
      this.clearMesh();
    }
  }

  /**
   * Silueta que cruza el fondo. opts: { url, frameW (px del fotograma; por defecto el alto de la imagen), scale (2),
   * from: [x, y], to: [x, y] (px de pantalla del centro), frames (240), alpha (0.85), color [r, g, b] 0..1 }.
   * → promesa que se resuelve al terminar (o enseguida si no se pudo cargar).
   */
  async silhouette(opts = {}) {
    const tex = opts.url ? await tryRawTexture(opts.url) : null;
    if (!tex) return false;
    const fw = opts.frameW || tex.image.height;
    const fh = tex.image.height;
    const material = new THREE.ShaderMaterial({
      vertexShader: SIL_VERT, fragmentShader: SIL_FRAG, transparent: true, depthTest: false, depthWrite: false, side: THREE.DoubleSide,
      uniforms: {
        map: { value: tex }, uRect: { value: new THREE.Vector4(0, 0, fw / tex.image.width, 1) }, uAlpha: { value: 0 },
        uColor: { value: new THREE.Vector3(...(opts.color || [0.01, 0.0, 0.02])) },
        uRim: { value: new THREE.Vector3(...(opts.rim || [0.32, 0.16, 0.45])) },
        uTexel: { value: new THREE.Vector2(1 / tex.image.width, 1 / tex.image.height) },
      },
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
    mesh.frustumCulled = false;
    const scale = opts.scale ?? 2;
    mesh.scale.set(fw * scale * (opts.flip ? -1 : 1), fh * scale, 1);
    this.silRoot.add(mesh);
    return new Promise((resolve) => {
      this.silhouettes.push({
        mesh, t: 0, frames: Math.max(30, opts.frames ?? 240), from: opts.from || [-200, 150], to: opts.to || [SCREEN_W + 200, 130],
        alpha: opts.alpha ?? 0.85, bob: opts.bob ?? 6, resolve,
      });
    });
  }

  update(dt, camera) {
    this.time += dt;
    if (camera) { this.camX = camera.renderX; this.camY = camera.renderY; }
    if (this.mesh) {
      const u = this.mesh.material.uniforms;
      u.uTime.value = this.time;
      u.uCam.value.set(this.camX, this.camY);
    }
    for (const s of this.silhouettes) {
      s.t += 1;
      const k = Math.min(1, s.t / s.frames);
      const e = easeInOut(k);
      const x = s.from[0] + (s.to[0] - s.from[0]) * e;
      const y = s.from[1] + (s.to[1] - s.from[1]) * e + Math.sin(s.t / 18) * s.bob;
      s.mesh.position.set(x, y, 0);
      const fade = Math.min(1, k / 0.18, (1 - k) / 0.18);
      s.mesh.material.uniforms.uAlpha.value = s.alpha * Math.max(0, fade);
      if (k >= 1) s.done = true;
    }
    for (const s of this.silhouettes.filter((x) => x.done)) {
      s.mesh.removeFromParent();
      s.mesh.geometry.dispose();
      s.mesh.material.dispose();
      s.resolve(true);
    }
    this.silhouettes = this.silhouettes.filter((x) => !x.done);
  }

  render(renderer) {
    if (this.mesh) renderer.render(this.scene, this.camera);
    if (this.silhouettes.length) renderer.render(this.silScene, this.silCamera);
  }

  dispose() {
    this.token += 1;
    this.clearMesh();
    for (const s of this.silhouettes) {
      s.mesh.removeFromParent();
      s.mesh.geometry.dispose();
      s.mesh.material.dispose();
      s.resolve(false);
    }
    this.silhouettes = [];
  }
}
