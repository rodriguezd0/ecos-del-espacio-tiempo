// PC de almacenamiento (portado de 018_UI_PokemonStorage.rb de Añil): cajas de 6×5, mano, equipo lateral,
// mover/intercambiar, datos, retirar/depositar, objeto, liberar, nombre y fondo de caja.
import { engine } from '../../core/engine.js';
import { BOX_COUNT } from '../../core/state.js';
import { ScreenScene, openScene } from '../core/uiScene.js';
import { UI, blit, preload } from '../core/images.js';
import { drawText } from '../core/text.js';
import { C } from '../core/colors.js';
import { drawTypeIcon, drawGender, drawShiny, drawScrollArrow, COMMON_GFX } from '../core/widgets.js';
import { drawPokemonIcon, drawPokemonSprite, preloadPokemon } from '../core/pokemonGfx.js';
import { pokemonView } from '../logic/pokemonInfo.js';
import * as S from '../logic/storageLogic.js';
import { preloadDialogGfx } from '../message/messageScenes.js';
import { playSE, SE, sfx } from '../core/sound.js';
import { showCommands, message, confirm } from './common.js';
import { BAG_FILTERS } from '../logic/bagLogic.js';
import { ui } from '../api.js';

const G = (n) => UI(`Storage/${n}.png`);
const WALLPAPERS = 40;
const PARTY_Y = 32;
const BTN = { party: -2, close: -3, header: -1 };
const HAND = ['cursor_point_1', 'cursor_point_2', 'cursor_grab', 'cursor_fist'];

class StorageScene extends ScreenScene {
  async enter() {
    this.box = 0;
    this.sel = 0; // 0..29 hueco, -1 cabecera, -2 botón equipo, -3 salir
    this.partyOpen = false;
    this.partySel = 0; // 0..5, 6 = Atrás
    this.held = null;
    this.heldFrom = null;
    this.busy = false;
    const s = engine.state;
    const all = [...s.party, ...s.boxes.flat().filter(Boolean)];
    const gfx = ['bg', 'overlay_main', 'overlay_party', 'overlay_lv', ...HAND, `box_${this.wallpaper(0)}`].map(G);
    await Promise.all([preload([...gfx, ...COMMON_GFX]), preloadPokemon(all), preloadDialogGfx()]);
  }

  get st() { return engine.state; }
  get boxes() { return this.st.boxes; }
  get party() { return this.st.party; }

  wallpaper(b) { return this.st.var(`ui.boxBg.${b}`, b % 16); }
  boxName(b) { return this.st.boxName(b); }

  /** Aplica el resultado de una operación de storageLogic mediante la API de GameState. */
  commit({ party, boxes }) {
    this.st.applyStorage({ party, boxes });
  }

  /** Pokémon bajo el cursor. */
  get hovered() {
    if (this.partyOpen) return this.partySel < 6 ? this.party[this.partySel] || null : null;
    return this.sel >= 0 ? this.boxes[this.box][this.sel] : null;
  }

  changeBox(dir) {
    this.box = (this.box + dir + BOX_COUNT) % BOX_COUNT;
    preload([G(`box_${this.wallpaper(this.box)}`)]);
    playSE(SE.cursor);
  }

  tick() {
    if (this.busy) return;
    const inp = this.input;
    if (inp.repeat('L')) { this.changeBox(-1); return; }
    if (inp.repeat('R')) { this.changeBox(1); return; }
    if (this.partyOpen) this.navParty(inp); else this.navBox(inp);
    if (inp.pressed('B')) this.onBack();
    else if (inp.pressed('A')) { sfx.decision(); this.run(() => this.onAction()); }
  }

  navBox(inp) {
    const s = this.sel;
    let n = s;
    if (inp.repeat('LEFT')) {
      if (s === BTN.header) { this.changeBox(-1); return; }
      n = s >= 0 ? (s % 6 === 0 ? s + 5 : s - 1) : s === BTN.party ? BTN.close : BTN.party;
    } else if (inp.repeat('RIGHT')) {
      if (s === BTN.header) { this.changeBox(1); return; }
      n = s >= 0 ? (s % 6 === 5 ? s - 5 : s + 1) : s === BTN.party ? BTN.close : BTN.party;
    } else if (inp.repeat('UP')) {
      n = s >= 6 ? s - 6 : s >= 0 ? BTN.header : s === BTN.header ? BTN.party : 24 + (s === BTN.close ? 4 : 1);
    } else if (inp.repeat('DOWN')) {
      n = s >= 24 ? (s % 6 < 3 ? BTN.party : BTN.close) : s >= 0 ? s + 6 : s === BTN.header ? 0 : BTN.header;
    }
    if (n !== s) { this.sel = n; sfx.cursor(); }
  }

  navParty(inp) {
    const s = this.partySel;
    let n = s;
    if (inp.repeat('LEFT') || inp.repeat('RIGHT')) n = s === 6 ? 6 : s ^ 1;
    else if (inp.repeat('UP')) n = s === 6 ? 4 : s >= 2 ? s - 2 : 6;
    else if (inp.repeat('DOWN')) n = s === 6 ? 0 : s <= 3 ? s + 2 : 6;
    if (n !== s) { this.partySel = n; sfx.cursor(); }
  }

  onBack() {
    sfx.cancel();
    if (this.held) { this.returnHeld(); return; }
    if (this.partyOpen) { this.partyOpen = false; return; }
    this.finish();
  }

  async run(fn) {
    this.busy = true;
    try {
      await fn();
    } catch (err) {
      await message(err.message || String(err));
    }
    this.busy = false;
  }

  async onAction() {
    if (this.partyOpen) {
      if (this.partySel === 6) { if (this.held) this.returnHeld(); this.partyOpen = false; return; }
      if (this.held) { this.placeParty(this.partySel); return; }
      if (this.party[this.partySel]) await this.pokemonMenu('party', this.partySel);
      return;
    }
    if (this.sel === BTN.close) {
      if (this.held) { await message('¡Estás sujetando un Pokémon!'); return; }
      this.finish();
      return;
    }
    if (this.sel === BTN.party) { this.partyOpen = true; this.partySel = 0; playSE(SE.menuOpen); return; }
    if (this.sel === BTN.header) { await this.boxMenu(); return; }
    if (this.held) { this.placeBox(this.sel); return; }
    if (this.boxes[this.box][this.sel]) await this.pokemonMenu('box', this.sel);
  }

  pick(where, i) {
    if (where === 'box') {
      const r = S.takeFromBox(this.boxes, this.box, i);
      this.commit(r);
      this.held = r.held;
      this.heldFrom = { where, box: this.box, i };
    } else {
      const r = S.takeFromParty(this.party, i);
      this.commit(r);
      this.held = r.held;
      this.heldFrom = { where, i };
    }
    playSE(SE.storagePick);
  }

  placeBox(i) {
    const r = S.placeInBox(this.boxes, this.box, i, this.held);
    this.commit(r);
    this.held = r.held;
    if (this.held) this.heldFrom = { where: 'box', box: this.box, i };
    playSE(SE.storagePut);
  }

  placeParty(i) {
    const r = S.placeInParty(this.party, i, this.held);
    this.commit(r);
    this.held = r.held;
    if (this.held) this.heldFrom = { where: 'party', i: Math.min(i, this.party.length) };
    playSE(SE.storagePut);
  }

  /** Devuelve lo que se sujeta a su sitio de origen (o a la primera caja libre). */
  returnHeld() {
    const f = this.heldFrom;
    if (f?.where === 'party' && this.party.length < S.PARTY_LIMIT) this.commit({ party: [...this.party, this.held] });
    else {
      const b = f?.where === 'box' && !this.boxes[f.box][f.i] ? f.box : this.boxes.findIndex((x) => S.firstFree(x) >= 0);
      const i = f?.where === 'box' && b === f.box ? f.i : S.firstFree(this.boxes[b]);
      this.commit(S.placeInBox(this.boxes, b, i, this.held));
    }
    this.held = null;
    this.heldFrom = null;
    playSE(SE.storagePut);
  }

  async pokemonMenu(where, i) {
    const p = where === 'box' ? this.boxes[this.box][i] : this.party[i];
    const name = pokemonView(engine.data, p).name;
    const cmds = ['Mover', 'Datos', where === 'box' ? 'Retirar' : 'Depositar', 'Objeto', 'Liberar', 'Cancelar'];
    const c = await showCommands(cmds, { message: undefined });
    const cmd = cmds[c];
    if (cmd === 'Mover') this.pick(where, i);
    else if (cmd === 'Datos') await ui.openSummary(p, { party: [p] });
    else if (cmd === 'Retirar') {
      this.st.withdrawPokemon(this.box, i);
      await message(`${name} se ha unido a tu equipo.`);
    } else if (cmd === 'Depositar') {
      const r = this.st.depositPokemon(i, this.box);
      await message(`${name} se ha guardado en ${this.boxName(r.box)}.`);
      this.partySel = Math.min(this.partySel, Math.max(0, this.party.length - 1));
    } else if (cmd === 'Objeto') await this.itemMenu(where, i, p, name);
    else if (cmd === 'Liberar') await this.release(where, i, name);
  }

  setAt(where, i, p) {
    if (where === 'party') this.st.setPartyMember(i, p);
    else this.st.setBoxPokemon(this.box, i, p);
  }

  async itemMenu(where, i, p, name) {
    const c = await showCommands(['Dar', 'Quitar', 'Cancelar']);
    const db = engine.data;
    if (c === 1) {
      if (!p.heldItem) { await message(`${name} no lleva ningún objeto.`); return; }
      this.st.addItem(p.heldItem, 1);
      this.setAt(where, i, { ...p, heldItem: null });
      await message(`Has guardado ${db.items[p.heldItem]?.name || p.heldItem} en la Mochila.`);
    } else if (c === 0) {
      const item = await ui.openBag({ mode: 'select', filter: BAG_FILTERS.holdable, message: `¿Qué le das a ${name}?` });
      if (!item) return;
      if (p.heldItem) this.st.addItem(p.heldItem, 1);
      this.st.removeItem(item, 1);
      this.setAt(where, i, { ...p, heldItem: item });
      await message(`${name} ahora lleva ${db.items[item]?.name || item}.`);
    }
  }

  async release(where, i, name) {
    if (where === 'party' && !S.canRemoveFromParty(this.party, i)) { await message('¡Es tu último Pokémon!'); return; }
    if (!(await confirm(`¿Seguro que quieres liberar a ${name}?`))) return;
    this.st.releasePokemon(where === 'party' ? { party: i } : { box: this.box, slot: i });
    await message(`Has liberado a ${name}.`);
    await message(`¡Adiós, ${name}!`);
  }

  async boxMenu() {
    const c = await showCommands(['Cambiar nombre', 'Fondo', 'Cancelar']);
    if (c === 0) {
      const name = await ui.textEntry({ title: `Nombre de la caja`, initial: this.boxName(this.box), maxLength: 12 });
      if (name && name.trim()) this.st.renameBox(this.box, name);
    } else if (c === 1) {
      const next = (this.wallpaper(this.box) + 1) % WALLPAPERS;
      this.st.setVar(`ui.boxBg.${this.box}`, next);
      await preload([G(`box_${next}`)]);
    }
  }

  draw(g) {
    blit(g, G('bg'), 0, 0);
    this.drawBox(g, 184, 18);
    blit(g, G('overlay_main'), 0, 0);
    this.drawInfo(g);
    const btn = { color: C.white, shadow: '#505050', outline: true };
    drawText(g, `Equipo: ${this.party.length}`, 270, 334, { ...btn, align: 'center' });
    drawText(g, 'Salir', 446, 334, { ...btn, align: 'center' });
    if (this.partyOpen) this.drawParty(g, 182, PARTY_Y);
    this.drawHand(g);
  }

  drawBox(g, x, y) {
    blit(g, G(`box_${this.wallpaper(this.box)}`), x, y);
    drawText(g, this.boxName(this.box), x + 162, y + 14, { color: C.white, shadow: '#283030', align: 'center' });
    if (this.sel === BTN.header && !this.partyOpen) {
      drawScrollArrow(g, 'left', x + 12, y + 18, this.t);
      drawScrollArrow(g, 'right', x + 272, y + 18, this.t);
    }
    const box = this.boxes[this.box];
    for (let i = 0; i < 30; i++) {
      const p = box[i];
      if (!p) continue;
      const ix = x + 10 + 48 * (i % 6);
      const iy = y + 30 + 48 * Math.floor(i / 6);
      drawPokemonIcon(g, p, ix + 32, iy + 32, { t: 0 });
    }
  }

  drawParty(g, x, y) {
    blit(g, G('overlay_party'), x, y);
    this.party.forEach((p, i) => {
      const ix = x + 18 + 72 * (i % 2);
      const iy = y + 2 + 16 * (i % 2) + 64 * Math.floor(i / 2);
      drawPokemonIcon(g, p, ix + 32, iy + 32, { t: 0 });
    });
    drawText(g, 'Atrás', x + 86, y + 248, { color: C.white, shadow: '#505050', outline: true, align: 'center' });
  }

  handPos() {
    if (this.partyOpen) {
      if (this.partySel === 6) return [236, 220 + PARTY_Y - 32];
      const i = this.partySel;
      return [182 + 18 + 72 * (i % 2), PARTY_Y + 2 + 16 * (i % 2) + 64 * Math.floor(i / 2) - 32];
    }
    if (this.sel === BTN.header) return [314, -24];
    if (this.sel === BTN.party) return [238, 278];
    if (this.sel === BTN.close) return [414, 278];
    return [(97 + 24 * (this.sel % 6)) * 2, (8 + 24 * Math.floor(this.sel / 6)) * 2];
  }

  drawHand(g) {
    const [hx, hy] = this.handPos();
    const bob = this.held ? 0 : Math.floor(this.t / 20) % 2;
    if (this.held) drawPokemonIcon(g, this.held, hx + 32, hy + 16 + 32, { t: this.t });
    blit(g, G(this.held ? 'cursor_fist' : bob ? 'cursor_point_2' : 'cursor_point_1'), hx, hy);
  }

  drawInfo(g) {
    const p = this.held || this.hovered;
    if (!p) return;
    const v = pokemonView(engine.data, p);
    const base = C.bagText;
    const shadow = C.bagShadow;
    drawPokemonSprite(g, p, 90, 134, { t: this.t });
    drawText(g, v.name, 10, 14, { color: base, shadow });
    drawGender(g, p.gender, 148, 14);
    blit(g, G('overlay_lv'), 6, 246);
    drawText(g, String(v.level), 28, 240, { color: base, shadow });
    v.types.forEach((t, i) => drawTypeIcon(g, t, v.types.length === 1 ? 52 : 18 + 70 * i, 272));
    const none = ['#d0d0d0', '#e0e0e0'];
    if (v.ability) drawText(g, v.ability.name, 86, 312, { color: base, shadow, align: 'center' });
    if (v.item) drawText(g, v.item.name, 86, 348, { color: base, shadow, align: 'center' });
    else drawText(g, 'Sin objeto', 86, 348, { color: none[0], shadow: none[1], align: 'center' });
    if (p.shiny) drawShiny(g, 156, 198);
  }
}

/** Abre el PC de almacenamiento. */
export async function open() {
  if (!engine.state) throw new Error('No hay partida en curso: no se puede abrir el PC.');
  return openScene(new StorageScene());
}
