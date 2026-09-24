// Reglas PURAS del flujo de partida nueva (sin DOM ni motor): nombre, estado inicial y el aviso de
// "prólogo ya visto". Las usa content/newgame.js y se prueban en tests/prologue.test.mjs.
// Canon: guion B01 §0 (D01: nombre libre, sin nombre por defecto; "Axel" descartado como nombre de héroe).
import { GameState } from '../core/state.js';

export const NAME_MIN = 1;
export const NAME_MAX = 10;
export const PROLOGUE_FLAG = 'prologue_seen';
export const PROLOGUE_SEEN_KEY = 'ecos.prologue_seen';
export const START_HOUR = 8; // mañana (B01 §0.4: "planta alta de su casa, mañana")
export const START_MAP = 'casa_prota_2f';
export const FALLBACK_MAP = 'dev_test';
export const TIME_CAPTION = 'Axis. Tres días después.';

/**
 * Valida el nombre del protagonista: recorta espacios, 1–10 caracteres (cuenta caracteres Unicode).
 * @returns {{ ok: boolean, name: string, error: string|null }}
 */
export function validateName(raw) {
  // sin barras invertidas ni saltos: el nombre se inserta en textos con códigos (\PN)
  const name = String(raw ?? '').replace(/[\\\r\n\t]/g, '').trim();
  const len = [...name].length;
  if (len < NAME_MIN) return { ok: false, name: '', error: 'Necesitas un nombre.' };
  if (len > NAME_MAX) return { ok: false, name: [...name].slice(0, NAME_MAX).join(''), error: `El nombre no puede tener más de ${NAME_MAX} letras.` };
  return { ok: true, name, error: null };
}

export function validateGender(g) {
  if (g !== 'M' && g !== 'F') throw new Error(`Género no válido: ${g}`);
  return g;
}

/**
 * Estado inicial de una partida nueva: nombre y género elegidos, opciones globales, reloj por la mañana y
 * la marca de prólogo visto.
 */
export function createNewGameState({ name, gender, options = {}, playerId } = {}) {
  const v = validateName(name);
  if (!v.ok) throw new Error(v.error);
  const state = GameState.create({ name: v.name, gender: validateGender(gender), playerId });
  state.data.options = { ...state.data.options, ...options };
  state.data.clock = { ...state.data.clock, minutes: START_HOUR * 60 };
  state.setFlag(PROLOGUE_FLAG, true);
  return state;
}

/** ¿Se vio ya el prólogo alguna vez en este navegador? (tolera almacenamiento ausente o bloqueado) */
export function prologueSeen(storage = globalThis.localStorage) {
  try {
    return storage?.getItem(PROLOGUE_SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

export function markPrologueSeen(storage = globalThis.localStorage) {
  try {
    storage?.setItem(PROLOGUE_SEEN_KEY, '1');
    return true;
  } catch (err) {
    console.warn('[partida nueva] No se pudo recordar el prólogo visto', err?.message || err);
    return false;
  }
}

/**
 * Mapa y posición de inicio: `casa_prota_2f` (su `start`, que define el mapa) o, si aún no existe,
 * el mapa de pruebas para no romper el flujo. `loadDef(id)` → definición o lanza.
 */
export async function resolveStartMap(loadDef) {
  try {
    const def = await loadDef(START_MAP);
    if (def && def.id) return { map: START_MAP, x: def.start?.x, y: def.start?.y, dir: def.start?.dir ?? 2, fallback: false };
  } catch (err) {
    console.warn(`[partida nueva] ${START_MAP} no disponible todavía (${err?.message || err}); se usa ${FALLBACK_MAP}`);
  }
  return { map: FALLBACK_MAP, fallback: true };
}
