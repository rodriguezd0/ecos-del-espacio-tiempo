// Jugador. Port de Game_Player (Essentials 21.1 + velocidades de Añil):
// andar/correr, giro en el sitio al tocar una dirección brevemente, choque con sonido,
// saltos de saliente, surf (hook de Zygarde "swim") y paso a mapas conectados.
import { Character } from './character.js';
import { dx, dy } from './gameMap.js';
import { canSurfFreely } from './terrain.js';

// Velocidades (escala de Essentials; Añil usa 3.5 para andar).
export const WALK_SPEED = 3.5;
// Añil fija 5.5 al correr (≈0.044 s/casilla); se usa 4.5 (el doble que andar, como Essentials) por jugabilidad.
export const RUN_SPEED = 4.5;
export const SURF_SPEED = 4;
export const ICE_SPEED = 6;
export const TURN_HOLD_SECONDS = 0.075; // tiempo que hay que mantener una dirección nueva antes de andar
const SURF_BOB_DURATION = 1.5;

export class Player extends Character {
  constructor(world, opts = {}) {
    super(world, { ...opts, speed: WALK_SPEED });
    this.id = 'player';
    this.isPlayer = true;
    this.lastDir = 0;
    this.lastDirTime = 0;
    this.time = 0;
    this.surfing = false;
    this.iceSliding = false;
    this.charsets = opts.charsets || { walk: opts.sprite || '', run: opts.sprite || '', surf: opts.sprite || '' };
    this.characterName = this.charsets.walk;
    this.forcedDir = 0;
  }

  get input() { return this.world?.input || null; }

  canRun() {
    if (this.moveRouteForcing) return this.moveSpeed > WALK_SPEED;
    if (this.bumping || this.jumping()) return false;
    if (!this.world?.inputEnabled?.()) return false;
    if (this.terrainTag().mustWalk) return false;
    if (this.world?.canRun && !this.world.canRun()) return false;
    return Boolean(this.input?.held('RUN'));
  }

  setMovementType(type) {
    const cs = this.charsets;
    switch (type) {
      case 'surfing':
        if (!this.moveRouteForcing) this.setMoveSpeed(SURF_SPEED);
        this.characterName = cs.surf || cs.walk;
        break;
      case 'running':
        if (!this.moveRouteForcing) this.setMoveSpeed(this.world?.runSpeed?.() || RUN_SPEED);
        this.characterName = cs.run || cs.walk;
        break;
      case 'ice':
        if (!this.moveRouteForcing) this.setMoveSpeed(ICE_SPEED);
        this.characterName = cs.walk;
        break;
      default:
        if (!this.moveRouteForcing) this.setMoveSpeed(WALK_SPEED);
        this.characterName = cs.walk;
        break;
    }
    if (this.bumping) this.setMoveSpeed(WALK_SPEED);
  }

  setCharsets(charsets) {
    this.charsets = { ...this.charsets, ...charsets };
    this.setMovementType(this.surfing ? 'surfing' : 'walking');
  }

  // ------------------------------------------------------------ pasabilidad
  passable(x, y, d) {
    const nx = x + dx(d);
    const ny = y + dy(d);
    if (!this.map.valid(nx, ny)) {
      if (this.through && this.world?.debugThrough) return false;
      return Boolean(this.world?.passableFromEdge?.(this, x, y, d));
    }
    if (this.world?.debugThrough) return true;
    return super.passable(x, y, d);
  }

  // ------------------------------------------------------------ movimiento
  moveGeneric(dir, turnEnabled = true) {
    if (turnEnabled) this.turnGeneric(dir);
    if (this.canMoveInDirection(dir)) {
      const fx = this.x + dx(dir);
      const fy = this.y + dy(dir);
      const facing = this.world?.terrainAt?.(this, fx, fy) || this.map.terrainTagAt(fx, fy);
      if (facing.ledge && !this.surfing) {
        if (this.jumpForward(2)) this.world?.playSE?.('Player jump');
        return true;
      }
      if (this.surfing && !canSurfFreely(facing) && !this.moveRouteForcing) {
        return this.endSurf(dir);
      }
      this.turnGeneric(dir);
      this.startStep(dir);
      return true;
    }
    if (!this.checkEventTriggerTouch(dir)) this.bumpIntoObject();
    return false;
  }

  startStep(dir) {
    if (!this.map.valid(this.x + dx(dir), this.y + dy(dir))) this.world?.crossEdge?.(this, dir);
    super.startStep(dir);
  }

  checkEventTriggerTouch(dir) {
    return Boolean(this.world?.checkPlayerTouch?.(dir));
  }

  bumpIntoObject() {
    if (!this.moveRouteForcing) this.world?.playSE?.('Player bump');
    this.moveInitialX = this.x;
    this.moveInitialY = this.y;
    this.moveTimer = 0;
    this.bumping = true;
  }

  /** Empieza a surfear saltando a la casilla de agua de enfrente. */
  startSurf() {
    const fx = this.x + dx(this.direction);
    const fy = this.y + dy(this.direction);
    this.surfing = true;
    this.setMovementType('surfing');
    this.through = true;
    const ok = this.jump(fx - this.x, fy - this.y);
    this.through = false;
    if (!ok) { this.surfing = false; this.setMovementType('walking'); }
    return ok;
  }

  /** Sale del agua saltando a tierra (pbEndSurf). */
  endSurf(dir) {
    this.surfing = false;
    this.through = true;
    const ok = this.jump(dx(dir), dy(dir));
    this.through = false;
    if (!ok) { this.surfing = true; return false; }
    this.setMovementType('walking');
    this.world?.onSurfEnd?.(this);
    return true;
  }

  onTurned() {
    this.world?.onPlayerTurned?.(this);
  }

  // ------------------------------------------------------------ actualización
  update(dt) {
    this.time += dt;
    this.lastTerrain = this.terrainTag();
    super.update(dt);
  }

  updateCommandNew() {
    const input = this.input;
    if (this.iceSliding && !this.moving()) {
      if (!this.moveGeneric(this.direction, false)) this.stopIce();
      return;
    }
    if (!input || !this.world?.inputEnabled?.()) return;
    const dir = input.dir4();
    if (dir <= 0) return;
    const subs = this.time - this.lastDirTime;
    if (this.movedLastFrame || (dir === this.lastDir && subs >= TURN_HOLD_SECONDS)) {
      this.moveGeneric(dir);
    } else if (dir !== this.lastDir) {
      this.turnGeneric(dir);
    }
    if (dir !== this.lastDir) this.lastDirTime = this.time;
    this.lastDir = dir;
  }

  stopIce() {
    this.iceSliding = false;
    this.walkAnime = true;
  }

  updateMove(dt) {
    if (!this.movedLastFrame || this.stoppedLastFrame) {
      if (this.iceSliding || this.lastTerrain?.ice) this.setMovementType('ice');
      else if (this.surfing) this.setMovementType('surfing');
      else this.setMovementType(this.canRun() ? 'running' : 'walking');
    }
    super.updateMove(dt);
  }

  updateStop(dt) {
    if (this.stoppedLastFrame) this.setMovementType(this.surfing ? 'surfing' : 'walking');
    super.updateStop(dt);
  }

  updatePattern() {
    if (this.surfing) {
      const bob = Math.floor((4 * this.time) / SURF_BOB_DURATION) % 4;
      if (!this.lockPattern) this.pattern = bob;
      this.bobHeight = bob >= 2 ? 2 : 0;
      this.animeCount = 0;
      return;
    }
    this.bobHeight = 0;
    super.updatePattern();
  }
}
