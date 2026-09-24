// Ciclo día/noche: tonos por hora de PBDayNight (Essentials 037_Overworld/004_Overworld_Time.rb),
// interpolados por minuto. Se usa con el reloj de juego (state.clock.minutes), no con la hora real.
// Tono = [rojo, verde, azul, gris] en la escala de RMXP (-255..255, gris 0..255).

export const HOURLY_TONES = [
  [-70, -90, 15, 55], [-70, -90, 15, 55], [-70, -90, 15, 55], [-70, -90, 15, 55], [-60, -70, -5, 50],
  [-40, -50, -35, 50], [-40, -50, -35, 50], [-40, -50, -35, 50], [-40, -50, -35, 50], [-20, -25, -15, 20],
  [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0],
  [-5, -30, -20, 0], [-15, -60, -10, 20], [-15, -60, -10, 20], [-40, -75, 5, 40], [-70, -90, 15, 55], [-70, -90, 15, 55],
];

/** Tono para una hora del reloj de juego en minutos (0..1439). */
export function dayNightTone(minutes) {
  const m = ((Math.floor(minutes) % 1440) + 1440) % 1440;
  const hour = Math.floor(m / 60);
  const minute = m % 60;
  const a = HOURLY_TONES[hour];
  const b = HOURLY_TONES[(hour + 1) % 24];
  return a.map((v, i) => v + ((b[i] - v) * minute) / 60);
}

export const isNightHour = (hour) => hour < 6 || hour >= 20;

/** Suma de tonos con recorte al rango de RMXP. */
export function addTones(...tones) {
  const out = [0, 0, 0, 0];
  for (const t of tones) if (t) for (let i = 0; i < 4; i++) out[i] += t[i] || 0;
  for (let i = 0; i < 3; i++) out[i] = Math.max(-255, Math.min(255, out[i]));
  out[3] = Math.max(0, Math.min(255, out[3]));
  return out;
}
