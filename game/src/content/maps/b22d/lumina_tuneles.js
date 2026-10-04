// Túneles viejos de Lúmina y Cueva Sellada del Engranaje (docs/CAMPANA.md B22: Registeel, «reloj restaurado con
// Rosalía»). Galería de servicio de antes del tren, bajo el museo: andén con raíles cortados, la sala del reloj de pie,
// tres galerías hundidas (una tapada por cascotes: Embestida) donde quedaron las piezas del reloj y, tras la puerta de
// acero que mueve su maquinaria, la sala de engranajes donde duerme Registeel. Cueva1 en la variante gris (hormigón y
// roca). Sin encuentros salvajes: galería cerrada (README). Eventos: content/events/b22d_registeel.js.
import { caveKit, cells } from '../b08/cave_kit.js';
import { TUNELES, HOOKS } from './layout.js';
import { tunelesEvents } from '../../events/b22d_registeel.js';

const kit = caveKit('_gris');
const R = TUNELES.rooms;
const back = HOOKS.taller.liftFront;

function build(b) {
  kit.paintRooms(b, Object.values(R));
  for (const p of TUNELES.passages) kit.carveVertical(b, p);
  for (const t of TUNELES.tunnels) kit.carveTunnel(b, t);
  kit.mergeRock(b);
  b.stamp('escalera_mano', TUNELES.ladder.x, TUNELES.ladder.y);
  // Andén: raíles (manchas de balasto), carteles y vigas.
  b.paint('mancha_gris', cells(TUNELES.rails.x0, TUNELES.rails.y, TUNELES.rails.x1 - TUNELES.rails.x0 + 1, 2));
  for (const [s, x, y] of [
    ['carteles_dobles', 8, 3], ['tronco_h_gris', 9, 5], ['escombros', 3, 7], ['roca_peque_gris', 12, 8],
  ]) b.stamp(s, x, y);
  // Sala del reloj: suelo gastado y restos del derrumbe en las esquinas.
  b.paint('mancha_gris', cells(20, 6, 6, 5));
  for (const [s, x, y] of [
    ['roca_grande_gris', 18, 9], ['roca_musgo_gris', 26, 11], ['musgo_rocas', 19, 12], ['antorcha', 19, 3], ['antorcha', 26, 3],
  ]) b.stamp(s, x, y);
  // Galerías hundidas.
  b.paint('mancha_gris', cells(6, 19, 5, 4));
  for (const [s, x, y] of [
    ['escombros', 8, 16], ['roca_grande_gris', 11, 20], ['matojo_cueva_gris', 4, 17], ['roca_peque_gris', 9, 21],
    ['escombros', 19, 22], ['roca_grande_gris', 24, 19], ['tronco_v_gris', 18, 18], ['musgo_rocas', 22, 24],
    ['escombros', 36, 21], ['roca_musgo_gris', 33, 19], ['roca_grande_gris', 39, 22], ['tronco_h_gris', 38, 18],
    ['roca_peque_gris', 41, 24],
  ]) b.stamp(s, x, y);
  // Sala de los engranajes (Registeel): suelo pulido y columnas.
  b.paint('mancha_gris', cells(36, 7, 5, 4));
  for (const [s, x, y] of [['roca_grande_gris', 34, 9], ['roca_grande_gris', 41, 9], ['antorcha', 36, 3], ['antorcha', 40, 3]]) b.stamp(s, x, y);
  b.stamp('pilar_placa_unown', TUNELES.stele.x, TUNELES.stele.y);
}

export default {
  id: TUNELES.id,
  name: 'Túneles viejos de Lúmina',
  tileset: 2,
  width: TUNELES.width,
  height: TUNELES.height,
  cave: true,
  bgm: 'Cueva',
  battleback: 'Cueva',
  start: TUNELES.arrive,
  build,
  warps: [{ x: TUNELES.exit.x, y: TUNELES.exit.y, to: 'lumina_museo_taller', tx: back.x, ty: back.y, dir: back.dir }],
  events: tunelesEvents(),
};
