// Transporte del multijugador: WebSocket en el mismo puerto que el juego (ruta NET_PATH), sin compresión
// por mensaje y con TCP_NODELAY (ws lo activa) para la menor latencia. Límite de mensajes por cliente y
// latido para cerrar conexiones muertas. La lógica de salas está en server/rooms.mjs.
import { WebSocketServer } from 'ws';
import { NET_PATH, MAX_MESSAGE_BYTES, parseMessage } from '../game/src/net/protocol.js';
import { RoomHub } from './rooms.mjs';

const HEARTBEAT_MS = 15000;
const RATE_WINDOW_MS = 1000;
const RATE_MAX_MESSAGES = 90; // ~60 fps de pasos/giros de sobra; por encima se descartan

export function attachMultiplayer(httpServer, { log = console.log } = {}) {
  const hub = new RoomHub();
  const wss = new WebSocketServer({ noServer: true, perMessageDeflate: false, maxPayload: MAX_MESSAGE_BYTES });
  let nextId = 1;

  httpServer.on('upgrade', (req, socket, head) => {
    if (!req.url || req.url.split('?')[0] !== NET_PATH) {
      socket.destroy();
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
  });

  wss.on('connection', (ws) => {
    ws._socket?.setNoDelay?.(true);
    const client = {
      id: `p${nextId++}`,
      send(obj) { if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(obj)); },
    };
    let alive = true;
    let windowStart = Date.now();
    let count = 0;
    ws.on('pong', () => { alive = true; });
    ws.on('message', (data, isBinary) => {
      if (isBinary) return;
      const now = Date.now();
      if (now - windowStart > RATE_WINDOW_MS) { windowStart = now; count = 0; }
      if (++count > RATE_MAX_MESSAGES) return;
      const msg = parseMessage(data.toString());
      if (!msg) return;
      try {
        hub.handle(client, msg);
      } catch (err) {
        log(`[net] error con ${client.id}: ${err.message}`);
      }
    });
    ws.on('close', () => { clearInterval(beat); hub.leave(client); });
    ws.on('error', (err) => log(`[net] ${client.id}: ${err.message}`));
    const beat = setInterval(() => {
      if (!alive) { ws.terminate(); return; }
      alive = false;
      ws.ping();
    }, HEARTBEAT_MS);
  });

  return { hub, wss };
}
