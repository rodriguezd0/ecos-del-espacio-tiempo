// Senda del Origen · tramo 1 «Umbral»: dinteles giratorios y cuesta de grava (Correr) — docs/CAMPANA.md B20.
// Rejilla y coordenadas: layout.js (T1) · construcción: senda_build.js · eventos: content/events/b20_tramos_a.js.
import { tramoDef } from './senda_defs.js';
import { buildTramo1 } from './senda_build.js';
import { tramo1Events } from '../../events/b20_tramos_a.js';

export default tramoDef(1, { build: buildTramo1, events: tramo1Events() });
