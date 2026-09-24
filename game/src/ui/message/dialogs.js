// Funciones de diálogo de alto nivel (las usa ui/api.js y las pantallas).
import { engine } from '../../core/engine.js';
import { MessageScene, ChoiceScene, NumberScene } from './messageScenes.js';

let kept = null; // MessageScene abierta con keepOpen

const alive = (scene) => scene && !scene.closing && !scene.exited;

/**
 * Muestra un mensaje y espera a que termine (o a que termine de escribirse si keepOpen).
 * @param {string} text
 * @param {object} opts  ver ui.message
 */
export async function message(text, opts = {}) {
  let scene = alive(kept) ? kept : null;
  if (!scene) {
    scene = new MessageScene();
    // La escena entra en la pila tras precargar su skin; show() puede prepararse antes.
    engine.scenes.push(scene).catch((err) => engine.reportError(err));
  }
  kept = null;
  const shown = scene.show(text, opts);
  if (opts.keepOpen) kept = scene;
  await shown;
}

/** Cierra la caja que quedó abierta con keepOpen. */
export function closeMessage() {
  if (kept && !kept.closing) kept.close();
  kept = null;
}

/**
 * Elección. Si opts.message, lo muestra antes (y cierra la caja después salvo opts.keepOpen).
 * @returns {Promise<number>} índice elegido; al pulsar B devuelve opts.cancel (o -1).
 */
export async function choice(items, opts = {}) {
  if (!items || !items.length) throw new Error('ui.choice: la lista de opciones está vacía.');
  if (opts.message) await message(opts.message, { ...opts, keepOpen: true });
  const cancel = opts.cancel === undefined ? -1 : opts.cancel;
  const r = await engine.scenes.push(new ChoiceScene(items, { ...opts, cancel }));
  if (opts.message && !opts.keepOpen) closeMessage();
  return r === undefined ? cancel : r;
}

/** Sí/No. Devuelve true si elige Sí. */
export async function confirm(text, opts = {}) {
  const i = await choice(['Sí', 'No'], { ...opts, message: text, cancel: 1 });
  return i === 0;
}

/**
 * Número. opts: { min, max, initial, message, formatter }
 * @returns {Promise<number|null>} null si se cancela
 */
export async function number(opts = {}) {
  if (opts.message) await message(opts.message, { keepOpen: true, speaker: opts.speaker });
  const r = await engine.scenes.push(new NumberScene(opts));
  if (opts.message && !opts.keepOpen) closeMessage();
  return r === undefined ? null : r;
}
