// Efectos visuales del sistema de campo de Zygarde (Three.js), registrados en render/effects.js:
//   zygardeHexBurst {x, y, mode:'out'|'in', count, spread (casillas), color, frames}  hexágonos que se
//                    disgregan o convergen (vuelo, montar, recuerdos, embestida, reconstrucción)
//   zygardeFissure  {kind}           fisura blanca con brillo verde tenue (rocas/troncos de Embestida)
//   zygardeVeins    {h}              vetas verdes verticales en paredes de Trepar (h casillas hacia arriba)
//   zygardeSocket   {}               zócalo hexagonal gastado (Reconstrucción)
//   zygardeWhirl    {up}             remolino azul marino con burbujas (Buceo) o columna de subida
//   zygardeVent     {kind}           respiradero verde / bolsa de aire (burbujas que suben)
//   zygardeCurrent  {dir}            flechas de burbujas de una corriente
//   zygardeBubble   {target, size}   burbuja de resonancia alrededor del jugador (Buceo)
//   zygardeGlint    {target}         destello leve y breve sobre una célula (Detección mejorada; opts.beatAt,
//                                    opts.strength). Sustituye al latido de proximidad (autor, 25-09-2026)
// Coordenadas en casillas del mapa actual; los brillos de evento (page.glow) los coloca WorldView.
import * as THREE from 'three';
import { registerEffect } from '../../render/effects.js';
import { loadRawTexture } from '../../render/textures.js';

const COMMON = /* glsl */`
precision highp float;
uniform float uTime; uniform float uAlpha; uniform float uFade; uniform vec3 uColor;
varying vec2 vUv;
float hexDist(vec2 p) { p = abs(p); return max(dot(p, normalize(vec2(1.0, 1.7320508))), p.x); }
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) { vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
float segDist(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * h); }
`;
const VERT = /* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

const GREEN = new THREE.Color(0.45, 1, 0.4);
const colorOf = (c, fallback) => (Array.isArray(c) ? new THREE.Color(c[0] / 255, c[1] / 255, c[2] / 255) : fallback.clone());

function mat(frag, extra = {}, color = GREEN, blending = THREE.AdditiveBlending) {
  return new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: `${COMMON}${frag}`,
    uniforms: { uTime: { value: 0 }, uAlpha: { value: 1 }, uFade: { value: 1 }, uColor: { value: color.clone() }, ...extra },
    transparent: true, depthTest: false, depthWrite: false, blending, side: THREE.DoubleSide,
  });
}

function quad(material, w, h) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
  m.scale.set(w, h, 1);
  m.frustumCulled = false;
  return m;
}

const tileCenter = (opts) => [(opts.x ?? 0) * 32 + 16, (opts.y ?? 0) * 32 + 16];

// ------------------------------------------------------------ fragmentos
const FRAG = {
  hex: `void main() {
  vec2 p = (vUv - 0.5) * 2.0;
  float d = hexDist(p);
  float a = smoothstep(1.0, 0.8, d) * smoothstep(0.45, 0.68, d) + smoothstep(0.6, 0.0, d) * 0.45;
  gl_FragColor = vec4(uColor * a * 1.35 * uAlpha * uFade, 1.0);
}`,
  fissure: `uniform float uLog;
void main() {
  vec2 p = vUv;
  if (uLog > 0.5) p = vec2(p.y, p.x);
  float d = min(min(segDist(p, vec2(0.52, 0.18), vec2(0.44, 0.40)), segDist(p, vec2(0.44, 0.40), vec2(0.58, 0.58))),
    min(segDist(p, vec2(0.58, 0.58), vec2(0.47, 0.82)), segDist(p, vec2(0.44, 0.40), vec2(0.30, 0.47))));
  float core = smoothstep(0.035, 0.0, d);
  float glow = exp(-d * 22.0) * (0.45 + 0.25 * sin(uTime * 2.2));
  vec3 c = vec3(1.0) * core * 0.85 + uColor * glow * 0.7;
  gl_FragColor = vec4(c * uAlpha, 1.0);
}`,
  veins: `uniform float uH;
void main() {
  vec2 p = vec2(vUv.x, (1.0 - vUv.y) * uH);
  float a = 0.0;
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float x = 0.22 + fi * 0.28 + 0.07 * sin(p.y * 3.1 + fi * 2.3) + 0.03 * sin(p.y * 9.0 + fi);
    float line = smoothstep(0.05, 0.0, abs(vUv.x - x));
    float flow = 0.55 + 0.45 * sin(p.y * 4.0 - uTime * 2.4 + fi * 1.7);
    a += line * flow;
  }
  float fade = smoothstep(0.0, 0.25, vUv.y) * smoothstep(1.0, 0.85, vUv.y);
  gl_FragColor = vec4(uColor * a * fade * 0.8 * uAlpha, 1.0);
}`,
  socket: `void main() {
  vec2 p = (vUv - 0.5) * 2.0;
  float d = hexDist(p * 1.1);
  float ring = smoothstep(0.12, 0.0, abs(d - 0.76)) + smoothstep(0.1, 0.0, abs(d - 0.42)) * 0.7;
  float fill = smoothstep(0.8, 0.2, d) * 0.18;
  float worn = 0.6 + 0.4 * noise(p * 5.0 + 3.0);
  float pulse = 0.7 + 0.3 * sin(uTime * 1.6);
  gl_FragColor = vec4(uColor * (ring * worn + fill) * pulse * 1.1 * uAlpha, 1.0);
}`,
  whirl: `uniform float uUp;
void main() {
  vec2 p = (vUv - 0.5) * 2.0;
  float r = length(p);
  float ang = atan(p.y, p.x);
  float a;
  if (uUp > 0.5) {
    float col = smoothstep(0.55, 0.0, abs(p.x));
    float bubbles = step(0.82, noise(vec2(p.x * 6.0, p.y * 5.0 + uTime * 3.0)));
    a = col * (0.25 + bubbles * 0.9) * smoothstep(1.0, 0.6, r);
  } else {
    float spiral = sin(ang * 3.0 + r * 9.0 - uTime * 4.0);
    a = smoothstep(0.55, 1.0, spiral) * smoothstep(1.0, 0.35, r) * smoothstep(0.05, 0.3, r);
    a += step(0.9, noise(vec2(ang * 3.0 + uTime, r * 8.0 - uTime * 2.0))) * smoothstep(1.0, 0.4, r) * 0.8;
  }
  gl_FragColor = vec4(uColor * a * 0.8 * uAlpha, 1.0);
}`,
  vent: `void main() {
  vec2 p = vec2((vUv.x - 0.5) * 2.0, 1.0 - vUv.y);
  float a = 0.0;
  for (int i = 0; i < 6; i++) {
    float fi = float(i);
    float t = fract(uTime * (0.35 + 0.08 * fi) + fi * 0.37);
    vec2 c = vec2(sin(fi * 2.1 + uTime) * 0.25, t);
    float rr = 0.07 + 0.04 * fract(fi * 0.61);
    float d = length((p - c) * vec2(1.0, 2.0));
    a += (smoothstep(rr, rr * 0.6, d) - smoothstep(rr * 0.6, rr * 0.2, d) * 0.6) * (1.0 - t);
  }
  float base = smoothstep(0.35, 0.0, p.y) * smoothstep(0.6, 0.0, abs(p.x)) * 0.5;
  gl_FragColor = vec4(uColor * (a + base) * uAlpha, 1.0);
}`,
  current: `void main() {
  vec2 p = vUv;
  float a = 0.0;
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float x = fract(p.x - uTime * 0.9 + fi / 3.0);
    float chev = smoothstep(0.08, 0.0, abs(x - 0.5 + abs(p.y - 0.5) * 0.6));
    a += chev * smoothstep(0.5, 0.2, abs(p.y - 0.5));
  }
  gl_FragColor = vec4(uColor * a * 0.55 * uAlpha, 1.0);
}`,
  bubble: `void main() {
  vec2 p = (vUv - 0.5) * 2.0;
  float r = length(p);
  float edge = smoothstep(0.08, 0.0, abs(r - 0.92)) * 0.9;
  float fill = smoothstep(1.0, 0.2, r) * 0.12;
  float hexes = smoothstep(0.08, 0.0, abs(fract(hexDist(p * 3.0) * 2.0 - uTime * 0.3) - 0.5)) * 0.1 * smoothstep(1.0, 0.5, r);
  float shine = smoothstep(0.35, 0.0, length(p - vec2(-0.4, -0.45))) * 0.35;
  float a = (edge + fill + hexes + shine) * (0.85 + 0.15 * sin(uTime * 2.0));
  gl_FragColor = vec4(uColor * a * uAlpha, 1.0);
}`,
  glint: `uniform float uBeat; uniform float uStrength;
void main() {
  vec2 p = (vUv - 0.5) * 2.0;
  float k = clamp(uBeat / 0.45, 0.0, 1.0);
  float env = sin(k * 3.14159);
  float star = exp(-abs(p.x) * 16.0) * exp(-abs(p.y) * 3.2) + exp(-abs(p.y) * 16.0) * exp(-abs(p.x) * 3.2);
  float core = exp(-dot(p, p) * 18.0);
  gl_FragColor = vec4(uColor * (star * 0.7 + core) * env * uStrength * uAlpha, 1.0);
}`,
};

// ------------------------------------------------------------ fábricas
/** Hexágonos que se disgregan (out) o convergen (in) una vez, en `frames` fotogramas. */
function hexBurst(layer, opts) {
  const group = new THREE.Group();
  const [cx, cy] = tileCenter(opts);
  group.position.set(cx, cy, 0);
  const count = Math.max(1, Math.min(64, opts.count ?? 18));
  const spread = (opts.spread ?? 2) * 32;
  const frames = opts.frames ?? 40;
  const color = colorOf(opts.color, GREEN);
  const inward = opts.mode === 'in';
  const parts = [];
  for (let i = 0; i < count; i++) {
    const m = quad(mat(FRAG.hex, {}, color), 1, 1);
    const ang = (i / count) * Math.PI * 2 + Math.random() * 0.6;
    const dist = spread * (0.45 + Math.random() * 0.55);
    parts.push({ m, ang, dist, size: 8 + Math.random() * 11, delay: Math.random() * 0.25, spin: (Math.random() - 0.5) * 4 });
    group.add(m);
  }
  const t0 = layer.time;
  group.userData.update = () => {
    const t = (layer.time - t0) * 60 / frames;
    for (const p of parts) {
      const k = Math.max(0, Math.min(1, (t - p.delay) / (1 - p.delay * 0.5)));
      const e = 1 - (1 - k) * (1 - k);
      const r = inward ? p.dist * (1 - e) : p.dist * e;
      p.m.position.set(Math.cos(p.ang) * r, Math.sin(p.ang) * r - (inward ? 0 : e * 10), 0);
      const s = p.size * (inward ? 0.6 + e * 0.6 : 1.2 - e * 0.7);
      p.m.scale.set(s, s, 1);
      p.m.rotation.z = p.spin * k;
      p.m.material.uniforms.uFade.value = inward ? Math.min(1, k * 2) * (k < 0.98 ? 1 : 0) : (k < 0.02 ? 0 : 1 - e * 0.85);
    }
  };
  layer.worldRoot.add(group);
  return group;
}

function fissure(layer, opts) {
  const group = new THREE.Group();
  const m = quad(mat(FRAG.fissure, { uLog: { value: opts.kind === 'log' ? 1 : 0 } }, colorOf(opts.color, GREEN)), 26, 26);
  m.position.set(0, 2, 0);
  group.add(m);
  layer.worldRoot.add(group);
  return group;
}

function veins(layer, opts) {
  const group = new THREE.Group();
  const h = Math.max(1, opts.h ?? 1);
  const m = quad(mat(FRAG.veins, { uH: { value: h } }, colorOf(opts.color, GREEN)), 28, 32 * h);
  m.position.set(0, 16 - 16 * h, 0);
  group.add(m);
  layer.worldRoot.add(group);
  return group;
}

function simple(frag, size, color, extra = {}, offsetY = 0) {
  return (layer, opts) => {
    const group = new THREE.Group();
    const m = quad(mat(frag, extra, colorOf(opts.color, color)), size[0], size[1]);
    m.position.set(0, offsetY, 0);
    group.add(m);
    if (opts.x !== undefined && opts.event === undefined) group.position.set(...tileCenter(opts), 0);
    layer.worldRoot.add(group);
    return group;
  };
}

function whirl(layer, opts) {
  const up = Boolean(opts.up);
  const color = colorOf(opts.color, up ? new THREE.Color(0.5, 1, 0.8) : new THREE.Color(0.35, 0.6, 1));
  return simple(FRAG.whirl, up ? [30, 44] : [44, 44], color, { uUp: { value: up ? 1 : 0 } }, up ? -8 : 0)(layer, opts);
}

function vent(layer, opts) {
  const color = opts.kind === 'bolsa' ? new THREE.Color(0.75, 0.9, 1) : GREEN;
  return simple(FRAG.vent, [30, 60], color, {}, -14)(layer, opts);
}

function current(layer, opts) {
  const obj = simple(FRAG.current, [32, 26], new THREE.Color(0.55, 0.85, 1))(layer, opts);
  obj.children[0].rotation.z = ({ 6: 0, 2: Math.PI / 2, 4: Math.PI, 8: -Math.PI / 2 })[opts.dir] ?? 0;
  return obj;
}

/** Efecto que sigue a un personaje (opts.target: realX/realY en px del mapa; opts.dy: altura del centro). */
function follow(frag, sizeOf, color, extra = () => ({}), perFrame = null) {
  return (layer, opts) => {
    const group = new THREE.Group();
    const m = quad(mat(frag, extra(opts), colorOf(opts.color, color)), 1, 1);
    group.add(m);
    group.userData.update = () => {
      const t = opts.target;
      if (t) group.position.set(t.realX + 16, t.realY + (opts.dy ?? 14) - (t.bobHeight || 0) + (t.yOffset || 0), 0);
      const s = sizeOf(opts);
      m.scale.set(s, s, 1);
      group.visible = !t || (t.opacity > 0 && !t.transparent);
      perFrame?.(m, layer, opts);
    };
    group.userData.update();
    layer.worldRoot.add(group);
    return group;
  };
}

const STRIP_FRAG = /* glsl */`
precision highp float;
uniform sampler2D map; uniform vec4 uRect; uniform float uAlpha; uniform float uFade; uniform float uTime; uniform float uReady;
varying vec2 vUv;
void main() {
  vec4 c = texture2D(map, mix(uRect.xy, uRect.zw, vUv));
  c.a *= uAlpha * uFade * uReady;
  if (c.a < 0.004) discard;
  gl_FragColor = c;
}`;

/**
 * Tira de fotogramas (arte propio, p. ej. `assets/characters/protagonista_m_vuelo.png`: 8 × 96 px) sobre una
 * casilla o un personaje: opts { url, target | x, y, frames = 8, frameW = 96, frameH = 96, ticks = 4, reverse }.
 * Se queda en el último fotograma hasta remove().
 */
function strip(layer, opts) {
  const group = new THREE.Group();
  const fw = opts.frameW ?? 96;
  const fh = opts.frameH ?? 96;
  const frames = Math.max(1, opts.frames ?? 8);
  const material = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: STRIP_FRAG,
    uniforms: {
      map: { value: null }, uRect: { value: new THREE.Vector4(0, 0, 1 / frames, 1) }, uAlpha: { value: 1 },
      uFade: { value: 1 }, uTime: { value: 0 }, uReady: { value: 0 },
    },
    transparent: true, depthTest: false, depthWrite: false, side: THREE.DoubleSide,
  });
  const m = quad(material, fw, fh);
  m.position.set(0, 16 - fh / 2, 0); // pies en el borde inferior de la casilla
  group.add(m);
  if (opts.url) {
    loadRawTexture(opts.url).then((tex) => { material.uniforms.map.value = tex; material.uniforms.uReady.value = 1; })
      .catch((err) => console.warn('[zygarde] tira de efecto no disponible', opts.url, err));
  }
  const t0 = layer.time;
  group.userData.update = () => {
    const t = opts.target;
    if (t) group.position.set(t.realX + 16, t.realY + 16, 0);
    else group.position.set(...tileCenter(opts), 0);
    let f = Math.min(frames - 1, Math.floor(((layer.time - t0) * 60) / (opts.ticks ?? 4)));
    if (opts.reverse) f = frames - 1 - f;
    material.uniforms.uRect.value.set(f / frames, 0, (f + 1) / frames, 1);
  };
  group.userData.update();
  layer.worldRoot.add(group);
  return group;
}

registerEffect('zygardeStrip', strip);
registerEffect('zygardeHexBurst', hexBurst);
registerEffect('zygardeFissure', fissure);
registerEffect('zygardeVeins', veins);
registerEffect('zygardeSocket', simple(FRAG.socket, [30, 30], new THREE.Color(0.4, 1, 0.55)));
registerEffect('zygardeWhirl', whirl);
registerEffect('zygardeVent', vent);
registerEffect('zygardeCurrent', current);
registerEffect('zygardeBubble', follow(FRAG.bubble, (o) => o.size ?? 88, new THREE.Color(0.4, 1, 0.55)));
registerEffect('zygardeGlint', follow(FRAG.glint, (o) => o.size ?? 22, new THREE.Color(0.85, 1, 0.8),
  () => ({ uBeat: { value: 99 }, uStrength: { value: 0 } }),
  (m, layer, opts) => {
    m.material.uniforms.uBeat.value = opts.beatAt === undefined ? 99 : layer.time - opts.beatAt;
    m.material.uniforms.uStrength.value = opts.strength ?? 0;
  }));

export const ZYGARDE_EFFECTS = Object.freeze(['zygardeStrip', 'zygardeHexBurst', 'zygardeFissure', 'zygardeVeins', 'zygardeSocket',
  'zygardeWhirl', 'zygardeVent', 'zygardeCurrent', 'zygardeBubble', 'zygardeGlint']);
