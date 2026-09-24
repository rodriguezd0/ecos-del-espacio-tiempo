// Estado de Zygarde (marcador provisional): forma actual, células (100) y núcleos (5) reunidos y
// capacidades recuperadas. Totales según la biblia §8; umbrales y ubicaciones pendientes (D10).
import { engine, SCREEN_W, SCREEN_H } from '../../core/engine.js';
import { ScreenScene, openScene } from '../core/uiScene.js';
import { img, preload } from '../core/images.js';
import { drawText } from '../core/text.js';
import { C } from '../core/colors.js';
import { drawPokemonSprite, preloadPokemon } from '../core/pokemonGfx.js';
import { drawHexOutline, drawHexFilled } from '../message/messageBox.js';
import { sfx } from '../core/sound.js';
import { getCharacter, frameRect } from '../../content/characters.js';

export const TOTAL_CELLS = 100;
export const TOTAL_CORES = 5;

/** Capacidades por forma (biblia §8). La clave coincide con state.zygarde.abilities. */
export const ZYGARDE_ABILITIES = [
  { key: 'run', name: 'Correr', form: '10%' },
  { key: 'ram', name: 'Embestida', form: '10%' },
  { key: 'terrain', name: 'Terreno complicado', form: '10%' },
  { key: 'climb', name: 'Trepar', form: '10%' },
  { key: 'swim', name: 'Nadar', form: '50%' },
  { key: 'detect', name: 'Detección de células', form: '50%' },
  { key: 'dive', name: 'Buceo', form: '50%' },
  { key: 'fly', name: 'Vuelo', form: 'Completa' },
  { key: 'rebuild', name: 'Reconstrucción', form: 'Completa' },
];

const FORMS = {
  core: { name: 'Core', speciesForm: null },
  10: { name: 'Forma 10%', speciesForm: 1 },
  50: { name: 'Forma 50%', speciesForm: 0 },
  complete: { name: 'Forma Completa', speciesForm: 2 },
};

/** Resumen puro del progreso de Zygarde. */
export function zygardeSummary(z = {}) {
  const form = FORMS[z.form] ? z.form : null;
  return {
    form,
    formName: form ? FORMS[form].name : 'Sin forma',
    cells: (z.cells || []).length,
    cores: (z.cores || []).length,
    abilities: ZYGARDE_ABILITIES.map((a) => ({ ...a, unlocked: Boolean(z.abilities?.[a.key]) })),
  };
}

class ZygardeScene extends ScreenScene {
  async enter() {
    this.info = zygardeSummary(engine.state.data.zygarde);
    this.core = getCharacter('zygarde_core');
    const f = this.info.form ? FORMS[this.info.form].speciesForm : null;
    this.sprite = f !== null && f !== undefined ? { species: 'ZYGARDE', form: f } : null;
    await Promise.all([
      this.sprite ? preloadPokemon([this.sprite], { sprites: true }) : Promise.resolve(),
      preload([this.core?.file]),
    ]);
  }

  tick() {
    if (this.input.pressed('B') || this.input.pressed('A')) { sfx.cancel(); this.finish(); }
  }

  draw(g) {
    g.fillStyle = '#07100c';
    g.fillRect(0, 0, SCREEN_W, SCREEN_H);
    // Retícula hexagonal tenue de fondo
    for (let y = 0; y < SCREEN_H + 20; y += 26) {
      for (let x = (y / 26) % 2 ? 15 : 0; x < SCREEN_W + 20; x += 30) drawHexOutline(g, x, y, 9, C.coreEdge, 0.18);
    }
    const i = this.info;
    const green = { color: C.core, shadow: C.coreShadow };
    const dim = { color: '#5f7a55', shadow: '#0c1a10' };
    drawText(g, 'ZYGARDE', 24, 10, green);
    drawText(g, i.formName, 488, 10, { ...green, align: 'right' });
    g.fillStyle = C.coreEdge;
    g.fillRect(16, 44, SCREEN_W - 32, 2);
    this.drawFigure(g, 112, 150);
    // Células: 100 hexágonos pequeños
    drawText(g, `Células  ${i.cells}/${TOTAL_CELLS}`, 232, 56, green);
    for (let k = 0; k < TOTAL_CELLS; k++) {
      const row = Math.floor(k / 20);
      const cx = 246 + (k % 20) * 12 + (row % 2 ? 6 : 0);
      const cy = 98 + row * 11;
      if (k < i.cells) drawHexFilled(g, cx, cy, 5, C.core, 0.75 + 0.25 * Math.sin(this.t / 30 + k));
      else drawHexFilled(g, cx, cy, 5, '#1c3020', 1);
    }
    drawText(g, `Núcleos  ${i.cores}/${TOTAL_CORES}`, 232, 164, green);
    for (let k = 0; k < TOTAL_CORES; k++) {
      const on = k < i.cores;
      drawHexOutline(g, 258 + k * 48, 216, 15, on ? C.core : '#2c4a2a', 1);
      if (on) drawHexFilled(g, 258 + k * 48, 216, 8, C.core, 0.6 + 0.4 * Math.sin(this.t / 25));
    }
    // Capacidades
    drawText(g, 'Capacidades', 24, 246, green);
    i.abilities.forEach((a, k) => {
      const x = 24 + (k % 3) * 160;
      const y = 276 + Math.floor(k / 3) * 26;
      drawText(g, a.unlocked ? a.name : '???', x, y, { ...(a.unlocked ? green : dim), font: 'small' });
    });
    drawText(g, 'Estado provisional: umbrales y ubicaciones pendientes [PROVISIONAL D10]', 256, 364,
      { color: '#8fb88a', shadow: '#0a1a10', align: 'center', font: 'tiny' });
  }

  drawFigure(g, cx, cy) {
    if (this.sprite) { drawPokemonSprite(g, this.sprite, cx, cy, { t: this.t, scale: 2 }); return; }
    const ch = this.core;
    const im = ch ? img(ch.file) : null;
    if (im && this.info.form === 'core') {
      const r = frameRect(ch, 2, Math.floor(this.t / 12) % 4, im.width, im.height);
      g.drawImage(im, r.x, r.y, r.w, r.h, cx - r.w, cy - r.h, r.w * 2, r.h * 2);
      return;
    }
    drawHexOutline(g, cx, cy, 40, C.core, 0.25 + 0.2 * Math.sin(this.t / 40));
    drawText(g, '?', cx, cy - 14, { color: C.core, shadow: C.coreShadow, align: 'center' });
  }
}

/** Abre el estado de Zygarde. */
export async function open() {
  if (!engine.state) throw new Error('No hay partida en curso.');
  return openScene(new ZygardeScene());
}
