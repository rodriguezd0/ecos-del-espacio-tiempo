// Clima del overworld (port simplificado de RPG::Weather / GameData::Weather de Essentials):
// partículas en pantalla con los gráficos de Graphics/Weather, capas en mosaico que se desplazan,
// tono por intensidad y relámpagos en tormenta. También nieblas de mapa (Graphics/Fogs).
import * as THREE from 'three';
import { engine, SCREEN_W, SCREEN_H } from '../core/engine.js';
import { tryRawTexture, loadRepeatTexture } from './textures.js';
import { spriteMaterial } from './characterSprite.js';

const MAX_SPRITES = 60;
export const WEATHER = {
  none: {},
  rain: { particles: ['rain_1', 'rain_2', 'rain_3'], splash: 'rain_4', dx: -600, dy: 2400, tone: (s) => [-s / 2, -s / 2, -s / 2, 10] },
  storm: { particles: ['storm_1', 'storm_2', 'storm_3'], splash: 'storm_4', dx: -3600, dy: 3600, tone: (s) => [-s * 0.75, -s * 0.75, -s * 0.75, 10], lightning: true },
  heavyRain: { particles: ['storm_1', 'storm_2', 'storm_3'], splash: 'storm_4', dx: -3600, dy: 3600, tone: (s) => [-s * 0.75, -s * 0.75, -s * 0.75, 10] },
  snow: { particles: ['hail_1', 'hail_2', 'hail_3'], dx: -240, dy: 240, tone: (s) => [s / 2, s / 2, s / 2, 0], sway: true },
  blizzard: { particles: ['blizzard_1', 'blizzard_2', 'blizzard_3', 'blizzard_4'], tile: 'blizzard_tile', dx: -720, dy: 240, tdx: -1200, tdy: 600, tone: (s) => [s * 0.75, s * 0.75, s * 0.75, 0] },
  sandstorm: { particles: ['sandstorm_1', 'sandstorm_2', 'sandstorm_3', 'sandstorm_4'], tile: 'sandstorm_tile', dx: -1200, dy: 640, tdx: -800, tdy: 400, tone: (s) => [s / 2, 0, -s / 2, 0] },
  fog: { tile: 'fog_tile', tdx: -32, tdy: 0, tileOpacity: 0.8 },
  sun: { tone: () => [64, 64, 32, 0], pulse: true },
};
export const WEATHER_TYPES = Object.keys(WEATHER);

const TILE_VERT = /* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const TILE_FRAG = /* glsl */`
precision highp float;
uniform sampler2D map; uniform vec2 uOffset; uniform vec2 uScale; uniform float uOpacity;
varying vec2 vUv;
void main(){
  vec2 p = vec2(vUv.x * ${SCREEN_W}.0, (1.0 - vUv.y) * ${SCREEN_H}.0);
  vec4 c = texture2D(map, fract((p + uOffset) / uScale));
  c.a *= uOpacity;
  if (c.a < 0.004) discard;
  gl_FragColor = c;
}`;

function tileLayer() {
  const mat = new THREE.ShaderMaterial({
    vertexShader: TILE_VERT,
    fragmentShader: TILE_FRAG,
    uniforms: { map: { value: null }, uOffset: { value: new THREE.Vector2() }, uScale: { value: new THREE.Vector2(256, 256) }, uOpacity: { value: 0 } },
    transparent: true, depthTest: false, depthWrite: false,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  mesh.frustumCulled = false;
  mesh.visible = false;
  return mesh;
}

export class WeatherLayer {
  constructor({ playSE, flash } = {}) {
    this.scene = new THREE.Scene();
    this.root = new THREE.Group();
    this.root.scale.y = -1;
    this.scene.add(this.root);
    this.camera = new THREE.OrthographicCamera(0, SCREEN_W, 0, -SCREEN_H, -10, 10);
    this.fogMesh = tileLayer();
    this.fogMesh.renderOrder = 10;
    this.tileMesh = tileLayer();
    this.tileMesh.renderOrder = 20;
    this.scene.add(this.fogMesh, this.tileMesh);
    this.type = 'none';
    this.power = 0;
    this.strength = 0; // 0..60 (como Essentials)
    this.particles = [];
    this.textures = {};
    this.tileOffset = new THREE.Vector2();
    this.fogOffset = new THREE.Vector2();
    this.mapFog = null;
    this.playSE = playSE || (() => {});
    this.flash = flash || (() => {});
    this.lightningTimer = 120;
    this.time = 0;
  }

  async texture(name) {
    if (!(name in this.textures)) this.textures[name] = await tryRawTexture(engine.assets.anil(`Graphics/Weather/${name}.png`));
    return this.textures[name];
  }

  /** Cambia el clima: tipo de WEATHER, potencia 0..9. */
  async set(type = 'none', power = 5) {
    const def = WEATHER[type];
    if (!def) throw new Error(`Clima desconocido "${type}" (usa ${WEATHER_TYPES.join(', ')})`);
    this.type = type;
    this.power = Math.max(0, Math.min(9, power));
    for (const p of this.particles) p.mesh.removeFromParent();
    this.particles = [];
    const count = def.particles ? Math.round((this.power / 9) * MAX_SPRITES) : 0;
    const texs = def.particles ? await Promise.all(def.particles.map((n) => this.texture(n))) : [];
    if (this.type !== type) return;
    for (let i = 0; i < count; i++) {
      const tex = texs[i % texs.length];
      if (!tex) continue;
      const mat = spriteMaterial(tex);
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
      mesh.frustumCulled = false;
      mesh.scale.set(tex.image.width, tex.image.height, 1);
      mesh.renderOrder = 30;
      this.root.add(mesh);
      const p = { mesh, x: Math.random() * (SCREEN_W + 200), y: Math.random() * SCREEN_H, life: 0, speed: 0.7 + Math.random() * 0.6 };
      this.particles.push(p);
    }
    if (def.tile) {
      const t = await loadRepeatTexture(engine.assets.anil(`Graphics/Weather/${def.tile}.png`)).catch(() => null);
      this.tileMesh.material.uniforms.map.value = t;
      if (t) this.tileMesh.material.uniforms.uScale.value.set(t.image.width, t.image.height);
      this.tileMesh.visible = Boolean(t);
    } else {
      this.tileMesh.visible = false;
    }
  }

  /** Niebla de mapa (Graphics/Fogs): { name, opacity 0..255, sx, sy (px/s), zoom } o null. */
  async setMapFog(fog) {
    this.mapFog = fog || null;
    if (!fog) { this.fogMesh.visible = false; return; }
    const t = await loadRepeatTexture(engine.assets.anil(`Graphics/Fogs/${fog.name}.png`)).catch(() => null);
    if (!t) { this.fogMesh.visible = false; return; }
    const u = this.fogMesh.material.uniforms;
    u.map.value = t;
    u.uScale.value.set(t.image.width * (fog.zoom || 1), t.image.height * (fog.zoom || 1));
    u.uOpacity.value = (fog.opacity ?? 64) / 255;
    if (fog.blend === 'add') this.fogMesh.material.blending = THREE.AdditiveBlending;
    this.fogMesh.visible = true;
  }

  /** Tono que aporta el clima. */
  tone() {
    const def = WEATHER[this.type];
    if (!def.tone) return [0, 0, 0, 0];
    const t = def.tone(this.strength);
    if (def.pulse) {
      const k = 0.5 + 0.5 * Math.sin(this.time * 1.2);
      return t.map((v, i) => (i < 3 ? v * k : v));
    }
    return t;
  }

  /** dt en segundos; camDX/camDY = desplazamiento de cámara en px este fotograma. */
  update(dt, camDX = 0, camDY = 0) {
    this.time += dt;
    const def = WEATHER[this.type];
    const target = def.tone ? Math.round((this.power / 9) * MAX_SPRITES) : 0;
    this.strength += Math.sign(target - this.strength) * Math.min(Math.abs(target - this.strength), 1);
    for (const p of this.particles) {
      p.x += (def.dx * p.speed * dt) - camDX;
      p.y += (def.dy * p.speed * dt) - camDY;
      if (def.sway) p.x += Math.sin(this.time * 2 + p.speed * 10) * 0.6;
      if (p.y > SCREEN_H + 20 || p.x < -40 || p.x > SCREEN_W + 240 || p.y < -60) {
        p.x = Math.random() * (SCREEN_W + 200);
        p.y = -20 - Math.random() * 60;
      }
      p.mesh.position.set(Math.round(p.x), Math.round(p.y), 0);
    }
    if (this.tileMesh.visible && def.tile) {
      this.tileOffset.x -= (def.tdx || 0) * dt - camDX;
      this.tileOffset.y -= (def.tdy || 0) * dt - camDY;
      const u = this.tileMesh.material.uniforms;
      u.uOffset.value.copy(this.tileOffset);
      u.uOpacity.value = (def.tileOpacity ?? 0.9) * (this.strength / MAX_SPRITES || (this.type === 'fog' ? this.power / 9 : 0));
    }
    if (this.fogMesh.visible && this.mapFog) {
      this.fogOffset.x -= (this.mapFog.sx || 0) * dt - camDX;
      this.fogOffset.y -= (this.mapFog.sy || 0) * dt - camDY;
      this.fogMesh.material.uniforms.uOffset.value.copy(this.fogOffset);
    }
    if (def.lightning) {
      this.lightningTimer -= 1;
      if (this.lightningTimer <= 0) {
        this.lightningTimer = 120 + Math.floor(Math.random() * 360);
        this.flash([255, 255, 255], 200, 10);
        this.playSE('Thunder4');
      }
    }
  }

  render(renderer) {
    if (this.type === 'none' && !this.fogMesh.visible) return;
    renderer.render(this.scene, this.camera);
  }

  dispose() {
    for (const p of this.particles) { p.mesh.geometry.dispose(); p.mesh.material.dispose(); }
    this.fogMesh.material.dispose();
    this.tileMesh.material.dispose();
  }
}
