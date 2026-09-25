// Construcción del recuerdo de Gael (tileset 11): tres estampas flotando en la oscuridad del espejo. Módulo puro.
import { LAB, ESPLANADA, ALJIBE } from './recuerdo_layout.js';

const VOID = 384;
const cells = (x, y, w, h) => {
  const out = [];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) out.push([x + i, y + j]);
  return out;
};

function paintLab(b) {
  const r = LAB.room;
  b.rect(null, r.x, r.y, r.w, r.h, 'sala_blanco');
  b.paint('suelo_lab', cells(r.x, r.y + 3, r.w, r.h - 3), { layer: 0 });
  // abrir la puerta del laboratorio en el marco (por donde entra y vuelven los demás)
  for (const x of [LAB.door.x - 1, LAB.door.x, LAB.door.x + 1]) { b.set(0, x, r.y + r.h, VOID); b.set(1, x, r.y + r.h, 0); b.set(2, x, r.y + r.h, 0); }
  b.stamp('maquina_lab', 3, 4);
  b.stamp('pizarras', 7, 3);
  b.stamp('estanteria_lab', 11, 4);
  b.stamp('estanteria_lab', 13, 4);
  b.stamp('ventanal_lab', 15, 3);
  b.stamp('lab_ordenadores', 10, 8);
  b.paint('alfombra_verde', cells(6, 9, 3, 3));
  b.stamp('planta', 5, 11);
  b.stamp('planta', 16, 11);
}

function paintEsplanada(b) {
  const f = ESPLANADA.floor;
  b.paint('pilar_enlosado', cells(f.x, f.y + 2, f.w, f.h - 2));
  const d = ESPLANADA.dintel;
  b.stamp('pilar_dintel', d.x, d.y);
  for (let x = d.x + 1; x <= d.x + 3; x++) for (let y = d.y + 1; y <= d.y + 2; y++) { b.set(0, x, y, VOID); b.set(1, x, y, 0); b.set(2, x, y, 0); }
  for (const [s, x, y] of [
    ['pilar_monolito', 23, 4], ['pilar_monolito', 32, 4], ['pilar_columna', 22, 9], ['pilar_columna', 34, 9],
    ['pilar_columna_quebrada', 24, 12], ['pilar_placa_unown', 31, 7], ['pilar_losa_eco', 27, 10], ['pilar_glifo', 25, 7],
    ['pilar_glifo_2', 30, 13],
  ]) b.stamp(s, x, y);
}

function paintAljibe(b) {
  const f = ALJIBE.floor;
  b.paint('pilar_enlosado', cells(f.x, f.y + 1, f.w, f.h - 1));
  b.stamp('pilar_manantial', ALJIBE.basin.x, ALJIBE.basin.y);
  for (const [s, x, y] of [
    ['pilar_arista_grande', 41, 3], ['pilar_arista_grande', 52, 3], ['pilar_arista', 43, 10], ['pilar_arista', 51, 11],
    ['pilar_monolito', 44, 3], ['pilar_monolito', 49, 3], ['pilar_columna_quebrada', 41, 12], ['pilar_glifo', 46, 9],
    ['pilar_glifo_2', 48, 12], ['pilar_zocalo_gastado', 45, 8], ['pilar_zocalo_gastado', 49, 8],
  ]) b.stamp(s, x, y);
}

export function buildRecuerdo(b) {
  b.fill(0, 'vacio');
  paintLab(b);
  paintEsplanada(b);
  paintAljibe(b);
}
