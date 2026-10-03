// El Archivo de papel de Mnemos (B10; docs/CAMPANA.md: «la tinta del Archivo se borra»; «Genesis está copiando el
// Archivo antes de que desaparezca»): sala de lectura con pasillos de estanterías bajo el Archivo Hondo. Hasta el
// P5 dos técnicos del Consorcio escanean las páginas y Casia hace su cameo; tras el P5, Olvido encuentra el informe
// tachado de la Laguna Clara. La escalera del fondo sube al Archivo Hondo. Tileset 4 (Interior1).
import { exitWarps, exitArrowEvents } from '../../services/interior.js';
import { ARCHIVO_ROOM as A } from './archivo_layout.js';
import { BUILDINGS } from './mnemos_layout.js';
import { ENTRY } from './hondo_layout.js';
import { archivoEvents, archivoOnEnter } from '../../events/b10_archivo.js';

const OUT = BUILDINGS.archivo.door;

export default {
  id: 'mnemos_archivo',
  name: 'Pilar de la Memoria · Piso 1',
  pillar: { id: 'P5', floor: 1 },
  tileset: 4,
  width: A.width,
  height: A.height,
  outdoor: false,
  bgm: 'Transicion',
  battleback: 'indoor',
  showLocation: false,
  start: { x: A.entry.x, y: A.entry.y, dir: 8 },

  build(b) {
    const r = A.room;
    b.fill(null, 'vacio');
    b.rect(null, r.x, r.y, r.w, r.h, 'habitacion_museo');
    b.stamp('salida_casa', A.entry.x - 2, A.entry.y);
    b.stamp(A.stairs.stamp, A.stairs.x, A.stairs.y);
    for (const [x, y] of A.wallShelves) b.stamp('estanteria_roja', x, y);
    for (const [x, y] of A.stacks) b.stamp(x % 2 ? 'estanteria_roja' : 'estanteria_lab', x, y);
    for (const s of A.scanners) b.stamp('fotocopiadora', s.x, s.y);
    b.stamp('mesa_lab_verde', A.table.x, A.table.y);
    b.stamp('taza', A.table.x + 1, A.table.y);
    b.stamp('lab_ordenadores', 9, 2);
    b.stamp('planta_alta', 1, 13);
    b.stamp('planta_alta', 21, 13);
    b.stamp('reloj_pared', 17, 2);
    b.rect(null, 9, 13, 5, 2, 'alfombra_granate');
  },

  warps: [
    ...exitWarps(A.entry.x, A.entry.y, { map: 'aldea_mnemos', x: OUT.x, y: OUT.y + 1, dir: 2 }),
    { x: A.stairsWarp.x, y: A.stairsWarp.y, to: 'archivo_hondo', tx: ENTRY.arrival.x, ty: ENTRY.arrival.y, dir: ENTRY.arrival.dir },
  ],

  events: [
    ...exitArrowEvents(A.entry.x, A.entry.y + 1),
    ...archivoEvents(),
  ],
  onEnter: archivoOnEnter,
};
