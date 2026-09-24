// Forma del guardado (JSON puro) y migraciones entre versiones. Sin dependencias: lo usan GameState,
// SaveSystem y los tests de integración. Cualquier campo nuevo se añade aquí (newGameData) y, si hace
// falta convertir datos antiguos, en migrate() subiendo SAVE_VERSION.

export const SAVE_VERSION = 2;
export const PARTY_MAX = 6;
export const BOX_COUNT = 30;
export const BOX_SIZE = 30;
export const SAVE_SLOTS = 3;
export const BOX_NAME_MAX = 12;

export function defaultOptions() {
  return {
    textSpeed: 2, // 0 lento, 1 medio, 2 rápido, 3 instantáneo
    bgmVolume: 0.7,
    seVolume: 0.8,
    encounterMode: 'classic', // 'classic' | 'visible' (biblia §15: el jugador elige)
    battleScene: true, // animaciones de combate
    battleStyle: 'switch', // 'switch' | 'set'
    followerEnabled: true,
    frame: 1, // marco de ventana
  };
}

export const defaultBoxName = (i) => `Caja ${i + 1}`;

export function newGameData({ name = 'Axis', gender = 'M', playerId } = {}) {
  return {
    version: SAVE_VERSION,
    createdAt: Date.now(),
    playTimeFrames: 0,
    player: {
      name, gender, id: playerId ?? Math.floor(Math.random() * 65536), money: 3000,
      mapId: null, x: 0, y: 0, dir: 2,
    },
    flags: {},
    vars: {},
    selfSwitches: {},
    party: [],
    boxes: Array.from({ length: BOX_COUNT }, () => Array(BOX_SIZE).fill(null)),
    boxNames: Array.from({ length: BOX_COUNT }, (_, i) => defaultBoxName(i)),
    bag: {},
    registeredItem: null,
    dex: { seen: {}, caught: {}, obtained: false },
    zygarde: { cells: [], cores: [], form: null, abilities: {} },
    fragments: [],
    tablets: [],
    visited: [],
    flyPoints: [],
    clues: [], // [{ id, text, solved }] — Libreta de pistas
    options: defaultOptions(),
    clock: { minutes: 9 * 60 }, // hora del juego
    lastHeal: null, // { mapId, x, y, dir }: destino tras perder y de la Cuerda Huida
    repel: { steps: 0, item: null }, // repelente activo
  };
}

const isObj = (v) => Boolean(v) && typeof v === 'object' && !Array.isArray(v);
const obj = (v, d = {}) => (isObj(v) ? v : d);
const arr = (v, d = []) => (Array.isArray(v) ? v : d);

/** Cajas con la forma exacta BOX_COUNT × BOX_SIZE (huecos = null). `extra` se coloca en huecos libres. */
export function normalizeBoxes(boxes, extra = []) {
  const src = arr(boxes);
  const out = Array.from({ length: Math.max(BOX_COUNT, src.length) }, (_, b) => {
    const box = arr(src[b]);
    return Array.from({ length: BOX_SIZE }, (_, s) => (isObj(box[s]) ? box[s] : null));
  });
  for (const p of extra) {
    const b = out.findIndex((box) => box.includes(null));
    if (b < 0) break;
    out[b][out[b].indexOf(null)] = p;
  }
  return out;
}

export function normalizeBoxNames(names, count = BOX_COUNT) {
  const src = arr(names);
  return Array.from({ length: count }, (_, i) => (typeof src[i] === 'string' && src[i].trim() ? src[i] : defaultBoxName(i)));
}

/**
 * Convierte cualquier guardado anterior (o parcial) a la versión actual sin perder datos:
 * rellena campos nuevos, repara tipos, normaliza cajas y mueve datos de sitio entre versiones.
 * No modifica `raw`. Lanza si no parece una partida.
 */
export function migrate(raw) {
  if (!isObj(raw) || !isObj(raw.player)) throw new Error('Los datos no son una partida de Ecos válida.');
  const base = newGameData({ name: raw.player.name, gender: raw.player.gender, playerId: raw.player.id });
  const party = arr(raw.party).filter(isObj);
  const vars = { ...obj(raw.vars) };
  let repel = { ...base.repel, ...obj(raw.repel) };
  // v1 → v2: el repelente vivía en vars.repelSteps
  if (Number(vars.repelSteps) > 0 && !(repel.steps > 0)) repel = { steps: Number(vars.repelSteps), item: null };
  delete vars.repelSteps;
  const boxes = normalizeBoxes(raw.boxes, party.slice(PARTY_MAX));
  const dex = obj(raw.dex);
  const zyg = obj(raw.zygarde);
  return {
    ...base,
    ...raw,
    version: SAVE_VERSION,
    playTimeFrames: Math.max(0, Number(raw.playTimeFrames) || 0),
    player: { ...base.player, ...raw.player },
    flags: { ...obj(raw.flags) },
    vars,
    selfSwitches: { ...obj(raw.selfSwitches) },
    party: party.slice(0, PARTY_MAX),
    boxes,
    boxNames: normalizeBoxNames(raw.boxNames, boxes.length),
    bag: { ...obj(raw.bag) },
    dex: { ...base.dex, ...dex, seen: { ...obj(dex.seen) }, caught: { ...obj(dex.caught) } },
    zygarde: { ...base.zygarde, ...zyg, cells: arr(zyg.cells), cores: arr(zyg.cores), abilities: { ...obj(zyg.abilities) } },
    fragments: arr(raw.fragments),
    tablets: arr(raw.tablets),
    visited: arr(raw.visited),
    flyPoints: arr(raw.flyPoints),
    clues: arr(raw.clues).filter((c) => isObj(c) && c.id),
    options: { ...base.options, ...obj(raw.options) },
    clock: { ...base.clock, ...obj(raw.clock) },
    lastHeal: isObj(raw.lastHeal) && raw.lastHeal.mapId ? raw.lastHeal : null,
    repel,
  };
}

/** Resumen de una partida para el menú de carga (sin crear GameState). */
export function saveSummary(slot, data) {
  return {
    slot,
    name: data.player.name,
    gender: data.player.gender,
    mapId: data.player.mapId,
    playTimeFrames: data.playTimeFrames,
    savedAt: data.savedAt,
    dexCaught: Object.keys(data.dex.caught).length,
    fragments: data.fragments.length,
    party: data.party.map((p) => ({ species: p.species, form: p.form, shiny: p.shiny, level: p.level })),
  };
}
