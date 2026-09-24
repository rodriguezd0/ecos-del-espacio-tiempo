// Efectos persistentes de combate (PBEffects de Essentials) y estado de daño por golpe.

/** Efectos del campo completo (Battle::ActiveField). */
export function newField() {
  return {
    effects: {
      AmuletCoin: false, FairyLock: 0, FusionBolt: false, FusionFlare: false, Gravity: 0, HappyHour: false,
      IonDeluge: false, MagicRoom: 0, MudSportField: 0, PayDay: 0, TrickRoom: 0, WaterSportField: 0, WonderRoom: 0,
    },
    defaultWeather: 'None', weather: 'None', weatherDuration: 0,
    defaultTerrain: 'None', terrain: 'None', terrainDuration: 0,
  };
}

/** Efectos de un bando (Battle::ActiveSide). */
export function newSide() {
  return {
    effects: {
      AuroraVeil: 0, CraftyShield: false, EchoedVoiceCounter: 0, EchoedVoiceUsed: false, LastRoundFainted: -1,
      LightScreen: 0, LuckyChant: 0, MatBlock: false, Mist: 0, QuickGuard: false, Rainbow: 0, Reflect: 0,
      Round: false, Safeguard: 0, SeaOfFire: 0, Spikes: 0, StealthRock: false, StickyWeb: false, Swamp: 0,
      Tailwind: 0, ToxicSpikes: 0, WideGuard: false,
    },
  };
}

/** Efectos de una posición (Battle::ActivePosition). */
export function newPosition() {
  return {
    effects: {
      FutureSightCounter: 0, FutureSightMove: null, FutureSightUserIndex: -1, FutureSightUserPartyIndex: -1,
      HealingWish: false, LunarDance: false, Wish: 0, WishAmount: 0, WishMaker: -1,
    },
  };
}

/** Efectos que Relevo (Baton Pass) conserva. */
export const BATON_PASS_EFFECTS = Object.freeze({
  AquaRing: false, Confusion: 0, Curse: false, Embargo: 0, FocusEnergy: 0, GastroAcid: false, HealBlock: 0,
  Ingrain: false, LaserFocus: 0, LeechSeed: -1, LockOn: 0, LockOnPos: -1, MagnetRise: 0, PerishSong: 0,
  PerishSongUser: -1, PowerTrick: false, Substitute: 0, Telekinesis: 0,
});

/** Efectos que se reinician siempre al entrar en combate. */
export const BATTLER_EFFECTS = Object.freeze({
  Attract: -1, BanefulBunker: false, BeakBlast: false, Bide: 0, BideDamage: 0, BideTarget: -1, BurnUp: false,
  Charge: 0, ChoiceBand: null, Counter: -1, CounterTarget: -1, Dancer: false, DefenseCurl: false,
  DestinyBond: false, DestinyBondPrevious: false, DestinyBondTarget: -1, Disable: 0, DisableMove: null,
  Electrify: false, Encore: 0, EncoreMove: null, Endure: false, ExtraType: null, FirstPledge: null,
  FlashFire: false, Flinch: false, FocusPunch: false, FollowMe: 0, Foresight: false, FuryCutter: 0,
  GemConsumed: null, Grudge: false, HelpingHand: false, HyperBeam: 0, Illusion: null, Imprison: false,
  Instruct: false, Instructed: false, JawLock: -1, KingsShield: false, MagicBounce: false, MagicCoat: false,
  MeanLook: -1, MeFirst: false, Metronome: 0, MicleBerry: false, Minimize: false, MiracleEye: false,
  MirrorCoat: -1, MirrorCoatTarget: -1, MoveNext: false, MudSport: false, Nightmare: false, NoRetreat: false,
  Obstruct: false, Octolock: -1, Outrage: 0, ParentalBond: 0, PickupItem: null, PickupUse: 0, Powder: false,
  Prankster: false, PriorityAbility: false, PriorityItem: false, Protect: false, ProtectRate: 1, Quash: 0,
  Rage: false, RagePowder: false, Rollout: 0, Roost: false, ShellTrap: false, SkyDrop: -1, SlowStart: 0,
  SmackDown: false, Snatch: 0, SpikyShield: false, Spotlight: 0, Stockpile: 0, StockpileDef: 0,
  StockpileSpDef: 0, TarShot: false, Taunt: 0, ThroatChop: 0, Torment: false, Toxic: 0, Transform: false,
  TransformSpecies: null, Trapping: 0, TrappingMove: null, TrappingUser: -1, Truant: false,
  TwoTurnAttack: null, Unburden: false, Uproar: 0, WaterSport: false, WeightChange: 0, Yawn: 0,
  // Gen 9 (Paldea)
  AllySwitch: false, BoosterEnergy: false, BurningBulwark: false, Commander: null, CudChew: 0,
  DoubleShock: false, GlaiveRush: 0, ParadoxStat: null, OneUseAbility: null, SaltCure: false, Splinters: 0,
  SplintersType: null, SilkTrap: false, SuccessiveMove: null, SupremeOverlord: 0, Syrupy: 0, SyrupyUser: -1,
});

/** Estado de daño de un objetivo durante el uso de un movimiento (Battle::DamageState). */
export class DamageState {
  constructor() {
    this.reset();
  }

  reset() {
    this.terashell = false;
    this.typeMod = 0;
    this.unaffected = false;
    this.protected = false;
    this.missed = false;
    this.invulnerable = false;
    this.magicCoat = false;
    this.magicBounce = false;
    this.totalHPLost = 0;
    this.fainted = false;
    this.resetPerHit();
  }

  resetPerHit() {
    this.calcDamage = 0;
    this.hpLost = 0;
    this.critical = false;
    this.substitute = false;
    this.focusBand = false;
    this.focusSash = false;
    this.sturdy = false;
    this.disguise = false;
    this.iceFace = false;
    this.endured = false;
    this.berryWeakened = false;
  }
}
