// Inscripciones de las ruinas del primer piso; no añaden condiciones a los puzzles de las capas.
export function anteaBaseEvents() {
  return [
    {
      id: 'b14_estela_ruinas', x: 7, y: 12, solid: true, noOver: true, trigger: 'action',
      script: async (ctx) => {
        await ctx.say('Las piedras conservan los nombres de calles y plazas de Antea. La ciudad quedó encerrada en esta columna cuando se hundió.');
        await ctx.say('Una escalera sube a las salas de las caracolas. Allí, distintas épocas ocupan el mismo espacio.');
      },
    },
    {
      id: 'b14_estela_pisos', x: 19, y: 12, solid: true, noOver: true, trigger: 'action',
      script: async (ctx) => {
        await ctx.say('El relieve muestra tres alturas: las ruinas de Antea abajo, sus capas del tiempo en el centro y el nido del Guardián en lo alto.');
      },
    },
  ];
}
