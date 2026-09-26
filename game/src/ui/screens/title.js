// Pantalla de título: logo, el Core de Zygarde (sprite original del creador) flotando entre anillos de células,
// "Pulsa A" y el menú Continuar / Nueva partida / Online / Opciones. «Online» permite entrar en una sala ANTES de
// empezar: la conexión sigue viva al crear o cargar la partida y los jugadores se ven en el mapa desde el principio.
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
import { net } from '../../net/netClient.js';

const BG = anil('Graphics/Titles/Backgrounds/digital.png');
const CORE = 'assets/characters/zygarde_core.png'; // hoja 4×4 de 64 px
const CORE_FRAME = 64;
const CORE_SCALE = 3;
const CORE_Y = 236; // centro del Core
const CORE_X_PRESS = SCREEN_W / 2;
const CORE_X_MENU = 128;
const MENU_X = 250;
const MENU_Y = 200;
const MENU_W = 230;
const CELL_COUNT = 22;
const FADE = 20;
const GREEN = '#b9ff66';
const INK = '#e8fff0';
const INK_SHADOW = '#12302c';

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
    this.menu = null;
    this.coreX = CORE_X_PRESS;
    applyOptions();
    await Promise.all([preload([BG, CORE]), preloadDialogGfx()]);
  }

  buildMenu() {
    const hasSave = SaveSystem.list().some((s) => s && !s.corrupt);
    this.items = [
      { id: 'load', label: hasSave ? 'Continuar' : 'Cargar partida' },
      { id: 'new', label: 'Nueva partida' },
      { id: 'online', label: net.status === 'off' ? 'Online' : `Online · ${net.room || '…'}` },
      { id: 'options', label: 'Opciones' },
    ];
    const index = this.menu ? this.menu.index : hasSave ? 0 : 1;
    this.menu = new CommandWindow(this.items.map((i) => i.label), { width: MENU_W, cancelIndex: null, index });
    this.menu.x = MENU_X;
    this.menu.y = MENU_Y;
  }

  update() {
    this.t += 1;
    for (const c of this.cells) {
      c.y -= c.speed;
      if (c.y < -10) { c.y = SCREEN_H + 10; c.x = (c.x + 131) % SCREEN_W; }
    }
    const coreTarget = this.stage === 'press' ? CORE_X_PRESS : CORE_X_MENU;
    this.coreX += (coreTarget - this.coreX) * 0.12;
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
    if (inp.pressed('B')) { sfx.cancel(); this.stage = 'press'; this.menu = null; return; }
    const r = this.menu.update(inp);
    if (r && r.type === 'select') this.run(this.items[r.index].id);
  }

  async run(id) {
    this.busy = true;
    try {
      if (id === 'options') await ui.openOptions();
      else if (id === 'online') await (await import('../../net/onlineMenu.js')).runTitleOnlineMenu();
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
    state.setOptions(globalOptionsForNewGame());
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
    this.drawVignette(g);
    this.drawCells(g);
    this.drawCore(g);
    this.drawTitle(g);
    if (this.stage === 'press') {
      const a = 0.55 + 0.45 * Math.sin(this.t / 14);
      drawText(g, 'Pulsa A', SCREEN_W / 2, 330, { align: 'center', color: '#f8f8f8', shadow: '#18403c', alpha: a });
    }
    if (this.stage === 'menu' && this.menu) this.menu.draw(g);
    this.drawOnlineBadge(g);
    drawText(g, 'Fangame sin ánimo de lucro. Pokémon © Nintendo, Game Freak, Creatures.', SCREEN_W / 2, 366,
      { align: 'center', color: '#8fb8b0', shadow: '#0a1a18', font: 'tiny' });
    if (this.fade > 0) {
      g.fillStyle = `rgba(0,0,0,${this.fade / FADE})`;
      g.fillRect(0, 0, SCREEN_W, SCREEN_H);
    }
  }

  /** Oscurece los bordes para que el logo y el Core destaquen sobre el fondo. */
  drawVignette(g) {
    const grad = g.createRadialGradient(SCREEN_W / 2, 170, 60, SCREEN_W / 2, 190, 360);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,10,8,0.62)');
    g.fillStyle = grad;
    g.fillRect(0, 0, SCREEN_W, SCREEN_H);
  }

  drawCells(g) {
    for (const c of this.cells) {
      const a = 0.18 + 0.14 * Math.sin(this.t / 50 + c.phase);
      drawHexOutline(g, c.x + Math.sin(this.t / 90 + c.phase) * 6, c.y, c.r, GREEN, a);
    }
  }

  /** Dos anillos hexagonales que giran en sentidos opuestos alrededor del Core. */
  drawRings(g, cx, cy) {
    g.save();
    g.translate(cx, cy);
    g.lineWidth = 2;
    [[92, 1, 0.22], [112, -1, 0.12]].forEach(([r, dir, alpha]) => {
      g.save();
      g.rotate((dir * this.t) / 700);
      g.strokeStyle = `rgba(185,255,102,${alpha})`;
      g.beginPath();
      for (let i = 0; i <= 6; i++) {
        const a = (Math.PI / 3) * i;
        if (i === 0) g.moveTo(r * Math.cos(a), r * Math.sin(a) * 0.55); else g.lineTo(r * Math.cos(a), r * Math.sin(a) * 0.55);
      }
      g.stroke();
      g.restore();
    });
    g.restore();
  }

  /** El Core flotando (frame de frente, ×2 sin suavizado), con halo y sombra en el suelo. */
  drawCore(g) {
    const cx = Math.round(this.coreX);
    const bob = Math.round(Math.sin(this.t / 28) * 5);
    const cy = CORE_Y + bob;
    this.drawRings(g, cx, CORE_Y + 18);
    const halo = g.createRadialGradient(cx, cy, 8, cx, cy, 78);
    halo.addColorStop(0, `rgba(185,255,102,${0.26 + 0.08 * Math.sin(this.t / 20)})`);
    halo.addColorStop(1, 'rgba(185,255,102,0)');
    g.fillStyle = halo;
    g.fillRect(cx - 80, cy - 80, 160, 160);
    g.fillStyle = `rgba(0,0,0,${0.32 - bob * 0.02})`;
    g.beginPath();
    g.ellipse(cx, CORE_Y + 70, 34 - bob, 8, 0, 0, Math.PI * 2);
    g.fill();
    const size = CORE_FRAME * CORE_SCALE;
    const frame = Math.floor(this.t / 12) % 4;
    const smooth = g.imageSmoothingEnabled;
    g.imageSmoothingEnabled = false;
    blit(g, CORE, cx - size / 2, cy - size / 2, frame * CORE_FRAME, 0, CORE_FRAME, CORE_FRAME, CORE_SCALE);
    g.imageSmoothingEnabled = smooth;
  }

  drawTitle(g) {
    const cx = SCREEN_W / 2;
    const glow = 0.5 + 0.5 * Math.sin(this.t / 45);
    drawText(g, 'Pokémon', cx, 14, { align: 'center', color: '#f8f8f8', shadow: '#1d4a44' });
    drawText(g, 'Ecos del', cx, 44, { align: 'center', color: INK, shadow: INK_SHADOW, font: 'big', outline: true });
    drawText(g, 'Espacio-Tiempo', cx, 92, { align: 'center', color: INK, shadow: INK_SHADOW, font: 'big', outline: true });
    g.globalAlpha = 0.35 + 0.35 * glow;
    g.fillStyle = GREEN;
    g.fillRect(cx - 150, 154, 300, 2);
    g.globalAlpha = 1;
  }

  /** Estado de la sala online (arriba a la derecha) si se ha entrado desde el título. */
  drawOnlineBadge(g) {
    if (net.status === 'off') return;
    const text = net.status === 'online' ? `Sala ${net.room} · ${net.peers.size + 1}` : 'Conectando…';
    drawText(g, text, SCREEN_W - 8, 6, { align: 'right', color: GREEN, shadow: '#0a1a18', font: 'small' });
  }
}

function waitFrames(n) {
  return new Promise((resolve) => {
    let left = n;
    const step = () => { if (--left <= 0) resolve(); else requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });
}
