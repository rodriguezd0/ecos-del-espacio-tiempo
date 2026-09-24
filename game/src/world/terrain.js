// Terrain tags de Essentials 21.1 (025_Hardcoded data/012_TerrainTag.rb). Módulo puro.
// El número es el valor guardado en tilesets.json (terrainTags[idTile]).

const BASE = {
  canSurf: false, waterfall: false, waterfallCrest: false, canFish: false, canDive: false,
  deepBush: false, showsGrassRustle: false, landWildEncounters: false, doubleWildEncounters: false,
  battleEnvironment: null, ledge: false, ice: false, bridge: false, showsReflections: false,
  mustWalk: false, mustWalkOrRun: false, ignorePassability: false,
};

const DEFS = [
  { id: 'None', num: 0 },
  { id: 'Ledge', num: 1, ledge: true },
  { id: 'Grass', num: 2, showsGrassRustle: true, landWildEncounters: true, battleEnvironment: 'Grass' },
  { id: 'Sand', num: 3, battleEnvironment: 'Sand' },
  { id: 'Rock', num: 4, battleEnvironment: 'Rock' },
  { id: 'DeepWater', num: 5, canSurf: true, canFish: true, canDive: true, battleEnvironment: 'MovingWater' },
  { id: 'StillWater', num: 6, canSurf: true, canFish: true, battleEnvironment: 'StillWater' },
  { id: 'Water', num: 7, canSurf: true, canFish: true, battleEnvironment: 'MovingWater' },
  { id: 'Waterfall', num: 8, canSurf: true, waterfall: true },
  { id: 'WaterfallCrest', num: 9, canSurf: true, canFish: true, waterfallCrest: true },
  { id: 'TallGrass', num: 10, deepBush: true, landWildEncounters: true, doubleWildEncounters: true, battleEnvironment: 'TallGrass', mustWalk: true },
  { id: 'UnderwaterGrass', num: 11, landWildEncounters: true },
  { id: 'Ice', num: 12, battleEnvironment: 'Ice', ice: true, mustWalkOrRun: true },
  { id: 'Neutral', num: 13, ignorePassability: true },
  { id: 'SootGrass', num: 14, showsGrassRustle: true, landWildEncounters: true, battleEnvironment: 'Grass' },
  { id: 'Bridge', num: 15, bridge: true },
  { id: 'Puddle', num: 16, battleEnvironment: 'Puddle', showsReflections: true },
  { id: 'NoEffect', num: 17 },
];

export const TERRAIN_TAGS = DEFS.map((d) => Object.freeze({ ...BASE, ...d }));
export const TERRAIN_BY_ID = Object.freeze(Object.fromEntries(TERRAIN_TAGS.map((t) => [t.id, t])));
export const TERRAIN_NONE = TERRAIN_TAGS[0];

/** Terrain tag por número (desconocido → None). */
export function terrainTag(num) {
  return TERRAIN_TAGS[num] || TERRAIN_NONE;
}

/** Puede surfear libremente (agua que no es cascada). */
export const canSurfFreely = (t) => t.canSurf && !t.waterfall && !t.waterfallCrest;
