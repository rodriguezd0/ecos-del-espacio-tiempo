// Tutor de movimientos genérico y Recordador de movimientos (servicios de pueblo). La parte pura (quién
// puede aprender qué, qué recuerda, cuánto cuesta) se prueba con node --test; los guiones usan ctx.
//
// Uso en un mapa:
//   moveTutorEvent({ id: 'tutor', x: 10, y: 6, moves: ['FIREPUNCH', 'ICEPUNCH'], cost: { money: 2000 } })
//   moveReminderEvent({ id: 'recordador', x: 4, y: 6, cost: { item: 'HEARTSCALE', count: 1 } })
// Coste: { money: n } · { item: 'ID', count: n } · null (gratis). Un movimiento de la lista del tutor puede
// ser { move, cost } para tener coste propio.
import { speciesData, displayName } from '../../battle/core/pokemon.js';
import { formatMoney } from '../../ui/logic/format.js';

// ------------------------------------------------------------ lógica pura
/** Movimientos que la especie puede aprender de un tutor: los de tutor/MT y los de su lista por nivel. */
export function tutorCanLearn(db, pokemon, moveId) {
  if (!pokemon || pokemon.egg || !db.moves[moveId]) return false;
  const sp = speciesData(db, pokemon.species, pokemon.form);
  return (sp.tutorMoves || []).includes(moveId) || (sp.moves || []).some(([, m]) => m === moveId);
}

/** 'APRENDIDO' | 'APTO' | 'NO APTO' para la pantalla de equipo. */
export function tutorAnnotation(db, pokemon, moveId) {
  if ((pokemon.moves || []).some((m) => m.id === moveId)) return 'APRENDIDO';
  return tutorCanLearn(db, pokemon, moveId) ? 'APTO' : 'NO APTO';
}

/**
 * Movimientos que el Recordador puede devolver: los de la lista por nivel hasta el nivel actual (incluidos los
 * de nivel 0 / evolución) que no conoce ya, sin repetir, en orden de nivel.
 */
export function relearnableMoves(db, pokemon) {
  if (!pokemon || pokemon.egg) return [];
  const sp = speciesData(db, pokemon.species, pokemon.form);
  const known = new Set((pokemon.moves || []).map((m) => m.id));
  const out = [];
  for (const [lv, move] of [...(sp.moves || [])].sort((a, b) => a[0] - b[0])) {
    if (lv > pokemon.level || known.has(move) || out.includes(move) || !db.moves[move]) continue;
    out.push(move);
  }
  return out;
}

/** Texto del coste ('' si es gratis). */
export function costLabel(db, cost) {
  if (!cost) return '';
  if (cost.money) return formatMoney(cost.money);
  if (cost.item) {
    const it = db.items?.[cost.item];
    const n = cost.count ?? 1;
    return `${n} ${n === 1 ? it?.name || cost.item : it?.namePlural || it?.name || cost.item}`;
  }
  return '';
}

/** ¿Puede pagar? */
export function canAfford(state, cost) {
  if (!cost) return true;
  if (cost.money) return state.player.money >= cost.money;
  if (cost.item) return state.hasItem(cost.item, cost.count ?? 1);
  return true;
}

/** Cobra el coste (se llama tras aprender). */
export function payCost(state, cost) {
  if (!cost) return;
  if (cost.money) state.addMoney(-cost.money);
  else if (cost.item) state.removeItem(cost.item, cost.count ?? 1);
}

/** Copia del Pokémon con `moveId` en el hueco `slot` (o al final si hay sitio). */
export function withLearnedMove(db, pokemon, moveId, slot = pokemon.moves.length) {
  const nm = { id: moveId, pp: db.moves[moveId]?.pp || 0, ppUps: 0 };
  const moves = pokemon.moves.slice();
  if (slot >= moves.length) moves.push(nm);
  else moves[slot] = nm;
  return { ...pokemon, moves: moves.slice(0, 4) };
}

// ------------------------------------------------------------ guiones
/** Enseña `moveId` al Pokémon `index` del equipo (con la pantalla de olvidar si ya sabe 4). → bool */
export async function teachMove(ctx, index, moveId) {
  const { db, state } = ctx;
  const p = state.party[index];
  if (!p) return false;
  if (p.moves.length < 4) {
    state.setPartyMember(index, withLearnedMove(db, p, moveId));
    ctx.se('Pkmn move learnt');
    await ctx.say(`¡${displayName(db, p)} ha aprendido ${db.moves[moveId]?.name || moveId}!`);
    return true;
  }
  const slot = await ctx.ui.learnMove(p, moveId);
  if (slot === null || slot === undefined) return false;
  state.setPartyMember(index, withLearnedMove(db, state.party[index], moveId, slot));
  return true;
}

const say = (ctx, text, speaker) => ctx.say(text, speaker ? { speaker } : {});

/**
 * Tutor: elige movimiento → Pokémon → aprende → cobra. opts: { moves, cost, speaker, greeting }.
 * @returns {Promise<boolean>} true si enseñó algo
 */
export async function runMoveTutor(ctx, { moves = [], cost = null, speaker = null, greeting = null } = {}) {
  const { db, state } = ctx;
  const list = moves.map((m) => (typeof m === 'string' ? { move: m, cost } : { cost, ...m })).filter((m) => db.moves[m.move]);
  if (!list.length) { await say(ctx, 'Hoy no tengo nada que enseñar.', speaker); return false; }
  await say(ctx, greeting || 'Puedo enseñar movimientos especiales a tus Pokémon.', speaker);
  const labels = list.map((m) => {
    const c = costLabel(db, m.cost);
    return c ? `${db.moves[m.move].name} (${c})` : db.moves[m.move].name;
  });
  const i = await ctx.choice([...labels, 'Nada'], { message: '¿Qué movimiento te interesa?', cancel: list.length });
  const pick = list[i];
  if (!pick) { await say(ctx, 'Vuelve cuando quieras.', speaker); return false; }
  if (!canAfford(state, pick.cost)) { await say(ctx, `Necesitas ${costLabel(db, pick.cost)} para que te lo enseñe.`, speaker); return false; }
  const annotations = state.party.map((p) => tutorAnnotation(db, p, pick.move));
  const idx = await ctx.ui.openParty({ mode: 'select', message: '¿A qué Pokémon se lo enseño?', annotations });
  if (!Number.isInteger(idx) || !state.party[idx]) return false;
  const p = state.party[idx];
  const moveName = db.moves[pick.move].name;
  if (p.moves.some((m) => m.id === pick.move)) { await say(ctx, `${displayName(db, p)} ya conoce ${moveName}.`, speaker); return false; }
  if (!tutorCanLearn(db, p, pick.move)) { await say(ctx, `${displayName(db, p)} no puede aprender ${moveName}.`, speaker); return false; }
  if (!(await teachMove(ctx, idx, pick.move))) return false;
  payCost(state, pick.cost);
  return true;
}

/** Recordador: elige Pokémon → movimiento olvidado → aprende → cobra. opts: { cost, speaker }. */
export async function runMoveReminder(ctx, { cost = null, speaker = null } = {}) {
  const { db, state } = ctx;
  await say(ctx, 'Recuerdo los movimientos que tus Pokémon han olvidado.', speaker);
  if (cost) await say(ctx, `Solo te pediré ${costLabel(db, cost)} a cambio.`, speaker);
  if (!canAfford(state, cost)) { await say(ctx, 'Vuelve cuando puedas pagarme.', speaker); return false; }
  const idx = await ctx.ui.openParty({ mode: 'select', message: '¿Qué Pokémon quiere recordar un movimiento?' });
  if (!Number.isInteger(idx) || !state.party[idx]) return false;
  const p = state.party[idx];
  const moves = relearnableMoves(db, p);
  if (!moves.length) { await say(ctx, `${displayName(db, p)} no tiene movimientos que recordar.`, speaker); return false; }
  const i = await ctx.choice([...moves.map((m) => db.moves[m].name), 'Cancelar'], { message: '¿Qué movimiento debería recordar?', cancel: moves.length });
  const move = moves[i];
  if (!move) return false;
  if (!(await teachMove(ctx, idx, move))) return false;
  payCost(state, cost);
  return true;
}

/** Evento de tutor listo para `events`. */
export function moveTutorEvent({ id = 'tutor', x, y, dir = 2, sprite = 'anil:veterano', moves, cost = null, speaker = null, greeting = null, when } = {}) {
  if (!Number.isInteger(x) || !Number.isInteger(y)) throw new Error(`moveTutorEvent(${id}): x/y enteros obligatorios`);
  return { id, x, y, dir, sprite, move: 'still', when, script: (ctx) => runMoveTutor(ctx, { moves, cost, speaker, greeting }) };
}

/** Evento de Recordador listo para `events`. */
export function moveReminderEvent({ id = 'recordador', x, y, dir = 2, sprite = 'anil:veterana', cost = null, speaker = null, when } = {}) {
  if (!Number.isInteger(x) || !Number.isInteger(y)) throw new Error(`moveReminderEvent(${id}): x/y enteros obligatorios`);
  return { id, x, y, dir, sprite, move: 'still', when, script: (ctx) => runMoveReminder(ctx, { cost, speaker }) };
}
