// Audio del juego (WebAudio). CONTRATO ESTABLE: la API pública de GameAudio no cambia.
// Nombres de pista = nombre de archivo de Añil sin extensión (p. ej. 'PrismaVilla1', 'Salvaje')
// o nombres semánticos de audio/catalog.js ('battle_wild', 'cursor', 'item_get', 'core_signal'…).
//
// Volúmenes: 0..1 (o 0..100 como Essentials). Tono (`pitch`): 100 = normal (o factor 1.0).
// Fundidos: en frames lógicos (60 = 1 s). Los volúmenes por categoría se leen de
// engine.state.options (bgmVolume, seVolume, meVolume?, cryVolume?) si hay partida.
import { engine } from '../core/engine.js';
import { AudioLoader } from './bufferCache.js';
import { resolveCatalog } from './catalog.js';
import { createAudioIndex, resolveFile, resolveCry, loopSecondsFromMeta } from './resolve.js';
import { renderSynth } from './synth.js';
import {
  framesToSeconds, normalizeVolume, normalizePitch, loopRegion, clampResumeOffset, volumesFromOptions,
} from './timing.js';
import { MusicVoice, SEPool, SILENT_HANDLE } from './voices.js';

const INDEX_URL = 'data/audio_index.json';
const DEFAULT_BGM_FADE_IN = 0; // frames (RMXP arranca la música sin fundido)
const ME_RESUME_FADE = 30; // frames de fundido al reanudar la música tras una fanfarria
const HOLD_FADE_SEC = 0.08;
const CRY_VOLUME = 90; // Essentials reproduce los gritos a volumen 90
const FAINT_PITCH = 0.75; // grito al debilitarse (Essentials: tono 75)
const OPTIONS_POLL_FRAMES = 10;
const COMMON_SE = ['cursor', 'decision', 'cancel', 'buzzer', 'menu_open', 'menu_close'];
const KIND_LABEL = { bgm: 'BGM', me: 'ME', se: 'SE', cry: 'Grito' };

export class GameAudio {
  constructor(assets, { optionsSource } = {}) {
    this.assets = assets;
    this.volumes = { bgm: 0.7, se: 0.8, me: 0.8, cry: 0.8 };
    this.ctx = null;
    this.buses = null;
    this.sePool = null;
    this.unlocked = false;
    this.disabled = false;
    this.index = null;
    this.warnings = [];
    this._warned = new Set();
    this.loader = new AudioLoader({ urlFor: (p) => assets.anil(p), warn: (k, m) => this.warnOnce(k, m) });
    this.bgm = { current: null, token: 0, stack: [], held: false };
    this.me = null;
    this.synthCache = new Map();
    this._optionsSource = optionsSource || (() => engine.state?.options);
    this._appliedOptions = {};
    this._frame = 0;
    this.ready = this._loadIndex();
    this._installVisibilityHandler();
  }

  // ───────────────────────── infraestructura ─────────────────────────

  /** Avisa una sola vez por clave (archivos ausentes, WebAudio no disponible…). */
  warnOnce(key, message) {
    if (this._warned.has(key)) return;
    this._warned.add(key);
    this.warnings = [...this.warnings, message].slice(-50);
    console.warn(message);
  }

  async _loadIndex() {
    try {
      const json = await this.assets.json(INDEX_URL);
      this.index = createAudioIndex(json);
    } catch (err) {
      this.warnOnce('index', `[audio] No se pudo cargar ${INDEX_URL} (${err.message}); se adivinarán las rutas (.ogg). Ejecuta: node tools/extract_audio.mjs`);
    }
  }

  _installVisibilityHandler() {
    if (typeof document === 'undefined') return;
    document.addEventListener('visibilitychange', () => {
      if (!this.ctx || !this.unlocked) return;
      const op = document.hidden ? this.ctx.suspend() : this.ctx.resume();
      op.catch(() => {});
    });
  }

  /** AudioContext si ya se puede usar (tras un gesto del usuario); si no, null. */
  _context() {
    if (this.ctx || this.disabled) return this.ctx;
    const activated = this.unlocked || (typeof navigator !== 'undefined' && navigator.userActivation?.hasBeenActive);
    return activated ? this._createContext() : null;
  }

  _createContext() {
    const Ctor = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!Ctor) {
      this.disabled = true;
      this.warnOnce('nowebaudio', '[audio] WebAudio no está disponible en este navegador: el juego seguirá sin sonido.');
      return null;
    }
    try {
      this.ctx = new Ctor({ latencyHint: 'interactive' });
    } catch (err) {
      this.disabled = true;
      this.warnOnce('ctxfail', `[audio] No se pudo crear el AudioContext: ${err.message}`);
      return null;
    }
    const master = this.ctx.createGain();
    master.connect(this.ctx.destination);
    this.buses = { master };
    for (const kind of ['bgm', 'me', 'se', 'cry']) {
      const g = this.ctx.createGain();
      g.gain.value = this.volumes[kind];
      g.connect(master);
      this.buses[kind] = g;
    }
    this.sePool = new SEPool(this.ctx);
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    return this.ctx;
  }

  /** Desbloquea el AudioContext tras el primer gesto del usuario. */
  unlock() {
    this.unlocked = true;
    const ctx = this._context();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume().catch((err) => this.warnOnce('resume', `[audio] No se pudo reanudar el audio: ${err.message}`));
    const cur = this.bgm.current;
    if (cur && !cur.voice) this._startTrack(cur, this.bgm.token);
    this.ready.then(() => COMMON_SE.forEach((n) => this.preload('se', n)));
  }

  /** Resuelve nombre semántico/archivo → petición de música o null (con aviso). */
  _resolveMusic(kind, name, opts) {
    const cat = resolveCatalog(kind, name);
    const file = cat.file ? resolveFile(this.index, kind, cat.file) : null;
    if (!file) {
      this.warnOnce(`${kind}:${name}`, `[audio] ${KIND_LABEL[kind]} "${name}" no existe en Audio/${kind.toUpperCase()} de Añil; se omite.`);
      return null;
    }
    const optVolume = normalizeVolume(opts.volume);
    const optRate = normalizePitch(opts.pitch);
    return {
      name,
      id: cat.id,
      file: file.name,
      path: file.path,
      meta: file.meta,
      optVolume,
      optRate,
      volume: normalizeVolume(cat.volume) * optVolume,
      rate: normalizePitch(cat.pitch) * optRate,
    };
  }

  /** Descarga (y decodifica si ya hay contexto) un sonido para que suene sin retraso. */
  async preload(kind, name) {
    await this.ready;
    const ctx = this._context();
    let file = null;
    if (kind === 'cry') {
      file = resolveCry(this.index, name, 0);
    } else {
      const cat = resolveCatalog(kind, name);
      if (cat.synth) {
        if (ctx) await this._synth(cat.synth, cat);
        return;
      }
      file = cat.file ? resolveFile(this.index, kind, cat.file) : null;
    }
    if (!file) return;
    if (ctx) await this.loader.load(ctx, file.path, kind);
    else await this.loader.prefetch(file.path);
  }

  // ───────────────────────────── música ─────────────────────────────

  /**
   * Reproduce música en bucle (respeta LOOPSTART/LOOPLENGTH).
   * opts: { volume, pitch, fadeIn (frames), fadeOutPrevious (frames), restart, position (s) }
   * Si ya suena la misma pista no se reinicia (como RMXP), salvo con restart: true.
   */
  async playBGM(name, opts = {}) {
    if (!name) {
      this.stopBGM(opts.fadeOutPrevious || 0);
      return;
    }
    await this.ready;
    const req = this._resolveMusic('bgm', name, opts);
    if (!req) {
      this.stopBGM(opts.fadeOutPrevious || 0);
      return;
    }
    const cur = this.bgm.current;
    if (cur && cur.path === req.path && !opts.restart) {
      cur.volume = req.volume;
      cur.optVolume = req.optVolume;
      if (cur.voice) cur.voice.setVolume(req.volume);
      return;
    }
    const token = ++this.bgm.token;
    this._stopCurrentBGM(framesToSeconds(opts.fadeOutPrevious));
    const track = {
      ...req,
      buffer: null,
      region: null,
      voice: null,
      position: Math.max(Number(opts.position) || 0, 0),
      fadeIn: framesToSeconds(opts.fadeIn ?? DEFAULT_BGM_FADE_IN, 30),
    };
    this.bgm.current = track;
    await this._startTrack(track, token);
  }

  async _startTrack(track, token) {
    const ctx = this._context();
    if (!ctx) {
      this.loader.prefetch(track.path); // sonará al desbloquear
      return;
    }
    if (!track.buffer) {
      const loaded = await this.loader.load(ctx, track.path, 'bgm');
      if (token !== this.bgm.token || this.bgm.current !== track) return;
      if (!loaded) {
        this.bgm.current = null;
        return;
      }
      track.buffer = loaded.buffer;
      track.region = loopRegion(loaded.meta?.loop, loaded.buffer.duration);
      track.loopFromTags = track.region.fromTags;
    }
    if (this.bgm.held || track.voice || this.bgm.current !== track) return;
    const { loopStart, loopEnd } = track.region;
    track.voice = new MusicVoice(ctx, this.buses.bgm, track.buffer, {
      volume: track.volume,
      rate: track.rate,
      offset: clampResumeOffset(track.position, loopStart, loopEnd, track.buffer.duration),
      fadeIn: track.fadeIn,
      loop: track.region,
    });
  }

  _stopCurrentBGM(fadeSec) {
    const cur = this.bgm.current;
    if (!cur) return;
    if (cur.voice) cur.voice.stop(fadeSec);
    this.bgm.current = null;
  }

  stopBGM(fadeFrames = 0) {
    this.bgm.token += 1;
    this._stopCurrentBGM(framesToSeconds(fadeFrames));
  }

  _currentPosition() {
    const cur = this.bgm.current;
    if (!cur) return 0;
    return cur.voice ? cur.voice.position() : cur.position;
  }

  /** Guarda la música actual y la restaura con resumeBGM() (combates, fanfarrias). */
  pushBGM() {
    const cur = this.bgm.current;
    const snapshot = cur
      ? { name: cur.name, path: cur.path, volume: cur.optVolume, pitch: cur.optRate, position: this._currentPosition() }
      : null;
    this.bgm.stack = [...this.bgm.stack, snapshot];
    return this.bgm.stack.length;
  }

  /** Restaura la música guardada con pushBGM() en la posición en que estaba, con fundido. */
  resumeBGM(fadeFrames = 0) {
    const stack = this.bgm.stack;
    if (!stack.length) return Promise.resolve();
    const snap = stack[stack.length - 1];
    this.bgm.stack = stack.slice(0, -1);
    if (!snap) {
      this.stopBGM(fadeFrames);
      return Promise.resolve();
    }
    const cur = this.bgm.current;
    if (cur && cur.path === snap.path) return Promise.resolve();
    return this.playBGM(snap.name, {
      volume: snap.volume,
      pitch: snap.pitch,
      position: snap.position,
      fadeIn: fadeFrames,
      fadeOutPrevious: fadeFrames,
      restart: true,
    });
  }

  _holdBGM() {
    this.bgm.held = true;
    const cur = this.bgm.current;
    if (cur && cur.voice) {
      cur.position = cur.voice.position();
      cur.voice.stop(HOLD_FADE_SEC);
      cur.voice = null;
    }
  }

  _releaseBGM(fadeSec) {
    this.bgm.held = false;
    const cur = this.bgm.current;
    if (!cur || cur.voice) return;
    cur.fadeIn = fadeSec;
    this._startTrack(cur, this.bgm.token);
  }

  // ───────────────────────────── fanfarrias ─────────────────────────────

  /**
   * Fanfarria (Audio/ME): pausa la música y la reanuda al terminar. Devuelve promesa al terminar.
   * opts: { volume, pitch, resumeFade (frames) }
   */
  async playME(name, opts = {}) {
    await this.ready;
    const ctx = this._context();
    if (!ctx) return;
    const req = this._resolveMusic('me', name, opts);
    if (!req) return;
    const loaded = await this.loader.load(ctx, req.path, 'me');
    if (!loaded) return;
    if (this.me) {
      const prev = this.me;
      this.me = null;
      prev.voice.stop(0.03);
    }
    this._holdBGM();
    const me = { name, voice: new MusicVoice(ctx, this.buses.me, loaded.buffer, { volume: req.volume, rate: req.rate }) };
    this.me = me;
    await me.voice.ended;
    if (this.me === me) {
      this.me = null;
      this._releaseBGM(framesToSeconds(opts.resumeFade ?? ME_RESUME_FADE));
    }
  }

  /** Corta la fanfarria en curso y reanuda la música. */
  stopME(fadeFrames = 0) {
    const me = this.me;
    if (!me) return;
    this.me = null;
    me.voice.stop(framesToSeconds(fadeFrames));
    this._releaseBGM(framesToSeconds(ME_RESUME_FADE));
  }

  // ───────────────────────── efectos y gritos ─────────────────────────

  /**
   * Efecto de sonido (Audio/SE, incluidas SE/Anim y los sintetizados del catálogo).
   * opts: { volume, pitch } → handle { key, duration (s), ended: Promise, stop() }
   */
  async playSE(name, opts = {}) {
    if (!name) return SILENT_HANDLE;
    await this.ready;
    const ctx = this._context();
    if (!ctx) return SILENT_HANDLE;
    const cat = resolveCatalog('se', name);
    let buffer = null;
    if (cat.synth) {
      buffer = await this._synth(cat.synth, cat);
    } else {
      const file = resolveFile(this.index, 'se', cat.file);
      if (!file) {
        this.warnOnce(`se:${name}`, `[audio] SE "${name}" no existe en Audio/SE de Añil; se omite.`);
        return SILENT_HANDLE;
      }
      buffer = (await this.loader.load(ctx, file.path, file.kind === 'cry' ? 'cry' : 'se'))?.buffer;
    }
    if (!buffer) return SILENT_HANDLE;
    return this.sePool.play(buffer, {
      key: `se:${cat.id || name}`,
      volume: normalizeVolume(cat.volume) * normalizeVolume(opts.volume),
      rate: normalizePitch(cat.pitch) * normalizePitch(opts.pitch),
      destination: this.buses.se,
    });
  }

  /** Señal del Core (grito de Porygon procesado). Atajo de playSE('core_signal'). */
  playCoreSignal(opts = {}) {
    return this.playSE('core_signal', opts);
  }

  _synth(name, cat) {
    if (!this.synthCache.has(name)) {
      const job = (async () => {
        const ctx = this._context();
        let source = null;
        if (cat.source) {
          const cry = resolveCry(this.index, cat.source, 0);
          if (cry) source = (await this.loader.load(ctx, cry.path, 'cry'))?.buffer || null;
        }
        return renderSynth(name, { sampleRate: ctx.sampleRate, source });
      })().catch((err) => {
        this.warnOnce(`synth:${name}`, `[audio] No se pudo sintetizar "${name}": ${err.message}`);
        this.synthCache.delete(name);
        return null;
      });
      this.synthCache.set(name, job);
    }
    return this.synthCache.get(name);
  }

  /**
   * Grito de Pokémon (Audio/SE/Cries/<ID>[_forma]). `speciesId` puede ser un objeto Pokémon.
   * opts: { volume, pitch, faint (tono grave al debilitarse) } → handle (ver playSE)
   */
  async playCry(speciesId, form = 0, opts = {}) {
    let species = speciesId;
    let f = form;
    if (species && typeof species === 'object') {
      f = species.form ?? form;
      species = species.species;
    }
    if (!species) return SILENT_HANDLE;
    await this.ready;
    const ctx = this._context();
    if (!ctx) return SILENT_HANDLE;
    // Debilitado: grito específico '<ID>_faint' si existe; si no, el normal más grave (Essentials).
    const faintFile = opts.faint && this.index ? resolveCry(this.index, species, f, '_faint') : null;
    const file = faintFile || resolveCry(this.index, species, f);
    if (!file) {
      this.warnOnce(`cry:${species}`, `[audio] No hay grito para ${species} en Audio/SE/Cries; se omite.`);
      return SILENT_HANDLE;
    }
    let loaded = await this.loader.load(ctx, file.path, 'cry');
    if (!loaded && file.guessed && f > 0) {
      const base = resolveCry(this.index, species, 0);
      loaded = await this.loader.load(ctx, base.path, 'cry');
    }
    if (!loaded) return SILENT_HANDLE;
    const rate = normalizePitch(opts.pitch) * (opts.faint && !faintFile ? FAINT_PITCH : 1);
    return this.sePool.play(loaded.buffer, {
      key: `cry:${file.path}`,
      volume: normalizeVolume(opts.volume ?? CRY_VOLUME),
      rate,
      destination: this.buses.cry,
    });
  }

  stopSE() {
    if (this.sePool) this.sePool.stopAll();
  }

  /** Detiene todo (música, fanfarria y efectos). */
  stopAll(fadeFrames = 0) {
    this.bgm.stack = [];
    if (this.me) {
      const me = this.me;
      this.me = null;
      me.voice.stop(framesToSeconds(fadeFrames));
    }
    this.bgm.held = false;
    this.stopBGM(fadeFrames);
    this.stopSE();
  }

  // ───────────────────────────── volumen ─────────────────────────────

  setVolume(kind, v) {
    if (!(kind in this.volumes)) return;
    this._applyVolume(kind, normalizeVolume(v, this.volumes[kind]));
  }

  _applyVolume(kind, v) {
    this.volumes = { ...this.volumes, [kind]: v };
    const bus = this.buses?.[kind];
    if (bus) bus.gain.setTargetAtTime(v, this.ctx.currentTime, 0.03);
  }

  /** Llamado por el motor cada frame: sincroniza los volúmenes con las opciones de la partida. */
  update(_dt) {
    this._frame += 1;
    if (this._frame % OPTIONS_POLL_FRAMES !== 0) return;
    let options = null;
    try {
      options = this._optionsSource();
    } catch {
      options = null;
    }
    const vols = volumesFromOptions(options);
    for (const [kind, v] of Object.entries(vols)) {
      if (this._appliedOptions[kind] === v) continue;
      this._appliedOptions = { ...this._appliedOptions, [kind]: v };
      this._applyVolume(kind, v);
    }
  }

  // ───────────────────────────── consulta ─────────────────────────────

  /** Información de bucle de una BGM según el índice (sin descargarla). */
  loopInfo(name) {
    const cat = resolveCatalog('bgm', name);
    const file = cat.file ? resolveFile(this.index, 'bgm', cat.file) : null;
    if (!file || !file.meta) return null;
    return {
      file: file.name,
      duration: file.meta.duration ?? null,
      loopTags: Boolean(file.meta.loopTags),
      loop: loopSecondsFromMeta(file.meta),
    };
  }

  /** Música actual → { name, id, file, position, duration, loopStart, loopEnd, loopFromTags, playing } | null */
  nowPlaying() {
    const cur = this.bgm.current;
    if (!cur) return null;
    return {
      name: cur.name,
      id: cur.id,
      file: cur.file,
      position: this._currentPosition(),
      duration: cur.buffer ? cur.buffer.duration : cur.meta?.duration ?? null,
      loopStart: cur.region ? cur.region.loopStart : null,
      loopEnd: cur.region ? cur.region.loopEnd : null,
      loopFromTags: Boolean(cur.loopFromTags),
      playing: Boolean(cur.voice),
      held: this.bgm.held,
    };
  }

  /** Estado resumido para depuración y pruebas de humo. */
  debugState() {
    return {
      context: this.ctx ? this.ctx.state : 'sin crear',
      unlocked: this.unlocked,
      indexLoaded: Boolean(this.index),
      bgm: this.nowPlaying(),
      stack: this.bgm.stack.map((s) => (s ? `${s.name}@${s.position.toFixed(2)}` : '(silencio)')),
      me: this.me ? this.me.name : null,
      seVoices: this.sePool ? this.sePool.active : 0,
      volumes: this.volumes,
      cache: this.loader.stats(),
      warnings: this.warnings,
    };
  }
}
