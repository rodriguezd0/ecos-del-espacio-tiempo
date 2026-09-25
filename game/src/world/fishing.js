// Pesca con la Caña Vieja, la Caña Buena y la Supercaña (OLDROD, GOODROD, SUPERROD). Port de pbFishing y
// de los usos en el campo de las cañas de Essentials 21.1: mirar al agua pescable (terrain tag canFish),
// esperar entre 5 y 10 puntos, «¡Algo ha picado!» y pulsar A a tiempo. Las tablas son las del mapa en el
// formato de encuentros existente: encounters.fish_old / fish_good / fish_super (admiten variantes horarias
// como fish_oldNight). Se registra en world/fieldActions.js (objetos de uso en el mundo).
//
// Animación del jugador: si existe la hoja de pesca del protagonista (content/characters.js
// `protagonista_<m|f>_fish_offset`, 4 fotogramas de lanzamiento por dirección, como Essentials) se usa; si no,
// un marcador provisional dibujado por código (caña, sedal y boya que se hunde al picar).
import { dx, dy } from './gameMap.js';
import { EncounterSystem } from './encounters.js';

export const RODS = Object.freeze({
  OLDROD: { level: 1, table: 'fish_old' },
  GOODROD: { level: 2, table: 'fish_good' },
  SUPERROD: { level: 3, table: 'fish_super' },
});
export const FISH_TABLES = Object.freeze(Object.values(RODS).map((r) => r.table));
const SPEEDUP_ABILITIES = ['STICKYHOLD', 'SUCTIONCUPS'];
const DOT_FRAMES = 16; // 0,4 s por punto (Essentials)
const MIN_DOTS = 5;
const MAX_DOTS = 10;
const REACT_MAX = 60; // 1 s
const REACT_MIN = 30; // ½ s

export const FISH_TEXT = Object.freeze({
  cantUse: 'Aquí no se puede usar.',
  dot: '.   ',
  bite: '¡Algo ha picado!',
  nothing: 'Parece que no pican…',
  gotAway: 'El Pokémon se ha escapado…',
  landed: '¡Has pescado un Pokémon!',
});

/** Probabilidad de que pique (%): 20 + 25 × nivel de la caña; ×1,5 con Viscosidad o Ventosas. Puro. */
export function biteChance(rodId, speedup = false) {
  const rod = RODS[rodId];
  if (!rod) return 0;
  const base = 20 + 25 * rod.level;
  return speedup ? base * 1.5 : base;
}

/**
 * Tirada completa de una pesca (pbFishing). Puro con `rng`.
 * @returns {{ dots: number, bite: boolean, reactFrames: number }}
 */
export function rollFishing(rng, { rodId, hasEncounter, speedup = false }) {
  const roll = () => MIN_DOTS + Math.floor(rng() * (MAX_DOTS - MIN_DOTS + 1));
  let dots = roll();
  if (speedup) dots = Math.min(dots, roll());
  const bite = Boolean(hasEncounter) && rng() * 100 < biteChance(rodId, speedup);
  const reactFrames = REACT_MAX - Math.floor(rng() * (REACT_MAX - REACT_MIN));
  return { dots, bite, reactFrames };
}

/** ¿El primer Pokémon acelera la pesca? */
export function fishingSpeedup(party = []) {
  const lead = party.find((p) => !p.egg);
  return Boolean(lead && SPEEDUP_ABILITIES.includes(lead.ability));
}

/**
 * Casilla de enfrente si se puede pescar: { ok, x, y, reason }. Como Essentials: el agua de enfrente debe ser
 * pescable y, si no se va nadando, la casilla propia no puede cortar el paso hacia ella (acantilados).
 */
export function fishingSpot(world) {
  const p = world?.player;
  if (!p || !world.map) return { ok: false, reason: 'sin mapa' };
  const x = p.x + dx(p.direction);
  const y = p.y + dy(p.direction);
  const tag = world.terrainAt ? world.terrainAt(p, x, y) : world.map.terrainTagAt(x, y);
  if (!tag.canFish) return { ok: false, x, y, reason: 'no hay agua pescable' };
  if (!p.surfing && !world.map.passable(p.x, p.y, p.direction, p, world.env ? world.env() : {})) {
    return { ok: false, x, y, reason: 'orilla infranqueable' };
  }
  return { ok: true, x, y };
}

/** Tipo de tabla del mapa para la caña (con variante horaria) o null. */
export function fishingType(encounters, rodId, hour = 12) {
  const rod = RODS[rodId];
  if (!rod || !encounters?.resolveType) return null;
  return encounters.resolveType(rod.table, hour);
}

/**
 * Tablas de pesca de la casilla de agua (aditivo B16): primero `def.fishingAt(state, x, y)` del mapa (casillas
 * especiales, p. ej. las de Feebas que cambian cada día: devuelve un objeto de tablas o null), después la zona de
 * encuentros de la casilla (def.encounterZones) si tiene tabla para esa caña y, si no, las del mapa.
 */
export function fishingSystem(world, spot, rodId, { state = null, hour = 12 } = {}) {
  const def = world?.current?.def;
  if (typeof def?.fishingAt === 'function') {
    try {
      const special = def.fishingAt(state, spot.x, spot.y);
      if (special) {
        const sys = new EncounterSystem(special, world.rng || Math.random);
        if (fishingType(sys, rodId, hour)) return sys;
      }
    } catch (err) {
      console.error('[pesca] fishingAt del mapa', err);
    }
  }
  const zone = world?.encountersAt ? world.encountersAt(spot.x, spot.y) : null;
  if (zone && zone !== world.encounters && fishingType(zone, rodId, hour)) return zone;
  return world?.encounters;
}

// ------------------------------------------------------------ flujo en el mapa
/**
 * Espera `frames` fotogramas; devuelve true si se pulsa A (o B, salvo onlyA) antes. `tick(frame)` anima.
 * La entrada es la del mundo (World#input = engine.input en el juego).
 */
async function waitOrPress(ctx, frames, tick = null, onlyA = false) {
  const inp = ctx.world?.input || null;
  const hit = () => Boolean(inp && (inp.pressed('A') || (!onlyA && inp.pressed('B'))));
  let left = frames;
  let pressed = false;
  let frame = 0;
  await ctx.scene.runner.until(() => {
    frame += 1;
    if (tick) tick(frame);
    if (hit()) { pressed = true; return true; }
    left -= 1;
    return left <= 0;
  });
  return pressed;
}

/**
 * Pesca con la caña `rodId` desde el guion de campo. Devuelve true si se usó la caña (aunque no pique).
 * rng opcional (pruebas).
 */
export async function useRod(ctx, rodId, { rng = Math.random } = {}) {
  const spot = fishingSpot(ctx.world);
  if (!RODS[rodId] || !spot.ok) { await ctx.say(FISH_TEXT.cantUse); return false; }
  const sys = fishingSystem(ctx.world, spot, rodId, { state: ctx.state, hour: ctx.state.hour });
  const type = fishingType(sys, rodId, ctx.state.hour);
  const plan = rollFishing(rng, { rodId, hasEncounter: Boolean(type), speedup: fishingSpeedup(ctx.state.party) });
  const anim = await FishingAnim.start(ctx, spot);
  let landed = false;
  try {
    let text = '';
    let early = false;
    for (let i = 0; i < plan.dots && !early; i++) {
      text += FISH_TEXT.dot;
      await ctx.say(text, { keepOpen: true });
      early = await waitOrPress(ctx, DOT_FRAMES, (f) => anim.update(f));
    }
    if (early || !plan.bite) {
      await anim.reel();
      anim.dispose();
      await ctx.say(FISH_TEXT.nothing);
      return true;
    }
    anim.bite();
    ctx.se('exclaim');
    ctx.emote('player', '!');
    await ctx.say(`${text}\n${FISH_TEXT.bite}`, { keepOpen: true });
    landed = await waitOrPress(ctx, plan.reactFrames, (f) => anim.update(f), true);
    await anim.reel();
    anim.dispose();
    await ctx.say(landed ? FISH_TEXT.landed : FISH_TEXT.gotAway);
  } finally {
    anim.dispose();
  }
  if (landed) {
    const enc = sys.choose(type);
    if (enc) await ctx.wildBattle(enc);
  }
  return true;
}

/** Objetos de campo de pesca para world/fieldActions.js: id → async (ctx, id) → bool. */
export const FISHING_ITEMS = Object.freeze(Object.fromEntries(Object.keys(RODS).map((id) => [id, (ctx, itemId) => useRod(ctx, itemId)])));

// ------------------------------------------------------------ animación
/**
 * Clave de la hoja de pesca del protagonista si existe en el registro de personajes (content/characters.js:
 * `protagonista_<m|f>_fish_offset`, que se dibuja 16 px más abajo como en Essentials, o `_fish`), o null.
 */
async function fishSheet(gender) {
  try {
    const mod = await import('../content/characters.js');
    const base = gender === 'F' ? 'protagonista_f' : 'protagonista_m';
    return [`${base}_fish_offset`, `${base}_fish`].find((key) => mod.getCharacter?.(key)) || null;
  } catch {
    return null;
  }
}

/** Animación de la pesca: hoja propia del jugador o marcador provisional (caña, sedal y boya). */
export class FishingAnim {
  static async start(ctx, spot) {
    const anim = new FishingAnim(ctx, spot);
    await anim.begin();
    return anim;
  }

  constructor(ctx, spot) {
    this.ctx = ctx;
    this.spot = spot;
    this.player = ctx.player;
    this.meshes = [];
    this.sheet = null;
    this.bitten = false;
    this.cast = 0;
  }

  async begin() {
    const p = this.player;
    p.lockPattern = true;
    this.sheet = await fishSheet(this.ctx.state.player?.gender);
    if (this.sheet) {
      this.prevName = p.characterName;
      p.characterName = this.sheet;
      for (let f = 0; f < 4; f++) { p.pattern = f; await this.ctx.wait(4); }
      return;
    }
    await this.buildPlaceholder();
    for (let f = 1; f <= 12; f++) { this.cast = f / 12; this.layout(0); await this.ctx.wait(1); }
  }

  async buildPlaceholder() {
    const view = this.ctx.scene?.worldView;
    if (!view?.fxGroup || typeof document === 'undefined') return;
    let THREE;
    try {
      THREE = await import('three');
    } catch {
      return;
    }
    const quad = (color, w, h) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color, transparent: true, depthTest: false, side: THREE.DoubleSide }));
      m.frustumCulled = false;
      m.renderOrder = 1e6;
      view.fxGroup.add(m);
      this.meshes.push(m);
      return m;
    };
    this.rod = quad(0x6b4a2a, 2, 2);
    this.line = quad(0xe8e8e8, 2, 2);
    this.floatBody = quad(0xf8f8f8, 6, 4);
    this.floatTop = quad(0xe03030, 6, 4);
    this.ripple = quad(0xd0f0ff, 16, 2);
    this.ripple.material.opacity = 0;
  }

  /** Coloca las piezas del marcador provisional (px de mundo del mapa actual). */
  layout(frame) {
    if (!this.rod) return;
    const p = this.player;
    const d = p.direction;
    const hx = p.realX + 16 + dx(d) * 10;
    const hy = p.realY + 18 + (d === 8 ? -8 : 0);
    const tip = { x: hx + dx(d) * 18 + (dy(d) ? 6 : 0), y: hy + dy(d) * 14 - 16 };
    const bob = this.bitten ? 4 : Math.round(Math.sin(frame / 8) * 1.5);
    const tx = this.spot.x * 32 + 16;
    const ty = this.spot.y * 32 + 18;
    const fx = hx + (tx - hx) * this.cast;
    const fy = hy + (ty - hy) * this.cast - Math.sin(this.cast * Math.PI) * 20 + bob;
    segment(this.rod, hx, hy, tip.x, tip.y, 2);
    segment(this.line, tip.x, tip.y, fx, fy, 1);
    this.floatTop.position.set(fx, fy - 2, 0);
    this.floatBody.position.set(fx, fy + 2, 0);
    this.floatTop.material.opacity = this.bitten ? 0.45 : 1;
    this.floatBody.material.opacity = this.bitten ? 0.45 : 1;
    this.ripple.position.set(tx, ty + 6, 0);
    this.ripple.scale.set(1 + (frame % 30) / 15, 1, 1);
    this.ripple.material.opacity = this.bitten ? 0.8 : (this.cast >= 1 ? 0.35 : 0);
  }

  update(frame) {
    if (this.sheet) { this.player.pattern = 3; return; }
    this.layout(frame);
  }

  bite() {
    this.bitten = true;
    this.update(0);
  }

  async reel() {
    if (this.sheet) {
      for (let f = 3; f >= 0; f--) { this.player.pattern = f; await this.ctx.wait(3); }
      return;
    }
    for (let f = 11; f >= 0; f--) { this.cast = f / 12; this.bitten = false; this.layout(0); await this.ctx.wait(1); }
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    const p = this.player;
    for (const m of this.meshes) {
      m.removeFromParent();
      m.geometry.dispose();
      m.material.dispose();
    }
    this.meshes = [];
    this.rod = null;
    if (this.sheet && this.prevName !== undefined) p.characterName = this.prevName;
    p.lockPattern = false;
    p.pattern = 0;
    if (typeof p.setMovementType === 'function') p.setMovementType(p.surfing ? 'surfing' : 'walking');
  }
}

/** Coloca un quad de grosor `w` entre dos puntos (px de mundo, y hacia abajo). */
function segment(mesh, x0, y0, x1, y1, w) {
  const len = Math.max(1, Math.hypot(x1 - x0, y1 - y0));
  mesh.position.set((x0 + x1) / 2, (y0 + y1) / 2, 0);
  mesh.scale.set(len / 2, w / 2, 1);
  // El grupo raíz del mundo invierte y (y hacia abajo): el ángulo se mide en ese mismo sistema.
  mesh.rotation.z = Math.atan2(y1 - y0, x1 - x0);
}
