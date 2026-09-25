// Senda del Origen · tramo 9 «Convergencia» (CAMPANA B20: «cascada detenida y pliegue (Convergencia; Reconstrucción)»):
// eco de la Cámara del Cruce (B18) hecho con world/axis. La Cadena Roja se tensa en los cristales de cambio: hacia el
// tiempo la cascada se detiene y se sube por ella; hacia el espacio se abre el pliegue a la repisa alta, donde un tramo
// roto se reconstruye. En la pared, el verso X y el último mensaje de los Custodios. La boca norte sale al Cielo Interior.
// La tensión de este tramo es suya (var V.t9Axis), no la de la Cámara del Cruce; el tono sigue al eje tensado.
import { tramoDef, tramoTone } from './senda_defs.js';
import { buildTramo9 } from './senda_build.js';
import { tramo9Events, tramo9Enter } from '../../events/b20_tramos_c.js';
import { axisTone, cachedAxis } from '../../../world/axis/logic.js';

const BASE_TONE = tramoTone(9);
const base = tramoDef(9, { build: buildTramo9, events: tramo9Events(), voidBlocks: true });
const enter = base.onEnter;
// El eje de la caché se sincroniza ANTES de las líneas de entrada (el tono lo lee cada fotograma)
const def = { ...base, onEnter: async (ctx) => { tramo9Enter(ctx); await enter(ctx); } };

/** Tinte del P9 con el oro del Origen + el color del eje tensado (la caché la mantiene world/axis al tensar y al entrar). */
export default Object.defineProperty(def, 'tone', { get() { return axisTone(BASE_TONE, cachedAxis()); }, enumerable: true, configurable: true });
