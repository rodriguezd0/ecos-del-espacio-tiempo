// Coordenadas del recuerdo de Gael (B16, Ala del Sentir: «el último espejo»; docs/CAMPANA.md B16 y §6.2). El jugador
// CONTROLA A GAEL con los controles en espejo y revive su día en tres estampas que flotan en la oscuridad del espejo:
//   1. El laboratorio de Alerce, la tarde del Laberinto (escena oculta de B01: «Esperaremos a la policía»).
//   2. La explanada del Umbral, donde Casilda no le deja pasar (B02).
//   3. El aljibe del Monte del Portal, que no le respondió (B11).
// Tileset 11 (InteriorTorre: mobiliario de laboratorio + kit de Pilar). Módulo puro.

export const W = 58;
export const H = 18;

const R = (x, y, w, h) => Object.freeze({ x, y, w, h });
const P = (x, y, dir = 8) => Object.freeze({ x, y, dir });

/** Estampa 1: el laboratorio (sala blanca con suelo de laboratorio). */
export const LAB = Object.freeze({
  room: R(2, 2, 15, 11), // suelo y 5–12
  arrive: P(9, 12, 8),
  alerce: P(8, 7, 2),
  lia: P(4, 11, 6),
  alerceFront: P(8, 8, 8),
  wait: P(14, 7, 8), // junto a la ventana: donde espera Gael
  door: P(9, 12, 2), // la puerta del laboratorio (por aquí vuelven con el Core)
  protagonist: P(9, 12, 8),
  olmedo: P(10, 12, 8),
});

/** Estampa 2: la explanada del Umbral (enlosado sobre la oscuridad) con el dintel. */
export const ESPLANADA = Object.freeze({
  floor: R(21, 2, 15, 14),
  dintel: Object.freeze({ x: 26, y: 3 }), // hueco x 27–29, filas 4–6 (negro: la ruina)
  casilda: P(28, 7, 2),
  arrive: P(28, 14, 8),
  front: P(28, 8, 8), // delante de Casilda
  bench: P(33, 12, 4), // donde espera Gael
  glow: Object.freeze({ x: 28, y: 5 }), // la luz verde del 10 % al salir de la ruina
});

/** Estampa 3: el aljibe (pila de piedra del Monte) entre aristas violetas. */
export const ALJIBE = Object.freeze({
  floor: R(40, 2, 15, 14),
  basin: Object.freeze({ x: 46, y: 4 }), // pilar_manantial 3×3 (centro 47,5)
  arrive: P(47, 14, 8),
  front: P(47, 7, 8),
});

/** Espejo de controles: izquierda ↔ derecha (arriba y abajo no cambian). */
export const MIRROR_KEYS = Object.freeze({ 2: 2, 8: 8, 4: 6, 6: 4 });
