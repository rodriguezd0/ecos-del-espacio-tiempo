// Construcción de los tramos de la Senda del Origen (docs/CAMPANA.md B20). Módulo PURO: solo tiles (eventos en
// content/events/b20_tramos_*.js). Todos comparten el marco de cueva de 24×18 y la rejilla interior de layout.js; cada
// eco añade las piezas de su Pilar: dintel y piedras (Umbral), dique y estanque (Corriente), cinta de viento (Impulso),
// barro, placa y contrapesos (Masa), Suelo Olvidado y pared con vetas (Memoria), canales y losas claras (Alma),
// cascada detenida y pliegue (Convergencia).
import { T1, T2, T3, T4, T5, T7, T8, T9, INNER } from './layout.js';
import { paintTramo, tramoMouths, decorate, scatterGlyphs, gridCells, around, cellSet, ABYSS, key, cellHash } from './paint.js';

const glyphFloor = (grid) => gridCells(grid, '.');
const cellHashTile = (x, y) => cellHash(x, y, 71);

// ───────────────────────────── Tramo 1 · Umbral ─────────────────────────────

export function buildTramo1(b) {
  paintTramo(b, T1.grid, { variant: '' });
  tramoMouths(b, '');
  b.stamp('pilar_dintel', T1.dintel.x, T1.dintel.y);
  b.stamp('gota_cristal', T1.crystal.x, T1.crystal.y);
  b.stamp('pilar_placa_unown', T1.stele.x, T1.stele.y);
  const reserved = around([...T1.stones.map((s) => [s.x, s.y]), [T1.slab.x, T1.slab.y], [12, 8], [12, 5], [T1.item.x, T1.item.y], [12, 12], [12, 16]]);
  decorate(b, [
    ['pilar_columna_quebrada', 5, 8, 1, 2], ['pilar_columna_quebrada', 18, 7, 1, 2], ['pilar_columna', 9, 12, 1, 3],
    ['pilar_columna', 16, 12, 1, 3], ['musgo_rocas', 6, 4, 2, 1], ['musgo_rocas', 15, 4, 2, 1], ['roca_peque', 17, 15, 1, 2],
  ], reserved);
  scatterGlyphs(b, glyphFloor(T1.grid), { seed: 11, chance: 0.07, reserved });
}

// ───────────────────────────── Tramo 2 · Corriente ─────────────────────────────

export function buildTramo2(b) {
  paintTramo(b, T2.grid, { variant: '_hielo' });
  tramoMouths(b, '_hielo');
  b.stamp('chorro_agua', 6, 2);
  b.stamp('chorro_agua', 16, 2);
  b.stamp('pilar_placa_unown', T2.stele.x, T2.stele.y);
  const reserved = around([[12, 13], [12, 16], [T2.leverStand.x, T2.leverStand.y], [T2.lever.x, T2.lever.y]]);
  decorate(b, [
    ['gota_cristal', 15, 13, 1, 2], ['pilar_columna_quebrada', 16, 15, 1, 2], ['roca_peque_hielo', 9, 15, 1, 2],
  ], reserved);
  scatterGlyphs(b, gridCells(T2.grid, '.').filter(([, y]) => y >= 13), { seed: 12, chance: 0.08, reserved });
}

// ───────────────────────────── Tramo 3 · Impulso ─────────────────────────────

/**
 * Rejilla de pintado del tramo 3: la sala de viento sobre el abismo; roca en el nicho de la veleta (encima y debajo;
 * al oeste, abismo: una sola casilla de roca suelta quedaba como una astilla) y en el espinazo.
 */
export function tramo3PaintGrid() {
  const rock = cellSet([[2, 9], [3, 9], [2, 11], [3, 11], ...[3, 4, 5, 6, 7].map((r) => [14, r])]);
  return T3.rows.map((row, r) => [...row].map((ch, c) => {
    if (rock.has(key(c, r))) return '#';
    if (ch === '#') return ' ';
    return '.';
  }).join(''));
}

export function buildTramo3(b) {
  const grid = tramo3PaintGrid();
  paintTramo(b, grid, { variant: '_gris' });
  tramoMouths(b, '_gris');
  b.stamp('pilar_placa_unown', T3.stele.x, T3.stele.y);
  const reserved = around([[12, 16], [12, 4], [6, 14], [5, 14], [7, 14], [18, 12], [18, 6], [T3.item.x, T3.item.y]]);
  decorate(b, [['pilar_columna', 16, 13, 1, 3], ['pilar_columna_quebrada', 10, 14, 1, 2], ['pilar_arista', 17, 5, 1, 2]], reserved);
  scatterGlyphs(b, gridCells(grid, '.').filter(([, y]) => y >= 12), { seed: 13, chance: 0.06, reserved });
}

// ───────────────────────────── Tramo 4 · Masa ─────────────────────────────

export function buildTramo4(b) {
  paintTramo(b, T4.grid, { variant: '_gris', natural: ',gm' });
  b.paint('mancha_arcilla', gridCells(T4.grid, 'm')); // el barro, rojizo, sobre el suelo natural
  tramoMouths(b, '_gris');
  b.stamp('pilar_manantial', T4.spring.x, T4.spring.y);
  b.stamp('pilar_placa_unown', T4.stele.x, T4.stele.y);
  const reserved = around([[12, 16], [12, 8], [T4.plate.x, T4.plate.y], [T4.spring.stand.x, T4.spring.stand.y], [T4.item.x, T4.item.y]]);
  decorate(b, [
    ['pilar_monolito', 16, 13, 2, 3], ['pilar_columna_quebrada', 9, 8, 1, 2], ['roca_musgo_gris', 13, 9, 2, 2],
  ], reserved);
  scatterGlyphs(b, gridCells(T4.grid, '.'), { seed: 14, chance: 0.06, reserved });
}

// ───────────────────────────── Tramo 5 · Memoria ─────────────────────────────

export function buildTramo5(b) {
  paintTramo(b, T5.grid, { variant: '' });
  tramoMouths(b, '');
  b.stamp('pilar_losa_eco', T5.losa.x, T5.losa.y);
  b.paint('pared_trepar', [[T5.climb.x, T5.climbDown.y], [T5.climb.x, T5.climb.y]]);
  const reserved = around([[12, 16], [12, 13], [10, 13], [11, 13], [T5.item.x, T5.item.y], [12, 5], [12, 4]]);
  decorate(b, [
    ['pilar_columna_quebrada', 8, 14, 1, 2], ['pilar_columna_quebrada', 16, 14, 1, 2], ['pilar_columna', 10, 3, 1, 3],
    ['pilar_columna', 14, 3, 1, 3], ['matojo_cueva', 4, 5, 2, 2],
  ], reserved);
  scatterGlyphs(b, gridCells(T5.grid, '.'), { seed: 15, chance: 0.08, reserved });
}

// ───────────────────────────── Tramo 7 · Ecos ─────────────────────────────

export function buildTramo7Surface(b) {
  paintTramo(b, T7.surface, { variant: '_hielo' });
  tramoMouths(b, '_hielo');
  b.stamp('pilar_manantial', T7.spring.x, T7.spring.y);
  b.stamp('pilar_placa_unown', 16, 13);
  b.stamp('chorro_agua', 7, 2);
  const reserved = around([[12, 16], [T7.spring.stand.x, T7.spring.stand.y], [12, 4]]);
  decorate(b, [['gota_cristal', 10, 14, 1, 2], ['pilar_columna_quebrada', 14, 15, 1, 2], ['cristales', 3, 15, 6, 2]], reserved);
  scatterGlyphs(b, gridCells(T7.surface, '.').filter(([, y]) => y >= 13), { seed: 17, chance: 0.07, reserved });
}

/** Fondo sumergido de la cisterna (tileset 15, Buceo): losas rotas, limo y la reja caída del túnel. */
export function buildTramo7Bottom(b) {
  // Limo del fondo (roca natural) y, encima, el enlosado de la cisterna roto a trechos.
  paintTramo(b, T7.bottom.map((r) => r.replace(/\./g, ',')), { variant: '_hielo' });
  const C = T7.cistern;
  const keepPaved = cellSet([[12, 5], [11, 5], [13, 5], [12, 6], [12, 7], [12, 8], [T7.caracola.stand.x, T7.caracola.stand.y]]);
  const paved = [];
  for (let y = C.y0; y <= C.y1; y++) for (let x = C.x0 + 1; x <= C.x1 - 1; x++) if (keepPaved.has(key(x, y)) || cellHashTile(x, y) > 0.3) paved.push([x, y]);
  b.paint('pilar_enlosado', [...paved, [11, 5], [12, 5], [13, 5], [12, 6], [12, 7]]);
  // Pared norte de la cisterna alrededor del túnel (antes, negro): roca alzada salvo el túnel y el pozo
  const tunnel = cellSet([[11, 5], [12, 5], [13, 5], [12, 6], [12, 7]]);
  const wall = [];
  for (let y = T7.northPool.y0; y <= T7.grate.y; y++) for (let x = C.x0; x <= C.x1; x++) if (!tunnel.has(key(x, y))) wall.push([x, y]);
  b.paint('macizo_hielo', wall);
  const reserved = around([[T7.caracola.x, T7.caracola.y], [T7.caracola.stand.x, T7.caracola.stand.y], [12, 8], [12, 7], [12, 6], [12, 5], [T7.item.x, T7.item.y], ...T7.vents]);
  // (rocas del fondo: las «de agua» llevan su corro de espuma y solo van en superficie)
  decorate(b, [['roca_musgo_hielo', 17, 8, 2, 2], ['roca_peque_hielo', 9, 11, 1, 2], ['pilar_columna_quebrada', 15, 11, 1, 2]], reserved);
}

/** Eco seco de la cisterna (tileset 2): losas limpias y, al norte, obra recién tallada donde hoy está el túnel. */
export function buildTramo7Echo(b) {
  const grid = T7.bottom.map((r, j) => (j === T7.masonry.y - INNER.y ? r.slice(0, T7.masonry.x - INNER.x) + '#' + r.slice(T7.masonry.x - INNER.x + 1) : r));
  const g2 = grid.map((r, j) => (j === 1 ? ' '.repeat(r.length) : r));
  paintTramo(b, g2, { variant: '_arcilla' });
  // Pared norte de la cisterna seca (antes flotaba sobre el negro): roca alzada con la boca del túnel y su reja
  const wall = [];
  for (let y = T7.masonry.y; y <= T7.grate.y; y++) for (let x = T7.cistern.x0; x <= T7.cistern.x1; x++) if (x !== T7.grate.x || y !== T7.grate.y) wall.push([x, y]);
  b.paint('macizo_arcilla', wall);
  b.stamp('pilar_camara_nucleo', 10, 8);
  const reserved = around([[T7.caracola.x, T7.caracola.y], [T7.caracola.stand.x, T7.caracola.stand.y], [12, 8], [12, 7], [T7.crank.x, T7.crank.y], [T7.crankStand.x, T7.crankStand.y]]);
  decorate(b, [['pilar_columna', 5, 8, 1, 3], ['pilar_columna', 18, 8, 1, 3], ['pilar_glifo', 8, 12, 1, 1], ['pilar_glifo_2', 16, 12, 1, 1]], reserved);
}

// ───────────────────────────── Tramo 8 · Alma ─────────────────────────────

export function buildTramo8(b) {
  const grid = T8.rows.map((r) => r.replace(/#/g, '.'));
  paintTramo(b, grid, { variant: '_morada' });
  b.stamp('salida_luz_sur_morada', 11, 16);
  // Canales de resonancia: cada tramo horizontal de '#' es una línea de canal (bloquea)
  T8.rows.forEach((row, r) => {
    const cells = [...row].map((ch, c) => (ch === '#' ? [c + INNER.x, r + INNER.y] : null)).filter(Boolean);
    if (cells.length) b.paint('pilar_canal', cells);
  });
  // Losas claras (se puede parar): zócalos hexagonales
  for (const [x, y] of gridCells(T8.rows, 'R')) b.stamp('pilar_zocalo', x, y);
}

// ───────────────────────────── Tramo 9 · Convergencia ─────────────────────────────

/**
 * Sala de ejes (world/axis) sobre el marco del tramo: todo lo que se pisa es enlosado (bajo las corrientes, los
 * pliegues y los cristales también); los escombros quedan SIN tiles (vacío de verdad: el mapa usa `voidBlocks` y el
 * escombro detenido pone un tile pasable en la capa 2); el resto del vacío, el negro del abismo. Las '#' de la rejilla
 * son las bases de las estelas y las columnas.
 */
export function buildTramo9(b) {
  const paint = T9.room.map((r) => r.replace(/[v^<>1-9CEXo#]/g, '.').replace(/D/g, ' '));
  paintTramo(b, paint, { variant: '_gris' });
  tramoMouths(b, '_gris');
  for (const [x, y] of gridCells(T9.room, 'D')) { b.set(0, x, y, 0); b.set(1, x, y, 0); b.set(2, x, y, 0); }
  // El tramo roto de la repisa alta: abismo hasta que se reconstruye (zócalo gastado al otro lado)
  for (const [x, y] of T9.gap.cells) { b.set(0, x, y, ABYSS); b.set(1, x, y, 0); }
  // La cascada: brota de la pared norte sobre el canal (chorro animado de 2×2; su columna izquierda es la del canal)
  b.stamp('chorro_agua', T9.cascade.x, T9.cascade.y1 - 1);
  b.stamp('pilar_placa_unown', T9.plaques.custodios.x, T9.plaques.custodios.y);
  b.stamp('pilar_placa_unown', T9.plaques.verse.x, T9.plaques.verse.y);
  for (const [x, y, name] of T9.columns) b.stamp(name, x, y - (name === 'pilar_columna' ? 2 : 1));
  b.stamp('pilar_zocalo_gastado', T9.gap.stand.x, T9.gap.stand.y);
  const special = gridCells(T9.room, 'v^<>123456789CEXoD#');
  const reserved = around([...special, ...T9.wallScene, [T9.gap.stand.x, T9.gap.stand.y]]);
  scatterGlyphs(b, gridCells(T9.room, '.'), { seed: 19, chance: 0.07, reserved });
}

export { cellSet };
