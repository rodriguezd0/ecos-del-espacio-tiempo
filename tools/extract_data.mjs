// Convierte los PBS de Pokémon Añil (Essentials v21.1, textos en español) a JSON para el juego.
// Uso: node tools/extract_data.mjs
// Salida: game/data/{species,moves,abilities,items,types,trainer_types,dex_axis}.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsePBS, list, int, num, tuples } from './lib/pbs.mjs';
import { loadMarshal } from './lib/marshal.mjs';
import { applyCompiledMetrics } from './lib/speciesMetrics.mjs';
import { GENERAL_336, PARADOX_7, ULTRA_11, LEGENDARY_58, ID_NORMALIZATIONS, splitNames } from './axis_dex_source.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PBS = path.join(ROOT, 'Pokemon Anil V4.13', 'PBS');
const OUT = path.join(ROOT, 'game', 'data');
fs.mkdirSync(OUT, { recursive: true });

const STAT_KEYS = ['hp', 'atk', 'def', 'spe', 'spa', 'spd']; // orden PBS: PS, Atq, Def, Vel, AtEsp, DefEsp
const STAT_ID = { HP: 'hp', ATTACK: 'atk', DEFENSE: 'def', SPEED: 'spe', SPECIAL_ATTACK: 'spa', SPECIAL_DEFENSE: 'spd' };

function baseStats(v) {
  const n = list(v).map(Number);
  if (n.length !== 6) return undefined;
  return Object.fromEntries(STAT_KEYS.map((k, i) => [k, n[i]]));
}
function evs(v) {
  const out = {};
  for (const [stat, amount] of tuples(list(v), 2)) out[STAT_ID[stat] || stat.toLowerCase()] = Number(amount);
  return out;
}

// Campos de especie compartidos por pokemon.txt y pokemon_forms.txt
function speciesFields(f) {
  const s = {};
  const set = (k, v) => { if (v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0 && false)) s[k] = v; };
  if (f.Name) set('name', f.Name);
  if (f.FormName) set('formName', f.FormName);
  if (f.Types) set('types', list(f.Types));
  if (f.BaseStats) set('baseStats', baseStats(f.BaseStats));
  if (f.GenderRatio) set('genderRatio', f.GenderRatio);
  if (f.GrowthRate) set('growthRate', f.GrowthRate);
  if (f.BaseExp) set('baseExp', int(f.BaseExp));
  if (f.EVs) set('evs', evs(f.EVs));
  if (f.CatchRate) set('catchRate', int(f.CatchRate));
  if (f.Happiness) set('happiness', int(f.Happiness));
  if (f.Abilities) set('abilities', list(f.Abilities));
  if (f.HiddenAbilities) set('hiddenAbilities', list(f.HiddenAbilities));
  if (f.Moves) set('moves', tuples(list(f.Moves), 2).map(([lv, m]) => [Number(lv), m]));
  if (f.TutorMoves) set('tutorMoves', list(f.TutorMoves));
  if (f.EggMoves) set('eggMoves', list(f.EggMoves));
  if (f.EggGroups) set('eggGroups', list(f.EggGroups));
  if (f.HatchSteps) set('hatchSteps', int(f.HatchSteps));
  if (f.Incense) set('incense', f.Incense);
  if (f.Offspring) set('offspring', list(f.Offspring));
  if (f.Height) set('height', num(f.Height));
  if (f.Weight) set('weight', num(f.Weight));
  if (f.Color) set('color', f.Color);
  if (f.Shape) set('shape', f.Shape);
  if (f.Habitat) set('habitat', f.Habitat);
  if (f.Category) set('category', f.Category);
  if (f.Pokedex) set('pokedex', f.Pokedex);
  if (f.Generation) set('generation', int(f.Generation));
  if (f.Flags) set('flags', list(f.Flags));
  if (f.WildItemCommon) set('wildItemCommon', list(f.WildItemCommon));
  if (f.WildItemUncommon) set('wildItemUncommon', list(f.WildItemUncommon));
  if (f.WildItemRare) set('wildItemRare', list(f.WildItemRare));
  // Las evoluciones sin parámetro (Happiness, Trade…) dejan campos vacíos: no filtrar vacíos o se desalinea la terna.
  if (f.Evolutions) set('evolutions', tuples(String(f.Evolutions).split(',').map((s) => s.trim()), 3).map(([t, m, p]) => [t, m, p === '' || p === undefined ? null : p]));
  if (f.MegaStone) set('megaStone', f.MegaStone);
  if (f.MegaMove) set('megaMove', f.MegaMove);
  if (f.MegaMessage) set('megaMessage', int(f.MegaMessage));
  if (f.UnmegaForm) set('unmegaForm', int(f.UnmegaForm));
  if (f.PokedexForm) set('pokedexForm', int(f.PokedexForm));
  return s;
}

function extractSpecies() {
  const species = {};
  let dexNum = 0;
  for (const sec of parsePBS(path.join(PBS, 'pokemon.txt'))) {
    dexNum += 1;
    species[sec.section] = { id: sec.section, num: dexNum, ...speciesFields(sec.fields), forms: {} };
  }
  for (const sec of parsePBS(path.join(PBS, 'pokemon_forms.txt'))) {
    const sp = species[sec.section];
    if (!sp) continue;
    const form = int(sec.args[0]);
    sp.forms[form] = speciesFields(sec.fields);
  }
  // Métricas de sprites (offsets de combate, sombra, velocidad): las COMPILADAS que usa Añil (Data/species_metrics.dat);
  // los PBS pokemon_metrics*.txt están desfasados en ~25 especies (ver tools/lib/speciesMetrics.mjs).
  const compiled = loadMarshal(fs.readFileSync(path.join(ROOT, 'Pokemon Anil V4.13', 'Data', 'species_metrics.dat')));
  console.log(`Métricas compiladas aplicadas: ${applyCompiledMetrics(species, compiled)}`);
  return species;
}

function extractMoves() {
  const moves = {};
  for (const sec of parsePBS(path.join(PBS, 'moves.txt'))) {
    const f = sec.fields;
    moves[sec.section] = {
      id: sec.section,
      name: f.Name,
      type: f.Type,
      category: f.Category, // Physical | Special | Status
      power: int(f.Power),
      accuracy: int(f.Accuracy),
      pp: int(f.TotalPP),
      target: f.Target,
      priority: int(f.Priority),
      functionCode: f.FunctionCode || 'None',
      flags: list(f.Flags),
      effectChance: int(f.EffectChance),
      description: f.Description || '',
    };
  }
  return moves;
}

function extractAbilities() {
  const out = {};
  for (const sec of parsePBS(path.join(PBS, 'abilities.txt'))) {
    out[sec.section] = { id: sec.section, name: sec.fields.Name, description: sec.fields.Description || '', flags: list(sec.fields.Flags) };
  }
  return out;
}

function extractItems() {
  const out = {};
  for (const sec of parsePBS(path.join(PBS, 'items.txt'))) {
    const f = sec.fields;
    out[sec.section] = {
      id: sec.section,
      name: f.Name,
      namePlural: f.NamePlural || f.Name,
      pocket: int(f.Pocket, 1),
      price: int(f.Price),
      sellPrice: f.SellPrice != null ? int(f.SellPrice) : undefined,
      fieldUse: f.FieldUse || null,
      battleUse: f.BattleUse || null,
      flags: list(f.Flags),
      consumable: f.Consumable != null ? /true/i.test(f.Consumable) : undefined,
      move: f.Move || undefined,
      description: f.Description || '',
    };
  }
  return out;
}

function extractTypes() {
  const out = {};
  for (const sec of parsePBS(path.join(PBS, 'types.txt'))) {
    const f = sec.fields;
    out[sec.section] = {
      id: sec.section,
      name: f.Name,
      icon: int(f.IconPosition),
      weaknesses: list(f.Weaknesses),
      resistances: list(f.Resistances),
      immunities: list(f.Immunities),
      special: /true/i.test(f.IsSpecialType || ''),
      pseudo: /true/i.test(f.IsPseudoType || ''),
      flags: list(f.Flags),
    };
  }
  return out;
}

function extractTrainerTypes() {
  const out = {};
  for (const sec of parsePBS(path.join(PBS, 'trainer_types.txt'))) {
    const f = sec.fields;
    out[sec.section] = {
      id: sec.section,
      name: f.Name,
      gender: f.Gender || 'Unknown',
      baseMoney: int(f.BaseMoney, 30),
      skillLevel: f.SkillLevel != null ? int(f.SkillLevel) : undefined,
      introBGM: f.IntroBGM, battleBGM: f.BattleBGM, victoryBGM: f.VictoryBGM,
      flags: list(f.Flags),
    };
  }
  return out;
}

function buildAxisDex(species) {
  const byName = new Map();
  for (const sp of Object.values(species)) byName.set(sp.name.toLowerCase(), sp.id);
  const groups = [
    ['general', GENERAL_336], ['paradox', PARADOX_7], ['ultra', ULTRA_11], ['legendary', LEGENDARY_58],
  ];
  const entries = [];
  const problems = [];
  for (const [group, block] of groups) {
    for (const sourceName of splitNames(block)) {
      let id = ID_NORMALIZATIONS[sourceName] || byName.get(sourceName.toLowerCase());
      const normalized = Boolean(ID_NORMALIZATIONS[sourceName]);
      if (!id) {
        const guess = sourceName.toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (species[guess]) id = guess;
      }
      if (!id) problems.push(sourceName);
      entries.push({ n: entries.length + 1, sourceName, id: id || null, group, ...(normalized ? { note: 'Grafía normalizada al verificar ID (biblia §16)' } : {}) });
    }
  }
  return { entries, problems };
}

const species = extractSpecies();
const moves = extractMoves();
const abilities = extractAbilities();
const items = extractItems();
const types = extractTypes();
const trainerTypes = extractTrainerTypes();
const dex = buildAxisDex(species);

const write = (name, data) => {
  fs.writeFileSync(path.join(OUT, name), JSON.stringify(data));
  console.log(`${name}: ${(fs.statSync(path.join(OUT, name)).size / 1024).toFixed(0)} KB`);
};
write('species.json', species);
write('moves.json', moves);
write('abilities.json', abilities);
write('items.json', items);
write('types.json', types);
write('trainer_types.json', trainerTypes);
write('dex_axis.json', {
  note: 'Inventario candidato de 412 nombres (biblia §16). No es roster final: D28 pendiente.',
  counts: { general: 336, paradox: 7, ultra: 11, legendary: 58 },
  pendingReconciliation: ['ROARINGMOON (Bramaluna Alpha, P7) fuera del inventario', 'DITTO (Phione) ausente', 'SABLEYE (Diancie) ausente', 'LATIAS/LATIOS (Megas) ausentes', 'Fauna submarina candidata'],
  entries: dex.entries,
});
console.log(`Especies: ${Object.keys(species).length}, movimientos: ${Object.keys(moves).length}, habilidades: ${Object.keys(abilities).length}, objetos: ${Object.keys(items).length}`);
console.log(`Dex Axis: ${dex.entries.length} entradas; sin resolver: ${dex.problems.length ? dex.problems.join(', ') : 'ninguna'}`);
