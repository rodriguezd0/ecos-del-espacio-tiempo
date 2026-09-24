// Estación de Ciudad Caudal (CAMPANA §1.3 «estación (tras P4)», §1.7 tren regional X12). Sala completa del stamp
// `estacion_tren` de Interior1 (andén con vagón, bancos y taquilla). La taquilla usa world/transport.js: hasta
// p4_restored el servicio está suspendido (lo dice la propia taquilla). Salida delante de la entrada de la estación.
import { BUILDINGS } from './caudal_layout.js';
import { exitWarps } from '../../services/interior.js';
import { stationEvent } from '../../../world/transport.js';
import { F, say } from '../../events/b03_common.js';

const W = 27;
const H = 17;
const DOOR_X = 13;
const MAT_Y = 15;
const door = BUILDINGS.estacion.door;

export default {
  id: 'caudal_estacion',
  name: 'Ciudad Caudal',
  tileset: 4,
  width: W,
  height: H,
  outdoor: false,
  bgm: 'CiudadCeleste',
  battleback: 'indoor',
  showLocation: false,
  start: { x: DOOR_X, y: MAT_Y, dir: 8 },

  build(b) {
    b.fill(null, 'vacio');
    b.stamp('estacion_tren', 0, 0);
  },

  warps: exitWarps(DOOR_X, MAT_Y, { map: 'ciudad_caudal', x: door.x, y: door.y + 1, dir: 2 }),

  events: [
    // Detrás del mostrador (fila 7 con bandera de mostrador: se habla desde y 8).
    stationEvent({ id: 'taquilla', x: 22, y: 6, station: 'caudal', sprite: 'dependiente', dir: 2, speaker: 'Taquilla' }),
    {
      id: 'viajero_anden', x: 8, y: 12, sprite: 'anil:empresario', dir: 8, move: 'look', trigger: 'action',
      script: async (ctx) => {
        if (ctx.flag(F.p4)) {
          await say(ctx, 'Viajero', '¡Por fin vuelve el tren! Estaba harto de esperar sentado en este banco.');
          return;
        }
        await say(ctx, 'Viajero', 'La línea está suspendida desde que Ciudad Estrato empezó a hundirse. Dicen que las vías del sur se han torcido.');
        await say(ctx, 'Viajero', 'Yo vengo cada día por si acaso. El banco es cómodo.');
      },
    },
    {
      id: 'revisora', x: 5, y: 11, sprite: 'anil:asistenta', dir: 2, move: 'look', trigger: 'action',
      script: async (ctx) => {
        await say(ctx, 'Revisora', ctx.flag(F.p4)
          ? 'Tren regional: Caudal, Brontia, Estrato, Lúmina y Nexo. Cada estación se activa en cuanto la visitas.'
          : 'Sin tren no hay revisión. Limpio el vagón por si mañana nos dejan salir.');
      },
    },
  ],
};
