// Escena de combate (Three.js + canvas UI) al estilo Negro 2/Blanco 2 con los gráficos de Añil.
// Contiene el campo (fondo, bases, sprites, partículas, cámara), el clima, las cajas de datos, la barra
// de mensajes y los menús. La lógica la dirige el motor (battle/core) a través de SceneBattleUI.
import { engine, SCREEN_W, SCREEN_H } from '../../core/engine.js';
import { Scene } from '../../core/scenes.js';
import { Compositor } from '../../render/compositor.js';
import { ScreenFx } from '../../render/screenFx.js';
import { WeatherLayer } from '../../render/weather.js';
import { preload } from '../../ui/core/images.js';
import { COMMON_GFX } from '../../ui/core/widgets.js';
import { preloadDialogGfx } from '../../ui/message/messageScenes.js';
import { Tasks } from './timeline.js';
import { BattleField } from './gfx/field.js';
import { BattlerSprite, TrainerSprite } from './gfx/actors.js';
import { BallSprite } from './fx/ballAnims.js';
import { resolveSheets } from './gfx/fxTextures.js';
import { DataBox, DATABOX_GFX } from './hud/dataBox.js';
import { MessageBar, MESSAGE_GFX } from './hud/messageBar.js';
import { CommandMenu, FightMenu, TargetMenu, MENU_GFX } from './hud/menus.js';
import { AbilitySplash, Lineup, LevelUpPanel, PANEL_GFX } from './hud/panels.js';
import { buildMoveSoundIndex, TYPE_SE } from './moveStyle.js';
import { BATTLE_WEATHER_FX } from './setup.js';
import { trainerPosition, focusPoint } from './layout.js';
import { getCharacter } from '../../content/characters.js';

let moveSounds = null;

/** URL del sprite de un entrenador: id de characters.js, 'anil:<ARCHIVO>' o ruta. */
export function trainerSpriteUrl(sprite) {
  if (!sprite) return null;
  if (sprite.startsWith('anil:')) return engine.assets.anil(`Graphics/Trainers/${sprite.slice(5)}.png`);
  const ch = getCharacter(sprite);
  if (ch) return ch.file;
  if (/\.(png|gif)$/i.test(sprite)) return sprite;
  return engine.assets.anil(`Graphics/Trainers/${sprite}.png`);
}

export class BattleScene extends Scene {
  /** @param {object} meta  datos de presentación de setup.js (fondo, entrenadores, música…) */
  constructor(meta = {}) {
    super();
    this.meta = meta;
    this.tasks = new Tasks();
    this.frame = 0;
    this.fade = 1; // negro al entrar
    this.minimal = engine.state?.options?.battleScene === false;
    this.battlers = []; // índice → BattlerSprite
    this.boxes = []; // índice → DataBox
    this.sideSizes = [1, 1];
    this.message = new MessageBar();
    this.message.autoAdvance = Boolean(meta.auto);
    this.command = new CommandMenu();
    this.fight = new FightMenu();
    this.target = new TargetMenu();
    this.levelUp = new LevelUpPanel();
    this.splash = [new AbilitySplash(0), new AbilitySplash(1)];
    this.lineups = [new Lineup(0), new Lineup(1)];
    this.trainers = { player: null, foe: [] };
    this.balls = [];
    this.battle = null; // referencia de solo lectura al motor (mochila, campo)
  }

  // ---------------------------------------------------------------- ciclo de vida
  async enter() {
    this.compositor = new Compositor();
    this.screen = new ScreenFx(this.compositor);
    this.field = new BattleField();
    this.weather = new WeatherLayer({ playSE: (n) => this.se(n), flash: (c, a, f) => this.screen.flashScreen(c, a, f) });
    const gfx = [...DATABOX_GFX, ...MESSAGE_GFX, ...MENU_GFX, ...PANEL_GFX, ...COMMON_GFX];
    await Promise.all([
      this.field.load(this.meta.backdrop || { file: 'Graphics/Battlebacks/Pradera_bg.png', night: false }),
      preload(gfx), preloadDialogGfx(), resolveSheets(), this.loadTrainers(),
    ]);
    if (!moveSounds && engine.audio?.index?.se) moveSounds = buildMoveSoundIndex([...engine.audio.index.se.values()].map((e) => e.name));
    this.fx = this.makeFacade();
    if (engine.debug) window.__battleScene = this;
  }

  /** Estado resumido para depuración (?debug: window.__battleScene.debugState()). */
  debugState() {
    return {
      frame: this.frame,
      tasks: this.tasks.items.length,
      message: { text: this.message.showText, mode: this.message.mode, state: this.message.box.state, end: this.message.battleEnd },
      menus: { command: this.command.active, fight: this.fight.active, target: this.target.active, levelUp: this.levelUp.active },
      decision: this.battle?.decision,
      fade: this.fade,
    };
  }

  async loadTrainers() {
    const gender = this.meta.playerGender === 'F' ? 'F' : 'M';
    const back = getCharacter(gender === 'F' ? 'protagonista_f' : 'protagonista_m')?.battle?.back;
    const backEntry = back ? getCharacter(back) : null;
    const pp = trainerPosition(0, 0, 1);
    this.trainers.player = new TrainerSprite(this.field.fieldLayer, { side: 0, x: pp.x, y: pp.y });
    if (backEntry) await this.trainers.player.load(backEntry.file, backEntry.cols || 5);
    const sprites = this.meta.trainerSprites || [];
    this.trainers.foe = await Promise.all(sprites.map(async (s, i) => {
      const p = trainerPosition(1, i, sprites.length);
      const t = new TrainerSprite(this.field.fieldLayer, { side: 1, x: p.x, y: p.y });
      const ok = await t.load(trainerSpriteUrl(s) || engine.assets.anil('Graphics/Trainers/CHICO.png'), 1);
      if (!ok) await t.load(engine.assets.anil('Graphics/Trainers/CHICO.png'), 1);
      return t;
    }));
  }

  exit() {
    if (window.__battleScene === this) delete window.__battleScene;
    this.tasks.clear();
    for (const b of this.battlers) b?.dispose();
    for (const b of this.balls) b.dispose();
    this.trainers.player?.dispose();
    for (const t of this.trainers.foe) t.dispose();
    this.field?.dispose();
    this.weather?.dispose();
    this.compositor?.dispose();
  }

  /** Crea sprites y cajas para las posiciones del combate. */
  setupBattlers(snapshot) {
    this.sideSizes = snapshot.sideSizes || [1, 1];
    const n = Math.max(this.sideSizes[0] * 2 - 1, this.sideSizes[1] * 2);
    for (let i = 0; i < n; i++) {
      if (Math.floor(i / 2) >= this.sideSizes[i % 2]) continue;
      const size = this.sideSizes[i % 2];
      this.battlers[i] = new BattlerSprite(this.field.fieldLayer, i, size);
      this.boxes[i] = new DataBox(i, size);
    }
  }

  ballSprite() {
    const b = new BallSprite(this.field.fieldLayer);
    this.balls.push(b);
    return b;
  }

  /** Poké Ball de un combatiente (la del Pokémon del equipo; POKEBALL por defecto). */
  ballOf(view) {
    const party = this.battle?.pbParty?.(view.index);
    return party?.[view.partyIndex]?.ball || 'POKEBALL';
  }

  /** ¿Especie capturada ya en la Pokédex? (icono de la caja de datos rival). */
  isOwned(species) {
    return Boolean(engine.state?.data?.dex?.caught?.[species]);
  }

  // ---------------------------------------------------------------- audio
  se(name, opts) {
    if (!name) return;
    try {
      const p = engine.audio?.playSE?.(name, opts);
      if (p && p.catch) p.catch(() => {});
    } catch (err) {
      console.warn('[combate] SE', name, err);
    }
  }

  cry(index, opts = {}) {
    const v = this.battlers[index]?.view;
    if (!v) return;
    try {
      const p = engine.audio?.playCry?.(v.species, v.form || 0, opts);
      if (p && p.catch) p.catch(() => {});
    } catch (err) {
      console.warn('[combate] grito', err);
    }
  }

  bgm(name, opts = {}) {
    try {
      const p = engine.audio?.playBGM?.(name, opts);
      if (p && p.catch) p.catch(() => {});
    } catch (err) {
      console.warn('[combate] BGM', err);
    }
  }

  moveSE(move, info) {
    const key = String(move?.id || '').toUpperCase();
    this.se(moveSounds?.get(key) || TYPE_SE[info.type]);
  }

  // ---------------------------------------------------------------- fachada para animaciones
  makeFacade() {
    const scene = this;
    return {
      get tasks() { return scene.tasks; },
      get particles() { return scene.field.particles; },
      get cam() { return scene.field.cam; },
      get minimal() { return scene.minimal; },
      caughtBall: null,
      sprite: (i) => (scene.battlers[i]?.visible ? scene.battlers[i] : null),
      point: (i) => {
        const s = scene.battlers[i];
        return s?.atlas ? s.center : focusPoint(i, scene.sideSizes[i % 2] || 1);
      },
      feet: (i) => {
        const s = scene.battlers[i];
        return s ? s.anchor : focusPoint(i, 1, 0);
      },
      flash: (c, a, f) => scene.screen.flashScreen(c, a, f),
      tone: (t, frames) => scene.screen.toneTo(t, frames),
      se: (n, o) => scene.se(n, o),
      cry: (i, o) => scene.cry(i, o),
      moveSE: (m, info) => scene.moveSE(m, info),
      ballSprite: () => scene.ballSprite(),
      weatherFx: (w) => scene.setWeather(w, true),
      terrainFx: (t) => scene.setTerrain(t, true),
    };
  }

  /** Clima visual (y destello al empezar). */
  async setWeather(w, announce = false) {
    const [type, power] = BATTLE_WEATHER_FX[w] || BATTLE_WEATHER_FX.None;
    const changed = type !== this.weather.type;
    if (changed) await this.weather.set(type, power).catch((e) => console.warn(e.message));
    if (!announce || this.minimal || type === 'none') return;
    if (changed) {
      this.screen.flashScreen([255, 255, 255], 70, 10);
      await this.tasks.wait(24);
    } else {
      // El clima sigue: breve pulso de tono en lugar de otro destello
      this.screen.flashScreen(type === 'sun' ? [255, 230, 150] : [200, 220, 255], 36, 16);
      await this.tasks.wait(12);
    }
  }

  async setTerrain(t, announce = false) {
    this.field.setTerrain(t);
    if (announce && !this.minimal && t && t !== 'None') await this.tasks.wait(20);
  }

  // ---------------------------------------------------------------- fundidos
  fadeTo(target, frames = 16) {
    const from = this.fade;
    return this.tasks.tween(frames, (k) => { this.fade = from + (target - from) * k; });
  }

  // ---------------------------------------------------------------- bucle
  get fastForward() {
    return engine.input.held('RUN') || Boolean(this.meta.auto);
  }

  step() {
    this.frame += 1;
    this.tasks.update();
    this.field.update();
    for (const b of this.battlers) b?.update(this.frame);
    for (const b of this.boxes) b?.update();
    for (const b of this.balls) b.update();
    this.trainers.player?.update();
    for (const t of this.trainers.foe) t.update();
    for (const s of this.splash) s.update();
    for (const l of this.lineups) l.update();
    this.screen.update();
    this.weather.update(1 / 60);
  }

  update() {
    const input = engine.input;
    const fast = this.fastForward;
    const steps = fast && !this.menuOpen ? 2 : 1;
    for (let i = 0; i < steps; i++) this.step();
    this.message.update(input, fast);
    this.levelUp.update(input, fast);
    this.command.update(input);
    this.fight.update(input);
    this.target.update(input);
    const sel = this.target.current;
    this.battlers.forEach((b, i) => {
      if (!b) return;
      if (sel >= 0) b.selected = i === sel ? 2 : 0;
      else b.selected = this.selectedBattler === i ? 1 : 0;
    });
    this.boxes.forEach((b, i) => { if (b) b.selected = sel >= 0 ? i === sel : this.selectedBattler === i; });
  }

  /** Con una pantalla transparente encima (fundidos de Mochila/Equipo), el campo sigue animándose. */
  updateWhilePaused() {
    this.step();
  }

  get menuOpen() {
    return this.command.active || this.fight.active || this.target.active;
  }

  render(renderer) {
    const tone = this.weather.tone();
    this.screen.apply(tone);
    this.compositor.render(renderer, (r) => this.field.render(r), (r) => this.weather.render(r));
  }

  drawUI(g) {
    for (let i = this.boxes.length - 1; i >= 0; i--) this.boxes[i]?.draw(g, this.frame);
    for (const l of this.lineups) l.draw(g);
    for (const s of this.splash) s.draw(g);
    if (!this.menuOpen) this.message.draw(g);
    this.command.draw(g);
    this.fight.draw(g);
    this.target.draw(g);
    this.levelUp.draw(g);
    if (this.fade > 0) {
      g.fillStyle = `rgba(0,0,0,${Math.min(1, this.fade)})`;
      g.fillRect(0, 0, SCREEN_W, SCREEN_H);
    }
  }
}
