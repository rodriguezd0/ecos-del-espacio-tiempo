// Visor de sprites de personajes (?scene=sprites): charsets animados en 4 direcciones sobre césped de
// Añil, desfile de todo el elenco a escala de juego y sprites de combate. Todo el arte propio es
// PROVISIONAL (D30). Con E (R) se alterna con las clases genéricas de entrenador de Añil
// (content/anilClasses.js): charset + sprite de combate de cada alias 'anil:<clase>'.
// Controles: ←/→ personaje · Z (A) caminar/correr · X (B) zoom ×1/×2 · C (START) combate · E Axis/Añil.
// Parámetros: &char=<id> · &run · &battle · &anil (empieza en las clases de Añil; &char=<alias>).
import { engine, SCREEN_W, SCREEN_H } from '../core/engine.js';
import { Scene } from '../core/scenes.js';
import { CHARACTERS, frameRect, getCharacter, getBattleSprite } from '../content/characters.js';
import { listAnilClasses } from '../content/anilClasses.js';

const GRASS_TILESET = 'Graphics/Tilesets/Exterior1.png';
const GRASS_RECT = { x: 0, y: 0, w: 128, h: 128 }; // bloque 4×4 de césped del tileset original
const DIRS = [2, 4, 6, 8];
const DIR_NAMES = { 2: 'Abajo', 4: 'Izquierda', 6: 'Derecha', 8: 'Arriba' };
const WALK_FRAMES = 8; // frames lógicos por patrón al caminar (≈ Essentials a 60 Hz)
const RUN_FRAMES = 5;
const TURN_EVERY = 128; // el desfile cambia de dirección cada N frames
const THROW_FRAMES = 7;
const FONT = '"Power Green", monospace';
const FONT_SMALL = '"Power Green Small", "Power Green", monospace';

const PER_PAGE = 16; // desfile: 2 filas de 8

export default class SpriteViewerScene extends Scene {
  async enter(params = {}) {
    this.t = 0;
    this.zoom = 2;
    this.mode = 'walk';
    this.showBattle = false;
    this.errors = [];
    this.axisIds = Object.keys(CHARACTERS).filter((id) => CHARACTERS[id].kind === 'charset' && !CHARACTERS[id].variantOf);
    this.anilIds = listAnilClasses();
    this.anil = params.anil !== undefined;
    this.ids = this.anil ? this.anilIds : this.axisIds;
    const start = this.ids.indexOf(params.char);
    this.index = start >= 0 ? start : 0;
    this.images = new Map();
    this.anilImages = new Map(); // url → HTMLImageElement | null (cargando o fallida)
    const a = engine.assets;
    const loads = Object.keys(CHARACTERS).map(async (id) => {
      try {
        this.images.set(id, await a.image(CHARACTERS[id].file));
      } catch (err) {
        this.errors.push(`${id}: ${err.message}`);
      }
    });
    loads.push(a.image(a.anil(GRASS_TILESET)).then((img) => { this.grass = img; }).catch((err) => {
      this.errors.push(`césped: ${err.message}`);
    }));
    await Promise.all(loads);
    if (params.battle !== undefined) this.showBattle = true;
    if (params.run !== undefined) this.mode = 'run';
  }

  get selectedId() {
    return this.ids[this.index];
  }

  /** Entrada del registro (Axis) o del alias de clase de Añil del índice actual. */
  entryFor(id) {
    return this.anil ? getCharacter(`anil:${id}`) : CHARACTERS[id];
  }

  /** Imagen de una hoja: precargada (Axis) o cargada bajo demanda (Añil). */
  imageFor(id, entry) {
    if (!this.anil) return this.images.get(id);
    const url = entry && entry.file;
    if (!url) return null;
    if (!this.anilImages.has(url)) {
      this.anilImages.set(url, null);
      engine.assets.image(url).then((img) => this.anilImages.set(url, img)).catch((err) => {
        this.errors.push(`${url}: ${err.message}`);
        console.error(`Visor de sprites: no se pudo cargar ${url}`, err);
      });
    }
    return this.anilImages.get(url);
  }

  update() {
    const input = this.engine.input;
    this.t += 1;
    if (input.pressed('R')) {
      this.anil = !this.anil;
      this.ids = this.anil ? this.anilIds : this.axisIds;
      this.index = 0;
    }
    if (!this.ids.length) return;
    if (input.repeat('RIGHT')) this.index = (this.index + 1) % this.ids.length;
    if (input.repeat('LEFT')) this.index = (this.index + this.ids.length - 1) % this.ids.length;
    if (input.pressed('A')) this.mode = this.mode === 'walk' ? 'run' : 'walk';
    if (input.pressed('B')) this.zoom = this.zoom === 2 ? 1 : 2;
    if (input.pressed('START')) this.showBattle = !this.showBattle;
  }

  render() {}

  drawUI(g) {
    g.imageSmoothingEnabled = false;
    this.drawGrass(g);
    if (!this.ids.length) {
      this.text(g, 'No hay personajes registrados.', SCREEN_W / 2, SCREEN_H / 2, { align: 'center' });
      return;
    }
    this.drawHeader(g);
    if (this.showBattle) this.drawBattle(g);
    else this.drawDirections(g);
    this.drawParade(g);
    this.drawFooter(g);
  }

  // ─────────────────────────── partes ───────────────────────────

  drawGrass(g) {
    if (!this.grass) {
      g.fillStyle = '#78B060';
      g.fillRect(0, 0, SCREEN_W, SCREEN_H);
      return;
    }
    const { x, y, w, h } = GRASS_RECT;
    for (let ty = 0; ty < SCREEN_H; ty += h) {
      for (let tx = 0; tx < SCREEN_W; tx += w) g.drawImage(this.grass, x, y, w, h, tx, ty, w, h);
    }
  }

  drawHeader(g) {
    const ch = this.entryFor(this.selectedId);
    g.fillStyle = 'rgba(16, 24, 28, 0.82)';
    g.fillRect(0, 0, SCREEN_W, 42);
    const title = this.anil ? `anil:${this.selectedId} — ${ch.trainerClass} (${ch.name})` : ch.name;
    this.text(g, ellipsis(g, `${this.index + 1}/${this.ids.length}  ${title}`, SCREEN_W - 150, 18), 8, 18, { color: '#FFFFFF' });
    const tag = ch.provisional ? `PROVISIONAL ${ch.decision || ''}`.trim() : 'AÑIL (REFERENCIA)';
    this.text(g, tag, SCREEN_W - 8, 18, { color: ch.provisional ? '#FFB060' : '#B9FF66', align: 'right' });
    this.text(g, ellipsis(g, ch.note || '', SCREEN_W - 16), 8, 36, { color: '#C8D8D0', font: FONT_SMALL, size: 14 });
  }

  /** Personaje seleccionado caminando en las 4 direcciones. */
  drawDirections(g) {
    const id = this.sheetFor(this.selectedId);
    const entry = this.entryFor(id);
    const img = this.imageFor(id, entry);
    const size = 64 * this.zoom;
    const slot = SCREEN_W / 4;
    const top = 48 + (128 - size) / 2;
    DIRS.forEach((dir, i) => {
      const x = i * slot + (slot - size) / 2;
      this.drawFrame(g, entry, img, dir, this.pattern(), x, top, this.zoom);
      this.text(g, DIR_NAMES[dir], i * slot + slot / 2, 190, { align: 'center', color: '#FFFFFF', shadow: true });
    });
    const label = id === this.selectedId ? (this.mode === 'run' ? 'Correr: sin hoja propia (se muestra caminar)' : 'Caminar') : 'Correr';
    this.text(g, label, SCREEN_W / 2, 206, { align: 'center', color: '#F0F0C0', font: FONT_SMALL, size: 14, shadow: true });
  }

  /** Sprites de combate del seleccionado (espalda con lanzamiento, frontal). */
  drawBattle(g) {
    const ch = this.entryFor(this.selectedId);
    const battle = ch.battle || {};
    g.fillStyle = 'rgba(16, 24, 28, 0.55)';
    g.fillRect(0, 44, SCREEN_W, 166);
    const parts = [];
    if (battle.back) parts.push({ id: battle.back, label: 'Espalda (lanzamiento)' });
    if (battle.front) parts.push({ id: battle.front, label: this.anil ? `Frontal (${battle.front.slice(5)})` : 'Frontal' });
    if (!parts.length) {
      this.text(g, 'Sin sprites de combate para este personaje.', SCREEN_W / 2, 130, { align: 'center', color: '#FFFFFF' });
      return;
    }
    const slot = SCREEN_W / parts.length;
    parts.forEach((p, i) => {
      const entry = getBattleSprite(p.id);
      const img = this.anil ? this.imageFor(p.id, entry) : this.images.get(p.id);
      if (!entry || !img) return;
      const cycle = entry.cols > 1 ? Math.floor(this.t / THROW_FRAMES) % (entry.cols + 6) : 0;
      const col = cycle < entry.cols ? cycle : 0;
      const r = frameRect(entry, 2, col, img.width, img.height);
      // Escala entera (×1) para no deformar los píxeles; se alinea por abajo sobre la etiqueta.
      g.drawImage(img, r.x, r.y, r.w, r.h, Math.round(i * slot + (slot - r.w) / 2), 208 - r.h, r.w, r.h);
      this.text(g, p.label, i * slot + 8, 60, { color: '#F0F0C0', font: FONT_SMALL, size: 14, shadow: true });
    });
  }

  /** Todo el elenco a escala de juego (×1), girando juntos. */
  drawParade(g) {
    g.fillStyle = 'rgba(16, 24, 28, 0.35)';
    g.fillRect(0, 214, SCREEN_W, 148);
    const page = Math.floor(this.index / PER_PAGE);
    const pages = Math.ceil(this.ids.length / PER_PAGE);
    const label = pages > 1 ? `En el mapa (escala de juego) · página ${page + 1}/${pages}` : 'En el mapa (escala de juego)';
    this.text(g, label, 8, 230, { color: '#FFFFFF', font: FONT_SMALL, size: 14, shadow: true });
    const dir = DIRS[Math.floor(this.t / TURN_EVERY) % 4];
    const perRow = 8;
    this.ids.slice(page * PER_PAGE, (page + 1) * PER_PAGE).forEach((id, k) => {
      const i = page * PER_PAGE + k;
      const x = (k % perRow) * 64;
      const y = 236 + Math.floor(k / perRow) * 64;
      if (i === this.index) {
        g.strokeStyle = '#B9FF66';
        g.lineWidth = 2;
        g.strokeRect(x + 2, y + 2, 60, 60);
      }
      const entry = this.entryFor(id);
      this.drawFrame(g, entry, this.imageFor(id, entry), dir, this.pattern(WALK_FRAMES), x, y, 1);
    });
  }

  drawFooter(g) {
    g.fillStyle = 'rgba(16, 24, 28, 0.82)';
    g.fillRect(0, SCREEN_H - 20, SCREEN_W, 20);
    const hint = `←/→ personaje · Z andar/correr · X zoom · C combate · E ${this.anil ? 'Axis' : 'clases Añil'}`;
    this.text(g, hint, 8, SCREEN_H - 6, { color: '#C8D8D0', font: FONT_SMALL, size: 14 });
    if (this.errors.length) this.text(g, `Errores: ${this.errors.length} (ver consola)`, SCREEN_W - 8, SCREEN_H - 6, { color: '#FF8080', align: 'right', font: FONT_SMALL, size: 14 });
  }

  // ─────────────────────────── utilidades ───────────────────────────

  /** Hoja a mostrar según el modo (correr si existe). */
  sheetFor(id) {
    if (this.anil) return id;
    const ch = CHARACTERS[id];
    if (this.mode === 'run' && ch.variants && ch.variants.run && CHARACTERS[ch.variants.run]) return ch.variants.run;
    return id;
  }

  pattern(frames = this.mode === 'run' ? RUN_FRAMES : WALK_FRAMES) {
    return Math.floor(this.t / frames) % 4;
  }

  drawFrame(g, entry, img, dir, pattern, x, y, zoom) {
    if (!entry || !img) {
      g.fillStyle = 'rgba(255, 0, 0, 0.4)';
      g.fillRect(x, y, 64 * zoom, 64 * zoom);
      return;
    }
    const r = frameRect(entry, dir, pattern, img.width, img.height);
    g.drawImage(img, r.x, r.y, r.w, r.h, Math.round(x), Math.round(y), r.w * zoom, r.h * zoom);
  }

  text(g, str, x, y, { color = '#FFFFFF', align = 'left', font = FONT, size = 18, shadow = false } = {}) {
    g.font = `${size}px ${font}`;
    g.textAlign = align;
    if (shadow) {
      g.fillStyle = 'rgba(0, 0, 0, 0.7)';
      g.fillText(str, x + 1, y + 1);
    }
    g.fillStyle = color;
    g.fillText(str, x, y);
    g.textAlign = 'left';
  }
}

/** Recorta un texto para que quepa en `maxW` px con la fuente indicada (por defecto la pequeña). */
function ellipsis(g, str, maxW, size = 14) {
  g.font = size === 14 ? `14px ${FONT_SMALL}` : `${size}px ${FONT}`;
  if (g.measureText(str).width <= maxW) return str;
  let s = str;
  while (s.length > 1 && g.measureText(`${s}…`).width > maxW) s = s.slice(0, -1);
  return `${s}…`;
}
