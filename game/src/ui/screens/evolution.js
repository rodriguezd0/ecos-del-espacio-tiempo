// Secuencia de evolución: siluetas que alternan cada vez más rápido entre la forma actual y la nueva,
// destello final y mensajes clásicos. B cancela. No modifica datos (lo hace quien llama).
import { engine, SCREEN_W, SCREEN_H } from '../../core/engine.js';
import { ScreenScene, openScene } from '../core/uiScene.js';
import { preload } from '../core/images.js';
import { drawPokemonSprite, preloadPokemon } from '../core/pokemonGfx.js';
import { COMMON_GFX } from '../core/widgets.js';
import { displayName } from '../../battle/core/pokemon.js';
import { preloadDialogGfx } from '../message/messageScenes.js';
import { playCry, playME, sfx } from '../core/sound.js';
import { message } from './common.js';

const ANIM_FRAMES = 360;
const CANCEL_FROM = 30;
const FLASH_FRAMES = 40;

/** Silueta a mostrar en el frame f de la animación: 0 = original, 1 = evolución (alternancia acelerada). */
export function evolutionMix(f) {
  const k = Math.min(1, f / ANIM_FRAMES);
  const period = 60 - 52 * k; // cada vez más rápido
  const phase = (f / period) % 2;
  return phase < 1 ? 0 : 1;
}

class EvolutionScene extends ScreenScene {
  constructor(pokemon, target, opts) {
    super();
    this.pkmn = pokemon;
    this.target = target;
    this.opts = opts;
    this.stage = 'intro'; // intro → anim → flash → done
    this.anim = 0;
    this.flash = 0;
    this.waiting = null;
  }

  get evolved() {
    return { ...this.pkmn, species: this.target, form: 0 };
  }

  async enter() {
    await Promise.all([preload(COMMON_GFX), preloadPokemon([this.pkmn, this.evolved], { sprites: true }), preloadDialogGfx()]);
  }

  /** Lanza la secuencia cuando termina el fundido de entrada. */
  tick() {
    if (this.stage === 'intro') {
      this.stage = 'busy';
      this.sequence().catch((err) => engine.reportError(err));
      return;
    }
    if (this.stage === 'anim') {
      this.anim += 1;
      if (this.anim > CANCEL_FROM && this.input.pressed('B') && !this.opts.noCancel) { sfx.cancel(); this.resolveAnim(false); return; }
      if (this.anim >= ANIM_FRAMES) { this.stage = 'flash'; this.flash = 0; }
    } else if (this.stage === 'flash') {
      this.flash += 1;
      if (this.flash >= FLASH_FRAMES) this.resolveAnim(true);
    }
  }

  resolveAnim(ok) {
    this.stage = ok ? 'evolved' : 'cancelled';
    const r = this.waiting;
    this.waiting = null;
    if (r) r(ok);
  }

  async sequence() {
    const db = engine.data;
    const name = displayName(db, this.pkmn);
    const newName = db.species[this.target]?.name || this.target;
    playCry(this.pkmn.species, this.pkmn.form);
    await message(`¿Qué? ¡${name} está evolucionando!`);
    const ok = await new Promise((resolve) => { this.waiting = resolve; this.stage = 'anim'; this.anim = 0; });
    if (!ok) {
      await message(`¡Anda! ¡${name} no ha evolucionado!`);
      this.finish(false);
      return;
    }
    playCry(this.target, 0);
    playME('Evolution success');
    await message(`¡Enhorabuena! ¡Tu ${name} ha evolucionado en ${newName}!`);
    this.finish(true);
  }

  draw(g) {
    // Fondo: degradado nocturno con haz de luz central
    const grd = g.createLinearGradient(0, 0, 0, SCREEN_H);
    grd.addColorStop(0, '#101828');
    grd.addColorStop(1, '#283850');
    g.fillStyle = grd;
    g.fillRect(0, 0, SCREEN_W, SCREEN_H);
    const cx = SCREEN_W / 2;
    const cy = 150;
    const glow = this.stage === 'anim' ? 0.25 + 0.5 * Math.min(1, this.anim / ANIM_FRAMES) : 0.2;
    const rg = g.createRadialGradient(cx, cy, 10, cx, cy, 170);
    rg.addColorStop(0, `rgba(220,240,255,${glow})`);
    rg.addColorStop(1, 'rgba(220,240,255,0)');
    g.fillStyle = rg;
    g.fillRect(0, 0, SCREEN_W, SCREEN_H);
    this.drawRays(g, cx, cy);
    if (this.stage === 'anim') {
      const which = evolutionMix(this.anim) ? this.evolved : this.pkmn;
      drawPokemonSprite(g, which, cx, cy, { frame: 0, silhouette: '#f8f8ff' });
    } else if (this.stage === 'flash') {
      drawPokemonSprite(g, this.evolved, cx, cy, { t: this.t });
      g.fillStyle = `rgba(255,255,255,${1 - this.flash / FLASH_FRAMES})`;
      g.fillRect(0, 0, SCREEN_W, SCREEN_H);
    } else {
      drawPokemonSprite(g, this.stage === 'evolved' ? this.evolved : this.pkmn, cx, cy, { t: this.t });
    }
  }

  drawRays(g, cx, cy) {
    if (this.stage !== 'anim') return;
    const n = 12;
    const a0 = this.anim / 90;
    g.save();
    g.globalAlpha = 0.12 + 0.2 * (this.anim / ANIM_FRAMES);
    g.fillStyle = '#e8f4ff';
    for (let i = 0; i < n; i++) {
      const a = a0 + (i * Math.PI * 2) / n;
      g.beginPath();
      g.moveTo(cx, cy);
      g.lineTo(cx + Math.cos(a) * 400, cy + Math.sin(a) * 400);
      g.lineTo(cx + Math.cos(a + 0.08) * 400, cy + Math.sin(a + 0.08) * 400);
      g.closePath();
      g.fill();
    }
    g.restore();
  }
}

/** Secuencia de evolución de `pokemon` a `target`. Devuelve true si evolucionó. opts: { noCancel } */
export async function open(pokemon, target, opts = {}) {
  if (!engine.data.species[target]) throw new Error(`Especie de evolución desconocida: ${target}`);
  return openScene(new EvolutionScene(pokemon, target, opts));
}
