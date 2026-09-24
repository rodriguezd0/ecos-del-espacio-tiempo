// Voces WebAudio: pista de música (con bucle LOOPSTART/LOOPLENGTH y fundidos) y pool de SE.
import { loopPosition } from './timing.js';

const CLICK_GUARD_SEC = 0.02; // rampa mínima para evitar chasquidos al cortar

/**
 * Una reproducción de un AudioBuffer (BGM o ME) con su propia ganancia.
 * opts: { volume, rate, offset (s), fadeIn (s), loop: { loopStart, loopEnd } | null }
 */
export class MusicVoice {
  constructor(ctx, destination, buffer, opts = {}) {
    this.ctx = ctx;
    this.buffer = buffer;
    this.volume = opts.volume ?? 1;
    this.rate = opts.rate ?? 1;
    this.loop = opts.loop || null;
    this.offset = Math.min(Math.max(opts.offset || 0, 0), Math.max(buffer.duration - 0.01, 0));
    this.stopped = false;
    this.stoppedPosition = null;

    this.gain = ctx.createGain();
    this.gain.connect(destination);
    this.source = ctx.createBufferSource();
    this.source.buffer = buffer;
    this.source.playbackRate.value = this.rate;
    if (this.loop) {
      this.source.loop = true;
      this.source.loopStart = this.loop.loopStart;
      this.source.loopEnd = this.loop.loopEnd;
    }
    this.source.connect(this.gain);
    this.ended = new Promise((resolve) => {
      this.source.onended = () => {
        this.stopped = true;
        this.disconnect();
        resolve();
      };
    });

    const now = ctx.currentTime;
    const fadeIn = Math.max(opts.fadeIn || 0, CLICK_GUARD_SEC);
    this.gain.gain.setValueAtTime(0, now);
    this.gain.gain.linearRampToValueAtTime(this.volume, now + fadeIn);
    this.startedAt = now;
    this.source.start(now, this.offset);
  }

  /** Posición actual en segundos dentro del archivo (tiene en cuenta el bucle). */
  position() {
    if (this.stoppedPosition !== null) return this.stoppedPosition;
    const elapsed = this.ctx.currentTime - this.startedAt;
    const lp = this.loop;
    return loopPosition(this.offset, elapsed, this.rate, lp ? lp.loopStart : 0, lp ? lp.loopEnd : null, this.buffer.duration);
  }

  setVolume(v, sec = 0.1) {
    this.volume = v;
    if (this.stopped) return;
    const now = this.ctx.currentTime;
    this.gain.gain.cancelScheduledValues(now);
    this.gain.gain.setValueAtTime(this.gain.gain.value, now);
    this.gain.gain.linearRampToValueAtTime(v, now + Math.max(sec, CLICK_GUARD_SEC));
  }

  /** Detiene con fundido de `fadeSec` segundos y recuerda la posición (para reanudar). */
  stop(fadeSec = 0) {
    if (this.stopped) return;
    this.stoppedPosition = this.position();
    this.stopped = true;
    const now = this.ctx.currentTime;
    const fade = Math.max(fadeSec, CLICK_GUARD_SEC);
    try {
      this.gain.gain.cancelScheduledValues(now);
      this.gain.gain.setValueAtTime(this.gain.gain.value, now);
      this.gain.gain.linearRampToValueAtTime(0, now + fade);
      this.source.stop(now + fade + 0.01);
    } catch {
      this.disconnect();
    }
  }

  disconnect() {
    try {
      this.source.disconnect();
      this.gain.disconnect();
    } catch {
      /* ya desconectado */
    }
  }
}

/** Manejador devuelto por playSE/playCry. */
export const SILENT_HANDLE = Object.freeze({ key: null, duration: 0, ended: Promise.resolve(), stop() {}, silent: true });

/**
 * Pool de efectos de sonido: limita las voces simultáneas (se corta la más antigua) y evita
 * duplicar el mismo SE en el mismo instante (p. ej. cursor repetido en un frame).
 */
export class SEPool {
  constructor(ctx, { maxVoices = 16, dedupeSec = 0.03 } = {}) {
    this.ctx = ctx;
    this.maxVoices = maxVoices;
    this.dedupeSec = dedupeSec;
    this.voices = [];
  }

  get active() { return this.voices.length; }

  /** opts: { key, volume, rate, destination } → handle { key, duration, ended, stop() } */
  play(buffer, { key, volume = 1, rate = 1, destination }) {
    const now = this.ctx.currentTime;
    const dup = this.voices.find((v) => v.key === key && now - v.startedAt < this.dedupeSec);
    if (dup) return dup.handle;
    while (this.voices.length >= this.maxVoices) this.voices[0].handle.stop();

    const gain = this.ctx.createGain();
    gain.gain.value = volume;
    gain.connect(destination);
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = rate;
    source.connect(gain);

    const voice = { key, startedAt: now, source, gain, handle: null };
    const ended = new Promise((resolve) => {
      source.onended = () => {
        this.remove(voice);
        resolve();
      };
    });
    voice.handle = {
      key,
      duration: buffer.duration / rate,
      ended,
      stop: () => {
        this.remove(voice);
        try {
          gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.005);
          source.stop(this.ctx.currentTime + 0.03);
        } catch {
          /* ya detenido */
        }
      },
    };
    this.voices.push(voice);
    source.start(now);
    return voice.handle;
  }

  remove(voice) {
    const i = this.voices.indexOf(voice);
    if (i >= 0) this.voices.splice(i, 1);
  }

  stopAll() {
    for (const v of [...this.voices]) v.handle.stop();
  }
}
