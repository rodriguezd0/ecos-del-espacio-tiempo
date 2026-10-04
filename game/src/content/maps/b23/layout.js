// Ocho mapas de la península; las salidas nunca requieren llevar un Pokémon u objeto.
export const PORT = Object.freeze({ arrival: { x: 22, y: 34, dir: 8 }, centerDoor: { x: 9, y: 14 }, centerOutside: { x: 9, y: 15, dir: 2 } });
export const LINKS = Object.freeze({
  a1Back: { x: 0, y: 20, dirTrigger: 4, to: 'puerto_almenara', tx: 44, ty: 18, dir: 4 },
  a1Next: { x: 47, y: 20, dirTrigger: 6, to: 'ruta_a2', tx: 2, ty: 20, dir: 6 },
  a2Back: { x: 0, y: 20, dirTrigger: 4, to: 'ruta_a1', tx: 44, ty: 20, dir: 4 },
  a2Next: { x: 47, y: 20, dirTrigger: 6, to: 'oasis_vaso', tx: 2, ty: 20, dir: 6 },
  oasisBack: { x: 0, y: 20, dirTrigger: 4, to: 'ruta_a2', tx: 44, ty: 20, dir: 4 },
  oasisNext: { x: 35, y: 20, dirTrigger: 6, to: 'monte_candil', tx: 2, ty: 30, dir: 6 },
  monteBack: { x: 0, y: 30, dirTrigger: 4, to: 'oasis_vaso', tx: 32, ty: 20, dir: 4 },
  crisolDoor: { x: 22, y: 11, to: 'el_crisol', tx: 17, ty: 30, dir: 8, door: true },
  crisolBack: { x: 17, y: 32, dirTrigger: 2, to: 'monte_candil', tx: 22, ty: 12, dir: 2 },
  crisolNext: { x: 17, y: 3, to: 'torre_crisol', tx: 17, ty: 32, dir: 8 },
  towerBack: { x: 17, y: 34, dirTrigger: 2, to: 'el_crisol', tx: 17, ty: 5, dir: 2 },
});
