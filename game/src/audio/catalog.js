// Catálogo semántico de audio: nombre de uso en el juego → archivo real de Añil (módulo PURO).
//
//   engine.audio.playSE('cursor')          → Audio/SE/GUI sel cursor.ogg (volumen 80 %, como Essentials)
//   engine.audio.playBGM('battle_wild')    → Audio/BGM/Salvaje.ogg
//   engine.audio.playME('item_get')        → Audio/ME/Item get.wav
//
// Cualquier nombre que no esté aquí se interpreta como nombre de archivo de Añil (sin extensión),
// p. ej. playSE('GUI sel cursor') o playSE('Anim/Fire1').
//
// ─── MÚSICA: TODAS LAS ASIGNACIONES DE BGM SON PROVISIONALES Y REEMPLAZABLES ───────────────────────
// Axis no tiene banda sonora aprobada (biblia §14: "No existe una composición aprobada ni instrumento
// obligatorio"; no se inventan leitmotivs de Gael, Genesis, el profesor ni los Pilares). Estas pistas se
// eligieron de la biblioteca de Añil solo para poder jugar y probar (registro X04 en docs/DECISIONES.md).
// Para cambiar una, basta con editar `file` (y `alt` enumera candidatas ya comprobadas en disco).
// El pueblo inicial sigue la única dirección documentada: música nostálgica, "ni excesivamente alegre,
// ni triste, ni inquietante" (biblia §14).
// ─────────────────────────────────────────────────────────────────────────────────────────────────

const P = 'PROVISIONAL (reemplazable)';

export const BGM = Object.freeze({
  title: { file: 'Titulo', alt: ['title_origin', 'Intro'], desc: 'Pantalla de título', note: P },
  // Coincide con el ejemplo de docs/ARCHITECTURE.md §5 (pueblo_inicial → 'PrismaVilla1'). Sin escucha
  // aprobada por el autor: las alternativas son pueblos tranquilos de Añil (Marengo es rural, Paleta clásico).
  town_start: {
    file: 'PrismaVilla1',
    alt: ['PuebloMarengo', 'PuebloPaleta', 'PrismaVilla2'],
    desc: 'Pueblo inicial: nostálgica, ni muy alegre, ni triste, ni inquietante (biblia §14, X04)',
    note: P,
  },
  town: { file: 'PrismaVilla2', alt: ['PuebloMarengo', 'CiudadVerde'], desc: 'Pueblo/ciudad genérico', note: P },
  route: { file: 'Ruta 1', alt: ['Ruta 2', 'Ruta 3', 'PrismaRuta1'], desc: 'Ruta', note: P },
  forest: { file: 'BosqueVerde', alt: ['PrismaBosqueArcoiris'], desc: 'Bosque', note: P },
  cave: { file: 'Cueva', alt: ['CuevaCeleste'], desc: 'Cueva', note: P },
  ruins: { file: 'LeyendaPrisma', alt: ['CuevaCeleste', 'Lugar Fantasmal'], desc: 'Ruinas / Pilares', note: P },
  lab: { file: 'Laboratorio', alt: [], desc: 'Laboratorio público del pueblo', note: P },
  pokecenter: { file: 'CentroPokemon', alt: [], desc: 'Centro Pokémon', note: P },
  genesis_base: { file: 'SilphSA', alt: ['GuaridaRocket'], desc: 'Instalaciones de Team Genesis (organización científica)', note: P },
  prologue: { file: 'Climax', alt: ['Amenaza', 'Legendario mayor'], desc: 'Prólogo: impactos, silencio y cambios de tiempo (biblia §14)', note: P },
  tension: { file: 'Amenaza', alt: ['Transicion', 'Climax'], desc: 'Tensión / sigilo en el área restringida', note: P },
  distortion: { file: 'Lugar Fantasmal', alt: ['Torre Pokemon'], desc: 'Mundo Distorsión', note: P },
  battle_wild: { file: 'Salvaje', alt: ['PrismaSalvaje'], desc: 'Combate salvaje', note: P },
  battle_trainer: { file: 'Entrenador', alt: ['PrismaEntrenador'], desc: 'Combate contra entrenador', note: P },
  battle_rival: { file: 'CombateRival', alt: ['CombateHoenn'], desc: 'Combate contra el rival (Gael)', note: P },
  battle_genesis: { file: 'CombateComandante', alt: ['CombateGiovanni'], desc: 'Combate contra Team Genesis', note: P },
  battle_boss: { file: 'PrismaBoss', alt: ['CombateGiovanni', 'PrismaBossFinal'], desc: 'Combate contra jefe', note: P },
  battle_legendary: { file: 'Legendario', alt: ['Legendario mayor', 'Legendario menor'], desc: 'Combate contra legendario', note: P },
  battle_last_pokemon: { file: 'Ultimo Pokemon', alt: [], desc: 'Último Pokémon del rival importante', note: P },
  low_hp: { file: 'Battle low HP', alt: [], desc: 'Música de PS bajos en combate', note: P },
  intro_trainer: { file: 'EncuentroJoven', alt: [], desc: 'Entrenador te ve (joven)', note: P },
  intro_tough: { file: 'EncuentroDuro', alt: [], desc: 'Entrenador te ve (duro)', note: P },
  intro_female: { file: 'EncuentroFemenino', alt: [], desc: 'Entrenadora te ve', note: P },
  intro_genesis: { file: 'EncuentroRocket', alt: [], desc: 'Miembro de Team Genesis te ve', note: P },
  victory_wild: { file: 'VictoriaSalvaje', alt: [], desc: 'Victoria contra salvaje', note: P },
  victory_trainer: { file: 'VictoriaEntrenador', alt: [], desc: 'Victoria contra entrenador', note: P },
  victory_important: { file: 'Victoria Importante', alt: [], desc: 'Victoria importante', note: P },
  victory_genesis: { file: 'VictoriaVillano', alt: [], desc: 'Victoria contra Team Genesis', note: P },
  evolution: { file: 'Evolution', alt: [], desc: 'Evolución (en curso)', note: P },
  bicycle: { file: 'Bicycle', alt: [], desc: 'Bicicleta', note: P },
  credits: { file: 'Creditos', alt: [], desc: 'Créditos', note: P },
});

export const ME = Object.freeze({
  item_get: { file: 'Item get', desc: 'Objeto obtenido' },
  key_item_get: { file: 'Key item get', desc: 'Objeto clave obtenido' },
  tm_get: { file: 'Machine get', desc: 'MT obtenida' },
  pokemon_get: { file: 'Pkmn get', desc: 'Pokémon recibido' },
  heal: { file: 'Pkmn healing', desc: 'Curación en el Centro Pokémon' },
  save: { file: 'GUI save game', desc: 'Partida guardada' },
  capture: { file: 'Battle capture success', desc: 'Captura conseguida' },
  evolution_start: { file: 'Evolution start', desc: 'Empieza la evolución' },
  evolution_success: { file: 'Evolution success', desc: 'Evolución completada' },
  egg_get: { file: 'Egg get', desc: 'Huevo recibido' },
  berry_get: { file: 'Berry get', desc: 'Baya obtenida' },
  forget_move: { file: 'Forget move', desc: 'Olvidar movimiento' },
  fragment_get: { file: 'Badge get', desc: 'Fragmento de Pilar obtenido', note: P },
});

// volume/pitch en la escala de Essentials (100 = normal) cuando el original los fija.
export const SE = Object.freeze({
  // Interfaz
  cursor: { file: 'GUI sel cursor', volume: 80, desc: 'Mover cursor de menú' },
  decision: { file: 'GUI sel decision', volume: 80, desc: 'Seleccionar / confirmar' },
  cancel: { file: 'GUI sel cancel', volume: 80, desc: 'Cancelar / atrás' },
  buzzer: { file: 'GUI sel buzzer', volume: 80, desc: 'Error / acción no permitida' },
  menu_open: { file: 'GUI menu open', volume: 80, desc: 'Abrir menú de pausa' },
  menu_close: { file: 'GUI menu close', volume: 80, desc: 'Cerrar menú' },
  bag_cursor: { file: 'GUI bag cursor', desc: 'Cursor de la Mochila' },
  bag_pocket: { file: 'GUI bag pocket', desc: 'Cambiar bolsillo de la Mochila' },
  party_switch: { file: 'GUI party switch', desc: 'Cambiar orden del equipo' },
  summary_page: { file: 'GUI summary change page', desc: 'Cambiar página de Datos' },
  pokedex_open: { file: 'GUI pokedex open', desc: 'Abrir Pokédex' },
  save_choice: { file: 'GUI save choice', desc: 'Elegir ranura de guardado' },
  naming_confirm: { file: 'GUI naming confirm', desc: 'Confirmar nombre' },
  naming_tab_start: { file: 'GUI naming tab swap start', desc: 'Cambiar teclado (inicio)' },
  naming_tab_end: { file: 'GUI naming tab swap end', desc: 'Cambiar teclado (fin)' },
  storage_pick: { file: 'GUI storage pick up', desc: 'PC: coger Pokémon' },
  storage_put: { file: 'GUI storage put down', desc: 'PC: soltar Pokémon' },
  storage_show_party: { file: 'GUI storage show party panel', desc: 'PC: mostrar equipo' },
  storage_hide_party: { file: 'GUI storage hide party panel', desc: 'PC: ocultar equipo' },
  trainer_card_open: { file: 'GUI trainer card open', desc: 'Abrir tarjeta' },
  trainer_card_flip: { file: 'GUI trainer card flip', desc: 'Girar tarjeta' },
  pc_open: { file: 'PC open', desc: 'Encender PC' },
  pc_access: { file: 'PC access', desc: 'Acceder al PC' },
  pc_close: { file: 'PC close', desc: 'Apagar PC' },
  mart_buy: { file: 'Mart buy item', desc: 'Comprar en la tienda' },
  // Mundo
  door_enter: { file: 'Door enter', desc: 'Entrar por una puerta' },
  door_exit: { file: 'Door exit', desc: 'Salir por una puerta' },
  door_slide: { file: 'Door slide', desc: 'Puerta automática' },
  bump: { file: 'Player bump', desc: 'Choque con muro / obstáculo' },
  jump: { file: 'Player jump', desc: 'Salto de saliente' },
  fall: { file: 'Player fall', desc: 'Caída / aterrizaje' },
  exclaim: { file: 'Exclaim', desc: '¡! de entrenador que te ve' },
  grass_rustle: { synth: 'grass_rustle', desc: 'Pisar hierba alta (sintetizado: Añil no trae sonido de hierba)', note: P },
  poison_step: { file: 'Poison step', desc: 'Paso envenenado' },
  bicycle_bell: { file: 'Bicycle', desc: 'Subir a la bicicleta' },
  use_item: { file: 'Use item in party', desc: 'Usar objeto en un Pokémon' },
  repel: { file: 'Repel', desc: 'Repelente' },
  itemfinder: { file: 'Itemfinder', desc: 'Detector de objetos' },
  cut: { file: 'Cut', desc: 'Corte' },
  rock_smash: { file: 'Rock Smash', desc: 'Golpe roca' },
  strength_push: { file: 'Strength push', desc: 'Empujar roca (Fuerza)' },
  headbutt: { file: 'Headbutt', desc: 'Cabezazo a un árbol' },
  rock_climb: { file: 'Rock Climb EX', desc: 'Escalar' },
  fly: { file: 'Fly', desc: 'Vuelo' },
  teleport: { file: 'Teleport', desc: 'Teletransporte' },
  sweet_scent: { file: 'Sweet Scent', desc: 'Dulce aroma' },
  battle_flash: { file: 'Vs flash', desc: 'Destello de entrada a combate' },
  battle_sword: { file: 'Vs sword', desc: 'Corte de entrada a combate' },
  // Combate
  ball_throw: { file: 'Battle throw', desc: 'Lanzar Poké Ball' },
  ball_throw_critical: { file: 'Battle critical catch throw', desc: 'Lanzamiento de captura crítica' },
  ball_hit: { file: 'Battle ball hit', desc: 'La Poké Ball golpea' },
  ball_absorb: { file: 'Battle jump to ball', desc: 'Pokémon entra en la Poké Ball' },
  ball_drop: { file: 'Battle ball drop', desc: 'La Poké Ball cae' },
  ball_shake: { file: 'Battle ball shake', desc: 'La Poké Ball se sacude' },
  ball_click: { file: 'Battle catch click', desc: 'Clic de captura' },
  ball_open: { file: 'Battle recall', desc: 'Sacar Pokémon (abrir Poké Ball)' },
  recall: { file: 'Battle recall', desc: 'Retirar Pokémon' },
  hit_normal: { file: 'Battle damage normal', desc: 'Golpe normal' },
  hit_super: { file: 'Battle damage super', desc: 'Golpe muy eficaz' },
  hit_weak: { file: 'Battle damage weak', desc: 'Golpe poco eficaz' },
  faint: { file: 'Pkmn faint', desc: 'Pokémon debilitado' },
  exp_gain: { file: 'Pkmn exp gain', desc: 'Barra de experiencia' },
  exp_full: { file: 'Pkmn exp full', desc: 'Barra de experiencia llena' },
  level_up: { file: 'Pkmn level up', desc: 'Subir de nivel' },
  move_learnt: { file: 'Pkmn move learnt', desc: 'Movimiento aprendido' },
  flee: { file: 'Battle flee', desc: 'Huir' },
  ability: { file: 'Battle ability', desc: 'Activación de habilidad' },
  stat_up: { file: 'PRSFX- Stat Up', desc: 'Sube una característica' },
  stat_down: { file: 'PRSFX- Stat Down', desc: 'Baja una característica' },
  shiny: { file: 'Anim/Shiny sparkle', desc: 'Destello variocolor' },
  heal_hp: { file: 'Anim/Recovery', desc: 'Recuperar PS' },
  status_poison: { file: 'Anim/Poison', desc: 'Envenenado' },
  status_paralysis: { file: 'Anim/Paralyze1', desc: 'Paralizado' },
  status_sleep: { file: 'Anim/Sleep', desc: 'Dormido' },
  status_confusion: { file: 'Anim/Confuse', desc: 'Confuso' },
  status_burn: { file: 'Anim/Fire2', desc: 'Quemado' },
  status_freeze: { file: 'Anim/Ice5', desc: 'Congelado' },
  low_hp: { synth: 'low_hp_beep', desc: 'Pitido de PS bajos (sintetizado)' },
  // Axis
  core_signal: {
    synth: 'core_signal',
    source: 'PORYGON',
    desc: 'Señal del Core: grito de Porygon agudizado, electrónico y breve (biblia §5 y §14)',
    note: 'Referencia sonora del autor; archivo final pendiente de revisión (biblia §14)',
  },
});

// Nombres alternativos habituales (español/inglés) → nombre del catálogo.
export const ALIASES = Object.freeze({
  se: {
    select: 'decision', confirm: 'decision', accept: 'decision', seleccionar: 'decision', confirmar: 'decision',
    back: 'cancel', cancelar: 'cancel', error: 'buzzer', abrir_menu: 'menu_open', cerrar_menu: 'menu_close',
    open_menu: 'menu_open', close_menu: 'menu_close', door: 'door_enter', puerta: 'door_enter',
    wall: 'bump', choque: 'bump', ledge: 'jump', salto: 'jump', grass: 'grass_rustle', hierba: 'grass_rustle',
    throw: 'ball_throw', lanzar: 'ball_throw', shake: 'ball_shake', sacudir: 'ball_shake', catch: 'ball_click',
    captura: 'ball_click', damage: 'hit_normal', super_effective: 'hit_super', not_very_effective: 'hit_weak',
    levelup: 'level_up', subir_nivel: 'level_up', senal_core: 'core_signal',
  },
  me: {
    item: 'item_get', key_item: 'key_item_get', objeto: 'item_get', objeto_clave: 'key_item_get',
    pokecenter: 'heal', curacion: 'heal', guardar: 'save', caught: 'capture', evolution: 'evolution_success',
  },
  bgm: {
    wild: 'battle_wild', trainer: 'battle_trainer', rival: 'battle_rival', legendary: 'battle_legendary',
    pueblo: 'town_start', ruta: 'route', cueva: 'cave', laboratorio: 'lab', salvaje: 'battle_wild',
  },
});

const TABLES = { bgm: BGM, me: ME, se: SE };

/** Entrada del catálogo para un nombre semántico (o alias), o null. */
export function catalogEntry(kind, name) {
  const table = TABLES[kind];
  if (!table || typeof name !== 'string') return null;
  if (Object.hasOwn(table, name)) return { id: name, ...table[name] };
  const alias = ALIASES[kind]?.[name.toLowerCase()];
  return alias && Object.hasOwn(table, alias) ? { id: alias, ...table[alias] } : null;
}

/**
 * Traduce un nombre de uso a lo que hay que reproducir.
 * → { id|null, file|null, synth|null, volume (0..100 Essentials), pitch (100 = normal), desc }
 * Si no es semántico, `file` = el nombre recibido (nombre de archivo de Añil).
 */
export function resolveCatalog(kind, name) {
  const entry = catalogEntry(kind, name);
  if (!entry) return { id: null, file: name, synth: null, volume: 100, pitch: 100, desc: '' };
  return {
    id: entry.id,
    file: entry.file || null,
    synth: entry.synth || null,
    source: entry.source || null,
    volume: entry.volume ?? 100,
    pitch: entry.pitch ?? 100,
    desc: entry.desc || '',
    note: entry.note || '',
  };
}

/** Todas las entradas (para la jukebox y los tests). */
export function catalogList() {
  return Object.entries(TABLES).flatMap(([kind, table]) => Object.entries(table).map(([id, e]) => ({ kind, id, ...e })));
}
