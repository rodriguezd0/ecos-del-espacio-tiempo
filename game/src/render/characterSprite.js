// Sprite de personaje (Sprite_Character de Essentials): fotograma por patrón y dirección, profundidad de
// arbusto (BushBitmap: corte con dos franjas semitransparentes), opacidad, sombra, salto y orden de dibujo.
import * as THREE from 'three';
import { loadCharset } from './charsets.js';
import { tryRawTexture } from './textures.js';
import { engine } from '../core/engine.js';
import { regularTileAtlasPos, TILE } from '../shared/autotile.js';

const VERT = /* glsl */`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const FRAG = /* glsl */`
precision highp float;
uniform sampler2D map;
uniform vec4 uRect;
uniform float uOpacity;
uniform float uBush;
uniform float uFrameH;
uniform vec4 uColor;
varying vec2 vUv;
void main() {
  vec4 c = texture2D(map, mix(uRect.xy, uRect.zw, vUv));
  if (uBush > 0.0) {
    float py = floor(vUv.y * uFrameH);
    float cy = uFrameH - uBush - 2.0;
    if (py >= cy + 4.0) c.a = 0.0;
    else if (py >= cy + 2.0) c.a *= 85.0 / 255.0;
    else if (py >= cy) c.a *= 170.0 / 255.0;
  }
  c.a *= uOpacity;
  c.rgb = mix(c.rgb, uColor.rgb, uColor.a);
  if (c.a < 0.004) discard;
  gl_FragColor = c;
}`;

/** Quad con origen abajo-centro en coordenadas y-abajo (uv v=0 arriba). */
export function anchoredQuad() {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-0.5, -1, 0, 0.5, -1, 0, -0.5, 0, 0, 0.5, 0, 0]), 3));
  g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), 2));
  g.setIndex([0, 2, 1, 1, 2, 3]);
  return g;
}

const QUAD = anchoredQuad();
let shadowTexPromise = null;

export function spriteMaterial(tex = null) {
  return new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: {
      map: { value: tex },
      uRect: { value: new THREE.Vector4(0, 0, 1, 1) },
      uOpacity: { value: 1 },
      uBush: { value: 0 },
      uFrameH: { value: 64 },
      uColor: { value: new THREE.Vector4(1, 1, 1, 0) },
    },
    transparent: true,
    depthTest: false,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}

export class CharacterSprite {
  /** @param {THREE.Object3D} parent */
  constructor(parent) {
    this.material = spriteMaterial();
    this.mesh = new THREE.Mesh(QUAD, this.material);
    this.mesh.frustumCulled = false;
    this.mesh.visible = false;
    this.shadow = new THREE.Mesh(QUAD, spriteMaterial());
    this.shadow.frustumCulled = false;
    this.shadow.visible = false;
    this.shadow.material.uniforms.uOpacity.value = 0.55;
    parent.add(this.shadow);
    parent.add(this.mesh);
    this.key = null;
    this.sheet = null;
    this.tileKey = null;
    this.loading = null;
    this.frameH = 0;
    this.shadowReady = false;
    this.loadShadow();
  }

  async loadShadow() {
    if (!shadowTexPromise) shadowTexPromise = tryRawTexture(engine.assets.anil('Graphics/Characters/Shadows/defaultShadow.png'));
    const tex = await shadowTexPromise;
    if (!tex) return;
    this.shadow.material.uniforms.map.value = tex;
    this.shadow.scale.set(tex.image.width, tex.image.height, 1);
    this.shadowReady = true;
  }

  /** Cambia el gráfico (clave de charset). */
  setGraphic(key) {
    if (key === this.key) return;
    this.key = key;
    this.sheet = null;
    this.tileKey = null;
    if (!key) return;
    const want = key;
    this.loading = loadCharset(key).then((sheet) => {
      if (this.key !== want || !sheet) return;
      this.sheet = sheet;
      this.material.uniforms.map.value = sheet.tex;
      this.frameH = sheet.frameH;
      this.material.uniforms.uFrameH.value = sheet.frameH;
      this.mesh.scale.set(sheet.frameW, sheet.frameH, 1);
    });
  }

  /** Gráfico de tile (eventos con tile_id). */
  setTile(res, tileId) {
    const tk = `${res.id}:${tileId}`;
    if (this.tileKey === tk) return;
    this.key = null;
    this.sheet = null;
    this.tileKey = tk;
    const p = regularTileAtlasPos(tileId);
    const [w, h] = res.atlasSize;
    this.material.uniforms.map.value = res.atlasTex;
    this.material.uniforms.uRect.value.set(p.x / w, p.y / h, (p.x + TILE) / w, (p.y + TILE) / h);
    this.frameH = TILE;
    this.material.uniforms.uFrameH.value = TILE;
    this.mesh.scale.set(TILE, TILE, 1);
    this.tileReady = true;
  }

  /**
   * Sincroniza con un Character. `ox, oy` = desplazamiento del mapa en px; `visible` extra.
   * Devuelve la profundidad usada.
   */
  sync(ch, ox = 0, oy = 0, { visible = true, shadow = true, tileRes = null } = {}) {
    if (ch.tileId > 0 && tileRes) this.setTile(tileRes, ch.tileId);
    else this.setGraphic(ch.characterName);
    const ready = Boolean(this.sheet) || (this.tileKey && ch.tileId > 0);
    const show = visible && ready && !ch.transparent && ch.opacity > 0;
    this.mesh.visible = show;
    this.shadow.visible = show && shadow && this.shadowReady && !ch.tileId && ch.opacity >= 128;
    if (!show) return 0;
    const u = this.material.uniforms;
    if (this.sheet) {
      const s = this.sheet;
      const row = Math.max(0, Math.min(3, (ch.direction - 2) / 2));
      const col = ch.pattern % 4;
      u.uRect.value.set((col * s.frameW) / s.width, (row * s.frameH) / s.height, ((col + 1) * s.frameW) / s.width, ((row + 1) * s.frameH) / s.height);
    }
    u.uOpacity.value = ch.opacity / 255;
    u.uBush.value = ch.bushDepth || 0;
    const x = Math.round(ch.screenX() + ox);
    const yOff = this.sheet?.offset ? 16 : 0;
    const y = Math.round(ch.screenY() + oy - (ch.bobHeight || 0) + yOff);
    this.mesh.position.set(x, y, 0);
    const z = ch.screenZ(this.frameH) + oy;
    this.mesh.renderOrder = z + 0.5 + (ch.uid % 1000) * 1e-4;
    if (this.shadow.visible) {
      this.shadow.position.set(x, Math.round(ch.screenYGround() + oy - 2), 0);
      this.shadow.renderOrder = 1;
    }
    return z;
  }

  /** Posición de la cabeza (para globos de emoción). */
  headY() { return this.mesh.position.y - this.frameH + 10; }

  dispose() {
    this.mesh.removeFromParent();
    this.shadow.removeFromParent();
    this.material.dispose();
    this.shadow.material.dispose();
  }
}
