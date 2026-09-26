// Métricas de sprites de combate a partir de lo que usa Añil en tiempo de ejecución: Data/species_metrics.dat
// (GameData::SpeciesMetrics compilado, con el plugin "Pokémon Animados para DBK"). Los PBS pokemon_metrics*.txt
// están desfasados respecto al .dat en ~25 especies (Venusaur, Rattata, Zubat, Steelix…), así que se usa el .dat.
//
// Formato de salida (game/data/species.json → species[ID].metrics | metricsFemale | forms[n].metrics | metricsFemale):
//   back / front   [x, y] o [x, y, escala] (la escala solo si la métrica la fija: back_sprite_scale / front_sprite_scale)
//   shadow         [x, yEspalda, yFrente] (ShadowSprite)
//   shadowSize     solo si ≠ 1 (0 = sin sombra)
//   altitude       solo si ≠ 0 (FrontSpriteAltitude)
//   animSpeed      velocidad de la espalda (AnimationSpeed[0]); animSpeedFront solo si el frente es distinto
// Cada entrada es COMPLETA (como en DBK: una forma o una hembra sin entrada propia copia la de la especie base).

const pair = (v) => {
  const [x = 0, y = 0, scale = null] = Array.isArray(v) ? v : [];
  return scale === null || scale === undefined ? [x, y] : [x, y, scale];
};

/** GameData::SpeciesMetrics (objeto del .dat) → métricas del juego. */
export function metricsFromCompiled(m) {
  const out = { back: pair(m.back_sprite), front: pair(m.front_sprite), shadow: [...(m.shadow_sprite || [0, 0, 0])] };
  const size = m.shadow_size ?? 1;
  if (size !== 1) out.shadowSize = size;
  if (m.front_sprite_altitude) out.altitude = m.front_sprite_altitude;
  const [back = 2, front = null] = m.animation_speed || [];
  const backSpeed = back ?? 2;
  // front_sprite_speed = animation_speed[1] || animation_speed[0] || 2
  const frontSpeed = front ?? backSpeed;
  out.animSpeed = backSpeed;
  if (frontSpeed !== backSpeed) out.animSpeedFront = frontSpeed;
  return out;
}

/**
 * Aplica las métricas compiladas (Map id → SpeciesMetrics) a las especies. Devuelve el nº de entradas aplicadas.
 * Se ignoran las especies que no existen en `species`.
 */
export function applyCompiledMetrics(species, compiled) {
  let n = 0;
  for (const m of compiled.values()) {
    const sp = species[m?.species];
    if (!sp) continue;
    const key = m.female ? 'metricsFemale' : 'metrics';
    const data = metricsFromCompiled(m);
    if (m.form > 0) {
      // Como antes con los PBS: una forma solo con sprite (Rockruff Ritmo Propio, Gigamax…) queda con solo métricas.
      sp.forms[m.form] = sp.forms[m.form] || {};
      sp.forms[m.form][key] = data;
    } else {
      sp[key] = data;
    }
    n += 1;
  }
  return n;
}
