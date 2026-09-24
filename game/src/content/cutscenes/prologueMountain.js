// Planos del prólogo sobre el mapa `montana_portal` (MapScene real, el mismo del Pilar 6):
//   P-02  montaña, cascada y portal: la cámara recorre la cascada, la explanada y SUBE la escalinata; el aljibe
//         se ilumina de violeta, la cascada se agita y Giratina emerge del portal.
// MountainSet agrupa las utilidades de filmación sobre la MapScene (sprites en el mundo, luces aditivas,
// cámara, tono, clima, estado del aljibe). Lo usan también prologueBattle.js (P-03, montaje y P-04).
import MapScene from '../../world/mapScene.js';
import { engine } from '../../core/engine.js';
import { SPOTS } from '../maps/b01/montana_portal.js';
import { SpriteStrip, ParticleField, GlowQuad, Beam, Ring, GfxSet, rand } from './cineGfx.js';
import { stageScene } from './cineOverlay.js';
import { sfx, cry, bgm, SFX } from './prologueAudio.js';

const TILE = 32;
export const VIOLET = [170, 90, 255];
export const GREEN = [185, 255, 102]; // #B9FF66 (motivo de Zygarde)
export const front = (id) => engine.assets.anil(`Graphics/Pokemon/Front/${id}.png`);
export const back = (id) => engine.assets.anil(`Graphics/Pokemon/Back/${id}.png`);

// Geometría del aljibe (sprite 160×128 anclado abajo-centro en SPOTS.aljibe; ver tools/prologue_assets.mjs).
const ALJIBE_ANCHOR_Y = (SPOTS.aljibe.y + 1) * TILE;
export const ALJIBE = Object.freeze({
  x: SPOTS.aljibe.x * TILE + TILE / 2,
  holeY: ALJIBE_ANCHOR_Y - 128 + 60, // centro del hueco
  rimY: ALJIBE_ANCHOR_Y - 128 + 86, // labio delantero del hueco (línea desde la que emerge Giratina)
});
export const ALJIBE_STATE = Object.freeze({ off: 2, violet: 4, open: 6, seal: 8 });
// Corrección de tono de pantalla (se suma al día/noche): noche azulada en vez de morada.
export const NIGHT_TONE = Object.freeze([-6, 14, 26, -14]);

export const px = (tx) => tx * TILE + TILE / 2;

export class MountainSet {
  /** @param {import('./director.js').Director} d @param {MapScene} map */
  constructor(d, map) {
    this.d = d;
    this.map = map;
    this.gfx = new GfxSet();
    this.stopTick = d.every(() => this.gfx.update(1));
    this.aljibe = map.world.events.find((e) => e.id === 'aljibe') || null;
    if (!this.aljibe) console.warn('[prólogo] montana_portal sin evento "aljibe"');
  }

  get fxRoot() { return this.map.worldView.fxGroup; }
  get glowRoot() { return this.map.effects.worldRoot; }

  async sprite(opts) {
    const s = new SpriteStrip(this.fxRoot, { order: 100000, ...opts });
    await s.load();
    return this.gfx.add(s);
  }

  /** Primer sprite disponible de una lista de URLs (formas alternativas). */
  async spriteFirst(urls, opts) {
    let last = null;
    for (const url of urls) {
      try { return await this.sprite({ ...opts, url }); } catch (err) { last = err; }
    }
    throw last || new Error('Sin sprite');
  }

  particles(opts = {}) { return this.gfx.add(new ParticleField(this.glowRoot, opts)); }
  glow(color, opts = {}) { return this.gfx.add(new GlowQuad(this.glowRoot, color, opts)); }
  beam(color, opts = {}) { return this.gfx.add(new Beam(this.glowRoot, color, opts)); }
  ring(color, opts = {}) { return this.gfx.add(new Ring(this.glowRoot, color, opts)); }
  remove(item) { this.gfx.remove(item); }

  // ---- cámara y pantalla
  pan(tx, ty, frames) { return this.d.waitFor(this.map.camera.panTo(tx, ty, frames)); }
  cut(tx, ty) { this.map.camera.panTo(tx, ty, 1); }
  shake(power = 5, speed = 6, frames = 30) { this.map.camera.shake(power, speed, frames); }
  flash(color, alpha = 1, frames = 16) { this.map.fx.flashScreen(color, Math.round(alpha * 255), frames); }
  fadeOut(frames = 30) { return this.d.waitFor(this.map.fx.fadeOut(frames)); }
  fadeIn(frames = 30) { return this.d.waitFor(this.map.fx.fadeIn(frames)); }
  tone(t, frames = 30) { return this.d.waitFor(this.map.fx.toneTo(t, frames)); }
  setTime(h, m = 0) { this.map.state.data.clock.minutes = (h * 60 + m) % 1440; }
  async weather(type, power = 5) {
    try { await this.map.weather.set(type, power); } catch (err) { console.warn('[prólogo] clima', err.message); }
  }

  /** Estado del aljibe (fila del sprite) y animación del remolino. */
  setAljibe(state) {
    if (!this.aljibe) return;
    this.aljibe.direction = state;
    this.aljibe.stepAnime = state !== ALJIBE_STATE.off;
    if (!this.aljibe.stepAnime) this.aljibe.pattern = 0;
  }

  /** Salpicaduras al pie de la cascada. */
  spray(field, n = 6) {
    const wf = SPOTS.waterfall;
    for (let i = 0; i < n; i++) {
      field.spawn({
        x: (wf.x + rand(0, wf.w)) * TILE, y: (wf.y + wf.h) * TILE + rand(-8, 8), vx: rand(-1.4, 1.4), vy: rand(-3.2, -1),
        ay: 0.12, size: 4, life: 36, color: [200, 225, 255], alpha: 0.8,
      });
    }
  }

  dispose() {
    this.stopTick();
    this.gfx.dispose();
  }
}

/** Prepara la MapScene para rodar: jugador invisible, sin control, sin menú ni reloj, cámara libre. */
export function prepareMap(map) {
  map.world.scriptBusyFn = () => true;
  map.world.player.transparent = true;
  map.world.follower?.setPokemon?.(null);
  map.noEncounters = true;
}

/** Entra en montana_portal (de noche) debajo del overlay y devuelve { map, set }. */
export async function enterMountain(d, overlay, { x, y, hour = 21 } = {}) {
  engine.state.data.clock.minutes = hour * 60;
  const map = new MapScene();
  // Se prepara dentro de enter() para que el primer fotograma ya salga en negro y sin jugador.
  const enter = map.enter.bind(map);
  map.enter = async (params) => {
    await enter(params);
    prepareMap(map);
    map.fx.fadeAmount = 1;
    map.fx.screenTone = [...NIGHT_TONE]; // noche más azul que el tono horario por defecto
  };
  await stageScene(overlay, map, { map: 'montana_portal', x, y, dir: 8 });
  const set = new MountainSet(d, map);
  set.cut(x, y);
  return { map, set };
}

/** P-02: montaña, cascada y portal. Devuelve el sprite de Giratina (flotando sobre el aljibe). */
export async function shotMountain(d, set) {
  const spray = set.particles({ max: 200, shape: 'round' });
  const stopSpray = d.every((f) => { if (f % 3 === 0) set.spray(spray, 2); });
  set.cut(36, 40);
  sfx(SFX.waterfall, { volume: 60 });
  await set.fadeIn(70);
  await d.wait(80);
  // de la cascada a la explanada de ruinas
  await set.pan(SPOTS.plaza.x, SPOTS.plaza.y - 1, 170);
  await d.wait(40);
  // la cámara sube la escalinata hasta la plataforma del portal
  await set.pan(SPOTS.aljibeCenter.x, SPOTS.aljibeCenter.y, 380);
  await d.wait(50);

  // temblor y el aljibe se ilumina de violeta
  sfx(SFX.rumble, { volume: 80 });
  set.shake(3, 5, 70);
  await d.wait(40);
  set.setAljibe(ALJIBE_STATE.violet);
  const halo = set.glow(VIOLET, { w: 40, h: 30, alpha: 0 });
  halo.x = ALJIBE.x;
  halo.y = ALJIBE.holeY;
  sfx(SFX.shadowForce, { volume: 70 });
  set.flash(VIOLET, 0.35, 20);
  await d.tween(halo, { w: 260, h: 170, alpha: 0.9 }, 60, 'out');
  await d.wait(30);

  // corte: la cascada se agita
  set.cut(36, 36);
  sfx(SFX.waterfall2, { volume: 90 });
  sfx(SFX.quake, { volume: 60 });
  set.shake(7, 7, 80);
  const burst = d.every(() => set.spray(spray, 5));
  await d.wait(80);
  burst();
  set.cut(SPOTS.aljibeCenter.x, SPOTS.aljibeCenter.y);
  set.shake(4, 6, 40);
  await d.wait(20);

  // el portal se abre del todo y Giratina emerge
  set.setAljibe(ALJIBE_STATE.open);
  d.tween(halo, { w: 360, h: 240 }, 40, 'out');
  set.flash([230, 200, 255], 0.4, 24);
  const giratina = await set.spriteFirst([front('GIRATINA_1'), front('GIRATINA')], {});
  giratina.x = ALJIBE.x;
  giratina.y = ALJIBE.rimY;
  giratina.crop = 0;
  giratina.tint = [0.1, 0, 0.2, 0.7];
  const motes = set.particles({ max: 240, shape: 'square' });
  const rise = d.every(() => {
    motes.spawn({ x: ALJIBE.x + rand(-70, 70), y: ALJIBE.rimY + rand(-10, 4), vy: rand(-2.6, -0.8), vx: rand(-0.4, 0.4), size: 4, life: 60, color: [200, 150, 255] });
  });
  sfx(SFX.shadowForce2);
  set.shake(6, 6, 150);
  await Promise.all([
    d.tween(giratina, { crop: 1 }, 150, 'inOut'),
    d.tween(giratina.tint, { 3: 0 }, 150, 'in'),
  ]);
  rise();
  bgm('tension', { fadeIn: 20 });
  cry('GIRATINA', 1);
  set.flash(VIOLET, 0.35, 30);
  set.shake(9, 8, 60);
  await d.tween(giratina, { y: ALJIBE.rimY - 36 }, 70, 'out');
  const hover = d.every((f) => { giratina.y = ALJIBE.rimY - 36 + Math.sin(f / 22) * 4; });
  await d.wait(70);
  hover();
  stopSpray();
  set.setAljibe(ALJIBE_STATE.violet);
  d.tween(halo, { w: 220, h: 150, alpha: 0.5 }, 60, 'out');
  return { giratina, halo, spray, motes };
}
