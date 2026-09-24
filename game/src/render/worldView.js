// Vista Three.js del mundo: tilemaps (actual + conectados), personajes, animaciones de campo y globos.
// Todo en píxeles con y hacia abajo (grupo raíz scale.y = -1, ver ARCHITECTURE §1).
import * as THREE from 'three';
import { SCREEN_W, SCREEN_H } from '../core/engine.js';
import { TilemapView } from './tilemapView.js';
import { CharacterSprite } from './characterSprite.js';
import { EmoteLayer } from './emotes.js';
import { FieldAnimLayer } from './fieldAnims.js';
import { planSeams, seamKey } from '../world/seams.js';

const TILE = 32;

export class WorldView {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(0, SCREEN_W, 0, -SCREEN_H, -10, 10);
    this.root = new THREE.Group();
    this.root.scale.y = -1;
    this.scene.add(this.root);
    this.mapGroup = new THREE.Group();
    this.charGroup = new THREE.Group();
    this.fxGroup = new THREE.Group();
    this.root.add(this.mapGroup, this.charGroup, this.fxGroup);
    this.views = new Map(); // entryId → TilemapView
    this.sprites = new Map(); // character uid → CharacterSprite
    this.emotes = new EmoteLayer(this.fxGroup);
    this.fieldAnims = new FieldAnimLayer(this.fxGroup);
    this.glows = new Map(); // event uid → handle de efecto
  }

  addMap(entry) {
    if (this.views.has(entry.id)) return this.views.get(entry.id);
    const view = new TilemapView(entry.res, entry.map);
    this.views.set(entry.id, view);
    this.mapGroup.add(view.group);
    return view;
  }

  removeMap(id) {
    const v = this.views.get(id);
    if (!v) return;
    v.dispose();
    this.views.delete(id);
    this.seamKey = null;
  }

  /**
   * Relleno de costuras (world/seams.js): se rehace solo cuando cambian el mapa actual, los vecinos o sus
   * desplazamientos (cruce de conexión, vecinos recién cargados, warp).
   */
  syncSeams(entries) {
    const key = seamKey(entries);
    if (key === this.seamKey || entries.some((e) => !this.views.has(e.id))) return;
    this.seamKey = key;
    const plan = planSeams(entries);
    for (const e of entries) this.views.get(e.id).setSeamFill(plan.get(e.id) || []);
  }

  clearMaps() {
    for (const id of [...this.views.keys()]) this.removeMap(id);
    for (const s of this.sprites.values()) s.dispose();
    this.sprites.clear();
    // Los brillos del mapa anterior se retiran ya (si no, se veían 10 fotogramas en el mapa nuevo).
    for (const g of this.glows.values()) g.handle.remove(1);
    this.glows.clear();
    this.emotes.clear();
    this.fieldAnims.clear();
  }

  spriteFor(ch) {
    let s = this.sprites.get(ch.uid);
    if (!s) {
      s = new CharacterSprite(this.charGroup);
      this.sprites.set(ch.uid, s);
    }
    return s;
  }

  /** Posición de la cabeza de un personaje (px de mundo, sin cámara) para globos. */
  headPosOf(ch) {
    const s = this.sprites.get(ch.uid);
    if (!s || !s.mesh.visible) return null;
    return { x: s.mesh.position.x, y: s.headY() };
  }

  /**
   * Sincroniza la vista con el mundo. `effects` (opcional) recibe los brillos de eventos (page.glow).
   * `timeSeconds` anima los autotiles.
   */
  sync(world, cam, timeSeconds, effects = null) {
    this.root.position.set(-cam.renderX, cam.renderY, 0);
    this.syncSeams(world.allEntries);
    const seen = new Set();
    for (const entry of world.allEntries) {
      const view = this.views.get(entry.id);
      if (view) {
        if (view.offset.x !== entry.offset.x || view.offset.y !== entry.offset.y) view.setOffset(entry.offset.x, entry.offset.y);
        view.update(timeSeconds);
      }
      const ox = entry.offset.x * TILE;
      const oy = entry.offset.y * TILE;
      for (const ev of entry.events || []) {
        seen.add(ev.uid);
        const s = this.spriteFor(ev);
        const visible = !ev.erased && Boolean(ev.page);
        s.sync(ev, ox, oy, { visible, shadow: ev.page?.shadow ?? (ev.characterName && !ev.characterName.startsWith('Object') && ev.tileId === 0), tileRes: entry.res });
        if (effects) this.syncGlow(ev, visible ? ev.page?.glow : null, ox, oy, effects);
      }
    }
    const p = world.player;
    seen.add(p.uid);
    this.spriteFor(p).sync(p, 0, 0, { visible: true });
    for (const f of world.followers || [world.follower]) {
      seen.add(f.uid);
      this.spriteFor(f).sync(f, 0, 0, { visible: f.visible && !p.surfing });
    }
    // Personajes extra del mundo actual (p. ej. la montura de Zygarde, world/zygarde/mount.js).
    for (const ch of world.extraCharacters || []) {
      seen.add(ch.uid);
      this.spriteFor(ch).sync(ch, 0, 0, { visible: ch.visible !== false, shadow: ch.shadow !== false });
    }
    for (const [uid, s] of this.sprites) {
      if (!seen.has(uid)) { s.dispose(); this.sprites.delete(uid); }
    }
    for (const [uid, g] of this.glows) {
      if (!seen.has(uid)) { g.handle.remove(10); this.glows.delete(uid); }
    }
  }

  syncGlow(ev, glow, ox, oy, effects) {
    const cur = this.glows.get(ev.uid);
    if (!glow) {
      if (cur) { cur.handle.remove(15); this.glows.delete(ev.uid); }
      return;
    }
    if (!cur || cur.kind !== glow) {
      cur?.handle.remove(10);
      // page.glow: nombre de efecto o { name, absolute?, ...opciones } (absolute: geometría en coords de mapa)
      const { name, absolute = false, ...opts } = typeof glow === 'string' ? { name: glow } : glow;
      this.glows.set(ev.uid, { kind: glow, absolute, handle: effects.add(name, { x: ev.x, y: ev.y, ...opts, event: ev }) });
    }
    const g = this.glows.get(ev.uid);
    if (g.absolute) g.handle.object.position.set(ox, oy, 0);
    else g.handle.object.position.set(ev.realX + 16 + ox, ev.realY + 16 + oy, 0);
  }

  update() {
    this.emotes.update();
    this.fieldAnims.update();
  }

  render(renderer) {
    renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.clearMaps();
  }
}
