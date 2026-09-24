// Composición final del mapa en dos pasadas:
//  1) mundo → rtWorld; pasada de TONO (tono RMXP con gris, oscuridad de cueva con luces) → rtFinal
//  2) efectos luminosos/overlays se dibujan sobre rtFinal; pasada FINAL (destello, fundido,
//     transiciones de combate/mapa) → pantalla.
import * as THREE from 'three';
import { SCREEN_W, SCREEN_H } from '../core/engine.js';
import { TRANSITION_GLSL, TRANSITIONS } from './transitionShaders.js';

export const MAX_LIGHTS = 16;

const QUAD_VERT = /* glsl */`
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const TONE_FRAG = /* glsl */`
precision highp float;
uniform sampler2D tWorld;
uniform vec4 uTone;
uniform float uDark;
uniform vec4 uDarkColor;
uniform vec4 uLights[${MAX_LIGHTS}];
uniform int uLightCount;
varying vec2 vUv;
void main() {
  vec4 c = texture2D(tWorld, vUv);
  float luma = dot(c.rgb, vec3(0.299, 0.587, 0.114));
  c.rgb = mix(c.rgb, vec3(luma), uTone.w);
  c.rgb += uTone.rgb;
  if (uDark > 0.0) {
    vec2 p = vec2(vUv.x * ${SCREEN_W}.0, (1.0 - vUv.y) * ${SCREEN_H}.0);
    float lit = 0.0;
    for (int i = 0; i < ${MAX_LIGHTS}; i++) {
      if (i >= uLightCount) break;
      vec4 L = uLights[i];
      float d = distance(p, L.xy);
      float inner = L.z * 0.55;
      lit = max(lit, (1.0 - smoothstep(inner, L.z, d)) * L.w);
    }
    // Bandas suaves (4 niveles) como la oscuridad por pasos de Essentials
    lit = floor(lit * 4.0 + 0.5) / 4.0;
    c.rgb = mix(c.rgb, uDarkColor.rgb, uDark * (1.0 - lit));
  }
  gl_FragColor = vec4(clamp(c.rgb, 0.0, 1.0), 1.0);
}`;

const FINAL_FRAG = /* glsl */`
precision highp float;
uniform sampler2D tFinal;
uniform vec4 uFlash;
uniform vec4 uFade;
uniform int uTrans;
uniform float uT;
uniform vec2 uCenter;
uniform float uSeed;
varying vec2 vUv;
${TRANSITION_GLSL}
void main() {
  vec2 p = vec2(vUv.x * ${SCREEN_W}.0, (1.0 - vUv.y) * ${SCREEN_H}.0);
  vec4 c = transitionColor(tFinal, p, uTrans, uT, uCenter, uSeed);
  c.rgb = mix(c.rgb, uFlash.rgb, uFlash.a);
  c.rgb = mix(c.rgb, uFade.rgb, uFade.a);
  gl_FragColor = vec4(c.rgb, 1.0);
}`;

function makeRT() {
  return new THREE.WebGLRenderTarget(SCREEN_W, SCREEN_H, {
    minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: false, stencilBuffer: false,
    generateMipmaps: false, colorSpace: THREE.NoColorSpace,
  });
}

function fullScreen(material) {
  const scene = new THREE.Scene();
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  mesh.frustumCulled = false;
  scene.add(mesh);
  return { scene, mesh };
}

export class Compositor {
  constructor() {
    this.rtWorld = makeRT();
    this.rtFinal = makeRT();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.lights = Array.from({ length: MAX_LIGHTS }, () => new THREE.Vector4());
    this.toneMat = new THREE.ShaderMaterial({
      vertexShader: QUAD_VERT,
      fragmentShader: TONE_FRAG,
      uniforms: {
        tWorld: { value: this.rtWorld.texture },
        uTone: { value: new THREE.Vector4() },
        uDark: { value: 0 },
        uDarkColor: { value: new THREE.Vector4(0, 0, 0, 1) },
        uLights: { value: this.lights },
        uLightCount: { value: 0 },
      },
      depthTest: false,
      depthWrite: false,
    });
    this.finalMat = new THREE.ShaderMaterial({
      vertexShader: QUAD_VERT,
      fragmentShader: FINAL_FRAG,
      uniforms: {
        tFinal: { value: this.rtFinal.texture },
        uFlash: { value: new THREE.Vector4(1, 1, 1, 0) },
        uFade: { value: new THREE.Vector4(0, 0, 0, 0) },
        uTrans: { value: 0 },
        uT: { value: 0 },
        uCenter: { value: new THREE.Vector2(SCREEN_W / 2, SCREEN_H / 2) },
        uSeed: { value: 0 },
      },
      depthTest: false,
      depthWrite: false,
    });
    this.tonePass = fullScreen(this.toneMat);
    this.finalPass = fullScreen(this.finalMat);
  }

  /** Tono RMXP [r, g, b, gris] en -255..255 / 0..255. */
  setTone([r, g, b, gray]) {
    this.toneMat.uniforms.uTone.value.set(r / 255, g / 255, b / 255, gray / 255);
  }

  /** Oscuridad 0..1 con luces [{ x, y, radius, intensity }] en px de pantalla. */
  setDarkness(amount, lights = [], color = [0, 0, 0]) {
    const u = this.toneMat.uniforms;
    u.uDark.value = amount;
    u.uDarkColor.value.set(color[0] / 255, color[1] / 255, color[2] / 255, 1);
    const n = Math.min(MAX_LIGHTS, lights.length);
    for (let i = 0; i < n; i++) this.lights[i].set(lights[i].x, lights[i].y, lights[i].radius, lights[i].intensity ?? 1);
    u.uLightCount.value = n;
  }

  setFlash(r, g, b, a) { this.finalMat.uniforms.uFlash.value.set(r / 255, g / 255, b / 255, a); }
  setFade(r, g, b, a) { this.finalMat.uniforms.uFade.value.set(r / 255, g / 255, b / 255, a); }

  setTransition(name, t, opts = {}) {
    const u = this.finalMat.uniforms;
    u.uTrans.value = name ? (TRANSITIONS[name] ?? 1) : 0;
    u.uT.value = t;
    if (opts.center) u.uCenter.value.set(opts.center.x, opts.center.y);
    if (opts.seed !== undefined) u.uSeed.value = opts.seed;
  }

  /**
   * @param renderer THREE.WebGLRenderer
   * @param drawWorld (renderer) => void   dibuja el mundo (va a rtWorld)
   * @param drawGlow  (renderer) => void   dibuja luces/overlays tras el tono (va a rtFinal)
   */
  render(renderer, drawWorld, drawGlow) {
    const prevClear = renderer.getClearAlpha();
    renderer.setRenderTarget(this.rtWorld);
    renderer.setClearColor(0x000000, 1);
    renderer.clear();
    drawWorld(renderer);
    renderer.setRenderTarget(this.rtFinal);
    renderer.clear();
    renderer.render(this.tonePass.scene, this.camera);
    drawGlow?.(renderer);
    renderer.setRenderTarget(null);
    renderer.render(this.finalPass.scene, this.camera);
    renderer.setClearColor(0x000000, prevClear);
  }

  dispose() {
    this.rtWorld.dispose();
    this.rtFinal.dispose();
    this.toneMat.dispose();
    this.finalMat.dispose();
    this.tonePass.mesh.geometry.dispose();
    this.finalPass.mesh.geometry.dispose();
  }
}
