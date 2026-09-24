// Tienda (portada de 021_UI_PokeMart.rb de Añil): comprar con lista y vender desde la mochila.
import { engine } from '../../core/engine.js';
import { ScreenScene, openScene } from '../core/uiScene.js';
import { UI, blit, preload } from '../core/images.js';
import { drawText, drawParagraph, cropText, textWidth } from '../core/text.js';
import { drawWindow, preloadSkins } from '../core/windowskin.js';
import { C } from '../core/colors.js';
import { drawItemIcon, itemIconUrl, drawScrollArrow, COMMON_GFX } from '../core/widgets.js';
import { ListCursor } from '../core/list.js';
import { preloadDialogGfx } from '../message/messageScenes.js';
import { playSE, sfx } from '../core/sound.js';
import { formatNumber, formatMoney } from '../logic/format.js';
import { sellPrice, isKeyItem, BAG_FILTERS } from '../logic/bagLogic.js';
import { message, confirm, chooseNumber, closeMessage } from './common.js';
import * as dialogs from '../message/dialogs.js';
import { ui } from '../api.js';

const ROWS = 7;
const GOLD = 'goldskin';
const MAX_QTY = 99;

/** Precio de compra de un objeto (con posible tabla de precios propia). */
export function buyPrice(itemsDb, id, prices) {
  return prices?.[id] ?? itemsDb[id]?.price ?? 0;
}

class BuyScene extends ScreenScene {
  constructor(stock, opts) {
    super();
    this.stock = stock;
    this.opts = opts;
    this.busy = false;
  }

  async enter() {
    this.cursor = new ListCursor(this.stock.length + 1, ROWS, { wrap: true });
    await Promise.all([
      preload([UI('Mart/bg.png'), UI('Mart/cursor.png'), ...COMMON_GFX, ...this.stock.map(itemIconUrl)]),
      preloadSkins([GOLD]), preloadDialogGfx(),
    ]);
  }

  get current() {
    return this.stock[this.cursor.index] || null;
  }

  /** El fondo de la tienda deja ver el mapa a la izquierda (como en Añil). */
  get transparent() {
    return true;
  }

  tick() {
    if (this.busy) return;
    const inp = this.input;
    this.cursor.handle(inp);
    if (inp.pressed('B')) { sfx.cancel(); this.finish(); return; }
    if (inp.pressed('A')) {
      if (!this.current) { sfx.cancel(); this.finish(); return; }
      sfx.decision();
      this.busy = true;
      this.buy(this.current).catch((err) => engine.reportError(err)).finally(() => { this.busy = false; });
    }
  }

  async buy(id) {
    const s = engine.state;
    const db = engine.data;
    const item = db.items[id];
    const price = buyPrice(db.items, id, this.opts.prices);
    const money = s.player.money;
    if (money < price) { await message('No tienes suficiente dinero.'); return; }
    let qty = 1;
    if (isKeyItem(item)) {
      if (s.hasItem(id)) { await message('Ya tienes uno de esos.'); return; }
      if (!(await confirm(`¿Así que quieres ${item.name}? Serán ${formatMoney(price)}. ¿Te parece bien?`))) return;
    } else {
      const max = Math.max(1, Math.min(MAX_QTY, Math.floor(money / Math.max(1, price)), 999 - s.itemCount(id)));
      qty = await chooseNumber({
        min: 1, max, initial: 1, message: `¿Cuántos ${item.namePlural || item.name} quieres?`,
        formatter: (n) => formatMoney(n * price),
      });
      if (!qty) return;
      const label = qty === 1 ? item.name : item.namePlural || item.name;
      if (!(await confirm(`¿Así que quieres ${qty} ${label}? Serán ${formatMoney(qty * price)}. ¿Te parece bien?`))) return;
    }
    s.addMoney(-qty * price);
    s.addItem(id, qty);
    playSE('Mart buy item');
    await message('¡Aquí tienes! ¡Muchas gracias!');
    if ((item.flags || []).includes('PokeBall') && qty >= 10 && db.items.PREMIERBALL) {
      const bonus = Math.floor(qty / 10);
      s.addItem('PREMIERBALL', bonus);
      const pb = db.items.PREMIERBALL;
      await message(`Recibes ${bonus} ${bonus === 1 ? pb.name : pb.namePlural || pb.name} extra.`);
    }
  }

  draw(g) {
    blit(g, UI('Mart/bg.png'), 0, 0);
    const s = engine.state;
    const db = engine.data;
    const c = this.cursor;
    for (let r = 0; r < ROWS; r++) {
      const i = c.top + r;
      if (i >= c.count) break;
      const y = 26 + r * 32;
      if (i === c.index) blit(g, UI('Mart/cursor.png'), 196, y);
      const id = this.stock[i];
      if (!id) { drawText(g, 'CANCELAR', 212, y, { color: C.bagText, shadow: C.bagShadow }); continue; }
      const price = formatMoney(buyPrice(db.items, id, this.opts.prices));
      drawText(g, cropText(db.items[id]?.name || id, 270 - textWidth(price)), 212, y, { color: C.bagText, shadow: C.bagShadow });
      drawText(g, price, 492, y, { color: C.bagText, shadow: C.bagShadow, align: 'right' });
    }
    if (c.canScrollUp) drawScrollArrow(g, 'up', 340, 0, this.t);
    if (c.canScrollDown) drawScrollArrow(g, 'down', 340, 236, this.t);
    const id = this.current;
    if (id) drawItemIcon(g, id, 12, 310);
    drawParagraph(g, id ? db.items[id]?.description || '' : 'Dejar de comprar.', 80, 286, 416, { color: C.white, shadow: '#000000', maxLines: 3 });
    // Dinero y cantidad en la mochila (ventanas doradas)
    drawWindow(g, GOLD, 0, 0, 190, 96);
    const gold = { color: '#fafafa', shadow: '#4b4b4b' };
    drawText(g, 'Dinero:', 16, 14, gold);
    drawText(g, formatMoney(s.player.money), 174, 46, { ...gold, align: 'right' });
    if (id) {
      drawWindow(g, GOLD, 0, 218, 190, 64);
      drawText(g, 'En Mochila:', 16, 232, gold);
      drawText(g, formatNumber(s.itemCount(id)), 174, 232, { ...gold, align: 'right' });
    }
  }
}

async function sellFlow() {
  const s = engine.state;
  const db = engine.data;
  for (;;) {
    const id = await ui.openBag({ mode: 'select', filter: BAG_FILTERS.sellable, message: '¿Qué quieres vender?' });
    if (!id) return;
    const item = db.items[id];
    const each = sellPrice(item);
    if (each <= 0) { await message(`Oh, no. No puedo comprar ${item.namePlural || item.name}.`); continue; }
    const have = s.itemCount(id);
    let qty = 1;
    if (have > 1) {
      qty = await chooseNumber({
        min: 1, max: have, initial: 1, message: `¿Cuántos ${item.namePlural || item.name} quieres vender?`,
        formatter: (n) => formatMoney(n * each),
      });
      if (!qty) continue;
    }
    if (!(await confirm(`Puedo pagarte ${formatMoney(qty * each)}. ¿Te parece bien?`))) continue;
    s.removeItem(id, qty);
    s.addMoney(qty * each);
    playSE('Mart buy item');
    await message(`Has entregado ${qty === 1 ? item.name : item.namePlural || item.name} y has recibido ${formatMoney(qty * each)}.`);
  }
}

/**
 * Tienda completa con el diálogo del dependiente.
 * @param {string[]} items IDs en venta
 * @param {{ mode?: 'both'|'buy'|'sell', greeting?: string, prices?: Record<string, number> }} opts
 */
export async function open(items = [], opts = {}) {
  if (!engine.state) throw new Error('No hay partida en curso: no se puede abrir la tienda.');
  const db = engine.data;
  const stock = items.filter((id) => {
    if (!db.items[id]) { console.warn(`[ui] Tienda: objeto desconocido ${id}`); return false; }
    return true;
  });
  const mode = opts.mode || 'both';
  const cmds = [];
  if (mode !== 'sell') cmds.push(['buy', 'Quiero comprar']);
  if (mode !== 'buy') cmds.push(['sell', 'Quiero vender']);
  cmds.push(['quit', 'No, gracias']);
  let text = opts.greeting || '¡Bienvenido! ¿En qué te puedo ayudar?';
  for (;;) {
    const i = await dialogs.choice(cmds.map((c) => c[1]), { message: text, cancel: cmds.length - 1 });
    const cmd = cmds[i]?.[0] || 'quit';
    if (cmd === 'quit') break;
    if (cmd === 'buy') await openScene(new BuyScene(stock, opts));
    else await sellFlow();
    text = '¿Puedo ayudarte en algo más?';
  }
  closeMessage();
  await message('¡Vuelve pronto!');
}
