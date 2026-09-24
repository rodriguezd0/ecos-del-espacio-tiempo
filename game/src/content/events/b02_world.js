// Cambios del mundo del Bloque 2 fuera de sus mapas (docs/CAMPANA.md B02, «Cambio en el mundo»): al restaurar el
// Pilar del Umbral cesan los temblores alrededor de Villa Alba (calma local en content/story/crisis.js) y los Starly
// vuelven a los tejados del pueblo. Villa Alba añade estos eventos (edición mínima y aditiva en su definición).
// Módulo puro.

/** Tejados de Villa Alba donde se posan los Starly (casillas sobre los tejados de las casas de B01). */
export const STARLY_ROOFS = Object.freeze([
  { x: 8, y: 8, dir: 2 },   // casa de Gael
  { x: 29, y: 9, dir: 4 },  // casa de los vecinos del norte
  { x: 9, y: 20, dir: 6 },  // casa del protagonista
]);

/** Starly en los tejados de Villa Alba, solo tras p1_restored. */
export function villaAlbaStarlyEvents() {
  return STARLY_ROOFS.map((p, i) => ({
    id: `b02_starly_tejado_${i}`, x: p.x, y: p.y, when: (s) => Boolean(s?.flag('p1_restored')),
    sprite: 'follower:STARLY:0:0', dir: p.dir, move: 'look', stepAnime: true, through: true, alwaysOnTop: true, shadow: false,
  }));
}
