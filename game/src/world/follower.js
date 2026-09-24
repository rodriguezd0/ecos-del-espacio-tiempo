// Seguidores: el Pokémon acompañante (primero del equipo) y los compañeros de campo como el Core de
// Zygarde (D06). Port de Game_Follower de Essentials: ocupa la casilla que deja el líder, salta salientes,
// se atraviesa y mira al líder al parar. Varios seguidores forman una CADENA (jugador → Core → Pokémon):
// cada uno sigue al anterior con followChain/placeChainBehind.
import { Character } from './character.js';
import { dx, dy } from './gameMap.js';

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

  /** Colocar detrás del líder (tras un warp o al aparecer). */
  placeBehind(leader) {
    const bx = leader.x - dx(leader.direction);
    const by = leader.y - dy(leader.direction);
    const map = leader.map;
    const ok = map.valid(bx, by) && map.passable(bx, by, 0, null, this.world?.env?.() || {}) && !map.terrainTagAt(bx, by).ledge;
    this.map = map;
    this.moveTo(ok ? bx : leader.x, ok ? by : leader.y);
    this.direction = leader.direction;
    this.transparent = !ok;
  }

  endMovement() {
    this.realX = this.x * 32;
    this.realY = this.y * 32;
    this.moveTimer = null;
    this.jumpTimer = null;
    this.jumpPeak = 0;
    this.jumpFraction = 0;
  }

  /** follow_leader: se mueve a la casilla que dejó el líder (o salta 2 si hubo saliente). */
  follow(leader) {
    const back = 10 - leader.direction;
    let tx = leader.x + dx(back);
    let ty = leader.y + dy(back);
    if (leader.map.terrainTagAt(tx, ty).ledge) { tx += dx(back); ty += dy(back); }
    this.followTo(tx, ty, leader);
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
      const mx = this.x + dx(dir);
      const my = this.y + dy(dir);
      if (!this.map.terrainTagAt(mx, my).ledge) {
        this.stepThrough(dir);
        this.endMovement();
        this.stepThrough(dir);
      } else {
        this.setJumpSpeed(leader.jumping() ? leader.jumpSpeed : leader.moveSpeed);
        this.jumpTime /= leader.jumping() ? 1 : 2;
        const old = this.through;
        this.through = true;
        this.jump(ddx, ddy);
        this.through = old;
      }
    } else {
      this.moveTo(tx, ty);
      this.direction = leader.direction;
    }
  }

  stepThrough(dir) {
    const old = this.through;
    this.through = true;
    this.turnGeneric(dir);
    this.startStep(dir);
    this.through = old;
  }

  turnTowardsLeader(leader) { this.turnToward(leader); }
}

/** Seguidores activos (visibles o no, pero no ocultos) de una cadena, en orden. */
export function activeChain(followers) {
  return (followers || []).filter((f) => f && !f.hidden);
}

/**
 * Mueve la cadena: el primer seguidor ocupa la casilla que deja el líder y cada uno de los siguientes la
 * que acaba de dejar el anterior. Si un eslabón no se mueve, los de detrás tampoco (conserva la formación);
 * al darse la vuelta el líder, nadie pisa su casilla nueva.
 */
export function followChain(leader, followers) {
  let prev = null;
  for (const f of activeChain(followers)) {
    const ox = f.x;
    const oy = f.y;
    if (!prev) f.follow(leader);
    else if (!(prev.ox === leader.x && prev.oy === leader.y)) f.followTo(prev.ox, prev.oy, prev.ch);
    if (f.x === ox && f.y === oy) break;
    prev = { ch: f, ox, oy };
  }
}

/** Coloca la cadena en fila detrás del líder (tras un warp o al aparecer un seguidor). */
export function placeChainBehind(leader, followers) {
  let prev = leader;
  for (const f of activeChain(followers)) {
    f.placeBehind(prev);
    prev = f;
  }
}

/** Al terminar un paso: cada seguidor mira a su propio líder. */
export function turnChainTowardsLeaders(leader, followers) {
  let prev = leader;
  for (const f of activeChain(followers)) {
    f.turnTowardsLeader(prev);
    prev = f;
  }
}
