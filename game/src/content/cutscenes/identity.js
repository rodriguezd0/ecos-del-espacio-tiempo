// Pantalla sobria "¿Quién eres?" (guion B01 §0.3): cielo nocturno de Axis, elegir chico/chica viendo los
// sprites caminando (protagonista_m / protagonista_f), confirmar y escribir el nombre (ui.textEntry, 1–10
// caracteres, campo vacío: sin nombre por defecto, D01). Nada de discurso de profesor.
// También el rótulo a pantalla negra "Axis. Tres días después." (CaptionScene).
import { engine, SCREEN_W, SCREEN_H } from '../../core/engine.js';
import { ScreenScene, openScene } from '../../ui/core/uiScene.js';
import { anil, blit, preload } from '../../ui/core/images.js';
import { drawText } from '../../ui/core/text.js';
import { drawHexOutline } from '../../ui/message/messageBox.js';
import { preloadDialogGfx } from '../../ui/message/messageScenes.js';
import { sfx } from '../../ui/core/sound.js';
import { ui } from '../../ui/api.js';
import { getCharacter } from '../characters.js';
import { validateName, NAME_MAX } from '../newgameRules.js';

const SKY = anil('Graphics/Panoramas/cieloNocturno.png');
const OPTIONS = [
  { gender: 'M', id: 'protagonista_m', label: 'Chico', ask: '¿Eres un chico?', x: 176 },
  { gender: 'F', id: 'protagonista_f', label: 'Chica', ask: '¿Eres una chica?', x: 336 },
];
const FRAME = 64;
const WALK_TICKS = 10;
const STAR_COUNT = 26;

function charsetUrl(id) {
  const entry = getCharacter(id);
  return entry?.file || `assets/characters/${id}.png`;
}

class IdentityScene extends ScreenScene {
  constructor() {
    super();
    this.index = 0;
    this.busy = false;
    this.stars = Array.from({ length: STAR_COUNT }, (_, i) => ({ x: (i * 173) % SCREEN_W, y: 8 + ((i * 97) % 200), p: i * 0.9 }));
  }

  async enter() {
    await Promise.all([preload([SKY, ...OPTIONS.map((o) => charsetUrl(o.id))]), preloadDialogGfx()]);
  }

  tick() {
    if (this.busy) return;
    const inp = this.input;
    if (inp.repeat('LEFT') || inp.repeat('RIGHT')) {
      this.index = 1 - this.index;
      sfx.cursor();
      return;
    }
    if (inp.pressed('A')) {
      sfx.decision();
      this.busy = true;
      this.decide().catch((err) => { engine.reportError(err); this.busy = false; });
    }
  }

  async decide() {
    const opt = OPTIONS[this.index];
    if (!(await ui.confirm(opt.ask))) { this.busy = false; return; }
    const name = await askName(opt.gender);
    if (!name) { this.busy = false; return; }
    this.finish({ gender: opt.gender, name });
  }

  draw(g) {
    g.fillStyle = '#050a18';
    g.fillRect(0, 0, SCREEN_W, SCREEN_H);
    blit(g, SKY, -72, -34);
    g.fillStyle = 'rgba(4,8,22,0.45)';
    g.fillRect(0, 0, SCREEN_W, SCREEN_H);
    for (const s of this.stars) {
      const a = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(this.t / 40 + s.p));
      g.fillStyle = `rgba(230,240,255,${a.toFixed(2)})`;
      g.fillRect(s.x, s.y, 2, 2);
    }
    drawText(g, '¿Quién eres?', SCREEN_W / 2, 34, { align: 'center', color: '#f0f4ff', shadow: '#10182c' });
    OPTIONS.forEach((o, i) => this.drawOption(g, o, i === this.index));
    drawText(g, '← →: elegir · A: aceptar', SCREEN_W / 2, SCREEN_H - 26, { align: 'center', color: '#c8d0e8', shadow: '#10182c', font: 'tiny' });
  }

  drawOption(g, o, selected) {
    const cx = o.x;
    const feetY = 250;
    if (selected) {
      const a = 0.55 + 0.25 * Math.sin(this.t / 18);
      drawHexOutline(g, cx, feetY - 4, 46, '#b9ff66', a);
      drawHexOutline(g, cx, feetY - 4, 38, '#b9ff66', a * 0.5);
    }
    g.fillStyle = 'rgba(0,0,0,0.35)';
    g.fillRect(cx - 34, feetY - 6, 68, 8);
    const pattern = selected ? Math.floor(this.t / WALK_TICKS) % 4 : 0;
    g.save();
    g.globalAlpha = selected ? 1 : 0.45;
    const img = blitFrame(g, charsetUrl(o.id), pattern, cx - FRAME, feetY - FRAME * 2 + 6);
    if (!img) drawText(g, '?', cx, feetY - 80, { align: 'center', color: '#fff', shadow: '#000' });
    g.restore();
    drawText(g, o.label, cx, feetY + 16, { align: 'center', color: selected ? '#f0f4ff' : '#8890a8', shadow: '#10182c' });
  }
}

/** Dibuja el fotograma (dirección abajo, patrón) de un charset 4×4 ampliado ×2. */
function blitFrame(g, url, pattern, x, y) {
  return blit(g, url, x, y, pattern * FRAME, 0, FRAME, FRAME, 2);
}

/** Pide el nombre hasta que sea válido y el jugador lo confirme. Devuelve el nombre o null si vuelve atrás. */
async function askName(gender) {
  for (let guard = 0; guard < 50; guard++) {
    const raw = await ui.textEntry({ title: '¿Cómo te llamas?', maxLength: NAME_MAX, initial: '', gender });
    const v = validateName(raw);
    if (!v.ok) {
      await ui.message(v.error);
      if (!(await ui.confirm('¿Quieres escribir tu nombre?'))) return null;
      continue;
    }
    if (await ui.confirm(`Te llamas ${v.name}. ¿Es correcto?`)) return v.name;
  }
  return null;
}

/** Abre "¿Quién eres?" → { gender: 'M'|'F', name }. */
export function chooseIdentity() {
  return openScene(new IdentityScene());
}

// ───────────────────────────── Rótulo a pantalla negra ─────────────────────────────

class CaptionScene extends ScreenScene {
  constructor(text, { hold = 150, fade = 40 } = {}) {
    super();
    this.text = text;
    this.hold = hold;
    this.fadeFrames = fade;
    this.k = 0;
  }

  tick() {
    this.k += 1;
    if (this.k > this.fadeFrames && this.input.pressed('A')) this.k = Math.max(this.k, this.fadeFrames + this.hold);
    if (this.k >= this.fadeFrames * 2 + this.hold) this.finish(true);
  }

  draw(g) {
    g.fillStyle = '#000';
    g.fillRect(0, 0, SCREEN_W, SCREEN_H);
    const f = this.fadeFrames;
    let a = 1;
    if (this.k < f) a = this.k / f;
    else if (this.k > f + this.hold) a = Math.max(0, 1 - (this.k - f - this.hold) / f);
    drawText(g, this.text, SCREEN_W / 2, SCREEN_H / 2 - 16, { align: 'center', color: '#f0f0f8', shadow: '#202030', alpha: a });
  }
}

/** Muestra un rótulo centrado sobre negro (se puede adelantar con A). */
export function showCaption(text, opts) {
  return openScene(new CaptionScene(text, opts));
}
