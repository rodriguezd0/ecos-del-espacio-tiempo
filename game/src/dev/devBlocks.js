// Estado de entrada de cada bloque de la campaña (B01–B21, con B09a y B09b por separado) para el modo desarrollador
// «Saltar al inicio de un bloque». Módulo PURO de datos (sin dependencias, Node y navegador).
//
// Criterio: el estado de BNN es lo que el jugador tendría al terminar B(NN-1) y justo antes de empezar BNN,
// ACUMULADO. De dónde sale cada dato:
//   · map/x/y/dir: la URL de prueba del inicio del bloque (content/maps/bXX/README.md) o la primera etapa de
//     tools/e2e_bXX*.mjs. B01 empieza en la habitación tras la intro (casa_prota_2f, `start` 8,6 ↓).
//   · flags: las de fin de cada bloque anterior (docs/CAMPANA.md, «Salida») más la cadena obligatoria de cada uno
//     (las constantes F de content/events/bXX_common.js y los BASE_FLAGS de los E2E), las que otros bloques leen
//     (b01_left_town, b02_libreta, b03_gael_b2, b07_megaring, b11_planos_talasa, b16_t14_carta, b19_tablilla…) y las
//     de las Tablillas que ya se cuentan en `tablets`. Se omiten regalos, capturas y flags opcionales (torres, Círculo).
//   · zygarde: content/zygarde/thresholds.js (capacidades, formas, núcleos) y las células de los E2E/README.
//   · fragments / tablets: número (los aplica el modo desarrollador como ?fragments=N y ?tablets=N: F01…FN y las N
//     primeras de content/story/tablets.js). Tablillas contadas al acabar el bloque que las resuelve (T03 y T05
//     dependen de un Pilar posterior: cuentan en B07 y en B09b respectivamente).
//   · party: curva de niveles de CAMPANA (nivel ~ de entrada de cada bloque; B02–B05 con la curva del principio
//     rebajada, DECISIONES X35). La auditoría de fugas (tools/audit_progression.mjs) usa el nivel más alto como el
//     esperado de la etapa. Inicial TURTWIG, Gael LITTEN y el
//     inicial que nadie eligió (SOBBLE) de Alerce al acabar el P2 (b04_inicial).
//   · flyPoints: ids de lugar del atlas (ui/logic/regionMapData.js). El Vuelo solo existe tras 'fly' (fin de B16);
//     antes, []. mesa_vientos se desbloquea por guion en la T14 (B17).
//   · keyItems / items: ids de game/data/items.json e items_axis.json. La Pokédex va en `pokedex` (POKEDEXAXIS) y
//     los Fragmentos en `fragments` (AZUREFRAGMENT con contador).
// Se comprueba con un script externo (mapas en MAPS, especies, objetos y casilla dentro del mapa).

/** Flags que deja cada bloque al terminarse (cadena obligatoria + salida). Se acumulan en `flagsBefore`. */
const DONE = Object.freeze({
  B01: [
    'prologue_seen', 'b01_woke', 'b01_met_mom', 'b01_lab_intro_seen', 'b01_starter_chosen', 'b01_signal_heard',
    'b01_police_entered', 'b01_core_found', 'b01_escorted', 'b01_gael_duel_done', 'b01_dex_received', 'b01_mom_gift',
    'b01_left_town',
  ],
  B02: [
    'b02_centro_tutorial', 'b02_gael_espera', 'b02_casilda_acompana', 'b02_antesala', 'b02_galeria', 'b02_dinteles',
    'b02_camara_geodude', 'b02_geodude_libre', 'b02_roca_rota', 'b02_casilda_vencida', 'b02_nucleo', 'b02_atajo',
    'b02_salida', 'b02_gael_se_va', 'b02_libreta', 'p1_restored', 'verse_1', 'zyg_10',
  ],
  B03: [
    'b03_t01_jardinero', 'b03_t01_vista', 'b03_t01_semilla', 'b03_t01_tablilla', 'b03_lia_repartir',
    'b03_caudal_llegada', 'b03_gael_b2', 'b03_gael_b2_ganado', 'b03_llamada_alerce', 'b03_leandro_visto',
    'b03_anselmo_t02', 'b03_cana_vieja',
  ],
  B04: [
    'b04_garganta_llegada', 'b04_balizas_retiradas', 'b04_choque', 'b04_reto', 'b04_ciclo', 'b04_leandro_vencido',
    'b04_inscripcion', 'p2_restored', 'verse_2', 'b04_leandro_despedida', 'b04_gracias', 'b04_inicial',
  ],
  B05: [
    'b05_t02_anselmo', 'b05_molino_puerta', 'b05_t02_engranaje_p', 'b05_t02_engranaje_m', 'b05_t02_engranaje_g',
    'b05_t02_eje_abierto', 'b05_t02_tecnicos', 'b05_t02_dario', 'b05_t02_tablilla',
    'b05_brontia',
  ],
  B06: [
    'b06_meseta_intro', 'b06_gael_parque', 'b06_doble_ganado', 'b06_casia_presentada', 'b06_casia_vencida',
    'b06_colector_roto', 'b06_gael_pantallas', 'b06_gael_se_fue', 'zyg_core_2', 'b06_abril_conocida',
    'b06_abril_retada', 'b06_abril_vencida', 'b06_galerias_vistas', 'b06_sala_vista', 'b06_campanas',
    'b06_abril_sala', 'p3_restored', 'verse_3', 'b06_abril_despedida',
    // T03 (Brontia): se cierra con Abril en su casa tras el P3 (CAMPANA B05: «antes o después de P3»).
    'b05_t03_sixto', 'b05_t03_abril', 'b05_t03_campanil', 'b05_t03_operaria', 'b05_t03_circuito', 'b05_t03_rayo',
    'b05_t03_elekid', 'b05_t03_tablilla', 'b05_brontia_luz',
  ],
  B07: [
    'b07_llegada', 'b07_tecnicos', 'b07_garrido', 'b07_alerce', 'b07_timburr_1', 'b07_timburr_2', 'b07_timburr_3',
    'b07_quino', 'b07_tablilla', 'b07_piedra', 'b07_rescate', 'b07_denuncia', 'b07_megaring', 'b07_ruta_despejada',
    'b07_llamada_derrumbe', 'b07_galerias_vistas', 'b07_sala3_vista', 'b07_alerce_se_fue',
  ],
  B08: [
    'b08_llegada', 'b08_discusion', 'b08_mina_vista', 'b08_mina_tecnicos', 'b08_garrido_visto', 'b08_garrido',
    'b08_fermin_cerro', 'b08_cerro_visto', 'b08_cerro_abierto', 'b08_camara_vista', 'b08_cruje', 'b08_caida',
    'b08_placa_pista', 'b08_balanza', 'b08_fermin_reto', 'b08_fermin', 'p4_restored', 'verse_4',
    'b08_fermin_despedida', 'b08_cooperativa', 'b08_fosiles', 'b08_honda_vista',
  ],
  B09A: [
    'b09_r7_llegada', 'b09_gala_invitacion', 'b09_gala', 'b09_gael_b3', 'b09_gael_b3_ganado', 'b09_t06_noche',
    'b09_t06_original', 'b09_t06_persecucion', 'b09_t06_restauradores', 'b09_t06_tablilla', 'b09_ficha_laguna',
    'b09_t08_pista', 'b09_ivan', 'b09_reserva_paso', 'b09_t07_colmena', 'b09_t07_flor_pradera',
    'b09_t07_flor_ribera', 'b09_t07_flor_huerto', 'b09_t07_flores', 'b09_t07_alfa', 'b09_t07_tablilla',
    'b09_reserva_abierta',
    // T05 (Estrato, Losa del Pulso): pide p4_restored, se resuelve en el tramo B09.
    'b08_t05_losa', 'b08_t05_herminia', 'b08_t05_torneo_abierto', 'b08_t05_torneo', 'b08_t05_defensa_empezada',
    'b08_t05_defensa', 'b08_t05_tablilla',
  ],
  B09B: [
    'b09_marisma_llegada', 'b09_t08_remedios', 'b09_t08_alerce', 'b09_t08_bomba_1', 'b09_t08_bomba_2',
    'b09_t08_bomba_3', 'b09_t08_bombas', 'b09_t08_lecturas', 'b09_t08_tablilla', 'b09_marisma_sana',
    'b09_marisma_norte', 'b09_nexo_cana_buena', 'b09_nexo_mercado_t12', 'b09_nexo_talasa_vista', 'b09_r15_mareas',
    'b09_caleta_supercana', 'b09_caleta_ramon_t11',
  ],
  B10: [
    'b10_llegada', 'b10_olvido_conocida', 'b10_nota_sabina', 'b10_nota_tome', 'b10_nota_jacinta', 'b10_nota_amaro',
    'b10_nota_bruno', 'b10_notas_repartidas', 'b10_archivo_abierto', 'b10_casia', 'b10_olvido_baja',
    'b10_hondo_visto', 'b10_suelo', 'b10_manos', 'b10_lectura', 'b10_rollos', 'b10_mural_visto', 'b10_mural',
    'b10_olvido_retada', 'b10_olvido_vencida', 'p5_restored', 'verse_5', 'b10_alerce', 'b10_informe',
    'b10_niebla_levantada',
  ],
  B11: [
    'b11_neblino_intro', 'b11_t10_nilo_visto', 'b11_t10_nilo_cuenta', 'b11_t10_cuadrilla_vista', 'b11_t10_cuadrilla',
    'b11_t10_alfa', 'b11_t10_tablilla', 'b11_nilo_desertor', 'b11_planos_talasa', 'b11_t09_iker',
    'b11_t09_dibujos', 'b11_t09_pozo_deducido', 'b11_t09_pozo_abierto', 'b11_t09_tablilla', 'b11_t09_iker_curado',
    'b11_regreso', 'b11_huevo', 'b11_huevo_aviso', 'b11_gael_alerce', 'b11_campamento_visto', 'b11_exp03',
    'b11_gael_b4', 'b11_cerro_visto',
  ],
  B12: [
    'b12_monte_llegada', 'b12_aljibe_abierto', 'b12_repisa_vista', 'b12_interior_visto', 'b12_caida_vista',
    'b12_ancla_vista', 'b12_cara_1_vista', 'b12_cara_2_vista', 'b12_cara_3_vista', 'b12_cara_vuelta',
    'b12_mirada_vista', 'b12_mirada', 'b12_sumidero_visto', 'b12_pulsador_1', 'b12_pulsador_2', 'b12_pulsador_3',
    'b12_sombra', 'b12_pista_caida', 'b12_sumidero', 'b12_nucleo_visto', 'b12_sello', 'b12_respuesta', 'b12_regreso',
    'b12_lucarita', 'p6_restored', 'verse_6', 'zyg_50', 'zyg_core_3',
  ],
  B13: [
    'b13_mar_llamada', 'b13_talasa_llegada', 'b13_talasa_control', 'b13_talasa_invernadero', 'b13_talasa_tarjeta',
    'b13_talasa_foto', 'b13_talasa_lab_dentro', 'b13_talasa_combate', 'b13_talasa_n4', 'b13_nilo_porygon',
    'b13_talasa', 'b13_alerce_gael', 'zyg_core_4', 'b13_buceo_pista', 'b13_buceo_escena', 'b13_dive_resonance',
    'zyg_dive', 'b13_t11_ramon', 'b13_t11_islote', 'b13_t11_baile', 'b13_t11_lucia', 'b13_t11_tablilla',
    'b13_t11_fiesta', 'b13_t12_llegada', 'b13_t12_brasa', 'b13_t12_respiradero_1', 'b13_t12_respiradero_2',
    'b13_t12_respiradero_3', 'b13_t12_respiraderos', 'b13_t12_jefa', 'b13_t12_tablilla',
  ],
  B14: [
    'b14_caleta_intro', 'b14_tobias_moneda', 'b14_arrecife_llegada', 'b14_draga_vista', 'b14_jefa_vencida',
    'b14_draga_apartada', 'b14_antea_entrada', 'b14_caracola_tuto', 'b14_primer_eco', 'b14_compuerta',
    'b14_fausto_visto', 'b14_fausto_despierto', 'b14_helecho_3', 'b14_primigenia_vista', 'b14_bramaluna_vista',
    'b14_helecho_4', 'b14_aliviadero', 'b14_fosa_entrada', 'b14_bramaluna_eco', 'p7_restored', 'verse_7', 'b14_t13',
    'b14_caleta_final',
  ],
  B15: [
    'b15_desvinculacion', 'b15_r11_llegada', 'b15_paso_llegada', 'b15_senda_llegada', 'b15_senda_mirador',
    'b15_r13_llegada', 'b15_boreal_llegada', 'b15_t13_rosendo', 'b15_t13_nieves', 'b15_t13_lago_visto',
    'b15_t13_bloque', 'b15_t13_tablilla', 'b15_torre', 'b15_gael_visto', 'b15_gael_b5', 'b15_gael_b5_ganado',
    'b15_n5', 'zyg_core_5', 'b15_alerce_aro',
  ],
  B16: [
    'b16_llegada', 'b16_santuario_visto', 'b16_genesis_visto', 'b16_saber_intro', 'b16_saber_glifos',
    'b16_saber_tres', 'b16_saber_cuatro', 'b16_hebra_saber', 'b16_sentir_intro', 'b16_sentir_espejo_1',
    'b16_sentir_espejo_2', 'b16_sentir_espejo_3', 'b16_recuerdo_gael', 'b16_hebra_sentir', 'b16_querer_intro',
    'b16_querer_viento', 'b16_azelf_sello', 'b16_azelf_vencido', 'b16_hebra_querer', 'b16_telar_abierto',
    'b16_telar_visto', 'b16_telar', 'p8_restored', 'verse_8', 'b16_hito_escena', 'b16_puente_roto', 'b16_puente_a',
    'b16_puente_b', 'b16_hito', 'b16_radio', 'b16_genesis_registro', 'b16_vinculo', 'b16_vuelo_aviso',
    'zyg_complete', 'zyg_rebuild_tutorial', 'b16_t14_carta',
  ],
  B17: [
    'b17_t14_sobre', 'b17_t14_acertijo', 'b17_mesa_llegada', 'b17_altaria_1', 'b17_altaria_2', 'b17_altaria_3',
    'b17_mesa_confianza', 'b17_t14_aurora', 'b17_t14_viaje', 'b17_t14_reencuentro', 'b17_mirador_visto',
    'b17_alerce_aviso', 'b17_alerce_llamada', 'b17_vigilia',
  ],
  B18: [
    'b18_llegada', 'b18_tramo_1', 'b18_tramo_2', 'b18_tramo_3', 'b18_puente_entero', 'b18_casia_intro', 'b18_casia',
    'b18_cura_1', 'b18_garrido_intro', 'b18_garrido', 'b18_cura_2', 'b18_vertice_frase', 'b18_vertice',
    'b18_resonador_roto', 'b18_irrupcion', 'b18_gael', 'b18_vertice_huye', 'b18_cuaderno', 'b18_detenidos',
    'b18_escena', 'b18_cura_3', 'b18_camara_llegada', 'b18_cristal_tutorial', 'b18_sala_1', 'b18_sala_2',
    'b18_sala_3', 'b18_nucleo_visto', 'verse_9', 'b18_eje_atado', 'p9_restored', 'b18_cadena_templada',
    'b18_inscripcion', 'b18_orbe',
  ],
  B19: [
    'b19_llegada', 'b19_casandra_intro', 'b19_tramo_tutorial', 'b19_tramo_1', 'b19_tramo_2', 'b19_tramo_3',
    'b19_casandra_llega', 'b19_casandra_vencida', 'b19_derrumbe_visto', 'b19_taller_visto', 'b19_tablilla',
    'b19_resonador_apagado', 'b19_cuidadores', 'b19_alerce', 'b19_sima_llegada', 'b19_sima_camino_completo',
    'b19_calzada',
  ],
  B20: [
    'b20_puerta_llegada', 'b20_puerta_abierta', 'b20_camino', 'b20_puerta_centro', 'b20_tramo_1', 'b20_tramo_2',
    'b20_tramo_3', 'b20_tramo_4', 'b20_tramo_5', 'b20_tramo_6', 'b20_tramo_7', 'b20_tramo_8', 'b20_tramo_9',
    'b20_custodios', 'verse_10', 'b20_cielo_llegada', 'b20_tornadus', 'b20_thundurus', 'b20_landorus', 'b20_trio',
    'b20_gael_cura', 'b20_gael_b6', 'b20_gael_charla', 'b20_gael_se_va', 'b20_nucleo_visto', 'p10_restored',
    'b20_profecia', 'b20_falsa_calma', 'b20_flute',
  ],
});

const ORDER = Object.freeze([
  'B01', 'B02', 'B03', 'B04', 'B05', 'B06', 'B07', 'B08', 'B09A', 'B09B', 'B10', 'B11', 'B12', 'B13', 'B14', 'B15',
  'B16', 'B17', 'B18', 'B19', 'B20', 'B21',
]);

/** Flags acumuladas de todos los bloques anteriores a `id` (sin repetidos). */
function flagsBefore(id) {
  const idx = ORDER.indexOf(id.toUpperCase());
  return [...new Set(ORDER.slice(0, Math.max(0, idx)).flatMap((k) => DONE[k] || []))];
}

// Capacidades de Zygarde por tramo (thresholds.js).
const Z_RUN = ['run'];
const Z_RAM = [...Z_RUN, 'ram'];
const Z_TERRAIN = [...Z_RAM, 'terrain'];
const Z_CLIMB = [...Z_TERRAIN, 'climb'];
const Z_SWIM = [...Z_CLIMB, 'swim'];
const Z_DIVE = [...Z_SWIM, 'detect', 'dive'];
const Z_FULL = [...Z_DIVE, 'fly', 'rebuild'];

const STARTERS = Object.freeze({ starter: 'TURTWIG', gael_starter: 'LITTEN' });
const AFTER_P8_VARS = Object.freeze({ ...STARTERS, b16_mesprit_respuesta: 'lejos' });
const AFTER_P9_VARS = Object.freeze({ ...AFTER_P8_VARS, p9_choice: 'DIALGA', p9_chosen_caught: false });

// Equipo de referencia: TORTERRA (inicial), STARAPTOR, LUXRAY, INTELEON (regalo de Alerce), FLOATZEL y LUCARIO.
const team = (lv) => [
  ['TORTERRA', lv], ['STARAPTOR', lv - 2], ['LUXRAY', lv - 2], ['INTELEON', lv - 2], ['FLOATZEL', lv - 3],
  ['LUCARIO', lv - 2],
];

// Objetos clave acumulados.
const K_B02 = ['CLUENOTEBOOK', 'ZYGARDECUBE', 'ESCAPEROPE'];
const K_B03 = [...K_B02, 'EXPSHARE', 'OLDROD'];
const K_B07 = [...K_B03, 'MEGARING'];
const K_B09 = [...K_B07, 'GOODROD', 'SUPERROD'];
const K_B10 = [...K_B09, 'GLYPHKEY'];
const K_B16 = [...K_B10, 'REDCHAIN'];
// El orbe del no elegido (Lustresfera con p9_choice DIALGA) es objeto equipable: va en la Mochila (I_P9).
const K_B20 = [...K_B16, 'AZUREFLUTE'];

// Mochila por tramo.
const I_EARLY = { POTION: 6, POKEBALL: 5 };
const I_B04 = { POTION: 6, SUPERPOTION: 3, POKEBALL: 10, GREATBALL: 3, ANTIDOTE: 2, MIRACLESEED: 1 };
const I_MID = { SUPERPOTION: 6, HYPERPOTION: 3, GREATBALL: 10, ULTRABALL: 3, REVIVE: 3, FULLHEAL: 3, MIRACLESEED: 1 };
const I_LATE = { HYPERPOTION: 8, FULLRESTORE: 3, ULTRABALL: 10, REVIVE: 5, FULLHEAL: 5, MIRACLESEED: 1, LUCARIONITE: 1 };
const I_END = { FULLRESTORE: 6, MAXPOTION: 6, ULTRABALL: 15, REVIVE: 6, MAXREVIVE: 2, FULLHEAL: 6, MIRACLESEED: 1, LUCARIONITE: 1 };

const I_P9 = { ...I_END, LUSTROUSORB: 1 };

const TOWNS = ['villa_alba', 'villa_zaguan', 'ciudad_caudal', 'villa_brontia', 'ciudad_estrato', 'ciudad_lumina',
  'aldea_mnemos', 'ciudad_nexo', 'caleta_sonda', 'villa_boreal'];

const block = (b) => Object.freeze({ ...b, flags: Object.freeze(flagsBefore(b.id)) });

export const BLOCK_STARTS = Object.freeze([
  block({
    id: 'B01', title: 'Villa Alba: el despertar',
    map: 'casa_prota_2f', x: 8, y: 6, dir: 2,
    vars: {},
    party: [],
    zygarde: { abilities: [], form: null, cells: 0, cores: 0 },
    fragments: 0, tablets: 0,
    items: {}, keyItems: [], flyPoints: [], money: 3000, pokedex: false,
    notes: 'Partida nueva tras la intro: bajar con Mamá, ir al laboratorio de Alerce y elegir inicial.',
  }),
  block({
    id: 'B02', title: 'Pilar del Umbral (P1)',
    map: 'villa_zaguan', x: 19, y: 3, dir: 2,
    vars: { ...STARTERS },
    party: [['TURTWIG', 8], ['STARLY', 6]],
    zygarde: { abilities: [], form: 'core', cells: 5, cores: 1 },
    fragments: 0, tablets: 0,
    items: { POTION: 3, POKEBALL: 5 }, keyItems: [], flyPoints: [], money: 3500, pokedex: true,
    notes: 'Llegada a Zaguán desde la Ruta 1: Centro Pokémon, Explanada del Umbral con Gael y Casilda, Ruinas del Dintel.',
  }),
  block({
    id: 'B03', title: 'Zaguán, Ruta 2 y Caudal',
    map: 'villa_zaguan', x: 19, y: 14, dir: 4,
    vars: { ...STARTERS },
    party: [['TURTWIG', 12], ['STARLY', 10], ['SHINX', 10]],
    zygarde: { abilities: Z_RUN, form: '10', cells: 12, cores: 1 },
    fragments: 1, tablets: 0,
    items: { ...I_EARLY }, keyItems: K_B02, flyPoints: [], money: 5000, pokedex: true,
    notes: 'T01 en la Arboleda de Zaguán, Lía entrega el Repartir Exp y Ruta 2 hasta Caudal (Gael B2 en el puente).',
  }),
  block({
    id: 'B04', title: 'Pilar de la Corriente (P2)',
    map: 'ciudad_caudal', x: 1, y: 4, dir: 4,
    vars: { ...STARTERS },
    party: [['TURTWIG', 14], ['STARLY', 13], ['SHINX', 12], ['BUIZEL', 12]],
    zygarde: { abilities: Z_RUN, form: '10', cells: 15, cores: 1 },
    fragments: 1, tablets: 1,
    items: { ...I_B04 }, keyItems: K_B03, flyPoints: [], money: 7000, pokedex: true,
    notes: 'Salir de Caudal al oeste por la Ruta 3 (cuestas de grava montado) hacia la Garganta del Albo y sus balizas.',
  }),
  block({
    id: 'B05', title: 'Molino del Diezmo, Ruta 4 y Brontia',
    map: 'molino_diezmo', x: 7, y: 10, dir: 8,
    vars: { ...STARTERS },
    party: [['GROTLE', 20], ['STARAVIA', 18], ['LUXIO', 18], ['BUIZEL', 17], ['SOBBLE', 15]],
    zygarde: { abilities: Z_RUN, form: '10', cells: 17, cores: 1 },
    fragments: 2, tablets: 1,
    items: { ...I_B04 }, keyItems: K_B03, flyPoints: [], money: 10000, pokedex: true,
    notes: 'T02 dentro del Molino del Diezmo (Caudal); luego vado de la Ruta 4 (Embestida a las 18 células) y Brontia.',
  }),
  block({
    id: 'B06', title: 'Pilar del Impulso (P3)',
    map: 'ruta_5', x: 2, y: 19, dir: 6,
    vars: { ...STARTERS },
    party: [['GROTLE', 25], ['STARAVIA', 23], ['LUXIO', 23], ['DRIZZILE', 21], ['BUIZEL', 21]],
    zygarde: { abilities: Z_RAM, form: '10', cells: 24, cores: 1 },
    fragments: 2, tablets: 2,
    items: { ...I_B04 }, keyItems: K_B03, flyPoints: [], money: 13000, pokedex: true,
    notes: 'Ruta 5 hacia la Meseta del Impulso: doble con Gael en la puerta del Parque Eólico, Casia y el Colector (N2).',
  }),
  block({
    id: 'B07', title: 'Ruta 6 y la Cantería Solano',
    map: 'ruta_6', x: 15, y: 18, dir: 2,
    vars: { ...STARTERS },
    party: [['GROTLE', 29], ['STARAVIA', 27], ['LUXIO', 27], ['DRIZZILE', 27], ['FLOATZEL', 26]],
    zygarde: { abilities: Z_TERRAIN, form: '10', cells: 34, cores: 2 },
    fragments: 3, tablets: 3,
    items: { ...I_MID }, keyItems: K_B03, flyPoints: [], money: 17000, pokedex: true,
    notes: 'Bajar por la Ruta 6 (sin vendavales tras el P3) hasta el derrumbe de la Cantería Solano (T04, Alerce en persona).',
  }),
  block({
    id: 'B08', title: 'Pilar de la Masa (P4)',
    map: 'ciudad_estrato', x: 28, y: 1, dir: 2,
    vars: { ...STARTERS },
    party: [['TORTERRA', 32], ['STARAVIA', 30], ['LUXRAY', 30], ['DRIZZILE', 30], ['FLOATZEL', 29], ['LUCARIO', 28]],
    zygarde: { abilities: Z_TERRAIN, form: '10', cells: 35, cores: 2 },
    fragments: 3, tablets: 4,
    items: { ...I_MID }, keyItems: K_B07, flyPoints: [], money: 21000, pokedex: true,
    notes: 'Llegada a Ciudad Estrato por el norte: discusión de los Galena, Mina Galena (Garrido), Dunas y Cerro Plomo.',
  }),
  block({
    id: 'B09a', title: 'Lúmina, museo y Reserva',
    map: 'ruta_7', x: 87, y: 17, dir: 4,
    vars: { ...STARTERS },
    party: [['TORTERRA', 35], ['STARAPTOR', 34], ['LUXRAY', 33], ['DRIZZILE', 33], ['FLOATZEL', 32], ['LUCARIO', 32]],
    zygarde: { abilities: Z_TERRAIN, form: '10', cells: 40, cores: 2 },
    fragments: 4, tablets: 4,
    items: { ...I_MID, SKULLFOSSIL: 1, ARMORFOSSIL: 1 }, keyItems: K_B07, flyPoints: [], money: 26000, pokedex: true,
    notes: 'Ruta 7 (Paso del Derrumbe despejado) hacia Lúmina: Gala del Museo, Gael B3, T06, T07 y T05 en Estrato.',
  }),
  block({
    id: 'B09b', title: 'Marisma, Nexo y Caleta Sonda',
    map: 'ruta_8_marisma', x: 48, y: 64, dir: 4,
    vars: { ...STARTERS },
    party: [['TORTERRA', 36], ['STARAPTOR', 35], ['LUXRAY', 34], ['INTELEON', 35], ['FLOATZEL', 33], ['LUCARIO', 34]],
    zygarde: { abilities: Z_TERRAIN, form: '10', cells: 44, cores: 2 },
    fragments: 4, tablets: 7,
    items: { ...I_MID }, keyItems: K_B07, flyPoints: [], money: 32000, pokedex: true,
    notes: 'Marisma Turbia (T08 con Remedios y Alerce), Ciudad Nexo (Caña Buena), Ruta 15 y Caleta Sonda (Supercaña).',
  }),
  block({
    id: 'B10', title: 'Pilar de la Memoria (P5)',
    map: 'aldea_mnemos', x: 31, y: 41, dir: 8,
    vars: { ...STARTERS },
    party: [['TORTERRA', 38], ['STARAPTOR', 37], ['LUXRAY', 36], ['INTELEON', 37], ['FLOATZEL', 35], ['LUCARIO', 36]],
    zygarde: { abilities: Z_TERRAIN, form: '10', cells: 44, cores: 2 },
    fragments: 4, tablets: 8,
    items: { ...I_MID }, keyItems: K_B09, flyPoints: [], money: 38000, pokedex: true,
    notes: 'Llegada a Aldea Mnemos por la Marisma: repartir las notas de Olvido y bajar al Archivo Hondo.',
  }),
  block({
    id: 'B11', title: 'Bosque Neblino, el Monte y la casa',
    map: 'ruta_9_neblino', x: 21, y: 1, dir: 2,
    vars: { ...STARTERS },
    party: team(41),
    zygarde: { abilities: Z_CLIMB, form: '10', cells: 46, cores: 2 },
    fragments: 5, tablets: 8,
    items: { ...I_MID }, keyItems: K_B10, flyPoints: [], money: 44000, pokedex: true,
    notes: 'Ruta 9 abierta tras la niebla: T10 (Nilo y la cuadrilla), T09 en Mnemos, regreso a Villa Alba y Gael B4.',
  }),
  block({
    id: 'B12', title: 'Pilar Invertido (P6)',
    map: 'montana_portal', x: 17, y: 48, dir: 8, time: 11,
    vars: { ...STARTERS },
    party: team(44),
    zygarde: { abilities: Z_CLIMB, form: '10', cells: 49, cores: 2 },
    fragments: 5, tablets: 10,
    items: { ...I_MID }, keyItems: K_B10, flyPoints: [], money: 50000, pokedex: true,
    notes: 'Subir el Monte del Portal trepando hasta el aljibe y cruzar el Mundo Distorsión (Cara Vuelta, Mirada, Sumidero).',
  }),
  block({
    id: 'B13', title: 'Talasa, Islote Lumbre y Tizón',
    map: 'caleta_sonda', x: 22, y: 28, dir: 2,
    vars: { ...STARTERS },
    party: team(47),
    zygarde: { abilities: Z_SWIM, form: '50', cells: 56, cores: 3 },
    fragments: 6, tablets: 10,
    items: { ...I_LATE }, keyItems: K_B10, flyPoints: [], money: 57000, pokedex: true,
    notes: 'Desde el muelle de buzos de Caleta Sonda, nadar a la Estación Talasa (N4 con Alerce); luego T11, T12 y Buceo.',
  }),
  block({
    id: 'B14', title: 'Pilar de los Ecos (P7)',
    map: 'caleta_sonda', x: 12, y: 20, dir: 2,
    vars: { ...STARTERS },
    party: team(52),
    zygarde: { abilities: Z_DIVE, form: '50', cells: 76, cores: 4 },
    fragments: 6, tablets: 12,
    items: { ...I_LATE }, keyItems: K_B10, flyPoints: [], money: 65000, pokedex: true,
    notes: 'Caleta Sonda (mareas del eco): bucear al Arrecife del Eco, apartar la draga y entrar en las Ruinas de Antea.',
  }),
  block({
    id: 'B15', title: 'El norte y el quinto núcleo',
    map: 'ruta_11', x: 14, y: 67, dir: 8,
    vars: { ...STARTERS },
    party: team(56),
    zygarde: { abilities: Z_DIVE, form: '50', cells: 88, cores: 4 },
    fragments: 7, tablets: 12,
    items: { ...I_LATE }, keyItems: K_B10, flyPoints: [], money: 73000, pokedex: true,
    notes: 'Ruta 11 abierta (el hielo-eco retrocede): desvinculación, Paso del Norte, Senda del Lazo, Boreal, T13 y Gael B5.',
  }),
  block({
    id: 'B16', title: 'Pilar del Alma (P8)',
    map: 'lagos_alma', x: 13, y: 57, dir: 8,
    vars: { ...STARTERS },
    party: team(58),
    zygarde: { abilities: Z_DIVE, form: '50', cells: 96, cores: 5 },
    fragments: 7, tablets: 13,
    items: { ...I_LATE }, keyItems: K_B10, flyPoints: [], money: 82000, pokedex: true,
    notes: 'Lagos del Alma hasta el Santuario: alas del Saber, Sentir y Querer en cualquier orden y el Telar.',
  }),
  block({
    id: 'B17', title: 'Axis en eclipse',
    map: 'nexo_correos', x: 7, y: 8, dir: 6,
    vars: { ...AFTER_P8_VARS },
    party: team(60),
    zygarde: { abilities: Z_FULL, form: 'complete', cells: 100, cores: 5 },
    fragments: 8, tablets: 13,
    items: { ...I_END }, keyItems: K_B16, flyPoints: TOWNS, money: 92000, pokedex: true,
    notes: 'Correos de Nexo (carta de la T14): volar a la Mesa de los Vientos, ver la ocupación del Mirador Sur y la Vigilia.',
  }),
  block({
    id: 'B18', title: 'Pilar de la Convergencia (P9)',
    map: 'puente_convergencia', x: 20, y: 1, dir: 2,
    vars: { ...AFTER_P8_VARS },
    party: team(63),
    zygarde: { abilities: Z_FULL, form: 'complete', cells: 100, cores: 5 },
    fragments: 8, tablets: 14,
    items: { ...I_END }, keyItems: K_B16, flyPoints: [...TOWNS, 'mesa_vientos'], money: 100000, pokedex: true,
    notes: 'Borde norte del Puente de la Convergencia: reconstruir los tres tramos y vencer a Casia, Garrido y Vértice.',
  }),
  block({
    id: 'B19', title: 'La Calzada del Rey',
    map: 'calzada_rey', x: 3, y: 60, dir: 8,
    vars: { ...AFTER_P9_VARS },
    party: team(67),
    zygarde: { abilities: Z_FULL, form: 'complete', cells: 100, cores: 5 },
    fragments: 9, tablets: 14,
    items: { ...I_P9 }, keyItems: K_B16, flyPoints: [...TOWNS, 'mesa_vientos'], money: 115000, pokedex: true,
    notes: 'Pie de la Calzada del Rey: T15 contra los Peregrinos (tramos con Reconstrucción, Casandra, taller) y la Sima.',
  }),
  block({
    id: 'B20', title: 'Pilar del Origen (P10)',
    map: 'puerta_quince', x: 16, y: 31, dir: 8,
    vars: { ...AFTER_P9_VARS },
    party: team(68),
    zygarde: { abilities: Z_FULL, form: 'complete', cells: 100, cores: 5 },
    fragments: 9, tablets: 15,
    items: { ...I_P9 }, keyItems: K_B16, flyPoints: [...TOWNS, 'mesa_vientos'], money: 125000, pokedex: true,
    notes: 'Puerta de las Quince: colocar las Tablillas, Senda del Origen (9 tramos), Trío de las Nubes y Gael B6.',
  }),
  block({
    id: 'B21', title: 'Columna Lanza y epílogo',
    map: 'nucleo_origen', x: 10, y: 13, dir: 8,
    vars: { ...AFTER_P9_VARS },
    party: team(72),
    zygarde: { abilities: Z_FULL, form: 'complete', cells: 100, cores: 5 },
    fragments: 10, tablets: 15,
    items: { ...I_P9 }, keyItems: K_B20, flyPoints: [...TOWNS, 'mesa_vientos'], money: 140000, pokedex: true,
    notes: 'Ante el sello del Núcleo del Origen: tocar el Nodo para el Salto de Convergencia a Columna Lanza (Arceus).',
  }),
]);

/** Estado de entrada de un bloque por id ('B05', 'B09a'…), o null. */
export function blockStart(id) {
  const key = String(id || '').toUpperCase();
  return BLOCK_STARTS.find((b) => b.id.toUpperCase() === key) || null;
}
