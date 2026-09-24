// Textos del sistema de campo de Zygarde. Voz de Zygarde: sobria, breve y telepática (biblia §8, §13.10):
// «recordar» es lenguaje de recuperación, sin explicar la profecía ni hacerlo cómico.
// Las escenas propias de cada bloque (N2, N3, puente de hielo…) viven en el guion del bloque; estas son las
// versiones cortas GENÉRICAS de la activación diferida (CAMPANA §2.1, regla general).
// La línea de Embestida es literal de CAMPANA §2.1.

/** Línea telepática de la escena corta de «recuerdo» por capacidad. */
export const MEMORY_LINES = Object.freeze({
  run: ['Mis partes se juntan. Ya puedo llevarte.'],
  ram: ['Recuerdo cómo se abre paso.'],
  terrain: ['Recuerdo cómo se pisa la tierra blanda.'],
  climb: ['Recuerdo cómo se sube.'],
  swim: ['Recuerdo el agua. Súbete.'],
  detect: ['Os oigo mejor. Sé dónde estáis.'],
  dive: ['Mi campo te cubrirá. Podemos bajar.'],
  complete: ['Estoy entero.'],
  jump: ['Súbete. Esta forma conoce los caminos viejos.'],
  anchor: ['Puedo sostener lo que se tuerce.'],
});

/** Aviso del sistema tras la escena (\\c[3] = verde). */
export const UNLOCK_TEXT = (name) => `Zygarde ha recuperado: \\c[3]${name}\\c[0].`;

/** Cambio de forma al desbloquearla. */
export const FORM_TEXT = Object.freeze({
  10: 'Las células envuelven al Core. Zygarde adopta la \\c[3]Forma 10 %\\c[0].',
  50: 'Las células se trenzan. Zygarde adopta la \\c[3]Forma 50 %\\c[0].',
  complete: 'Todas las células convergen. Zygarde adopta la \\c[3]Forma Completa\\c[0].',
});

const NUMBERS = ['cero', 'una', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez',
  'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte'];

/** Número en palabras (femenino: «una parte»), en cifras a partir de 21. */
export function numberWord(n) {
  return Number.isInteger(n) && n >= 0 && n < NUMBERS.length ? NUMBERS[n] : String(n);
}

/** «Me faltan dos partes.» (CAMPANA §2.1). */
export function missingPartsLine(n) {
  if (n === 1) return 'Me falta una parte.';
  return `Me faltan ${numberWord(n)} partes.`;
}

/** Textos de los obstáculos del mundo (sin cifras: CAMPANA §1.1). */
export const FIELD_TEXT = Object.freeze({
  cellFound: 'Has encontrado una Célula de Zygarde.',
  ramRock: 'Una roca con una fisura blanca. Tiembla un poco al tocarla.',
  ramLog: 'Unos troncos caídos cierran el paso. La madera está rajada.',
  ramAsk: '¿Quieres que Zygarde embista?',
  ramDone: '¡Zygarde ha abierto paso!',
  roughMud: 'Barro hondo. Los pies se hunden hasta el tobillo.',
  roughSand: 'Arena honda. Aquí no se puede avanzar a pie.',
  roughSnow: 'Nieve profunda. Te hundes a cada paso.',
  roughMounted: 'Hace falta ir montado en Zygarde para cruzar esto.',
  gravel: 'Una cuesta de grava suelta. A pie, resbalas.',
  gravelAsk: '¿Quieres montar en Zygarde?',
  cantDismount: 'Aquí no puedes bajarte.',
  cantMount: 'Aquí no puedes montar.',
  climbWall: 'Una pared con vetas verdes. Parece que se podría subir.',
  climbWallDown: 'Una pared con vetas verdes. Parece que se podría bajar.',
  climbAsk: '¿Quieres trepar con Zygarde?',
  climbDownAsk: '¿Quieres bajar con Zygarde?',
  diveBlocked: 'El agua forma un remolino oscuro. Es muy profunda.',
  diveAsk: '¿Quieres sumergirte con Zygarde?',
  surfaceAsk: '¿Quieres subir a la superficie?',
  ventRefill: 'El respiradero renueva el campo de Zygarde.',
  diveDepleted: 'El campo de Zygarde se debilita…',
  diveReturn: 'Zygarde te ha llevado de vuelta al último respiradero.',
  rebuildBlocked: 'Un zócalo de piedra con hexágonos gastados. Al otro lado falta el camino.',
  rebuildAsk: '¿Quieres que Zygarde reconstruya el camino?',
  rebuildDone: 'El camino ha vuelto a su sitio.',
  flyAsk: '¿Adónde quieres volar?',
  cantFly: 'Aquí no se puede volar.',
  noArca: 'Hace falta el Arca de Zygarde para cambiar de forma.',
  formChanged: (name) => `Zygarde ha adoptado la ${name}.`,
  anchorDone: 'El espacio ha quedado fijo.',
  cantAnchor: 'Aquí no hay nada que anclar.',
});
