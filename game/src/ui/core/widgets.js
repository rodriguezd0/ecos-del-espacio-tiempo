// Componentes gráficos pequeños reutilizables: cursores y flechas animadas, barras de PS/EXP,
// iconos de tipo/estado/categoría, símbolos de género y brillo, iconos de objeto.
import { engine } from '../../core/engine.js';
import { UI, anil, blit, failed } from './images.js';
import { drawText } from './text.js';
import { C } from './colors.js';

export const GFX = {
  selArrow: UI('sel_arrow.png'),
  selArrowWhite: UI('sel_arrow_white.png'),
  pauseArrow: UI('pause_arrow.png'),
  upArrow: UI('up_arrow.png'),
  downArrow: UI('down_arrow.png'),
  leftArrow: UI('left_arrow.png'),
  rightArrow: UI('right_arrow.png'),
  types: UI('types.png'),
  statuses: UI('statuses.png'),
  category: UI('category.png'),
  shiny: UI('shiny.png'),
  partyHP: UI('Party/overlay_hp.png'),
  summaryHP: UI('Summary/overlay_hp.png'),
  summaryExp: UI('Summary/overlay_exp.png'),
};

export const COMMON_GFX = Object.values(GFX);

/** Flecha de selección (sel_arrow) en (x, y). */
export function drawSelArrow(g, x, y, dark = false) {
  blit(g, dark ? GFX.selArrowWhite : GFX.selArrow, x, y);
}

/** Flecha de "continuar" animada (4 frames de 20×28). */
export function drawPauseArrow(g, x, y, t) {
  const frame = Math.floor(t / 6) % 4;
  blit(g, GFX.pauseArrow, x, y, frame * 20, 0, 20, 28);
}

/** Flechas de desplazamiento animadas: dir 'up'|'down' (28×40) o 'left'|'right' (40×28). 8 frames. */
export function drawScrollArrow(g, dir, x, y, t) {
  const frame = Math.floor(t / 4) % 8;
  if (dir === 'up' || dir === 'down') blit(g, dir === 'up' ? GFX.upArrow : GFX.downArrow, x, y, frame * 28, 0, 28, 40);
  else blit(g, dir === 'left' ? GFX.leftArrow : GFX.rightArrow, x, y, 0, frame * 28, 40, 28);
}

/** Zona de color de la barra de PS: 0 verde, 1 amarillo (≤ ½), 2 rojo (≤ ¼). */
export function hpZone(hp, max) {
  if (hp <= Math.floor(max / 4)) return 2;
  if (hp <= Math.floor(max / 2)) return 1;
  return 0;
}

/** Ancho de barra redondeado a 2 px (como Essentials). */
export function barWidth(value, max, width) {
  if (max <= 0 || value <= 0) return 0;
  let w = (value * width) / max;
  if (w < 1) w = 1;
  return Math.round(w / 2) * 2;
}

/** Barra de PS. style 'party' (96×8 por zona) o 'summary' (96×6). */
export function drawHPBar(g, x, y, hp, max, style = 'party') {
  const w = barWidth(hp, max, 96);
  if (w <= 0) return;
  const h = style === 'party' ? 8 : 6;
  blit(g, style === 'party' ? GFX.partyHP : GFX.summaryHP, x, y, 0, hpZone(hp, max) * h, w, h);
}

/** Barra de EXP (overlay_exp del resumen, 128 px de ancho útil). */
export function drawExpBar(g, x, y, fraction, width = 128) {
  const w = Math.round((Math.max(0, Math.min(1, fraction)) * width) / 2) * 2;
  if (w > 0) blit(g, GFX.summaryExp, x, y, 0, 0, w, 6);
}

/** Icono de tipo (64×28) desde types.png. */
export function drawTypeIcon(g, typeId, x, y) {
  const t = engine.data?.types?.[typeId];
  const row = t && Number.isFinite(t.icon) ? t.icon : 9;
  blit(g, GFX.types, x, y, 0, row * 28, 64, 28);
}

const STATUS_ROW = { SLEEP: 0, POISON: 1, TOXIC: 1, BURN: 2, PARALYSIS: 3, FROZEN: 4, FREEZE: 4 };

/** Icono de estado (44×16). Devuelve true si dibujó algo. */
export function drawStatusIcon(g, pkmn, x, y) {
  let row = -1;
  if (pkmn.hp <= 0) row = 5;
  else if (pkmn.status && STATUS_ROW[pkmn.status] !== undefined) row = STATUS_ROW[pkmn.status];
  else if (pkmn.pokerus === 1) row = 6;
  if (row < 0) return false;
  blit(g, GFX.statuses, x, y, 0, row * 16, 44, 16);
  return true;
}

const CATEGORY_ROW = { Physical: 0, Special: 1, Status: 2 };
export function drawCategoryIcon(g, category, x, y) {
  blit(g, GFX.category, x, y, 0, (CATEGORY_ROW[category] ?? 2) * 28, 64, 28);
}

/** Símbolo ♂/♀ con los colores de Essentials. */
export function drawGender(g, gender, x, y, font = 'system') {
  if (gender === 'M') drawText(g, '♂', x, y, { color: C.maleSym, shadow: C.maleSymShadow, font });
  else if (gender === 'F') drawText(g, '♀', x, y, { color: C.femaleSym, shadow: C.femaleSymShadow, font });
}

export function drawShiny(g, x, y) {
  blit(g, GFX.shiny, x, y);
}

/**
 * Icono de objeto (48×48). Las MT/MO usan el disco del tipo de su movimiento. Si el objeto define
 * `icon` (objetos propios de Axis, data/items_axis.json) se usa ese archivo de Graphics/Items.
 */
export function itemIconUrl(itemId) {
  if (!itemId) return null;
  const item = engine.data?.items?.[itemId];
  if (item && item.move && (item.fieldUse === 'TM' || item.fieldUse === 'HM' || item.fieldUse === 'TR')) {
    const type = engine.data.moves?.[item.move]?.type || 'NORMAL';
    return anil(`Graphics/Items/machine_${type}.png`);
  }
  return anil(`Graphics/Items/${item?.icon || itemId}.png`);
}

const ITEM_FALLBACK = anil('Graphics/Items/000.png');

/** URLs a probar en orden: icono declarado (Añil), icono propio en assets/items, el del id y el genérico. */
export function itemIconCandidates(itemId) {
  const item = engine.data?.items?.[itemId];
  const list = [itemIconUrl(itemId)];
  if (item?.icon) list.push(`assets/items/${item.icon}.png`, anil(`Graphics/Items/${itemId}.png`));
  list.push(ITEM_FALLBACK);
  return [...new Set(list.filter(Boolean))];
}

/** Dibuja el icono de un objeto (o el genérico 000 si no existe su gráfico). */
export function drawItemIcon(g, itemId, x, y) {
  if (!itemId) return;
  for (const url of itemIconCandidates(itemId)) {
    if (blit(g, url, x, y)) return;
    if (!failed(url)) return; // aún cargando
  }
}

/** Rectángulo de relleno sólido (atajo). */
export function fillRect(g, x, y, w, h, color) {
  g.fillStyle = color;
  g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}
