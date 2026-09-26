// Cliente del multijugador: una conexión WebSocket al mismo servidor del juego (NET_PATH), viva entre escenas.
// Mide la latencia (ping cada PING_MS), se reconecta sola a la misma sala si se corta y reparte los mensajes
// a quien se suscriba con on(tipo, fn). Estado: 'off' | 'connecting' | 'online'.
import { NET_PATH, PROTOCOL_VERSION, parseMessage } from './protocol.js';

const PING_MS = 2000;
const CONNECT_TIMEOUT_MS = 8000;
const RECONNECT_DELAYS_MS = [1000, 2000, 4000, 8000];
const RTT_SMOOTHING = 0.3;

export class NetClient {
  constructor({ WebSocketImpl = globalThis.WebSocket, url = defaultUrl(), now = () => performance.now() } = {}) {
    this.WebSocketImpl = WebSocketImpl;
    this.url = url;
    this.now = now;
    this.ws = null;
    this.status = 'off';
    this.id = null;
    this.room = null;
    this.profile = null;
    this.peers = new Map(); // id → { id, name, gender, av }
    this.rtt = null; // ms (suavizado)
    this.listeners = new Map();
    this.pingTimer = null;
    this.reconnectAttempt = 0;
    this.reconnectTimer = null;
  }

  get online() { return this.status === 'online'; }

  on(type, fn) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(fn);
    return () => this.listeners.get(type)?.delete(fn);
  }

  emit(type, payload) {
    for (const fn of this.listeners.get(type) || []) {
      try {
        fn(payload);
      } catch (err) {
        console.error(`[net] oyente de "${type}"`, err);
      }
    }
  }

  /**
   * Entra en una sala (room: código) o crea una nueva (room: ''). profile: { name, gender }.
   * Resuelve con el código de la sala; rechaza con Error(mensaje para el jugador).
   */
  join(room, profile) {
    this.leave();
    this.profile = { ...profile };
    this.room = room || '';
    return this.open();
  }

  /** Sale de la sala y cierra la conexión (sin reconectar). */
  leave() {
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    this.reconnectAttempt = 0;
    this.profile = null;
    this.closeSocket();
    this.setStatus('off');
    this.peers.clear();
    this.room = null;
    this.id = null;
    this.rtt = null;
  }

  /** Cambia el nombre/aspecto con el que te ven los demás (se conserva para las reconexiones). */
  updateProfile(profile) {
    if (!this.profile) return;
    const next = { name: profile.name, gender: profile.gender };
    if (next.name === this.profile.name && next.gender === this.profile.gender) return;
    this.profile = next;
    this.send({ t: 'me', ...next });
  }

  send(obj) {
    if (this.ws && this.ws.readyState === 1 && this.status === 'online') this.ws.send(JSON.stringify(obj));
  }

  // ------------------------------------------------------------ conexión
  open() {
    if (!this.WebSocketImpl) return Promise.reject(new Error('Este navegador no admite conexiones online.'));
    this.setStatus('connecting');
    return new Promise((resolve, reject) => {
      let settled = false;
      const settle = (fn, value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        offWelcome();
        offError();
        fn(value);
      };
      const timeout = setTimeout(() => {
        settle(reject, new Error('El servidor no responde.'));
        this.leave();
      }, CONNECT_TIMEOUT_MS);
      const offWelcome = this.on('welcome', (m) => settle(resolve, m.room));
      const offError = this.on('error', (m) => {
        settle(reject, new Error(m.msg || 'No se pudo entrar en la sala.'));
        this.leave();
      });
      let ws;
      try {
        ws = new this.WebSocketImpl(this.url);
      } catch (err) {
        settle(reject, new Error(`No se pudo conectar: ${err.message}`));
        this.setStatus('off');
        return;
      }
      this.ws = ws;
      ws.onopen = () => {
        ws.send(JSON.stringify({ t: 'hello', v: PROTOCOL_VERSION, room: this.room, ...this.profile }));
      };
      ws.onmessage = (ev) => this.receive(ev.data);
      ws.onclose = () => {
        if (this.ws !== ws) return;
        this.ws = null;
        this.stopPing();
        if (!settled) settle(reject, new Error('No se pudo conectar con el servidor.'));
        this.handleDrop();
      };
    });
  }

  receive(data) {
    const msg = parseMessage(typeof data === 'string' ? data : '');
    if (!msg) return;
    switch (msg.t) {
      case 'welcome':
        this.id = msg.id;
        this.room = msg.room;
        this.reconnectAttempt = 0;
        this.peers = new Map((msg.peers || []).map((p) => [p.id, p]));
        this.setStatus('online');
        this.startPing();
        break;
      case 'join':
        if (msg.peer?.id) this.peers.set(msg.peer.id, msg.peer);
        break;
      case 'peer':
        if (msg.peer?.id && this.peers.has(msg.peer.id)) this.peers.set(msg.peer.id, { ...this.peers.get(msg.peer.id), ...msg.peer });
        break;
      case 'leave':
        this.peers.delete(msg.id);
        break;
      case 'st': case 'at': {
        const peer = this.peers.get(msg.id);
        if (peer) peer.av = { m: msg.m, x: msg.x, y: msg.y, d: msg.d, k: msg.k };
        break;
      }
      case 'pong': {
        const sample = this.now() - Number(msg.c);
        if (Number.isFinite(sample) && sample >= 0) this.rtt = this.rtt === null ? sample : this.rtt + (sample - this.rtt) * RTT_SMOOTHING;
        break;
      }
      default: break;
    }
    this.emit(msg.t, msg);
  }

  /** Conexión perdida sin haber salido: se reintenta entrar en la misma sala. */
  handleDrop() {
    if (!this.profile || !this.room) { this.setStatus('off'); return; }
    const delay = RECONNECT_DELAYS_MS[this.reconnectAttempt];
    if (delay === undefined) {
      const lost = this.room;
      this.leave();
      this.emit('lost', { room: lost });
      return;
    }
    this.reconnectAttempt += 1;
    this.setStatus('connecting');
    this.emit('reconnecting', { attempt: this.reconnectAttempt });
    this.reconnectTimer = setTimeout(() => {
      this.open().catch(() => {});
    }, delay);
  }

  closeSocket() {
    this.stopPing();
    const ws = this.ws;
    this.ws = null;
    if (ws) {
      ws.onopen = null;
      ws.onmessage = null;
      ws.onclose = null;
      try { ws.close(); } catch { /* ya cerrado */ }
    }
  }

  startPing() {
    this.stopPing();
    const ping = () => this.send({ t: 'ping', c: this.now() });
    ping();
    this.pingTimer = setInterval(ping, PING_MS);
  }

  stopPing() {
    clearInterval(this.pingTimer);
    this.pingTimer = null;
  }

  setStatus(status) {
    if (this.status === status) return;
    this.status = status;
    this.emit('status', status);
  }
}

function defaultUrl() {
  if (typeof location === 'undefined') return `ws://localhost${NET_PATH}`;
  return `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}${NET_PATH}`;
}

/** Conexión única del juego (sobrevive a los cambios de escena). */
export const net = new NetClient();
