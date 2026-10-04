// Tarjeta de entrenador (como 013_UI_TrainerCard.rb de Añil). Foto: charset actual del protagonista.
import { engine, SCREEN_W, SCREEN_H } from '../../core/engine.js';
import { ScreenScene, openScene } from '../core/uiScene.js';
import { UI, blit, img, preload } from '../core/images.js';
import { drawText } from '../core/text.js';
import { COMMON_GFX } from '../core/widgets.js';
import { playSE, SE, sfx } from '../core/sound.js';
import { formatMoney, formatPlayTime, formatDate, pad } from '../logic/format.js';
import { getCharacter, frameRect } from '../../content/characters.js';

const T = (n) => UI(`Trainer Card/${n}.png`);
const BASE = '#484848';
const SHADOW = '#a0a0a0';

class TrainerCardScene extends ScreenScene {
  async enter() {
    const female = engine.state.player.gender === 'F';
    this.female = female;
    this.character = getCharacter(female ? 'protagonista_f' : 'protagonista_m');
    const photo = this.character ? this.character.file : null;
    await preload([T('bg'), T(female ? 'card_f' : 'card'), T('card'), photo, ...COMMON_GFX]);
    playSE(SE.cardOpen);
  }

  tick() {
    if (this.input.pressed('B') || this.input.pressed('A')) { sfx.cancel(); this.finish(); }
  }

  draw(g) {
    const bg = img(T('bg'));
    if (bg) for (let y = 0; y < SCREEN_H; y += bg.height) for (let x = 0; x < SCREEN_W; x += bg.width) g.drawImage(bg, x, y);
    if (!blit(g, T(this.female ? 'card_f' : 'card'), 0, 0)) blit(g, T('card'), 0, 0);
    const s = engine.state;
    const p = s.player;
    const t = (text, x, y, align = 'left') => drawText(g, text, x, y, { color: BASE, shadow: SHADOW, align });
    t('Nombre', 34, 70); t(p.name || '—', 302, 70, 'right');
    t('No. ID', 332, 70); t(pad(p.id % 100000, 5), 468, 70, 'right');
    t('Dinero', 34, 118); t(formatMoney(p.money), 302, 118, 'right');
    t('Pokédex', 34, 166); t(`${s.caughtCount()}/${s.seenCount()}`, 302, 166, 'right');
    t('Tiempo', 34, 214); t(formatPlayTime(s.data.playTimeFrames), 302, 214, 'right');
    t('Comienzo', 34, 262); t(formatDate(s.data.createdAt).split(' ')[0], 302, 262, 'right');
    this.drawPhoto(g, 330, 104, 144, 144);
  }

  /** Foto: frame frontal del charset del protagonista a ×2; el registro indica su aprobación. */
  drawPhoto(g, x, y, w, h) {
    const ch = this.character;
    const im = ch ? img(ch.file) : null;
    if (im) {
      const r = frameRect(ch, 2, 0, im.width, im.height);
      const scale = 2;
      g.drawImage(im, r.x, r.y, r.w, r.h, Math.round(x + (w - r.w * scale) / 2), Math.round(y + h - r.h * scale), r.w * scale, r.h * scale);
    }
    if (ch?.provisional) drawText(g, '[PROVISIONAL D30]', x + w / 2, y + h - 14, { color: '#f8f8f8', shadow: '#305080', align: 'center', font: 'tiny' });
  }
}

/** Abre la tarjeta de entrenador. */
export async function open() {
  if (!engine.state) throw new Error('No hay partida en curso.');
  return openScene(new TrainerCardScene());
}
