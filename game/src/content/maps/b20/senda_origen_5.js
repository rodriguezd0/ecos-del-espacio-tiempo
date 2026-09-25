// Senda del Origen · tramo 5 «Memoria»: losa de recuerdo, Suelo Olvidado y pared con vetas (Trepar) — CAMPANA B20.
// Rejilla y coordenadas: layout.js (T5) · construcción: senda_build.js · eventos: content/events/b20_tramos_b.js.
import { tramoDef } from './senda_defs.js';
import { buildTramo5 } from './senda_build.js';
import { tramo5Events } from '../../events/b20_tramos_b.js';

export default tramoDef(5, { build: buildTramo5, events: tramo5Events() });
