// Museo de las Eras, planta baja (TABLILLAS §4.6; CAMPANA B09): sala de exposiciones completa de Interior1
// (museo_sala: vitrinas, fósiles acordonados, mostrador, máquina de revivir y ordenadores), escalera a la galería y
// escalera del personal al sótano. Coordenadas: museo_layout.js · eventos: content/events/b09a_museo.js y b09a_t06.js.
import { HALL, GALLERY, BASEMENT } from './museo_layout.js';
import { OUTSIDE } from './lumina_layout.js';
import { museumHallEvents } from '../../events/b09a_museo.js';
import { F, when } from '../../events/b09a_common.js';

const H = HALL;
const OUT = OUTSIDE.museo;

/** Salida por los dos felpudos de la fachada (se pisan): el izquierdo sale bajo la casilla izquierda del arco. */
function exits() {
  const out = [];
  H.exits.forEach((e, i) => {
    for (let x = e.x0; x <= e.x1; x++) out.push({ x, y: e.y, to: 'ciudad_lumina', tx: OUT.x + i, ty: OUT.y, dir: 2, door: true });
  });
  return out;
}

export default {
  id: 'lumina_museo',
  name: 'Museo de las Eras',
  tileset: 4,
  width: H.W,
  height: H.H,
  outdoor: false,
  bgm: 'CiudadAzulona',
  battleback: 'indoor',
  showLocation: false,
  start: { x: 19, y: 16, dir: 8 },

  build(b) {
    b.fill(null, 'vacio');
    b.stamp('museo_sala', 0, 0);
    b.stamp('escalera_bajar_der', H.stairsDown.x, H.stairsDown.y);
    b.stamp('planta', 29, 12);
  },

  warps: [
    ...exits(),
    { x: H.stairsUp.x, y: H.stairsUp.y, to: 'lumina_museo_galeria', tx: GALLERY.fromHall.x, ty: GALLERY.fromHall.y, dir: GALLERY.fromHall.dir },
  ],

  events: [
    ...museumHallEvents(),
    // Escalera del personal: la tapa el vigilante hasta la noche de T06; después baja al sótano.
    {
      id: 'escalera_sotano', x: H.stairsDownTile.x, y: H.stairsDownTile.y, name: 'Escalera',
      pages: [
        { trigger: 'touch', script: async (ctx) => { await ctx.say('SOLO PERSONAL DEL MUSEO'); await ctx.move('player', ['left'], { through: false }); } },
        { when: (s) => Boolean(s) && (s.flag(F.t06Night) || s.flag(F.t06Done)), trigger: 'touch',
          script: async (ctx) => { await ctx.warp('lumina_museo_taller', BASEMENT.arrival.x, BASEMENT.arrival.y, BASEMENT.arrival.dir); } },
      ],
    },
    { id: 'museo_cerrado_noche', x: 0, y: 1, trigger: 'auto', when: when({ all: [F.t06Done], test: (s) => (s.hour < 6 || s.hour >= 20) }),
      script: async (ctx) => {
        await ctx.say('El museo está cerrado por la noche. Horario: de 8:00 a 20:00.');
        await ctx.warp('ciudad_lumina', OUT.x, OUT.y, 2);
      } },
  ],
};
