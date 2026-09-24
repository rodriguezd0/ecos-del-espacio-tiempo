// Pantalla de título: "Pokémon: Ecos del Espacio-Tiempo", "Pulsa A" y menú Continuar / Nueva partida / Opciones.
// Nueva partida → newGameFlow() de content/newgame.js si existe; si no, crea una partida y abre el mapa.
import { engine, SCREEN_W, SCREEN_H } from '../../core/engine.js';
import { Scene } from '../../core/scenes.js';
import { GameState, SaveSystem } from '../../core/state.js';
import { anil, blit, preload } from '../core/images.js';
import { drawText } from '../core/text.js';
import { CommandWindow } from '../core/list.js';
import { preloadDialogGfx } from '../message/messageScenes.js';
import { globalOptionsForNewGame, applyOptions } from '../core/options.js';
import { playSE, SE, sfx } from '../core/sound.js';
import { drawHexOutline } from '../message/messageBox.js';
import * as dialogs from '../message/dialogs.js';
import { ui } from '../api.js';

const BG = anil('Graphics/Titles/Backgrounds/digital.png');
const CELL_COUNT = 22;
const FADE = 20;

function makeCells() {
  return Array.from({ length: CELL_COUNT }, (_, i) => ({
    x: (i * 97) % SCREEN_W,
    y: (i * 53) % SCREEN_H,
    r: 3 + (i % 4),
    speed: 0.15 + (i % 5) * 0.06,
    phase: i * 0.7,
  }));
}

export default class TitleScene extends Scene {
  async enter() {
    engine.state = null;
    this.t = 0;
    this.stage = 'press'; // press → menu → leaving
    this.cells = makeCells();
    this.fade = FADE; // fundido de entrada
    this.busy = false;
    applyOptions();
    await Promise.all([preload([BG]), preloadDialogGfx()]);
  }

  buildMenu() {
    const hasSave = SaveSystem.list().some((s) => s && !s.corrupt);
    this.items = [
      { id: 'load', label: hasSave ? 'Continuar' : 'Cargar partida' },
      { id: 'new', label: 'Nueva partida' },
      { id: 'options', label: 'Opciones' },
    ];
    this.menu = new CommandWindow(this.items.map((i) => i.label), { width: 240, cancelIndex: null, index: hasSave ? 0 : 1 });
    this.menu.x = Math.round((SCREEN_W - this.menu.width) / 2);
    this.menu.y = 228;
  }

  update() {
    this.t += 1;
    for (const c of this.cells) {
      c.y -= c.speed;
      if (c.y < -10) { c.y = SCREEN_H + 10; c.x = (c.x + 131) % SCREEN_W; }
    }
    if (this.stage === 'leaving') { this.fade = Math.min(FADE, this.fade + 1); return; }
    if (this.fade > 0) this.fade -= 1;
    if (this.busy) return;
    const inp = engine.input;
    if (this.stage === 'press') {
      if (inp.pressed('A') || inp.pressed('START')) {
        playSE(SE.decision);
        this.buildMenu();
        this.stage = 'menu';
      }
      return;
    }
    if (inp.pressed('B')) { sfx.cancel(); this.stage = 'press'; return; }
    const r = this.menu.update(inp);
    if (r && r.type === 'select') this.run(this.items[r.index].id);
  }

  async run(id) {
    this.busy = true;
    try {
      if (id === 'options') await ui.openOptions();
      else if (id === 'load') await this.loadGame();
      else if (id === 'new') await this.newGame();
    } catch (err) {
      engine.reportError(err);
    }
    this.busy = false;
    if (this.stage === 'menu') this.buildMenu();
  }

  async loadGame() {
    const state = await ui.openLoad();
    if (!state) return;
    engine.state = state;
    applyOptions(state.options);
    const p = state.player;
    await this.startWorld({ map: p.mapId, x: p.x, y: p.y, dir: p.dir, fromSave: true });
  }

  async newGame() {
    let mod = null;
    try {
      mod = await import('../../content/newgame.js');
    } catch {
      mod = null; // aún no existe: partida mínima
    }
    this.stage = 'leaving';
    await waitFrames(FADE);
    if (mod && typeof mod.newGameFlow === 'function') {
      await mod.newGameFlow();
      return;
    }
    const state = GameState.create({ name: '', gender: 'M' });
    state.data.options = { ...state.data.options, ...globalOptionsForNewGame() };
    engine.state = state;
    await this.startWorld({});
  }

  /** Cambia a la escena del mapa (world/mapScene.js) con los parámetros dados. */
  async startWorld(params) {
    this.stage = 'leaving';
    await waitFrames(FADE);
    let mod;
    try {
      mod = await import('../../world/mapScene.js');
    } catch (err) {
      console.warn('[ui] El mapa todavía no está disponible', err);
      this.stage = 'menu';
      this.fade = 0;
      await dialogs.message('El mundo todavía no está disponible en esta versión de desarrollo.');
      return;
    }
    await engine.scenes.replace(new mod.default(), params);
  }

  drawUI(g) {
    if (!blit(g, BG, 0, 0)) { g.fillStyle = '#0c1c1c'; g.fillRect(0, 0, SCREEN_W, SCREEN_H); }
    this.drawCells(g);
    this.drawTitle(g);
    if (this.stage === 'press' && Math.floor(this.t / 30) % 2 === 0) {
      drawText(g, 'Pulsa A', SCREEN_W / 2, 268, { align: 'center', color: '#f8f8f8', shadow: '#18403c' });
    }
    if (this.stage === 'menu' && this.menu) this.menu.draw(g);
    drawText(g, 'Fangame sin ánimo de lucro. Pokémon © Nintendo, Game Freak, Creatures.', SCREEN_W / 2, 362,
      { align: 'center', color: '#8fb8b0', shadow: '#0a1a18', font: 'tiny' });
    if (this.fade > 0) {
      g.fillStyle = `rgba(0,0,0,${this.fade / FADE})`;
      g.fillRect(0, 0, SCREEN_W, SCREEN_H);
    }
  }

  drawCells(g) {
    for (const c of this.cells) {
      const a = 0.18 + 0.14 * Math.sin(this.t / 50 + c.phase);
      drawHexOutline(g, c.x + Math.sin(this.t / 90 + c.phase) * 6, c.y, c.r, '#b9ff66', a);
    }
  }

  /** Anillo hexagonal que gira despacio detrás del título (motivo de células). */
  drawRing(g, cx, cy) {
    const rot = this.t / 900;
    g.save();
    g.translate(cx, cy);
    g.rotate(rot);
    g.strokeStyle = 'rgba(185,255,102,0.13)';
    g.lineWidth = 2;
    for (const r of [132, 150]) {
      g.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i;
        if (i === 0) g.moveTo(r * Math.cos(a), r * Math.sin(a)); else g.lineTo(r * Math.cos(a), r * Math.sin(a));
      }
      g.closePath();
      g.stroke();
    }
    g.restore();
  }

  drawTitle(g) {
    const cx = SCREEN_W / 2;
    this.drawRing(g, cx, 112);
    const glow = 0.5 + 0.5 * Math.sin(this.t / 45);
    drawText(g, 'Pokémon', cx, 40, { align: 'center', color: '#f8f8f8', shadow: '#1d4a44' });
    drawText(g, 'Ecos del', cx, 78, { align: 'center', color: '#e8fff0', shadow: '#12302c', font: 'big', outline: true });
    drawText(g, 'Espacio-Tiempo', cx, 130, { align: 'center', color: '#e8fff0', shadow: '#12302c', font: 'big', outline: true });
    g.globalAlpha = 0.35 + 0.35 * glow;
    g.fillStyle = '#b9ff66';
    g.fillRect(cx - 150, 196, 300, 2);
    g.globalAlpha = 1;
  }
}

function waitFrames(n) {
  return new Promise((resolve) => {
    let left = n;
    const step = () => { if (--left <= 0) resolve(); else requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });
}
