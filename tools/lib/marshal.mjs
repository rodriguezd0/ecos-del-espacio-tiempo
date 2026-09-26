// Lector de Ruby Marshal 4.8 suficiente para los .rxdata de RPG Maker XP / Essentials.
// Devuelve objetos JS planos:
//   - Objetos Ruby  -> { __class: 'RPG::Map', campo: valor, ... }  (sin la '@')
//   - Table (RGSS)  -> { __class: 'Table', xsize, ysize, zsize, data: Int16Array }
//   - Color / Tone  -> { __class, r, g, b, a } / { __class, r, g, b, gray }
//   - Símbolos      -> string
//   - Hash          -> Map (las claves pueden ser enteros)
//   - Strings       -> string (se decodifica como UTF-8)
//   - Otros 'u'     -> { __class, __userData: Uint8Array }

const decoder = new TextDecoder('utf-8');

export function loadMarshal(buffer, { keepIvars = false } = {}) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const reader = new MarshalReader(bytes);
  // keepIvars: las variables de instancia de un 'I' sobre un objeto/array (p. ej. PBAnimation < Array con
  // @name, @graphic…) se copian como propiedades sin '@'. Por defecto se descartan (comportamiento histórico).
  reader.keepIvars = keepIvars;
  const major = reader.byte();
  const minor = reader.byte();
  if (major !== 4 || minor !== 8) throw new Error(`Versión Marshal no soportada ${major}.${minor}`);
  return reader.read();
}

class MarshalReader {
  constructor(bytes) {
    this.bytes = bytes;
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    this.pos = 0;
    this.symbols = [];
    this.objects = [];
  }

  byte() {
    if (this.pos >= this.bytes.length) throw new Error('Fin de datos Marshal inesperado');
    return this.bytes[this.pos++];
  }

  fixnum() {
    const c = (this.byte() << 24) >> 24; // con signo
    if (c === 0) return 0;
    if (c >= 5) return c - 5;
    if (c <= -5) return c + 5;
    if (c > 0) {
      let n = 0;
      for (let i = 0; i < c; i++) n |= this.byte() << (8 * i);
      return n >>> 0 === n ? n : n >>> 0;
    }
    let n = -1;
    for (let i = 0; i < -c; i++) {
      n &= ~(0xff << (8 * i));
      n |= this.byte() << (8 * i);
    }
    return n;
  }

  rawBytes() {
    const len = this.fixnum();
    const out = this.bytes.subarray(this.pos, this.pos + len);
    this.pos += len;
    return out;
  }

  symbol() {
    const t = this.byte();
    if (t === 0x3a) {
      const s = decoder.decode(this.rawBytes());
      this.symbols.push(s);
      return s;
    }
    if (t === 0x3b) return this.symbols[this.fixnum()];
    if (t === 0x49) {
      // símbolo con encoding (I:)
      const s = this.symbol();
      const n = this.fixnum();
      for (let i = 0; i < n; i++) {
        this.symbol();
        this.read();
      }
      return s;
    }
    throw new Error(`Se esperaba símbolo, tipo 0x${t.toString(16)} en ${this.pos - 1}`);
  }

  register(obj) {
    this.objects.push(obj);
    return obj;
  }

  read() {
    const t = this.byte();
    switch (t) {
      case 0x30: return null; // '0'
      case 0x54: return true; // 'T'
      case 0x46: return false; // 'F'
      case 0x69: return this.fixnum(); // 'i'
      case 0x3a: { // ':'
        const s = decoder.decode(this.rawBytes());
        this.symbols.push(s);
        return s;
      }
      case 0x3b: return this.symbols[this.fixnum()]; // ';'
      case 0x40: return this.objects[this.fixnum()]; // '@'
      case 0x49: { // 'I' ivars sobre el siguiente objeto (típicamente String)
        const obj = this.read();
        const n = this.fixnum();
        const keep = this.keepIvars && obj !== null && typeof obj === 'object';
        for (let i = 0; i < n; i++) {
          const key = this.symbol();
          const value = this.read();
          if (keep) obj[key.replace(/^@/, '')] = value;
        }
        return obj;
      }
      case 0x22: { // '"' String
        const s = decoder.decode(this.rawBytes());
        return this.register(s);
      }
      case 0x66: { // 'f' Float
        const s = decoder.decode(this.rawBytes());
        const v = s === 'inf' ? Infinity : s === '-inf' ? -Infinity : s === 'nan' ? NaN : parseFloat(s);
        return this.register(v);
      }
      case 0x6c: { // 'l' Bignum
        const sign = this.byte();
        const len = this.fixnum() * 2;
        let n = 0n;
        for (let i = 0; i < len; i++) n |= BigInt(this.byte()) << BigInt(8 * i);
        const v = Number(sign === 0x2d ? -n : n);
        return this.register(v);
      }
      case 0x5b: { // '[' Array
        const len = this.fixnum();
        const arr = this.register([]);
        for (let i = 0; i < len; i++) arr.push(this.read());
        return arr;
      }
      case 0x7b: case 0x7d: { // '{' Hash, '}' Hash con default
        const len = this.fixnum();
        const map = this.register(new Map());
        for (let i = 0; i < len; i++) {
          const k = this.read();
          map.set(k, this.read());
        }
        if (t === 0x7d) map.default = this.read();
        return map;
      }
      case 0x6f: { // 'o' Object
        const cls = this.symbol();
        const obj = this.register({ __class: cls });
        const n = this.fixnum();
        for (let i = 0; i < n; i++) {
          const key = this.symbol().replace(/^@/, '');
          obj[key] = this.read();
        }
        return obj;
      }
      case 0x53: { // 'S' Struct
        const cls = this.symbol();
        const obj = this.register({ __class: cls });
        const n = this.fixnum();
        for (let i = 0; i < n; i++) {
          const key = this.symbol();
          obj[key] = this.read();
        }
        return obj;
      }
      case 0x75: { // 'u' _dump definido por el usuario
        const cls = this.symbol();
        const data = this.rawBytes();
        return this.register(decodeUserData(cls, data));
      }
      case 0x55: { // 'U' marshal_dump
        const cls = this.symbol();
        const obj = this.register({ __class: cls });
        obj.__data = this.read();
        return obj;
      }
      case 0x65: { // 'e' extendido con módulo
        this.symbol();
        return this.read();
      }
      case 0x43: { // 'C' subclase de clase nativa
        const cls = this.symbol();
        const inner = this.read();
        if (inner && typeof inner === 'object') inner.__class = inner.__class || cls;
        return inner;
      }
      case 0x63: case 0x6d: case 0x4d: { // 'c' clase, 'm' módulo
        const name = decoder.decode(this.rawBytes());
        return this.register({ __classRef: name });
      }
      case 0x2f: { // '/' Regexp
        const src = decoder.decode(this.rawBytes());
        this.byte();
        return this.register(src);
      }
      default:
        throw new Error(`Tipo Marshal desconocido 0x${t.toString(16)} en ${this.pos - 1}`);
    }
  }
}

function decodeUserData(cls, data) {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  if (cls === 'Table') {
    const xsize = view.getInt32(4, true);
    const ysize = view.getInt32(8, true);
    const zsize = view.getInt32(12, true);
    const size = view.getInt32(16, true);
    const out = new Int16Array(size);
    for (let i = 0; i < size; i++) out[i] = view.getInt16(20 + i * 2, true);
    return { __class: 'Table', xsize, ysize, zsize, data: out };
  }
  if (cls === 'Color') {
    return { __class: 'Color', r: view.getFloat64(0, true), g: view.getFloat64(8, true), b: view.getFloat64(16, true), a: view.getFloat64(24, true) };
  }
  if (cls === 'Tone') {
    return { __class: 'Tone', r: view.getFloat64(0, true), g: view.getFloat64(8, true), b: view.getFloat64(16, true), gray: view.getFloat64(24, true) };
  }
  return { __class: cls, __userData: data };
}

/** Acceso a una Table 3D de RGSS: table.data[x + y*xsize + z*xsize*ysize] */
export function tableGet(table, x, y = 0, z = 0) {
  return table.data[x + y * table.xsize + z * table.xsize * table.ysize];
}
