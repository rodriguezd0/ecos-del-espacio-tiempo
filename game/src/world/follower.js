// Pokémon acompañante: el primero del equipo sigue al jugador (port de Game_Follower de Essentials:
// ocupa la casilla que deja el líder, salta salientes, se atraviesa y mira al líder al parar).
import { Character } from './character.js';
import { dx, dy } from './gameMap.js';

/** Clave de gráfico de seguidor: 'follower:ESPECIE[:forma][:shiny]'. */
export function followerSpriteKey(pkmn) {
  if (!pkmn) return '';
  return `follower:${pkmn.species}:${pkmn.form || 0}:${pkmn.shiny ? 1 : 0}`;
}

export class Follower extends Character {
  constructor(world, opts = {}) {
    super(world, opts);
    this.id = 'follower';
    this.isFollower = true;
    this.stepAnime = true;
    this.through = true;
    this.pokemon = null;
    this.hidden = true;
  }

  setPokemon(pkmn) {
    this.pokemon = pkmn || null;
    this.characterName = followerSpriteKey(pkmn);
    this.hidden = !pkmn;
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
    if (this.moveRouteForcing) return;
    this.endMovement();
    this.transparent = false;
    const back = 10 - leader.direction;
    let tx = leader.x + dx(back);
    let ty = leader.y + dy(back);
    if (leader.map.terrainTagAt(tx, ty).ledge) { tx += dx(back); ty += dy(back); }
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
