// Montura de Zygarde (docs/CAMPANA.md §1.7, §2.7; X05): el 10 % se monta para correr (el doble de rápido que
// la carrera humana) y el 50 % lleva al jugador por el agua y bajo ella. Lógica pura sobre World/Player
// (sin Three.js): el sprite de la montura es un Character extra que WorldView dibuja (world.extraCharacters).
//
// Arte: si content/characters.js registra una hoja COMBINADA jinete+montura (id `<base>_montura10`,
// `<base>_montura50`… o una entrada con `variantOf: <base>, mount: '10'|'50'`), se usa como sprite del jugador.
// Si no, fallback: seguidor de Añil (Followers/ZYGARDE_1.png = 10 %, ZYGARDE.png = 50 %) debajo del jugador,
// con el jugador elevado y las piernas recortadas (profundidad de arbusto).
import { Character } from '../character.js';
import { RUN_SPEED } from '../player.js';
import { CHARACTERS, getCharacter } from '../../content/characters.js';

/** Velocidad de galope (escala de Essentials): 2/2^5.5 ≈ 0,044 s/casilla, la mitad que correr a pie (4.5). */
export const MOUNT_RUN_SPEED = 5.5;

/** Estilo del fallback por forma: sprite de seguidor, elevación del jugador y recorte de piernas (px). */
export const RIDE_STYLE = Object.freeze({
  10: Object.freeze({ sprite: 'follower:ZYGARDE:1:0', raise: 12, cut: 17 }),
  50: Object.freeze({ sprite: 'follower:ZYGARDE:0:0', raise: 18, cut: 22 }),
});

/** Estado de la montura guardado en el World (no en la partida: es de sesión). */
export function mountState(world) {
  if (!world.zygMount) {
    // forced: montura impuesta por un guion (Salto de Convergencia) aunque el mapa no permita montar.
    world.zygMount = { riding: false, forced: false, form: null, char: null, savedCharsets: null, combined: null, idleTick: 0 };
  }
  return world.zygMount;
}

/** ¿Va montado? (`form` opcional: '10' | '50'). */
export function isMounted(world, form = null) {
  const f = world?.zygMount?.form || null;
  return Boolean(f) && (!form || f === form);
}

/** ¿Va montado en el 10 % (montura de tierra)? Lo usan las cuestas de grava y los puzles de peso. */
export const isRiding = (world) => isMounted(world, '10');
/** Forma de la montura mostrada ahora ('10' | '50' | null). */
export const mountForm = (world) => world?.zygMount?.form || null;
/** Peso del jugador para placas y suelos quebradizos (CAMPANA B08): a pie 1, montado en el 10 % 3. */
export const playerWeight = (world) => (isRiding(world) ? 3 : 1);

/** ¿Permite el mapa montar el 10 %? Exteriores y cuevas; `mount: false`/`noMount`/`noCore` lo prohíben. */
export function mountAllowed(mapDef) {
  if (!mapDef || mapDef.mount === false || mapDef.noMount === true || mapDef.noCore === true) return false;
  if (mapDef.mount === true) return true;
  return Boolean(mapDef.outdoor || mapDef.cave);
}

/** ¿Puede montar ahora? (Correr recuperado, Zygarde acompaña, mapa permitido, en tierra). */
export function canRide(world) {
  const st = world?.state;
  if (!st?.zygardeAbility?.('run') || !st.data?.zygarde?.form) return false;
  const def = world.current?.def;
  return mountAllowed(def) && !def?.underwater && !world.player?.surfing;
}

/** Forma que debe mostrarse: '50' nadando o bajo el agua; '10' si el jugador ha montado; si no, null. */
export function desiredForm(world) {
  if (!world?.state?.data?.zygarde?.form) return null;
  const def = world.current?.def;
  if (def?.underwater || world.player?.surfing) return '50';
  const m = mountState(world);
  if (m.riding && (canRide(world) || m.forced)) return '10';
  return null;
}

/** Monta o desmonta el 10 % (se aplica en el siguiente syncMount). Devuelve true si cambió. */
export function setRiding(world, on) {
  const m = mountState(world);
  const want = Boolean(on);
  if (m.riding === want) return false;
  m.riding = want;
  return true;
}

/** Base del jugador en content/characters.js ('protagonista_m' | 'protagonista_f' | charset de Añil). */
function playerBase(player) {
  const walk = player?.charsets?.walk || '';
  return walk.replace(/_run$/, '');
}

/**
 * Hoja combinada jinete+montura del registro de personajes (content/characters_campaign.js:
 * `<base>_ride10`, `<base>_ride50` y, bajo el agua, `<base>_dive`), o null (→ fallback).
 */
export function combinedMountSprite(base, form, { underwater = false } = {}) {
  if (!base) return null;
  const ids = underwater ? [`${base}_dive`] : [];
  ids.push(`${base}_ride${form}`, `${base}_montura${form}`, `${base}_montura_${form}`, `${base}_mount${form}`, `${base}_zygarde${form}`);
  for (const id of ids) {
    if (getCharacter(id)) return id;
  }
  for (const [id, e] of Object.entries(CHARACTERS)) {
    if (e.variantOf === base && e.mount !== undefined && String(e.mount) === String(form)) return id;
  }
  return null;
}

/**
 * Desplazamiento horizontal (px) de una hoja combinada para una dirección: `anchorX: { 4, 6 }` de su entrada en
 * content/characters_campaign.js (la pareja jinete+montura no está centrada en el frame en las filas laterales).
 */
export function anchorOffsetX(sheetId, direction) {
  const n = Number(getCharacter(sheetId)?.anchorX?.[direction]);
  return Number.isFinite(n) ? n : 0;
}

/** Character extra que dibuja la montura (se crea una vez por World). */
function mountCharacter(world) {
  const m = mountState(world);
  if (!m.char) {
    const ch = new Character(world, { id: 'zygarde_mount' });
    ch.through = true;
    ch.visible = false;
    ch.shadow = true;
    m.char = ch;
    world.extraCharacters = [...(world.extraCharacters || []).filter((c) => c.id !== ch.id), ch];
  }
  return m.char;
}

/** Instala el hook de velocidad de carrera del jugador (Player#setMovementType lee world.runSpeed). */
function installSpeedHook(world) {
  if (world.runSpeed && world.runSpeed.zygarde) return;
  const fn = () => (isRiding(world) ? MOUNT_RUN_SPEED : RUN_SPEED);
  fn.zygarde = true;
  world.runSpeed = fn;
}

/** Hoja de buceo con arte propio (el jugador dentro de la burbuja): si existe, no hace falta el efecto. */
export function hasDiveArt(world) {
  const walk = world?.zygMount?.savedCharsets?.walk || world?.player?.charsets?.walk || '';
  return Boolean(getCharacter(`${walk.replace(/_run$/, '')}_dive`));
}

const variantKey = (world, form) => (form ? `${form}|${world.current?.def?.underwater ? 'agua' : 'tierra'}` : null);

function applyForm(world, prev, form) {
  const m = mountState(world);
  const p = world.player;
  installSpeedHook(world);
  if (m.savedCharsets) {
    p.setCharsets(m.savedCharsets);
    m.savedCharsets = null;
  }
  m.combined = form ? combinedMountSprite(playerBase(p), form, { underwater: Boolean(world.current?.def?.underwater) }) : null;
  if (m.combined) {
    m.savedCharsets = { ...p.charsets };
    p.setCharsets({ walk: m.combined, run: m.combined, surf: m.combined });
  }
  if (!form || m.combined) {
    p.yOffset = 0;
    p.xOffset = 0;
    p.calculateBushDepth();
  }
  const ch = mountCharacter(world);
  ch.visible = Boolean(form) && !m.combined;
  if (form) ch.characterName = RIDE_STYLE[form].sprite;
  world.requestRefresh?.();
}

/**
 * Sincroniza la montura con el jugador (llamar cada fotograma tras World#update). Cambia la forma mostrada
 * si hace falta y avisa con onFormChange(prev, form). Devuelve la forma mostrada.
 */
export function syncMount(world, { onFormChange } = {}) {
  const m = mountState(world);
  const form = desiredForm(world);
  const key = variantKey(world, form);
  if (form !== m.form || key !== m.key) {
    const prev = m.form;
    m.form = form;
    m.key = key;
    applyForm(world, prev, form);
    if (prev !== form) onFormChange?.(prev, form);
  }
  if (m.combined) world.player.xOffset = anchorOffsetX(m.combined, world.player.direction);
  if (!form || m.combined) return form;
  const p = world.player;
  const ch = m.char;
  const style = RIDE_STYLE[form];
  ch.map = p.map;
  ch.x = p.x; ch.y = p.y;
  ch.realX = p.realX; ch.realY = p.realY;
  ch.direction = p.direction;
  ch.jumpTimer = p.jumpTimer; ch.jumpPeak = p.jumpPeak; ch.jumpFraction = p.jumpFraction;
  ch.bobHeight = p.bobHeight || 0;
  ch.opacity = p.opacity;
  ch.transparent = p.transparent;
  ch.shadow = form === '10';
  ch.visible = p.opacity > 0 && !p.transparent;
  if (p.moving() || p.jumping()) {
    ch.pattern = p.pattern;
    m.idleTick = 0;
  } else if (++m.idleTick % 14 === 0) {
    ch.pattern = (ch.pattern + 1) % 4;
  }
  p.yOffset = -style.raise;
  p.bushDepth = style.cut;
  return form;
}

/** Quita la montura al instante (p. ej. al salir de la escena). */
export function resetMount(world) {
  const m = mountState(world);
  m.riding = false;
  if (m.form) {
    const prev = m.form;
    m.form = null;
    m.key = null;
    applyForm(world, prev, null);
  }
}
