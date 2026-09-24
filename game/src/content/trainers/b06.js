// Entrenadores del Bloque 6 — Pilar del Impulso (docs/CAMPANA.md B06; §5 Genesis, §6 Gael; curva
// POKEDEX_DISTRIBUCION §7.1: entrenadores 22–25, Casia 23–25, Abril 26–28). Formato en content/trainers/index.js.
// Los técnicos visten el uniforme del Consorcio Meridiano: el nombre «Genesis» no se dice hasta que lo dice Casia.
import { gaelAllyParty } from '../events/b06_common.js';

const GRUNT_BGM = 'EncuentroRocket';

export default {
  // ── Ruta 5 (meseta ventosa, entre Brontia y la Meseta del Impulso) ─────────────────────────────
  b06_ornitologo_ivan: {
    name: 'Iván', class: 'Ornitólogo', sprite: 'anil:ornitologo', overworld: 'anil:ornitologo',
    party: [{ species: 'SWABLU', level: 22 }, { species: 'EMOLGA', level: 23 }],
    ai: 32, money: 24,
    loseText: 'Con este viento, ni los Swablu vuelan derechos.',
    winText: 'Los pájaros de la meseta saben aprovechar cada ráfaga.',
  },
  b06_excursionista_marta: {
    name: 'Marta', class: 'Excursionista', sprite: 'anil:excursionista_f', overworld: 'anil:excursionista_f',
    party: [{ species: 'GIRAFARIG', level: 23 }, { species: 'PAWMO', level: 23 }],
    ai: 32, money: 24,
    loseText: 'Me has dejado sin aliento. Y aquí arriba ya cuesta respirar.',
    winText: '¡Subir la meseta a pie entrena más que nada!',
  },
  b06_montanero_tomas: {
    name: 'Tomás', class: 'Montañero', sprite: 'anil:montanero', overworld: 'anil:montanero',
    party: [{ species: 'DUBWOOL', level: 24 }],
    ai: 32, money: 32,
    loseText: 'Mi Dubwool aguanta vendavales, pero a ti no.',
    winText: 'Lana gorda, piernas firmes. Así se sube la meseta.',
  },
  b06_fotografa_celia: {
    name: 'Celia', class: 'Fotógrafa', sprite: 'anil:fotografa', overworld: 'anil:fotografa',
    party: [{ species: 'DEDENNE', level: 22 }, { species: 'EMOLGA', level: 22 }, { species: 'DRIFLOON', level: 23 }],
    ai: 32, money: 28,
    loseText: 'Todas las fotos me salen movidas. Hasta la del combate.',
    winText: '¡Quieto! Así, perfecto.',
  },
  // ── Meseta del Impulso ────────────────────────────────────────────────────────────────────────
  b06_veterana_julia: {
    name: 'Julia', class: 'Veterana', sprite: 'anil:veterana', overworld: 'anil:veterana',
    party: [{ species: 'NOCTOWL', level: 25 }, { species: 'GIRAFARIG', level: 24 }],
    ai: 48, money: 60,
    loseText: 'Buen pulso. En la meseta hace falta.',
    winText: 'El viento de aquí enseña paciencia. Tú aún no la tienes.',
  },
  b06_mecanica_sonia: {
    name: 'Sonia', class: 'Mecánica', sprite: 'anil:mecanica', overworld: 'anil:mecanica',
    party: [{ species: 'TOGEDEMARU', level: 24 }, { species: 'ELEKID', level: 24 }],
    ai: 32, money: 40,
    loseText: 'Pues vaya. Ni el Parque ni el combate me salen.',
    winText: 'Al menos algo funciona por aquí.',
  },

  // ── Genesis (fachada: Consorcio Meridiano) ────────────────────────────────────────────────────
  // Combate doble en la puerta del Parque: dos técnicos contra el jugador y Gael (aliado).
  b06_tecnico_puerta: {
    name: 'Nuño', class: 'Técnico del Consorcio', sprite: 'genesis_tecnico_front', overworld: 'genesis_tecnico',
    party: [{ species: 'MAGNEMITE', level: 22 }],
    ai: 32, money: 30, bgm: GRUNT_BGM,
    loseText: 'Anotado. Dos entrenadores coordinados. Interesante.',
    winText: 'Protocolo cumplido.',
  },
  b06_tecnica_puerta: {
    name: 'Irene', class: 'Técnica del Consorcio', sprite: 'genesis_tecnica_front', overworld: 'genesis_tecnica',
    party: [{ species: 'SOLOSIS', level: 22 }],
    ai: 32, money: 30, bgm: GRUNT_BGM,
    loseText: 'La lectura era correcta: no sois turistas.',
    winText: 'Zona restringida. Gracias por su comprensión.',
  },
  // Infiltración en el Parque: dos técnicos (almacén y control).
  b06_tecnico_almacen: {
    name: 'Rubén', class: 'Técnico del Consorcio', sprite: 'genesis_tecnico_front', overworld: 'genesis_tecnico',
    party: [{ species: 'STUNKY', level: 23 }, { species: 'VENIPEDE', level: 22 }],
    ai: 32, money: 34, bgm: GRUNT_BGM,
    loseText: 'Registraré la incidencia. Con todos sus detalles.',
    winText: 'El acceso sigue cerrado. Por favor, salga.',
  },
  b06_tecnica_control: {
    name: 'Olga', class: 'Técnica del Consorcio', sprite: 'genesis_tecnica_front', overworld: 'genesis_tecnica',
    party: [{ species: 'BRONZOR', level: 23 }, { species: 'CROAGUNK', level: 24 }],
    ai: 40, money: 36, bgm: GRUNT_BGM,
    loseText: 'La doctora ya sabe que estás aquí. Siempre lo sabe.',
    winText: 'Lecturas estables. Sin incidencias.',
  },
  // Dra. Casia Varela, directora de Investigación (CAMPANA §5.3: Solosis 23, Magnemite 24, Elgyem 25).
  b06_casia: {
    name: 'Casia', class: 'Directora de Genesis', sprite: 'casia_front', overworld: 'casia',
    party: [{ species: 'SOLOSIS', level: 23 }, { species: 'MAGNEMITE', level: 24 }, { species: 'ELGYEM', level: 25 }],
    items: ['SUPERPOTION'], ai: 64, money: 80, bgm: 'CombateComandante',
    loseText: 'Resultado anotado. No era la variable que esperaba.',
    winText: 'Previsible. Aunque la muestra era pequeña.',
  },

  // ── Guardiana del Impulso ─────────────────────────────────────────────────────────────────────
  // Abril Céspedes (CAMPANA B06: Emolga 26, Drifloon 26, Staravia 27, Cyclizar 28).
  b06_abril: {
    name: 'Abril', class: 'Guardiana', sprite: 'abril_front', overworld: 'abril',
    party: [
      { species: 'EMOLGA', level: 26 }, { species: 'DRIFLOON', level: 26 },
      { species: 'STARAVIA', level: 27 }, { species: 'CYCLIZAR', level: 28 },
    ],
    items: ['SUPERPOTION', 'SUPERPOTION'], ai: 64, money: 120, bgm: 'CombateLider',
    loseText: 'Vale, vale. No me esperaba que fueras tan rápido.',
    winText: '¿Ya? Pues a comer.',
  },
};

/** Gael como aliado en el combate doble (no es un rival: sin entrenador propio en el registro). */
export function gaelAlly(state) {
  return { name: 'Gael', party: gaelAllyParty(state), skill: 48 };
}
