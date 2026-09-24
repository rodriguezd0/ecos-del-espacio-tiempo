// Personaje del mundo (jugador, NPC, seguidor). Port de Game_Character (Essentials 21.1,
// 011_Game classes/007_Game_Character.rb): movimiento en rejilla con interpolación temporal,
// saltos, patrón de paso, rutas de movimiento, tipos de movimiento y profundidad de arbusto.
// Módulo puro: el "mundo" (World) proporciona mapa, jugador y callbacks.
import { dx, dy } from './gameMap.js';

export const TILE_PX = 32;
const SNAP = 0.5; // px (X_SUBPIXELS/2 subpíxeles de Essentials)

/** Tiempo (s) por casilla para una velocidad de Essentials (1..6, admite decimales como Añil). */
export function moveTimeFor(speed) {
  if (speed === 6) return 0.05;
  if (speed === 5) return 0.1;
  return 2 / 2 ** speed;
}

/** Retardo (s) entre acciones de movimiento autónomo según frecuencia 1..6. */
export function commandDelayFor(freq) {
  return ((40 - freq * 2) * (6 - freq)) / 40;
}

export function lerp(a, b, duration, delta) {
  if (duration <= 0) return b;
  if (delta <= 0) return a;
  if (delta >= duration) return b;
  return a + ((b - a) * delta) / duration;
}

const DIR_NAMES = { down: 2, left: 4, right: 6, up: 8 };
const MOVE_CMDS = new Set(['down', 'left', 'right', 'up', 'down_left', 'down_right', 'up_left', 'up_right',
  'random', 'toward_player', 'away_from_player', 'forward', 'backward']);
const TURN_CMDS = new Set(['turn_down', 'turn_left', 'turn_right', 'turn_up', 'turn_right_90', 'turn_left_90',
  'turn_180', 'turn_right_or_left_90', 'turn_random', 'turn_toward_player', 'turn_away_from_player']);

let nextId = 1;

export class Character {
  constructor(world, opts = {}) {
    this.world = world;
    this.uid = nextId++;
    this.id = opts.id ?? `c${this.uid}`;
    this.map = opts.map || world?.map || null;
    this.x = opts.x ?? 0;
    this.y = opts.y ?? 0;
    this.realX = this.x * TILE_PX;
    this.realY = this.y * TILE_PX;
    this.originalX = this.x;
    this.originalY = this.y;
    this.width = 1;
    this.height = 1;
    this.xOffset = 0;
    this.yOffset = 0;
    this.tileId = 0;
    this.characterName = opts.sprite || '';
    this.opacity = 255;
    this.direction = opts.dir || 2;
    this.originalDirection = this.direction;
    this.pattern = 0;
    this.originalPattern = 0;
    this.lockPattern = false;
    this.walkAnime = true;
    this.stepAnime = false;
    this.directionFix = false;
    this.through = false;
    this.alwaysOnTop = false;
    this.transparent = false;
    this.moveType = 'still';
    this.wanderRange = 0;
    this.moveRoute = null;
    this.moveRouteIndex = 0;
    this.moveRouteForcing = false;
    this.originalMoveRoute = null;
    this.originalMoveRouteIndex = 0;
    this.routeWaiters = [];
    this.setMoveSpeed(opts.speed ?? 3);
    this.setMoveFrequency(opts.freq ?? 3);
    this.setJumpSpeed(4);
    this.animeCount = 0;
    this.stopCount = 0;
    this.moveTimer = null;
    this.jumpTimer = null;
    this.jumpPeak = 0;
    this.jumpFraction = 0;
    this.bumping = false;
    this.waitCount = 0;
    this.movedThisFrame = false;
    this.movedLastFrame = false;
    this.stoppedThisFrame = false;
    this.stoppedLastFrame = false;
    this.locked = false;
    this.prelockDirection = 0;
    this.bushDepth = 0;
    this.bobHeight = 0;
    this.isPlayer = false;
  }

  // ------------------------------------------------------------ velocidades
  setMoveSpeed(v) { this.moveSpeed = v; this.moveTime = moveTimeFor(v); }
  setJumpSpeed(v) { this.jumpSpeed = v; this.jumpTime = moveTimeFor(v); }
  setMoveFrequency(v) { this.moveFrequency = v; this.commandDelay = commandDelayFor(v); }
  patternUpdateSpeed() {
    if (this.jumping()) return this.jumpTime * 2;
    return this.moveTime * 2 * (this.moveSpeed >= 5 ? 2 : 1);
  }

  get rng() { return this.world?.rng || Math.random; }
  rand(n) { return Math.floor(this.rng() * n); }

  // ------------------------------------------------------------ consultas
  at(x, y) { return x >= this.x && x < this.x + this.width && y > this.y - this.height && y <= this.y; }
  moving() { return this.moveTimer !== null; }
  jumping() { return this.jumpTimer !== null; }
  busy() { return this.moving() || this.jumping(); }
  facingTile(dir = this.direction) { return { x: this.x + dx(dir), y: this.y + dy(dir) }; }
  terrainTag() { return this.map.terrainTagAt(this.x, this.y, this.world?.bridge || 0); }

  /** Posición en píxeles del mapa (centro inferior del sprite). */
  screenX() { return this.realX + (this.width * TILE_PX) / 2 + this.xOffset; }
  screenYGround() { return this.realY + TILE_PX; }
  jumpOffset() {
    if (!this.jumping()) return 0;
    const p = Math.abs(this.jumpFraction - 0.5);
    return this.jumpPeak * (4 * p * p - 1);
  }
  screenY() { return this.screenYGround() + this.jumpOffset() + this.yOffset; }
  /** Profundidad de dibujo (equivalente a screen_z de RMXP, en píxeles de mapa). */
  screenZ(spriteHeight = 0) {
    if (this.alwaysOnTop) return 1e6;
    let z = this.screenYGround();
    if (this.tileId > 0) return z + this.map.priority(this.tileId) * TILE_PX;
    if (spriteHeight > TILE_PX) z += TILE_PX - 1;
    return z + (this.isPlayer ? 1 : 0);
  }

  // ------------------------------------------------------------ pasabilidad
  passable(x, y, d) {
    const nx = x + dx(d);
    const ny = y + dy(d);
    const map = this.map;
    if (!map.valid(nx, ny)) return false;
    if (this.through) return true;
    if (this.restrictTo && !this.restrictTo(nx, ny, this)) return false;
    const env = this.world?.env?.() || {};
    if (!map.passable(x, y, d, this, env)) return false;
    if (!map.passable(nx, ny, 10 - d, this, env)) return false;
    return this.noCharacterBlocks(nx, ny);
  }

  noCharacterBlocks(nx, ny) {
    for (const ev of this.map.events) {
      if (ev === this || ev.through || ev.erased || !ev.at(nx, ny)) continue;
      if (!this.isPlayer || ev.characterName || ev.solid) return false;
    }
    const player = this.world?.player;
    if (player && player !== this && player.map === this.map && player.x === nx && player.y === ny && !player.through && this.characterName) {
      return false;
    }
    return true;
  }

  canMoveFromCoordinate(sx, sy, dir) {
    switch (dir) {
      case 2: case 8: {
        const yd = dir === 8 ? this.height - 1 : 0;
        for (let i = sx; i < sx + this.width; i++) if (!this.passable(i, sy - yd, dir)) return false;
        return true;
      }
      case 4: case 6: {
        const xd = dir === 6 ? this.width - 1 : 0;
        for (let j = sy - this.height + 1; j <= sy; j++) if (!this.passable(sx + xd, j, dir)) return false;
        return true;
      }
      case 1: case 3: {
        for (let i = sx; i < sx + this.width; i++) if (!this.passable(i, sy, 2)) return false;
        const xd = dir === 3 ? this.width - 1 : 0;
        for (let j = sy - this.height + 1; j <= sy; j++) if (!this.passable(sx + xd, j + 1, dir + 3)) return false;
        return true;
      }
      case 7: case 9: {
        const xd = dir === 9 ? this.width - 1 : 0;
        for (let j = sy - this.height + 1; j <= sy; j++) if (!this.passable(sx + xd, j, dir - 3)) return false;
        const xo = dir === 9 ? 1 : -1;
        for (let i = sx; i < sx + this.width; i++) if (!this.passable(i + xo, sy - this.height + 1, 8)) return false;
        return true;
      }
      default: return false;
    }
  }

  canMoveInDirection(dir) { return this.canMoveFromCoordinate(this.x, this.y, dir); }

  // ------------------------------------------------------------ posición
  moveTo(x, y) {
    this.x = x;
    this.y = y;
    this.realX = x * TILE_PX;
    this.realY = y * TILE_PX;
    this.moveTimer = null;
    this.jumpTimer = null;
    this.jumpPeak = 0;
    this.jumpFraction = 0;
    this.prelockDirection = 0;
    this.calculateBushDepth();
  }

  /** Desplaza coordenadas (cambio de mapa conectado) manteniendo la interpolación. */
  shiftBy(ox, oy) {
    this.x += ox; this.y += oy;
    this.realX += ox * TILE_PX; this.realY += oy * TILE_PX;
    if (this.moveInitialX !== undefined) { this.moveInitialX += ox; this.moveInitialY += oy; }
    if (this.jumpInitialX !== undefined) { this.jumpInitialX += ox; this.jumpInitialY += oy; }
    this.originalX += ox; this.originalY += oy;
  }

  increaseSteps() { this.stopCount = 0; }

  calculateBushDepth() {
    if (this.tileId > 0 || this.alwaysOnTop || this.jumping() || !this.map) {
      this.bushDepth = 0;
      return;
    }
    const bridge = this.world?.bridge || 0;
    if (this.map.deepBush(this.x, this.y, bridge)) {
      const xb = this.x + (this.direction === 4 ? 1 : this.direction === 6 ? -1 : 0);
      const yb = this.y + (this.direction === 8 ? 1 : this.direction === 2 ? -1 : 0);
      if (this.moving()) {
        if (this.map.deepBush(xb, yb, bridge)) this.bushDepth = TILE_PX;
      } else {
        this.bushDepth = TILE_PX;
      }
    } else if (this.map.bush(this.x, this.y, bridge) && !this.moving()) {
      this.bushDepth = 12;
    } else {
      this.bushDepth = 0;
    }
  }

  // ------------------------------------------------------------ movimiento
  moveGeneric(dir, turnEnabled = true) {
    if (turnEnabled) this.turnGeneric(dir);
    if (this.canMoveInDirection(dir)) {
      this.turnGeneric(dir);
      this.startStep(dir);
      return true;
    }
    this.checkEventTriggerTouch(dir);
    return false;
  }

  startStep(dir) {
    this.moveInitialX = this.x;
    this.moveInitialY = this.y;
    this.x += dx(dir);
    this.y += dy(dir);
    this.moveTimer = 0;
    this.increaseSteps();
    this.world?.onStepStart?.(this, dir);
  }

  moveDiagonal(dir) {
    if (!this.directionFix) {
      const h = dir === 7 || dir === 1 ? 4 : 6;
      const v = dir === 7 || dir === 9 ? 8 : 2;
      if (this.direction === 10 - h) this.direction = h;
      else if (this.direction === 10 - v) this.direction = v;
    }
    if (!this.canMoveInDirection(dir)) return false;
    this.startStep(dir);
    return true;
  }

  checkEventTriggerTouch(_dir) {}

  moveRandom() { return this.moveGeneric([2, 4, 6, 8][this.rand(4)], false); }

  /** Movimiento aleatorio dentro de un rango alrededor de la posición original (move_random_range). */
  moveRandomRange(xr = -1, yr = -1) {
    const dirs = [];
    if (xr < 0) dirs.push(4, 6);
    else if (xr > 0) {
      if (this.x > this.originalX - xr) dirs.push(4);
      if (this.x < this.originalX + xr) dirs.push(6);
    }
    if (yr < 0) dirs.push(2, 8);
    else if (yr > 0) {
      if (this.y < this.originalY + yr) dirs.push(2);
      if (this.y > this.originalY - yr) dirs.push(8);
    }
    if (!dirs.length) return false;
    return this.moveGeneric(dirs[this.rand(dirs.length)], false);
  }

  relToPlayer() {
    const p = this.world?.player;
    if (!p) return null;
    return {
      sx: this.x + this.width / 2 - (p.x + p.width / 2),
      sy: this.y - this.height / 2 - (p.y - p.height / 2),
    };
  }

  moveTowardPlayer() {
    const r = this.relToPlayer();
    if (!r || (r.sx === 0 && r.sy === 0)) return;
    let ax = Math.abs(r.sx); let ay = Math.abs(r.sy);
    if (ax === ay) { if (this.rand(2) === 0) ax += 1; else ay += 1; }
    if (ax > ay) {
      this.moveGeneric(r.sx > 0 ? 4 : 6);
      if (!this.moving() && r.sy !== 0) this.moveGeneric(r.sy > 0 ? 8 : 2);
    } else {
      this.moveGeneric(r.sy > 0 ? 8 : 2);
      if (!this.moving() && r.sx !== 0) this.moveGeneric(r.sx > 0 ? 4 : 6);
    }
  }

  moveAwayFromPlayer() {
    const r = this.relToPlayer();
    if (!r || (r.sx === 0 && r.sy === 0)) return;
    let ax = Math.abs(r.sx); let ay = Math.abs(r.sy);
    if (ax === ay) { if (this.rand(2) === 0) ax += 1; else ay += 1; }
    if (ax > ay) {
      this.moveGeneric(r.sx > 0 ? 6 : 4);
      if (!this.moving() && r.sy !== 0) this.moveGeneric(r.sy > 0 ? 2 : 8);
    } else {
      this.moveGeneric(r.sy > 0 ? 2 : 8);
      if (!this.moving() && r.sx !== 0) this.moveGeneric(r.sx > 0 ? 6 : 4);
    }
  }

  moveForward() { return this.moveGeneric(this.direction, false); }
  moveBackward() {
    const fix = this.directionFix;
    this.directionFix = true;
    const r = this.moveGeneric(10 - this.direction, false);
    this.directionFix = fix;
    return r;
  }

  /** Salto relativo (xp, yp) en casillas. Devuelve true si saltó. */
  jump(xp, yp) {
    if (xp !== 0 || yp !== 0) {
      if (Math.abs(xp) > Math.abs(yp)) this.turnGeneric(xp < 0 ? 4 : 6);
      else this.turnGeneric(yp < 0 ? 8 : 2);
      for (let i = this.x; i < this.x + this.width; i++) {
        for (let j = this.y - this.height + 1; j <= this.y; j++) {
          if (!this.passable(i + xp, j + yp, 0)) return false;
        }
      }
    }
    this.jumpInitialX = this.x;
    this.jumpInitialY = this.y;
    this.x += xp;
    this.y += yp;
    this.jumpTimer = 0;
    const real = Math.sqrt(xp * xp + yp * yp);
    this.jumpPeak = (Math.max(1, real) * TILE_PX * 3) / 8;
    this.jumpFraction = 0;
    this.bushDepth = 0;
    this.increaseSteps();
    this.world?.onJumpStart?.(this, xp, yp);
    return true;
  }

  jumpForward(distance = 1) {
    const ox = this.x; const oy = this.y;
    this.jump(dx(this.direction) * distance, dy(this.direction) * distance);
    return this.x !== ox || this.y !== oy;
  }

  // ------------------------------------------------------------ giros
  turnGeneric(dir) {
    if (this.directionFix) return;
    const old = this.direction;
    this.direction = dir;
    this.stopCount = 0;
    if (dir !== old) this.onTurned();
  }
  onTurned() {}
  turnDown() { this.turnGeneric(2); }
  turnLeft() { this.turnGeneric(4); }
  turnRight() { this.turnGeneric(6); }
  turnUp() { this.turnGeneric(8); }
  turnRight90() { this.turnGeneric({ 2: 4, 4: 8, 6: 2, 8: 6 }[this.direction]); }
  turnLeft90() { this.turnGeneric({ 2: 6, 4: 2, 6: 8, 8: 4 }[this.direction]); }
  turn180() { this.turnGeneric(10 - this.direction); }
  turnRandom() { this.turnGeneric([8, 6, 4, 2][this.rand(4)]); }

  /** Gira hacia otra casilla/personaje (pbTurnTowardEvent). */
  turnToward(other) {
    const sx = this.x - other.x + (this.width - (other.width || 1)) / 2;
    const sy = this.y - other.y - (this.height - (other.height || 1)) / 2;
    if (sx === 0 && sy === 0) return;
    if (Math.abs(sx) > Math.abs(sy)) this.turnGeneric(sx > 0 ? 4 : 6);
    else this.turnGeneric(sy > 0 ? 8 : 2);
  }
  turnTowardPlayer() { if (this.world?.player) this.turnToward(this.world.player); }
  turnAwayFromPlayer() {
    const r = this.relToPlayer();
    if (!r || (r.sx === 0 && r.sy === 0)) return;
    if (Math.abs(r.sx) > Math.abs(r.sy)) this.turnGeneric(r.sx > 0 ? 6 : 4);
    else this.turnGeneric(r.sy > 0 ? 2 : 8);
  }

  straighten() {
    if (this.walkAnime || this.stepAnime) this.pattern = 0;
    this.animeCount = 0;
    this.prelockDirection = 0;
  }

  lock() {
    if (this.locked) return;
    this.prelockDirection = 0;
    this.turnTowardPlayer();
    this.locked = true;
  }
  unlock() {
    if (!this.locked) return;
    this.locked = false;
    if (!this.directionFix && this.prelockDirection) this.direction = this.prelockDirection;
  }

  // ------------------------------------------------------------ rutas
  /**
   * Fuerza una ruta de movimiento. `list` admite: 'up'|'down'|'left'|'right', 'forward', 'backward',
   * 'random', 'toward_player', 'away_from_player', 'turn_*', { jump:[x,y] }, { wait: frames60 },
   * { speed }, { freq }, 'through_on'|'through_off', 'walk_anime_on/off', 'step_anime_on/off',
   * 'direction_fix_on/off', 'always_on_top_on/off', { opacity }, { graphic, dir? }, { se }, { call: fn }.
   * Devuelve una promesa que se resuelve al terminar la ruta.
   */
  forceMoveRoute(list, opts = {}) {
    if (!this.originalMoveRoute) {
      this.originalMoveRoute = this.moveRoute;
      this.originalMoveRouteIndex = this.moveRouteIndex;
    }
    this.moveRoute = { list: normalizeRoute(list), repeat: Boolean(opts.repeat), skippable: opts.skippable ?? true };
    this.moveRouteIndex = 0;
    this.moveRouteForcing = true;
    this.prelockDirection = 0;
    this.waitCount = 0;
    const done = new Promise((resolve) => this.routeWaiters.push(resolve));
    this.moveTypeCustom();
    return done;
  }

  finishForcedRoute() {
    this.moveRouteForcing = false;
    this.moveRoute = this.originalMoveRoute;
    this.moveRouteIndex = this.originalMoveRouteIndex;
    this.originalMoveRoute = null;
    const waiters = this.routeWaiters.splice(0);
    for (const w of waiters) w();
  }

  moveTypeCustom() {
    if (this.busy()) return;
    const route = this.moveRoute;
    if (!route || !route.list.length) {
      if (this.moveRouteForcing) this.finishForcedRoute();
      return;
    }
    for (let guard = 0; guard <= route.list.length; guard++) {
      if (this.moveRouteIndex >= route.list.length) {
        if (route.repeat) {
          this.moveRouteIndex = 0;
        } else {
          if (this.moveRouteForcing) this.finishForcedRoute();
          this.stopCount = 0;
          return;
        }
      }
      const cmd = route.list[this.moveRouteIndex];
      const name = typeof cmd === 'string' ? cmd : null;
      if ((name && MOVE_CMDS.has(name)) || (cmd && cmd.jump)) {
        this.runMoveCommand(cmd);
        if (route.skippable || this.busy()) this.moveRouteIndex += 1;
        return;
      }
      if ((name && TURN_CMDS.has(name)) || (cmd && cmd.wait !== undefined)) {
        if (cmd.wait !== undefined) this.waitCount = cmd.wait / 60;
        else this.runTurnCommand(name);
        this.moveRouteIndex += 1;
        return;
      }
      this.runSettingCommand(cmd);
      this.moveRouteIndex += 1;
    }
  }

  runMoveCommand(cmd) {
    if (cmd.jump) { this.jump(cmd.jump[0], cmd.jump[1]); return; }
    switch (cmd) {
      case 'down': case 'left': case 'right': case 'up': this.moveGeneric(DIR_NAMES[cmd]); break;
      case 'down_left': this.moveDiagonal(1); break;
      case 'down_right': this.moveDiagonal(3); break;
      case 'up_left': this.moveDiagonal(7); break;
      case 'up_right': this.moveDiagonal(9); break;
      case 'random': this.moveRandom(); break;
      case 'toward_player': this.moveTowardPlayer(); break;
      case 'away_from_player': this.moveAwayFromPlayer(); break;
      case 'forward': this.moveForward(); break;
      case 'backward': this.moveBackward(); break;
      default: break;
    }
  }

  runTurnCommand(name) {
    const map = {
      turn_down: () => this.turnDown(), turn_left: () => this.turnLeft(), turn_right: () => this.turnRight(),
      turn_up: () => this.turnUp(), turn_right_90: () => this.turnRight90(), turn_left_90: () => this.turnLeft90(),
      turn_180: () => this.turn180(), turn_right_or_left_90: () => (this.rand(2) ? this.turnRight90() : this.turnLeft90()),
      turn_random: () => this.turnRandom(), turn_toward_player: () => this.turnTowardPlayer(),
      turn_away_from_player: () => this.turnAwayFromPlayer(),
    };
    map[name]?.();
  }

  runSettingCommand(cmd) {
    if (typeof cmd === 'string') {
      const flags = {
        through_on: ['through', true], through_off: ['through', false],
        walk_anime_on: ['walkAnime', true], walk_anime_off: ['walkAnime', false],
        step_anime_on: ['stepAnime', true], step_anime_off: ['stepAnime', false],
        direction_fix_on: ['directionFix', true], direction_fix_off: ['directionFix', false],
        always_on_top_on: ['alwaysOnTop', true], always_on_top_off: ['alwaysOnTop', false],
      }[cmd];
      if (flags) this[flags[0]] = flags[1];
      else console.warn(`Ruta: comando desconocido "${cmd}"`);
      return;
    }
    if (!cmd || typeof cmd !== 'object') return;
    if (cmd.speed !== undefined) this.setMoveSpeed(cmd.speed);
    if (cmd.freq !== undefined) this.setMoveFrequency(cmd.freq);
    if (cmd.opacity !== undefined) this.opacity = cmd.opacity;
    if (cmd.graphic !== undefined) {
      this.characterName = cmd.graphic;
      if (cmd.dir) this.direction = cmd.dir;
    }
    if (cmd.se) this.world?.playSE?.(cmd.se);
    if (cmd.call) cmd.call(this);
  }

  // ------------------------------------------------------------ actualización
  update(dt) {
    this.movedLastFrame = this.movedThisFrame;
    this.stoppedLastFrame = this.stoppedThisFrame;
    this.movedThisFrame = false;
    this.stoppedThisFrame = false;
    this.updateCommand(dt);
    if (this.busy()) this.updateMove(dt);
    else this.updateStop(dt);
    this.updatePattern();
  }

  updateCommand(dt) {
    if (this.waitCount > 0) {
      this.waitCount -= dt;
      if (this.waitCount > 0) return;
      this.waitCount = 0;
    }
    if (this.moveRouteForcing) this.moveTypeCustom();
    else if (!this.starting && !this.locked && !this.busy()) this.updateCommandNew();
  }

  updateCommandNew() {
    if (this.moveType === 'face') {
      // Mira al jugador cuando está cerca (tipo "mirar al jugador")
      const r = this.relToPlayer();
      if (r && Math.abs(r.sx) + Math.abs(r.sy) <= 6) {
        const old = this.direction;
        this.turnTowardPlayer();
        if (this.direction === old) this.stopCount = 0;
      }
      return;
    }
    if (this.stopCount < this.commandDelay) return;
    switch (this.moveType) {
      case 'random': {
        const r = this.rand(6);
        if (r <= 3) this.moveRandom();
        else if (r === 4) this.moveForward();
        else this.stopCount = 0;
        break;
      }
      case 'wander': {
        // Como move_random_range_with_corner de Añil: moverse, girar o quedarse (1/3 cada uno)
        const r = this.rand(3);
        if (r === 0) { if (!this.moveRandomRange(this.wanderRange, this.wanderRange)) this.stopCount = 0; } else if (r === 1) this.turnRandom();
        else this.stopCount = 0;
        break;
      }
      case 'toward': {
        const rel = this.relToPlayer();
        if (rel && Math.abs(rel.sx) + Math.abs(rel.sy) >= 20) { this.moveRandom(); break; }
        const r = this.rand(6);
        if (r <= 3) this.moveTowardPlayer();
        else if (r === 4) this.moveRandom();
        else this.moveForward();
        break;
      }
      case 'look': // mira alrededor sin moverse
        this.turnRandom();
        break;
      case 'custom':
        this.moveTypeCustom();
        break;
      default:
        break;
    }
  }

  updateMove(dt) {
    if (this.moveTimer !== null) {
      this.moveTimer += dt;
      if (this.x !== this.moveInitialX) {
        const dist = Math.abs(this.moveInitialX - this.x);
        this.realX = lerp(this.moveInitialX, this.x, this.moveTime * dist, this.moveTimer) * TILE_PX;
      }
      if (this.y !== this.moveInitialY) {
        const dist = Math.abs(this.moveInitialY - this.y);
        this.realY = lerp(this.moveInitialY, this.y, this.moveTime * dist, this.moveTimer) * TILE_PX;
      }
    } else if (this.jumpTimer !== null) {
      this.jumpTimer += dt;
      const dist = Math.max(Math.abs(this.x - this.jumpInitialX), Math.abs(this.y - this.jumpInitialY)) || 1;
      if (this.x !== this.jumpInitialX) this.realX = lerp(this.jumpInitialX, this.x, this.jumpTime * dist, this.jumpTimer) * TILE_PX;
      if (this.y !== this.jumpInitialY) this.realY = lerp(this.jumpInitialY, this.y, this.jumpTime * dist, this.jumpTimer) * TILE_PX;
      this.jumpFraction = this.jumpTimer / (this.jumpTime * dist);
    }
    if (Math.abs(this.realX - this.x * TILE_PX) < SNAP) this.realX = this.x * TILE_PX;
    if (Math.abs(this.realY - this.y * TILE_PX) < SNAP) this.realY = this.y * TILE_PX;
    if (this.moving() && this.moveTimer >= this.moveTime && this.realX === this.x * TILE_PX && this.realY === this.y * TILE_PX) {
      this.moveTimer = null;
      this.bumping = false;
    }
    let landed = false;
    if (this.jumping() && this.jumpFraction >= 1) {
      this.jumpTimer = null;
      this.jumpPeak = 0;
      this.jumpFraction = 0;
      this.realX = this.x * TILE_PX;
      this.realY = this.y * TILE_PX;
      landed = true;
    }
    if (!this.busy()) {
      this.calculateBushDepth();
      this.stoppedThisFrame = true;
      this.world?.onStepTaken?.(this, landed);
    } else if (!this.movedLastFrame || this.stoppedLastFrame) {
      this.calculateBushDepth();
    }
    if (this.walkAnime || this.stepAnime) this.animeCount += dt;
    this.movedThisFrame = true;
  }

  updateStop(dt) {
    if (this.stepAnime) this.animeCount += dt;
    if (!this.starting && !this.locked) this.stopCount += dt;
  }

  updatePattern() {
    if (this.lockPattern) return;
    if (this.movedLastFrame && !this.movedThisFrame && !this.stepAnime) {
      this.pattern = this.originalPattern;
      this.animeCount = 0;
      return;
    }
    if (!this.movedLastFrame && this.movedThisFrame && !this.stepAnime) {
      if (this.walkAnime) this.pattern = (this.pattern + 1) % 4;
      this.animeCount = 0;
      return;
    }
    const patternTime = this.patternUpdateSpeed() / 4;
    if (this.animeCount < patternTime) return;
    this.pattern = (this.pattern + 1) % 4;
    this.animeCount -= patternTime;
  }
}

/** Normaliza nombres de comandos de ruta (admite sinónimos en español). */
export function normalizeRoute(list) {
  const alias = { arriba: 'up', abajo: 'down', izquierda: 'left', derecha: 'right', adelante: 'forward', atras: 'backward' };
  return (list || []).map((c) => (typeof c === 'string' ? (alias[c] || c) : c));
}
