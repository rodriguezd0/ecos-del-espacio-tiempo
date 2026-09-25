// Senda del Origen · tramo 4 «Masa»: primer Manantial del Origen, barro (Terreno) y placa de contrapeso — CAMPANA B20.
// Rejilla y coordenadas: layout.js (T4) · construcción: senda_build.js · eventos: content/events/b20_tramos_b.js.
import { tramoDef } from './senda_defs.js';
import { buildTramo4 } from './senda_build.js';
import { tramo4Events } from '../../events/b20_tramos_b.js';

export default tramoDef(4, { build: buildTramo4, events: tramo4Events() });
