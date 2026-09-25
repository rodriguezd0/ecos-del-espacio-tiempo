// Senda del Origen · tramo 7 «Ecos», superficie: segundo Manantial del Origen y la cisterna (Buceo) — CAMPANA B20.
// Mismas coordenadas que el fondo (senda_origen_7_fondo) y su eco seco (senda_origen_7_eco): layout.js (T7).
import { tramoDef } from './senda_defs.js';
import { buildTramo7Surface } from './senda_build.js';
import { tramo7SurfaceEvents } from '../../events/b20_tramos_c.js';
import { tramoId } from './layout.js';

export default tramoDef(7, { tileset: 15, build: buildTramo7Surface, events: tramo7SurfaceEvents(), dive: { map: `${tramoId(7)}_fondo` } });
