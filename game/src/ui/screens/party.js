// Pantalla de equipo (portada de 006_UI_Party.rb de Añil): paneles, iconos animados, barras de PS,
// cambiar orden, ver datos, objetos y habilidades de campo.
import { engine } from '../../core/engine.js';
import { ScreenScene, openScene } from '../core/uiScene.js';
import { UI, blit, preload } from '../core/images.js';
import { drawText } from '../core/text.js';
import { C } from '../core/colors.js';
import { drawHPBar, drawStatusIcon, drawGender, drawShiny, COMMON_GFX } from '../core/widgets.js';
import { drawPokemonIcon, preloadPokemon } from '../core/pokemonGfx.js';
import { pokemonView, fieldMovesOf } from '../logic/pokemonInfo.js';
import { preloadDialogGfx } from '../message/messageScenes.js';
import { playSE, SE, sfx } from '../core/sound.js';
import { drawHelpWindow, showCommands, message } from './common.js';
import { giveItemTo } from './progression.js';
import { BAG_FILTERS } from '../logic/bagLogic.js';
import { ui } from '../api.js';

const P = (n) => UI(`Party/${n}.png`);
const GFX = [
  'bg', 'panel_blank', 'overlay_hp_back', 'overlay_hp_back_faint', 'overlay_hp_back_swap', 'overlay_lv',
  'icon_ball', 'icon_ball_sel', 'icon_cancel', 'icon_cancel_sel', 'icon_item',
  ...['round', 'rect'].flatMap((s) => ['', '_sel', '_faint', '_faint_sel', '_swap', '_swap_sel', '_swap_sel2'].map((v) => `panel_${s}${v}`)),
].map(P);

const TEXT = C.white;
const TEXT_SHADOW = C.panelShadow;
const CANCEL = 6;
const HELP_W = 358;

class PartyScene extends ScreenScene {
  /** @param {{ mode?: 'view'|'select'|'switch', message?: string, party?: object[], filter?: Function, annotations?: string[], activeIndex?: number }} opts */
  constructor(opts = {}) {
    super();
    this.opts = opts;
    this.mode = opts.mode || 'view';
    this.index = 0;
    this.moving = -1; // índice elegido para intercambiar
    this.busy = false;
    this.help = '';
  }

  get party() {
    return this.opts.party || engine.state?.party || [];
  }

  async enter() {
    await Promise.all([preload([...GFX, ...COMMON_GFX]), preloadPokemon(this.party), preloadDialogGfx()]);
    this.setHelp();
  }

  setHelp(text) {
    if (text) { this.help = text; return; }
    if (this.moving >= 0) this.help = '¿A qué posición lo mueves?';
    else if (this.opts.message) this.help = this.opts.message;
    else this.help = this.mode === 'view' ? 'Elige un Pokémon.' : 'Elige un Pokémon.';
  }

  tick() {
    if (this.busy) return;
    const inp = this.input;
    const n = this.party.length;
    const old = this.index;
    if (inp.repeat('UP')) this.index = this.index === CANCEL ? Math.max(0, n - (n % 2 === 0 ? 2 : 1)) : this.index - 2;
    else if (inp.repeat('DOWN')) this.index = this.index === CANCEL ? 0 : this.index + 2;
    else if (inp.repeat('LEFT')) this.index = this.index === CANCEL ? n - 1 : this.index - 1;
    else if (inp.repeat('RIGHT')) this.index = this.index === CANCEL ? 0 : this.index + 1;
    if (this.index !== old) {
      if (this.index < 0) this.index = CANCEL;
      else if (this.index >= n && this.index !== CANCEL) this.index = old === CANCEL ? 0 : CANCEL;
      sfx.cursor();
    }
    if (inp.pressed('B')) {
      if (this.moving >= 0) { sfx.cancel(); this.moving = -1; this.setHelp(); return; }
      sfx.cancel();
      this.finish(null);
      return;
    }
    if (inp.pressed('A')) {
      if (this.index === CANCEL) {
        sfx.cancel();
        if (this.moving >= 0) { this.moving = -1; this.setHelp(); return; }
        this.finish(null);
        return;
      }
      sfx.decision();
      this.run(() => this.onSelect(this.index));
    }
  }

  async run(fn) {
    this.busy = true;
    try {
      await fn();
    } catch (err) {
      engine.reportError(err);
    }
    this.busy = false;
    if (this.phase === 'active') this.setHelp();
  }

  async onSelect(i) {
    const p = this.party[i];
    if (!p) return;
    if (this.moving >= 0) { this.swap(this.moving, i); return; }
    if (this.mode === 'select') {
      if (this.opts.filter && !this.opts.filter(p)) {
        sfx.buzzer();
        await message('Ese Pokémon no se puede elegir.');
        return;
      }
      this.finish(i);
      return;
    }
    if (this.mode === 'switch') { await this.switchMenu(i, p); return; }
    await this.fieldMenu(i, p);
  }

  async switchMenu(i, p) {
    const name = pokemonView(engine.data, p).name;
    this.setHelp(`¿Qué hacer con ${name}?`);
    const c = await showCommands(['Cambiar', 'Datos', 'Cancelar']);
    if (c === 0) {
      if (p.hp <= 0) { await message(`¡A ${name} no le quedan fuerzas para luchar!`); return; }
      if (this.opts.activeIndex === i) { await message(`¡${name} ya está luchando!`); return; }
      this.finish(i);
    } else if (c === 1) {
      await ui.openSummary(p, { party: this.party, index: i });
    }
  }

  async fieldMenu(i, p) {
    const name = pokemonView(engine.data, p).name;
    const moves = fieldMovesOf(p);
    const items = ['Datos', ...moves.map((m) => ({ label: m.name, color: ['#0050a0', '#80c0f0'] })), 'Mover', 'Objeto', 'Salir'];
    this.setHelp(`¿Qué hacer con ${name}?`);
    const c = await showCommands(items);
    if (c < 0 || c === items.length - 1) return;
    if (c === 0) {
      const idx = await ui.openSummary(p, { party: this.party, index: i });
      if (Number.isInteger(idx)) this.index = idx;
      return;
    }
    if (c <= moves.length) {
      if (p.hp <= 0) { await message('Este Pokémon está debilitado y no puede usar el movimiento.'); return; }
      this.finish({ type: 'fieldMove', move: moves[c - 1].id, partyIndex: i });
      return;
    }
    const label = items[c];
    if (label === 'Mover') {
      if (this.party.length < 2) return;
      this.moving = i;
      this.setHelp();
      return;
    }
    if (label === 'Objeto') await this.itemMenu(i, p);
  }

  async itemMenu(i, p) {
    const c = await showCommands(['Dar', 'Quitar', 'Cancelar']);
    const s = engine.state;
    const db = engine.data;
    const name = pokemonView(db, p).name;
    if (c === 0) {
      const item = await ui.openBag({ mode: 'select', message: `¿Qué le das a ${name}?`, filter: BAG_FILTERS.holdable });
      if (item) await giveItemTo(i, item);
    } else if (c === 1) {
      if (!p.heldItem) { await message(`${name} no lleva ningún objeto.`); return; }
      const oldName = db.items[p.heldItem]?.name || p.heldItem;
      s.addItem(p.heldItem, 1);
      s.setPartyMember(i, { ...p, heldItem: null });
      await message(`Has guardado ${oldName} en la Mochila.`);
    }
  }

  swap(a, b) {
    this.moving = -1;
    if (a === b) return;
    playSE(SE.partySwitch);
    if (this.opts.party) {
      const list = this.opts.party.slice();
      [list[a], list[b]] = [list[b], list[a]];
      this.opts.party = list;
    } else {
      engine.state.swapParty(a, b);
    }
    this.index = b;
  }

  draw(g) {
    blit(g, P('bg'), 0, 0);
    for (let i = 0; i < 6; i++) this.drawPanel(g, i);
    const selCancel = this.index === CANCEL;
    blit(g, P(selCancel ? 'icon_cancel_sel' : 'icon_cancel'), 398, 328);
    drawText(g, this.moving >= 0 ? 'CANCELAR' : 'SALIR', 398 + 56, 328 + 14, { align: 'center', color: TEXT, shadow: TEXT_SHADOW });
    drawHelpWindow(g, this.help, HELP_W);
  }

  drawPanel(g, i) {
    const x = (i % 2) * 256;
    const y = 16 * (i % 2) + 96 * Math.floor(i / 2);
    const p = this.party[i];
    if (!p) { blit(g, P('panel_blank'), x, y); return; }
    const v = pokemonView(engine.data, p);
    const selected = this.index === i;
    const shape = i === 0 ? 'round' : 'rect';
    let variant = '';
    if (this.moving === i) variant = selected ? '_swap_sel2' : '_swap';
    else if (this.moving >= 0 && selected) variant = '_swap_sel';
    else if (v.fainted) variant = selected ? '_faint_sel' : '_faint';
    else if (selected) variant = '_sel';
    blit(g, P(`panel_${shape}${variant}`), x, y);
    blit(g, P(selected ? 'icon_ball_sel' : 'icon_ball'), x + 10, y);
    drawPokemonIcon(g, p, x + 60, y + 40, { t: this.t, selected, maxHp: v.maxHp });
    if (p.heldItem) blit(g, P('icon_item'), x + 62, y + 48);
    drawText(g, v.name, x + 96, y + 22, { color: TEXT, shadow: TEXT_SHADOW });
    drawGender(g, p.gender, x + 224, y + 22);
    const note = this.opts.annotations?.[i];
    blit(g, P('overlay_lv'), x + 20, y + 70, 0, 0, 22, 14);
    drawText(g, String(v.level), x + 42, y + 68, { color: TEXT, shadow: TEXT_SHADOW, font: 'small' });
    if (note) {
      drawText(g, note, x + 96, y + 62, { color: TEXT, shadow: TEXT_SHADOW });
    } else {
      const back = this.moving === i || (selected && this.moving >= 0) ? 'overlay_hp_back_swap' : v.fainted ? 'overlay_hp_back_faint' : 'overlay_hp_back';
      blit(g, P(back), x + 96, y + 50);
      drawHPBar(g, x + 128, y + 52, v.hp, v.maxHp, 'party');
      drawText(g, `${v.hp}/${v.maxHp}`, x + 224, y + 66, { color: TEXT, shadow: TEXT_SHADOW, align: 'right' });
      drawStatusIcon(g, p, x + 78, y + 68);
    }
    if (p.shiny) drawShiny(g, x + 80, y + 48);
  }
}

/** Abre la pantalla de equipo. Ver ui.openParty. */
export async function open(opts = {}) {
  const party = opts.party || engine.state?.party || [];
  if (!party.length) throw new Error('El equipo está vacío.');
  return openScene(new PartyScene(opts));
}
