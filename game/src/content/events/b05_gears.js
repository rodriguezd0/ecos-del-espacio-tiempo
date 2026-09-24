// Lógica PURA del puzzle del Molino del Diezmo (TABLILLAS T02: «tres engranajes repartidos por el molino; hay que
// colocarlos y girarlos para que la rueda mueva la muela en el sentido correcto»). Sin DOM ni motor: la usan el mapa,
// los guiones y los tests.
//
// Tren de engranajes en la pared de la sala de la muela: corona del eje de la rueda (fija) → hueco 1 → hueco 2 →
// hueco 3 → linterna de la muela. Reglas (las explica Anselmo y la placa de la pared):
//   · COLOCAR: cada hueco lleva marcado con tiza el contorno de la rueda dentada que admite (pequeña, mediana,
//     grande). Una rueda de otro tamaño no engrana con sus vecinas: los dientes patinan.
//   · GIRAR: cada rueda lleva un trinquete que solo le deja girar en un sentido (flecha de tiza); se le da la
//     vuelta para cambiarlo. Cada rueda gira al revés que la que la mueve.
//   · El agua mueve la rueda a derechas; la muela del Diezmo muele a derechas («como el sol»).
// Solución única: hueco 1 pequeña a izquierdas, hueco 2 mediana a derechas, hueco 3 grande a izquierdas → muela a
// derechas.

export const GEAR_NAMES = Object.freeze({ 1: 'rueda dentada pequeña', 2: 'rueda dentada mediana', 3: 'rueda dentada grande' });
export const SOCKET_SIZES = Object.freeze([1, 2, 3]); // tamaño que admite cada hueco (1..3)
export const WHEEL_SENSE = 1; // derechas
export const MILLSTONE_SENSE = 1; // la muela debe moler a derechas
export const SENSE_NAMES = Object.freeze({ 1: 'a derechas', '-1': 'a izquierdas' });

/** Sentido que debe permitir el trinquete del hueco i (0..2): alterna desde la rueda. */
export function requiredSense(i) {
  return i % 2 === 0 ? -WHEEL_SENSE : WHEEL_SENSE;
}

/**
 * Evalúa el tren. `sockets` = [{ gear: 0..3, sense: 1|-1 }] ×3 (gear 0 = vacío).
 * → { ok, reason: null | 'missing' | 'size' | 'jam' | 'reverse', at: índice del hueco (0..2) | null, millstone }
 */
export function evaluateGears(sockets) {
  for (let i = 0; i < SOCKET_SIZES.length; i++) {
    if (!sockets[i]?.gear) return { ok: false, reason: 'missing', at: i, millstone: 0 };
  }
  for (let i = 0; i < SOCKET_SIZES.length; i++) {
    if (sockets[i].gear !== SOCKET_SIZES[i]) return { ok: false, reason: 'size', at: i, millstone: 0 };
  }
  for (let i = 0; i < SOCKET_SIZES.length; i++) {
    if (sockets[i].sense !== requiredSense(i)) return { ok: false, reason: 'jam', at: i, millstone: 0 };
  }
  const millstone = SOCKET_SIZES.length % 2 === 1 ? WHEEL_SENSE : -WHEEL_SENSE;
  if (millstone !== MILLSTONE_SENSE) return { ok: false, reason: 'reverse', at: null, millstone };
  return { ok: true, reason: null, at: null, millstone };
}

/** Solución de referencia (para los tests y la documentación). */
export function gearSolution() {
  return SOCKET_SIZES.map((gear, i) => ({ gear, sense: requiredSense(i) }));
}
