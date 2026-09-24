// Jukebox de desarrollo (?scene=audio): recorre BGM/ME/SE/gritos de Añil y el catálogo semántico.
// Parámetros de URL: tab=catalog|bgm|me|se|cries · play=<nombre> (selecciona y reproduce)
//                    seek=loop (salta 4 s antes del final del bucle) · autounlock (activa el audio sin gesto)
import { engine } from '../../core/engine.js';
import { Scene } from '../../core/scenes.js';
import { catalogList } from '../catalog.js';
import { listNames } from '../resolve.js';
import { drawJukebox, loopBadge, fmtTime, LIST } from './jukeboxView.js';

const TABS = [
  { id: 'catalog', label: 'Catálogo' },
  { id: 'bgm', label: 'BGM' },
  { id: 'me', label: 'ME' },
  { id: 'se', label: 'SE' },
  { id: 'cries', label: 'Gritos' },
];
const SEEK_BEFORE_LOOP_END = 4; // s
const FAST_SCROLL = 100;

function catalogItems() {
  return catalogList().map((e) => ({
    kind: e.kind,
    name: e.id,
    label: e.id,
    kindColor: e.kind,
    badge: [e.kind.toUpperCase(), '#7f93a3'],
    entry: e,
  }));
}

export default class JukeboxScene extends Scene {
  async enter(params = {}) {
    this.audio = engine.audio;
    if (!this.audio) throw new Error('engine.audio no está inicializado');
    if ('autounlock' in params) this.audio.unlock();
    await this.audio.ready;
    this.lists = {};
    this.state = TABS.map(() => ({ cursor: 0, scroll: 0 }));
    this.tab = Math.max(0, TABS.findIndex((t) => t.id === params.tab));
    this.banner = '';
    this.bannerFrames = 0;
    if (params.play) this.selectAndPlay(params.play, params.seek === 'loop');
  }

  itemsFor(tabIndex) {
    const id = TABS[tabIndex].id;
    if (!this.lists[id]) this.lists[id] = this.buildList(id);
    return this.lists[id];
  }

  buildList(id) {
    const index = this.audio.index;
    if (id === 'catalog') return catalogItems();
    if (!index) return [];
    if (id === 'bgm') {
      return listNames(index, 'bgm').map((name) => {
        const info = this.audio.loopInfo(name);
        return { kind: 'bgm', name, label: name, kindColor: 'bgm', badge: loopBadge(info), info };
      });
    }
    if (id === 'me') return listNames(index, 'me').map((name) => ({ kind: 'me', name, label: name, kindColor: 'me' }));
    if (id === 'se') return listNames(index, 'se').map((name) => ({ kind: 'se', name, label: name, kindColor: 'se' }));
    return listNames(index, 'cry').map((name) => ({ kind: 'cry', name, label: name, kindColor: 'se' }));
  }

  get current() {
    return this.state[this.tab];
  }

  selectAndPlay(name, seekLoop) {
    const lower = String(name).toLowerCase();
    // Empieza por la pestaña pedida en la URL (tab=…) y sigue por las demás.
    const order = TABS.map((_, i) => (this.tab + i) % TABS.length);
    for (const t of order) {
      const i = this.itemsFor(t).findIndex((it) => it.name.toLowerCase() === lower);
      if (i < 0) continue;
      this.tab = t;
      this.moveTo(i);
      this.playSelected(seekLoop);
      return;
    }
    this.flash(`No encontrado: ${name}`);
  }

  moveTo(i) {
    const items = this.itemsFor(this.tab);
    const st = this.current;
    st.cursor = Math.min(Math.max(i, 0), Math.max(items.length - 1, 0));
    if (st.cursor < st.scroll) st.scroll = st.cursor;
    if (st.cursor >= st.scroll + LIST.rows) st.scroll = st.cursor - LIST.rows + 1;
  }

  flash(text) {
    this.banner = text;
    this.bannerFrames = 150;
  }

  playSelected(seekLoop = false) {
    const it = this.itemsFor(this.tab)[this.current.cursor];
    if (!it) return;
    const a = this.audio;
    const report = (p) => Promise.resolve(p).catch((err) => this.flash(`Error: ${err.message}`));
    if (it.kind === 'bgm') {
      let position = 0;
      const info = a.loopInfo(it.name);
      if (seekLoop && info) {
        const end = info.loop ? info.loop.endSec : info.duration;
        position = Math.max(0, (end || 0) - SEEK_BEFORE_LOOP_END);
      }
      report(a.playBGM(it.name, { restart: seekLoop, position }));
      this.flash(seekLoop ? `BGM ${it.name} desde ${fmtTime(position)}` : `BGM ${it.name}`);
    } else if (it.kind === 'me') {
      report(a.playME(it.name).then(() => this.flash(`ME ${it.name} terminada`)));
      this.flash(`ME ${it.name}`);
    } else if (it.kind === 'se') {
      report(a.playSE(it.name));
      this.flash(`SE ${it.name}`);
    } else if (it.kind === 'cry') {
      const m = /^(.*?)(?:_(\d+))?$/.exec(it.name);
      report(a.playCry(m[1], Number(m[2] || 0)));
      this.flash(`Grito ${it.name}`);
    }
  }

  seekNearLoopEnd() {
    const np = this.audio.nowPlaying();
    if (!np || !np.duration) {
      this.flash('No hay BGM sonando');
      return;
    }
    const end = np.loopEnd ?? np.duration;
    const position = Math.max(0, end - SEEK_BEFORE_LOOP_END);
    this.audio.playBGM(np.name, { restart: true, position }).catch((err) => this.flash(`Error: ${err.message}`));
    this.flash(`Salto a ${fmtTime(position)} (el bucle vuelve a ${fmtTime(np.loopStart)})`);
  }

  togglePushResume() {
    const a = this.audio;
    if (a.bgm.stack.length) {
      a.resumeBGM(30);
      this.flash('resumeBGM(30): se restaura la música guardada');
      return;
    }
    const target = a.nowPlaying()?.file === 'Salvaje' ? 'battle_trainer' : 'battle_wild';
    a.pushBGM();
    a.playBGM(target, { fadeOutPrevious: 10 });
    this.flash(`pushBGM() + ${target} · C para resumeBGM`);
  }

  update() {
    const input = engine.input;
    if (this.bannerFrames > 0) this.bannerFrames -= 1;
    else this.banner = '';
    if (input.pressed('LEFT') || input.pressed('RIGHT')) {
      this.tab = (this.tab + (input.pressed('RIGHT') ? 1 : TABS.length - 1)) % TABS.length;
      return;
    }
    const step = input.held('RUN') ? FAST_SCROLL : 1;
    if (input.repeat('UP')) this.moveTo(this.current.cursor - step);
    if (input.repeat('DOWN')) this.moveTo(this.current.cursor + step);
    if (input.repeat('L')) this.moveTo(this.current.cursor - LIST.rows);
    if (input.repeat('R')) this.moveTo(this.current.cursor + LIST.rows);
    if (input.pressed('A')) this.playSelected(false);
    if (input.pressed('B')) {
      this.audio.stopAll(15);
      this.flash('Todo detenido');
    }
    if (input.pressed('SELECT')) this.seekNearLoopEnd();
    if (input.pressed('START')) this.togglePushResume();
  }

  details(it) {
    if (!it) return [{ text: 'Sin elementos', color: 'dim' }];
    if (it.entry) {
      const e = it.entry;
      const lines = [
        { text: `${e.kind.toUpperCase()} · ${e.id}`, color: e.kind, size: 16 },
        { text: e.synth ? `Sintetizado: ${e.synth}${e.source ? ` (grito ${e.source})` : ''}` : `Archivo: ${e.file}`, color: 'text' },
        { text: e.desc || '', color: 'dim' },
      ];
      if (e.volume) lines.push({ text: `Volumen ${e.volume}`, color: 'dim' });
      if (e.alt && e.alt.length) lines.push({ text: `Alternativas: ${e.alt.join(', ')}`, color: 'dim' });
      if (e.note) lines.push({ text: e.note, color: 'whole' });
      if (e.kind === 'bgm') lines.push(...this.loopLines(this.audio.loopInfo(e.id)));
      return lines;
    }
    const lines = [{ text: it.name, color: it.kindColor, size: 16 }];
    if (it.kind === 'bgm') lines.push(...this.loopLines(it.info));
    if (it.kind === 'me') {
      const meta = this.audio.index?.me.get(it.name.toLowerCase())?.meta;
      lines.push({ text: `Duración ${fmtTime(meta?.duration)}`, color: 'text' });
      lines.push({ text: 'Pausa la BGM y la reanuda al terminar', color: 'dim' });
    }
    if (it.kind === 'se') lines.push({ text: `Audio/SE/${it.name}`, color: 'dim' });
    if (it.kind === 'cry') lines.push({ text: 'Audio/SE/Cries', color: 'dim' });
    return lines;
  }

  loopLines(info) {
    if (!info) return [{ text: 'Sin metadatos en el índice', color: 'bad' }];
    const lines = [{ text: `Duración ${fmtTime(info.duration)}`, color: 'text' }];
    if (info.loop) lines.push({ text: `Bucle ${fmtTime(info.loop.startSec)} → ${fmtTime(info.loop.endSec)} (LOOPSTART/LOOPLENGTH)`, color: 'loop' });
    else if (info.loopTags) lines.push({ text: 'Etiquetas de bucle inválidas: se repite el archivo completo', color: 'bad' });
    else lines.push({ text: 'Sin LOOPSTART: se repite el archivo completo', color: 'whole' });
    return lines;
  }

  statusText() {
    const s = this.audio.debugState();
    if (s.context !== 'running') return s.unlocked ? `audio: ${s.context}` : 'pulsa una tecla para activar el audio';
    return `SE ${s.seVoices}${s.me ? ` · ME ${s.me}` : ''}${s.stack.length ? ` · pila ${s.stack.length}` : ''}`;
  }

  drawUI(g) {
    const items = this.itemsFor(this.tab);
    const st = this.current;
    drawJukebox(g, {
      tabs: TABS,
      tab: this.tab,
      items,
      cursor: st.cursor,
      scroll: st.scroll,
      emptyText: this.audio.index ? 'Lista vacía' : 'Falta game/data/audio_index.json',
      details: this.details(items[st.cursor]),
      nowPlaying: this.audio.nowPlaying(),
      status: this.statusText(),
      banner: this.banner,
    });
  }
}
