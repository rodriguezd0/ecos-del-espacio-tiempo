// Descanso (docs/CAMPANA.md §3.1, X25; TEC-06). Desde un guion: `await ctx.rest(opts)`.
//   «Descansar»               cama, Centro, posada o campamento: elige franja (mañana/tarde/noche). Nunca sueños.
//   «Dormir profundamente»    solo en la cama de casa (kind 'home'): despierta por la mañana y da paso a los
//                             ganchos de sueño (registerDreamHook) — p. ej. Darkrai en el postgame.
//   «Descansar hasta tormenta» solo en posadas marcadas (storm: true): la tormenta dura unas horas de juego en los
//                             mapas exteriores (stormActive / stormWeather) para encuentros meteorológicos.
// Descansar cura (salvo heal: false), suma rest_count y ejecuta los ganchos de descanso (registerRestHook), que
// sirven para que reaparezcan Alfas y legendarios debilitados (CAMPANA §2.6). El cielo de crisis NO cambia.
// Módulo sin DOM: usa solo ctx (script/context.js).

export const REST_SLOTS = Object.freeze([
  Object.freeze({ id: 'morning', name: 'Mañana', minutes: 8 * 60 }),
  Object.freeze({ id: 'afternoon', name: 'Tarde', minutes: 15 * 60 }),
  Object.freeze({ id: 'night', name: 'Noche', minutes: 21 * 60 }),
]);

/** Lugares de descanso. `deep`: admite «Dormir profundamente»; `storm`: puede ofrecer «hasta tormenta». */
export const REST_KINDS = Object.freeze({
  home: { name: 'cama de casa', deep: true, storm: false },
  bed: { name: 'cama', deep: false, storm: false },
  center: { name: 'Centro Pokémon', deep: false, storm: false },
  inn: { name: 'posada', deep: false, storm: true },
  camp: { name: 'campamento', deep: false, storm: false },
});

export const REST_COUNT_VAR = 'rest_count';
/** Fin de la tormenta en fotogramas de juego (state.playTimeFrames). */
export const STORM_VAR = 'rest_storm_until';
export const STORM_GAME_HOURS = 3;
const FRAMES_PER_GAME_MINUTE = 60; // mismo ritmo provisional que MapScene (TEC-06)
export const STORM_WEATHER = Object.freeze(['storm', 6]);

const TEXT = Object.freeze({
  menu: '¿Qué quieres hacer?',
  rest: 'Descansar',
  deep: 'Dormir profundamente',
  storm: 'Descansar hasta tormenta',
  cancel: 'Cancelar',
  when: '¿Hasta cuándo quieres descansar?',
  healed: 'Tu equipo se ha recuperado.',
  rested: 'Has descansado un rato.',
  deepDone: 'Has dormido profundamente hasta la mañana.',
  stormDone: 'Fuera se ha desatado una tormenta.',
});

const restHooks = new Set();
const dreamHooks = new Set();

/** Gancho tras cualquier descanso: (ctx, { mode, kind }) => void. Devuelve una función para quitarlo. */
export function registerRestHook(fn) {
  if (typeof fn !== 'function') throw new Error('registerRestHook: se esperaba una función');
  restHooks.add(fn);
  return () => restHooks.delete(fn);
}

/**
 * Gancho de sueño de «Dormir profundamente»: async (ctx) => boolean (true = ha mostrado un sueño).
 * Se prueban en orden de registro; cada gancho decide por sí mismo (p. ej. solo en el postgame).
 */
export function registerDreamHook(fn) {
  if (typeof fn !== 'function') throw new Error('registerDreamHook: se esperaba una función');
  dreamHooks.add(fn);
  return () => dreamHooks.delete(fn);
}

/** Minutos que hay que avanzar desde `current` hasta la hora `target` (0..1439, siempre hacia delante). */
export function minutesUntil(current, target) {
  const c = ((Math.floor(current) % 1440) + 1440) % 1440;
  const t = ((Math.floor(target) % 1440) + 1440) % 1440;
  return (t - c + 1440) % 1440;
}

/** Opciones del menú de descanso según el lugar. */
export function restOptions({ kind = 'bed', deep, storm } = {}) {
  const k = REST_KINDS[kind];
  if (!k) throw new Error(`rest: lugar de descanso desconocido "${kind}" (${Object.keys(REST_KINDS).join(', ')})`);
  const out = [{ id: 'rest', label: TEXT.rest }];
  if ((deep ?? k.deep) && kind === 'home') out.push({ id: 'deep', label: TEXT.deep });
  if (storm && k.storm) out.push({ id: 'storm', label: TEXT.storm });
  return out;
}

/** ¿Hay tormenta de «descansar hasta tormenta» en curso? */
export function stormActive(state) {
  const until = Number(state.var(STORM_VAR, 0)) || 0;
  return until > 0 && state.playTimeFrames < until;
}

/**
 * Clima forzado por la tormenta para un mapa exterior (['storm', 6]) o null. Lo consulta MapScene. Un mapa puede dar
 * su propia tormenta con `stormWeather: ['blizzard', 6]` (aditivo B15: en el norte, la tormenta es una ventisca).
 */
export function stormWeather(state, def) {
  if (!def?.outdoor || def.weatherOverride === false) return null;
  if (!stormActive(state)) return null;
  return Array.isArray(def.stormWeather) && def.stormWeather.length ? [...def.stormWeather] : [...STORM_WEATHER];
}

/** Aplica el descanso al estado (puro salvo ganchos): hora, curación, contador y tormenta. */
export function applyRest(state, { mode = 'rest', slot = 'morning', heal = true, healParty = null } = {}) {
  const target = mode === 'rest' ? REST_SLOTS.find((s) => s.id === slot) : REST_SLOTS[0];
  if (!target) throw new Error(`rest: franja desconocida "${slot}"`);
  if (mode === 'storm') {
    state.advanceMinutes(STORM_GAME_HOURS * 60);
    state.setVar(STORM_VAR, state.playTimeFrames + STORM_GAME_HOURS * 60 * FRAMES_PER_GAME_MINUTE);
  } else {
    state.advanceMinutes(minutesUntil(state.data.clock.minutes, target.minutes));
    state.setVar(STORM_VAR, 0);
  }
  if (heal && healParty) healParty();
  state.setVar(REST_COUNT_VAR, (Number(state.var(REST_COUNT_VAR, 0)) || 0) + 1);
  return { mode, slot: mode === 'rest' ? target.id : null };
}

async function chooseSlot(ctx) {
  const labels = [...REST_SLOTS.map((s) => s.name), TEXT.cancel];
  const i = await ctx.choice(labels, { message: TEXT.when, cancel: REST_SLOTS.length });
  return REST_SLOTS[i]?.id || null;
}

async function runHooks(ctx, info) {
  for (const fn of restHooks) {
    try {
      await fn(ctx, info);
    } catch (err) {
      console.error('[descanso] gancho', err);
    }
  }
}

async function runDreams(ctx) {
  for (const fn of dreamHooks) {
    try {
      if (await fn(ctx)) return true;
    } catch (err) {
      console.error('[descanso] sueño', err);
    }
  }
  return false;
}

/**
 * Menú y secuencia de descanso. opts: { kind: 'home'|'bed'|'center'|'inn'|'camp' (bed), storm: true (posadas
 * marcadas), deep (por defecto sí en 'home'), heal = true, message (pregunta inicial), mode (salta el menú:
 * 'rest'|'deep'|'storm'), slot (salta la franja) }. → { rested, mode, slot } (rested false si se cancela).
 */
export async function rest(ctx, opts = {}) {
  const kind = opts.kind || 'bed';
  const options = restOptions({ kind, deep: opts.deep, storm: opts.storm });
  let mode = opts.mode || null;
  if (mode && !options.some((o) => o.id === mode)) throw new Error(`rest: «${mode}» no está disponible en ${REST_KINDS[kind].name}`);
  if (!mode) {
    const labels = [...options.map((o) => o.label), TEXT.cancel];
    const i = await ctx.choice(labels, { message: opts.message ?? TEXT.menu, cancel: options.length });
    mode = options[i]?.id || null;
  }
  if (!mode) return { rested: false, mode: null, slot: null };
  let slot = opts.slot || null;
  if (mode === 'rest' && !slot) {
    slot = await chooseSlot(ctx);
    if (!slot) return { rested: false, mode: null, slot: null };
  }
  const heal = opts.heal !== false;
  await ctx.fade?.('out', 24);
  if (heal) ctx.me?.('heal');
  const result = applyRest(ctx.state, { mode, slot: slot || 'morning', heal, healParty: () => ctx.heal?.() });
  if (mode === 'storm' && ctx.world?.current?.def?.outdoor) await ctx.weather?.(...STORM_WEATHER);
  await ctx.wait?.(40);
  await runHooks(ctx, { mode, kind });
  ctx.requestRefresh?.();
  const dreamt = mode === 'deep' ? await runDreams(ctx) : false;
  await ctx.fade?.('in', 24);
  if (!dreamt) {
    const done = mode === 'deep' ? TEXT.deepDone : mode === 'storm' ? TEXT.stormDone : TEXT.rested;
    await ctx.say(heal ? `${done}\n${TEXT.healed}` : done);
  }
  return { rested: true, ...result };
}
