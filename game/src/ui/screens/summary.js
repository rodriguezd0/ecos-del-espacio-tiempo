// Datos del Pokémon (portado de 007_UI_Summary.rb de Añil): Información, Notas, Estadísticas (con IV/EV
// opcionales), Movimientos (con detalle y reordenación) y modo "olvidar movimiento".
import { engine } from '../../core/engine.js';
import { ScreenScene, openScene } from '../core/uiScene.js';
import { UI, blit, preload } from '../core/images.js';
import { drawText, drawParagraph } from '../core/text.js';
import { C, ppColors } from '../core/colors.js';
import {
  drawHPBar, drawExpBar, drawStatusIcon, drawGender, drawShiny, drawTypeIcon, drawCategoryIcon, drawItemIcon, COMMON_GFX,
} from '../core/widgets.js';
import { drawPokemonIcon, drawPokemonSprite, preloadPokemon } from '../core/pokemonGfx.js';
import { pokemonView, movesView, natureEffects, characteristic, metText } from '../logic/pokemonInfo.js';
import { formatNumber, pad } from '../logic/format.js';
import { preloadDialogGfx } from '../message/messageScenes.js';
import { playSE, SE, sfx, playCry } from '../core/sound.js';
import { mapName, resolveMapNames } from './common.js';

const S = (n) => UI(`Summary/${n}.png`);
const W = C.white;
const WS = C.whiteShadow;
const B = C.black;
const BS = C.blackShadow;
const PAGE_NAMES = ['INFORMACIÓN', 'NOTAS ENTREN.', 'ESTADÍSTICAS', 'MOVIMIENTOS'];
const STAT_ROWS = [['atk', 'Ataque', 126], ['def', 'Defensa', 158], ['spa', 'At. Esp', 190], ['spd', 'Def. Esp', 222], ['spe', 'Velocidad', 254]];

/** Número en el inventario de Axis (dex_axis.json) o el nacional si no figura. */
export function dexNumber(speciesId) {
  const e = engine.data?.dex?.entries?.find((x) => x.id === speciesId);
  if (e) return pad(e.n, 3);
  const sp = engine.data?.species?.[speciesId];
  return sp ? pad(sp.num, 3) : '???';
}

class SummaryScene extends ScreenScene {
  /**
   * @param {object} pokemon
   * @param {{ party?: object[], index?: number, page?: number, showIVs?: boolean, learnMove?: string }} opts
   */
  constructor(pokemon, opts = {}) {
    super();
    this.opts = opts;
    this.list = opts.party && opts.party.length ? opts.party : [pokemon];
    this.index = Math.max(0, opts.party ? opts.index ?? opts.party.indexOf(pokemon) : 0);
    this.page = opts.learnMove ? 4 : Math.min(4, Math.max(1, opts.page || 1));
    this.showIVs = Boolean(opts.showIVs);
    this.moveMode = Boolean(opts.learnMove); // detalle de movimientos
    this.moveIndex = 0;
    this.preselect = -1;
    this.newMove = opts.learnMove || null;
  }

  get pokemon() {
    return this.list[this.index];
  }

  async enter() {
    const gfx = ['bg_1', 'bg_2', 'bg_3', 'bg_4', 'cursor_move', `icon_ball_${this.pokemon.ball || 'POKEBALL'}`];
    await Promise.all([
      preload([...gfx.map(S), UI('BetterMoveSummary/bg_learnmove.png'), ...COMMON_GFX]),
      preloadPokemon(this.list, { sprites: true }),
      preloadDialogGfx(),
      resolveMapNames(this.list.map((p) => p.metMap)),
    ]);
    if (!this.newMove) playCry(this.pokemon.species, this.pokemon.form);
  }

  tick() {
    const inp = this.input;
    if (this.moveMode) { this.tickMoves(inp); return; }
    if (inp.pressed('B')) { sfx.cancel(); this.finish(this.index); return; }
    if (inp.repeat('LEFT') && this.page > 1) { this.page -= 1; playSE(SE.summaryPage); }
    else if (inp.repeat('RIGHT') && this.page < 4) { this.page += 1; playSE(SE.summaryPage); }
    else if (inp.repeat('UP') && this.list.length > 1) this.changePokemon(-1);
    else if (inp.repeat('DOWN') && this.list.length > 1) this.changePokemon(1);
    else if (inp.pressed('A')) {
      if (this.page === 4 && (this.pokemon.moves || []).length) { sfx.decision(); this.moveMode = true; this.moveIndex = 0; }
      else if (this.page === 3) { sfx.decision(); this.showIVs = !this.showIVs; }
    }
  }

  changePokemon(dir) {
    const n = this.list.length;
    this.index = (this.index + dir + n) % n;
    playSE(SE.cursor);
    playCry(this.pokemon.species, this.pokemon.form);
    const ball = S(`icon_ball_${this.pokemon.ball || 'POKEBALL'}`);
    preload([ball]);
  }

  tickMoves(inp) {
    const count = (this.pokemon.moves || []).length + (this.newMove ? 1 : 0);
    const slots = this.newMove ? 5 : count;
    if (inp.repeat('UP')) { this.moveIndex = (this.moveIndex - 1 + slots) % slots; sfx.cursor(); }
    else if (inp.repeat('DOWN')) { this.moveIndex = (this.moveIndex + 1) % slots; sfx.cursor(); }
    else if (inp.pressed('B')) {
      sfx.cancel();
      if (this.newMove) { this.finish(null); return; }
      if (this.preselect >= 0) { this.preselect = -1; return; }
      this.moveMode = false;
    } else if (inp.pressed('A')) {
      if (this.newMove) {
        sfx.decision();
        this.finish(this.moveIndex >= 4 ? null : this.moveIndex);
        return;
      }
      this.selectMoveForSwap();
    }
  }

  selectMoveForSwap() {
    if (this.preselect < 0) { sfx.decision(); this.preselect = this.moveIndex; return; }
    const a = this.preselect;
    const b = this.moveIndex;
    this.preselect = -1;
    if (a === b) return;
    sfx.decision();
    const p = this.pokemon;
    const moves = p.moves.slice();
    [moves[a], moves[b]] = [moves[b], moves[a]];
    const updated = { ...p, moves };
    const stateIdx = engine.state?.party.indexOf(p) ?? -1;
    if (stateIdx >= 0) engine.state.setPartyMember(stateIdx, updated);
    this.list = this.list.map((x) => (x === p ? updated : x));
  }

  draw(g) {
    const p = this.pokemon;
    const v = pokemonView(engine.data, p);
    if (this.moveMode) { this.drawMoveDetail(g, p, v); return; }
    blit(g, S(`bg_${this.page}`), 0, 0);
    drawPokemonSprite(g, p, 104, 206, { t: this.t });
    blit(g, S(`icon_ball_${p.ball || 'POKEBALL'}`), 14, 60);
    drawStatusIcon(g, p, 124, 100);
    if (p.shiny) drawShiny(g, 2, 134);
    const title = this.page === 3 && this.showIVs ? 'IV / EV' : PAGE_NAMES[this.page - 1];
    drawText(g, title, 26, 22, { color: W, shadow: WS });
    drawText(g, v.name, 46, 68, { color: W, shadow: WS });
    drawText(g, String(v.level), 46, 98, { color: B, shadow: BS });
    drawGender(g, p.gender, 178, 68);
    drawText(g, 'Objeto', 66, 324, { color: W, shadow: WS });
    if (v.item) {
      drawText(g, v.item.name, 16, 358, { color: B, shadow: BS });
      drawItemIcon(g, p.heldItem, 6, 296);
    } else {
      drawText(g, 'Ninguno', 16, 358, { color: C.gray, shadow: C.grayShadow });
    }
    if (this.page === 1) this.drawInfo(g, p, v);
    else if (this.page === 2) this.drawNotes(g, p, v);
    else if (this.page === 3) this.drawStats(g, p, v);
    else this.drawMoves(g, p);
  }

  drawInfo(g, p, v) {
    const dexCol = p.shiny ? [C.red, C.redShadow] : [B, BS];
    drawText(g, 'No. Dex', 238, 86, { color: W, shadow: WS });
    drawText(g, dexNumber(p.species), 435, 86, { color: dexCol[0], shadow: dexCol[1], align: 'center' });
    drawText(g, 'Especie', 238, 118, { color: W, shadow: WS });
    drawText(g, v.speciesName, 435, 118, { color: B, shadow: BS, align: 'center' });
    drawText(g, 'Tipo', 238, 150, { color: W, shadow: WS });
    v.types.forEach((t, i) => drawTypeIcon(g, t, v.types.length === 1 ? 402 : 370 + 66 * i, 146));
    drawText(g, 'EO', 238, 182, { color: W, shadow: WS });
    drawText(g, 'No. ID', 238, 214, { color: W, shadow: WS });
    const ot = p.ot || null;
    if (!ot || !ot.name) {
      drawText(g, 'PRESTADO', 435, 182, { color: B, shadow: BS, align: 'center' });
      drawText(g, '?????', 435, 214, { color: B, shadow: BS, align: 'center' });
    } else {
      const isPlayer = engine.state && ot.id === engine.state.player.id;
      const g2 = isPlayer ? engine.state.player.gender : null;
      const col = g2 === 'M' ? [C.blue, C.blueShadow] : g2 === 'F' ? [C.red, C.redShadow] : [B, BS];
      drawText(g, ot.name, 435, 182, { color: col[0], shadow: col[1], align: 'center' });
      drawText(g, pad(ot.id % 100000, 5), 435, 214, { color: B, shadow: BS, align: 'center' });
    }
    drawText(g, 'Puntos Exp.', 238, 246, { color: W, shadow: WS });
    drawText(g, formatNumber(v.exp), 488, 278, { color: B, shadow: BS, align: 'right' });
    drawText(g, 'Siguiente Nv.', 238, 310, { color: W, shadow: WS });
    drawText(g, formatNumber(v.expToNext), 488, 342, { color: B, shadow: BS, align: 'right' });
    drawExpBar(g, 362, 372, v.expFraction);
  }

  drawNotes(g, p, v) {
    const lines = [];
    if (v.nature) lines.push(`Naturaleza \\c[2]${v.nature.name}\\c[0].`);
    const met = metText(p, mapName(p.metMap));
    lines.push(`\\c[2]${met.where}\\c[0]`, met.how, '', characteristic(p));
    drawFormatted(g, lines, 232, 86);
  }

  drawStats(g, p, v) {
    const eff = natureEffects(p.nature);
    const shadowFor = (s) => (eff.up === s ? C.statUp : eff.down === s ? C.statDown : WS);
    const ivev = (s) => `${p.ivs?.[s] ?? 0} / ${p.evs?.[s] ?? 0}`;
    drawText(g, 'PS', 292, 82, { color: W, shadow: shadowFor('hp'), align: 'center' });
    if (this.showIVs) drawText(g, ivev('hp'), 462, 82, { color: C.blue, shadow: C.blueShadow, align: 'right' });
    else drawText(g, `${v.hp}/${v.maxHp}`, 462, 82, { color: B, shadow: BS, align: 'right' });
    drawHPBar(g, 360, 110, v.hp, v.maxHp, 'summary');
    for (const [stat, label, y] of STAT_ROWS) {
      drawText(g, label, 248, y, { color: W, shadow: shadowFor(stat) });
      if (this.showIVs) drawText(g, ivev(stat), 456, y, { color: C.blue, shadow: C.blueShadow, align: 'right' });
      else drawText(g, String(v.stats[stat]), 456, y, { color: B, shadow: BS, align: 'right' });
    }
    drawText(g, 'Habilidad', 224, 290, { color: W, shadow: WS });
    if (v.ability) {
      drawText(g, v.ability.name, 330, 290, { color: B, shadow: BS });
      drawParagraph(g, v.ability.description || '', 228, 326, 278, { color: B, shadow: BS, font: 'small', lineHeight: 22, maxLines: 2 });
    }
  }

  drawMoves(g, p) {
    let y = 104;
    const moves = movesView(engine.data, p);
    for (let i = 0; i < 4; i++) {
      const m = moves[i];
      if (m) {
        drawTypeIcon(g, m.data.type, 248, y - 4);
        drawText(g, m.data.name, 316, y, { color: B, shadow: BS });
        if (m.total > 0) {
          drawText(g, 'PP', 342, y + 32, { color: B, shadow: BS });
          const [c, s] = ppColors(m.pp, m.total);
          drawText(g, `${m.pp}/${m.total}`, 460, y + 32, { color: c, shadow: s, align: 'right' });
        }
      } else {
        drawText(g, '-', 316, y, { color: B, shadow: BS });
        drawText(g, '--', 442, y + 32, { color: B, shadow: BS, align: 'right' });
      }
      y += 64;
    }
  }

  /** Detalle de movimientos (fondo BW de BetterMoveSummary de Añil: 4 huecos + 1 para el nuevo). */
  drawMoveDetail(g, p, v) {
    const learning = Boolean(this.newMove);
    blit(g, UI('BetterMoveSummary/bg_learnmove.png'), 0, 0);
    drawText(g, 'MOVIMIENTOS', 26, 16, { color: W, shadow: WS });
    drawText(g, 'CATEGORÍA', 12, 124, { color: W, shadow: WS });
    drawText(g, 'POTENCIA', 12, 156, { color: W, shadow: WS });
    drawText(g, 'PRECISIÓN', 12, 188, { color: W, shadow: WS });
    drawPokemonIcon(g, p, 40, 88, { t: this.t, maxHp: v.maxHp });
    v.types.forEach((t, i) => drawTypeIcon(g, t, v.types.length === 1 ? 130 : 96 + 70 * i, 78));
    if (learning) drawText(g, 'Nuevo', 368, 262, { color: W, shadow: WS, font: 'small', align: 'center' });
    const moves = movesView(engine.data, p);
    const extra = learning ? movesView(engine.data, { moves: [{ id: this.newMove, pp: 0, ppUps: 0 }] })[0] : null;
    const list = learning ? [...moves.slice(0, 4), { ...extra, pp: extra.total }] : moves;
    const rowY = (i) => 28 + i * 64 + (i === 4 ? 20 : 0);
    list.forEach((m, i) => {
      if (!m) return;
      const y = rowY(i);
      drawTypeIcon(g, m.data.type, 248, y - 4);
      drawText(g, m.data.name, 316, y, { color: B, shadow: BS });
      if (m.total > 0) {
        drawText(g, 'PP', 342, y + 32, { color: B, shadow: BS });
        const [c, s] = ppColors(m.pp, m.total);
        drawText(g, `${m.pp}/${m.total}`, 460, y + 32, { color: c, shadow: s, align: 'right' });
      }
    });
    // Cursores
    const cy = (i) => rowY(i) - 12;
    if (this.preselect >= 0) blit(g, S('cursor_move'), 240, cy(this.preselect), 0, 64, 234, 64);
    blit(g, S('cursor_move'), 240, cy(this.moveIndex), 0, 0, 234, 64);
    // Detalle del movimiento seleccionado
    const sel = list[this.moveIndex];
    if (!sel) return;
    const d = sel.data;
    const power = d.category === 'Status' || !d.power ? '---' : d.power === 1 ? '???' : String(d.power);
    drawText(g, power, 228, 156, { color: B, shadow: BS, align: 'right' });
    drawText(g, d.accuracy ? `${d.accuracy}%` : '---', 228, 188, { color: B, shadow: BS, align: 'right' });
    drawCategoryIcon(g, d.category, 164, 122);
    drawParagraph(g, d.description || '', 10, 222, 222, { color: B, shadow: BS, maxLines: 5 });
  }
}

/** Texto con códigos de color \c[n] en varias líneas (drawFormattedTextEx simplificado). */
function drawFormatted(g, lines, x, y) {
  let row = 0;
  for (const line of lines) {
    const parts = String(line).split(/\\c\[(\d+)\]/);
    let cx = x;
    let color = [B, BS];
    parts.forEach((part, i) => {
      if (i % 2 === 1) { color = part === '2' ? [C.red, C.redShadow] : [B, BS]; return; }
      if (!part) return;
      cx += drawText(g, part, cx, y + row * 32, { color: color[0], shadow: color[1] });
    });
    row += 1;
  }
}

/**
 * Abre los datos de un Pokémon. Devuelve el índice que se estaba viendo (para sincronizar el equipo).
 */
export async function open(pokemon, opts = {}) {
  if (!pokemon) throw new Error('openSummary: falta el Pokémon.');
  return openScene(new SummaryScene(pokemon, opts));
}

/** Modo "olvidar movimiento": devuelve el índice (0–3) a olvidar o null. */
export async function openForget(pokemon, moveId) {
  if (!engine.data.moves[moveId]) throw new Error(`Movimiento desconocido: ${moveId}`);
  return openScene(new SummaryScene(pokemon, { learnMove: moveId }));
}
