// Vista de un mapa de tiles RMXP en Three.js. Réplica del orden de dibujo de Essentials
// (016_Map renderer/002_TilemapRenderer.rb): los tiles de prioridad 0 de las 3 capas forman el suelo;
// los de prioridad p>0 se agrupan por z = y·32 + p·32 + 33 y se intercalan con los personajes
// (z = realY + 32 [+31 si el sprite mide más de 32] [+1 jugador]) mediante renderOrder.
import * as THREE from 'three';
import { TILE, FIRST_REGULAR_TILE, isAutotile, regularTileAtlasPos } from '../shared/autotile.js';
import { autotileUV } from './tileAtlas.js';

export const GROUND_ORDER = -100000;
/** Relleno de costuras (world/seams.js): por debajo del suelo de cualquier mapa, que siempre lo tapa. */
export const SEAM_ORDER = GROUND_ORDER - 100000;
export const AUTOTILE_FRAME_SECONDS = 0.25; // 5/20 s por fotograma (Essentials)

const VERT = /* glsl */`
precision highp float;
attribute vec2 aUV;
attribute vec4 aAnim;
attribute float aTex;
uniform float uFrame;
varying vec2 vUV;
varying float vTex;
void main() {
  vec2 uv = aUV;
  if (aAnim.x > 1.0) {
    float f = mod(uFrame, aAnim.x);
    float col = mod(f, aAnim.w);
    float row = floor(f / aAnim.w);
    uv += vec2(col * aAnim.y, row * aAnim.z);
  }
  vUV = uv;
  vTex = aTex;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const FRAG = /* glsl */`
precision highp float;
uniform sampler2D uTileset;
uniform sampler2D uAuto;
uniform vec2 uTilesetSize;
uniform vec2 uAutoSize;
uniform float uOpacity;
varying vec2 vUV;
varying float vTex;
void main() {
  vec4 c = vTex < 0.5 ? texture2D(uTileset, vUV / uTilesetSize) : texture2D(uAuto, vUV / uAutoSize);
  c.a *= uOpacity;
  if (c.a < 0.004) discard;
  gl_FragColor = c;
}`;

export function createTileMaterial(res) {
  return new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: {
      uTileset: { value: res.atlasTex },
      uAuto: { value: res.autoTex },
      uTilesetSize: { value: new THREE.Vector2(...res.atlasSize) },
      uAutoSize: { value: new THREE.Vector2(...res.autoSize) },
      uFrame: { value: 0 },
      uOpacity: { value: 1 },
    },
    transparent: true,
    depthTest: false,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}

export class TilemapView {
  /**
   * @param {object} res recursos del tileset (loadTilesetResources)
   * @param {import('../world/gameMap.js').GameMap} map
   */
  constructor(res, map) {
    this.res = res;
    this.map = map;
    this.group = new THREE.Group();
    this.material = createTileMaterial(res);
    this.meshes = [];
    this.seamCells = [];
    this.seamMesh = null;
    this.offset = { x: 0, y: 0 };
    this.dirty = false;
    this.unsub = map.onTileChange(() => { this.dirty = true; });
    this.rebuild();
  }

  /**
   * Relleno de costuras (world/seams.js#planSeams): cells = [{ x, y, sx, sy }] en casillas locales; cada casilla
   * vacía copia las 3 capas de (sx, sy). Se dibuja en una sola malla bajo el suelo de todos los mapas.
   */
  setSeamFill(cells) {
    this.seamCells = cells || [];
    this.buildSeamMesh();
  }

  buildSeamMesh() {
    if (this.seamMesh) {
      this.group.remove(this.seamMesh);
      this.seamMesh.geometry.dispose();
      this.seamMesh = null;
    }
    if (!this.seamCells.length) return;
    const { map, res } = this;
    const quads = [];
    for (let layer = 0; layer < 3; layer++) {
      for (const c of this.seamCells) {
        const id = map.data(c.sx, c.sy, layer);
        if (id < 48) continue;
        const quad = this.quadFor(id, c.x, c.y, res);
        if (quad) quads.push(quad);
      }
    }
    if (!quads.length) return;
    this.seamMesh = this.createMesh(quads);
    this.seamMesh.renderOrder = SEAM_ORDER;
    this.group.add(this.seamMesh);
  }

  /** Reconstruye la geometría (al cargar o tras cambiar tiles). */
  rebuild() {
    for (const m of this.meshes) {
      this.group.remove(m);
      m.geometry.dispose();
    }
    this.meshes = [];
    const buckets = new Map(); // z → quads
    const ground = [];
    const { map, res } = this;
    const pri = map.priorities;
    for (let layer = 0; layer < 3; layer++) {
      const data = map.layers[layer];
      for (let y = 0; y < map.height; y++) {
        for (let x = 0; x < map.width; x++) {
          const id = data[x + y * map.width];
          if (id < 48) continue;
          const quad = this.quadFor(id, x, y, res);
          if (!quad) continue;
          const p = pri[id] || 0;
          if (p === 0) ground.push(quad);
          else {
            const z = y * TILE + p * TILE + TILE + 1;
            if (!buckets.has(z)) buckets.set(z, []);
            buckets.get(z).push(quad);
          }
        }
      }
    }
    this.addMesh(ground, null);
    for (const [z, quads] of [...buckets.entries()].sort((a, b) => a[0] - b[0])) this.addMesh(quads, z);
    this.applyOffset();
    if (this.seamCells.length) this.buildSeamMesh(); // un tile del borde cambiado también cambia el relleno
    this.dirty = false;
  }

  quadFor(id, x, y, res) {
    if (id >= FIRST_REGULAR_TILE) {
      const p = regularTileAtlasPos(id);
      return { x, y, u: p.x, v: p.y, anim: [1, 0, 0, 1], tex: 0 };
    }
    if (!isAutotile(id)) return null;
    const a = autotileUV(res, id);
    if (!a) return null;
    return { x, y, u: a.x, v: a.y, anim: a.anim, tex: 1 };
  }

  addMesh(quads, z) {
    if (!quads.length) return;
    const mesh = this.createMesh(quads);
    mesh.userData.z = z;
    this.meshes.push(mesh);
    this.group.add(mesh);
  }

  createMesh(quads) {
    const n = quads.length;
    const pos = new Float32Array(n * 12);
    const uv = new Float32Array(n * 8);
    const anim = new Float32Array(n * 16);
    const tex = new Float32Array(n * 4);
    const idx = new Uint32Array(n * 6);
    quads.forEach((q, i) => {
      const px = q.x * TILE; const py = q.y * TILE;
      pos.set([px, py, 0, px + TILE, py, 0, px, py + TILE, 0, px + TILE, py + TILE, 0], i * 12);
      uv.set([q.u, q.v, q.u + TILE, q.v, q.u, q.v + TILE, q.u + TILE, q.v + TILE], i * 8);
      for (let k = 0; k < 4; k++) anim.set(q.anim, i * 16 + k * 4);
      tex.fill(q.tex, i * 4, i * 4 + 4);
      const b = i * 4;
      idx.set([b, b + 2, b + 1, b + 1, b + 2, b + 3], i * 6);
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aUV', new THREE.BufferAttribute(uv, 2));
    geo.setAttribute('aAnim', new THREE.BufferAttribute(anim, 4));
    geo.setAttribute('aTex', new THREE.BufferAttribute(tex, 1));
    geo.setIndex(new THREE.BufferAttribute(idx, 1));
    const mesh = new THREE.Mesh(geo, this.material);
    mesh.frustumCulled = false;
    return mesh;
  }

  /** Coloca el mapa en (ox, oy) casillas respecto al mapa actual (conexiones). */
  setOffset(ox, oy) {
    this.offset = { x: ox, y: oy };
    this.applyOffset();
  }

  applyOffset() {
    this.group.position.set(this.offset.x * TILE, this.offset.y * TILE, 0);
    for (const m of this.meshes) {
      m.renderOrder = m.userData.z === null ? GROUND_ORDER + this.offset.y : m.userData.z + this.offset.y * TILE;
    }
  }

  /** Avanza la animación de autotiles (tiempo en segundos). */
  update(seconds) {
    if (this.dirty) this.rebuild();
    this.material.uniforms.uFrame.value = Math.floor(seconds / AUTOTILE_FRAME_SECONDS);
  }

  dispose() {
    this.unsub?.();
    for (const m of this.meshes) m.geometry.dispose();
    this.seamMesh?.geometry.dispose();
    this.material.dispose();
    this.group.removeFromParent();
  }
}
