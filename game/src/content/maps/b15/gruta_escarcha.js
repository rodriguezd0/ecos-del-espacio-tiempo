// Gruta Escarcha, sala 1 (docs/CAMPANA.md §1.4: «Cueva de hielo», 2 × 40×40, tileset 12, O Villa Boreal, BGM Cueva,
// fondo CuevaHielo; tras P7). Recorte horneado de la Cueva Glaciada de Añil (sala_glaciar_cascada): lago helado con
// cascada, repisas nevadas, pared de enredaderas y una boca hacia la sala honda. C094 «Lago helado» en la repisa del
// oeste (solo a nado) y la Glalita (POKEDEX §7.7). Encuentros de cueva de día y de noche. Eventos en
// content/events/b15_escarcha.js.
import { zoneDefaults } from '../../services/zones.js';
import { ESCARCHA, ESCARCHA2 } from './layout_escarcha.js';
import { BOREAL } from './layout_boreal.js';
import { GRUTA_ESCARCHA } from '../../encounters/b15.js';
import { escarchaEvents } from '../../events/b15_escarcha.js';

const E = ESCARCHA;

export default {
  id: 'gruta_escarcha',
  ...zoneDefaults('gruta_escarcha'),
  tileset: 12,
  width: E.width,
  height: E.height,
  cave: true,
  start: { x: E.entry.x, y: E.entry.y, dir: E.entry.dir },
  encounters: GRUTA_ESCARCHA,
  tone: [-10, 0, 18, 10],
  build(b) {
    b.fill(null, 'vacio');
    b.stamp('sala_glaciar_cascada', E.room.x, E.room.y);
  },
  warps: [
    ...[E.exit.x0, E.exit.x0 + 1, E.exit.x1].map((x) => ({
      x, y: E.exit.y, to: 'villa_boreal', tx: BOREAL.cave.arrival.x, ty: BOREAL.cave.arrival.y, dir: BOREAL.cave.arrival.dir, dirTrigger: 2,
    })),
    { x: E.inner.x, y: E.inner.y, to: 'gruta_escarcha_2', tx: ESCARCHA2.entry.x, ty: ESCARCHA2.entry.y, dir: ESCARCHA2.entry.dir },
  ],
  events: escarchaEvents(),
};
