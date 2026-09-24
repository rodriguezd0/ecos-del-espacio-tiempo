// Escenario propio del prólogo (Scene con Three.js) para los planos que no ocurren sobre un mapa jugable:
//   'distortion'  Mundo Distorsión (P-01): fondo Battlebacks/MundoDistorsion_bg con deriva y ondulación,
//                 rocas flotantes (game/assets/objects/prologo_rocas.png) y partículas violáceas.
//   'sky'         plano oscuro de la región con las estelas de la dispersión (P-04). Silueta PROVISIONAL (X02)
//                 generada con ui/logic/regionMapData.js.
//   'village'     vista nocturna de un pueblo pequeño entre bosques (tileset 7, construido con el MapBuilder;
//                 NO es el trazado de Villa Alba) donde cae uno de los núcleos.
// Las secuencias (content/cutscenes/prologueP01.js, prologueFinale.js) manipulan sus piezas; el Director
// (vía CineOverlay) llama a update() una o varias veces por fotograma.
import * as THREE from 'three';
import { engine, SCREEN_W, SCREEN_H } from '../../core/engine.js';
import { Scene } from '../../core/scenes.js';
import { loadRawTexture, rawTexture } from '../../render/textures.js';
import { SpriteStrip, ParticleField, GlowQuad, Beam, Ring, Rift, GfxSet, rand } from './cineGfx.js';
import { buildRegionCanvas } from './regionCanvas.js';

const BG_VERT = /* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const BG_FRAG = /* glsl */`
precision highp float;
uniform sampler2D map; uniform float uTime; uniform float uWarp; uniform float uBright; uniform vec3 uTint;
varying vec2 vUv;
void main(){
  vec2 uv = vUv;
  float row = floor(uv.y * 192.0);
  uv.x += sin(row * 0.21 + uTime * 1.4) * uWarp * (0.25 + uv.y) / 560.0;
  uv.y += sin(floor(uv.x * 128.0) * 0.13 + uTime * 0.9) * uWarp * 0.35 / 420.0;
  vec4 c = texture2D(map, clamp(uv, 0.001, 0.999));
  gl_FragColor = vec4(clamp(c.rgb * uBright + uTint, 0.0, 1.0), 1.0);
}`;

const FILL_FRAG = /* glsl */`precision highp float; uniform vec3 uColor; uniform float uAlpha; void main(){ gl_FragColor = vec4(uColor, uAlpha); }`;

const ROCKS_URL = 'assets/objects/prologo_rocas.png';

function fullQuad(color, order) {
  const mat = new THREE.ShaderMaterial({
    vertexShader: 'void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: FILL_FRAG,
    uniforms: { uColor: { value: new THREE.Color(color) }, uAlpha: { value: 0 } },
    transparent: true, depthTest: false, depthWrite: false,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = order;
  return mesh;
}

export default class PrologueStage extends Scene {
  async enter() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(0, SCREEN_W, 0, -SCREEN_H, -10, 10);
    this.root = new THREE.Group();
    this.root.scale.y = -1;
    this.scene.add(this.root);
    this.layers = {};
    for (const name of ['bg', 'back', 'actors', 'glow', 'front']) {
      const g = new THREE.Group();
      this.layers[name] = g;
      this.root.add(g);
    }
    this.layers.glow.renderOrder = 10;
    this.gfx = new GfxSet();
    this.time = 0;
    this.mode = 'black';
    this.cam = { x: 0, y: 0 };
    this.shakeState = null;
    this.flash = { color: [255, 255, 255], a: 0, decay: 0.05 };
    this.fade = { a: 1 };
    this.bg = { bright: 1, warp: 6, driftX: 0, driftY: 0, zoom: 1 };
    this.overlay = new THREE.Scene();
    this.overlayCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.flashMesh = fullQuad(0xffffff, 1);
    this.fadeMesh = fullQuad(0x000000, 2);
    this.overlay.add(this.flashMesh, this.fadeMesh);
    this.rocks = [];
    this.motes = null;
    await this.buildDistortion();
  }

  exit() {
    this.gfx?.dispose();
    for (const r of this.rocks) r.sprite.dispose();
    this.rocks = [];
    this.bgMesh?.geometry.dispose();
    this.bgMesh?.material.dispose();
    this.regionMesh?.geometry.dispose();
    this.regionMesh?.material.dispose();
    this.regionTex?.dispose();
    this.village?.dispose?.();
    this.flashMesh.material.dispose();
    this.fadeMesh.material.dispose();
  }

  // ───────────────────────────── construcción ─────────────────────────────

  async buildDistortion() {
    const tex = await loadRawTexture(engine.assets.anil('Graphics/Battlebacks/MundoDistorsion_bg.png'));
    const mat = new THREE.ShaderMaterial({
      vertexShader: BG_VERT,
      fragmentShader: BG_FRAG,
      uniforms: {
        map: { value: tex }, uTime: { value: 0 }, uWarp: { value: 6 }, uBright: { value: 1 },
        uTint: { value: new THREE.Vector3(0, 0, 0) },
      },
      depthTest: false, depthWrite: false, side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
    mesh.frustumCulled = false;
    mesh.renderOrder = -100;
    this.bgMesh = mesh;
    this.layers.bg.add(mesh);
    // Rocas flotantes: detrás (pequeñas, lentas) y delante (grandes, rápidas).
    // [x, y, fotograma, escala (entera o 0.5 para lejanas), capa]
    const spots = [
      [70, 70, 1, 1, 'back'], [430, 52, 3, 1, 'back'], [180, 30, 1, 0.5, 'back'], [330, 96, 0, 0.5, 'back'],
      [470, 170, 1, 0.5, 'back'], [30, 190, 3, 0.5, 'back'], [52, 330, 2, 1, 'front'], [466, 312, 0, 1, 'front'],
    ];
    for (const [x, y, frame, scale, layer] of spots) {
      const s = new SpriteStrip(this.layers[layer], { url: ROCKS_URL, frameW: 64, frameH: 64, frame, scale, anchor: 'center', order: layer === 'front' ? 5000 : -50 });
      await s.load();
      this.rocks.push({ sprite: s, x, y, phase: rand(0, 6), speed: layer === 'front' ? 0.35 : 0.12, layer });
    }
    this.motes = new ParticleField(this.layers.glow, { max: 160, shape: 'square', order: 20 });
  }

  /** Cambia de plano ('distortion' | 'sky' | 'village' | 'black'). */
  async setMode(mode) {
    this.mode = mode;
    if (mode === 'sky' && !this.regionMesh) this.buildRegion();
    if (mode === 'village' && !this.village) await this.buildVillage();
    this.bgMesh.visible = mode === 'distortion';
    for (const r of this.rocks) r.sprite.mesh.visible = mode === 'distortion';
    if (this.regionMesh) this.regionMesh.visible = mode === 'sky';
    if (this.village) this.village.group.visible = mode === 'village';
    if (mode !== 'distortion') this.motes.clear();
    this.cam.x = 0;
    this.cam.y = 0;
  }

  buildRegion() {
    const { canvas, points } = buildRegionCanvas();
    this.regionPoints = points;
    this.regionTex = rawTexture(canvas);
    const mat = new THREE.ShaderMaterial({
      vertexShader: BG_VERT,
      fragmentShader: BG_FRAG,
      uniforms: {
        map: { value: this.regionTex }, uTime: { value: 0 }, uWarp: { value: 0 }, uBright: { value: 1 },
        uTint: { value: new THREE.Vector3(0, 0, 0) },
      },
      depthTest: false, depthWrite: false, side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
    mesh.frustumCulled = false;
    mesh.renderOrder = -100;
    mesh.scale.set(canvas.width, canvas.height, 1);
    mesh.position.set(SCREEN_W / 2, SCREEN_H / 2, 0);
    this.regionMesh = mesh;
    this.layers.bg.add(mesh);
  }

  async buildVillage() {
    const { buildVillageView } = await import('./prologueVillage.js');
    this.village = await buildVillageView(this.layers.bg);
  }

  // ───────────────────────────── piezas ─────────────────────────────

  async sprite(opts) {
    const s = new SpriteStrip(this.layers[opts.layer || 'actors'], opts);
    await s.load();
    return this.gfx.add(s);
  }

  particles(opts) { return this.gfx.add(new ParticleField(this.layers[opts?.layer || 'glow'], opts)); }
  glow(color, opts = {}) { return this.gfx.add(new GlowQuad(this.layers.glow, color, opts)); }
  beam(color, opts = {}) { return this.gfx.add(new Beam(this.layers.glow, color, opts)); }
  ring(color, opts = {}) { return this.gfx.add(new Ring(this.layers.glow, color, opts)); }
  rift(color, opts = {}) { return this.gfx.add(new Rift(this.layers.actors, color, opts)); }
  remove(item) { this.gfx.remove(item); }

  /** Destello de pantalla que se desvanece en `frames`. */
  flashScreen(color = [255, 255, 255], alpha = 1, frames = 12) {
    this.flash = { color, a: alpha, decay: alpha / Math.max(1, frames) };
  }

  /** Temblor: power en px, duración en fotogramas. */
  shake(power = 6, frames = 20) {
    this.shakeState = { power, frames, t: 0 };
  }

  // ───────────────────────────── bucle ─────────────────────────────

  update() {
    this.time += 1 / 60;
    this.gfx.update(1);
    if (this.mode === 'distortion') this.updateDistortion();
    this.village?.update?.(1);
    this.flash.a = Math.max(0, this.flash.a - this.flash.decay);
    let sx = 0;
    let sy = 0;
    const s = this.shakeState;
    if (s) {
      s.t += 1;
      const k = Math.max(0, 1 - s.t / s.frames);
      sx = Math.round(Math.sin(s.t * 1.9) * s.power * k);
      sy = Math.round(Math.cos(s.t * 2.7) * s.power * 0.5 * k);
      if (s.t >= s.frames) this.shakeState = null;
    }
    this.root.position.set(-Math.round(this.cam.x) + sx, Math.round(this.cam.y) + sy, 0);
  }

  updateDistortion() {
    const u = this.bgMesh.material.uniforms;
    u.uTime.value = this.time;
    u.uWarp.value = this.bg.warp;
    u.uBright.value = this.bg.bright;
    const z = this.bg.zoom;
    this.bgMesh.scale.set(560 * z, 420 * z, 1);
    this.bgMesh.position.set(SCREEN_W / 2 + Math.sin(this.time * 0.13) * 14 + this.bg.driftX, SCREEN_H / 2 + Math.sin(this.time * 0.09) * 8 + this.bg.driftY, 0);
    for (const r of this.rocks) {
      const s = r.sprite;
      s.x = r.x + Math.sin(this.time * r.speed + r.phase) * (r.layer === 'front' ? 18 : 8);
      s.y = r.y + Math.sin(this.time * r.speed * 1.7 + r.phase) * (r.layer === 'front' ? 10 : 5);
      s.update(1);
    }
    // polvo violáceo que asciende
    if (Math.random() < 0.5) {
      this.motes.spawn({
        x: rand(0, SCREEN_W), y: SCREEN_H + 4, vx: rand(-0.15, 0.15), vy: rand(-0.9, -0.35), size: 2 + Math.floor(rand(0, 2)) * 2,
        life: 300, color: Math.random() < 0.6 ? [150, 90, 230] : [230, 120, 150], alpha: rand(0.35, 0.8), fadeIn: 30,
      });
    }
    this.motes.update(1);
  }

  render(renderer) {
    if (!this.scene) return;
    this.flashMesh.material.uniforms.uColor.value.setRGB(this.flash.color[0] / 255, this.flash.color[1] / 255, this.flash.color[2] / 255);
    this.flashMesh.material.uniforms.uAlpha.value = this.flash.a;
    this.fadeMesh.material.uniforms.uAlpha.value = Math.max(0, Math.min(1, this.fade.a));
    const showWorld = this.mode !== 'black' && this.fade.a < 0.999;
    if (showWorld) renderer.render(this.scene, this.camera);
    renderer.render(this.overlay, this.overlayCam);
  }
}
