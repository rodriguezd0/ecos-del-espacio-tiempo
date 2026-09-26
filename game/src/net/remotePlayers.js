// Otros jugadores de la sala en el mundo (lógica pura, sin Three.js). Cada uno es un Character «fantasma»
// (atraviesa todo, no bloquea ni dispara eventos) que reproduce los pasos que anuncia su dueño: el paso
// empieza aquí en cuanto llega el mensaje, con la misma velocidad, así que se ve fluido con solo la latencia
// de la red. Si se acumulan pasos (red a tirones) acelera; si se desfasa mucho, salta a la posición.
import { Character, TILE_PX } from '../world/character.js';

const MAX_QUEUE = 6; // pasos pendientes antes de saltar directamente al último
const CATCH_UP_QUEUE = 2; // con más pasos pendientes, avanza más rápido para alcanzar
const CATCH_UP_SPEED_BONUS = 1;

export class RemoteAvatar extends Character {
  constructor(world, peer) {
    super(world, { id: `net_${peer.id}` });
    this.peerId = peer.id;
    this.name = peer.name;
    this.gender = peer.gender;
    this.through = true;
    this.isRemote = true;
    this.mapId = null;
    this.kind = 'walk';
    this.charsets = null;
    this.queue = [];
    this.placed = false;
  }

  setCharsets(charsets) {
    this.charsets = charsets;
    this.applyKind(this.kind);
  }

  applyKind(kind) {
    this.kind = kind;
    const cs = this.charsets;
    if (!cs) return;
    this.characterName = (kind === 'surf' && cs.surf) || (kind === 'run' && cs.run) || cs.walk;
  }

  // Un fantasma no interactúa con el mundo (hierba, eventos, encuentros): solo se dibuja.
  checkEventTriggerTouch() { return false; }
}

export class RemotePlayers {
  /**
   * @param {World} world
   * @param {{ charsetsFor?: (gender) => Promise<object> }} opts
   */
  constructor(world, { charsetsFor = null } = {}) {
    this.world = world;
    this.charsetsFor = charsetsFor;
    this.avatars = new Map(); // peerId → RemoteAvatar
  }

  get list() { return [...this.avatars.values()]; }

  /** Alta (o actualización de datos) de un jugador de la sala. */
  addPeer(peer) {
    let avatar = this.avatars.get(peer.id);
    if (!avatar) {
      avatar = new RemoteAvatar(this.world, peer);
      this.avatars.set(peer.id, avatar);
      this.charsetsFor?.(avatar.gender).then((cs) => avatar.setCharsets(cs)).catch((err) => console.warn('[net] charsets', err));
    }
    avatar.name = peer.name;
    if (peer.gender && peer.gender !== avatar.gender) {
      avatar.gender = peer.gender;
      this.charsetsFor?.(avatar.gender).then((cs) => avatar.setCharsets(cs)).catch((err) => console.warn('[net] charsets', err));
    }
    if (peer.av) this.place(avatar, peer.av);
    return avatar;
  }

  removePeer(id) {
    this.avatars.delete(id);
  }

  clear() {
    this.avatars.clear();
  }

  /** Posición en reposo: se coloca (o termina el paso en curso y luego se coloca). */
  applyAt(id, av) {
    const avatar = this.avatars.get(id);
    if (!avatar) return;
    if (!avatar.placed || av.m !== avatar.mapId) { this.place(avatar, av); return; }
    avatar.queue.push({ ...av, rest: true });
    this.trimQueue(avatar);
  }

  /** Empieza un paso (o salto) hacia (x, y). */
  applyStep(id, st) {
    const avatar = this.avatars.get(id);
    if (!avatar) return;
    if (!avatar.placed) { this.place(avatar, st); return; }
    avatar.queue.push(st);
    this.trimQueue(avatar);
  }

  trimQueue(avatar) {
    if (avatar.queue.length <= MAX_QUEUE) return;
    const last = avatar.queue[avatar.queue.length - 1];
    avatar.queue = [];
    this.place(avatar, last);
  }

  place(avatar, av) {
    avatar.queue = [];
    avatar.mapId = av.m;
    avatar.map = this.entryOf(av.m)?.map || avatar.map || this.world.map;
    avatar.moveTo(av.x, av.y);
    avatar.direction = av.d;
    avatar.applyKind(av.k || 'walk');
    avatar.straighten();
    avatar.placed = true;
  }

  entryOf(mapId) {
    return this.world.allEntries.find((e) => e.id === mapId) || null;
  }

  /** Avanza la cola de pasos y la animación de cada avatar. */
  update(dt) {
    for (const avatar of this.avatars.values()) {
      if (!avatar.placed) continue;
      if (!avatar.busy() && avatar.queue.length) this.startNext(avatar);
      avatar.update(dt);
    }
  }

  startNext(avatar) {
    const next = avatar.queue.shift();
    if (next.m !== avatar.mapId && !this.crossInto(avatar, next.m)) { this.place(avatar, next); return; }
    const ddx = next.x - avatar.x;
    const ddy = next.y - avatar.y;
    const dist = Math.abs(ddx) + Math.abs(ddy);
    avatar.applyKind(next.k || 'walk');
    if (next.rest || dist === 0) {
      if (dist !== 0) avatar.moveTo(next.x, next.y);
      avatar.direction = next.d;
      return;
    }
    const catchUp = avatar.queue.length >= CATCH_UP_QUEUE ? CATCH_UP_SPEED_BONUS : 0;
    if (next.j && dist <= 4) {
      avatar.setJumpSpeed(4 + catchUp);
      if (!avatar.jump(ddx, ddy)) { this.place(avatar, next); return; }
      avatar.direction = next.d;
      return;
    }
    if (dist !== 1) { this.place(avatar, next); return; }
    avatar.setMoveSpeed((next.s || 3.5) + catchUp);
    avatar.direction = next.d;
    avatar.startStep(ddx > 0 ? 6 : ddx < 0 ? 4 : ddy > 0 ? 2 : 8);
  }

  /**
   * El jugador remoto pasa a un mapa conectado: si ambos mapas están cargados aquí, su posición se traduce a
   * las coordenadas del mapa nuevo para que el paso por la costura sea continuo.
   */
  crossInto(avatar, mapId) {
    const from = this.entryOf(avatar.mapId);
    const to = this.entryOf(mapId);
    if (!from || !to) return false;
    const ox = from.offset.x - to.offset.x;
    const oy = from.offset.y - to.offset.y;
    avatar.moveTo(avatar.x + ox, avatar.y + oy);
    avatar.mapId = mapId;
    avatar.map = to.map;
    return true;
  }

  /** Avatares visibles con su desplazamiento en píxeles (mapa actual o vecino cargado). */
  renderList() {
    const out = [];
    for (const avatar of this.avatars.values()) {
      const entry = avatar.placed && avatar.characterName ? this.entryOf(avatar.mapId) : null;
      if (!entry) continue;
      if (avatar.map !== entry.map) { avatar.map = entry.map; avatar.calculateBushDepth(); }
      out.push({ ch: avatar, ox: entry.offset.x * TILE_PX, oy: entry.offset.y * TILE_PX });
    }
    return out;
  }
}
