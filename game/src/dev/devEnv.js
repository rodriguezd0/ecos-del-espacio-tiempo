// Modo desarrollador: hora del día y clima. Módulo PURO (el clima visible lo aplica devRuntime.js).

export const MINUTES_PER_DAY = 24 * 60;

/** Hora fija del reloj de juego (0–23, minutos 0–59). Devuelve los minutos del día. */
export function setClock(state, hour, minute = 0) {
  const h = Math.trunc(Number(hour));
  const m = Math.trunc(Number(minute) || 0);
  if (!Number.isFinite(h)) throw new Error(`Hora inválida: ${hour}`);
  const total = (((h * 60 + m) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  state.data.clock = { ...state.data.clock, minutes: total };
  return total;
}

/** Horas rápidas del menú: [etiqueta, hora]. */
export const CLOCK_PRESETS = Object.freeze([
  ['Mañana (08:00)', 8], ['Mediodía (12:00)', 12], ['Tarde (18:00)', 18], ['Noche (22:00)', 22], ['Madrugada (03:00)', 3],
]);

/** Nombres en español de los climas del render (render/weather.js WEATHER_TYPES). */
export const WEATHER_LABELS = Object.freeze({
  none: 'Despejado', rain: 'Lluvia', storm: 'Tormenta', heavyRain: 'Aguacero', snow: 'Nieve', blizzard: 'Ventisca',
  sandstorm: 'Tormenta de arena', fog: 'Niebla', sun: 'Sol intenso',
});

/** Lee «HH», «HH:MM» o «HH MM». Devuelve { hour, minute } o null. */
export function parseClock(text) {
  const m = /^\s*(\d{1,2})(?:\s*[:h ]\s*(\d{1,2}))?\s*$/i.exec(String(text ?? ''));
  if (!m) return null;
  const hour = Number(m[1]);
  const minute = Number(m[2] || 0);
  if (hour > 23 || minute > 59) return null;
  return { hour, minute };
}
