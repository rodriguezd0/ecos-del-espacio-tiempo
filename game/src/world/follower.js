// Seguidores: el Pokémon acompañante (primero del equipo) y los compañeros de campo como el Core de
// Zygarde (D06). Siguen la trayectoria real, separados por sus huellas de dibujo; saltan salientes,
// se atraviesan y miran al líder al parar. Cadena: jugador → Core → Pokémon.
import { Character } from './character.js';
import { dx, dy } from './gameMap.js';
import { followerGapTiles } from './followerSpacing.js';
import {
  placeFollowerFormation, followFollowerFormation, advanceFollowerFormation, followerFormation,
  refreshFormationVisibility, shiftFollowerFormation, recordControlledFollower,
} from './followerFormation.js';

/** Clave de gráfico de seguidor: 'follower:ESPECIE[:forma][:shiny]'. */
export function followerSpriteKey(pkmn) {
  if (!pkmn) return '';
  return `follower:${pkmn.species}:${pkmn.form || 0}:${pkmn.shiny ? 1 : 0}`;
}

export class Follower extends Character {
  /** opts: { id = 'follower', kind = 'pokemon' | 'core' | …, map, x, y } */
  constructor(world, opts = {}) {
    super(world, opts);
    this.id = opts.id ?? 'follower';
    this.kind = opts.kind ?? 'pokemon';
    this.isFollower = true;
    this.stepAnime = true;
    this.through = true;
    this.pokemon = null;
    this.hidden = true;
    /** Guion opcional al hablarle: async (ctx, follower) => {}. Si falta se usa el del Pokémon. */
    this.talk = null;
  }

  setPokemon(pkmn) {
    this.pokemon = pkmn || null;
    this.characterName = followerSpriteKey(pkmn);
    this.hidden = !pkmn;
  }

  /** Compañero de campo con gráfico propio (p. ej. 'zygarde_core'); '' o null lo oculta. */
  setGraphic(key) {
    this.pokemon = null;
    this.characterName = key || '';
    this.hidden = !key;
  }

  get visible() { return !this.hidden && Boolean(this.characterName) && !this.transparent; }

  update(dt) {
    recordControlledFollower(this);
    const formation = followerFormation(this);
    advanceFollowerFormation(formation);
    super.update(dt);
    recordControlledFollower(this);
    refreshFormationVisibility(formation);
  }

  shiftBy(ox, oy) {
    super.shiftBy(ox, oy);
    shiftFollowerFormation(this, ox, oy);
  }

  /** Colocar detrás del líder (tras un warp o al aparecer). */
  placeBehind(leader) {
    placeFollowerFormation(leader, [this]);
  }

  endMovement() {
    this.realX = this.x * 32;
    this.realY = this.y * 32;
    this.moveTimer = null;
    this.jumpTimer = null;
    this.jumpPeak = 0;
    this.jumpFraction = 0;
  }

  /** Seguidor individual: usa la misma separación y trayectoria que la cadena. */
  follow(leader) {
    followFollowerFormation(leader, [this]);
  }

  /** Se mueve a (tx, ty) al ritmo del líder: paso, dos pasos, salto de saliente o recolocación. */
  followTo(tx, ty, leader) {
    if (this.moveRouteForcing) return;
    this.endMovement();
    this.transparent = false;
    this.setMoveSpeed(leader.moveSpeed);
    const ddx = tx - this.x;
    const ddy = ty - this.y;
    const dist = Math.abs(ddx) + Math.abs(ddy);
    if (dist === 0) return;
    const dir = ddx > 0 ? 6 : ddx < 0 ? 4 : ddy > 0 ? 2 : 8;
    if (dist === 1 && (ddx === 0 || ddy === 0)) {
      this.stepThrough(dir);
    } else if (dist === 2 && (ddx === 0 || ddy === 0)) {
      this.setJumpSpeed(leader.jumping() ? leader.jumpSpeed : leader.moveSpeed);
      this.jumpTime /= leader.jumping() ? 1 : 2;
      const old = this.through;
      this.through = true;
      this.jump(ddx, ddy);
      this.through = old;
    } else if (Math.abs(ddx) === 1 && Math.abs(ddy) === 1) {
      this.turnGeneric(dir);
      this.startStep(ddy > 0 ? (ddx > 0 ? 3 : 1) : (ddx > 0 ? 9 : 7));
    }
  }

  stepThrough(dir) {
    const old = this.through;
    this.through = true;
    this.turnGeneric(dir);
    this.startStep(dir);
    this.through = old;
  }

  turnTowardsLeader(leader) { if (!this.moveRouteForcing) this.turnToward(leader); }
}

/** Seguidores activos (visibles o no, pero no ocultos) de una cadena, en orden. */
export function activeChain(followers) {
  return (followers || []).filter((f) => f && !f.hidden);
}

/**
 * Registra el paso del líder; cada acompañante sigue sus migas manteniendo separación visual.
 */
export function followChain(leader, followers) {
  followFollowerFormation(leader, followers || []);
}

/** Coloca la cadena en fila detrás del líder (tras un warp o al aparecer un seguidor). */
export function placeChainBehind(leader, followers) {
  placeFollowerFormation(leader, followers || []);
}

/** Al terminar un paso: cada seguidor mira a su propio líder. */
export function turnChainTowardsLeaders(leader, followers) {
  let prev = leader;
  for (const f of activeChain(followers)) {
    f.turnTowardsLeader(prev);
    prev = f;
  }
}

/** A sigue alcanzando al compañero separado: delante, dentro de la formación y sin obstáculos. */
export function canTalkToFollower(leader, follower) {
  const world = leader.world;
  const vx = follower.x - leader.x, vy = follower.y - leader.y;
  const distance = Math.abs(vx) + Math.abs(vy);
  if (!distance || vx !== dx(leader.direction) * distance || vy !== dy(leader.direction) * distance) return false;
  let range = 0, previous = leader;
  for (const f of activeChain(world?.followers || [follower])) {
    range += followerGapTiles(previous, f);
    previous = f;
    if (f === follower) break;
  }
  if (distance > range) return false;
  const env = world?.env?.() || {};
  const tileAt = (x, y) => {
    if (leader.map.valid(x, y)) return { map: leader.map, x, y };
    const hit = world?.entryAt?.(x, y);
    return hit && { map: hit.entry.map, x: hit.x, y: hit.y };
  };
  for (let i = 1; i <= distance; i++) {
    const tile = tileAt(leader.x + dx(leader.direction) * i, leader.y + dy(leader.direction) * i);
    const from = tileAt(leader.x + dx(leader.direction) * (i - 1), leader.y + dy(leader.direction) * (i - 1));
    if (!tile || !from || !from.map.passable(from.x, from.y, leader.direction, leader, env)
      || !tile.map.passable(tile.x, tile.y, 10 - leader.direction, leader, env)) return false;
    if (tile.map.events.some(ev => !ev.through && !ev.erased && ev.at(tile.x, tile.y) && (ev.characterName || ev.solid))) return false;
  }
  return true;
}
