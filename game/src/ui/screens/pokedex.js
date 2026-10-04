// Pokédex (portada de 004/005_UI_Pokedex de Añil): catálogo de Axis de 425 entradas (dex_axis.json, D28), con
// vistos/capturados y ficha con sprite animado, categoría, altura/peso, descripción, tipos y área.
import { engine } from '../../core/engine.js';
import { ScreenScene, openScene } from '../core/uiScene.js';
import { UI, anil, blit, preload } from '../core/images.js';
import { drawText, drawParagraph } from '../core/text.js';
import { C } from '../core/colors.js';
import { drawPokemonSprite, spriteUrls } from '../core/pokemonGfx.js';
import { COMMON_GFX } from '../core/widgets.js';
import { ListCursor } from '../core/list.js';
import { preloadDialogGfx } from '../message/messageScenes.js';
import { playSE, SE, sfx, playCry } from '../core/sound.js';
import { pad, formatHeight, formatWeight } from '../logic/format.js';

const D = (n) => UI(`Pokedex/${n}.png`);
const BASE = C.bagText;
const SHADOW = C.bagShadow;
const ROWS = 10;
let lastIndex = 0;

/** Lista de la Pokédex con estado visto/capturado (pura sobre los datos). */
export function dexList(db, dexData) {
  const seen = dexData?.seen || {};
  const caught = dexData?.caught || {};
  return (db.dex?.entries || []).filter((e) => e.id && db.species[e.id]).map((e) => ({
    n: e.n, id: e.id, name: db.species[e.id].name, seen: Boolean(seen[e.id]), caught: Boolean(caught[e.id]),
  }));
}

class PokedexScene extends ScreenScene {
  constructor(opts = {}) {
    super();
    this.opts = opts;
  }

  async enter() {
    this.list = dexList(engine.data, engine.state?.data.dex);
    if (!this.list.length) throw new Error('La Pokédex está vacía (falta dex_axis.json).');
    let idx = lastIndex;
    if (this.opts.species) idx = Math.max(0, this.list.findIndex((e) => e.id === this.opts.species));
    this.cursor = new ListCursor(this.list.length, ROWS, { index: Math.min(idx, this.list.length - 1), wrap: false });
    this.cursor.pageKeys = true;
    this.entry = null; // ficha abierta: { page }
    const gfx = ['bg_list', 'bg_info', 'bg_area', 'cursor_list', 'icon_own', 'icon_seen', 'icon_slider', 'icon_types', 'overlay_areanone'].map(D);
    await Promise.all([preload([...gfx, ...COMMON_GFX]), preloadDialogGfx(), this.preloadAround()]);
    playSE(SE.pokedexOpen);
    if (this.opts.species) this.openEntry();
  }

  preloadAround() {
    const urls = [];
    for (let i = this.cursor.top; i < Math.min(this.list.length, this.cursor.top + ROWS); i++) {
      if (this.list[i].seen) urls.push(...spriteUrls({ species: this.list[i].id }));
    }
    return preload(urls);
  }

  get current() {
    return this.list[this.cursor.index];
  }

  counts() {
    return { seen: this.list.filter((e) => e.seen).length, caught: this.list.filter((e) => e.caught).length };
  }

  tick() {
    const inp = this.input;
    if (this.entry) { this.tickEntry(inp); return; }
    if (this.cursor.handle(inp)) {
      lastIndex = this.cursor.index;
      this.preloadAround();
    }
    if (inp.pressed('B')) { sfx.cancel(); this.finish(undefined); return; }
    if (inp.pressed('A')) {
      if (!this.current.seen) { sfx.buzzer(); return; }
      sfx.decision();
      this.openEntry();
    }
  }

  openEntry() {
    this.entry = { page: 1 };
    const e = this.current;
    preload([anil(`Graphics/Pokemon/Footprints/${e.id}.png`), ...spriteUrls({ species: e.id })]);
    playCry(e.id, 0);
  }

  tickEntry(inp) {
    if (inp.pressed('B')) { sfx.cancel(); this.entry = null; return; }
    if (inp.repeat('LEFT') && this.entry.page > 1) { this.entry.page -= 1; playSE(SE.summaryPage); }
    else if (inp.repeat('RIGHT') && this.entry.page < 2) { this.entry.page += 1; playSE(SE.summaryPage); }
    else if (inp.repeat('UP') || inp.repeat('DOWN')) {
      const dir = inp.repeat('UP') ? -1 : 1;
      for (let i = this.cursor.index + dir; i >= 0 && i < this.list.length; i += dir) {
        if (!this.list[i].seen) continue;
        this.cursor.index = i;
        this.cursor.ensureVisible();
        lastIndex = i;
        this.openEntry();
        break;
      }
    }
  }

  draw(g) {
    if (this.entry) { this.drawEntry(g); return; }
    blit(g, D('bg_list'), 0, 0);
    const c = this.cursor;
    for (let r = 0; r < ROWS; r++) {
      const i = c.top + r;
      const e = this.list[i];
      if (!e) break;
      const y = 46 + r * 32;
      if (i === c.index) blit(g, D('cursor_list'), 222, y - 2);
      if (e.seen) blit(g, D(e.caught ? 'icon_own' : 'icon_seen'), 232, y + 8);
      drawText(g, pad(e.n, 3), 274, y + 4, { color: BASE, shadow: SHADOW });
      drawText(g, e.seen ? e.name : '----------', 322, y + 4, { color: BASE, shadow: SHADOW });
    }
    this.drawSlider(g);
    const cur = this.current;
    drawText(g, 'POKÉDEX DE AXIS', 296, 8, { color: C.white, shadow: '#000000', align: 'center' });
    drawText(g, 'Inventario [PROVISIONAL D28]', 112, 286, { color: '#9cd8c8', shadow: '#000000', align: 'center', font: 'tiny' });
    if (cur.seen) {
      drawText(g, cur.name, 112, 58, { color: BASE, shadow: SHADOW, align: 'center' });
      clipBox(g, 14, 88, 178, 212, () => drawPokemonSprite(g, { species: cur.id, form: 0 }, 112, 196, { t: this.t }));
    }
    const k = this.counts();
    drawText(g, 'Avistados:', 26, 314, { color: BASE, shadow: SHADOW });
    drawText(g, String(k.seen), 190, 314, { color: BASE, shadow: SHADOW, align: 'right' });
    drawText(g, 'Capturados:', 26, 346, { color: BASE, shadow: SHADOW });
    drawText(g, String(k.caught), 190, 346, { color: BASE, shadow: SHADOW, align: 'right' });
  }

  drawSlider(g) {
    const c = this.cursor;
    const sl = D('icon_slider');
    if (c.canScrollUp) blit(g, sl, 468, 48, 0, 0, 40, 30);
    if (c.canScrollDown) blit(g, sl, 468, 346, 0, 30, 40, 30);
    const sliderH = 268;
    let boxH = Math.floor((sliderH * ROWS) / c.count);
    boxH += Math.min((sliderH - boxH) / 2, sliderH / 6);
    boxH = Math.max(Math.floor(boxH), 40);
    const y = 78 + Math.floor(((sliderH - boxH) * c.top) / Math.max(1, c.count - ROWS));
    blit(g, sl, 468, y, 40, 0, 40, 8);
    for (let yy = 8; yy < boxH - 16; yy += 16) blit(g, sl, 468, y + yy, 40, 8, 40, Math.min(16, boxH - 16 - yy));
    blit(g, sl, 468, y + boxH - 16, 40, 24, 40, 16);
  }

  drawEntry(g) {
    const e = this.current;
    const sp = engine.data.species[e.id];
    if (this.entry.page === 2) { this.drawArea(g, e, sp); return; }
    blit(g, D('bg_info'), 0, 0);
    clipBox(g, 14, 56, 178, 164, () => drawPokemonSprite(g, { species: e.id, form: 0 }, 104, 136, { t: this.t }));
    drawText(g, `${pad(e.n, 3)}  ${sp.name}`, 246, 48, { color: C.white, shadow: '#000000' });
    drawText(g, 'Altura', 314, 164, { color: BASE, shadow: SHADOW });
    drawText(g, 'Peso', 314, 196, { color: BASE, shadow: SHADOW });
    if (e.caught) {
      drawText(g, `Pokémon ${sp.category || '?????'}`, 246, 80, { color: BASE, shadow: SHADOW });
      drawText(g, formatHeight(sp.height), 482, 164, { color: BASE, shadow: SHADOW, align: 'right' });
      drawText(g, formatWeight(sp.weight), 482, 196, { color: BASE, shadow: SHADOW, align: 'right' });
      drawParagraph(g, sp.pokedex || '', 40, 246, 432, { color: BASE, shadow: SHADOW, maxLines: 4 });
      blit(g, anil(`Graphics/Pokemon/Footprints/${e.id}.png`), 226, 138);
      blit(g, D('icon_own'), 212, 44);
      (sp.types || []).forEach((t, i) => {
        const row = engine.data.types[t]?.icon ?? 9;
        blit(g, D('icon_types'), 296 + 100 * i, 120, 0, row * 32, 96, 32);
      });
    } else {
      drawText(g, 'Pokémon ?????', 246, 80, { color: BASE, shadow: SHADOW });
      drawText(g, '????,? m', 482, 164, { color: BASE, shadow: SHADOW, align: 'right' });
      drawText(g, '????,? kg', 482, 196, { color: BASE, shadow: SHADOW, align: 'right' });
    }
    drawText(g, 'Der.: área', 500, 12, { color: '#9cd8c8', shadow: '#000000', align: 'right', font: 'tiny' });
  }

  drawArea(g, e, sp) {
    blit(g, D('bg_area'), 0, 0);
    drawText(g, `Área de ${sp.name}`, 256, 8, { color: C.white, shadow: '#000000', align: 'center' });
    blit(g, D('overlay_areanone'), 108, 172);
    drawText(g, 'Área desconocida', 256, 178, { color: BASE, shadow: SHADOW, align: 'center' });
    drawText(g, 'Atlas de Axis pendiente [PROVISIONAL X02]', 256, 226, { color: '#9cd8c8', shadow: '#000000', align: 'center', font: 'small' });
  }
}

function clipBox(g, x, y, w, h, fn) {
  g.save();
  g.beginPath();
  g.rect(x, y, w, h);
  g.clip();
  fn();
  g.restore();
}

/** Abre la Pokédex. opts: { species } abre directamente la ficha de esa especie. */
export async function open(opts = {}) {
  return openScene(new PokedexScene(opts));
}
