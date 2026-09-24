// Clases genéricas de entrenador para rutas, con arte ORIGINAL de Añil (sin arte propio de Axis).
// Cada alias une un charset de Graphics/Characters con el sprite frontal de Graphics/Trainers que le
// corresponde (parejas revisadas a ojo: mismo atuendo y colores). Se usan con el prefijo 'anil:':
//   getCharacter('anil:bichero')     → charset del mapa (cazabichos.png)
//   getBattleSprite('anil:bichero')  → sprite de combate (Trainers/CAZABICHOS.png)
// En un entrenador (content/trainers): { class: 'Bichero', overworld: 'anil:bichero', sprite: 'anil:bichero' }.
// `trainerClass` es el nombre de clase propuesto en español (el mapa puede usar otro).

const cls = (charset, front, trainerClass, gender) => Object.freeze({ charset, front, trainerClass, gender });

export const ANIL_CLASSES = Object.freeze({
  joven: cls('chaval3', 'CHICO', 'Joven', 'M'),
  chica: cls('chica1', 'CHICA', 'Chica', 'F'),
  aspirante: cls('guay', 'GUAY', 'Aspirante', 'M'),
  aspirante_f: cls('guaya', 'GUAYA', 'Aspirante', 'F'),
  bichero: cls('cazabichos', 'CAZABICHOS', 'Bichero', 'M'),
  bichera: cls('cazabichas', 'CAZABICHAS', 'Bichera', 'F'),
  excursionista: cls('campista', 'CAMPISTO', 'Excursionista', 'M'),
  excursionista_f: cls('campistaa', 'CAMPISTA', 'Excursionista', 'F'),
  montanero: cls('montanero', 'MONTANERO', 'Montañero', 'M'),
  nadador: cls('nadador', 'NADADOR', 'Nadador', 'M'),
  nadadora: cls('nadadora', 'NADADORA', 'Nadadora', 'F'),
  pescador: cls('pescador', 'PESCADOR', 'Pescador', 'M'),
  pescadora: cls('pescadoraow', 'PESCADORA', 'Pescadora', 'F'),
  cientifico: cls('cientifico', 'CIENTIFICO', 'Científico', 'M'),
  cientifica: cls('cientifica', 'CIENTIFICA', 'Científica', 'F'),
  cerebrito: cls('cerebrito', 'CEREBRITO', 'Cerebrito', 'M'),
  estudiante: cls('estudianta', 'ESTUDIANTA', 'Estudiante', 'F'),
  dama: cls('damisela', 'DAMISELA', 'Dama', 'F'),
  joven_rica: cls('jovenrica', 'JOVENRICA', 'Joven rica', 'F'),
  ornitologo: cls('ornitologo', 'ORNITOLOGO', 'Ornitólogo', 'M'),
  karateka: cls('luchador', 'KARATEKA', 'Karateka', 'M'),
  karateka_f: cls('luchadora', 'KARATEKAA', 'Karateka', 'F'),
  veterano: cls('veterano', 'VETERANO', 'Veterano', 'M'),
  veterana: cls('veterana', 'VETERANA', 'Veterana', 'F'),
  fotografa: cls('fotografa', 'FOTOGRAFA', 'Fotógrafa', 'F'),
  marinero: cls('marinero', 'MARINERO', 'Marinero', 'M'),
  mecanico: cls('operario', 'MECANICO', 'Mecánico', 'M'),
  mecanica: cls('operaria', 'MECANICA', 'Mecánica', 'F'),
  tecnico: cls('tecnico', 'TECNICO', 'Técnico', 'M'),
  medium: cls('medium', 'MEDIUM', 'Médium', 'M'),
  exorcista: cls('exorcista', 'EXORCISTA', 'Exorcista', 'F'),
  malabarista: cls('malabarista', 'MALABARISTA', 'Malabarista', 'M'),
  motorista: cls('motorista', 'MOTORISTA', 'Motorista', 'M'),
  pokemaniaco: cls('pokemaniaco', 'POKEMANIACO', 'Pokémaníaco', 'M'),
});

/** Ids de alias ('joven', 'bichero'…), en orden de declaración. */
export function listAnilClasses() {
  return Object.keys(ANIL_CLASSES);
}
