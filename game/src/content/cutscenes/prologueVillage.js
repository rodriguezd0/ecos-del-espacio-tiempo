// Último plano del prólogo: un pueblo pequeño entre bosques, de noche, visto desde lo alto. Se construye con
// el MapBuilder y la biblioteca del tileset 7 y se dibuja con TilemapView (mismo render que el juego).
// Es una composición GENÉRICA (tres casas en un claro): no reproduce el trazado de Villa Alba.
import * as THREE from 'three';
import { SCREEN_W, SCREEN_H } from '../../core/engine.js';
import { buildMap, createEntry } from '../../world/mapLoader.js';
import { loadBuilderLibrary } from '../../world/stampLibrary.js';
import { loadTilesetResources } from '../../render/tileAtlas.js';
import { TilemapView } from '../../render/tilemapView.js';
import { GlowQuad } from './cineGfx.js';

export const VILLAGE_W = 22;
export const VILLAGE_H = 16;

/** Definición del claro con casas (no registrada en content/maps: solo para la cinemática). */
export const VILLAGE_DEF = Object.freeze({
  id: 'prologo_pueblo_lejano',
  tileset: 7,
  width: VILLAGE_W,
  height: VILLAGE_H,
  build(b) {
    b.fill(null, 'cesped');
    const clearing = (x, y) => ((x - 11) / 8.5) ** 2 + ((y - 10.5) / 4.8) ** 2 <= 1;
    b.blob(null, (x, y) => !clearing(x, y), 'bosque_pinos');
    b.paint('camino_tierra', b.cellsWhere((x, y) => (y >= 12 && y <= 13 && x >= 5 && x <= 17) || (x >= 10 && x <= 11 && y >= 12)));
    b.stamp('casa_verde_pequena', 4, 6);
    b.stamp('casa_rosa', 11, 8);
    b.stamp('casa_gris', 15, 7);
    b.stamp('arbol', 9, 10);
  },
});

// Ventanas/puertas iluminadas (px del mapa) para el brillo cálido.
const LIGHTS = [[7 * 32, 11 * 32 + 8], [12 * 32 + 16, 11 * 32 + 12], [18 * 32 + 12, 11 * 32 + 12]];

/** Construye la vista del pueblo dentro de `parent`. */
export async function buildVillageView(parent) {
  const res = await loadTilesetResources(VILLAGE_DEF.tileset);
  const lib = await loadBuilderLibrary(VILLAGE_DEF.tileset);
  const built = buildMap(VILLAGE_DEF, {
    library: lib.library || undefined,
    paintBrush: lib.paintBrush,
    isEmpty: res.isEmpty,
    warn: (m) => console.warn(`[prólogo pueblo] ${m}`),
  });
  const entry = createEntry(VILLAGE_DEF, built, res.tileset);
  const group = new THREE.Group();
  parent.add(group);
  const view = new TilemapView(res, entry.map);
  group.add(view.group);
  // Tinte nocturno sobre el mapa (normal blending) y luces cálidas encima.
  const night = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'precision highp float; uniform float uAlpha; void main(){ gl_FragColor = vec4(0.03, 0.05, 0.16, uAlpha); }',
    uniforms: { uAlpha: { value: 0.62 } },
    transparent: true, depthTest: false, depthWrite: false, side: THREE.DoubleSide,
  }));
  night.frustumCulled = false;
  night.renderOrder = 90000;
  night.scale.set(VILLAGE_W * 32, VILLAGE_H * 32, 1);
  night.position.set((VILLAGE_W * 32) / 2, (VILLAGE_H * 32) / 2, 0);
  group.add(night);
  const lights = LIGHTS.map(([x, y]) => {
    const g = new GlowQuad(group, [255, 196, 110], { w: 40, h: 40, alpha: 0.7, order: 90001 });
    g.x = x;
    g.y = y;
    return g;
  });
  let time = 0;
  return {
    group,
    width: VILLAGE_W * 32,
    height: VILLAGE_H * 32,
    night,
    /** Centra la vista del pueblo en pantalla con un desplazamiento (px). */
    place(offsetX = 0, offsetY = 0) {
      group.position.set(Math.round((SCREEN_W - VILLAGE_W * 32) / 2 + offsetX), Math.round((SCREEN_H - VILLAGE_H * 32) / 2 + offsetY), 0);
    },
    update(steps = 1) {
      time += steps / 60;
      view.update(time);
      lights.forEach((l, i) => { l.alpha = 0.55 + 0.15 * Math.sin(time * 2 + i); l.update(steps); });
    },
    dispose() {
      for (const l of lights) l.dispose();
      night.geometry.dispose();
      night.material.dispose();
      view.dispose();
      group.removeFromParent();
    },
  };
}
