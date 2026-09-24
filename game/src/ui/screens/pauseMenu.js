// Menú de pausa estilo DP (gráficos de Añil: Graphics/Pictures/DP Pause Menu), a la derecha sobre el mapa.
import { engine, SCREEN_W } from '../../core/engine.js';
import { UIScene, openScene } from '../core/uiScene.js';
import { anil, blit, blitCentered, preload } from '../core/images.js';
import { drawText } from '../core/text.js';
import { drawWindow, isDarkSkin, skinBorders } from '../core/windowskin.js';
import { messageColors } from '../core/colors.js';
import { menuSkin } from '../core/options.js';
import { preloadDialogGfx } from '../message/messageScenes.js';
import { playSE, SE, sfx } from '../core/sound.js';
import { formatClock, formatMoney } from '../logic/format.js';
import { ui } from '../api.js';

const PIC = (n) => anil(`Graphics/Pictures/DP Pause Menu/${n}.png`);
const PANEL_W = 200;
const ROW_H = 42;
const TEXT = '#f8f8f8';
const TEXT_SHADOW = '#303848';
const TEXT_SEL = '#ffd890';

let lastIndex = 0;

/** Iconos [normal, seleccionado] de cada entrada. */
function icons(key, female) {
  const g = female ? 'f' : 'm';
  const map = {
    pokedex: ['pokedexA', 'pokedexB'], party: ['pokemonA', 'pokemonB'], bag: ['bagA', `bagB${g}`],
    zygarde: ['radar', 'radar'], card: ['playercardA', 'playercardB'], save: ['saveA', `saveB${g}`],
    options: ['optionsA', 'optionsB'], exit: ['exitA', 'exitB'],
  };
  return map[key];
}

/** Entradas visibles según el progreso de la partida. */
export function pauseEntries(state) {
  const d = state.data;
  const z = d.zygarde || {};
  const list = [];
  if (state.hasPokedex ? state.hasPokedex() : d.dex?.obtained) list.push({ key: 'pokedex', label: 'Pokédex' });
  if (d.party.length) list.push({ key: 'party', label: 'Pokémon' });
  list.push({ key: 'bag', label: 'Mochila' });
  if ((z.cells || []).length || (z.cores || []).length || z.form || state.flag('zygarde_menu')) {
    list.push({ key: 'zygarde', label: 'Zygarde' });
  }
  list.push({ key: 'card', label: d.player.name || 'Tarjeta' });
  list.push({ key: 'save', label: 'Guardar' });
  list.push({ key: 'options', label: 'Opciones' });
  list.push({ key: 'exit', label: 'Salir' });
  return list;
}

class PauseMenuScene extends UIScene {
  async enter() {
    this.female = engine.state?.player?.gender === 'F';
    const names = ['bgTop', 'bgMid', 'bgBtm', 'selector'];
    for (const k of ['pokedex', 'party', 'bag', 'zygarde', 'card', 'save', 'options', 'exit']) names.push(...icons(k, this.female));
    await Promise.all([preload(names.map(PIC)), preloadDialogGfx()]);
    this.entries = pauseEntries(engine.state);
    this.index = Math.min(lastIndex, this.entries.length - 1);
    this.busy = false;
    playSE(SE.menuOpen);
  }

  tick() {
    if (this.busy) return;
    const inp = this.input;
    const n = this.entries.length;
    if (inp.repeat('UP')) { this.index = (this.index - 1 + n) % n; sfx.cursor(); }
    else if (inp.repeat('DOWN')) { this.index = (this.index + 1) % n; sfx.cursor(); }
    else if (inp.pressed('B') || inp.pressed('START')) { playSE(SE.menuClose); this.close(null); }
    else if (inp.pressed('A')) this.choose(this.entries[this.index].key);
  }

  async choose(key) {
    if (key === 'exit') { playSE(SE.menuClose); this.close(null); return; }
    sfx.decision();
    lastIndex = this.index;
    this.busy = true;
    try {
      const result = await this.runEntry(key);
      if (result) { this.close(result); return; }
    } catch (err) {
      engine.reportError(err);
    }
    this.busy = false;
    this.entries = pauseEntries(engine.state);
    this.index = Math.min(this.index, this.entries.length - 1);
  }

  async runEntry(key) {
    switch (key) {
      case 'pokedex': await ui.openPokedex(); return null;
      case 'party': {
        const r = await ui.openParty({ mode: 'view' });
        return r && r.type === 'fieldMove' ? r : null;
      }
      case 'bag': {
        const item = await ui.openBag({ mode: 'field' });
        return item ? { type: 'useItem', item } : null;
      }
      case 'zygarde': {
        // La pantalla de Zygarde puede devolver una acción para el mapa ({ type: 'zygarde', action: 'fly' … }).
        const r = await ui.openZygarde();
        return r && r.type ? r : null;
      }
      case 'card': await ui.openTrainerCard(); return null;
      case 'save': await ui.openSave(); return null;
      case 'options': await ui.openOptions(); return null;
      default: return null;
    }
  }

  drawUI(g) {
    this.drawInfo(g);
    const x = SCREEN_W - PANEL_W - 4;
    const y = 4;
    const h = this.entries.length * ROW_H + 16;
    blit(g, PIC('bgTop'), x, y);
    const mid = PIC('bgMid');
    for (let yy = y + 12; yy < y + h - 12; yy++) blit(g, mid, x, yy);
    blit(g, PIC('bgBtm'), x, y + h - 12);
    this.entries.forEach((e, i) => {
      const ry = y + 8 + i * ROW_H;
      const sel = i === this.index;
      if (sel) blit(g, PIC('selector'), x + 8, ry - 5);
      const [a, b] = icons(e.key, this.female);
      blitCentered(g, PIC(sel ? b : a), x + 38, ry + ROW_H / 2 - 1);
      drawText(g, e.label, x + 68, ry + 5, { color: sel ? TEXT_SEL : TEXT, shadow: TEXT_SHADOW });
    });
  }

  /** Recuadro con la hora del reloj de juego y el dinero. */
  drawInfo(g) {
    const s = engine.state;
    if (!s) return;
    const skin = menuSkin();
    const b = skinBorders(skin);
    const w = 176;
    const h = 64 + b.top + b.bottom;
    drawWindow(g, skin, 4, 4, w, h);
    const [base, shadow] = messageColors(null, isDarkSkin(skin));
    const clock = formatClock(s.data.clock?.minutes ?? 0);
    drawText(g, `${clock}  ${s.isDay() ? 'Día' : 'Noche'}`, 4 + b.left + 2, 4 + b.top - 2, { color: base, shadow });
    drawText(g, formatMoney(s.player.money), 4 + w - b.right - 2, 4 + b.top + 30, { color: base, shadow, align: 'right' });
  }
}

/** Abre el menú de pausa. Devuelve null o una acción para el mundo. */
export async function open() {
  if (!engine.state) throw new Error('No hay partida en curso: no se puede abrir el menú de pausa.');
  return openScene(new PauseMenuScene());
}
