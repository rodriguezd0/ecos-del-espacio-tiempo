// Mapa de PRUEBA de los servicios de pueblo (sin canon): Centro Pokémon y tienda con las plantillas de
// content/services, lago para pescar con las tres cañas, tutor, recordador y posadero. Tileset 1 (Exterior1).
// Prueba: ?scene=map&map=dev_services&debug
import { CENTER_ENTRY } from '../services/pokecenter.js';
import { SHOP_LAYOUT } from '../services/shop.js';
import { innkeeperEvent } from '../services/inn.js';
import { moveTutorEvent, moveReminderEvent } from '../services/moveTeaching.js';
import { REGION_MAP, resolveFlyTarget } from '../../ui/logic/regionMapData.js';
import { loadMapDefinition } from './index.js';

/** Cartógrafa de prueba: mapa regional y Vuelo con todos los destinos desbloqueados (solo en esta zona). */
async function cartographer(ctx) {
  const i = await ctx.choice(['Ver el mapa', 'Volar (prueba)', 'Nada'], { message: '¿Quieres consultar el atlas de Axis?', cancel: 2 });
  if (i === 0) { await ctx.ui.openRegionMap({}); return; }
  if (i !== 1) return;
  for (const p of REGION_MAP.places) if (p.fly) ctx.state.unlockFlyPoint(p.id);
  const pick = await ctx.ui.openRegionMap({ fly: true });
  if (!pick) return;
  const to = await resolveFlyTarget(pick, loadMapDefinition);
  if (!to) { await ctx.say('Ese lugar todavía no existe en el juego.', { speaker: 'Cartógrafa' }); return; }
  await ctx.warp(to.mapId, to.x, to.y, to.dir);
}

const W = 40;
const H = 30;
export const DEV_SERVICES_DOORS = Object.freeze({ centro: { x: 9, y: 14 }, tienda: { x: 19, y: 14 } });
const LAKE = { x: 25, y: 8, w: 10, h: 12 };

export default {
  id: 'dev_services',
  name: 'Pruebas de servicios',
  tileset: 1,
  width: W,
  height: H,
  outdoor: true,
  bgm: 'PrismaVilla2',
  battleback: 'Pradera',
  start: { x: 9, y: 16, dir: 2 },
  // Tablas de pesca (formato de encuentros): Caudal, Ruta 4 y Lagos del Alma (docs/POKEDEX_DISTRIBUCION.md).
  encounters: {
    fish_old: [[60, 'MAGIKARP', 8, 15], [25, 'GOLDEEN', 8, 15], [15, 'BARBOACH', 8, 15]],
    fish_good: [[40, 'SEAKING', 25, 30], [40, 'GOLDEEN', 25, 30], [20, 'BARBOACH', 25, 30]],
    fish_super: [[60, 'MAGIKARP', 55, 60], [20, 'GOLDEEN', 55, 60], [14, 'WHISCASH', 55, 60], [5, 'DRATINI', 55, 60], [1, 'DRAGONAIR', 55, 60]],
  },

  build(b) {
    b.fill(null, 'cesped');
    b.rect(null, 0, 0, 4, H, 'bosque');
    b.rect(null, 36, 0, 4, H, 'bosque');
    b.rect(null, 4, 0, 32, 6, 'bosque');
    b.rect(null, 4, 26, 32, 4, 'bosque');
    b.stamp('centro_pokemon', 6, 6);
    b.stamp('tienda_turquesa', 16, 9);
    const path = [];
    for (let y = 15; y <= 18; y++) for (let x = 5; x <= 23; x++) path.push([x, y]);
    for (let y = 18; y <= 23; y++) for (let x = 11; x <= 19; x++) path.push([x, y]);
    b.paint('camino_arena', path);
    const lake = [];
    for (let y = LAKE.y; y < LAKE.y + LAKE.h; y++) for (let x = LAKE.x; x < LAKE.x + LAKE.w; x++) lake.push([x, y]);
    b.paint('agua', lake);
    b.paint('orilla', lake);
    b.stamp('roca_agua', 30, 12);
    b.stamp('cartel_madera', 22, 16);
    b.stamp('arbol', 5, 20);
    b.stamp('arbol', 22, 21);
    b.stamp('macizo_flores', 13, 7);
  },

  // Solo en esta zona de pruebas: las tres cañas en la Mochila desde el principio (para el humo de la pesca).
  onEnter: async (ctx) => {
    for (const rod of ['OLDROD', 'GOODROD', 'SUPERROD']) if (!ctx.state.hasKeyItem(rod)) ctx.state.addKeyItem(rod);
  },

  warps: [
    { ...DEV_SERVICES_DOORS.centro, to: 'dev_services_centro', ...CENTER_ENTRY, door: true },
    { ...DEV_SERVICES_DOORS.tienda, to: 'dev_services_tienda', tx: SHOP_LAYOUT.door.x, ty: SHOP_LAYOUT.door.y, dir: 8, door: true },
  ],

  events: [
    {
      id: 'cartel', type: 'sign', x: 22, y: 16,
      text: 'ZONA DE PRUEBAS DE SERVICIOS\nCentro Pokémon · Tienda · Lago para pescar al este.',
    },
    {
      id: 'pescador', x: 23, y: 13, sprite: 'anil:pescador', dir: 2, move: 'look',
      script: async (ctx) => {
        await ctx.say('¡El lago está lleno de Pokémon! Toma, prueba con estas cañas.', { speaker: 'Pescador' });
        for (const rod of ['OLDROD', 'GOODROD', 'SUPERROD']) if (!ctx.state.hasKeyItem(rod)) await ctx.giveItem(rod);
        await ctx.say('Ponte mirando al agua y usa una caña desde la Mochila. Cuando pique, ¡pulsa rápido!', { speaker: 'Pescador' });
      },
    },
    moveTutorEvent({ id: 'tutor', x: 12, y: 21, moves: ['THUNDERPUNCH', 'FIREPUNCH', 'ICEPUNCH'], cost: { money: 500 }, speaker: 'Tutor' }),
    moveReminderEvent({ id: 'recordador', x: 15, y: 21, cost: { item: 'HEARTSCALE', count: 1 }, speaker: 'Recordador' }),
    innkeeperEvent({ id: 'posadero', x: 18, y: 21, price: 100, storm: true, speaker: 'Posadero' }),
    { id: 'escamas', type: 'item', x: 13, y: 23, item: 'HEARTSCALE', count: 3 },
    { id: 'cartografa', x: 6, y: 17, sprite: 'anil:fotografa', dir: 2, move: 'look', script: cartographer },
  ],
};
