// Códigos de mensaje estilo Essentials + ajuste de línea. Módulo PURO (sin DOM): se prueba con node --test.
//
// Códigos admitidos (en JS escribe la barra doble: '\\PN' o usa String.raw):
//   \n  o salto real   nueva línea              \f          salto de página (vacía la caja)
//   \PN nombre jugador  \PM dinero              \v[clave]   variable de partida
//   \c[n] color n (0 = por defecto; 1..14 tabla Essentials) o \c[#RRGGBB]
//   \b  azul (masculino)  \r  rojo (femenino)
//   \.  pausa corta (¼ s)  \|  pausa larga (1 s)  \wt[n] pausa de n frames
//   \wtnp[n] espera n frames y cierra sin flecha   \^  cierra al terminar sin esperar tecla
//   \se[nombre] efecto de sonido en ese punto

export const WAIT_SHORT = 15;
export const WAIT_LONG = 60;

const CODE_RE = /\\(PN|PM|wtnp\[(\d+)\]|wt\[(\d+)\]|se\[([^\]]*)\]|v\[([^\]]*)\]|c\[([^\]]*)\]|n|f|b|r|\.|\||\^)/g;

/**
 * Sustituye los códigos de datos (\PN, \PM, \v[...]) por su valor.
 * @param {string} text
 * @param {{ playerName?: string, money?: number|string, vars?: (key: string) => unknown }} env
 * @returns {string}
 */
export function expandText(text, env = {}) {
  return String(text ?? '')
    .replace(/\\PN/g, () => env.playerName ?? '')
    .replace(/\\PM/g, () => String(env.money ?? 0))
    .replace(/\\v\[([^\]]*)\]/g, (_, k) => {
      const v = env.vars ? env.vars(k) : undefined;
      return v === undefined || v === null ? '' : String(v);
    });
}

/**
 * Divide el texto en tokens.
 * @returns {Array<{type:'text',text:string}|{type:'color',color:string|number|null}|{type:'newline'}|{type:'page'}
 *   |{type:'wait',frames:number}|{type:'se',name:string}|{type:'close',frames:number}|{type:'noWait'}>}
 */
export function tokenize(text) {
  const src = String(text ?? '').replace(/\r\n?/g, '\n');
  const out = [];
  let last = 0;
  const pushText = (s) => {
    if (!s) return;
    const parts = s.split('\n');
    parts.forEach((p, i) => {
      if (i > 0) out.push({ type: 'newline' });
      if (p) out.push({ type: 'text', text: p });
    });
  };
  CODE_RE.lastIndex = 0;
  let m;
  while ((m = CODE_RE.exec(src))) {
    pushText(src.slice(last, m.index));
    last = CODE_RE.lastIndex;
    const code = m[1];
    if (code === 'n') out.push({ type: 'newline' });
    else if (code === 'f') out.push({ type: 'page' });
    else if (code === '.') out.push({ type: 'wait', frames: WAIT_SHORT });
    else if (code === '|') out.push({ type: 'wait', frames: WAIT_LONG });
    else if (code === '^') out.push({ type: 'noWait' });
    else if (code === 'b') out.push({ type: 'color', color: 'male' });
    else if (code === 'r') out.push({ type: 'color', color: 'female' });
    else if (m[2] !== undefined) out.push({ type: 'close', frames: Number(m[2]) });
    else if (m[3] !== undefined) out.push({ type: 'wait', frames: Number(m[3]) });
    else if (m[4] !== undefined) out.push({ type: 'se', name: m[4] });
    else if (m[6] !== undefined) out.push({ type: 'color', color: parseColorArg(m[6]) });
    // \PN, \PM y \v[] sin expandir (no debería ocurrir tras expandText): se ignoran.
  }
  pushText(src.slice(last));
  return out;
}

function parseColorArg(arg) {
  const s = arg.trim();
  if (/^#[0-9a-f]{6}$/i.test(s)) return s.toLowerCase();
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Coloca los tokens en líneas con ajuste por palabras.
 * @param {ReturnType<typeof tokenize>} tokens
 * @param {number} maxWidth  ancho disponible en px
 * @param {(ch: string) => number} measure  ancho de un carácter
 * @param {{ linesPerPage?: number }} opts
 * @returns {{ ops: Array<object>, lineCount: number, charCount: number }}
 *   ops: {op:'char', ch, color, line, x, w, pageBreak?} | {op:'wait',frames} | {op:'se',name} | {op:'close',frames} | {op:'noWait'}
 */
export function layoutTokens(tokens, maxWidth, measure, opts = {}) {
  const lpp = Math.max(1, opts.linesPerPage || 1);
  const atoms = toAtoms(tokens);
  const ops = [];
  let line = 0;
  let x = 0;
  let pendingPageBreak = false;
  let wrappedAtStart = false; // la línea actual empezó por ajuste automático
  const emitChar = (a, w) => {
    const op = { op: 'char', ch: a.ch, color: a.color, line, x, w };
    if (pendingPageBreak) {
      op.pageBreak = true;
      pendingPageBreak = false;
    }
    ops.push(op);
    x += w;
  };
  const newLine = (auto) => {
    line += 1;
    x = 0;
    wrappedAtStart = auto;
  };
  let i = 0;
  while (i < atoms.length) {
    const a = atoms[i];
    if (a.k === 'nl') { newLine(false); i += 1; continue; }
    if (a.k === 'page') {
      if (x > 0 || line % lpp !== 0) line = (Math.floor(line / lpp) + 1) * lpp;
      x = 0;
      wrappedAtStart = false;
      pendingPageBreak = true;
      i += 1;
      continue;
    }
    if (a.k === 'ctrl') { ops.push(a.op); i += 1; continue; }
    if (a.ch === ' ') {
      if (!(x === 0 && wrappedAtStart)) emitChar(a, measure(' '));
      i += 1;
      continue;
    }
    // Palabra: caracteres no-espacio consecutivos (los controles intermedios se mantienen en su sitio).
    let j = i;
    let wordWidth = 0;
    while (j < atoms.length && (atoms[j].k === 'ctrl' || (atoms[j].k === 'ch' && atoms[j].ch !== ' '))) {
      if (atoms[j].k === 'ch') wordWidth += measure(atoms[j].ch);
      j += 1;
    }
    if (x > 0 && x + wordWidth > maxWidth) {
      trimTrailingSpaces(ops, line);
      newLine(true);
    }
    for (let k = i; k < j; k++) {
      const b = atoms[k];
      if (b.k === 'ctrl') { ops.push(b.op); continue; }
      const w = measure(b.ch);
      if (x > 0 && x + w > maxWidth) newLine(true); // palabra más larga que la línea
      emitChar(b, w);
    }
    i = j;
  }
  const chars = ops.filter((o) => o.op === 'char');
  const lineCount = chars.length ? chars[chars.length - 1].line + 1 : 0;
  return { ops, lineCount: Math.max(lineCount, line + (x > 0 ? 1 : 0)), charCount: chars.length };
}

function trimTrailingSpaces(ops, line) {
  for (let k = ops.length - 1; k >= 0; k--) {
    const o = ops[k];
    if (o.op !== 'char') continue;
    if (o.line !== line || o.ch !== ' ') break;
    ops.splice(k, 1);
  }
}

function toAtoms(tokens) {
  const atoms = [];
  let color = null;
  for (const t of tokens) {
    switch (t.type) {
      case 'text':
        for (const ch of t.text) atoms.push({ k: 'ch', ch, color });
        break;
      case 'color': color = t.color; break;
      case 'newline': atoms.push({ k: 'nl' }); break;
      case 'page': atoms.push({ k: 'page' }); break;
      case 'wait': atoms.push({ k: 'ctrl', op: { op: 'wait', frames: t.frames } }); break;
      case 'se': atoms.push({ k: 'ctrl', op: { op: 'se', name: t.name } }); break;
      case 'close': atoms.push({ k: 'ctrl', op: { op: 'close', frames: t.frames } }); break;
      case 'noWait': atoms.push({ k: 'ctrl', op: { op: 'noWait' } }); break;
      default: break;
    }
  }
  return atoms;
}

/**
 * Ajusta un texto simple (sin códigos de control relevantes) a un ancho. Devuelve las líneas.
 * @param {string} text
 * @param {number} maxWidth
 * @param {(ch: string) => number} measure
 * @returns {string[]}
 */
export function wrapText(text, maxWidth, measure) {
  const { ops, lineCount } = layoutTokens(tokenize(text), maxWidth, measure);
  const lines = Array.from({ length: lineCount }, () => '');
  for (const o of ops) if (o.op === 'char') lines[o.line] += o.ch;
  return lines.map((l) => l.replace(/\s+$/, ''));
}

/** Ancho de una cadena con una función de medida por carácter. */
export function stringWidth(text, measure) {
  let w = 0;
  for (const ch of String(text)) w += measure(ch);
  return w;
}

/**
 * Recorta una cadena para que quepa en maxWidth añadiendo '…'.
 * @returns {string}
 */
export function cropText(text, maxWidth, measure, ellipsis = '…') {
  const s = String(text ?? '');
  if (stringWidth(s, measure) <= maxWidth) return s;
  const ew = stringWidth(ellipsis, measure);
  const chars = [...s];
  while (chars.length && stringWidth(chars.join(''), measure) > maxWidth - ew) chars.pop();
  return chars.join('').replace(/\s+$/, '') + ellipsis;
}
