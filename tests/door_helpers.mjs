import fs from 'node:fs';
import * as THREE from 'three';
import { PNG } from 'pngjs';
import { buildMapNode } from '../tools/lib/map_node.mjs';
import { GameState } from '../game/src/core/state.js';
import { World } from '../game/src/world/world.js';

globalThis.location ??= { search: '', href: 'http://localhost/' };
globalThis.window ??= {};
const { ScriptRunner } = await import('../game/src/script/runner.js');
const { default: MapScene } = await import('../game/src/world/mapScene.js');

export async function doorEntry(id) {
  const { entry, tileset } = await buildMapNode(id);
  const png = PNG.sync.read(fs.readFileSync(new URL('../game/assets/tilesets/' + tileset.image + '.png', import.meta.url)));
  const tex = new THREE.DataTexture(png.data, png.width, png.height, THREE.RGBAFormat);
  tex.flipY = false;
  tex.magFilter = tex.minFilter = THREE.NearestFilter;
  entry.res = { atlasTex: tex, atlasSize: [png.width, png.height] };
  return { entry, png };
}

export async function doorScene(mapId, x, y, dir = 8) {
  const state = GameState.create({ name: 'Prueba puerta' });
  const cache = new Map();
  const load = async (id) => {
    if (!cache.has(id)) cache.set(id, await doorEntry(id));
    return cache.get(id).entry;
  };
  const entry = await load(mapId);
  const world = new World({ state, rng: () => 0.5 });
  world.setCurrent(entry); world.player.moveTo(x, y); world.player.direction = dir;
  state.setPosition(mapId, x, y, dir);
  const trace = [];
  const group = new THREE.Group();
  const snapshot = (kind) => trace.push({ kind, busy: scene.transferring, panels: group.children.map((c) => c.userData.progress) });
  const scene = Object.assign(Object.create(MapScene.prototype), {
    world, state, ready: true, visible: new Map(), runner: new ScriptRunner(),
    worldView: { fxGroup: group, clearMaps: () => snapshot('clear'), addMap() {} },
    camera: { setBounds() {}, follow() {}, snapToTarget() {} },
    refreshFollower() {}, announce() {}, loadNeighbors: async () => {}, applyEnvironment: async () => {},
    runScript() {}, loadEntry: load,
    fx: { fadeOut: async () => snapshot('fadeOut'), fadeIn: async () => snapshot('fadeIn') },
  });
  world.scriptBusyFn = () => Boolean(scene.transferring);
  const wait = scene.runner.wait.bind(scene.runner);
  scene.runner.wait = (frames) => { snapshot('wait'); return wait(frames); };
  return { scene, world, state, trace, group, cache, snapshot };
}

export async function finish(scene, promise, max = 300) {
  let done = false; let value; let error;
  promise.then((r) => { done = true; value = r; }, (e) => { done = true; error = e; });
  for (let n = 0; n < max && !done; n++) {
    scene.runner.tick();
    await new Promise((resolve) => setImmediate(resolve));
  }
  if (!done) throw new Error('La transición de la puerta no termina');
  if (error) throw error;
  return value;
}

export { THREE, MapScene };
