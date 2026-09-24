// Libreta de pistas (objeto clave CLUENOTEBOOK; docs/TABLILLAS.md §4.2, X24). Cuaderno de la madre de Casilda
// con estilo Añil/BW: fondo de bandas animadas, pestañas y hoja pautada con anillas.
//   Pistas     abiertas (máx. 3, «¡Nuevo!»), en espera, notas y resueltas; segunda pista con zona y frase de Zygarde
//   Profecía   versos revelados en escritura Unown (Fonts/Annon.ttf) con traducción parcial o total (GLYPHKEY)
//   Crónica    entradas I–XV (y las tres de Arceus) desbloqueadas por Tablilla
//   Tablillas  18 casillas con los iconos de Graphics/Items
//   Diario     hitos ya vividos: etapas completadas y Pilares restaurados (content/story/journal.js)
//   Células    recuento por mapa visitado (content/zygarde/cells.js)
// Datos y reglas: content/story/ (notebook.js, clueLogic.js). Controles: Q/E (L/R) pestañas; izquierda/derecha
// también en las listas; arriba/abajo elegir; X salir.
// open({ tab: 'clues'|'prophecy'|'chronicle'|'tablets'|'journal'|'cells' }).
import { engine, SCREEN_W, SCREEN_H } from '../../core/engine.js';
import { ScreenScene, openScene } from '../core/uiScene.js';
import { img, preload } from '../core/images.js';
import { drawText, wrapLines, cropText } from '../core/text.js';
import { itemIconCandidates, drawScrollArrow, COMMON_GFX } from '../core/widgets.js';
import { drawHexOutline, drawHexFilled } from '../message/messageBox.js';
import { playSE, sfx } from '../core/sound.js';
import {
  NOTEBOOK_TABS, clueListItems, verseRows, chronicleRows, tabletCells, journalRows, cellRows, tabCounter,
} from '../../content/story/notebook.js';
import { refreshClueQueue, markCluesSeen } from '../../content/story/clueLogic.js';
import { TABLETS } from '../../content/story/tablets.js';
import { numeral as romanNumeral } from '../../content/story/verses.js';
import { fragmentFor } from '../../content/story/fragments.js';
import { ensureUnownFont, drawUnown, preloadItemIcon } from '../../content/story/storyFx.js';

const P = {
  bg: '#1d2d38', stripe: '#233747', band: '#101c24', bandLine: '#4f93a8',
  title: '#f8f8f8', titleShadow: '#1c2c36', hint: '#a8c0cc', hintShadow: '#0c161c',
  tabOn: '#f2e8cc', tabOnText: '#5a4630', tabOnShadow: '#d8caa4',
  tabOff: '#355060', tabOffTop: '#4a6c80', tabOffText: '#c8dae2', tabOffShadow: '#1a2a34',
  paper: '#f2e8cc', paperEdge: '#c8b88e', rule: '#e2d6b6', margin: '#dc9c88', ring: '#9aa6ae',
  ink: '#4a4034', inkShadow: '#dccfae', faded: '#9a8f78', sepia: '#8c6a3c', blue: '#2e5f8e', green: '#3a8a30',
  red: '#c83c30', select: '#fff8e0', selectEdge: '#c89a48', slate: '#1b2430', slateLine: '#243142',
};
const PAPER = { x: 12, y: 70, w: 488, h: 278 };
const LIST = { x: 52, y: 80, rowH: 24, rows: 11 };
const RIGHT = 492;
const TOP = 80;
const BOTTOM = 342;
const LINE = 21;
/** Ancho de lista y comienzo del detalle por pestaña (la Crónica deja más sitio al texto). */
const LAYOUT = {
  clues: { listW: 146, detailX: 212 }, prophecy: { listW: 146, detailX: 212 }, chronicle: { listW: 122, detailX: 188 },
  journal: { listW: 146, detailX: 212 }, cells: { listW: 146, detailX: 212 },
};
const GRID = { x: 72, y: 88, cols: 6, cell: 62 };
const TAB_KEYS = NOTEBOOK_TABS.map((t) => t.id);
/** Pestañas: repartidas a lo ancho de la hoja (seis desde el Diario y las Células). */
const TAB = { x: 14, gap: 4, w: Math.floor((PAPER.w - 4 * (NOTEBOOK_TABS.length - 1)) / NOTEBOOK_TABS.length) };
const CELL_HEX = { r: 7, step: 20, perRow: 12 };
const PAGE_SE = 'GUI trainer card flip';

const txt = (g, s, x, y, color = P.ink, font = 'note', extra = {}) => drawText(g, s, x, y, { color, shadow: P.inkShadow, font, ...extra });
/** Tinte del kit del Pilar n (el de su placa de verso) como color CSS. */
const fragmentTint = (n) => `rgb(${(fragmentFor(n)?.tint || [140, 106, 60]).join(',')})`;

const silhouettes = new Map();
function silhouette(im) {
  let c = silhouettes.get(im.src);
  if (!c) {
    c = document.createElement('canvas');
    c.width = im.width;
    c.height = im.height;
    const x = c.getContext('2d');
    x.drawImage(im, 0, 0);
    x.globalCompositeOperation = 'source-in';
    x.fillStyle = '#b9aa84';
    x.fillRect(0, 0, c.width, c.height);
    silhouettes.set(im.src, c);
  }
  return c;
}

function iconImage(itemId) {
  for (const url of itemIconCandidates(itemId)) {
    const im = img(url);
    if (im) return im;
  }
  return null;
}

class CluesScene extends ScreenScene {
  async enter(opts = {}) {
    refreshClueQueue(engine.state);
    this.tab = TAB_KEYS.includes(opts.tab) ? opts.tab : 'clues';
    this.sel = { clues: 0, prophecy: 0, chronicle: 0, tablets: 0, journal: 0, cells: 0 };
    this.scroll = { clues: 0, prophecy: 0, chronicle: 0, journal: 0, cells: 0 };
    this.unownCache = new Map();
    this.rebuild();
    const firstNew = this.clueItems.findIndex((it) => it.kind === 'clue' && it.row.isNew);
    const first = this.clueItems.findIndex((it) => it.kind === 'clue');
    this.sel.clues = firstNew >= 0 ? firstNew : Math.max(0, first);
    this.fixScroll('clues', this.clueItems.length);
    await Promise.all([
      ensureUnownFont(),
      preload(COMMON_GFX),
      ...TABLETS.map((t) => preloadItemIcon(t.id)),
    ]);
  }

  rebuild() {
    const st = engine.state;
    this.clueItems = clueListItems(st);
    this.verses = verseRows(st);
    this.chronicle = chronicleRows(st);
    this.cells = tabletCells(st);
    this.journal = journalRows(st);
    this.cellMaps = cellRows(st);
    // El Diario abre en el hito más reciente.
    this.sel.journal = Math.max(0, this.journal.length - 1);
    this.fixScroll('journal', this.journal.length);
  }

  /** Filas de las pestañas de lista simple (Profecía, Crónica, Diario, Células). */
  listRows(key) {
    return { prophecy: this.verses, chronicle: this.chronicle, journal: this.journal, cells: this.cellMaps }[key] || [];
  }

  /** Al cerrar (pantalla ya en negro) las pistas mostradas dejan de ser «nuevas». */
  onHidden() {
    try { markCluesSeen(engine.state); } catch (err) { console.error('[libreta] marcar vistas', err); }
  }

  get layout() { return LAYOUT[this.tab] || LAYOUT.clues; }

  // ---------------------------------------------------------------- entrada
  tick() {
    const inp = this.input;
    if (inp.pressed('B')) { sfx.cancel(); this.finish(); return; }
    const grid = this.tab === 'tablets';
    if (inp.pressed('L') || (!grid && inp.repeat('LEFT'))) { this.switchTab(-1); return; }
    if (inp.pressed('R') || (!grid && inp.repeat('RIGHT'))) { this.switchTab(1); return; }
    if (grid) this.moveGrid(inp);
    else if (this.tab === 'clues') this.moveClues(inp);
    else this.moveList(inp, this.tab, this.listRows(this.tab).length);
  }

  switchTab(d) {
    const i = TAB_KEYS.indexOf(this.tab);
    this.tab = TAB_KEYS[(i + d + TAB_KEYS.length) % TAB_KEYS.length];
    playSE(PAGE_SE);
  }

  moveClues(inp) {
    const items = this.clueItems;
    const dir = inp.repeat('UP') ? -1 : inp.repeat('DOWN') ? 1 : 0;
    if (!dir) return;
    for (let i = this.sel.clues + dir; i >= 0 && i < items.length; i += dir) {
      if (items[i].kind !== 'clue') continue;
      this.sel.clues = i;
      sfx.cursor();
      break;
    }
    // Al subir, deja ver la cabecera de sección que hay justo encima.
    if (dir < 0 && items[this.sel.clues - 1]?.kind === 'header' && this.sel.clues - 1 < this.scroll.clues) this.scroll.clues = this.sel.clues - 1;
    this.fixScroll('clues', items.length);
  }

  moveList(inp, key, count) {
    const dir = inp.repeat('UP') ? -1 : inp.repeat('DOWN') ? 1 : 0;
    if (!dir || !count) return;
    this.sel[key] = (this.sel[key] + dir + count) % count;
    sfx.cursor();
    this.fixScroll(key, count);
  }

  moveGrid(inp) {
    const n = this.cells.length;
    let s = this.sel.tablets;
    if (inp.repeat('LEFT')) s -= 1;
    else if (inp.repeat('RIGHT')) s += 1;
    else if (inp.repeat('UP')) s -= GRID.cols;
    else if (inp.repeat('DOWN')) s += GRID.cols;
    else return;
    s = (s + n) % n;
    if (s !== this.sel.tablets) { this.sel.tablets = s; sfx.cursor(); }
  }

  fixScroll(key, count) {
    const sel = this.sel[key];
    if (sel < this.scroll[key]) this.scroll[key] = sel;
    if (sel >= this.scroll[key] + LIST.rows) this.scroll[key] = sel - LIST.rows + 1;
    this.scroll[key] = Math.max(0, Math.min(this.scroll[key], Math.max(0, count - LIST.rows)));
  }

  // ---------------------------------------------------------------- dibujo
  draw(g) {
    this.drawBackground(g);
    this.drawHeader(g);
    this.drawTabs(g);
    this.drawPaper(g);
    g.save();
    g.beginPath();
    g.rect(PAPER.x + 36, PAPER.y + 4, PAPER.w - 42, PAPER.h - 8);
    g.clip();
    if (this.tab === 'clues') this.drawClues(g);
    else if (this.tab === 'prophecy') this.drawProphecy(g);
    else if (this.tab === 'chronicle') this.drawChronicle(g);
    else if (this.tab === 'journal') this.drawJournal(g);
    else if (this.tab === 'cells') this.drawCells(g);
    else this.drawTablets(g);
    g.restore();
    this.drawFooter(g);
  }

  drawBackground(g) {
    g.fillStyle = P.bg;
    g.fillRect(0, 0, SCREEN_W, SCREEN_H);
    g.fillStyle = P.stripe;
    const off = Math.floor(this.t / 3) % 32;
    for (let x = -SCREEN_H - 32 + off; x < SCREEN_W; x += 32) {
      g.beginPath();
      g.moveTo(x, SCREEN_H);
      g.lineTo(x + 14, SCREEN_H);
      g.lineTo(x + 14 + SCREEN_H, 0);
      g.lineTo(x + SCREEN_H, 0);
      g.closePath();
      g.fill();
    }
  }

  drawHeader(g) {
    g.fillStyle = P.band;
    g.fillRect(0, 0, SCREEN_W, 36);
    g.fillStyle = P.bandLine;
    g.fillRect(0, 34, SCREEN_W, 2);
    drawHexOutline(g, 22, 18, 9, P.bandLine, 1);
    drawHexFilled(g, 22, 18, 4, '#b9ff66', 0.6 + 0.4 * Math.sin(this.t / 20));
    drawText(g, 'Libreta de pistas', 40, 6, { color: P.title, shadow: P.titleShadow });
    drawText(g, tabCounter(engine.state, this.tab), SCREEN_W - 14, 9, { color: P.hint, shadow: P.hintShadow, font: 'note', align: 'right' });
  }

  drawTabs(g) {
    const hasNew = this.clueItems.some((it) => it.kind === 'clue' && it.row.isNew);
    NOTEBOOK_TABS.forEach((tab, i) => {
      const x = TAB.x + i * (TAB.w + TAB.gap);
      const on = tab.id === this.tab;
      if (on) {
        g.fillStyle = P.tabOn;
        g.fillRect(x, 40, TAB.w, 32);
        g.fillStyle = '#fffaf0';
        g.fillRect(x + 2, 40, TAB.w - 4, 2);
      } else {
        g.fillStyle = P.tabOff;
        g.fillRect(x, 44, TAB.w, 24);
        g.fillStyle = P.tabOffTop;
        g.fillRect(x, 44, TAB.w, 2);
      }
      drawText(g, tab.name, x + TAB.w / 2, on ? 45 : 47, {
        align: 'center', font: 'note', color: on ? P.tabOnText : P.tabOffText, shadow: on ? P.tabOnShadow : P.tabOffShadow,
      });
      if (tab.id === 'clues' && hasNew) {
        g.fillStyle = P.red;
        g.fillRect(x + TAB.w - 8, on ? 44 : 48, 6, 6);
      }
    });
  }

  drawPaper(g) {
    const { x, y, w, h } = PAPER;
    g.fillStyle = P.paperEdge;
    g.fillRect(x + 4, y + 4, w, h);
    g.fillStyle = P.paper;
    g.fillRect(x, y, w, h);
    g.fillStyle = P.rule;
    for (let ry = y + 30; ry < y + h - 6; ry += 24) g.fillRect(x + 38, ry, w - 44, 2);
    g.fillStyle = P.margin;
    g.fillRect(x + 32, y + 4, 2, h - 8);
    for (let ry = y + 12; ry < y + h - 8; ry += 26) {
      g.fillStyle = P.bg;
      g.fillRect(x + 12, ry + 4, 8, 8);
      g.fillStyle = P.ring;
      g.fillRect(x - 6, ry + 6, 22, 4);
      g.fillStyle = '#d4dde2';
      g.fillRect(x - 6, ry + 6, 22, 2);
    }
  }

  drawFooter(g) {
    g.fillStyle = P.band;
    g.fillRect(0, SCREEN_H - 30, SCREEN_W, 30);
    const hint = this.tab === 'tablets' ? 'Q/E: pestaña · Flechas: elegir · X: salir' : 'Q/E o izq./der.: pestaña · Flechas: elegir · X: salir';
    drawText(g, hint, SCREEN_W / 2, SCREEN_H - 26, { align: 'center', color: P.hint, shadow: P.hintShadow, font: 'note' });
  }

  drawSelection(g, x, y, w, h) {
    g.fillStyle = P.selectEdge;
    g.fillRect(x, y, w, h);
    g.fillStyle = P.select;
    g.fillRect(x + 2, y + 2, w - 4, h - 4);
  }

  drawListArrows(g, key, count) {
    const cx = LIST.x + this.layout.listW / 2 - 14;
    if (this.scroll[key] > 0) drawScrollArrow(g, 'up', cx, LIST.y - 30, this.t);
    if (this.scroll[key] + LIST.rows < count) drawScrollArrow(g, 'down', cx, LIST.y + LIST.rows * LIST.rowH - 8, this.t);
  }

  drawDivider(g) {
    g.fillStyle = P.paperEdge;
    g.fillRect(this.layout.detailX - 10, PAPER.y + 8, 2, PAPER.h - 16);
  }

  /** Lista con scroll (Profecía / Crónica). */
  drawList(g, key, rows, labelOf, dimOf) {
    const { listW } = this.layout;
    const start = this.scroll[key];
    rows.slice(start, start + LIST.rows).forEach((row, i) => {
      const y = LIST.y + i * LIST.rowH;
      if (start + i === this.sel[key]) this.drawSelection(g, LIST.x - 6, y, listW + 6, LIST.rowH);
      txt(g, cropText(labelOf(row), listW - 8, 'note'), LIST.x, y + 3, dimOf(row) ? P.faded : P.ink);
    });
    this.drawListArrows(g, key, rows.length);
  }

  /** Párrafo ajustado al ancho; devuelve la y siguiente (se corta al llegar al pie de la hoja). */
  paragraph(g, text, x, y, w, color = P.ink) {
    let yy = y;
    for (const line of wrapLines(text, w, 'note')) {
      if (yy > BOTTOM - LINE) break;
      txt(g, line, x, yy, color);
      yy += LINE;
    }
    return yy;
  }

  // ---- Pistas
  drawClues(g) {
    const items = this.clueItems;
    if (!items.some((it) => it.kind === 'clue')) {
      txt(g, 'Todavía no has anotado ninguna pista.', PAPER.x + PAPER.w / 2 + 16, PAPER.y + 120, P.faded, 'system', { align: 'center' });
      return;
    }
    const { listW } = this.layout;
    this.drawDivider(g);
    const start = this.scroll.clues;
    items.slice(start, start + LIST.rows).forEach((it, i) => {
      const y = LIST.y + i * LIST.rowH;
      if (it.kind === 'header') {
        txt(g, it.text, LIST.x - 4, y + 2, P.sepia);
        g.fillStyle = P.paperEdge;
        g.fillRect(LIST.x - 4, y + 21, listW, 2);
        return;
      }
      const row = it.row;
      if (start + i === this.sel.clues) this.drawSelection(g, LIST.x - 6, y, listW + 6, LIST.rowH);
      this.drawClueMark(g, row, LIST.x + 4, y + 12);
      const color = row.status === 'active' ? P.ink : P.faded;
      txt(g, cropText(row.title, listW - 30, 'note'), LIST.x + 16, y + 3, color);
      if (row.isNew) { g.fillStyle = P.red; g.fillRect(LIST.x + listW - 10, y + 9, 6, 6); }
    });
    this.drawListArrows(g, 'clues', items.length);
    const sel = items[this.sel.clues];
    if (sel?.kind === 'clue') this.drawClueDetail(g, sel.row);
  }

  drawClueMark(g, row, cx, cy) {
    if (row.status === 'solved') { drawHexFilled(g, cx, cy, 5, P.sepia, 1); return; }
    if (row.status === 'queued') { drawHexOutline(g, cx, cy, 5, P.faded, 1); return; }
    drawHexOutline(g, cx, cy, 5, row.custom ? P.sepia : P.blue, 1);
    if (row.step >= 2) drawHexFilled(g, cx, cy, 3, P.blue, 1);
  }

  drawClueDetail(g, row) {
    const x = this.layout.detailX;
    const w = RIGHT - x;
    let y = TOP;
    const chip = row.status === 'solved' ? 'Resuelta' : row.status === 'queued' ? 'En espera' : row.custom ? 'Nota' : row.step >= 2 ? 'Segunda pista' : 'Pista inicial';
    txt(g, `— ${chip} —`, x, y, row.status === 'queued' ? P.faded : P.sepia);
    if (row.isNew) txt(g, '¡Nuevo!', x + w, y, P.red, 'note', { align: 'right' });
    y += LINE;
    // Con la segunda pista el título es la zona (anillo en el mapa regional): se marca con un aro azul.
    const title = row.status === 'solved' && row.arc ? row.arc.title : row.title;
    const zoneMark = Boolean(row.zone);
    if (!row.custom) {
      if (zoneMark) drawHexOutline(g, x + 7, y + 11, 6, P.blue, 1, 2);
      txt(g, cropText(title, w - (zoneMark ? 18 : 0), 'note'), x + (zoneMark ? 18 : 0), y, zoneMark ? P.blue : P.ink);
      y += LINE + 4;
    }
    const faded = row.status === 'active' ? P.ink : P.faded;
    row.steps.forEach((s, i) => {
      if (y > BOTTOM - LINE) return;
      if (!row.custom) { txt(g, cropText(`${i + 1} · ${s.by}`, w, 'note'), x, y, P.sepia); y += LINE; }
      y = this.paragraph(g, s.text, x, y, w, faded) + 4;
    });
    if (row.status === 'solved' && row.place && y <= BOTTOM - LINE) { txt(g, cropText(row.place, w, 'note'), x, y, P.blue); y += LINE; }
    if (row.zygarde && y <= BOTTOM - LINE) {
      drawHexFilled(g, x + 6, y + 10, 5, P.green, 0.8);
      this.paragraph(g, `Zygarde: «${row.zygarde}»`, x + 16, y, w - 16, P.green);
    }
  }

  // ---- Profecía
  drawProphecy(g) {
    this.drawDivider(g);
    this.drawList(g, 'prophecy', this.verses, (r) => r.label, (r) => !r.revealed);
    const row = this.verses[this.sel.prophecy];
    if (row) this.drawVerseDetail(g, row);
  }

  unownLines(row, width) {
    const key = `${row.id}|${width}`;
    if (!this.unownCache.has(key)) this.unownCache.set(key, wrapLines(row.unown, width, 'unown'));
    return this.unownCache.get(key);
  }

  /** Glifos en la placa: si no caben en tres líneas, la inscripción se desplaza despacio hacia arriba. */
  drawUnownPlaque(g, lines, px, py, pw, ph, tint) {
    const lh = 32;
    const opts = { color: tint, shadow: '#070b10', lineHeight: lh };
    if (lines.length <= 3) {
      drawUnown(g, lines, px + pw / 2, py + 10 + (3 - lines.length) * 15, opts);
      return;
    }
    const loop = (lines.length + 1) * lh;
    const off = Math.floor((this.t * 0.4) % loop);
    g.save();
    g.beginPath();
    g.rect(px + 2, py + 4, pw - 4, ph - 8);
    g.clip();
    drawUnown(g, lines, px + pw / 2, py + 10 - off, opts);
    drawUnown(g, lines, px + pw / 2, py + 10 - off + loop, opts);
    g.restore();
  }

  drawVerseDetail(g, row) {
    const x = this.layout.detailX;
    const w = RIGHT - x;
    const px = x - 4; const pw = w + 6; const py = TOP; const ph = 112;
    g.fillStyle = P.slate;
    g.fillRect(px, py, pw, ph);
    g.fillStyle = P.slateLine;
    for (let yy = py + 6; yy < py + ph - 4; yy += 6) g.fillRect(px + 4, yy, pw - 8, 2);
    const tint = `rgb(${row.tint.join(',')})`;
    g.fillStyle = tint;
    g.fillRect(px, py, pw, 2);
    g.fillRect(px, py + ph - 2, pw, 2);
    if (!row.revealed) {
      drawHexOutline(g, px + pw / 2, py + ph / 2, 22, tint, 0.8);
      drawText(g, '?', px + pw / 2, py + ph / 2 - 12, { align: 'center', color: tint, shadow: '#0a1018' });
      this.paragraph(g, 'Este verso aún no se ha revelado.', x, py + ph + 14, w, P.faded);
      return;
    }
    if (row.unown) {
      this.drawUnownPlaque(g, this.unownLines(row, pw - 20), px, py, pw, ph, tint);
    } else {
      drawText(g, row.label, px + pw / 2, py + ph / 2 - 12, { align: 'center', color: tint, shadow: '#070b10' });
    }
    let y = py + ph + 6;
    const label = row.verse ? (row.full ? 'Traducción · Clave Glífica' : 'Traducción parcial · Pokédex') : 'Confirmación';
    txt(g, label, x, y, P.sepia);
    y = this.paragraph(g, row.translation, x, y + LINE, w);
    if (row.readBy && y <= BOTTOM - LINE) txt(g, cropText(`Lo lee: ${row.readBy}`, w, 'note'), x, y + 2, P.faded);
  }

  // ---- Crónica
  drawChronicle(g) {
    this.drawDivider(g);
    this.drawList(g, 'chronicle', this.chronicle, (r) => r.label, (r) => !r.unlocked);
    const row = this.chronicle[this.sel.chronicle];
    if (!row) return;
    const x = this.layout.detailX;
    const w = RIGHT - x;
    const e = row.entry;
    txt(g, e.numeral === '—' ? 'De las tablas del Creador' : `Crónica ${e.numeral}`, x, TOP, P.sepia);
    if (!row.unlocked) {
      txt(g, 'Esta página sigue en blanco.', x, TOP + LINE * 2, P.faded);
      return;
    }
    txt(g, row.tablet?.name || '', x, TOP + LINE, P.ink);
    const y = this.paragraph(g, `«${e.text}»`, x, TOP + LINE * 2 + 6, w);
    if (e.note && y <= BOTTOM - 14) txt(g, `(${e.note})`, x + w, y + 2, P.sepia, 'note', { align: 'right' });
  }

  /** Hoja vacía de una pestaña de lista (mismo estilo que Pistas). */
  drawEmpty(g, text) {
    txt(g, text, PAPER.x + PAPER.w / 2 + 16, PAPER.y + 120, P.faded, 'system', { align: 'center' });
  }

  // ---- Diario
  drawJournal(g) {
    if (!this.journal.length) { this.drawEmpty(g, 'El diario aún está en blanco.'); return; }
    this.drawDivider(g);
    this.drawList(g, 'journal', this.journal, (r) => r.label, () => false);
    const row = this.journal[this.sel.journal];
    if (!row) return;
    const x = this.layout.detailX;
    const w = RIGHT - x;
    const pillar = row.kind === 'pillar';
    txt(g, pillar ? '— Pilar restaurado —' : '— Etapa del viaje —', x, TOP, P.sepia);
    if (pillar) {
      const tint = fragmentTint(row.n);
      drawHexOutline(g, x + 7, TOP + LINE + 11, 6, tint, 1, 2);
      drawHexFilled(g, x + 7, TOP + LINE + 11, 3, tint, 1);
    }
    txt(g, cropText(row.title, w - (pillar ? 18 : 0), 'note'), x + (pillar ? 18 : 0), TOP + LINE, P.ink);
    let y = TOP + LINE * 2 + 6;
    row.lines.forEach((line, i) => {
      if (y > BOTTOM - LINE) return;
      y = this.paragraph(g, line, x, y, w, i === 0 && pillar ? P.blue : P.ink) + 4;
    });
  }

  // ---- Células
  drawCells(g) {
    if (!this.cellMaps.length) { this.drawEmpty(g, 'Aún no has visitado lugares con células.'); return; }
    const { listW } = this.layout;
    this.drawDivider(g);
    const start = this.scroll.cells;
    this.cellMaps.slice(start, start + LIST.rows).forEach((row, i) => {
      const y = LIST.y + i * LIST.rowH;
      if (start + i === this.sel.cells) this.drawSelection(g, LIST.x - 6, y, listW + 6, LIST.rowH);
      const count = `${row.found}/${row.total}`;
      const done = row.found === row.total;
      txt(g, cropText(row.name, listW - 42, 'note'), LIST.x, y + 3, done ? P.green : P.ink);
      txt(g, count, LIST.x + listW - 4, y + 3, done ? P.green : P.sepia, 'note', { align: 'right' });
    });
    this.drawListArrows(g, 'cells', this.cellMaps.length);
    const row = this.cellMaps[this.sel.cells];
    if (row) this.drawCellDetail(g, row);
  }

  drawCellDetail(g, row) {
    const x = this.layout.detailX;
    const w = RIGHT - x;
    txt(g, '— Células de Zygarde —', x, TOP, P.sepia);
    txt(g, cropText(row.name, w, 'note'), x, TOP + LINE, P.ink);
    txt(g, `Encontradas: ${row.found} de ${row.total}`, x, TOP + LINE * 2, row.found === row.total ? P.green : P.blue);
    const gy = TOP + LINE * 3 + 14;
    row.cells.forEach((c, i) => {
      const cx = x + 8 + (i % CELL_HEX.perRow) * CELL_HEX.step;
      const cy = gy + Math.floor(i / CELL_HEX.perRow) * CELL_HEX.step;
      if (c.found) drawHexFilled(g, cx, cy, CELL_HEX.r, P.green, 1);
      else drawHexOutline(g, cx, cy, CELL_HEX.r, P.faded, 1, 2);
    });
    let y = gy + Math.ceil(row.cells.length / CELL_HEX.perRow) * CELL_HEX.step;
    for (const c of row.cells) {
      if (!c.found || y > BOTTOM - LINE) continue;
      y = this.paragraph(g, `· ${c.where}`, x, y, w, P.faded);
    }
  }

  // ---- Tablillas
  drawTablets(g) {
    this.cells.forEach((cell, i) => {
      const cx = GRID.x + (i % GRID.cols) * GRID.cell;
      const cy = GRID.y + Math.floor(i / GRID.cols) * GRID.cell;
      const sel = i === this.sel.tablets;
      g.fillStyle = sel ? P.selectEdge : P.paperEdge;
      g.fillRect(cx, cy, 56, 56);
      g.fillStyle = sel ? P.select : cell.owned ? '#faf3de' : '#e6dbbd';
      g.fillRect(cx + 2, cy + 2, 52, 52);
      if (cell.tablet.arceusPhase) { g.fillStyle = '#d8c89a'; g.fillRect(cx + 2, cy + 50, 52, 4); }
      const im = iconImage(cell.tablet.id);
      if (im) g.drawImage(cell.owned ? im : silhouette(im), cx + 4, cy + 4);
    });
    const cell = this.cells[this.sel.tablets];
    if (!cell) return;
    const t = cell.tablet;
    const x = GRID.x;
    const y = GRID.y + 3 * GRID.cell + 6;
    if (!cell.owned) {
      txt(g, '???', x, y, P.faded);
      txt(g, t.arceusPhase ? 'La conserva el que duerme.' : 'Sin encontrar.', x, y + LINE + 2, P.faded);
      return;
    }
    txt(g, t.name, x, y, P.ink);
    const info = t.arc ? `${t.arc} · Crónica ${romanNumeral(t.chronicle)}` : `Arceus · fase ${t.arceusPhase}`;
    txt(g, info, x + 372, y, P.sepia, 'note', { align: 'right' });
    txt(g, cropText(t.place, 372, 'note'), x, y + LINE + 2, P.blue);
  }
}

/** Abre la Libreta de pistas. opts: { tab: 'clues'|'prophecy'|'chronicle'|'tablets' } */
export async function open(opts = {}) {
  if (!engine.state) throw new Error('No hay partida en curso.');
  return openScene(new CluesScene(), opts);
}
