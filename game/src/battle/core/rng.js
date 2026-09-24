// Generadores pseudoaleatorios deterministas para el motor de combate.
// El combate recibe `config.rng` (función () => [0,1)) o `config.seed`; así los tests son reproducibles.

/** mulberry32: PRNG de 32 bits rápido y suficiente para juego. */
export function createRng(seed = Date.now()) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Entero aleatorio en [0, n). Equivale a `rand(n)` de Ruby. */
export function randomInt(rng, n) {
  if (n <= 0) return 0;
  return Math.min(n - 1, Math.floor(rng() * n));
}

/**
 * RNG de prueba: devuelve los valores de `values` en orden y luego `fallback`.
 * Útil para forzar tiradas concretas (p. ej. 0.9999 → tirada de daño máxima, sin crítico).
 */
export function sequenceRng(values = [], fallback = 0.5) {
  let i = 0;
  return () => (i < values.length ? values[i++] : fallback);
}
