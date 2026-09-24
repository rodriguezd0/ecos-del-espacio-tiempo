// Villa Alba — pueblo inicial de Axis (X01). Distribución de la biblia §5 y B01 §2: casa roja del
// protagonista al SO, casa verde de Gael al NO, laboratorio turquesa compacto al E, casa roja de vecinos
// al N, casa verde de vecinos al SE, jardín central, accesos N (Laberinto, custodiado) y S (Ruta 1),
// bosque en los bordes y piedras antiguas con liquen (vestigios naturalizados). Tileset 7.
import { TOWN_DOORS, INTERIOR_ENTRIES, TOWN_EXITS } from './villa_alba_layout.js';
import { W, H, buildVillaAlba } from './villa_alba_build.js';
import { villageEvents } from '../../events/b01_town_village.js';
import { parterreCellEvents } from '../../events/b01_town_cell.js';
import { villaAlbaStarlyEvents } from '../../events/b02_world.js'; // B02: los Starly vuelven a los tejados tras el P1

export default {
  id: 'villa_alba',
  name: 'Villa Alba',
  tileset: 7,
  width: W,
  height: H,
  outdoor: true,
  bgm: 'town_start',
  battleback: 'field',
  start: { x: TOWN_DOORS.casa_prota.x, y: TOWN_DOORS.casa_prota.y + 1, dir: 2 },

  build: buildVillaAlba,

  warps: [
    { ...TOWN_DOORS.casa_prota, to: 'casa_prota_1f', tx: INTERIOR_ENTRIES.casa_prota_1f.x, ty: INTERIOR_ENTRIES.casa_prota_1f.y, dir: 8, door: true },
    { ...TOWN_DOORS.casa_gael, to: 'casa_gael', tx: INTERIOR_ENTRIES.casa_gael.x, ty: INTERIOR_ENTRIES.casa_gael.y, dir: 8, door: true },
    { ...TOWN_DOORS.laboratorio_alerce, to: 'laboratorio_alerce', tx: INTERIOR_ENTRIES.laboratorio_alerce.x, ty: INTERIOR_ENTRIES.laboratorio_alerce.y, dir: 8, door: true },
    { ...TOWN_DOORS.casa_vecinos_n, to: 'casa_vecinos_n', tx: INTERIOR_ENTRIES.casa_vecinos_n.x, ty: INTERIOR_ENTRIES.casa_vecinos_n.y, dir: 8, door: true },
    { ...TOWN_DOORS.casa_vecinos_se, to: 'casa_vecinos_se', tx: INTERIOR_ENTRIES.casa_vecinos_se.x, ty: INTERIOR_ENTRIES.casa_vecinos_se.y, dir: 8, door: true },
  ],

  // Conexiones sin fundido (README.md): el camino norte (x 22–23) sigue en la entrada del Laberinto
  // (su x 19–20) y la salida sur (x 20–25) en la Ruta 1 (su x 12–17).
  connections: [
    { dir: 'north', to: TOWN_EXITS.north.to, offset: TOWN_EXITS.north.offset },
    { dir: 'south', to: TOWN_EXITS.south.to, offset: TOWN_EXITS.south.offset },
  ],

  // C001 en el parterre central con su escena forzada al salir del laboratorio con la Pokédex (CAMPANA §2.3).
  events: [...villageEvents(), ...parterreCellEvents(), ...villaAlbaStarlyEvents()],
};
