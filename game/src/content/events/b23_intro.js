import { F, isPostgame, lines, OBJ } from './b23_common.js';

export async function stealNode(ctx) {
  if (!isPostgame(ctx.state) || ctx.flag(F.theft)) return;
  await lines(ctx, [
    'Han pasado meses desde que volvió la calma. La piedra del Laberinto conserva un pulso tenue.',
    'Un borde dorado se abre alrededor de la piedra. Al otro lado se ven tuberías de sal y una luz roja.',
  ]);
  ctx.se?.('PRSFX- Teleport');
  const ring = ctx.effect?.('softLight', { x: ctx.player.x, y: ctx.player.y, radius: 76, color: [238, 193, 96] });
  await ctx.flash?.([255, 211, 110], 20, 145);
  ctx.setFlag(F.theft);
  ring?.remove?.(16);
  ctx.requestRefresh?.();
  await lines(ctx, ['La piedra atraviesa el anillo. Queda una hendidura vacía.', 'Esa abertura no pertenece al Eje.'], 'Zygarde');
  await ctx.say('Alerce debe ver lo que ha ocurrido. Su laboratorio sigue en Villa Alba.');
}
export async function alerceLetter(ctx) {
  if (!isPostgame(ctx.state) || !ctx.flag(F.theft) || ctx.flag(F.letter)) return false;
  await lines(ctx, [
    'Ha llegado esta carta. Solo tiene unas coordenadas de Almenara, al otro lado del mar oriental. Está sin firma.',
    'Reconozco la letra de Gael. No pide que vayamos; quiere que sepamos dónde está.',
    'He avisado al embarcadero de Nexo. El ferri puede dejarte en Puerto Almenara y traerte de vuelta.',
  ], 'Alerce');
  ctx.setFlag(F.letter);
  ctx.requestRefresh?.();
  return true;
}
export function withAlerceLetter(events) {
  return events.map((event) => event.id !== 'alerce' ? event : { ...event, script: async (ctx) => {
    if (!(await alerceLetter(ctx))) await event.script?.(ctx);
  } });
}
export function withAlmenaraNode(events) {
  return events.map((event) => event.id !== 'b22a_nodo_laberinto' ? event : {
    ...event, pages: [...event.pages, {
      when: (s) => isPostgame(s) && !s.flag(F.theft), through: true, trigger: 'action',
      sprite: event.pages[0].sprite, dir: event.pages[0].dir, script: stealNode,
    }, {
      when: (s) => isPostgame(s) && s.flag(F.theft) && !s.flag(F.nodeReturned),
      sprite: null, through: true, trigger: 'action',
      script: (ctx) => ctx.say(ctx.flag(F.letter) ? 'La hendidura está vacía. El ferri de Nexo lleva a Almenara.' : 'La hendidura está vacía. Alerce está en su laboratorio.'),
    }],
  });
}
