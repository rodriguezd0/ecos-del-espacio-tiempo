// Lectura de metadatos de audio (módulo PURO: sin DOM, se usa en el navegador y en Node).
// - Ogg Vorbis: cabecera de identificación (frecuencia, canales), comentarios Vorbis
//   (LOOPSTART / LOOPLENGTH / LOOPEND, como RPG Maker) y duración (granule de la última página).
// - WAV (RIFF): frecuencia, canales y duración.
// Referencia: Essentials 020_Audio/002_Audio.rb (oggfiletime) y la especificación de Vorbis I.

const OGG_CAPTURE = 0x5367674f; // "OggS" leído como uint32 little-endian
const PAGE_HEADER_SIZE = 27;
const MAX_HEADER_PACKET_BYTES = 1 << 20; // los comentarios con carátulas enormes se truncan
const VORBIS_ID = 1;
const VORBIS_COMMENT = 3;

const textDecoder = new TextDecoder('utf-8');

/** Normaliza ArrayBuffer | TypedArray | Buffer a Uint8Array sin copiar. */
function toBytes(data) {
  if (data instanceof Uint8Array) return data;
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  if (ArrayBuffer.isView(data)) return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  throw new TypeError('Se esperaba ArrayBuffer o Uint8Array con datos de audio.');
}

function u32(bytes, off) {
  return (bytes[off] | (bytes[off + 1] << 8) | (bytes[off + 2] << 16) | (bytes[off + 3] << 24)) >>> 0;
}

function u16(bytes, off) {
  return bytes[off] | (bytes[off + 1] << 8);
}

/** Granule position (int64 LE) como Number; -1 si es "sin granule" (todo 0xFF). */
function granule(bytes, off) {
  const lo = u32(bytes, off);
  const hi = u32(bytes, off + 4);
  if (lo === 0xffffffff && hi === 0xffffffff) return -1;
  return hi * 0x100000000 + lo;
}

function isPageAt(bytes, off) {
  return off + PAGE_HEADER_SIZE <= bytes.length && u32(bytes, off) === OGG_CAPTURE && bytes[off + 4] === 0;
}

/** Lee la cabecera de una página Ogg en `off` o devuelve null si no hay una válida. */
export function readOggPage(bytes, off) {
  if (!isPageAt(bytes, off)) return null;
  const segments = bytes[off + 26];
  const tableStart = off + PAGE_HEADER_SIZE;
  if (tableStart + segments > bytes.length) return null;
  const lacing = bytes.subarray(tableStart, tableStart + segments);
  let bodySize = 0;
  for (let i = 0; i < segments; i++) bodySize += lacing[i];
  const bodyStart = tableStart + segments;
  return {
    offset: off,
    headerType: bytes[off + 5],
    granule: granule(bytes, off + 6),
    serial: u32(bytes, off + 14),
    sequence: u32(bytes, off + 18),
    lacing,
    bodyStart,
    bodyEnd: Math.min(bodyStart + bodySize, bytes.length),
    next: bodyStart + bodySize,
  };
}

/**
 * Reconstruye los primeros `count` paquetes del primer flujo lógico (pueden abarcar varias páginas).
 * Devuelve { serial, packets: Uint8Array[] }.
 */
export function readFirstPackets(data, count = 2) {
  const bytes = toBytes(data);
  const packets = [];
  let serial = null;
  let parts = [];
  let partBytes = 0;
  let off = 0;
  while (packets.length < count) {
    const page = readOggPage(bytes, off);
    if (!page) break;
    off = page.next;
    if (serial === null) serial = page.serial;
    if (page.serial !== serial) continue;
    let cursor = page.bodyStart;
    for (let i = 0; i < page.lacing.length && packets.length < count; i++) {
      const len = page.lacing[i];
      if (partBytes < MAX_HEADER_PACKET_BYTES) {
        parts.push(bytes.subarray(cursor, Math.min(cursor + len, page.bodyEnd)));
        partBytes += len;
      }
      cursor += len;
      if (len < 255) {
        packets.push(concat(parts));
        parts = [];
        partBytes = 0;
      }
    }
  }
  return { serial, packets };
}

function concat(parts) {
  if (parts.length === 1) return parts[0];
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let pos = 0;
  for (const p of parts) {
    out.set(p, pos);
    pos += p.length;
  }
  return out;
}

function hasVorbisSignature(packet, type) {
  return packet.length >= 7 && packet[0] === type && textDecoder.decode(packet.subarray(1, 7)) === 'vorbis';
}

/** Cabecera de identificación Vorbis → { channels, sampleRate } o null. */
export function parseVorbisIdentification(packet) {
  if (!packet || !hasVorbisSignature(packet, VORBIS_ID) || packet.length < 16) return null;
  return { channels: packet[11], sampleRate: u32(packet, 12) };
}

/**
 * Cabecera de comentarios Vorbis → { vendor, comments: { CLAVE: valor } } o null.
 * Las claves se normalizan a MAYÚSCULAS (la especificación las declara insensibles a mayúsculas).
 */
export function parseVorbisComments(packet) {
  if (!packet || !hasVorbisSignature(packet, VORBIS_COMMENT)) return null;
  let pos = 7;
  const readString = () => {
    if (pos + 4 > packet.length) return null;
    const len = u32(packet, pos);
    pos += 4;
    if (pos + len > packet.length) return null;
    const s = textDecoder.decode(packet.subarray(pos, pos + len));
    pos += len;
    return s;
  };
  const vendor = readString();
  if (vendor === null || pos + 4 > packet.length) return { vendor: vendor || '', comments: {} };
  const count = u32(packet, pos);
  pos += 4;
  const comments = {};
  for (let i = 0; i < count; i++) {
    const entry = readString();
    if (entry === null) break;
    const eq = entry.indexOf('=');
    if (eq <= 0) continue;
    comments[entry.slice(0, eq).toUpperCase()] = entry.slice(eq + 1);
  }
  return { vendor, comments };
}

/** Busca hacia atrás la última página del flujo `serial` y devuelve su granule (muestras totales). */
export function lastGranule(data, serial) {
  const bytes = toBytes(data);
  for (let off = bytes.length - PAGE_HEADER_SIZE; off >= 0; off--) {
    if (bytes[off] !== 0x4f || !isPageAt(bytes, off)) continue;
    if (serial !== null && serial !== undefined && u32(bytes, off + 14) !== serial) continue;
    const g = granule(bytes, off + 6);
    if (g >= 0) return g;
  }
  return 0;
}

function parseSampleValue(raw) {
  if (raw === undefined || raw === null) return null;
  const s = String(raw).trim();
  if (!/^\d+$/.test(s)) return null;
  return Number(s);
}

/** ¿Tiene el archivo etiquetas de bucle (aunque sean inválidas)? */
export function hasLoopTags(comments) {
  return Boolean(comments && comments.LOOPSTART !== undefined);
}

/**
 * Bucle de RPG Maker a partir de comentarios Vorbis (en muestras).
 * Admite LOOPSTART + LOOPLENGTH (formato RPG Maker; también la errata "LOOPLENGHT" presente en
 * PrismaBossFinal.ogg) o LOOPSTART + LOOPEND.
 * Devuelve { start, length } en muestras, o null si no hay bucle válido.
 * `totalSamples` (opcional) recorta bucles que se salen del archivo y descarta LOOPSTART ≥ final
 * (caso de CombateCintia.ogg: el archivo se recortó después de etiquetarlo).
 */
export function loopFromComments(comments, totalSamples = 0) {
  if (!comments) return null;
  const start = parseSampleValue(comments.LOOPSTART);
  if (start === null) return null;
  let length = parseSampleValue(comments.LOOPLENGTH ?? comments.LOOPLENGHT);
  if (length === null) {
    const end = parseSampleValue(comments.LOOPEND);
    if (end !== null && end > start) length = end - start;
  }
  if (totalSamples > 0) {
    if (start >= totalSamples) return null;
    if (length === null || length <= 0 || start + length > totalSamples) length = totalSamples - start;
  }
  if (length === null || length <= 0) return null;
  return { start, length };
}

/**
 * Metadatos completos de un Ogg Vorbis.
 * → { format: 'ogg', codec, channels, sampleRate, totalSamples, duration, vendor, comments, loop }
 *   loop = { start, length, startSec, endSec } | null
 */
export function parseOggMeta(data) {
  const bytes = toBytes(data);
  if (!isPageAt(bytes, 0)) return null;
  const { serial, packets } = readFirstPackets(bytes, 2);
  const id = parseVorbisIdentification(packets[0]);
  if (!id) return { format: 'ogg', codec: 'desconocido', channels: 0, sampleRate: 0, totalSamples: 0, duration: 0, vendor: '', comments: {}, loopTags: false, loop: null };
  const tags = parseVorbisComments(packets[1]) || { vendor: '', comments: {} };
  const totalSamples = lastGranule(bytes, serial);
  const loop = loopFromComments(tags.comments, totalSamples);
  return {
    format: 'ogg',
    codec: 'vorbis',
    channels: id.channels,
    sampleRate: id.sampleRate,
    totalSamples,
    duration: id.sampleRate ? totalSamples / id.sampleRate : 0,
    vendor: tags.vendor,
    comments: tags.comments,
    loopTags: hasLoopTags(tags.comments),
    loop: loop && withSeconds(loop, id.sampleRate),
  };
}

function withSeconds(loop, sampleRate) {
  return {
    ...loop,
    startSec: loop.start / sampleRate,
    endSec: (loop.start + loop.length) / sampleRate,
  };
}

/** Metadatos de un WAV RIFF → { format: 'wav', channels, sampleRate, duration } o null. */
export function parseWavMeta(data) {
  const bytes = toBytes(data);
  if (bytes.length < 12 || textDecoder.decode(bytes.subarray(0, 4)) !== 'RIFF' || textDecoder.decode(bytes.subarray(8, 12)) !== 'WAVE') return null;
  let off = 12;
  let fmt = null;
  let dataSize = 0;
  while (off + 8 <= bytes.length) {
    const id = textDecoder.decode(bytes.subarray(off, off + 4));
    const size = u32(bytes, off + 4);
    if (id === 'fmt ' && off + 24 <= bytes.length) {
      fmt = { channels: u16(bytes, off + 10), sampleRate: u32(bytes, off + 12), byteRate: u32(bytes, off + 16) };
    } else if (id === 'data') {
      dataSize = Math.min(size, bytes.length - off - 8);
    }
    off += 8 + size + (size & 1);
  }
  if (!fmt) return null;
  return {
    format: 'wav',
    channels: fmt.channels,
    sampleRate: fmt.sampleRate,
    duration: fmt.byteRate ? dataSize / fmt.byteRate : 0,
    loopTags: false,
    loop: null,
  };
}

/** Detecta el formato por la firma y devuelve sus metadatos (o null si no se reconoce). */
export function parseAudioMeta(data) {
  const bytes = toBytes(data);
  if (isPageAt(bytes, 0)) return parseOggMeta(bytes);
  if (bytes.length >= 4 && textDecoder.decode(bytes.subarray(0, 4)) === 'RIFF') return parseWavMeta(bytes);
  return null;
}
