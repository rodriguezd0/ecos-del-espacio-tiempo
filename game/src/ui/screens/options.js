// Opciones (como 016_UI_Options.rb): velocidad de texto, volúmenes, modo de encuentros, animaciones y
// estilo de combate, seguidor y marco de ventana. Los cambios se aplican al momento (vista previa).
import { SCREEN_W, SCREEN_H } from '../../core/engine.js';
import { ScreenScene, openScene } from '../core/uiScene.js';
import { preload } from '../core/images.js';
import { drawText, textWidth } from '../core/text.js';
import { drawWindow, isDarkSkin, skinBorders, FRAMES, preloadSkins } from '../core/windowskin.js';
import { messageColors } from '../core/colors.js';
import { currentOptions, setOption, menuSkin } from '../core/options.js';
import { drawSelArrow, COMMON_GFX } from '../core/widgets.js';
import { MessageBox } from '../message/messageBox.js';
import { preloadDialogGfx } from '../message/messageScenes.js';
import { sfx } from '../core/sound.js';

const SEL_NAME = ['#f8b050', '#8e5a00'];
const SEL_VALUE = ['#f88880', '#8b190c'];
const ROW_H = 32;

/** Definición de las opciones (pura sobre el objeto de opciones). */
export const OPTION_ROWS = [
  { key: 'textSpeed', name: 'Vel. del texto', type: 'enum', values: ['Lenta', 'Media', 'Rápida', 'Instantánea'],
    desc: 'Elige la velocidad a la que aparece el texto en los diálogos.' },
  { key: 'bgmVolume', name: 'Vol. música', type: 'slider', scale: 100,
    desc: 'Ajusta el volumen de la música de fondo.' },
  { key: 'seVolume', name: 'Vol. efectos', type: 'slider', scale: 100,
    desc: 'Ajusta el volumen de los efectos de sonido y los gritos.' },
  { key: 'encounterMode', name: 'Encuentros', type: 'enum', values: ['Clásicos', 'Visibles'], ids: ['classic', 'visible'],
    desc: 'Clásicos: aparecen al caminar por la hierba. Visibles: los Pokémon se ven en el mapa.' },
  { key: 'battleScene', name: 'Animaciones', type: 'enum', values: ['Sí', 'No'], ids: [true, false],
    desc: 'Muestra u omite las animaciones de los movimientos en combate.' },
  { key: 'battleStyle', name: 'Estilo combate', type: 'enum', values: ['Cambio', 'Fijo'], ids: ['switch', 'set'],
    desc: 'Cambio: se ofrece cambiar de Pokémon cuando el rival saca otro. Fijo: no se ofrece.' },
  { key: 'followerEnabled', name: 'Seguidor', type: 'enum', values: ['Sí', 'No'], ids: [true, false],
    desc: 'El primer Pokémon del equipo te sigue por el mapa.' },
  { key: 'frame', name: 'Marco', type: 'frame',
    desc: 'Elige el marco de las ventanas y de los diálogos.' },
];

/** Índice/valor actual de una fila. */
export function rowValue(row, opts) {
  const v = opts[row.key];
  if (row.type === 'enum') {
    const i = row.ids ? row.ids.indexOf(v) : Number(v);
    return i < 0 ? 0 : i;
  }
  if (row.type === 'slider') return Math.round((Number(v) || 0) * row.scale);
  return Number(v) || 0;
}

/** Nuevo valor para guardar tras mover a la izquierda/derecha. */
export function stepRow(row, opts, dir) {
  const cur = rowValue(row, opts);
  if (row.type === 'enum') {
    const n = row.values.length;
    const i = (cur + dir + n) % n;
    return row.ids ? row.ids[i] : i;
  }
  if (row.type === 'slider') return Math.max(0, Math.min(row.scale, cur + dir * 5)) / row.scale;
  const n = FRAMES.length;
  return (cur + dir + n) % n;
}

class OptionsScene extends ScreenScene {
  async enter() {
    this.index = 0;
    this.box = new MessageBox({ lines: 2 });
    await Promise.all([preloadSkins(), preloadDialogGfx(), preload(COMMON_GFX)]);
    this.describe();
  }

  describe() {
    const row = OPTION_ROWS[this.index];
    const extra = row.type === 'frame' ? ` (${FRAMES[rowValue(row, currentOptions())]?.name || ''})` : '';
    this.box.show(row.desc + extra, { keepOpen: true });
  }

  tick() {
    const inp = this.input;
    this.box.update(null);
    const n = OPTION_ROWS.length + 1; // + Cerrar
    if (inp.repeat('UP')) { this.index = (this.index - 1 + n) % n; sfx.cursor(); this.onRow(); }
    else if (inp.repeat('DOWN')) { this.index = (this.index + 1) % n; sfx.cursor(); this.onRow(); }
    else if (inp.repeat('LEFT') || inp.repeat('RIGHT')) {
      const row = OPTION_ROWS[this.index];
      if (!row) return;
      const dir = inp.repeat('LEFT') ? -1 : 1;
      setOption(row.key, stepRow(row, currentOptions(), dir));
      sfx.cursor();
      this.describe();
    } else if (inp.pressed('B') || (inp.pressed('A') && this.index === OPTION_ROWS.length)) {
      sfx.cancel();
      this.finish(currentOptions());
    }
  }

  onRow() {
    if (this.index < OPTION_ROWS.length) this.describe();
    else this.box.show('Guardar los cambios y salir.', { keepOpen: true });
  }

  draw(g) {
    g.fillStyle = '#c0c8d0';
    g.fillRect(0, 0, SCREEN_W, SCREEN_H);
    g.fillStyle = '#b4bec8';
    for (let y = 0; y < SCREEN_H; y += 8) g.fillRect(0, y, SCREEN_W, 4);
    const skin = menuSkin();
    const b = skinBorders(skin);
    const dark = isDarkSkin(skin);
    const [base, shadow] = messageColors(null, dark);
    drawWindow(g, skin, 0, -16, SCREEN_W, 64);
    drawText(g, 'Opciones', b.left + 4, 8, { color: base, shadow });
    const top = 32;
    const listH = SCREEN_H - top - 96;
    drawWindow(g, skin, 0, top, SCREEN_W, listH);
    const x0 = b.left + 16;
    const nameW = Math.floor(((SCREEN_W - b.left - b.right) * 9) / 20);
    const opts = currentOptions();
    const rows = [...OPTION_ROWS, { name: 'Cerrar', type: 'close' }];
    const visible = Math.floor((listH - b.top - b.bottom) / ROW_H);
    const first = Math.max(0, Math.min(this.index - visible + 1, rows.length - visible));
    rows.slice(first, first + visible).forEach((row, r) => {
      const i = first + r;
      const y = top + b.top + r * ROW_H;
      const sel = i === this.index;
      if (sel) drawSelArrow(g, b.left, y, dark);
      const nc = sel ? SEL_NAME : [base, shadow];
      drawText(g, row.name, x0, y - 2, { color: nc[0], shadow: nc[1] });
      if (row.type !== 'close') this.drawValue(g, row, opts, x0 + nameW, SCREEN_W - b.right - 8, y - 2, [base, shadow]);
    });
    this.box.draw(g);
  }

  drawValue(g, row, opts, x, right, y, col) {
    const v = rowValue(row, opts);
    if (row.type === 'enum') {
      const total = row.values.reduce((a, s) => a + textWidth(s), 0);
      const space = row.values.length > 1 ? (right - x - total) / (row.values.length - 1) : 0;
      if (space < 12) {
        // No caben todos: solo el valor actual entre flechas.
        drawText(g, '<', x, y, { color: col[0], shadow: col[1] });
        drawText(g, row.values[v], (x + right) / 2, y, { color: SEL_VALUE[0], shadow: SEL_VALUE[1], align: 'center' });
        drawText(g, '>', right, y, { color: col[0], shadow: col[1], align: 'right' });
        return;
      }
      let cx = x;
      row.values.forEach((s, i) => {
        const c = i === v ? SEL_VALUE : col;
        drawText(g, s, cx, y, { color: c[0], shadow: c[1] });
        cx += textWidth(s) + Math.max(8, space);
      });
    } else if (row.type === 'slider') {
      const label = String(v);
      const barW = right - x - textWidth('100') - 16;
      g.fillStyle = col[1];
      g.fillRect(x, y + 14, barW, 4);
      g.fillStyle = SEL_VALUE[0];
      g.fillRect(x + Math.round((barW - 8) * (v / row.scale)), y + 6, 8, 20);
      drawText(g, label, right, y, { color: SEL_VALUE[0], shadow: SEL_VALUE[1], align: 'right' });
    } else {
      const f = FRAMES[v];
      drawText(g, `${v + 1}  ${f ? f.name : ''}`, x, y, { color: SEL_VALUE[0], shadow: SEL_VALUE[1] });
    }
  }
}

/** Abre las opciones. Devuelve las opciones resultantes. */
export async function open() {
  return openScene(new OptionsScene());
}
