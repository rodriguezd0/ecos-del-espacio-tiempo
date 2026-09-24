// Servidor de desarrollo de Pokémon: Ecos del Espacio-Tiempo.
// Sirve game/ sin caché y avisa (SSE) de cambios de archivos para que el
// cliente muestre "Actualización disponible" sin recargar a la fuerza.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PROJECT = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(PROJECT, 'game');
// Recursos originales de Añil servidos sin copiar (sprites, audio, UI...).
const ANIL_ROOT = path.join(PROJECT, 'Pokemon Anil V4.13');
const ANIL_PREFIX = '/anil/';
const PORT = Number(process.env.PORT || 8080);

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
};

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
  clearTimeout(debounce);
  debounce = setTimeout(() => notifyChange(String(file).replace(/\\/g, '/')), 400);
});

function safeResolve(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const base = decoded.startsWith(ANIL_PREFIX) ? ANIL_ROOT : ROOT;
  const rel = decoded.startsWith(ANIL_PREFIX) ? decoded.slice(ANIL_PREFIX.length) : decoded;
  const resolved = path.normalize(path.join(base, rel));
  if (!resolved.startsWith(base)) return null;
  return resolved;
}

const server = http.createServer((req, res) => {
  if (req.url === '/__events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.write(`data: ${JSON.stringify({ stamp: buildStamp, hello: true })}\n\n`);
    clients.add(res);
    req.on('close', () => clients.delete(res));
    return;
  }
  let file = safeResolve(req.url === '/' ? '/index.html' : req.url);
  if (!file) {
    res.writeHead(403).end('Forbidden');
    return;
  }
  fs.stat(file, (err, st) => {
    if (!err && st.isDirectory()) file = path.join(file, 'index.html');
    fs.readFile(file, (readErr, data) => {
      if (readErr) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end(`No encontrado: ${req.url}`);
        return;
      }
      res.writeHead(200, {
        'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': 'no-store',
      });
      res.end(data);
    });
  });
});

server.listen(PORT, () => {
  console.log(`Ecos del Espacio-Tiempo → http://localhost:${PORT}/`);
});
