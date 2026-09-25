// Senda del Origen · tramo 7 «Ecos», eco seco de la cisterna (los días de los Custodios). Lo que se hace aquí sigue en
// el presente (la reja alzada); al revés, no. Solo se sale golpeando la caracola. Mismas coordenadas: layout.js (T7).
import { tramoDef } from './senda_defs.js';
import { buildTramo7Echo } from './senda_build.js';
import { tramo7EchoEvents } from '../../events/b20_tramos_c.js';
import { T7, tramoId } from './layout.js';

export default tramoDef(7, {
  id: `${tramoId(7)}_eco`,
  build: buildTramo7Echo,
  events: tramo7EchoEvents(),
  warps: [],
  encounters: {},
  battleback: 'Templo',
  escapeRope: false,
  start: { x: T7.caracola.stand.x, y: T7.caracola.stand.y, dir: T7.caracola.stand.dir },
});
