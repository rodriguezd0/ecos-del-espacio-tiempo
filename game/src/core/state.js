// Estado de la partida y guardado. El objeto `data` es JSON puro; toda modificación pasa por
// los métodos de GameState para mantener invariantes (equipo ≤ 6, cajas, Pokédex, etc.).
// Forma del guardado y migraciones: core/stateData.js. API documentada en docs/ARCHITECTURE.md §3.
import {
  SAVE_VERSION, PARTY_MAX, BOX_COUNT, BOX_SIZE, SAVE_SLOTS, BOX_NAME_MAX,
  defaultOptions, newGameData, migrate, normalizeBoxes, saveSummary, defaultBoxName,
} from './stateData.js';
import * as Storage from './storageOps.js';

export {
  SAVE_VERSION, PARTY_MAX, BOX_COUNT, BOX_SIZE, SAVE_SLOTS, BOX_NAME_MAX, defaultOptions, newGameData, migrate,
};

export const MAX_MONEY = 9999999;
export const MAX_ITEM_QTY = 999;
/** Objeto clave de la Pokédex de Axis (items_axis.json). */
export const POKEDEX_ITEM = 'POKEDEXAXIS';
const SAVE_KEY = (slot) => `ecos.save.${slot}`;
/** Clave de localStorage de una ranura (core/saveSync.js la copia en el servidor). */
export const saveKey = SAVE_KEY;

const isRef = (r) => r && typeof r === 'object' && (Number.isInteger(r.party) || (Number.isInteger(r.box) && Number.isInteger(r.slot)));

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
  /** Borra una variable (vuelve a su valor por defecto al leerla). */
  clearVar(key) {
    const { [key]: _removed, ...rest } = this.data.vars;
    this.data.vars = rest;
  }
  selfSwitch(mapId, eventId, letter = 'A') { return Boolean(this.data.selfSwitches[`${mapId}:${eventId}:${letter}`]); }
  setSelfSwitch(mapId, eventId, letter = 'A', value = true) {
    const k = `${mapId}:${eventId}:${letter}`;
    if (value) this.data.selfSwitches[k] = true;
    else delete this.data.selfSwitches[k];
  }

  // ---- jugador ----
  get player() { return this.data.player; }
  setPosition(mapId, x, y, dir = this.data.player.dir) {
    Object.assign(this.data.player, { mapId, x, y, dir });
    if (mapId && !this.data.visited.includes(mapId)) this.data.visited.push(mapId);
  }
  addMoney(n) { this.data.player.money = Math.max(0, Math.min(MAX_MONEY, this.data.player.money + n)); }
  get playTimeFrames() { return this.data.playTimeFrames || 0; }
  /** Suma tiempo de juego (lo llama el motor cada fotograma lógico). */
  tickPlayTime(frames = 1) { this.data.playTimeFrames = this.playTimeFrames + frames; }

  /** Punto de cura: destino tras perder un combate y de la Cuerda Huida. */
  get healPoint() { return this.data.lastHeal || null; }
  setHealPoint(mapId, x, y, dir = 2) {
    if (!mapId || !Number.isInteger(x) || !Number.isInteger(y)) throw new Error(`setHealPoint: punto inválido (${mapId}, ${x}, ${y})`);
    this.data.lastHeal = { mapId, x, y, dir };
  }

  // ---- opciones ----
  get options() { return this.data.options; }
  /** Cambia una opción sustituyendo el objeto de opciones (inmutable). Devuelve las opciones nuevas. */
  setOption(key, value) {
    if (typeof key !== 'string' || !key) throw new Error('setOption: clave de opción inválida');
    this.data.options = { ...this.data.options, [key]: value };
    return this.data.options;
  }
  /** Cambia varias opciones a la vez. */
  setOptions(partial = {}) {
    this.data.options = { ...this.data.options, ...partial };
    return this.data.options;
  }

  // ---- mochila ----
  itemCount(id) { return this.data.bag[id] || 0; }
  hasItem(id, n = 1) { return this.itemCount(id) >= n; }
  addItem(id, n = 1) {
    if (!id) throw new Error('addItem: falta el id del objeto');
    this.data.bag[id] = Math.min(MAX_ITEM_QTY, this.itemCount(id) + Math.max(0, n));
  }
  removeItem(id, n = 1) {
    if (!this.hasItem(id, n)) return false;
    const left = this.itemCount(id) - n;
    if (left > 0) this.data.bag[id] = left;
    else delete this.data.bag[id];
    return true;
  }
  /** Objetos clave: se tienen o no (cantidad fija 1, no se acumulan). */
  addKeyItem(id) {
    if (!id) throw new Error('addKeyItem: falta el id del objeto');
    this.data.bag[id] = 1;
  }
  hasKeyItem(id) { return this.itemCount(id) > 0; }
  removeKeyItem(id) { return this.hasKeyItem(id) ? this.removeItem(id, this.itemCount(id)) : false; }
  /** Objeto registrado para el botón SELECT (o null). */
  get registeredItem() { return this.data.registeredItem || null; }
  registerItem(id) { this.data.registeredItem = id || null; }

  // ---- repelente ----
  get repelSteps() { return this.data.repel?.steps || 0; }
  get repelItem() { return this.data.repel?.item || null; }
  /** Activa un repelente de `steps` pasos. Devuelve false si ya hay uno activo. */
  startRepel(itemId, steps) {
    if (!(steps > 0)) throw new Error(`startRepel: pasos inválidos (${steps})`);
    if (this.repelSteps > 0) return false;
    this.data.repel = { steps, item: itemId || null };
    return true;
  }
  /** Descuenta un paso del repelente. Devuelve true si el efecto se agota justo en este paso. */
  stepRepel() {
    const steps = this.repelSteps;
    if (steps <= 0) return false;
    this.data.repel = { ...this.data.repel, steps: steps - 1 };
    return steps - 1 === 0;
  }

  // ---- Pokémon ----
  get party() { return this.data.party; }
  /** Añade al equipo o, si está lleno, a la primera caja libre. Devuelve { where: 'party'|'box'|'none', box, slot }. */
  addPokemon(pkmn) {
    if (this.data.party.length < PARTY_MAX) {
      this.data.party = [...this.data.party, pkmn];
      this.registerCaught(pkmn.species);
      return { where: 'party', slot: this.data.party.length - 1 };
    }
    for (let b = 0; b < this.data.boxes.length; b++) {
      const slot = this.data.boxes[b].indexOf(null);
      if (slot >= 0) {
        this.setBoxPokemon(b, slot, pkmn);
        this.registerCaught(pkmn.species);
        return { where: 'box', box: b, slot };
      }
    }
    return { where: 'none' };
  }
  setPartyMember(index, pkmn) {
    if (!this.data.party[index]) throw new Error(`setPartyMember: no hay Pokémon en la posición ${index}`);
    this.data.party = this.data.party.map((p, i) => (i === index ? pkmn : p));
  }
  setParty(list) { this.data.party = list.filter(Boolean).slice(0, PARTY_MAX); }
  removePartyMember(index) {
    const removed = this.data.party[index];
    this.data.party = this.data.party.filter((_, i) => i !== index);
    return removed;
  }
  swapParty(a, b) {
    const p = this.data.party.slice();
    [p[a], p[b]] = [p[b], p[a]];
    this.data.party = p;
  }
  firstAblePokemon() { return this.data.party.find((p) => p.hp > 0 && !p.egg) || null; }
  /** Primer Pokémon que no es huevo (nivel de referencia del repelente). */
  leadPokemon() { return this.data.party.find((p) => !p.egg) || null; }
  allFainted() { return this.data.party.length > 0 && this.data.party.every((p) => p.hp <= 0); }

  // ---- cajas del PC ----
  get boxes() { return this.data.boxes; }
  get boxCount() { return this.data.boxes.length; }
  boxName(b) { return this.data.boxNames?.[b] || defaultBoxName(b); }
  /** Cambia el nombre de una caja (1–12 caracteres). */
  renameBox(b, name) {
    this.assertBox(b);
    const clean = String(name ?? '').trim().slice(0, BOX_NAME_MAX);
    if (!clean) throw new Error('El nombre de la caja no puede estar vacío.');
    const names = Array.from({ length: this.boxCount }, (_, i) => this.boxName(i));
    names[b] = clean;
    this.data.boxNames = names;
  }
  boxPokemon(b, slot) { return this.data.boxes[b]?.[slot] || null; }
  setBoxPokemon(b, slot, pkmn) {
    this.assertBox(b, slot);
    this.data.boxes = this.data.boxes.map((box, i) => (i === b ? box.map((p, s) => (s === slot ? pkmn || null : p)) : box));
  }
  /** Sustituye todas las cajas (se normalizan a BOX_COUNT × BOX_SIZE). */
  setBoxes(boxes) {
    if (!Array.isArray(boxes)) throw new Error('setBoxes: se esperaba una lista de cajas');
    this.data.boxes = normalizeBoxes(boxes);
  }
  /** Deposita el Pokémon `partyIndex` en la caja `box` (o la siguiente con hueco) → { box, slot }. */
  depositPokemon(partyIndex, box = 0) {
    const r = Storage.depositFromParty(this.party, this.boxes, partyIndex, box);
    this.applyStorage(r);
    return { box: r.box, slot: r.slot };
  }
  /** Saca al equipo el Pokémon de (box, slot) → índice en el equipo. */
  withdrawPokemon(box, slot) {
    this.assertBox(box, slot);
    this.applyStorage(Storage.withdrawToParty(this.party, this.boxes, box, slot));
    return this.party.length - 1;
  }
  /** Mueve o intercambia. ref = { party: i } | { box, slot } (equipo en posición ≥ longitud = añadir al final). */
  movePokemon(from, to) {
    if (!isRef(from) || !isRef(to)) throw new Error('movePokemon: referencia de hueco inválida');
    this.applyStorage(Storage.movePokemon(this.party, this.boxes, from, to));
  }
  /** Libera un Pokémon (ref como en movePokemon). Devuelve el Pokémon liberado. */
  releasePokemon(ref) {
    if (!isRef(ref)) throw new Error('releasePokemon: referencia de hueco inválida');
    if (Number.isInteger(ref.party)) {
      const p = this.party[ref.party];
      this.data.party = Storage.releaseFromParty(this.party, ref.party);
      return p;
    }
    const p = this.boxPokemon(ref.box, ref.slot);
    if (!p) throw new Error('No hay ningún Pokémon ahí.');
    this.data.boxes = Storage.releaseFromBox(this.boxes, ref.box, ref.slot);
    return p;
  }
  applyStorage({ party, boxes }) {
    if (party) this.setParty(party);
    if (boxes) this.setBoxes(boxes);
  }
  assertBox(b, slot = 0) {
    if (!Number.isInteger(b) || b < 0 || b >= this.boxCount) throw new Error(`Caja ${b} inexistente`);
    if (!Number.isInteger(slot) || slot < 0 || slot >= BOX_SIZE) throw new Error(`Hueco ${slot} inexistente`);
  }

  // ---- Pokédex ----
  registerSeen(speciesId) { this.data.dex.seen[speciesId] = true; }
  registerCaught(speciesId) {
    this.data.dex.seen[speciesId] = true;
    this.data.dex.caught[speciesId] = true;
  }
  seenCount() { return Object.keys(this.data.dex.seen).length; }
  caughtCount() { return Object.keys(this.data.dex.caught).length; }
  /** ¿Tiene la Pokédex? (entrada del menú de pausa). */
  hasPokedex() { return Boolean(this.data.dex.obtained) || this.hasKeyItem(POKEDEX_ITEM); }
  /** Entrega la Pokédex: la activa en el menú y la añade como objeto clave. */
  obtainPokedex() {
    this.data.dex = { ...this.data.dex, obtained: true };
    this.addKeyItem(POKEDEX_ITEM);
  }

  // ---- Libreta de pistas ----
  get clues() { return this.data.clues; }
  hasClue(id) { return this.data.clues.some((c) => c.id === id); }
  /** Anota una pista (una sola vez por id). Devuelve false si ya estaba. */
  addClue(id, text) {
    if (!id || !text) throw new Error('addClue: faltan id o texto');
    if (this.hasClue(id)) return false;
    this.data.clues = [...this.data.clues, { id, text: String(text), solved: false }];
    return true;
  }
  /** Marca una pista como resuelta. */
  solveClue(id) {
    this.data.clues = this.data.clues.map((c) => (c.id === id ? { ...c, solved: true } : c));
  }
  /**
   * Sustituye campos de una pista anotada (inmutable). La usa la cola de la Libreta
   * (content/story/clueLogic.js: status, step, seen, order). Devuelve false si la pista no existe.
   */
  updateClue(id, patch = {}) {
    if (!this.hasClue(id)) return false;
    const { id: _ignored, ...rest } = patch || {};
    this.data.clues = this.data.clues.map((c) => (c.id === id ? { ...c, ...rest } : c));
    return true;
  }

  // ---- progreso de Axis ----
  hasCell(id) { return this.data.zygarde.cells.includes(id); }
  addCell(id) { if (!this.hasCell(id)) this.data.zygarde.cells.push(id); }
  hasCore(id) { return this.data.zygarde.cores.includes(id); }
  addCore(id) { if (!this.hasCore(id)) this.data.zygarde.cores.push(id); }
  zygardeAbility(key) { return Boolean(this.data.zygarde.abilities[key]); }
  setZygardeAbility(key, v = true) { this.data.zygarde.abilities[key] = v; }
  /** Forma de campo de Zygarde: null (aún no acompaña) | 'core' | '10' | '50' | 'complete' (world/zygarde). */
  get zygardeForm() { return this.data.zygarde.form || null; }
  setZygardeForm(form) {
    const f = form === null || form === undefined ? null : String(form);
    if (f !== null && !['core', '10', '50', 'complete'].includes(f)) throw new Error(`setZygardeForm: forma desconocida "${form}"`);
    this.data.zygarde = { ...this.data.zygarde, form: f };
  }
  cellCount() { return this.data.zygarde.cells.length; }
  addFragment(id) { if (!this.data.fragments.includes(id)) this.data.fragments.push(id); }
  addTablet(id) { if (!this.data.tablets.includes(id)) this.data.tablets.push(id); }
  // Quitar progreso (modo desarrollador, dev/devZygarde.js): sustituyen la lista, no la modifican.
  removeCell(id) { this.data.zygarde = { ...this.data.zygarde, cells: this.data.zygarde.cells.filter((c) => c !== id) }; }
  removeCore(id) { this.data.zygarde = { ...this.data.zygarde, cores: this.data.zygarde.cores.filter((c) => c !== id) }; }
  removeFragment(id) { this.data.fragments = this.data.fragments.filter((f) => f !== id); }
  removeTablet(id) { this.data.tablets = this.data.tablets.filter((t) => t !== id); }

  // ---- Vuelo (atlas: ui/logic/regionMapData.js) ----
  /** ¿Destino de Vuelo desbloqueado por guion? (los visitados cuentan solos vía `visited`). */
  hasFlyPoint(id) { return this.data.flyPoints.includes(id); }
  /** Desbloquea un destino de Vuelo por id de lugar del atlas (p. ej. 'mesa_vientos'). */
  unlockFlyPoint(id) {
    if (!id || typeof id !== 'string') throw new Error('unlockFlyPoint: id de lugar inválido');
    if (!this.hasFlyPoint(id)) this.data.flyPoints = [...this.data.flyPoints, id];
  }

  // ---- guardería (world/daycare.js; null hasta el primer depósito) ----
  get daycare() { return this.data.daycare || null; }
  setDaycare(dc) { this.data.daycare = dc || null; }

  // ---- reloj de juego ----
  get hour() { return Math.floor(this.data.clock.minutes / 60) % 24; }
  advanceMinutes(m) { this.data.clock.minutes = (this.data.clock.minutes + m) % (24 * 60); }
  isDay() { const h = this.hour; return h >= 6 && h < 20; }

  toJSON() { return this.data; }
}

// ---- persistencia (localStorage) ----
function storage() {
  if (typeof localStorage === 'undefined') throw new Error('El almacenamiento del navegador no está disponible.');
  return localStorage;
}

function checkSlot(slot) {
  if (!Number.isInteger(slot) || slot < 1 || slot > SAVE_SLOTS) throw new Error(`Ranura de guardado inválida: ${slot}`);
}

export const SaveSystem = {
  /** Resumen de las ranuras: null (vacía), { slot, corrupt: true } o saveSummary(). */
  list() {
    const out = [];
    for (let slot = 1; slot <= SAVE_SLOTS; slot++) {
      try {
        const raw = storage().getItem(SAVE_KEY(slot));
        if (!raw) { out.push(null); continue; }
        out.push(saveSummary(slot, migrate(JSON.parse(raw))));
      } catch (err) {
        console.error(`Ranura ${slot} ilegible`, err);
        out.push({ slot, corrupt: true });
      }
    }
    return out;
  },
  save(slot, state) {
    checkSlot(slot);
    const data = { ...state.data, version: SAVE_VERSION, savedAt: Date.now() };
    storage().setItem(SAVE_KEY(slot), JSON.stringify(data));
    state.data.savedAt = data.savedAt;
    SaveSystem.listener?.('save', slot, data);
  },
  /** Coloca datos ya guardados en una ranura (partida recuperada del servidor). */
  store(slot, data) {
    checkSlot(slot);
    storage().setItem(SAVE_KEY(slot), JSON.stringify(data));
    SaveSystem.listener?.('save', slot, data);
  },
  /** Oyente de cambios (kind: 'save' | 'remove', slot, data): core/saveSync.js lo copia al servidor. */
  listener: null,
  /** GameState de la ranura (migrado), null si está vacía. Lanza si los datos están dañados. */
  load(slot) {
    checkSlot(slot);
    const raw = storage().getItem(SAVE_KEY(slot));
    if (!raw) return null;
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error(`Los datos de la ranura ${slot} están dañados.`);
    }
    return new GameState(migrate(parsed));
  },
  remove(slot) { checkSlot(slot); storage().removeItem(SAVE_KEY(slot)); SaveSystem.listener?.('remove', slot, null); },
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
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error('El archivo no es una partida de Ecos válida.');
    }
    if (!data || !data.player || !Array.isArray(data.party)) throw new Error('El archivo no es una partida de Ecos válida.');
    return new GameState(migrate(data));
  },
};
