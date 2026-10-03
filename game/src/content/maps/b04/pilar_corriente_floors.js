// La Escalera de Estanques conserva su mapa y geometría; el rellano central conduce al tercer piso.
export const HALL = Object.freeze({ x: 3, y: 5, w: 21, h: 21 });
export const BASE = Object.freeze({
  up: { x: 13, y: 6 }, down: { x: 13, y: 25 }, arrival: { x: 13, y: 24, dir: 8 },
  fromPuzzle: { x: 13, y: 8, dir: 2 },
});
export const PUZZLE_UP = Object.freeze({ x: 20, y: 18, arrival: { x: 19, y: 16, dir: 8 } });
export const SUMMIT = Object.freeze({ down: { x: 13, y: 25 }, arrival: { x: 13, y: 23, dir: 8 } });
export const CORE = Object.freeze({
  chamber: [11, 9], x: 13, y: 11, inscription: [18, 8], inscriptionEvent: { x: 18, y: 9 },
  leandro: { x: 14, y: 10, dir: 2 }, arrive: [[13, 22]],
});
export const TRAINER_SPOTS = Object.freeze({
  pescador_bruno: { x: 8, y: 21, dir: 6 },
  buceadora_marta: { x: 19, y: 17, dir: 4 },
  pescador_tomas: { x: 8, y: 13, dir: 6 },
  buceadora_ines: { x: 19, y: 9, dir: 4 },
});
