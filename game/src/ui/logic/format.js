// Formateo de números, tiempos y textos para la UI. Módulo PURO.

/** 1234567 → "1.234.567" (separador de miles español). */
export function formatNumber(n) {
  const v = Math.trunc(Number(n) || 0);
  const s = String(Math.abs(v)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return v < 0 ? `-${s}` : s;
}

/** Dinero con símbolo, como en Añil: "3.000 $". */
export function formatMoney(n) {
  return `${formatNumber(n)} $`;
}

/** Frames lógicos (60 Hz) → "H:MM". */
export function formatPlayTime(frames) {
  const totalMin = Math.floor((Number(frames) || 0) / 60 / 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}:${String(m).padStart(2, '0')}`;
}

/** Número con ceros a la izquierda: pad(7, 3) → "007". */
export function pad(n, width = 3) {
  return String(Math.max(0, Math.trunc(Number(n) || 0))).padStart(width, '0');
}

/** Fecha corta española "24/09/2026 14:05". */
export function formatDate(ms) {
  if (!ms) return '—';
  const d = new Date(ms);
  const p = (v) => String(v).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** Altura en metros → "0,4 m". */
export function formatHeight(m) {
  const v = Number(m) || 0;
  return `${v.toFixed(1).replace('.', ',')} m`;
}

/** Peso en kg → "10,2 kg". */
export function formatWeight(kg) {
  const v = Number(kg) || 0;
  return `${v.toFixed(1).replace('.', ',')} kg`;
}

/** Hora del reloj de juego (minutos desde medianoche) → "09:30". */
export function formatClock(minutes) {
  const m = ((Math.trunc(Number(minutes) || 0) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

/** Artículo/sufijo de género del jugador para textos ("segur{o|a}"). */
export function genderSuffix(gender) {
  return gender === 'F' ? 'a' : 'o';
}
