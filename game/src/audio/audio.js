// Audio del juego. CONTRATO ESTABLE (el módulo de audio lo implementa por completo).
// Nombres de pista = nombre de archivo de Añil sin extensión (p. ej. 'PrismaVilla1', 'Salvaje'),
// o nombres semánticos resueltos por audio/catalog.js.

export class GameAudio {
  constructor(assets) {
    this.assets = assets;
    this.volumes = { bgm: 0.7, se: 0.8, me: 0.8 };
  }
  /** Desbloquea el AudioContext tras el primer gesto del usuario. */
  unlock() {}
  /** Reproduce música en bucle (respeta LOOPSTART/LOOPLENGTH). opts: { volume, fadeIn, fadeOutPrevious } */
  async playBGM(name, opts = {}) {}
  stopBGM(fadeFrames = 0) {}
  /** Guarda la música actual y la restaura con resumeBGM() (combates, fanfarrias). */
  pushBGM() {}
  resumeBGM(fadeFrames = 0) {}
  /** Efecto de sonido (Audio/SE). opts: { volume, pitch } */
  async playSE(name, opts = {}) {}
  /** Fanfarria (Audio/ME): pausa la música y la reanuda al terminar. Devuelve promesa al terminar. */
  async playME(name, opts = {}) {}
  /** Grito de Pokémon (Audio/SE/Cries). */
  async playCry(speciesId, form = 0, opts = {}) {}
  setVolume(kind, v) { this.volumes[kind] = v; }
  update(_dt) {}
}
