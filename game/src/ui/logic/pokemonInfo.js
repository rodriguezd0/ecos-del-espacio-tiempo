// Datos de presentación de un Pokémon (nombre, PS, tipos, EXP, naturaleza...). Módulo PURO:
// recibe la base de datos `db` (engine.data) y el objeto Pokémon serializable.
import {
  calcStats, speciesData, expForLevel, NATURE_BY_ID, MAX_LEVEL, totalPP, displayName,
} from '../../battle/core/pokemon.js';

/** Resumen listo para dibujar. */
export function pokemonView(db, p) {
  const sp = speciesData(db, p.species, p.form);
  const stats = calcStats(db, p);
  const growth = sp.growthRate;
  const curLvExp = expForLevel(growth, p.level);
  const nextLvExp = p.level >= MAX_LEVEL ? curLvExp : expForLevel(growth, p.level + 1);
  const span = Math.max(1, nextLvExp - curLvExp);
  return {
    name: displayName(db, p),
    speciesName: sp.name,
    formName: sp.formName || '',
    num: sp.num,
    types: sp.types || [],
    stats,
    maxHp: stats.hp,
    hp: Math.max(0, Math.min(p.hp, stats.hp)),
    level: p.level,
    exp: p.exp,
    expToNext: p.level >= MAX_LEVEL ? 0 : Math.max(0, nextLvExp - p.exp),
    expFraction: p.level >= MAX_LEVEL ? 0 : Math.max(0, Math.min(1, (p.exp - curLvExp) / span)),
    nature: NATURE_BY_ID[p.nature] || null,
    ability: p.ability ? db.abilities?.[p.ability] || { name: p.ability, description: '' } : null,
    item: p.heldItem ? db.items?.[p.heldItem] || { name: p.heldItem } : null,
    fainted: p.hp <= 0,
    egg: Boolean(p.egg),
  };
}

/** Movimientos con datos para la UI. */
export function movesView(db, p) {
  return (p.moves || []).map((m) => {
    const data = db.moves?.[m.id] || { name: m.id, type: 'NORMAL', category: 'Status', power: 0, accuracy: 0, description: '' };
    return { ...m, data, total: totalPP(db, m) };
  });
}

/** Estadística favorecida (+) y desfavorecida (−) por la naturaleza. */
export function natureEffects(natureId) {
  const n = NATURE_BY_ID[natureId];
  return { up: n?.up || null, down: n?.down || null };
}

// Característica según el IV más alto (Summary de Essentials, página 2).
const CHARACTERISTICS = {
  hp: ['Le encanta comer.', 'A menudo se duerme.', 'Suele desordenar cosas.', 'A veces se enfada.', 'Le gusta relajarse.'],
  atk: ['Orgulloso de su fuerza.', 'Le gusta revolverse.', 'Un poco cabezota.', 'Le gusta luchar.', 'Tiene mal genio.'],
  def: ['Cuerpo resistente.', 'Es buen fajador.', 'Muy persistente.', 'Muy resistente.', 'Muy perseverante.'],
  spa: ['Extremadamente curioso.', 'Le gusta hacer travesuras.', 'Muy astuto.', 'A menudo está en Babia.', 'Muy quisquilloso.'],
  spd: ['Voluntarioso.', 'Es algo orgulloso.', 'Muy insolente.', 'Odia perder.', 'Un poco cabezota.'],
  spe: ['Le gusta correr.', 'Siempre con el oído alerta.', 'Impetuoso y bobo.', 'Es un poco payaso.', 'Huye rápido.'],
};

export function characteristic(p) {
  const order = ['hp', 'atk', 'def', 'spe', 'spa', 'spd'];
  const seed = [...String(p.uid || '')].reduce((a, c) => a + c.charCodeAt(0), 0) % order.length;
  let best = null;
  for (let i = 0; i < order.length; i++) {
    const s = order[(i + seed) % order.length];
    if (!best || (p.ivs?.[s] ?? 0) > (p.ivs?.[best] ?? 0)) best = s;
  }
  return CHARACTERISTICS[best][(p.ivs?.[best] ?? 0) % 5];
}

/** Cómo se obtuvo (texto de la página de notas). */
export function metText(p, mapName) {
  const where = mapName || 'Lugar lejano';
  switch (p.obtainedMode) {
    case 'egg': return { where, how: 'Huevo recibido.' };
    case 'trade': return { where, how: `Intercambiado al Nv. ${p.metLevel ?? p.level}.` };
    case 'fateful': return { where, how: `Conocido en un Encuentro Fatídico al Nv. ${p.metLevel ?? p.level}.` };
    case 'gift': return { where, how: `Recibido al Nv. ${p.metLevel ?? p.level}.` };
    default: return { where, how: `Encontrado con Nv. ${p.metLevel ?? p.level}.` };
  }
}

/** Movimientos de campo que conoce (para el menú de equipo). Mapa ID de movimiento → nombre del comando. */
export const FIELD_MOVES = {
  CUT: 'Corte', ROCKSMASH: 'Golpe Roca', STRENGTH: 'Fuerza', SURF: 'Surf', WATERFALL: 'Cascada',
  DIVE: 'Buceo', FLY: 'Vuelo', FLASH: 'Destello', DIG: 'Excavar', TELEPORT: 'Teletransporte',
  SWEETSCENT: 'Dulce Aroma', HEADBUTT: 'Golpe Cabeza', SOFTBOILED: 'Amortiguador', MILKDRINK: 'Batido',
};

export function fieldMovesOf(p) {
  return (p.moves || []).filter((m) => FIELD_MOVES[m.id]).map((m) => ({ id: m.id, name: FIELD_MOVES[m.id] }));
}
