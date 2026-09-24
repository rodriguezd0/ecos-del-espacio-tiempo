// Utilidades de Pokémon específicas del combate (megaevolución, Alfa, Poder Oculto…).
// Complementan a pokemon.js sin cambiar su API.
import { speciesData, abilityFor, calcStats, STATS } from './pokemon.js';
import { ALPHA } from './settings.js';

/** Aplica el multiplicador provisional de Alfa [PROVISIONAL D29] a las estadísticas (salvo PS). */
export function alphaStats(stats, pkmn) {
  if (!pkmn || !pkmn.alpha) return stats;
  const out = { ...stats };
  for (const s of STATS) if (s !== 'hp') out[s] = Math.floor(out[s] * ALPHA.statMultiplier);
  return out;
}

/** Estadísticas efectivas en combate (incluye Alfa). */
export function battleStats(db, pkmn) {
  return alphaStats(calcStats(db, pkmn), pkmn);
}

/** ¿La forma actual es una megaevolución? */
export function isMegaPokemon(db, pkmn) {
  if (!pkmn || !pkmn.form) return false;
  const sp = db.species[pkmn.species];
  const f = sp && sp.forms && sp.forms[pkmn.form];
  return !!(f && f.megaStone);
}

/** Forma mega accesible por la megapiedra equipada, o 0. */
export function megaFormFor(db, pkmn) {
  if (!pkmn || !pkmn.heldItem) return 0;
  const sp = db.species[pkmn.species];
  if (!sp || !sp.forms) return 0;
  if ((sp.flags || []).includes('cantMegaEvolve')) return 0;
  if (isMegaPokemon(db, pkmn)) return 0;
  for (const [form, data] of Object.entries(sp.forms)) {
    if (data.megaStone && data.megaStone === pkmn.heldItem) return Number(form);
  }
  return 0;
}

/** Megaevoluciona el Pokémon (muta la copia del combate). */
export function makeMega(db, pkmn) {
  const form = megaFormFor(db, pkmn);
  if (form <= 0) return false;
  pkmn.premegaForm = pkmn.form || 0;
  pkmn.premegaAbility = pkmn.ability;
  pkmn.form = form;
  pkmn.ability = abilityFor(speciesData(db, pkmn.species, form), pkmn.abilityIndex || 0);
  return true;
}

/** Deshace la megaevolución (al debilitarse o al terminar el combate). */
export function makeUnmega(db, pkmn) {
  if (!isMegaPokemon(db, pkmn)) return false;
  pkmn.form = pkmn.premegaForm || 0;
  if (pkmn.premegaAbility) pkmn.ability = pkmn.premegaAbility;
  delete pkmn.premegaForm;
  delete pkmn.premegaAbility;
  return true;
}

/** Nombre de la megaforma ("Mega Garchomp"). */
export function megaName(db, pkmn) {
  const sp = speciesData(db, pkmn.species, pkmn.form);
  return sp.formName || `Mega ${db.species[pkmn.species].name}`;
}

/** Tipo de Poder Oculto según los IV (pbHiddenPower de Essentials). */
export function hiddenPowerType(db, pkmn) {
  const types = Object.values(db.types)
    .filter((t) => !t.pseudo && !['NORMAL', 'SHADOW'].includes(t.id))
    .sort((a, b) => (a.icon ?? 0) - (b.icon ?? 0))
    .map((t) => t.id);
  const iv = pkmn.ivs || {};
  let idx = 0;
  idx |= (iv.hp & 1);
  idx |= (iv.atk & 1) << 1;
  idx |= (iv.def & 1) << 2;
  idx |= (iv.spe & 1) << 3;
  idx |= (iv.spa & 1) << 4;
  idx |= (iv.spd & 1) << 5;
  idx = Math.floor(((types.length - 1) * idx) / 63);
  return types[idx] || 'NORMAL';
}

/** Rendimiento de EV que otorga el Pokémon al ser derrotado. */
export function evYield(db, pkmn) {
  const sp = speciesData(db, pkmn.species, pkmn.form);
  const out = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
  for (const [k, v] of Object.entries(sp.evs || {})) if (k in out) out[k] = v;
  return out;
}

/** ¿Puede evolucionar la especie/forma (para Mineral Evolutivo)? */
export function canEvolve(db, pkmn) {
  const sp = speciesData(db, pkmn.species, pkmn.form);
  return (sp.evolutions || []).some(([target]) => !!db.species[target]);
}

/** Copia profunda JSON (los Pokémon son objetos planos). */
export function clonePokemon(pkmn) {
  return pkmn ? JSON.parse(JSON.stringify(pkmn)) : pkmn;
}
