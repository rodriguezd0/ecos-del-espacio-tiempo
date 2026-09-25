// Guardar / Cargar partida con 3 ranuras + exportar/importar archivo (core/state.js SaveSystem).
// Estética del menú de carga de Añil (Graphics/UI/Load: panel grande de partida y paneles pequeños).
import { engine } from '../../core/engine.js';
import { SaveSystem, SAVE_SLOTS } from '../../core/state.js';
import { ScreenScene, openScene } from '../core/uiScene.js';
import { UI, blit, preload } from '../core/images.js';
import { drawText } from '../core/text.js';
import { drawScrollArrow, COMMON_GFX } from '../core/widgets.js';
import { drawPokemonIcon, preloadPokemon } from '../core/pokemonGfx.js';
import { preloadDialogGfx } from '../message/messageScenes.js';
import { playSE, playME, SE, sfx } from '../core/sound.js';
import { formatPlayTime, formatDate } from '../logic/format.js';
import { message, confirm, showCommands, mapName, resolveMapNames } from './common.js';
import { pickFile } from '../core/filePicker.js';

const L = (n) => UI(`Load/${n}.png`);
const TEXT = ['#e8e8e8', '#888888'];
const MALE = ['#38a0f8', '#3868a8'];
const FEMALE = ['#f04858', '#a04040'];
const LAST_SLOT_KEY = 'ecos.lastSlot';

function lastSlot() {
  try {
    return Math.min(SAVE_SLOTS, Math.max(1, Number(localStorage.getItem(LAST_SLOT_KEY)) || 1));
  } catch {
    return 1;
  }
}
function rememberSlot(slot) {
  try { localStorage.setItem(LAST_SLOT_KEY, String(slot)); } catch { /* sin almacenamiento */ }
}


class SaveLoadScene extends ScreenScene {
  constructor(opts) {
    super();
    this.mode = opts.mode === 'load' ? 'load' : 'save';
    this.slot = lastSlot();
    this.row = 0; // 0 = panel de ranura, 1.. = paneles pequeños
    this.busy = false;
  }

  get smallPanels() {
    return this.mode === 'load' ? ['Importar desde archivo', 'Volver'] : ['Exportar a archivo', 'Volver'];
  }

  async enter() {
    this.refreshList();
    const party = this.slots.flatMap((s) => (s && !s.corrupt ? s.party : []));
    const maps = this.slots.map((s) => s && s.mapId);
    await Promise.all([
      preload([L('bg'), L('panels'), ...COMMON_GFX]), preloadPokemon(party), preloadDialogGfx(), resolveMapNames(maps),
    ]);
  }

  refreshList() {
    this.slots = SaveSystem.list();
  }

  get info() {
    return this.slots[this.slot - 1];
  }

  tick() {
    if (this.busy) return;
    const inp = this.input;
    const rows = 1 + this.smallPanels.length;
    if (inp.repeat('UP')) { this.row = (this.row - 1 + rows) % rows; sfx.cursor(); }
    else if (inp.repeat('DOWN')) { this.row = (this.row + 1) % rows; sfx.cursor(); }
    else if (this.row === 0 && (inp.repeat('LEFT') || inp.repeat('RIGHT'))) {
      const d = inp.repeat('LEFT') ? -1 : 1;
      this.slot = ((this.slot - 1 + d + SAVE_SLOTS) % SAVE_SLOTS) + 1;
      sfx.cursor();
    } else if (inp.pressed('B')) {
      sfx.cancel();
      this.finish(this.mode === 'load' ? null : false);
    } else if (inp.pressed('A')) {
      sfx.decision();
      this.run(() => this.activate());
    }
  }

  async run(fn) {
    this.busy = true;
    try {
      await fn();
    } catch (err) {
      console.error(err);
      await message(`Error: ${err.message}`);
    }
    this.busy = false;
  }

  async activate() {
    const small = this.row > 0 ? this.smallPanels[this.row - 1] : null;
    if (small === 'Volver') { this.finish(this.mode === 'load' ? null : false); return; }
    if (small === 'Importar desde archivo') { await this.importFile(); return; }
    if (small === 'Exportar a archivo') { SaveSystem.exportFile(engine.state, `ecos_${engine.state.player.name || 'partida'}.json`); await message('Se ha descargado el archivo de la partida.'); return; }
    if (this.mode === 'save') await this.saveToSlot();
    else await this.slotMenu();
  }

  async saveToSlot() {
    const info = this.info;
    if (info && !(await confirm(`La ranura ${this.slot} ya contiene una partida. ¿Quieres sobrescribirla?`))) return;
    if (!info && !(await confirm(`¿Quieres guardar la partida en la ranura ${this.slot}?`))) return;
    playSE(SE.save);
    try {
      SaveSystem.save(this.slot, engine.state);
    } catch (err) {
      console.error('[ui] Guardado fallido', err);
      await message('El guardado ha fallado. Puede que el almacenamiento del navegador esté lleno o desactivado.');
      return;
    }
    rememberSlot(this.slot);
    this.refreshList();
    playME('GUI save game');
    await message(`${engine.state.player.name} guardó la partida.`, { auto: 50 });
    this.finish(true);
  }

  async slotMenu() {
    const info = this.info;
    if (!info) { sfx.buzzer(); await message('Esta ranura está vacía.'); return; }
    if (info.corrupt) {
      await message('Los datos de esta ranura están dañados.');
      if (await confirm('¿Quieres borrarlos?')) { SaveSystem.remove(this.slot); this.refreshList(); }
      return;
    }
    const c = await showCommands(['Cargar', 'Exportar', 'Borrar', 'Cancelar']);
    if (c === 0) {
      const state = SaveSystem.load(this.slot);
      if (!state) { await message('No se pudo cargar la partida.'); return; }
      rememberSlot(this.slot);
      this.finish(state);
    } else if (c === 1) {
      const state = SaveSystem.load(this.slot);
      if (state) SaveSystem.exportFile(state, `ecos_ranura${this.slot}.json`);
      await message('Se ha descargado el archivo de la partida.');
    } else if (c === 2) {
      if (await confirm(`¿Seguro que quieres borrar la partida de la ranura ${this.slot}? No se puede deshacer.`)) {
        SaveSystem.remove(this.slot);
        this.refreshList();
        await message('Partida borrada.');
      }
    }
  }

  async importFile() {
    const file = await pickFile({ accept: '.json,application/json' });
    if (!file) return;
    let state;
    try {
      state = await SaveSystem.importFile(file);
    } catch (err) {
      await message(`No se pudo importar: ${err.message}`);
      return;
    }
    await message(`Partida de ${state.player.name} importada.`);
    this.finish(state);
  }

  draw(g) {
    blit(g, L('bg'), 0, 0);
    drawText(g, this.mode === 'load' ? 'CARGAR PARTIDA' : 'GUARDAR PARTIDA', 256, 2, { align: 'center', color: '#f8f8f8', shadow: '#205060' });
    this.drawSlotPanel(g, 48, 32, this.row === 0);
    this.smallPanels.forEach((t, i) => {
      const y = 32 + 224 + i * 48;
      const sel = this.row === i + 1;
      blit(g, L('panels'), 48, y, 0, 444 + (sel ? 46 : 0), 408, 46);
      drawText(g, t, 48 + 32, y + 14, { color: TEXT[0], shadow: TEXT[1] });
    });
    if (this.row === 0) {
      drawScrollArrow(g, 'left', 10, 130, this.t);
      drawScrollArrow(g, 'right', 462, 130, this.t);
    }
  }

  drawSlotPanel(g, x, y, sel) {
    blit(g, L('panels'), x, y, 0, sel ? 222 : 0, 408, 222);
    const info = this.info;
    const t = (s, px, py, align = 'left', col = TEXT) => drawText(g, s, x + px, y + py, { color: col[0], shadow: col[1], align });
    t(`Ranura ${this.slot}`, 32, 16);
    if (!info) { t('— Vacía —', 204, 96, 'center'); return; }
    if (info.corrupt) { t('Datos dañados', 204, 96, 'center', FEMALE); return; }
    t(mapName(info.mapId) || '', 386, 16, 'right');
    t(info.name || '???', 112, 70, 'left', info.gender === 'F' ? FEMALE : MALE);
    t('Pokédex:', 32, 118);
    t(String(info.dexCaught ?? 0), 206, 118, 'right');
    t('Tiempo:', 32, 150);
    t(formatPlayTime(info.playTimeFrames), 206, 150, 'right');
    drawText(g, formatDate(info.savedAt), x + 32, y + 184, { color: TEXT[0], shadow: TEXT[1], font: 'small' });
    (info.party || []).forEach((p, i) => {
      drawPokemonIcon(g, { ...p, hp: 1 }, 334 + 66 * (i % 2), 112 + 50 * Math.floor(i / 2), { t: this.t });
    });
  }
}

/** Abre guardar (devuelve true si guardó) o cargar (devuelve un GameState o null). opts.mode: 'save'|'load'. */
export async function open(opts = {}) {
  if (opts.mode !== 'load' && !engine.state) throw new Error('No hay partida que guardar.');
  return openScene(new SaveLoadScene(opts));
}
