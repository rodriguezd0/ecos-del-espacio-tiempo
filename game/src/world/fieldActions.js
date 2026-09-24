// Acciones de campo que se ejecutan como guion (ctx) desde MapScene:
//   - las que devuelve el menú de pausa: { type: 'useItem', item } | { type: 'fieldMove', move, partyIndex } | { type: 'quit' }
//   - el aviso de fin del repelente (hook repelExpired de World).
// Textos genéricos de interfaz (sin trama). Otros módulos pueden añadir objetos con registerFieldItem().
import { loadMapDefinition } from '../content/maps/index.js';
import { displayName, maxHP } from '../battle/core/pokemon.js';
import { isKeyItem } from '../ui/logic/bagLogic.js';
import { repelSteps } from '../ui/logic/fieldItems.js';

export const CANT_USE = 'Aquí no se puede usar.';
const HEALTH_SHARE = 5; // Amortiguador/Batido: ceden 1/5 de los PS máximos (Essentials)
const FLASH_RADIUS = 176;

/** Objetos con uso en el mundo: id → async (ctx, itemId) => boolean (usado). */
const FIELD_ITEMS = {
  ESCAPEROPE: useEscapeRope,
  CLUENOTEBOOK: async (ctx) => { await ctx.ui.openClues(); return true; },
  POKEDEXAXIS: async (ctx) => { await ctx.ui.openPokedex(); return true; },
};

/** Movimientos de campo desde el equipo: id → async (ctx, moveId, partyIndex) => boolean. */
const FIELD_MOVES = {
  TELEPORT: escapeByMove,
  DIG: escapeByMove,
  SWEETSCENT: sweetScent,
  FLASH: flash,
  SOFTBOILED: shareHealth,
  MILKDRINK: shareHealth,
};

/** Registra (o sustituye) el uso en el mundo de un objeto. */
export function registerFieldItem(itemId, fn) {
  if (typeof fn !== 'function') throw new Error(`registerFieldItem(${itemId}): se esperaba una función`);
  FIELD_ITEMS[itemId] = fn;
}

/** Ejecuta la acción devuelta por el menú de pausa. */
export async function runFieldAction(ctx, action) {
  if (!action) return false;
  switch (action.type) {
    case 'useItem': return useFieldItem(ctx, action.item);
    case 'fieldMove': return useFieldMove(ctx, action.move, action.partyIndex);
    case 'quit': {
      const p = ctx.player;
      await ctx.warp(ctx.world.map.id, p.x, p.y, p.direction);
      return true;
    }
    default:
      console.warn('Acción de campo desconocida', action);
      return false;
  }
}

export async function useFieldItem(ctx, itemId) {
  const fn = FIELD_ITEMS[itemId];
  if (!fn) { await ctx.say(CANT_USE); return false; }
  return fn(ctx, itemId);
}

export async function useFieldMove(ctx, moveId, partyIndex) {
  const fn = FIELD_MOVES[moveId];
  const pkmn = ctx.state.party[partyIndex];
  if (!fn || !pkmn) { await ctx.say(CANT_USE); return false; }
  return fn(ctx, moveId, partyIndex);
}

// ------------------------------------------------------------ huida (Cuerda Huida, Teletransporte, Excavar)
async function placeName(mapId) {
  try {
    return (await loadMapDefinition(mapId))?.name || '';
  } catch {
    return '';
  }
}

/** Punto de cura válido para escapar desde el mapa actual, o null. */
export function escapeTarget(ctx) {
  const heal = ctx.state.healPoint;
  const def = ctx.world.current?.def;
  if (!heal || !def || def.escapeRope === false) return null;
  return heal;
}

async function confirmEscape(ctx, heal) {
  const name = await placeName(heal.mapId);
  return ctx.confirm(name ? `¿Quieres salir de aquí y volver a ${name}?` : '¿Quieres salir de aquí?');
}

async function useEscapeRope(ctx, itemId) {
  const heal = escapeTarget(ctx);
  if (!heal) { await ctx.say(CANT_USE); return false; }
  if (!(await confirmEscape(ctx, heal))) return false;
  const item = ctx.db.items[itemId];
  await ctx.say(`¡\\PN ha usado ${item?.name || itemId}!`);
  if (item && !isKeyItem(item)) ctx.state.removeItem(itemId, 1);
  await ctx.warp(heal.mapId, heal.x, heal.y, heal.dir ?? 2);
  return true;
}

async function escapeByMove(ctx, moveId, partyIndex) {
  const heal = escapeTarget(ctx);
  if (!heal) { await ctx.say(CANT_USE); return false; }
  if (!(await confirmEscape(ctx, heal))) return false;
  await ctx.say(`¡${displayName(ctx.db, ctx.state.party[partyIndex])} ha usado ${ctx.db.moves[moveId]?.name || moveId}!`);
  await ctx.warp(heal.mapId, heal.x, heal.y, heal.dir ?? 2);
  return true;
}

// ------------------------------------------------------------ otros movimientos
async function sweetScent(ctx, moveId, partyIndex) {
  const p = ctx.player;
  const enc = ctx.world.encounters;
  await ctx.say(`¡${displayName(ctx.db, ctx.state.party[partyIndex])} ha usado ${ctx.db.moves[moveId]?.name || moveId}!`);
  const type = enc.encounterType({ terrain: p.terrainTag(), surfing: p.surfing, hour: ctx.state.hour });
  const wild = type ? enc.choose(type) : null;
  if (!wild) { await ctx.say('Parece que no hay nada aquí…'); return false; }
  await ctx.wildBattle(wild);
  return true;
}

async function flash(ctx, moveId, partyIndex) {
  const dark = ctx.scene.darkness;
  if (!dark) { await ctx.say(CANT_USE); return false; }
  await ctx.say(`¡${displayName(ctx.db, ctx.state.party[partyIndex])} ha usado ${ctx.db.moves[moveId]?.name || moveId}!`);
  ctx.scene.darkness = { ...dark, radius: Math.max(dark.radius, FLASH_RADIUS) };
  return true;
}

/** Amortiguador / Batido: cede PS a otro miembro del equipo. */
async function shareHealth(ctx, _moveId, partyIndex) {
  const { db, state } = ctx;
  const user = state.party[partyIndex];
  const share = Math.floor(maxHP(db, user) / HEALTH_SHARE);
  if (user.hp <= share) { await ctx.say('No le quedan suficientes PS.'); return false; }
  const target = await ctx.ui.openParty({ mode: 'select', message: '¿A qué Pokémon quieres curar?' });
  if (!Number.isInteger(target) || target === partyIndex) return false;
  const t = state.party[target];
  const missing = maxHP(db, t) - t.hp;
  if (t.hp <= 0 || missing <= 0) { await ctx.say('No tendría ningún efecto.'); return false; }
  const amount = Math.min(share, missing);
  state.setPartyMember(partyIndex, { ...user, hp: user.hp - amount });
  state.setPartyMember(target, { ...t, hp: t.hp + amount });
  await ctx.say(`${displayName(db, t)} ha recuperado ${amount} PS.`);
  return true;
}

// ------------------------------------------------------------ repelente
/** Aviso de fin del repelente (Essentials :repel_counter): ofrece usar otro si quedan en la Mochila. */
export async function repelWoreOff(ctx) {
  const { db, state } = ctx;
  const owned = Object.keys(state.data.bag).filter((id) => repelSteps(id) > 0 && state.hasItem(id));
  if (!owned.length) { await ctx.say('¡El efecto del Repelente se ha terminado!'); return false; }
  if (!(await ctx.confirm('¡El efecto del Repelente se ha terminado! ¿Quieres usar otro?'))) return false;
  const names = owned.map((id) => db.items[id]?.name || id);
  const index = Math.max(0, owned.indexOf(state.repelItem));
  const i = await ctx.choice([...names, 'Cancelar'], { message: '¿Qué repelente quieres usar?', cancel: names.length, index });
  if (i < 0 || i >= owned.length) return false;
  const id = owned[i];
  if (!state.startRepel(id, repelSteps(id))) return false;
  state.removeItem(id, 1);
  ctx.se('Repel');
  await ctx.say(`Has usado ${names[i]}.`);
  return true;
}
