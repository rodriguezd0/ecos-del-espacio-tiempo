// Ajustes de mecánicas (equivalente a Settings de Essentials 21.1, con los valores de Añil,
// MECHANICS_GENERATION = 9). Decisión TEC-05: mecánicas de generación 9.

export const Settings = Object.freeze({
  MECHANICS_GENERATION: 9,
  NEW_CRITICAL_HIT_RATE_MECHANICS: true, // críticos ×1.5, ratios [24, 8, 2, 1]
  MORE_TYPE_EFFECTS: true, // Eléctrico inmune a parálisis, Fantasma escapa siempre, Planta inmune a polvos
  MOVE_CATEGORY_PER_MOVE: true,
  FIXED_DURATION_WEATHER_FROM_ABILITY: true,
  X_STAT_ITEMS_RAISE_BY_TWO_STAGES: true,
  NEW_POKE_BALL_CATCH_RATES: true,
  SOUL_DEW_POWERS_UP_TYPES: true,
  REBALANCED_HEALING_ITEM_AMOUNTS: true, // Superpoción 60, Hiperpoción 120
  SCALED_EXP_FORMULA: true,
  SPLIT_EXP_BETWEEN_GAINERS: false,
  MORE_EXP_FROM_TRAINER_POKEMON: false,
  MORE_EVS_FROM_POWER_ITEMS: true,
  ENABLE_CRITICAL_CAPTURES: true,
  GAIN_EXP_FOR_CAPTURE: true,
  CHECK_EVOLUTION_AFTER_ALL_BATTLES: true,
  CHECK_EVOLUTION_FOR_FAINTED_POKEMON: true,
  RECALCULATE_TURN_ORDER_AFTER_MEGA_EVOLUTION: true,
  RECALCULATE_TURN_ORDER_AFTER_SPEED_CHANGES: true,
  ANY_HIGH_LEVEL_POKEMON_CAN_DISOBEY: false,
  FOREIGN_HIGH_LEVEL_POKEMON_CAN_DISOBEY: false,
  AFFECTION_EFFECTS: false,
  // Como Añil: los efectos que congelan causan "congelación" (Hisui) y el granizo es Nieve (gen 9).
  FREEZE_EFFECTS_CAUSE_FROSTBITE: true,
  HAIL_WEATHER_TYPE: 1, // 0 granizo, 1 nieve
  USE_ABILITY_SPLASH: true,
  // Sin bonificaciones por medallas (gen 4+).
  NUM_BADGES_BOOST_ATTACK: 999,
  NUM_BADGES_BOOST_DEFENSE: 999,
  NUM_BADGES_BOOST_SPATK: 999,
  NUM_BADGES_BOOST_SPDEF: 999,
  NUM_BADGES_BOOST_SPEED: 999,
  MAX_MONEY: 9999999,
});

/**
 * Pokémon Alfa. [PROVISIONAL D29] — la biblia deja pendientes tasas y condiciones.
 * Multiplicador provisional de estadísticas (salvo PS) y escala visual del sprite.
 */
export const ALPHA = Object.freeze({
  statMultiplier: 1.2,
  spriteScale: 1.5,
  tag: '[PROVISIONAL D29]',
});
