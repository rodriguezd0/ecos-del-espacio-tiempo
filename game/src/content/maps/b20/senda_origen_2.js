// Senda del Origen · tramo 2 «Corriente»: estanques y compuerta (Nadar) — docs/CAMPANA.md B20. Cueva Azul (tileset 15).
// Rejilla y coordenadas: layout.js (T2) · construcción: senda_build.js · eventos: content/events/b20_tramos_a.js.
import { tramoDef } from './senda_defs.js';
import { buildTramo2 } from './senda_build.js';
import { tramo2Events } from '../../events/b20_tramos_a.js';

export default tramoDef(2, { tileset: 15, build: buildTramo2, events: tramo2Events() });
