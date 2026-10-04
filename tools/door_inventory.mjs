// Inventario de accesos efectivos: warps, stamps locales y puertas por guion. No cambia mapas.
import { buildMapNode, loadLibrary } from './lib/map_node.mjs';
import { MAPS } from '../game/src/content/maps/index.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import { renderMap, blit } from './lib/tile_render.mjs';

globalThis.location ??= { search: '', href: 'http://localhost/' };
globalThis.window ??= {};
const { DOOR_MASKS, resolveDoorPanel } = await import('../game/src/world/doorAnimation.js');
const openStamps = new Set(['fachada_turquesa', 'casa_gris', 'granero_verde', 'tienda_turquesa', 'cabana_roja',
  'mansion_ladrillo', 'estacion_cupula', 'edificio_crema', 'casa_pizarra', 'palafito', 'faro',
  'grandes_almacenes', 'museo_eras', 'pabellon_azul']);
const scripts = [
  { map: 'aldea_mnemos', x: 5, y: 19, to: 'mnemos_casa_iker', script: 'b11_t09.js:ikerDoorEvent' },
  { map: 'ciudad_nexo', x: 21, y: 10, to: 'nexo_correos', script: 'b17_t14.js:flyWithAurora' },
  { map: 'estacion_talasa', x: 29, y: 22, to: 'talasa_laboratorio', trigger: { x: 30, y: 23 }, script: 'b13_talasa.js:labDoor' },
];
export async function doorInventory() {
const unmatched = [];
const unresolved = [];
const groups = new Map();
for (const id of Object.keys(MAPS)) {
  const { entry, warnings } = await buildMapNode(id);
  if (warnings.length) console.warn(id + ': ' + warnings.join('; '));
  if (!entry.def.outdoor) continue;
  const { library } = await loadLibrary(entry.def.tileset);
  const accesses = [...(entry.def.warps || []).filter(w => w.door), ...scripts.filter(s => s.map === id)];
  for (const warp of accesses) {
    // Offsets de vanos de dos casillas, contrastados con su gráfico. Solo inventario, nunca animación.
    const marker = entry.map.markers.find((m) => m.kind === 'door' && m.x === warp.x && m.y === warp.y)
      || entry.map.markers.find(m => m.kind === 'door' && ((m.stamp === 'grandes_almacenes' && warp.y === m.y + 1 && (warp.x === m.x || warp.x === m.x + 1))
        || (m.stamp === 'museo_eras' && warp.y === m.y && warp.x === m.x + 1)));
    if (!marker?.stamp) { unmatched.push({ map: id, ...warp, classification: id === 'villa_brontia' && warp.to === 'brontia_campanario' ? 'no-visible-panel' : 'pending' }); continue; }
    let stamp;
    const local = entry.def.stamps?.[marker.stamp];
    try { stamp = local || library?.stamp(marker.stamp); } catch { /* se informa debajo, no se omite */ }
    const key = entry.map.tileset.image + '/' + marker.stamp;
    const masked = Object.hasOwn(DOOR_MASKS, marker.stamp) && DOOR_MASKS[marker.stamp].images.includes(entry.map.tileset.image);
    // Se valida cada acceso en su mapa efectivo, incluido un segundo warp del mismo gráfico.
    const resolved = masked ? resolveDoorPanel(entry, warp.x, warp.y) : null;
    const classification = masked ? resolved ? 'closed-panel' : 'pending' : marker.stamp === 'pilar_torre' ? 'open-pillar' : ['entrada_mina', 'cueva_ladera'].includes(marker.stamp) ? 'open-cave' : openStamps.has(marker.stamp) ? 'open-passage' : 'pending';
    if (masked && !resolved) unresolved.push({ map: id, x: warp.x, y: warp.y, stamp: marker.stamp, image: entry.map.tileset.image });
    if (!groups.has(key)) groups.set(key, { image: entry.map.tileset.image, stamp: marker.stamp, tags: stamp?.tags || [], local: Boolean(local), classification, doors: [] });
    if (classification === 'pending') groups.get(key).classification = 'pending';
    groups.get(key).doors.push({ map: id, x: marker.x, y: marker.y, to: warp.to, script: warp.script,
      resolved: masked ? Boolean(resolved) : undefined,
      trigger: warp.trigger || (marker.x !== warp.x || marker.y !== warp.y ? { x: warp.x, y: warp.y } : undefined),
      tiles: [entry.map.layers[2][marker.x + (marker.y - 1) * entry.map.width], entry.map.layers[2][marker.x + marker.y * entry.map.width]] });
  }
}
const report = { groups: [...groups.values()], total: [...groups.values()].reduce((n, g) => n + g.doors.length, 0), unmatched, unresolved,
  resolvedClosedAccesses: [...groups.values()].flatMap(g => g.doors).filter(d => d.resolved).length,
  scriptExclusions: [
    { source: 'b06_meseta.js:puerta_colector / b06_parque.js', reason: 'Servicio del Parque con animación propia doors5; no se superpone otro panel.' },
    { source: 'b07_canteria.js:mineEvents', reason: 'Boca de mina abierta; no hay panel normal cerrado.' },
    { source: 'b09a_museo.js:galleryDoor', reason: 'Pasajes dentro del Museo; guion propio, sin fachada cerrada.' },
  ],
  summary: Object.fromEntries(['closed-panel', 'open-passage', 'open-pillar', 'open-cave', 'pending'].map((kind) => [kind,
    { groups: [...groups.values()].filter((g) => g.classification === kind).length,
      warps: [...groups.values()].filter((g) => g.classification === kind).reduce((n, g) => n + g.doors.length, 0) }])) };
return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
const report = await doorInventory();
if (report.summary.pending.groups || report.unmatched.some(a => a.classification === 'pending')) process.exitCode = 1;
const output = process.argv.find((a) => a.startsWith('--out='))?.slice(6);
if (output) fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n', 'utf8');
else console.log(JSON.stringify(report, null, 2));
if (process.argv.includes('--contact')) {
  const columns = 8, cell = 128;
  const image = new PNG({ width: columns * cell, height: Math.ceil(report.groups.length / columns) * cell });
  const font = ['111101101101111','010110010010111','111001111100111','111001111001111','101101111001001','111100111001111','111100111101111','111001001001001','111101111101111','111101111001111'];
  for (const [i, group] of report.groups.entries()) {
    const d = group.doors[0], { entry } = await buildMapNode(d.map);
    const patch = renderMap({ tilesetId: entry.def.tileset, width: entry.map.width, height: entry.map.height,
      layers: entry.map.layers, region: { x: d.x - 1, y: d.y - 1, w: 3, h: 3 } });
    const x = (i % columns) * cell, y = Math.floor(i / columns) * cell;
    blit(image, patch, 0, 0, 96, 96, x, y);
    for (const [digitIndex, digit] of String(i + 1).split('').entries()) {
      for (let pixel = 0; pixel < 15; pixel++) if (font[Number(digit)][pixel] === '1') {
        for (let sy = 0; sy < 3; sy++) for (let sx = 0; sx < 3; sx++) {
          const at = ((y + 100 + Math.floor(pixel / 3) * 3 + sy) * image.width + x + digitIndex * 12 + pixel % 3 * 3 + sx) * 4;
          image.data.set([255, 255, 255, 255], at);
        }
      }
    }
  }
  fs.writeFileSync('tools/cache/door_inventory_contact.png', PNG.sync.write(image));
}
}
