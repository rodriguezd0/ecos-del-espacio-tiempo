// Parser genérico de archivos PBS de Pokémon Essentials v21 (formato INI con secciones [ID] o [ID,forma]).
import fs from 'node:fs';

/** Devuelve [{ section: 'BULBASAUR', form: 0|null, fields: { Name: '...', ... }, order: n }] */
export function parsePBS(file) {
  let text = fs.readFileSync(file, 'utf8');
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const out = [];
  let cur = null;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const sec = line.match(/^\[(.+)\]$/);
    if (sec) {
      const parts = sec[1].split(',').map((s) => s.trim());
      cur = { section: parts[0], args: parts.slice(1), fields: {}, lines: [], order: out.length };
      out.push(cur);
      continue;
    }
    if (!cur) continue;
    const eq = line.indexOf('=');
    if (eq < 0) {
      cur.lines.push(line);
      continue;
    }
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim();
    if (key in cur.fields) {
      // Claves repetidas (p. ej. Pokemon = en trainers.txt) se acumulan.
      if (!Array.isArray(cur.fields[key]) || !cur.fields[key].__multi) {
        const arr = [cur.fields[key]];
        arr.__multi = true;
        cur.fields[key] = arr;
      }
      cur.fields[key].push(value);
    } else {
      cur.fields[key] = value;
    }
    cur.lines.push(line);
  }
  return out;
}

export const list = (v) => (v == null || v === '' ? [] : String(v).split(',').map((s) => s.trim()).filter(Boolean));
export const int = (v, d = 0) => (v == null || v === '' ? d : parseInt(v, 10));
export const num = (v, d = 0) => (v == null || v === '' ? d : parseFloat(v));
export const bool = (v) => v != null && /^(true|yes|1)$/i.test(String(v));

/** Agrupa una lista plana en tuplas de tamaño n. */
export function tuples(values, n) {
  const out = [];
  for (let i = 0; i + n - 1 < values.length; i += n) out.push(values.slice(i, i + n));
  return out;
}
