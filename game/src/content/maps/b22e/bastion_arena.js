import { zoneDefaults } from '../../services/zones.js';
import { ARENA as A, RECEPTION as R } from './bastion_layout.js';
import { exitArrowEvents, exitWarps } from '../../services/interior.js';

export default {
  id: 'bastion_arena', ...zoneDefaults('bastion_axis'), name: 'Bastión Axis · arena',
  tileset: 8, width: 21, height: 21, outdoor: false, battleback: 'Interior', start: A.entry,
  build(b) {
    b.fill(null, 'vacio'); b.rect(null, 1, 1, 19, 19, 'sala_dorado');
    b.rect(null, 8, 8, 5, 10, 'alfombra_rombos'); b.stamp('emblema_anillo', 8, 10);
    b.stamp('estatua_busto', 4, 5); b.stamp('estatua_busto', 16, 5);
    b.stamp('trofeo', 10, 3); b.stamp('planta_alta', 3, 10); b.stamp('planta_alta', 17, 10);
    b.stamp('pilar_escalinata', A.entry.x - 1, 18);
  },
  warps: exitWarps(A.entry.x, 19, { map: 'bastion_recepcion', ...R.front }),
  events: [
    { id: 'arbitro_bastion', ...A.guide, sprite: 'anil:veterano', solid: true, trigger: 'action',
      script: async (ctx) => { await ctx.say('La inscripción se hace en recepción. Puedes salir por la escalera del fondo.'); } },
    { id: 'aspirante_bastion', ...A.opponent, sprite: 'anil:aspirante', solid: true, trigger: 'action',
      script: async (ctx) => { await ctx.say('Aquí cada decisión cuenta. ¡Que tengamos un buen combate!'); } },
    ...exitArrowEvents(A.entry.x, 20),
  ],
};
