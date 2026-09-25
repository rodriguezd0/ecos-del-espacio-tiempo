// Interior de la campana de dragado de Genesis en el Arrecife del Eco (docs/CAMPANA.md §5.4 «P7 (B14) · Extracción ·
// Dragado de Antea (reliquias y planos de la corona)»): cámara presurizada (tileset 4) con el puesto de control de
// la draga, bancos de ordenadores, cajas de reliquias catalogadas y la escotilla al fondo del mar. Módulo PURO.
import { CAMPANA_INT } from './layout.js';

const C = CAMPANA_INT;

export function buildCampana(b) {
  b.fill(null, 'vacio');
  b.rect(null, 1, 1, C.w - 2, C.h - 3, 'habitacion_lab');
  b.stamp('salida_lab', C.entry.x - 1, C.exitY);
  // Puesto de control de la draga (fondo) y pizarras con el sonar.
  b.stamp('lab_ordenadores', 10, 1);
  b.stamp('pizarras', 4, 1);
  b.stamp('maquina_lab', 1, 2);
  b.stamp('estanteria_lab', 14, 5);
  b.stamp('mesa_lab_verde', 6, 6);
  b.stamp('fotocopiadora', 11, 7);
  b.stamp('vitrina_museo', 2, 8);
  b.stamp('ventanal_lab', 8, 1);
  b.stamp('planta', 15, 9);
}
