// Piso 3 del Pilar de la Memoria: Olvido y restauración; el puzzle permanece en archivo_hondo.
import { buildMemoriaNucleo } from './hondo_build.js';
import { MEMORIA_STAIRS, HONDO_ITEMS } from './hondo_layout.js';
import { nucleoEvents } from '../../events/b10_hondo_nucleo.js';
import { pilarTone } from '../../stamps/pilar.js';
import { withGuardianRematch } from '../../events/b22e_guardians.js';

const a = MEMORIA_STAIRS.coreArrival;
const back = MEMORIA_STAIRS.puzzleArrival;

export default {
  id: 'archivo_hondo_nucleo', name: 'Pilar de la Memoria · Piso 3',
  pillar: { id: 'P5', floor: 3 },
  tileset: 11, width: 34, height: 28, outdoor: false, cave: true,
  bgm: 'Emociones', battleback: 'Templo', tone: pilarTone('P5'),
  start: { ...a }, build: buildMemoriaNucleo,
  warps: [{ x: MEMORIA_STAIRS.down.x, y: MEMORIA_STAIRS.down.y, dirTrigger: 8,
    to: 'archivo_hondo', tx: back.x, ty: back.y, dir: back.dir }],
  events: withGuardianRematch([...nucleoEvents(), ...HONDO_ITEMS.filter((it) => it.id === 'objeto_hondo_5').map((it) => ({ ...it, type: 'item' }))], 'olvido'),
  onEnter(ctx) {
    if (ctx.state.selfSwitch('archivo_hondo', 'objeto_hondo_5')) ctx.state.setSelfSwitch('archivo_hondo_nucleo', 'objeto_hondo_5');
    ctx.requestRefresh?.();
  },
};
