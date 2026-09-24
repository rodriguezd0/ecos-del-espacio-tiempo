// Encuentros visibles (state.options.encounterMode === 'visible'): Pokémon salvajes de las mismas
// tablas del mapa deambulan por la hierba (o por la cueva) y el contacto inicia el combate.
import { followerSpriteKey } from './follower.js';
import { SHINY_CHANCE } from '../battle/core/pokemon.js';

export const VISIBLE_MAX = 4;
const SPAWN_EVERY = 90; // fotogramas
const MIN_DIST = 4;
const MAX_DIST = 11;
const DESPAWN_DIST = 16;
const LIFETIME = 60 * 45;

export class VisibleEncounters {
  constructor(world, { rng = Math.random, onBattle } = {}) {
    this.world = world;
    this.rng = rng;
    this.onBattle = onBattle;
    this.mons = [];
    this.timer = 0;
    this.serial = 0;
  }

  get enabled() { return this.world.state?.options?.encounterMode === 'visible'; }

  /** Tablas en una casilla (zonas del mapa, def.encounterZones; si no, las del mapa). */
  tablesAt(x, y) {
    return this.world.encountersAt ? this.world.encountersAt(x, y) : this.world.encounters;
  }

  /** Tipo de tabla que usan los visibles en este mapa (grass o cave), alrededor de (x, y) si se da. */
  baseType(x, y) {
    const enc = Number.isInteger(x) ? this.tablesAt(x, y) : this.world.encounters;
    if (enc.hasBase('grass')) return 'grass';
    if (enc.hasBase('cave')) return 'cave';
    return null;
  }

  eligible(x, y, base) {
    const map = this.world.map;
    if (!map.valid(x, y)) return false;
    const t = map.terrainTagAt(x, y, this.world.bridge);
    if (base === 'grass') return t.landWildEncounters;
    return map.passableStrict(x, y) && !t.canSurf && !t.ledge;
  }

  clear() {
    for (const m of this.mons) this.world.removeEvent(m.ev);
    this.mons = [];
  }

  update() {
    if (!this.enabled) { if (this.mons.length) this.clear(); return; }
    this.timer += 1;
    for (const m of this.mons) m.age += 1;
    const p = this.world.player;
    const gone = this.mons.filter((m) => m.ev.erased || m.age > LIFETIME
      || Math.abs(m.ev.x - p.x) + Math.abs(m.ev.y - p.y) > DESPAWN_DIST);
    for (const m of gone) this.world.removeEvent(m.ev);
    this.mons = this.mons.filter((m) => !gone.includes(m));
    if (this.timer % SPAWN_EVERY === 0 && this.mons.length < VISIBLE_MAX && !this.world.scriptBusy()) this.trySpawn();
  }

  trySpawn() {
    const p = this.world.player;
    if (!this.baseType(p.x, p.y) && !this.world.zoneEncounters?.length) return false;
    for (let t = 0; t < 24; t++) {
      const x = p.x + Math.floor((this.rng() * 2 - 1) * MAX_DIST);
      const y = p.y + Math.floor((this.rng() * 2 - 1) * MAX_DIST);
      if (Math.abs(x - p.x) + Math.abs(y - p.y) < MIN_DIST) continue;
      // Tablas de la casilla donde aparece (zonas de encuentro del mapa, B11).
      const tables = this.tablesAt(x, y);
      const base = this.baseType(x, y);
      if (!base || !this.eligible(x, y, base)) continue;
      if (this.world.events.some((e) => !e.erased && e.at(x, y))) continue;
      const type = tables.resolveType(base, this.world.state.hour);
      const enc = tables.choose(type);
      if (!enc) return false;
      enc.shiny = this.rng() < SHINY_CHANCE;
      this.spawn(x, y, enc, base);
      return true;
    }
    return false;
  }

  spawn(x, y, enc, base) {
    this.serial += 1;
    const ev = this.world.spawnEvent({
      id: `salvaje_${this.serial}`,
      x, y,
      sprite: followerSpriteKey({ species: enc.species, form: enc.form, shiny: enc.shiny }),
      dir: [2, 4, 6, 8][Math.floor(this.rng() * 4)],
      stepAnime: true,
      move: { wander: 3 },
      freq: 4,
      trigger: 'eventTouch',
      restrictTo: (nx, ny) => this.eligible(nx, ny, base),
      script: async (ctx) => {
        await ctx.emote(ctx.event, '!');
        ctx.erase();
        await this.onBattle?.(ctx, enc);
      },
    });
    this.mons.push({ ev, enc, age: 0 });
    return ev;
  }
}
