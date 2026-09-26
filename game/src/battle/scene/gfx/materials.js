// Materiales y geometrías Three.js de la escena de combate. Todas las texturas son "crudas"
// (NoColorSpace, ver render/textures.js) y los colores se pasan como vec3 0..1 sin gestión de color,
// igual que el resto del render del juego (pixel-perfect).
import * as THREE from 'three';

const VERT = /* glsl */`
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

// Sprite de combate: recorte (uRect), opacidad, mezcla de color (destello/silueta), tono aditivo,
// recorte inferior (hundirse al debilitarse) y franjas animadas (subida/bajada de características).
const SPRITE_FRAG = /* glsl */`
precision highp float;
uniform sampler2D map;
uniform vec4 uRect;
uniform float uOpacity;
uniform vec4 uColor;
uniform vec3 uTone;
uniform float uGray;
uniform float uClipV;
uniform vec4 uStripe;
uniform float uStripeT;
uniform float uSilhouette;
varying vec2 vUv;
void main() {
  if (vUv.y > uClipV) discard;
  vec4 c = texture2D(map, mix(uRect.xy, uRect.zw, vUv));
  if (c.a < 0.01) discard;
  if (uSilhouette > 0.5) { gl_FragColor = vec4(0.0, 0.0, 0.0, uOpacity); return; }
  if (uGray > 0.0) c.rgb = mix(c.rgb, vec3(dot(c.rgb, vec3(0.299, 0.587, 0.114))), uGray);
  c.rgb += uTone;
  if (uStripe.a > 0.0) {
    // Franjas finas que se desplazan (subida/bajada de características, estados)
    float ph = fract(vUv.y * 9.0 + uStripeT);
    float band = smoothstep(0.0, 0.25, ph) * (1.0 - smoothstep(0.45, 0.7, ph));
    band = floor(band * 3.0 + 0.5) / 3.0;
    c.rgb = mix(c.rgb, uStripe.rgb, uStripe.a * (0.18 + 0.5 * band));
  }
  c.rgb = mix(c.rgb, uColor.rgb, uColor.a);
  gl_FragColor = vec4(clamp(c.rgb, 0.0, 1.0), c.a * uOpacity);
}`;

// Partícula: textura (o recorte de hoja de animación) teñida por color y alfa.
const PARTICLE_FRAG = /* glsl */`
precision highp float;
uniform sampler2D map;
uniform vec4 uRect;
uniform vec3 uColor;
uniform float uAlpha;
varying vec2 vUv;
void main() {
  vec4 c = texture2D(map, mix(uRect.xy, uRect.zw, vUv));
  if (c.a < 0.01) discard;
  gl_FragColor = vec4(c.rgb * uColor, c.a * uAlpha);
}`;

// Haz de energía (rayos): núcleo blanco + halo de color con ondulación.
const BEAM_FRAG = /* glsl */`
precision highp float;
uniform vec3 uColor;
uniform float uAlpha;
uniform float uTime;
varying vec2 vUv;
void main() {
  float d = abs(vUv.y - 0.5) * 2.0;
  float wob = 0.08 * sin(vUv.x * 40.0 - uTime * 18.0);
  float core = smoothstep(0.35 + wob, 0.0, d);
  float glow = smoothstep(1.0, 0.2, d);
  vec3 col = mix(uColor, vec3(1.0), core);
  float a = max(core, glow * 0.75);
  a = floor(a * 6.0) / 6.0;
  gl_FragColor = vec4(col, a * uAlpha);
}`;

// Relleno plano (overlays de campo, bases dibujadas, flashes locales).
const FLAT_FRAG = /* glsl */`
precision highp float;
uniform vec3 uColor;
uniform float uAlpha;
void main() { gl_FragColor = vec4(uColor, uAlpha); }`;

// Fondo con tono aditivo (noche) y mosaico espejado para los movimientos de cámara.
const BG_FRAG = /* glsl */`
precision highp float;
uniform sampler2D map;
uniform vec3 uTone;
uniform float uAlpha;
varying vec2 vUv;
void main() {
  vec4 c = texture2D(map, vUv);
  gl_FragColor = vec4(clamp(c.rgb + uTone, 0.0, 1.0), uAlpha);
}`;

function mat(frag, uniforms, blending = THREE.NormalBlending) {
  return new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: frag,
    uniforms,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending,
  });
}

export function spriteMaterial(tex = null) {
  return mat(SPRITE_FRAG, {
    map: { value: tex },
    uRect: { value: new THREE.Vector4(0, 0, 1, 1) },
    uOpacity: { value: 1 },
    uColor: { value: new THREE.Vector4(1, 1, 1, 0) },
    uTone: { value: new THREE.Vector3(0, 0, 0) },
    uGray: { value: 0 },
    uClipV: { value: 1.01 },
    uStripe: { value: new THREE.Vector4(0, 0, 0, 0) },
    uStripeT: { value: 0 },
    uSilhouette: { value: 0 },
  });
}

export function particleMaterial(tex = null, additive = false) {
  return mat(PARTICLE_FRAG, {
    map: { value: tex },
    uRect: { value: new THREE.Vector4(0, 0, 1, 1) },
    uColor: { value: new THREE.Vector3(1, 1, 1) },
    uAlpha: { value: 1 },
  }, additive ? THREE.AdditiveBlending : THREE.NormalBlending);
}

export function beamMaterial() {
  return mat(BEAM_FRAG, {
    uColor: { value: new THREE.Vector3(1, 1, 1) },
    uAlpha: { value: 1 },
    uTime: { value: 0 },
  }, THREE.AdditiveBlending);
}

export function flatMaterial(color = [1, 1, 1], alpha = 1, additive = false) {
  return mat(FLAT_FRAG, {
    uColor: { value: new THREE.Vector3(...color) },
    uAlpha: { value: alpha },
  }, additive ? THREE.AdditiveBlending : THREE.NormalBlending);
}

export function backgroundMaterial(tex) {
  return mat(BG_FRAG, {
    map: { value: tex },
    uTone: { value: new THREE.Vector3(0, 0, 0) },
    uAlpha: { value: 1 },
  });
}

const SPRITE_BLENDS = {
  0: { blending: THREE.NormalBlending },
  1: { blending: THREE.AdditiveBlending },
  // Resta de RGSS (blend_type 2): destino − origen·alfa
  2: { blending: THREE.CustomBlending, blendEquation: THREE.ReverseSubtractEquation, blendSrc: THREE.SrcAlphaFactor, blendDst: THREE.OneFactor },
};

/** Modo de mezcla de RGSS (0 normal, 1 suma, 2 resta) en un material de sprite. */
export function setSpriteBlend(material, type = 0) {
  const key = SPRITE_BLENDS[type] ? type : 0;
  if (material.userData.blend === key) return;
  const b = SPRITE_BLENDS[key];
  material.blending = b.blending;
  if (b.blendEquation !== undefined) {
    material.blendEquation = b.blendEquation;
    material.blendSrc = b.blendSrc;
    material.blendDst = b.blendDst;
  }
  material.userData.blend = key;
  material.needsUpdate = true;
}

/** Quad con origen abajo-centro (y hacia abajo, v = 0 arriba). */
export function bottomQuad() {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-0.5, -1, 0, 0.5, -1, 0, -0.5, 0, 0, 0.5, 0, 0]), 3));
  g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), 2));
  g.setIndex([0, 2, 1, 1, 2, 3]);
  return g;
}

/** Quad centrado (y hacia abajo, v = 0 arriba). */
export function centerQuad() {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-0.5, -0.5, 0, 0.5, -0.5, 0, -0.5, 0.5, 0, 0.5, 0.5, 0]), 3));
  g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), 2));
  g.setIndex([0, 2, 1, 1, 2, 3]);
  return g;
}

/** Quad que va de x=0 a x=1 (para haces: se escala en x por la longitud y se rota). */
export function beamQuad() {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, -0.5, 0, 1, -0.5, 0, 0, 0.5, 0, 1, 0.5, 0]), 3));
  g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), 2));
  g.setIndex([0, 2, 1, 1, 2, 3]);
  return g;
}

export const GEOM = {
  bottom: bottomQuad(),
  center: centerQuad(),
  beam: beamQuad(),
};

/** Color [r,g,b] 0..255 → array 0..1. */
export const rgb = (c) => [c[0] / 255, c[1] / 255, c[2] / 255];
