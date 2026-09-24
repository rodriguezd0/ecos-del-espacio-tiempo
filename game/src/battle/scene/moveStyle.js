// Clasificación de movimientos para elegir una animación genérica (módulo PURO).
// No hay animaciones individuales por movimiento: se combinan estilo (contacto, proyectil, rayo, onda,
// lluvia, estado, apoyo…) con la paleta y las partículas del tipo.

/** Paleta por tipo: color principal, secundario, partícula y si la pantalla se tiñe. */
export const TYPE_FX = Object.freeze({
  NORMAL: { color: [255, 255, 255], alt: [220, 220, 200], particle: 'star', tint: null },
  FIGHTING: { color: [255, 150, 60], alt: [220, 60, 40], particle: 'impact', tint: null },
  FLYING: { color: [210, 235, 255], alt: [150, 190, 255], particle: 'streak', tint: null },
  POISON: { color: [190, 80, 230], alt: [120, 40, 170], particle: 'bubble', tint: [30, -30, 40] },
  GROUND: { color: [200, 150, 80], alt: [140, 100, 50], particle: 'rock', tint: [20, 5, -20] },
  ROCK: { color: [180, 150, 100], alt: [120, 100, 70], particle: 'rock', tint: null },
  BUG: { color: [170, 220, 60], alt: [100, 160, 40], particle: 'dot', tint: null },
  GHOST: { color: [150, 100, 220], alt: [70, 40, 130], particle: 'wisp', tint: [-60, -70, -20] },
  STEEL: { color: [220, 230, 245], alt: [150, 160, 190], particle: 'shard', tint: null },
  QMARKS: { color: [255, 255, 255], alt: [200, 200, 200], particle: 'star', tint: null },
  FIRE: { color: [255, 140, 40], alt: [255, 220, 90], particle: 'flame', tint: [40, 0, -30] },
  WATER: { color: [80, 160, 255], alt: [190, 230, 255], particle: 'bubble', tint: [-20, 0, 30] },
  GRASS: { color: [110, 220, 90], alt: [200, 255, 140], particle: 'leaf', tint: null },
  ELECTRIC: { color: [255, 235, 70], alt: [255, 255, 200], particle: 'spark', tint: [30, 30, -10] },
  PSYCHIC: { color: [255, 110, 200], alt: [200, 140, 255], particle: 'ring', tint: [30, -20, 30] },
  ICE: { color: [170, 235, 255], alt: [240, 255, 255], particle: 'shard', tint: [-10, 10, 40] },
  DRAGON: { color: [120, 100, 255], alt: [90, 220, 255], particle: 'orb', tint: [-10, -20, 30] },
  DARK: { color: [90, 60, 90], alt: [40, 20, 40], particle: 'shard', tint: [-80, -80, -70] },
  FAIRY: { color: [255, 170, 220], alt: [255, 240, 250], particle: 'sparkle', tint: [20, 0, 20] },
});

const SELF_TARGETS = ['User', 'UserSide', 'UserAndAllies', 'AllAllies', 'UserOrNearAlly', 'NearAlly'];
const FIELD_TARGETS = ['BothSides', 'FoeSide'];
const SPREAD_TARGETS = ['AllNearFoes', 'AllNearOthers', 'AllFoes', 'AllBattlers'];

const HEAL_CODES = /Heal|Recover|Roost|Rest|Wish|Synthesis|Moonlight|MorningSun|Drain/i;
const PROTECT_CODES = /Protect|Detect|Endure|KingsShield|SpikyShield|BanefulBunker|Obstruct|SilkTrap|BurningBulwark|MatBlock/i;
const BEAM_NAMES = /beam|ray|pulse|cannon|laser|blast|hydropump|flamethrower|thunderbolt|psychic|solar/i;
const RAIN_TYPES = ['ROCK', 'GROUND', 'ICE'];

/**
 * Estilo de animación de un movimiento (datos de moves.json).
 * @returns {{ style: string, type: string, fx: object, contact: boolean, sound: boolean, heavy: boolean,
 *             punch: boolean, bite: boolean, slice: boolean, spread: boolean }}
 */
export function classifyMove(move) {
  const m = move || {};
  const flags = m.flags || [];
  const type = TYPE_FX[m.type] ? m.type : 'NORMAL';
  const target = m.target || 'NearOther';
  const code = m.functionCode || '';
  const id = m.id || '';
  const info = {
    type,
    fx: TYPE_FX[type],
    contact: flags.includes('Contact'),
    sound: flags.includes('Sound'),
    punch: flags.includes('Punching'),
    bite: flags.includes('Biting'),
    slice: flags.includes('Slicing'),
    wind: flags.includes('Wind'),
    spread: SPREAD_TARGETS.includes(target),
    heavy: (m.power || 0) >= 90,
    style: 'projectile',
  };
  if (m.category === 'Status') {
    if (PROTECT_CODES.test(code)) info.style = 'protect';
    else if (HEAL_CODES.test(code)) info.style = 'heal';
    else if (SELF_TARGETS.includes(target)) info.style = 'self';
    else if (FIELD_TARGETS.includes(target)) info.style = 'field';
    else if (info.sound) info.style = 'sound';
    else info.style = 'status';
    return info;
  }
  if (target === 'User' || target === 'None') info.style = 'self';
  else if (type === 'GROUND' && info.spread) info.style = 'quake';
  else if (info.contact) info.style = 'contact';
  else if (info.sound) info.style = 'sound';
  else if (RAIN_TYPES.includes(type) && m.category === 'Physical') info.style = 'rain';
  else if (info.spread) info.style = 'wave';
  else if (m.category === 'Special' && (flags.includes('Pulse') || flags.includes('Beam') || BEAM_NAMES.test(id))) info.style = 'beam';
  else info.style = 'projectile';
  return info;
}

/** Duración aproximada (fotogramas) por estilo, para acompasar cámara y sonidos. */
export const STYLE_FRAMES = Object.freeze({
  contact: 34, projectile: 40, beam: 48, wave: 44, rain: 46, quake: 50, sound: 40,
  status: 44, self: 42, heal: 44, protect: 36, field: 40,
});

/** SE de Añil (Audio/SE, pack PRSFX) por tipo si el movimiento no tiene sonido propio. */
export const TYPE_SE = Object.freeze({
  NORMAL: 'PRSFX- Tackle', FIGHTING: 'PRSFX- Karate Chop1', FLYING: 'PRSFX- Gust', POISON: 'PRSFX- Poison Sting',
  GROUND: 'PRSFX- Mud Slap', ROCK: 'PRSFX- Rock Throw1', BUG: 'PRSFX- Bug Bite', GHOST: 'PRSFX- Night Shade',
  STEEL: 'PRSFX- Metal Claw1', QMARKS: 'PRSFX- Tackle', FIRE: 'PRSFX- Ember', WATER: 'PRSFX- Water Gun',
  GRASS: 'PRSFX- Vine Whip', ELECTRIC: 'PRSFX- Thundershock', PSYCHIC: 'PRSFX- Confusion', ICE: 'PRSFX- Ice Shard',
  DRAGON: 'PRSFX- Dragon Breath', DARK: 'PRSFX- Feint Attack1', FAIRY: 'PRSFX- Fairy Wind',
});

/** SE por estilo/efecto común. */
export const FX_SE = Object.freeze({
  statUp: 'PRSFX- Stat Up', statDown: 'PRSFX- Stat Down', heal: 'PRSFX- Recover', protect: 'PRSFX- Protect',
  sound: 'PRSFX- Supersonic', BURN: 'PRSFX- Burn', PARALYSIS: 'PRSFX- Paralysis', POISON: 'PRSFX- Poison',
  TOXIC: 'PRSFX- Toxic1', SLEEP: 'PRSFX- Sleep', FROZEN: 'PRSFX- Frozen', FROSTBITE: 'PRSFX- Frozen',
  confusion: 'PRSFX- Confused', shiny: 'PRSFX- Shiny', mega1: 'PRSFX- Mega Evolution1', mega2: 'PRSFX- Mega Evolution2',
  attract: 'PRSFX- Attract1', item: 'Use item in party', berry: 'PRSFX- Pluck1', leech: 'PRSFX- Leech Seed2',
});

/** Clave normalizada de un nombre de movimiento/archivo PRSFX ("Air Cutter1" → "AIRCUTTER"). */
export function moveSoundKey(name) {
  return String(name || '').replace(/^PRSFX-\s*/i, '').replace(/[^a-z0-9]/gi, '').replace(/\d+$/, '').toUpperCase();
}

/** Índice id de movimiento → nombre de SE a partir de los nombres del índice de audio. */
export function buildMoveSoundIndex(seNames) {
  const map = new Map();
  for (const n of seNames) {
    if (!/^PRSFX-/i.test(n)) continue;
    const key = moveSoundKey(n);
    if (key && !map.has(key)) map.set(key, n);
  }
  return map;
}
