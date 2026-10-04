// Reproductor de las animaciones de combate de Añil (PBAnimationPlayerX + pbAnimationCore de Essentials 21.1) sobre
// la escena Three.js. Carga game/data/anims (tools/extract_anims.mjs) y las hojas de Graphics/Animations bajo demanda.
// La lógica pura (elección, focos, fondos) está en anilAnimCore.js.
//
// 25-09-2026, el creador: «Cuando un Pokémon usa Paliza (un Nickit) tira unas bolitas en vez del puño». Las animaciones
// genéricas por estilo (moveAnims.js) no conocían la animación de cada movimiento; ahora se reproduce la de Añil y
// las genéricas quedan como respaldo si falta la animación o su hoja.
import * as THREE from 'three';
import { engine } from '../../../core/engine.js';
import { rawTexture } from '../../../render/textures.js';
import { spriteMaterial, flatMaterial, setSpriteBlend, GEOM } from '../gfx/materials.js';
import { atlasRect } from '../gfx/actors.js';
import { SCREEN_W, SCREEN_H } from '../layout.js';
import {
  findMoveAnimation, expandCel, animFrameAt, cellRect, placeCel, lineTransform, celOrder, emptyLayer, applyTimings,
  CELL, TICKS_PER_FRAME, animationSheetFile,
} from './anilAnimCore.js';

const INDEX_URL = 'data/anims/index.json';
const MAX_SPRITES = 60;
const BG_ORDER = 13; // z 5 de Essentials: sobre fondo, bases y sombras; bajo los Pokémon
const FG_ORDER = 90; // z 85: delante de todo
const sheetCache = new Map();
let indexPromise = null;

/** Índice movimiento → animación (null si no se pudo cargar). */
export function loadAnimIndex() {
  if (!indexPromise) {
    indexPromise = engine.assets.json(INDEX_URL).catch((err) => {
      console.warn(`[combate] Sin animaciones de Añil (${INDEX_URL}): ${err.message}. Ejecuta node tools/extract_anims.mjs`);
      return null;
    });
  }
  return indexPromise;
}

async function loadAnim(n) {
  try {
    return await engine.assets.json(`data/anims/${n}.json`);
  } catch (err) {
    console.warn(`[combate] Animación ${n} no disponible`, err);
    return null;
  }
}

/** Hoja de Graphics/Animations (con el tono de la animación) → textura, o null. */
function loadSheet(file, hue = 0, repeat = false) {
  file = animationSheetFile(file);
  const key = `${file}|${hue}|${repeat ? 'r' : ''}`;
  if (!sheetCache.has(key)) {
    sheetCache.set(key, (async () => {
      const name = file;
      const img = await engine.assets.tryImage(engine.assets.anil(`Graphics/Animations/${name}`));
      if (!img) {
        console.warn(`[combate] Hoja de animación no encontrada: ${name}`);
        return null;
      }
      let src = img;
      if (hue) {
        const c = document.createElement('canvas');
        c.width = img.width;
        c.height = img.height;
        const g = c.getContext('2d');
        g.filter = `hue-rotate(${hue}deg)`; // AnimatedBitmap(ruta, hue): giro de tono de RGSS
        g.drawImage(img, 0, 0);
        src = c;
      }
      const tex = rawTexture(src);
      if (repeat) { tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping; }
      return { tex, w: img.width, h: img.height };
    })());
  }
  return sheetCache.get(key);
}

/** Capa de fondo/frente: plano de color + plano con imagen repetida (ColoredPlane + AnimatedPlane). */
class PlaneLayer {
  constructor(group, order) {
    this.color = new THREE.Mesh(GEOM.center, flatMaterial([0, 0, 0], 0));
    this.image = new THREE.Mesh(GEOM.center, spriteMaterial());
    for (const m of [this.color, this.image]) {
      m.position.set(SCREEN_W / 2, SCREEN_H / 2, 0);
      m.scale.set(SCREEN_W * 3, SCREEN_H * 3, 1);
      m.frustumCulled = false;
      m.visible = false;
      group.add(m);
    }
    this.color.renderOrder = order;
    this.image.renderOrder = order + 0.1;
    this.graphic = null;
    this.sheet = null;
  }

  async apply(L, hue) {
    const ca = (L.plainColor[3] / 255) * (L.plainOpacity / 255);
    this.color.visible = ca > 0.001;
    if (this.color.visible) {
      this.color.material.uniforms.uColor.value.set(L.plainColor[0] / 255, L.plainColor[1] / 255, L.plainColor[2] / 255);
      this.color.material.uniforms.uAlpha.value = ca;
    }
    if (L.graphic !== this.graphic) {
      this.graphic = L.graphic;
      this.sheet = L.graphic ? await loadSheet(L.graphic, hue, true) : null;
      this.image.material.uniforms.map.value = this.sheet?.tex || null;
    }
    this.image.visible = Boolean(this.sheet) && L.opacity > 0;
    if (!this.image.visible) return;
    const { w, h } = this.sheet;
    // Plane de RGSS: el píxel de pantalla (sx, sy) muestra el de la imagen (sx + ox, sy + oy), repetida
    const u = this.image.material.uniforms;
    u.uRect.value.set((-SCREEN_W + L.ox) / w, (-SCREEN_H + L.oy) / h, (2 * SCREEN_W + L.ox) / w, (2 * SCREEN_H + L.oy) / h);
    u.uOpacity.value = L.opacity / 255;
    u.uColor.value.set(L.color[0] / 255, L.color[1] / 255, L.color[2] / 255, L.color[3] / 255);
  }

  dispose() {
    for (const m of [this.color, this.image]) { m.removeFromParent(); m.material.dispose(); }
  }
}

/** Centro del sprite de un combatiente (getSpriteCenter) y alto de su bitmap cuadrado de DBK. */
function spriteGeometry(s) {
  const a = s.anchor;
  const hs = s.squareHeight;
  return { pos: [a.x, a.y], center: [a.x, a.y - s.height + hs / 2], height: hs };
}

export class AnilAnimPlayer {
  /**
   * @param fx      fachada de la escena (battleScene.makeFacade)
   * @param anim    animación (JSON de game/data/anims)
   * @param user    índice del usuario de la animación (o null)
   * @param target  índice del objetivo (o null)
   * @param cryIndex  quién grita si una temporización no tiene SE (el usuario real, también con "OppMove")
   */
  constructor(fx, anim, user, target, cryIndex = user) {
    this.fx = fx;
    this.anim = anim;
    this.user = user;
    this.cryIndex = cryIndex;
    this.target = target;
    this.cels = [];
    this.tick = 0;
    this.lastFrame = -1;
    this.layers = { bg: emptyLayer(), fg: emptyLayer() };
    this.bgPlane = new PlaneLayer(fx.layer, BG_ORDER);
    this.fgPlane = new PlaneLayer(fx.layer, FG_ORDER);
    this.userSprite = user !== null && user !== undefined ? fx.battler(user) : null;
    this.targetSprite = target !== null && target !== undefined ? fx.battler(target) : null;
    // pbAnimationCore: centros de partida y líneas usuario→objetivo del editor a las posiciones reales
    const ug = this.userSprite?.atlas ? spriteGeometry(this.userSprite) : null;
    const tg = this.targetSprite?.atlas ? spriteGeometry(this.targetSprite) : null;
    const uPos = ug?.pos || [0, 0];
    const tPos = tg?.pos || uPos;
    const uH = ug?.height ?? 128;
    const tH = tg?.height ?? uH;
    this.ctx = {
      userOrig: ug?.center || [0, 0],
      targetOrig: tg?.center || [0, 0],
      ...lineTransform(uPos, uH, tPos, tH),
    };
  }

  async load() {
    this.sheet = this.anim.graphic ? await loadSheet(this.anim.graphic, this.anim.hue) : null;
  }

  mesh(i) {
    if (!this.cels[i]) {
      const m = new THREE.Mesh(GEOM.center, spriteMaterial());
      m.frustumCulled = false;
      m.visible = false;
      this.fx.layer.add(m);
      this.cels[i] = m;
    }
    return this.cels[i];
  }

  /** Aplica el fotograma `f` (PBAnimationPlayerX#update). */
  showFrame(f) {
    const frame = this.anim.frames[f] || [];
    for (const m of this.cels) if (m) m.visible = false;
    for (const s of [this.userSprite, this.targetSprite]) if (s) s.animCel = null;
    const userOrder = this.userSprite?.mesh.renderOrder ?? null;
    const targetOrder = this.targetSprite?.mesh.renderOrder ?? null;
    for (let i = 0; i < Math.min(frame.length, MAX_SPRITES); i++) {
      const cel = expandCel(frame[i]);
      if (!cel) continue;
      const place = placeCel(cel, this.ctx);
      if (!place) continue;
      if (i === 0 || i === 1) {
        // Cels 0 y 1: los propios sprites del usuario y del objetivo
        const s = i === 0 ? this.userSprite : this.targetSprite;
        if (s) s.animCel = { ...cel, x: place.x, y: place.y, mirror: place.mirror };
        continue;
      }
      this.drawCel(i, cel, place, celOrder(cel, userOrder, targetOrder));
    }
  }

  drawCel(i, cel, place, order) {
    let tex = null;
    let rect = null;
    let w = CELL;
    let h = CELL;
    if (cel.pattern >= 0) {
      if (!this.sheet) return;
      const r = cellRect(cel.pattern, this.sheet.w, this.sheet.h);
      if (!r.inside) return;
      tex = this.sheet.tex;
      rect = [r.x / this.sheet.w, r.y / this.sheet.h, (r.x + CELL) / this.sheet.w, (r.y + CELL) / this.sheet.h];
    } else {
      // Patrón −1/−2 en otro cel: copia del sprite del usuario/objetivo (fotograma actual)
      const s = cel.pattern === -1 ? this.userSprite : this.targetSprite;
      if (!s?.atlas) return;
      tex = s.atlas.tex;
      rect = atlasRect(s.atlas, s.frame);
      w = s.width;
      h = s.height;
    }
    const m = this.mesh(i);
    const u = m.material.uniforms;
    u.map.value = tex;
    u.uRect.value.set(...rect);
    u.uOpacity.value = cel.opacity / 255;
    const c = cel.color || [0, 0, 0, 0];
    u.uColor.value.set(c[0] / 255, c[1] / 255, c[2] / 255, c[3] / 255);
    const t = cel.tone || [0, 0, 0, 0];
    u.uTone.value.set(t[0] / 255, t[1] / 255, t[2] / 255);
    u.uGray.value = t[3] / 255;
    setSpriteBlend(m.material, cel.blend);
    m.position.set(Math.round(place.x), Math.round(place.y), 0);
    m.scale.set(w * (cel.zoomX / 100) * (place.mirror ? -1 : 1), h * (cel.zoomY / 100), 1);
    m.rotation.z = -(cel.angle * Math.PI) / 180; // RGSS: ángulo antihorario en pantalla (y hacia abajo)
    m.renderOrder = order;
    m.visible = cel.visible && cel.opacity > 0;
  }

  /** Paso lógico (60 Hz). Devuelve true al terminar. */
  step() {
    const f = animFrameAt(this.tick, this.anim.frames.length);
    this.tick += 1;
    if (f < 0) return true;
    if (f === this.lastFrame) return false;
    this.lastFrame = f;
    this.showFrame(f);
    const res = applyTimings(this.anim.timing || [], f, this.layers);
    this.layers = { bg: res.bg, fg: res.fg };
    this.bgPlane.apply(res.bg, this.anim.hue).catch((e) => console.warn(e));
    this.fgPlane.apply(res.fg, this.anim.hue).catch((e) => console.warn(e));
    for (const snd of res.sounds) {
      if (snd.name) this.fx.se(snd.name, { volume: snd.volume, pitch: snd.pitch });
      else if (this.cryIndex !== null && this.cryIndex !== undefined) this.fx.cry(this.cryIndex, { volume: snd.volume, pitch: snd.pitch });
    }
    return false;
  }

  dispose() {
    for (const m of this.cels) if (m) { m.removeFromParent(); m.material.dispose(); }
    this.cels = [];
    this.bgPlane.dispose();
    this.fgPlane.dispose();
    // pbAnimationCore devuelve los sprites a su sitio
    for (const s of [this.userSprite, this.targetSprite]) if (s) s.animCel = null;
  }
}

/** Duración en pasos lógicos de una animación. */
export function animTicks(anim) {
  return (anim?.frames?.length || 0) * TICKS_PER_FRAME;
}

/**
 * Reproduce una animación de Añil entre `user` y `target` (pbAnimationCore): oculta sombras y cajas de datos
 * (pbSaveShadows + HIDE_DATABOXES_DURING_MOVES de DBK) y las restaura al acabar.
 */
export async function playAnilAnimation(fx, anim, user, target, cryIndex = user) {
  const player = new AnilAnimPlayer(fx, anim, user, target, cryIndex);
  await player.load();
  const restore = fx.hideForAnimation();
  try {
    await fx.tasks.add(() => player.step());
  } finally {
    player.dispose();
    restore();
  }
}

/**
 * Animación de Añil de un movimiento. Devuelve false si no hay (índice o animación sin cargar) para usar la genérica.
 * Como pbAnimation: un solo objetivo (el primero); con la versión "OppMove" del rival se intercambian los papeles.
 */
export async function playAnilMoveAnimation(fx, { user, targets, move, hitNum = 0 }) {
  if (user === null || user === undefined) return false;
  const index = await loadAnimIndex();
  const found = index ? findMoveAnimation(index, move, user, hitNum) : null;
  if (!found) return false;
  const anim = await loadAnim(found.index);
  if (!anim || !anim.frames?.length) return false;
  const target = targets.length ? targets[0] : null;
  // DBK: sin animación si el usuario o el objetivo se han desvanecido (Vuelo, Excavar…)
  const vanished = (i) => i !== null && fx.battler(i) && !fx.battler(i).visible;
  if (vanished(user) || vanished(target)) return true;
  if (found.oppMove) await playAnilAnimation(fx, anim, target, user, user);
  else await playAnilAnimation(fx, anim, user, target);
  return true;
}
