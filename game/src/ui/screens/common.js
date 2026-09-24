// Utilidades compartidas por las pantallas: ventana de ayuda, comandos y mensajes dentro de pantallas.
import { engine, SCREEN_W, SCREEN_H } from '../../core/engine.js';
import { drawWindow, isDarkSkin, skinBorders } from '../core/windowskin.js';
import { drawText, wrapLines } from '../core/text.js';
import { messageColors } from '../core/colors.js';
import { menuSkin } from '../core/options.js';
import { ChoiceScene } from '../message/messageScenes.js';
import * as dialogs from '../message/dialogs.js';

/**
 * Ventana de ayuda de 1–2 líneas abajo a la izquierda (pbBottomLeftLines).
 * @returns {number} alto dibujado
 */
export function drawHelpWindow(g, text, width = SCREEN_W, maxLines = 2) {
  if (!text) return 0;
  const skin = menuSkin();
  const b = skinBorders(skin);
  const rows = wrapLines(text, width - b.left - b.right - 8).slice(0, maxLines);
  const h = rows.length * 32 + b.top + b.bottom;
  const y = SCREEN_H - h;
  drawWindow(g, skin, 0, y, width, h);
  const [base, shadow] = messageColors(null, isDarkSkin(skin));
  rows.forEach((row, i) => drawText(g, row, b.left + 4, y + b.top - 2 + i * 32, { color: base, shadow }));
  return h;
}

/**
 * Comandos en la esquina inferior derecha de la pantalla (pbShowCommands de las pantallas).
 * @returns {Promise<number>} índice o -1 si se cancela
 */
export async function showCommands(items, opts = {}) {
  const r = await engine.scenes.push(new ChoiceScene(items, { anchor: 'screen', cancel: -1, ...opts }));
  return r === undefined ? -1 : r;
}

export const message = (text, opts) => dialogs.message(text, opts);
export const confirm = (text, opts) => dialogs.confirm(text, opts);
export const closeMessage = () => dialogs.closeMessage();
export const chooseNumber = (opts) => dialogs.number(opts);

export { mapName, resolveMapNames } from '../core/mapNames.js';
