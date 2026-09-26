// Servidor de desarrollo de Pokémon: Ecos del Espacio-Tiempo.
// Sirve game/ y los recursos de Añil (/anil/), avisa por SSE de cambios de archivos para que el
// cliente muestre "Actualización disponible" sin recargar a la fuerza, y está preparado para jugar
// desde fuera de la red local: escucha en todas las interfaces, comprime texto con gzip y usa caché
// (larga para /anil/, que no cambia; revalidación por ETag para el juego, que sí cambia).
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { attachMultiplayer } from './server/multiplayer.mjs';
import { handleSaves, SAVES_PREFIX } from './server/saves.mjs';

const PROJECT = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(PROJECT, 'game');
// Recursos originales de Añil servidos sin copiar (sprites, audio, UI...).
const ANIL_ROOT = path.join(PROJECT, 'Pokemon Anil V4.13');
const ANIL_PREFIX = '/anil/';
const SAVES_DIR = process.env.SAVES_DIR || path.join(PROJECT, 'saves'); // fuera de game/: no dispara el aviso de cambios
const PORT = Number(process.env.PORT || 8080);
const HOST = process.env.HOST || '::'; // todas las interfaces (IPv6 + IPv4)
const ANIL_MAX_AGE = 7 * 24 * 3600; // s: los recursos de Añil no cambian

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.mid': 'audio/midi',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
};
const COMPRESSIBLE = new Set(['.html', '.js', '.mjs', '.json', '.css', '.svg', '.txt', '.md', '.wav', '.mid', '.ttf']);

// ---------------------------------------------------------------- aviso de cambios (SSE)
const clients = new Set();
let buildStamp = Date.now();

function notifyChange(file) {
  buildStamp = Date.now();
  const payload = `data: ${JSON.stringify({ stamp: buildStamp, file })}\n\n`;
  for (const res of clients) res.write(payload);
}

let debounce = null;
fs.watch(ROOT, { recursive: true }, (_evt, file) => {
  if (!file || file.includes('saves')) return;
  gzCache.clear();
  clearTimeout(debounce);
  debounce = setTimeout(() => notifyChange(String(file).replace(/\\/g, '/')), 400);
});

// Mantiene vivas las conexiones SSE a través de routers y proxies.
setInterval(() => {
  for (const res of clients) res.write(': ping\n\n');
}, 25000).unref();

// ---------------------------------------------------------------- archivos
function safeResolve(urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath.split('?')[0]);
  } catch {
    return null;
  }
  const isAnil = decoded.startsWith(ANIL_PREFIX);
  const base = isAnil ? ANIL_ROOT : ROOT;
  const rel = isAnil ? decoded.slice(ANIL_PREFIX.length) : decoded;
  const resolved = path.normalize(path.join(base, rel));
  if (!resolved.startsWith(base)) return null;
  return { file: resolved, isAnil };
}

// Caché en memoria de respuestas comprimidas (se vacía al cambiar cualquier archivo del juego).
const gzCache = new Map();
const GZ_CACHE_MAX = 400;

function gzipped(file, stat, data) {
  const key = `${file}:${stat.mtimeMs}:${stat.size}`;
  let buf = gzCache.get(key);
  if (!buf) {
    buf = zlib.gzipSync(data, { level: 6 });
    if (gzCache.size >= GZ_CACHE_MAX) gzCache.delete(gzCache.keys().next().value);
    gzCache.set(key, buf);
  }
  return buf;
}

function send(req, res, target) {
  fs.stat(target.file, (err, st) => {
    let file = target.file;
    if (!err && st.isDirectory()) file = path.join(file, 'index.html');
    fs.stat(file, (statErr, stat) => {
      if (statErr || !stat.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end(`No encontrado: ${req.url}`);
        return;
      }
      const ext = path.extname(file).toLowerCase();
      const etag = `W/"${stat.size.toString(36)}-${Math.floor(stat.mtimeMs).toString(36)}"`;
      const headers = {
        'Content-Type': MIME[ext] || 'application/octet-stream',
        ETag: etag,
        'Cache-Control': target.isAnil ? `public, max-age=${ANIL_MAX_AGE}` : 'no-cache',
        Vary: 'Accept-Encoding',
      };
      if (req.headers['if-none-match'] === etag) {
        res.writeHead(304, headers).end();
        return;
      }
      fs.readFile(file, (readErr, data) => {
        if (readErr) {
          res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Error al leer el archivo');
          return;
        }
        const acceptsGzip = /\bgzip\b/.test(req.headers['accept-encoding'] || '');
        if (acceptsGzip && COMPRESSIBLE.has(ext) && data.length > 1024) {
          const body = gzipped(file, stat, data);
          res.writeHead(200, { ...headers, 'Content-Encoding': 'gzip', 'Content-Length': body.length });
          res.end(req.method === 'HEAD' ? undefined : body);
          return;
        }
        res.writeHead(200, { ...headers, 'Content-Length': data.length });
        res.end(req.method === 'HEAD' ? undefined : data);
      });
    });
  });
}

const server = http.createServer((req, res) => {
  // Partidas en el disco del servidor (server/saves.mjs): carpeta saves/ del proyecto.
  if (req.url.startsWith(SAVES_PREFIX)) {
    handleSaves(req, res, SAVES_DIR).catch((err) => {
      console.error('[partidas]', err);
      if (!res.headersSent) res.writeHead(500).end();
    });
    return;
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }
  if (req.url === '/__events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.write(`data: ${JSON.stringify({ stamp: buildStamp, hello: true })}\n\n`);
    clients.add(res);
    req.on('close', () => clients.delete(res));
    return;
  }
  const target = safeResolve(req.url === '/' ? '/index.html' : req.url);
  if (!target) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Prohibido');
    return;
  }
  send(req, res, target);
});

// Multijugador: salas online por WebSocket en el mismo puerto (server/multiplayer.mjs).
attachMultiplayer(server);

server.on('error', (err) => {
  console.error(`No se pudo iniciar el servidor en el puerto ${PORT}: ${err.message}`);
  process.exitCode = 1;
});

server.listen(PORT, HOST, () => {
  const lan = Object.values(os.networkInterfaces()).flat()
    .filter((i) => i && i.family === 'IPv4' && !i.internal)
    .map((i) => `http://${i.address}:${PORT}/`);
  console.log(`Ecos del Espacio-Tiempo → http://localhost:${PORT}/`);
  for (const url of lan) console.log(`  en la red local → ${url}`);
  console.log('  desde fuera → http://<tu IP pública>:' + PORT + '/ (con el puerto reenviado en el router)');
});
