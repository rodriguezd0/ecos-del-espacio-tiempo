// Modo desarrollador: enganche con el mapa (MapScene). Tecla F9, interruptores de la sesión (atravesar paredes,
// sin encuentros, carrera ×2), clima, teletransporte con casilla de llegada válida y la acción de campo 'dev'
// (lo que el menú devuelve para ejecutarse como guion en el mapa). Los módulos puros están en dev/dev*.js.
import { engine } from '../core/engine.js';
import { registerFieldAction } from '../world/fieldActions.js';
import { DEV_MODE, DEV_KEY, devSettings, setDevSetting } from './devConfig.js';
import { findArrivalSpot, spotNear } from './devArrival.js';

/** Acción de campo del menú de desarrollador: { type: 'dev', label, run: async (ctx) => {} }. */
registerFieldAction('dev', async (ctx, action) => {
  await action.run(ctx);
  return true;
});

/** MapScene de la pila de escenas (debajo de menús) o null. */
export function findMapScene() {
  const stack = engine.scenes?.stack || [];
  for (let i = stack.length - 1; i >= 0; i--) {
    const s = stack[i].scene;
    if (s && s.world && typeof s.runScript === 'function' && typeof s.transfer === 'function') return s;
  }
  return null;
}

/** Aplica los interruptores de la sesión a un mapa (se suman a los de la URL y a las teclas de ?debug). */
export function applyDevSettings(scene) {
  const s = devSettings();
  if (!scene?.world) return;
  if (s.through) scene.world.debugThrough = true;
  if (s.noEncounters) scene.noEncounters = true;
  scene.world.devRunBoost = s.fastRun ? 1 : 0;
}

/** Estado real de un interruptor en el mapa (las teclas G de ?debug también lo cambian). */
export function switchValue(scene, key) {
  if (!scene?.world) return devSettings()[key];
  if (key === 'through') return Boolean(scene.world.debugThrough);
  if (key === 'noEncounters') return Boolean(scene.noEncounters);
  if (key === 'fastRun') return Boolean(scene.world.devRunBoost);
  return devSettings()[key];
}

/** Cambia un interruptor en la sesión y en el mapa actual. Devuelve el valor nuevo. */
export function toggleSwitch(scene, key) {
  const next = !switchValue(scene, key);
  setDevSetting(key, next);
  if (scene?.world) {
    if (key === 'through') scene.world.debugThrough = next;
    if (key === 'noEncounters') scene.noEncounters = next;
    if (key === 'fastRun') scene.world.devRunBoost = next ? 1 : 0;
  }
  return next;
}

/** Clima forzado ('auto' = el del mapa). */
export async function setDevWeather(scene, type, power = 6) {
  if (!scene?.weather) return;
  if (type === 'auto') {
    scene.devWeather = null;
    const def = scene.world.current?.def;
    if (def) await scene.applyEnvironment(def);
    return;
  }
  scene.devWeather = [type, power];
  await scene.weather.set(type, power);
}

/**
 * Casilla de llegada a un mapa: construye el mapa (sin entrar) y busca la casilla válida. Con `coords` usa esa
 * casilla o la válida más cercana. Devuelve { x, y, dir, source, adjusted? }.
 */
export async function arrivalFor(scene, mapId, coords = null) {
  const entry = scene.world.current?.id === mapId ? scene.world.current : await scene.loadEntry(mapId);
  if (coords) {
    const spot = spotNear(entry.map, coords.x, coords.y, coords.dir || 2);
    if (!spot) throw new Error(`El mapa ${mapId} no tiene casillas transitables.`);
    return { ...spot, source: spot.adjusted ? 'más cercana' : 'pedida' };
  }
  const spot = findArrivalSpot(entry.def, entry.map);
  if (!spot) throw new Error(`El mapa ${mapId} no tiene casillas transitables.`);
  return spot;
}

/** Acción de teletransporte para cerrar el menú con ella. */
export function teleportAction(mapId, coords = null, label = mapId) {
  return {
    type: 'dev',
    label: `teletransporte → ${label}`,
    async run(ctx) {
      const spot = await arrivalFor(ctx.scene, mapId, coords);
      await ctx.warp(mapId, spot.x, spot.y, spot.dir || 2, { fade: true, frames: 10 });
      ctx.ui.toast(`${label} (${spot.x},${spot.y}) · ${spot.source}`);
    },
  };
}

/** Tras cambiar el estado desde el menú: páginas de eventos, seguidor y Core al día. */
export function refreshAfterMenu(scene) {
  if (!scene?.world) return;
  scene.world.requestRefresh?.();
  scene.refreshFollower?.();
}

/** No interrumpir un guion o guardar la posición de un paso aún sin terminar. */
function devMenuBusy(scene) {
  return scene.runner?.busy || scene.cinematic || scene.world.scriptBusy() || scene.world.player.busy();
}

/** Abre el menú de desarrollador sobre el mapa y ejecuta la acción que devuelva. */
export async function openDevMenuOn(scene) {
  if (scene.devMenuOpen || devMenuBusy(scene)) return;
  scene.devMenuOpen = true;
  scene.menuOpen = true;
  const p = scene.world.player;
  scene.state.setPosition(scene.world.map.id, p.x, p.y, p.direction);
  let action = null;
  try {
    const { runDevMenu } = await import('./devPages.js');
    action = await runDevMenu(scene);
  } catch (err) {
    engine.reportError(err);
  } finally {
    scene.devMenuOpen = false;
    scene.menuOpen = false;
    refreshAfterMenu(scene);
  }
  if (action) scene.runScript((ctx) => action.run(ctx), null, action.label || 'desarrollador');
}

/**
 * Instala la tecla F9 en un mapa (siempre en esta versión; DEV_MODE = false la desactiva). Solo abre el menú si el
 * mapa está libre y es la escena superior. Devuelve la función para quitarla.
 */
export function installDevMenuKey(scene) {
  if (!DEV_MODE || typeof window === 'undefined') return () => {};
  applyDevSettings(scene);
  const onKey = (e) => {
    if (e.code !== DEV_KEY || e.repeat) return;
    if (!scene.ready || engine.scenes.top !== scene || scene.transferring || scene.inBattle || devMenuBusy(scene)) return;
    e.preventDefault();
    openDevMenuOn(scene);
  };
  window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
}
