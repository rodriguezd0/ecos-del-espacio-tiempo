// Animaciones de campo breves: hierba que se agita al pisarla y polvo al aterrizar de un salto
// (hoja Graphics/Animations/DustandGrass.png de Añil, celdas de 192×192).
import * as THREE from 'three';
import { tryRawTexture } from './textures.js';
import { spriteMaterial } from './characterSprite.js';
import { engine } from '../core/engine.js';

const CELL = 192;
const PRESETS = {
  grass: { cells: [3, 4], hold: 5, dy: 22, over: 38 },
  grassPurple: { cells: [5, 4], hold: 5, dy: 22, over: 38 },
  dust: { cells: [0, 1, 2], hold: 4, dy: 26, over: 40 },
};

function centeredQuad() {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-0.5, -0.5, 0, 0.5, -0.5, 0, -0.5, 0.5, 0, 0.5, 0.5, 0]), 3));
  g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), 2));
  g.setIndex([0, 2, 1, 1, 2, 3]);
  return g;
}
const QUAD = centeredQuad();

export class FieldAnimLayer {
  constructor(parent) {
    this.parent = parent;
    this.active = [];
    this.tex = null;
    tryRawTexture(engine.assets.anil('Graphics/Animations/DustandGrass.png')).then((t) => { this.tex = t; });
  }

  /** Lanza una animación en la casilla (tx, ty) (px de mapa ya desplazados). */
  play(kind, px, py) {
    const p = PRESETS[kind];
    if (!p || !this.tex) return;
    const mat = spriteMaterial(this.tex);
    const mesh = new THREE.Mesh(QUAD, mat);
    mesh.frustumCulled = false;
    mesh.scale.set(CELL, CELL, 1);
    mesh.position.set(px + 16, py + p.dy, 0);
    mesh.renderOrder = py + 32 + p.over;
    this.parent.add(mesh);
    this.active.push({ p, mesh, mat, age: 0 });
    this.setCell(mat, p.cells[0]);
  }

  setCell(mat, cell) {
    const w = this.tex.image.width; const h = this.tex.image.height;
    const cols = Math.floor(w / CELL);
    const cx = (cell % cols) * CELL; const cy = Math.floor(cell / cols) * CELL;
    mat.uniforms.uRect.value.set(cx / w, cy / h, (cx + CELL) / w, (cy + CELL) / h);
  }

  update() {
    for (const a of this.active) {
      a.age += 1;
      const idx = Math.floor(a.age / a.p.hold);
      if (idx < a.p.cells.length) this.setCell(a.mat, a.p.cells[idx]);
    }
    const alive = [];
    for (const a of this.active) {
      if (a.age >= a.p.cells.length * a.p.hold) { a.mesh.removeFromParent(); a.mat.dispose(); } else alive.push(a);
    }
    this.active = alive;
  }

  clear() {
    for (const a of this.active) { a.mesh.removeFromParent(); a.mat.dispose(); }
    this.active = [];
  }
}
