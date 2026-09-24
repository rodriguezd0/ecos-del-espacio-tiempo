// Encuentros salvajes. Port de PokemonEncounters (Essentials 21.1, 039_Battle triggering/004):
// tablas por tipo (grass, cave, water, con variantes Day/Night/Morning…), probabilidad por paso con
// periodo de gracia y acumulador, y elección ponderada de especie y nivel. Módulo puro.

export const BASE_TYPES = ['grass', 'cave', 'water'];
// Probabilidades por paso por defecto de Essentials (Land 21, Cave 5, Water 2).
export const DEFAULT_STEP_CHANCE = { grass: 21, cave: 5, water: 2 };

/**
 * Normaliza una entrada de tabla. Formatos admitidos:
 *   [peso, 'ESPECIE', nivelMin, nivelMax?]  (como el PBS de Essentials)
 *   { species, level?, min?, max?, levels?:[min,max], weight?, form? }
 */
export function normalizeEntry(e) {
  if (Array.isArray(e)) {
    const [weight, species, min, max] = e;
    return { weight: Number(weight) || 1, species, min: Number(min), max: Number(max ?? min), form: 0 };
  }
  if (!e || !e.species) throw new Error(`Entrada de encuentro inválida: ${JSON.stringify(e)}`);
  const min = e.min ?? e.levels?.[0] ?? e.level;
  const max = e.max ?? e.levels?.[1] ?? e.level ?? min;
  if (!Number.isFinite(min)) throw new Error(`Encuentro ${e.species}: nivel no válido`);
  return { weight: e.weight ?? 1, species: e.species, min, max, form: e.form || 0 };
}

/** Periodo del día a partir de la hora (PBDayNight de Essentials). */
export function dayPeriod(hour) {
  if (hour >= 6 && hour < 20) {
    if (hour < 12) return 'Morning';
    if (hour < 17) return 'Afternoon';
    return 'Evening';
  }
  return 'Night';
}

/**
 * allow_encounter? de Essentials: con repelente activo, los salvajes de nivel inferior al del primer
 * Pokémon del equipo (REPEL_COUNTS_FAINTED_POKEMON: cuenta aunque esté debilitado) no aparecen.
 * @param {{ level: number }} enc
 * @param {{ repelActive?: boolean, leadLevel?: number }} opts
 */
export function allowEncounter(enc, { repelActive = false, leadLevel = 0 } = {}) {
  if (!enc) return false;
  if (repelActive && leadLevel > 0 && enc.level < leadLevel) return false;
  return true;
}

export class EncounterSystem {
  /**
   * @param {object} tables definición `encounters` del mapa: { grass:[...], grassNight:[...], cave, water, stepChance:{} }
   * @param {() => number} rng
   */
  constructor(tables = {}, rng = Math.random) {
    this.rng = rng;
    this.tables = {};
    for (const [key, list] of Object.entries(tables || {})) {
      if (key === 'stepChance' || !Array.isArray(list)) continue;
      this.tables[key] = list.map(normalizeEntry);
    }
    this.stepChance = { ...DEFAULT_STEP_CHANCE, ...(tables?.stepChance || {}) };
    this.reset();
  }

  reset() {
    this.stepCount = 0;
    this.chanceAccumulator = 0;
  }

  has(type) { return Boolean(this.tables[type] && this.tables[type].length); }
  hasBase(base) { return Object.keys(this.tables).some((k) => k === base || k.startsWith(base)); }

  /** Tipo con variante horaria (grassNight > grass…). */
  resolveType(base, hour) {
    const period = dayPeriod(hour);
    const tries = period === 'Night' ? [`${base}Night`] : [`${base}${period}`, `${base}Day`];
    for (const t of tries) if (this.has(t)) return t;
    return this.has(base) ? base : null;
  }

  /** Tipo de encuentro posible en la posición del jugador (o null). */
  encounterType({ terrain, surfing = false, hour = 12 }) {
    if (surfing) return this.resolveType('water', hour);
    if (terrain?.ice) return null;
    let type = null;
    if (terrain?.landWildEncounters && this.hasBase('grass')) type = this.resolveType('grass', hour);
    if (!type && this.hasBase('cave')) type = this.resolveType('cave', hour);
    return type;
  }

  baseOf(type) { return BASE_TYPES.find((b) => type.startsWith(b)) || type; }

  /** ¿Se produce un encuentro este paso? (encounter_triggered? sin objetos/habilidades). */
  triggered(type, { repel = false, byStep = true } = {}) {
    if (!type || !this.has(type)) return false;
    const base = this.stepChance[this.baseOf(type)] ?? 0;
    if (!base) return false;
    let chance = base;
    const minSteps = Math.min(Math.max(8 - chance / 10, 0), 8);
    if (byStep) chance += this.chanceAccumulator / 200;
    if (byStep && this.stepCount < minSteps) {
      this.stepCount += 1;
      if (this.rng() * 100 >= (chance * 5) / (base + this.chanceAccumulator / 200)) return false;
    }
    if (this.rng() * 100 < chance) return true;
    if (byStep) {
      this.chanceAccumulator += base;
      if (repel) this.chanceAccumulator = 0;
    }
    return false;
  }

  /** Elige especie y nivel ponderados. Devuelve { species, level, form, type } o null. */
  choose(type) {
    const list = this.tables[type];
    if (!list || !list.length) return null;
    const sorted = [...list].sort((a, b) => b.weight - a.weight);
    const total = sorted.reduce((a, e) => a + e.weight, 0);
    let r = Math.floor(this.rng() * total);
    let pick = sorted[sorted.length - 1];
    for (const e of sorted) {
      r -= e.weight;
      if (r < 0) { pick = e; break; }
    }
    const level = pick.min + Math.floor(this.rng() * (pick.max - pick.min + 1));
    return { species: pick.species, level, form: pick.form, type };
  }
}
