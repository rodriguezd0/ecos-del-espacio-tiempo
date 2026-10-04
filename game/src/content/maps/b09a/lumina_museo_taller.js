// Museo de las Eras, sótano (TABLILLAS §4.6): Sala de Réplicas con los seis palés, taller con la báscula, archivo
// con la ficha de inventario de 1962 (y, tras T06, la de la Expedición a la Laguna Clara) y muelle de carga con la
// furgoneta de los «restauradores». Tileset 4 (Interior1), 32×20. Coordenadas: museo_layout.js · eventos:
// content/events/b09a_t06.js.
import { BASEMENT, HALL } from './museo_layout.js';
import { SPOTS } from './lumina_layout.js';
import { exitArrowEvents } from '../../services/interior.js';
import { basementEvents } from '../../events/b09a_t06.js';
import { b22dTallerEvents } from '../../events/b22d_registeel.js';

const B = BASEMENT;

export default {
  id: 'lumina_museo_taller',
  name: 'Museo de las Eras',
  tileset: 4,
  width: B.W,
  height: B.H,
  outdoor: false,
  bgm: 'CiudadAzulona',
  battleback: 'indoor',
  showLocation: false,
  start: { x: B.arrival.x, y: B.arrival.y, dir: B.arrival.dir },

  build(b) {
    b.fill(null, 'vacio');
    b.rect(null, 1, 1, 30, 17, 'habitacion_lab');
    b.stamp('escalera_subir_izq', 1, 3);
    // Sala de Réplicas (arriba a la izquierda): suelo de madera y un tabique de estanterías
    b.rect(null, 3, 5, 10, 8, 'alfombra_beige');
    b.stamp('estanteria_lab', 13, 4);
    b.stamp('estanteria_lab', 13, 7);
    // Taller (arriba a la derecha): báscula, mesas, máquina y herramientas
    b.stamp('fotocopiadora', B.scale.x, B.scale.y - 1);
    b.stamp('mesa_lab_verde', B.bench.x, B.bench.y);
    b.stamp('mesa_lab_verde', 22, 8);
    b.stamp('maquina_lab', 26, 2);
    b.stamp('pizarras', 16, 2);
    b.stamp('estanteria_lab', 29, 4);
    // Archivo (abajo a la izquierda): hileras de estanterías y ficheros
    for (const x of [2, 4, 6, 8, 10]) b.stamp('estanteria_lab', x, 14);
    // Muelle de carga (abajo a la derecha): tarima de madera para las cargas y un armario de embalajes
    b.rect(null, 16, 12, 14, 6, 'suelo_madera');
    b.stamp('vitrina', 19, 12);
    b.stamp('salida_lab', B.dockExit[0].x - 1, B.dockExit[0].y);
  },

  warps: [
    { x: B.stairsUp.x, y: B.stairsUp.y, to: 'lumina_museo', tx: HALL.fromBasement.x, ty: HALL.fromBasement.y, dir: HALL.fromBasement.dir },
    ...B.dockExit.map((p) => ({ x: p.x, y: p.y, dirTrigger: 2, to: 'ciudad_lumina', tx: SPOTS.dockExit.x, ty: SPOTS.dockExit.y, dir: SPOTS.dockExit.dir, door: true })),
  ],

  events: [
    ...exitArrowEvents(B.dockExit[0].x, B.dockExit[0].y + 1).slice(1),
    ...basementEvents(),
    ...b22dTallerEvents(),
  ],
};
