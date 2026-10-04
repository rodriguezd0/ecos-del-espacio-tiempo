import { withB22bEvents } from '../../events/b22b_maps.js';
// Parque Eólico, ocupado por Genesis (docs/CAMPANA.md B06; §1.4: Meseta del Impulso, interior tileset 4; fondo de
// combate Central, música GuaridaRocket mientras dura la ocupación). Dos salas del Interior1 de Añil: el almacén de
// la entrada (contenedores, bidones, conos: la «infiltración breve» con dos técnicos) y la sala del Colector, con
// los dos generadores del Parque, la esfera «Muestra Z-2» entre ellos y el banco de ordenadores de Genesis.
// Tras la derrota de Casia el Parque queda vacío (sigue accesible, §2.6); tras el P3 da luz a Brontia.
// Eventos en content/events/b06_parque.js.
import { parqueEvents, parqueExitWarps, colectorBackWarps } from '../../events/b06_parque.js';
import { F } from '../../events/b06_common.js';
import { PARQUE } from './layout.js';

const P = PARQUE;

export default {
  id: 'parque_eolico',
  name: 'Parque Eólico',
  tileset: 4,
  width: P.width,
  height: P.height,
  outdoor: false,
  bgm: 'GuaridaRocket',
  battleback: 'Central',
  showLocation: true,
  start: { x: P.entry.x, y: P.entry.y, dir: P.entry.dir },

  build(b) {
    b.fill(0, 'vacio');
    b.stamp('central_almacen', P.almacen.x, P.almacen.y);
    b.stamp('central_generador', P.generador.x, P.generador.y);
    // Banco de ordenadores de Genesis junto a los generadores.
    b.stamp('lab_ordenadores', P.screens.x, P.screens.y);
    b.stamp('fotocopiadora', 39, 10);
  },

  warps: [...parqueExitWarps(), ...colectorBackWarps()],

  onEnter: async (ctx) => {
    // Tras la ocupación el Parque suena distinto (la música del mapa es la de Genesis mientras están aquí).
    if (ctx.flag(F.colector)) ctx.bgm(ctx.flag(F.restored) ? 'viento' : 'Amenaza');
  },

  events: withB22bEvents('parque_eolico', parqueEvents()),
};
