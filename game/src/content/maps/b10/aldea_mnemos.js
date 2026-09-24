// Aldea Mnemos (B10; docs/CAMPANA.md §1.3 y «B10 — Pilar de la Memoria»): aldea de bambú, cerezos y archivos al pie
// del Bosque Neblino. Centro, herbolario, casa de té, Santuario de los Glifos, casa de Olvido Arrieta y el Archivo,
// bajo el que se hunde el Archivo Hondo (P5). Hasta el P5 la «niebla del olvido» baja del bosque: los vecinos olvidan
// nombres y el camino del norte (Ruta 9) da vueltas sobre sí mismo. Salidas: S Ruta 8 / Marisma (B09) · N Ruta 9 (B11).
// Tileset 9. Construcción en mnemos_build.js; eventos en content/events/b10_mnemos*.js.
import { W, H, buildMnemos, MNEMOS_BRUSHES } from './mnemos_build.js';
import { BUILDINGS, INTERIOR_ENTRIES, FLY_POINT, START } from './mnemos_layout.js';
import { linkIfReady } from './pending_links.js';
import { mnemosEvents } from '../../events/b10_mnemos.js';
import { mnemosOnEnter } from '../../events/b10_mnemos_story.js';
import { ALDEA_MNEMOS } from '../../encounters/b10.js';

const door = (bd, to) => {
  const e = INTERIOR_ENTRIES[to];
  return { x: bd.door.x, y: bd.door.y, to, tx: e.x, ty: e.y, dir: 8, door: true };
};

export default {
  id: 'aldea_mnemos',
  name: 'Aldea Mnemos',
  tileset: 9,
  width: W,
  height: H,
  outdoor: true,
  bgm: 'PrismaVilla1',
  battleback: 'Pradera',
  start: START,
  flyPoint: FLY_POINT,
  encounters: ALDEA_MNEMOS,
  brushes: MNEMOS_BRUSHES,

  build: buildMnemos,

  warps: [
    door(BUILDINGS.centro, 'mnemos_centro'),
    door(BUILDINGS.herbolario, 'mnemos_herbolario'),
    door(BUILDINGS.te, 'mnemos_casa_te'),
    door(BUILDINGS.olvido, 'mnemos_casa_olvido'),
    door(BUILDINGS.jacinta, 'mnemos_casa_jacinta'),
    door(BUILDINGS.santuario, 'mnemos_santuario'),
    door(BUILDINGS.archivo, 'mnemos_archivo'),
  ],

  connections: [linkIfReady('ruta_8_marisma'), linkIfReady('ruta_9_neblino')].filter(Boolean),

  onEnter: mnemosOnEnter,
  events: mnemosEvents(),
};
