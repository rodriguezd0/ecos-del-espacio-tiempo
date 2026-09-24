// Sistema mínimo de huevos (docs/CAMPANA.md B11: el huevo de Togepi de Mamá; también servirá para el huevo del
// inicial de Gael en el epílogo). Un huevo es un Pokémon serializable normal con `egg: true` y `eggSteps` (pasos
// que le faltan; sale de `hatchSteps` de species.json, como en Essentials). No combate ni acompaña (las
// comprobaciones `!p.egg` ya existen en el motor), no cuenta en la Pokédex hasta que eclosiona y se muestra como
// «Huevo». Cada paso del jugador descuenta 1 a los huevos del equipo (MapScene → eggStep); al llegar a 0, escena
// de eclosión (mensajes, grito, registro en la Pokédex y mote opcional).
// Partes puras (createEgg, stepPartyEggs, hatchedPokemon, addEggToParty) sin DOM: tests/b11_eggs.test.mjs.
import { createPokemon, speciesData } from '../battle/core/pokemon.js';

export const EGG_NAME = 'Huevo';
/** Pasos por defecto si la especie no los declara (Essentials: 5120 en la mayoría). */
export const DEFAULT_HATCH_STEPS = 5120;
/** Nivel al eclosionar (Essentials: EGG_LEVEL = 1). */
export const EGG_LEVEL = 1;
/** Amistad al eclosionar (Essentials: 120). */
export const HATCH_HAPPINESS = 120;
const PARTY_MAX = 6;

export const EGG_TEXT = Object.freeze({
  moving: '¿Eh?',
  hatching: '¡El Huevo se está moviendo!',
  hatched: (name) => `¡Del Huevo ha salido un ${name}!`,
  nickname: (name) => `¿Quieres ponerle un mote a ${name}?`,
  received: '¡\\PN ha recibido un Huevo!',
});

/** Pasos que tarda en eclosionar un huevo de `species` (hatchSteps del PBS de Añil). */
export function hatchSteps(db, species) {
  const n = Number(db?.species?.[species]?.hatchSteps);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_HATCH_STEPS;
}

/**
 * Crea un huevo de `species` (nivel 1 al eclosionar). opts: { ot, metMap, rng, steps } (steps sustituye a los de
 * la especie, p. ej. en pruebas). Devuelve un objeto nuevo: { …Pokémon, egg: true, eggSteps, nickname: 'Huevo' }.
 */
export function createEgg(db, species, { ot = null, metMap = null, rng, steps } = {}) {
  if (!db?.species?.[species]) throw new Error(`createEgg: especie desconocida "${species}"`);
  const base = createPokemon(db, species, EGG_LEVEL, { ot, metMap, rng, obtainedMode: 'egg' });
  return { ...base, egg: true, eggSteps: steps ?? hatchSteps(db, species), nickname: EGG_NAME };
}

/**
 * Descuenta `n` pasos a cada huevo del equipo. Puro: devuelve { party (nueva lista, sin tocar la entrada),
 * ready: [índices que ya pueden eclosionar] }.
 */
export function stepPartyEggs(party, n = 1) {
  const ready = [];
  const next = (party || []).map((p, i) => {
    if (!p?.egg) return p;
    const left = Math.max(0, (Number(p.eggSteps) || 0) - n);
    if (left === 0) ready.push(i);
    return left === p.eggSteps ? p : { ...p, eggSteps: left };
  });
  return { party: next, ready };
}

/** Pokémon que sale del huevo (copia nueva): sin marca de huevo, con amistad de eclosión y sin mote. */
export function hatchedPokemon(egg) {
  const { egg: _e, eggSteps: _s, ...rest } = egg;
  return { ...rest, nickname: null, happiness: HATCH_HAPPINESS, obtainedMode: 'egg' };
}

/**
 * Añade un huevo al equipo sin registrarlo en la Pokédex (GameState.addPokemon lo registraría como capturado).
 * → true si cabía (equipo < 6); false si el equipo está lleno (quien lo entrega decide esperar).
 */
export function addEggToParty(state, egg) {
  if (!egg?.egg) throw new Error('addEggToParty: se esperaba un huevo');
  if (state.party.length >= PARTY_MAX) return false;
  state.setParty([...state.party, egg]);
  return true;
}

/** ¿Hay algún huevo en el equipo? */
export const hasEgg = (state) => (state?.party || []).some((p) => p?.egg);

// ------------------------------------------------------------------ integración con el mapa

/**
 * Gancho de paso (MapScene.worldHooks.stepTaken): descuenta un paso a los huevos y, si alguno está listo, lanza la
 * escena de eclosión como guion bloqueante. Sin huevos no hace nada (coste nulo).
 */
export function eggStep(scene) {
  const state = scene?.state;
  if (!state || !hasEgg(state)) return;
  const { party, ready } = stepPartyEggs(state.party, 1);
  state.setParty(party);
  if (!ready.length || scene.hatchingEggs) return;
  scene.hatchingEggs = true;
  scene.runScript(async (ctx) => {
    try {
      await hatchReadyEggs(ctx);
    } finally {
      scene.hatchingEggs = false;
    }
  }, null, 'huevo');
}

/** Guion: eclosionan todos los huevos del equipo que ya no tienen pasos pendientes. */
export async function hatchReadyEggs(ctx) {
  for (;;) {
    const i = ctx.state.party.findIndex((p) => p?.egg && !(p.eggSteps > 0));
    if (i < 0) return;
    await hatchEgg(ctx, i);
  }
}

/** Escena de eclosión del huevo del equipo en la posición `index`. */
export async function hatchEgg(ctx, index) {
  const egg = ctx.state.party[index];
  if (!egg?.egg) return null;
  await ctx.say(EGG_TEXT.moving);
  ctx.se?.('Mining pick');
  ctx.shake?.(2, 8, 20);
  await ctx.say(EGG_TEXT.hatching);
  await ctx.flash?.([255, 255, 255], 20, 220);
  const baby = hatchedPokemon(egg);
  ctx.state.setPartyMember(index, baby);
  ctx.state.registerCaught(baby.species);
  const name = speciesData(ctx.db, baby.species, baby.form)?.name || baby.species;
  ctx.cry?.(baby.species);
  ctx.me?.('evolution_success');
  await ctx.say(EGG_TEXT.hatched(name));
  await offerHatchNickname(ctx, index, name);
  ctx.scene?.refreshFollower?.();
  return ctx.state.party[index];
}

async function offerHatchNickname(ctx, index, name) {
  if (typeof ctx.confirm !== 'function' || !ctx.ui?.textEntry) return;
  if (!(await ctx.confirm(EGG_TEXT.nickname(name)))) return;
  const pk = ctx.state.party[index];
  const text = await ctx.ui.textEntry({ title: `Mote de ${name}`, initial: '', maxLength: 12, iconSpecies: pk.species, gender: pk.gender });
  const nick = String(text || '').trim();
  if (!nick || nick === name) return;
  ctx.state.setPartyMember(index, { ...ctx.state.party[index], nickname: nick });
}
