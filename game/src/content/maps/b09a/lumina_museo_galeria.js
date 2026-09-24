// Museo de las Eras, primera planta (TABLILLAS §4.6): la galería (stamp museo_galeria de Interior1) y, tras sus
// hornacinas del fondo, dos salas: «Antea, la ciudad de antes» (clausurada hasta la noche de T06; calco del borde y
// vitrina helada) y la Sala de las Crónicas (abre tras T06). Coordenadas: museo_layout.js.
import { GALLERY, HALL } from './museo_layout.js';
import { exitArrowEvents } from '../../services/interior.js';
import { museumGalleryEvents } from '../../events/b09a_museo.js';

const G = GALLERY;

/** Salida de una sala lateral (felpudo de 2 casillas) de vuelta a su hornacina. */
function roomExit(room, back) {
  const { door } = room;
  return [door.x, door.x + 1].map((x) => ({ x, y: door.y, dirTrigger: 2, to: 'lumina_museo_galeria', tx: back.x, ty: back.y, dir: back.dir }));
}

export default {
  id: 'lumina_museo_galeria',
  name: 'Museo de las Eras',
  tileset: 4,
  width: G.W,
  height: G.H,
  outdoor: false,
  bgm: 'CiudadAzulona',
  battleback: 'indoor',
  showLocation: false,
  start: { x: G.fromHall.x, y: G.fromHall.y, dir: 2 },

  build(b) {
    b.fill(null, 'vacio');
    b.stamp('museo_galeria', 0, 0);
    // Sala de Antea
    b.rect(null, ...G.antea.room, 'habitacion_museo');
    b.stamp('salida_lab', G.antea.door.x - 1, G.antea.door.y);
    b.stamp('vitrina_museo', G.vitrine.x - 1, G.vitrine.y - 1);
    b.stamp('panel_informativo', G.plaque.x, G.plaque.y - 1);
    b.stamp('panel_informativo', G.kingPanel.x, G.kingPanel.y - 1);
    b.rect(null, 32, 7, 5, 4, 'alfombra_granate');
    b.stamp('vitrina_estrecha', 31, 8);
    b.stamp('esqueleto_fosil_2', 36, 8);
    // Sala de las Crónicas
    b.rect(null, ...G.cronicas.room, 'habitacion_museo');
    b.stamp('salida_lab', G.cronicas.door.x - 1, G.cronicas.door.y);
    for (let x = G.panelWall.x0; x <= G.panelWall.x1; x += 2) b.stamp('panel_informativo', x, G.panelWall.y - 1);
    b.rect(null, 42, 6, 4, 4, 'alfombra_azul');
    b.stamp('planta', 41, 10);
    b.stamp('planta', 46, 10);
  },

  warps: [
    ...G.stairs.map(([x, y]) => ({ x, y, to: 'lumina_museo', tx: HALL.fromGallery.x, ty: HALL.fromGallery.y, dir: HALL.fromGallery.dir })),
    ...roomExit(G.antea, G.antea.back),
    ...roomExit(G.cronicas, G.cronicas.back),
  ],

  events: [
    ...exitArrowEvents(G.antea.door.x, G.antea.door.y + 1).slice(1),
    ...exitArrowEvents(G.cronicas.door.x, G.cronicas.door.y + 1).slice(1),
    ...museumGalleryEvents(),
  ],
};
