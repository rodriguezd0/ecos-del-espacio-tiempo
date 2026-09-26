// Modo desarrollador (docs/MODO_DESARROLLADOR.md): configuración y ajustes de la sesión. Módulo PURO (sin DOM).
// En esta versión de desarrollo está SIEMPRE disponible (F9 en el mapa y «Desarrollador» en el menú
// de pausa). Para una versión pública basta con poner DEV_MODE = false.

export const DEV_MODE = true;
/** Tecla que abre el menú (KeyboardEvent.code) y su nombre para los recordatorios. */
export const DEV_KEY = 'F9';
export const DEV_KEY_LABEL = 'F9';

/** Interruptores de la sesión (no se guardan en la partida): se aplican a cada MapScene al entrar. */
const DEFAULTS = Object.freeze({ through: false, noEncounters: false, fastRun: false });
let settings = DEFAULTS;

/** Ajustes actuales (objeto congelado: se sustituye entero al cambiar). */
export function devSettings() {
  return settings;
}

/** Cambia un interruptor y devuelve los ajustes nuevos. */
export function setDevSetting(key, value) {
  if (!(key in DEFAULTS)) throw new Error(`Ajuste de desarrollador desconocido: ${key}`);
  settings = Object.freeze({ ...settings, [key]: Boolean(value) });
  return settings;
}

/** Vuelve a los valores por defecto (tests). */
export function resetDevSettings() {
  settings = DEFAULTS;
  return settings;
}
