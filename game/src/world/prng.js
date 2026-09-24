// PRNG sembrado y determinista (mulberry32) para construir mapas y decoraciones reproducibles.

/** Hash FNV-1a de 32 bits de una cadena (para derivar semillas de ids de mapa). */
export function hashString(str) {
  let h = 0x811c9dc5;
  const s = String(str);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Devuelve una función () => [0,1) determinista para la semilla dada (número o texto). */
export function createRng(seed = 1) {
  let a = (typeof seed === 'number' ? seed : hashString(seed)) >>> 0;
  const rng = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  rng.int = (min, max) => min + Math.floor(rng() * (max - min + 1));
  rng.pick = (list) => list[Math.floor(rng() * list.length)];
  rng.chance = (p) => rng() < p;
  return rng;
}
