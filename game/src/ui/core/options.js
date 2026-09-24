// Opciones activas para la UI: las de la partida en curso o, sin partida (título), unas globales
// guardadas en localStorage que se aplican al crear una partida nueva.
import { engine } from '../../core/engine.js';
import { defaultOptions } from '../../core/state.js';
import { frameAt } from './windowskin.js';

const GLOBAL_KEY = 'ecos.options.global';

function readGlobal() {
  try {
    const raw = localStorage.getItem(GLOBAL_KEY);
    return raw ? { ...defaultOptions(), ...JSON.parse(raw) } : defaultOptions();
  } catch {
    return defaultOptions();
  }
}

let globalOptions = null;

/** Opciones vigentes (solo lectura). */
export function currentOptions() {
  if (engine.state) return { ...defaultOptions(), ...engine.state.options };
  if (!globalOptions) globalOptions = readGlobal();
  return globalOptions;
}

/** Cambia una opción (inmutable: sustituye el objeto de opciones) y aplica sus efectos. */
export function setOption(key, value) {
  const next = { ...currentOptions(), [key]: value };
  if (engine.state) {
    engine.state.data.options = next;
  } else {
    globalOptions = next;
    try {
      localStorage.setItem(GLOBAL_KEY, JSON.stringify(next));
    } catch (err) {
      console.warn('[ui] No se pudieron guardar las opciones globales', err);
    }
  }
  applyOptions(next);
  return next;
}

/** Opciones globales para copiar en una partida nueva. */
export function globalOptionsForNewGame() {
  return { ...readGlobal() };
}

/** Aplica efectos inmediatos (volúmenes). */
export function applyOptions(opts = currentOptions()) {
  const a = engine.audio;
  if (!a || !a.setVolume) return;
  try {
    a.setVolume('bgm', opts.bgmVolume);
    a.setVolume('me', opts.bgmVolume);
    a.setVolume('se', opts.seVolume);
  } catch (err) {
    console.warn('[ui] No se pudo aplicar el volumen', err);
  }
}

/** Skins del marco elegido. */
export function speechSkin() {
  return frameAt(currentOptions().frame).speech;
}
export function menuSkin() {
  return frameAt(currentOptions().frame).menu;
}

/** Caracteres por frame según la velocidad de texto (Essentials: 4/80, 2/80, 1/80 s por carácter). */
export function charsPerFrame(speed = currentOptions().textSpeed) {
  switch (speed) {
    case 0: return 1 / 3;
    case 1: return 2 / 3;
    case 3: return Infinity;
    case 2:
    default: return 4 / 3;
  }
}
