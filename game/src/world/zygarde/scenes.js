// Escenas cortas de progresión de Zygarde (ctx de script/context.js): activación diferida con una escena
// genérica de «recuerdo» (telepatía sobria), hitos narrativos («Me faltan N partes») y núcleos.
// Las escenas propias de cada bloque (N2 en el Colector, N3 en el P6, el puente de hielo del P8…) las escribe
// el guion del bloque y pueden llamar a estas funciones con { scenes: false } para activar sin escena genérica.
import { capabilityDef, MILESTONES } from '../../content/zygarde/thresholds.js';
import { MEMORY_LINES, UNLOCK_TEXT, FORM_TEXT, missingPartsLine } from '../../content/zygarde/texts.js';
import { pendingCapabilities, applyUnlock, missingParts, joinCore, firstMissing } from './progression.js';

export const GREEN = Object.freeze([185, 255, 102]);

/** ctx.effect sin romper el guion si el efecto no existe (tests, escenas sin capa de efectos). */
export function safeEffect(ctx, name, opts = {}) {
  try {
    return ctx.effect?.(name, opts) || null;
  } catch (err) {
    console.warn(`[zygarde] efecto ${name} no disponible`, err);
    return null;
  }
}

/** Personaje que representa a Zygarde en el mapa: la montura visible o el compañero; si no, null. */
export function zygardeActor(ctx) {
  const w = ctx.world;
  const m = w?.zygMount;
  if (m?.form && m.char?.visible) return m.char;
  const core = w?.core;
  return core && core.visible ? core : null;
}

/** Clave de escena: Vuelo y Reconstrucción comparten la de la Forma Completa. */
const sceneKey = (key) => (key === 'fly' || key === 'rebuild' ? 'complete' : key);

function joinNames(names) {
  if (names.length <= 1) return names[0] || '';
  return `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`;
}

/**
 * Escena corta de «recuerdo» para una o varias capacidades que se activan juntas: Zygarde se gira, destello
 * verde con hexágonos que convergen, línea telepática, aviso del sistema y ayuda de control.
 */
export async function memoryScene(ctx, keys, { formChanged = null } = {}) {
  const list = (Array.isArray(keys) ? keys : [keys]).filter((k) => capabilityDef(k));
  if (!list.length) return;
  const actor = zygardeActor(ctx);
  if (actor && ctx.player) actor.turnToward?.(ctx.player);
  ctx.se?.('core_signal', { volume: 55 });
  const at = actor || ctx.player;
  const fx = at ? safeEffect(ctx, 'zygardeHexBurst', { x: at.x, y: at.y, mode: 'in', count: 22 }) : null;
  await ctx.flash?.([...GREEN], 18, 120);
  await ctx.wait?.(12);
  fx?.remove?.(20);
  if (formChanged && FORM_TEXT[formChanged]) await ctx.say(FORM_TEXT[formChanged]);
  const line = (MEMORY_LINES[sceneKey(list[0])] || [])[0];
  if (line) await ctx.say(line, { telepathy: true });
  await ctx.say(UNLOCK_TEXT(joinNames(list.map((k) => capabilityDef(k).name))));
  const hint = capabilityDef(list[0]).hint;
  if (hint) await ctx.say(hint);
}

/** Agrupa las capacidades pendientes que comparten escena (Vuelo + Reconstrucción). */
function groupByScene(keys) {
  const groups = [];
  for (const k of keys) {
    const last = groups[groups.length - 1];
    if (last && sceneKey(last[0]) === sceneKey(k)) last.push(k);
    else groups.push([k]);
  }
  return groups;
}

/** Refresca seguidor y páginas tras un cambio de progreso. */
function refreshWorld(ctx) {
  ctx.requestRefresh?.();
  ctx.scene?.refreshFollower?.();
}

/**
 * Activa todas las capacidades cuyas condiciones ya se cumplen (células, núcleos, hitos), con su escena
 * genérica (salvo `scenes: false` o capacidades de guion). Devuelve las claves activadas.
 * Se llama sola al recoger una célula (tipo de evento zygardeCell) y desde reachMilestone/grantCore.
 */
export async function checkZygardeProgress(ctx, { scenes = true } = {}) {
  const keys = pendingCapabilities(ctx.state);
  for (const group of groupByScene(keys)) {
    let formChanged = null;
    for (const k of group) formChanged = applyUnlock(ctx.state, k).formChanged || formChanged;
    refreshWorld(ctx);
    const scripted = group.every((k) => capabilityDef(k).scripted);
    if (scenes && !scripted) await memoryScene(ctx, group, { formChanged });
  }
  return keys;
}

/**
 * Activa una capacidad concreta aunque no se cumplan sus condiciones (escenas de bloque con su propio
 * guion, depuración). Devuelve true si era nueva.
 */
export async function unlockCapability(ctx, key, { scene = false } = {}) {
  if (!capabilityDef(key)) throw new Error(`Capacidad de Zygarde desconocida: "${key}"`);
  const { changed, formChanged } = applyUnlock(ctx.state, key);
  if (!changed) return false;
  refreshWorld(ctx);
  if (scene) await memoryScene(ctx, [key], { formChanged });
  return true;
}

/**
 * Hito narrativo de una capacidad (MILESTONES: run → p1_restored, climb → p5_restored,
 * dive → b13_dive_resonance, complete → p8_restored, jump → p10_restored, anchor → game_cleared).
 * Fija el flag, activa lo que corresponda y, si faltan células, Zygarde lo dice («Me faltan dos partes.»).
 * Devuelve { unlocked: [claves], missing: n }.
 */
export async function reachMilestone(ctx, key, { scenes = true, sayMissing = true } = {}) {
  const flag = MILESTONES[key];
  if (!flag) throw new Error(`Hito de Zygarde desconocido: "${key}"`);
  if (typeof ctx.setFlag === 'function') ctx.setFlag(flag, true);
  else ctx.state.setFlag(flag, true);
  const unlocked = await checkZygardeProgress(ctx, { scenes });
  const missing = missingParts(ctx.state, key === 'complete' ? 'fly' : key);
  if (missing > 0 && sayMissing) await sayMissingParts(ctx, missing);
  return { unlocked, missing };
}

/** Zygarde dice cuántas partes le faltan (telepatía). */
export async function sayMissingParts(ctx, n) {
  const actor = zygardeActor(ctx);
  if (actor && ctx.player) actor.turnToward?.(ctx.player);
  ctx.se?.('core_signal', { volume: 40 });
  await ctx.say(missingPartsLine(n), { telepathy: true });
}

/** Recordatorio al hablar con el Core si hay un hito cumplido esperando células; true si lo dijo. */
export async function remindMissing(ctx) {
  const pend = firstMissing(ctx.state);
  if (!pend) return false;
  await sayMissingParts(ctx, pend.missing);
  return true;
}

/** Un núcleo se une (N1…N5): estado, flags, seguidor y capacidades que dependan de él. */
export async function grantCore(ctx, id, { scenes = true } = {}) {
  const isNew = joinCore(ctx.state, id);
  refreshWorld(ctx);
  const unlocked = await checkZygardeProgress(ctx, { scenes });
  return { isNew, unlocked };
}
