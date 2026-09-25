// Construcción de la Ruta 12, Senda del Lazo (tileset 1, 40×50): una ladera escalonada de la Cumbre Azur. Llanura del
// principio con la piedra de los pastores; cuatro caras de terraza nevada con tres escaleras cada una; rellanos con
// rocas y pinos; el mirador con la madriguera de los Larvitar (Tyranitarita) y el tramo alto que se pierde entre las
// nubes. Coordenadas y pauta en ./layout_senda.js.
import { SENDA, footRow, topRow } from './layout_senda.js';
import { rect, union, openMask, snowForest, scatterDecor, reservedFrom, decorate, sealEdges } from './paint.js';
import { sendaEvents } from '../../events/b15_senda.js';

const S = SENDA;

/** Suelo transitable de la llanura del principio (plaza + franja al pie de la primera cara). */
export const BASE_CELLS = Object.freeze(union(
  rect(S.base.x0, S.base.y0, S.base.x1, S.base.y1), rect(7, 35, 33, 37),
));

/** Suelo de cada rellano (entre sus paredes y bajo la cara siguiente). */
export function landingCells(k) {
  const p = S.plateaus[k];
  const next = S.plateaus[k + 1];
  const y0 = next ? next.faceBottom + 1 : S.high.y + 1;
  return rect(p.x0 + 2, y0, p.x1 - 2, topRow(k));
}

function stairs(b) {
  S.stairs.forEach((row, k) => {
    for (const side of ['O', 'N', 'E']) b.stamp('escalera_terraza', row[side], S.plateaus[k].faceBottom - 2);
  });
}

export function buildSenda(b) {
  b.fill(0, 'nieve');
  // Mar de nubes por encima de la línea de la ladera (a los lados del mirador).
  b.paint('mar_nubes', union(rect(0, 0, 10, 8), rect(29, 0, 39, 8)), { layer: 0 });
  for (const p of S.plateaus) b.blob(null, rect(p.x0, -4, p.x1, p.faceBottom), 'terraza_nevada');
  // Las nubes no se pisan, ni la franja suelta entre el pinar y los laterales de la ladera: muro invisible (con tocones
  // salteados para que se lea como cerrada). Si no, se subiría por el borde hasta lo alto sin pasar por las escaleras.
  const P0 = S.plateaus[0];
  const flanks = union(
    rect(0, 0, P0.x0 - 1, 11), rect(P0.x1 + 1, 0, S.width - 1, 11),
    rect(P0.x0 - 1, 12, P0.x0 - 1, P0.faceBottom), rect(P0.x1 + 1, 12, P0.x1 + 1, P0.faceBottom),
  );
  b.paint('muro_invisible', flanks);
  for (let y = 13; y <= P0.faceBottom; y += 4) {
    b.stamp('tocon_nevado', P0.x0 - 1, y);
    b.stamp('tocon_nevado', P0.x1 + 1, y + 2);
  }
  stairs(b);
  // Camino de la llanura desde el Paso hasta la piedra de los pastores.
  const path = union(rect(26, S.east.y0, S.width - 1, S.east.y1), rect(26, 38, 30, 42));
  const all = new Set(path.map(([x, y]) => `${x},${y}`));
  b.paint('nieve_parche', path, { mask: (x, y) => all.has(`${x},${y}`) || x >= S.width });
  b.stamp('tablon_anuncios', S.guideStone.x - 1, S.guideStone.y - 1);
  // Bosque: todo lo que queda fuera de la llanura y de los flancos de nubes, más el borde alto del mirador.
  const floors = union(BASE_CELLS, ...S.plateaus.map((_, k) => landingCells(k)));
  const open = openMask([floors], 0);
  const plateauAt = (x, y) => S.plateaus.some((p) => x >= p.x0 && x <= p.x1 && y <= p.faceBottom);
  const clouds = (x, y) => y <= 8 && (x <= 10 || x >= 29);
  snowForest(b, {
    width: S.width, height: S.height, seed: 17,
    open: (x, y) => open(x, y) || plateauAt(x, y) || clouds(x, y),
  });
  // Borde alto del mirador: rocas a los lados del tramo alto (que sigue recto hacia las nubes).
  const H = S.high;
  const D = S.mirador.den;
  const covered = new Set();
  const free = (x) => !(x >= H.x0 && x <= H.x1) && !(x >= D.x - 1 && x <= D.x + 2);
  for (let x = S.plateaus[3].x0 + 2; x <= S.plateaus[3].x1 - 2; x += 1) {
    if (!free(x) || !free(x + 1) || covered.has(x)) continue;
    b.stamp('pino_nevado_peque', x, -1);
    covered.add(x); covered.add(x + 1);
  }
  // Las columnas sueltas que quedan se cierran con un tocón: el borde alto solo se cruza por el tramo alto.
  for (let x = S.plateaus[3].x0 + 2; x <= S.plateaus[3].x1 - 2; x++) if (free(x) && !covered.has(x)) b.stamp('tocon_nevado', x, H.y);
  b.paint('nieve_parche', rect(H.x0, 0, H.x1, H.y + 1));
  // Madriguera de los Larvitar: un hoyo en la nieve con paredes de tierra.
  b.stamp('hoyo_nevado', D.x - 1, D.y - 3);
  // Detalles en rellanos y llanura (nunca al pie ni en lo alto de una escalera ni en el rastro de huellas).
  const events = sendaEvents();
  const stairCells = S.stairs.flatMap((row, k) => ['O', 'N', 'E'].flatMap((side) => {
    const x = row[side] + 1;
    return [[x, footRow(k)], [x, footRow(k) + 1], [x, topRow(k)], [x, topRow(k) - 1], [x - 1, footRow(k)], [x + 1, footRow(k)]];
  }));
  const reserved = reservedFrom(events, [...stairCells, ...path]);
  const printCells = openMask([events.filter((e) => String(e.id).startsWith('huella_')).map((e) => [e.x, e.y])], 1);
  const avoid = (x, y) => reserved(x, y) || printCells(x, y) || (y >= H.y - 1 && y <= H.y + 1);
  // El borde este solo se cruza por el camino del Paso (filas 40–42): pinos a los lados de la entrada.
  decorate(b, [
    ['pino_nevado_peque', S.width - 2, S.east.y0 - 4], ['roca_grande', S.width - 2, S.east.y1 + 1], ['tocon_nevado', S.width - 1, S.east.y1 + 3],
    ['arbusto_nevado', S.width - 5, S.east.y1 + 2],
  ]);
  sealEdges(b, { width: S.width, height: S.height, sides: ['east'], keep: (x, y) => y >= S.east.y0 && y <= S.east.y1 });
  const landings = union(...S.plateaus.map((_, k) => landingCells(k))).filter(([x, y]) => !avoid(x, y));
  scatterDecor(b, landings, [['roca_gris', 3], ['monton_nieve', 4], ['tocon_nevado', 2], ['arbusto_nevado', 2]], { avoid, density: 0.22, gap: 2, seed: 31 });
  const plaza = BASE_CELLS.filter(([x, y]) => !avoid(x, y) && y >= 38);
  scatterDecor(b, plaza, [['pino_nevado_peque', 4], ['pino_nevado', 2], ['roca_gris', 2], ['monton_nieve', 3], ['arbusto_nevado', 2]], { avoid, density: 0.35, gap: 1, seed: 33 });
}
