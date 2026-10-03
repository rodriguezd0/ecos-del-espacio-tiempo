// Pisos nuevos del P1. El puzzle conserva ruinas_dintel y sus coordenadas para partidas anteriores.
export const HALL = Object.freeze({ x: 3, y: 5, w: 21, h: 21 });
export const BASE = Object.freeze({
  up: { x: 13, y: 6 }, down: { x: 13, y: 25 }, arrival: { x: 13, y: 24, dir: 8 },
  fromPuzzle: { x: 13, y: 8, dir: 2 },
});
export const PUZZLE_UP = Object.freeze({ x: 35, y: 20, arrival: { x: 35, y: 22, dir: 2 } });
export const SUMMIT = Object.freeze({ down: { x: 13, y: 25 }, arrival: { x: 13, y: 23, dir: 8 } });
export const GUARDIAN = Object.freeze({ x: 13, y: 18, dir: 2, challenge: [{ x: 13, y: 22 }] });
export const NUCLEO = Object.freeze({
  camara: { x: 11, y: 9 }, column: { x: 13, y: 11 }, front: { x: 13, y: 12, dir: 8 },
  arca: { x: 20, y: 10 }, casilda: { x: 11, y: 11, dir: 6 }, lever: { x: 13, y: 25 },
});
export const TRAINER_SPOTS = Object.freeze({
  excursionista_remo: { x: 8, y: 21, dir: 6 },
  montanero_paco: { x: 19, y: 16, dir: 4 },
  arqueologa_ines: { x: 8, y: 10, dir: 6 },
});
