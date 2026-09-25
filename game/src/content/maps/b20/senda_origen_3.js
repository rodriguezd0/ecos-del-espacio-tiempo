// Senda del Origen · tramo 3 «Impulso»: ráfagas con veleta y roca agrietada (Embestida) — docs/CAMPANA.md B20.
// Sala de viento: layout.js (T3) y content/events/b20_logic.js (WIND_ROOM) · eventos: content/events/b20_tramos_a.js.
import { tramoDef } from './senda_defs.js';
import { buildTramo3 } from './senda_build.js';
import { tramo3Events } from '../../events/b20_tramos_a.js';

export default tramoDef(3, { build: buildTramo3, events: tramo3Events() });
