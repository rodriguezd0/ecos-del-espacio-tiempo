// Entrenadores del Bloque 20 — Pilar del Origen (docs/CAMPANA.md B20 y §6.3; curva POKEDEX_DISTRIBUCION §7.1: «Gael
// 70–72»; dinero base de docs/BALANCE.md: rival 60). Formato en content/trainers/index.js. El Trío de las Nubes son
// combates salvajes de guion (content/events/b20_cielo.js); no hay más entrenadores en el Pilar del Origen.
import { gaelFinalStarter } from '../events/b15_common.js';

export default {
  // ── Gael, combate B6 en la Terraza del Último Sello (§6.3: Staraptor 70, Lucario 70, Weavile 70, Garchomp 71,
  //    Absol 71 Mega, inicial final 72; CombateRival y «Ultimo Pokemon» con su último Pokémon). OBLIGATORIO de ganar:
  //    si se pierde, Gael espera y vuelve a curar (bossBattle en content/events/b20_terraza.js). ─────────────────────
  b20_gael_b6: {
    name: 'Gael', class: 'Rival', sprite: 'gael_front', overworld: 'gael',
    party: (state) => [
      { species: 'STARAPTOR', level: 70 }, { species: 'LUCARIO', level: 70 }, { species: 'WEAVILE', level: 70 },
      { species: 'GARCHOMP', level: 71 }, { species: 'ABSOL', level: 71, item: 'ABSOLITE' },
      { species: gaelFinalStarter(state), level: 72 },
    ],
    items: ['FULLRESTORE', 'FULLRESTORE'], ai: 100, money: 60, bgm: 'CombateRival', lastPokemonBgm: 'Ultimo Pokemon',
    megaRing: true, megaRingName: 'el aro negro',
    loseText: 'Así sí. Sin trampas y sin excusas.',
    winText: 'Así no. No he esperado tanto para esto.',
    canLose: true,
  },
};
