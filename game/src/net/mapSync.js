// Puente entre la escena del mapa y la sala online: cada fotograma compara el jugador con lo último enviado y
// anuncia el paso EN EL MISMO FOTOGRAMA en que empieza (sin esperar a un tick de red), y aplica lo que llega de
// los demás a RemotePlayers. También dibuja los nombres sobre los avatares y el indicador de sala.
import { RemotePlayers } from './remotePlayers.js';
import { net } from './netClient.js';
import { drawText } from '../ui/core/text.js';

const NAME_COLOR = '#f8f8f8';
const NAME_SHADOW = '#303848';
const HUD_MARGIN = 4;
const NAME_LIFT = 4; // px por encima de la cabeza
const INVITE_MAX_AGE_MS = 25000; // el que invita espera 30 s: una invitación más vieja ya no vale
const MODES_ALLOWED = new Set(['pvp', 'coop']);

/** Estado del jugador tal como se anuncia a la sala. */
export function playerSnapshot(world) {
  const p = world.player;
  const kind = p.surfing ? 'surf' : p.characterName === p.charsets?.run && p.charsets.run !== p.charsets.walk ? 'run' : 'walk';
  return { m: world.current?.id || world.map?.id, x: p.x, y: p.y, d: p.direction, k: kind, s: p.moveSpeed, j: p.jumping(), busy: p.busy() };
}

export class MapNetSync {
  /**
   * opts.onInvite(invite): la escena lo ejecuta como guion cuando el jugador está libre (net/linkFlow.js#handleInvite).
   * invite = { from, s, mode, name, at }.
   */
  constructor(scene, { client = net, charsetsFor, onInvite = null, now = () => Date.now() } = {}) {
    this.scene = scene;
    this.onInvite = onInvite;
    this.now = now;
    this.invites = [];
    this.client = client;
    this.remote = new RemotePlayers(scene.world, { charsetsFor });
    this.last = null;
    this.offs = [
      client.on('welcome', (m) => { this.remote.clear(); for (const p of m.peers || []) this.remote.addPeer(p); this.last = null; }),
      client.on('join', (m) => this.remote.addPeer(m.peer)),
      client.on('peer', (m) => this.remote.addPeer(m.peer)),
      client.on('leave', (m) => this.remote.removePeer(m.id)),
      client.on('st', (m) => this.remote.applyStep(m.id, m)),
      client.on('at', (m) => this.remote.applyAt(m.id, m)),
      client.on('status', (s) => { if (s === 'off') { this.remote.clear(); this.invites = []; } }),
      client.on('dm', (m) => this.receiveDirect(m)),
    ];
    if (client.online) for (const p of client.peers.values()) this.remote.addPeer(p);
    scene.world.remote = this.remote;
  }

  dispose() {
    for (const off of this.offs) off();
    this.offs = [];
    if (this.scene.world.remote === this.remote) this.scene.world.remote = null;
  }

  receiveDirect(m) {
    if (m.b?.k !== 'invite' || !MODES_ALLOWED.has(m.b.mode) || typeof m.b.s !== 'string') return;
    const name = this.client.peers.get(m.from)?.name || 'Alguien';
    this.invites.push({ from: m.from, s: m.b.s, mode: m.b.mode, name, at: this.now() });
  }

  /** Atiende la invitación más antigua si el jugador está libre (sin guion, menú, combate ni paso a medias). */
  processInvites() {
    const scene = this.scene;
    if (!this.invites.length || !this.onInvite || !scene.ready || scene.world.scriptBusy() || scene.world.player.busy()) return;
    const invite = this.invites.shift();
    if (this.now() - invite.at > INVITE_MAX_AGE_MS || !this.client.peers.has(invite.from)) return;
    scene.runScript((ctx) => this.onInvite(ctx, invite), null, 'invitación online');
  }

  /** Llamar cada fotograma DESPUÉS de world.update (el paso ya ha empezado y la velocidad es la definitiva). */
  update(dt) {
    this.remote.update(dt);
    if (!this.client.online || !this.scene.world.map) return;
    const me = this.scene.state?.player;
    if (me?.name) this.client.updateProfile?.({ name: me.name, gender: me.gender });
    this.processInvites();
    const now = playerSnapshot(this.scene.world);
    const prev = this.last;
    const moved = !prev || now.m !== prev.m || now.x !== prev.x || now.y !== prev.y;
    if (moved && now.busy) {
      this.client.send({ t: 'st', m: now.m, x: now.x, y: now.y, d: now.d, s: now.s, k: now.k, j: now.j });
    } else if (moved || now.d !== prev.d || now.k !== prev.k || (prev.busy && !now.busy)) {
      this.client.send({ t: 'at', m: now.m, x: now.x, y: now.y, d: now.d, k: now.k });
    }
    this.last = now;
  }

  /** Nombres sobre los avatares y el indicador «Sala ABCD · n · ms» (coordenadas de pantalla). */
  drawUI(g) {
    if (this.client.status === 'off') return;
    const view = this.scene.worldView;
    const cam = this.scene.camera;
    for (const { ch } of this.remote.renderList()) {
      const head = view.headPosOf(ch);
      if (!head) continue;
      drawText(g, ch.name, Math.round(head.x - cam.renderX), Math.round(head.y - cam.renderY) - NAME_LIFT - 18, {
        font: 'small', color: NAME_COLOR, shadow: NAME_SHADOW, align: 'center',
      });
    }
    drawText(g, hudText(this.client), 512 - HUD_MARGIN, 384 - HUD_MARGIN - 18, {
      font: 'small', color: NAME_COLOR, shadow: NAME_SHADOW, align: 'right',
    });
  }
}

export function hudText(client) {
  if (client.status === 'connecting') return `Sala ${client.room || '…'} · conectando…`;
  const players = client.peers.size + 1;
  const ping = client.rtt === null ? '' : ` · ${Math.round(client.rtt)} ms`;
  return `Sala ${client.room} · ${players} ${players === 1 ? 'jugador' : 'jugadores'}${ping}`;
}
