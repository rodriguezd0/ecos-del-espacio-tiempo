// Cálculos de las barras de PS/EXP de las cajas de datos (módulo PURO, probado en Node).

/** Zona de color de la barra de PS (0 verde, 1 amarillo ≤ ½, 2 rojo ≤ ¼), como Essentials. */
export function hpColorZone(hp, total) {
  if (hp <= Math.floor(total / 4)) return 2;
  if (hp <= Math.floor(total / 2)) return 1;
  return 0;
}

/** Ancho de la barra ajustado a 2 px (mínimo 2 si queda algún PS). */
export function hpBarWidth(hp, total, width = 96) {
  if (hp <= 0 || total <= 0) return 0;
  let w = (width * hp) / total;
  if (w < 1) w = 1;
  return Math.max(2, Math.round(w / 2) * 2);
}

/** Fotogramas de la animación de PS: proporcional al cambio (entre 12 y 60). */
export function hpAnimFrames(from, to, total) {
  if (total <= 0) return 12;
  return Math.max(12, Math.min(60, Math.round((Math.abs(to - from) / total) * 72)));
}

/** Fracción de EXP dentro del nivel actual (0..1). */
export function expFraction(exp, levelMin, levelMax) {
  const range = levelMax - levelMin;
  if (range <= 0) return 0;
  return Math.max(0, Math.min(1, (exp - levelMin) / range));
}

/** Fotogramas para llenar la barra de EXP (1,75 s de vacía a llena, como Essentials). */
export function expAnimFrames(fromFrac, toFrac) {
  return Math.max(8, Math.round(Math.abs(toFrac - fromFrac) * 105));
}
