// Estado de la partida y guardado. El objeto `data` es JSON puro; toda modificación pasa por
// los métodos de GameState para mantener invariantes (equipo ≤ 6, cajas, Pokédex, etc.).

export const SAVE_VERSION = 1;
export const PARTY_MAX = 6;
export const BOX_COUNT = 30;
export const BOX_SIZE = 30;
export const SAVE_SLOTS = 3;
const SAVE_KEY = (slot) => `ecos.save.${slot}`;

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
    boxNames: Array.from({ length: BOX_COUNT }, (_, i) => `Caja ${i + 1}`),
    bag: {},
    registeredItem: null,
    dex: { seen: {}, caught: {}, obtained: false },
    zygarde: { cells: [], cores: [], form: null, abilities: {} },
    fragments: [],
    tablets: [],
    visited: [],
    flyPoints: [],
    clues: [],
    options: defaultOptions(),
    clock: { minutes: 9 * 60 }, // hora del juego
    lastHeal: null, // { mapId, x, y, dir } para volver tras perder
  };
}

export class GameState {
  constructor(data) {
    this.data = data;
  }

  static create(opts) {
    return new GameState(newGameData(opts));
  }

  // ---- flags / variables ----
  flag(key) { return Boolean(this.data.flags[key]); }
  setFlag(key, value = true) {
    if (value) this.data.flags[key] = true;
    else delete this.data.flags[key];
  }
  var(key, fallback = 0) { return key in this.data.vars ? this.data.vars[key] : fallback; }
  setVar(key, value) { this.data.vars[key] = value; }
  selfSwitch(mapId, eventId, letter = 'A') { return Boolean(this.data.selfSwitches[`${mapId}:${eventId}:${letter}`]); }
  setSelfSwitch(mapId, eventId, letter = 'A', value = true) {
    const k = `${mapId}:${eventId}:${letter}`;
    if (value) this.data.selfSwitches[k] = true;
    else delete this.data.selfSwitches[k];
  }

  // ---- jugador ----
  get player() { return this.data.player; }
  get options() { return this.data.options; }
  setPosition(mapId, x, y, dir = this.data.player.dir) {
    Object.assign(this.data.player, { mapId, x, y, dir });
    if (!this.data.visited.includes(mapId)) this.data.visited.push(mapId);
  }
  addMoney(n) { this.data.player.money = Math.max(0, Math.min(9999999, this.data.player.money + n)); }

  // ---- mochila ----
  itemCount(id) { return this.data.bag[id] || 0; }
  hasItem(id, n = 1) { return this.itemCount(id) >= n; }
  addItem(id, n = 1) { this.data.bag[id] = Math.min(999, this.itemCount(id) + n); }
  removeItem(id, n = 1) {
    if (!this.hasItem(id, n)) return false;
    const left = this.itemCount(id) - n;
    if (left > 0) this.data.bag[id] = left;
    else delete this.data.bag[id];
    return true;
  }

  // ---- Pokémon ----
  get party() { return this.data.party; }
  /** Añade al equipo o, si está lleno, a la primera caja libre. Devuelve { where: 'party'|'box', box, slot }. */
  addPokemon(pkmn) {
    this.registerCaught(pkmn.species);
    if (this.data.party.length < PARTY_MAX) {
      this.data.party.push(pkmn);
      return { where: 'party', slot: this.data.party.length - 1 };
    }
    for (let b = 0; b < this.data.boxes.length; b++) {
      const slot = this.data.boxes[b].indexOf(null);
      if (slot >= 0) {
        this.data.boxes[b][slot] = pkmn;
        return { where: 'box', box: b, slot };
      }
    }
    return { where: 'none' };
  }
  setPartyMember(index, pkmn) { this.data.party[index] = pkmn; }
  setParty(list) { this.data.party = list.slice(0, PARTY_MAX); }
  removePartyMember(index) { return this.data.party.splice(index, 1)[0]; }
  swapParty(a, b) {
    const p = this.data.party;
    [p[a], p[b]] = [p[b], p[a]];
  }
  firstAblePokemon() { return this.data.party.find((p) => p.hp > 0) || null; }
  allFainted() { return this.data.party.length > 0 && this.data.party.every((p) => p.hp <= 0); }

  // ---- Pokédex ----
  registerSeen(speciesId) { this.data.dex.seen[speciesId] = true; }
  registerCaught(speciesId) {
    this.data.dex.seen[speciesId] = true;
    this.data.dex.caught[speciesId] = true;
  }
  seenCount() { return Object.keys(this.data.dex.seen).length; }
  caughtCount() { return Object.keys(this.data.dex.caught).length; }

  // ---- progreso de Axis ----
  hasCell(id) { return this.data.zygarde.cells.includes(id); }
  addCell(id) { if (!this.hasCell(id)) this.data.zygarde.cells.push(id); }
  hasCore(id) { return this.data.zygarde.cores.includes(id); }
  addCore(id) { if (!this.hasCore(id)) this.data.zygarde.cores.push(id); }
  zygardeAbility(key) { return Boolean(this.data.zygarde.abilities[key]); }
  setZygardeAbility(key, v = true) { this.data.zygarde.abilities[key] = v; }
  addFragment(id) { if (!this.data.fragments.includes(id)) this.data.fragments.push(id); }
  addTablet(id) { if (!this.data.tablets.includes(id)) this.data.tablets.push(id); }

  // ---- reloj de juego ----
  get hour() { return Math.floor(this.data.clock.minutes / 60) % 24; }
  advanceMinutes(m) { this.data.clock.minutes = (this.data.clock.minutes + m) % (24 * 60); }
  isDay() { const h = this.hour; return h >= 6 && h < 20; }

  toJSON() { return this.data; }
}

// ---- persistencia (localStorage) ----
export const SaveSystem = {
  list() {
    const out = [];
    for (let slot = 1; slot <= SAVE_SLOTS; slot++) {
      try {
        const raw = localStorage.getItem(SAVE_KEY(slot));
        if (!raw) { out.push(null); continue; }
        const d = JSON.parse(raw);
        out.push({ slot, name: d.player.name, gender: d.player.gender, mapId: d.player.mapId, playTimeFrames: d.playTimeFrames, savedAt: d.savedAt, dexCaught: Object.keys(d.dex.caught).length, fragments: d.fragments.length, party: d.party.map((p) => ({ species: p.species, form: p.form, shiny: p.shiny, level: p.level })) });
      } catch (err) {
        console.error(`Ranura ${slot} ilegible`, err);
        out.push({ slot, corrupt: true });
      }
    }
    return out;
  },
  save(slot, state) {
    const data = { ...state.data, savedAt: Date.now() };
    localStorage.setItem(SAVE_KEY(slot), JSON.stringify(data));
    state.data.savedAt = data.savedAt;
  },
  load(slot) {
    const raw = localStorage.getItem(SAVE_KEY(slot));
    if (!raw) return null;
    return new GameState(migrate(JSON.parse(raw)));
  },
  remove(slot) { localStorage.removeItem(SAVE_KEY(slot)); },
  /** Descarga la partida como archivo JSON. */
  exportFile(state, filename = 'ecos_partida.json') {
    const blob = new Blob([JSON.stringify(state.data)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  },
  async importFile(file) {
    const text = await file.text();
    const data = JSON.parse(text);
    if (!data || !data.player || !Array.isArray(data.party)) throw new Error('El archivo no es una partida de Ecos válida.');
    return new GameState(migrate(data));
  },
};

/** Migraciones de versiones de guardado antiguas (rellena campos nuevos con valores por defecto). */
export function migrate(data) {
  const base = newGameData({ name: data.player?.name, gender: data.player?.gender, playerId: data.player?.id });
  const merged = { ...base, ...data, player: { ...base.player, ...data.player }, options: { ...base.options, ...data.options }, zygarde: { ...base.zygarde, ...data.zygarde } };
  merged.version = SAVE_VERSION;
  return merged;
}
