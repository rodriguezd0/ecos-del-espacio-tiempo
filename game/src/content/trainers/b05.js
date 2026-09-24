// Entrenadores del Bloque 5 (docs/CAMPANA.md B05; curva de niveles de POKEDEX_DISTRIBUCION §7.1: entrenadores
// 18–22, técnicos del Consorcio 18–20 en T02). Nombres de NPC genéricos (sin canon). Los técnicos llevan especies
// de Genesis (CAMPANA §5.1) y se presentan como Consorcio: el nombre «Genesis» no se dice hasta el P3 (§5.1).
import { SPRITE } from '../events/b05_common.js';

const route = (d) => ({ items: [], ai: 32, ...d });

export default {
  // ── Ruta 4 ──────────────────────────────────────────────────────────────────────────────────────
  r4_pescador_tomas: route({
    name: 'Tomás', class: 'Pescador', sprite: 'anil:pescador', overworld: 'anil:pescador',
    party: [{ species: 'GOLDEEN', level: 19 }, { species: 'BARBOACH', level: 20 }],
    money: 80,
    intro: '¡Ya pican otra vez! Desde que el Albo volvió a su cauce, esto es una fiesta.',
    loseText: 'Se me ha escapado hasta el combate.',
    winText: 'Hoy pican hasta los entrenadores.',
  }),
  r4_excursionista_nuria: route({
    name: 'Nuria', class: 'Excursionista', sprite: 'anil:excursionista_f', overworld: 'anil:excursionista_f',
    party: [{ species: 'PONYTA', level: 20 }, { species: 'MUDBRAY', level: 20 }],
    money: 80,
    intro: 'La vega huele a barro nuevo. ¿Una carrera? Mejor un combate.',
    loseText: 'Vaya. Tendré que entrenar en la subida.',
    winText: '¡Mis Pokémon saben correr por el barro!',
  }),
  r4_montanero_hugo: route({
    name: 'Hugo', class: 'Montañero', sprite: 'anil:montanero', overworld: 'anil:montanero',
    party: [{ species: 'MACHOP', level: 19 }, { species: 'NACLI', level: 20 }, { species: 'MUDBRAY', level: 21 }],
    money: 84,
    intro: 'Antes de subir a la meseta, calienta un poco conmigo.',
    loseText: 'Buena subida la tuya.',
    winText: 'Arriba el viento pega fuerte. Ve preparado.',
  }),
  r4_ornitologo_samuel: route({
    name: 'Samuel', class: 'Ornitólogo', sprite: 'anil:ornitologo', overworld: 'anil:ornitologo',
    party: [{ species: 'SWABLU', level: 20 }, { species: 'STARAVIA', level: 21 }],
    money: 84,
    intro: 'Los Pokémon pájaro de la meseta vuelan torcidos últimamente. ¿Tú también lo has notado?',
    loseText: 'Me distraje mirando el cielo.',
    winText: 'Mis pájaros no se despistan con el viento.',
  }),
  r4_joven_dani: route({
    name: 'Dani', class: 'Joven', sprite: 'anil:joven', overworld: 'anil:joven',
    party: [{ species: 'PACHIRISU', level: 21 }, { species: 'LUXIO', level: 22 }],
    money: 88,
    intro: 'En Brontia no hay luz, pero mis Pokémon eléctricos van cargados. ¡Compruébalo!',
    loseText: 'Descargados del todo…',
    winText: '¡Chispas hasta el final!',
  }),

  // ── T02: técnicos del Consorcio en el Molino del Diezmo (nv 18–20) ─────────────────────────────
  t02_tecnico_a: {
    name: 'Ismael', class: 'Técnico del Consorcio', sprite: SPRITE.tech, overworld: SPRITE.tech,
    party: [{ species: 'STUNKY', level: 18 }, { species: 'MAGNEMITE', level: 19 }],
    items: ['POTION'], ai: 48, money: 90, bgm: 'EncuentroRocket', victoryBGM: 'victory_genesis', canLose: true,
    loseText: 'Anotado: el muestreo queda aplazado.',
    winText: 'Lecturas completas. Gracias por su colaboración.',
  },
  t02_tecnica_b: {
    name: 'Paula', class: 'Técnica del Consorcio', sprite: SPRITE.techF, overworld: SPRITE.techF,
    party: [{ species: 'SKORUPI', level: 19 }, { species: 'BRONZOR', level: 20 }],
    items: ['POTION'], ai: 48, money: 96, bgm: 'EncuentroRocket', victoryBGM: 'victory_genesis', canLose: true,
    loseText: 'Interesante. No figuraba en el protocolo.',
    winText: 'Muestra asegurada. Puede retirarse.',
  },
};
