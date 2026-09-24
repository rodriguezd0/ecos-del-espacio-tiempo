# Arquitectura — Pokémon: Ecos del Espacio-Tiempo (Three.js)

Contrato técnico para todo el código del juego. Si un módulo necesita desviarse, se actualiza este
documento en el mismo cambio. La **continuidad narrativa** manda la biblia
(`docs/biblia_axis_v2.txt`) y el registro `docs/DECISIONES.md`; este documento solo fija la técnica.

## 1. Principios

- **2D pixel art con Three.js**: cámara ortográfica, capas, iluminación y efectos. Nada de 3D libre.
- Resolución interna **512×384** (16×12 tiles de 32 px, como Añil/Essentials). Escalado entero por CSS
  (`image-rendering: pixelated`), letterbox negro.
- Arte a escala DS×2: un "píxel de arte" = 2 px de pantalla. Tiles 32 px; personajes BW ≈ 64×64 por frame.
- **Convención de coordenadas Three.js**: cámara `OrthographicCamera(0, 512, 0, -384)` y un grupo raíz con
  `scale.y = -1`, de modo que todo el contenido se posiciona en **píxeles con y hacia abajo** (como RMXP).
  Todas las texturas se crean con `flipY = false` (`assets.texture`), así que **v = 0 es la fila superior** de la
  imagen. Materiales con `side: THREE.DoubleSide` (la escala negativa invierte el winding).
- **ES modules sin bundler**. `three` se importa como `import * as THREE from 'three'` (importmap en
  `game/index.html` → `game/vendor/three.module.js`).
- Recursos de Añil se sirven sin copiar en `/anil/<ruta original>` (ver `server.mjs`). Recursos propios o
  procesados en `game/assets/`. Nunca referenciar rutas absolutas del disco.
- Lógica pura (datos, combate, mapas) **sin dependencias del DOM** para poder probarla con `node --test`.
- Textos del juego en **español**.
- Inmutabilidad razonable: el estado de guardado se modifica solo a través de las APIs de `GameState`.
  (En bucles de render/lógica por frame se permite mutación local por rendimiento.)

## 2. Estructura

```
server.mjs                 servidor de desarrollo (puerto 8080, sin caché, SSE de cambios, /anil/)
tools/                     herramientas Node (extracción PBS/rxdata, atlas, previews, validadores)
  lib/marshal.mjs          lector Ruby Marshal (.rxdata)
  lib/pbs.mjs              parser PBS
  lib/tile_render.mjs      render de mapas a PNG en Node (previews/validación)
  cache/anil_maps/         mapas de Añil volcados (solo referencia/stamps)
tests/                     node --test (lógica pura)
game/
  index.html               canvas #world (WebGL) + canvas #ui (2D) superpuestos
  vendor/three.module.js
  data/*.json              species, moves, abilities, items, types, trainer_types, tilesets, dex_axis
  assets/                  tilesets reempaquetados, autotiles, sprites propios (protagonistas, etc.)
  src/
    main.js                arranque
    core/                  engine, loop, input, assets, scenes, state (guardado), rng, events
    render/                renderer Three.js, tilemap, sprites de personaje, luz, clima, transiciones
    world/                 mapas (builder), pasabilidad, jugador, eventos/NPC, seguidor, encuentros, Zygarde campo
    script/                intérprete de escenas (async), contexto `ctx`
    ui/                    capa UI canvas 2D: fuentes, ventanas, mensajes, menús, pantallas
    battle/core/           motor de combate puro (sin DOM)
    battle/scene/          presentación del combate (Three.js + UI)
    audio/                 WebAudio: BGM con loops, SE, ME, gritos
    shared/                utilidades puras compartidas (autotile.js, math, constantes)
    content/               CONTENIDO DE AXIS: mapas, eventos, diálogos, entrenadores, encuentros, capítulos
```

## 3. Núcleo (`src/core`)

### Engine (`core/engine.js`) — singleton exportado como `engine`
```js
engine.renderer      // THREE.WebGLRenderer (512×384)
engine.ui            // UIContext: { canvas, ctx (CanvasRenderingContext2D 512×384) }
engine.input         // Input
engine.assets        // Assets
engine.audio         // Audio (src/audio)
engine.scenes        // SceneManager
engine.data          // DB cargada: { species, moves, abilities, items, types, trainerTypes, tilesets, dex }
engine.state         // GameState (partida en curso) o null
engine.frame         // contador de frames lógicos (60 Hz)
```
Bucle: lógica a **paso fijo de 60 Hz** (`update(dt=1/60)`), render una vez por frame de pantalla.

### Escenas (`core/scenes.js`)
```js
class Scene {
  async enter(params) {}      // carga recursos; el SceneManager espera antes de mostrarla
  exit() {}                   // liberar recursos Three.js
  update(dt) {}               // lógica 60 Hz (solo la escena superior recibe input)
  render(renderer) {}         // dibuja su THREE.Scene con su cámara
  drawUI(g) {}                // dibuja en el canvas 2D (g = CanvasRenderingContext2D), cada frame
  get transparent() { return false } // si true, se renderiza también la escena de debajo (p.ej. menús)
}
engine.scenes.push(scene, params) / pop(result) / replace(scene, params) / top
```
`pop(result)` resuelve la promesa devuelta por `push` → permite `const r = await engine.scenes.push(new BagScene())`.

### Input (`core/input.js`)
Botones lógicos: `UP DOWN LEFT RIGHT A B START SELECT RUN L R`.
Teclado por defecto: flechas/WASD, **A** = Z/Enter/Espacio, **B** = X/Escape/Retroceso, **START** = Enter?
(conflicto evitado: START = `C` y `Enter` cuando no hay menú; ver implementación), **RUN** = Shift, L/R = Q/E.
Gamepad estándar. API: `input.pressed(b)` (flanco), `input.held(b)`, `input.repeat(b)` (auto-repeat menús),
`input.dir4()` → 2/4/6/8 o 0 (convención RMXP: 2 abajo, 4 izq, 6 der, 8 arriba).

### Assets (`core/assets.js`)
```js
await assets.image(url)           // HTMLImageElement (cache)
await assets.texture(url)         // THREE.Texture NearestFilter, sin mipmaps, SRGB, cache
await assets.json(url)
assets.anil('Graphics/Pokemon/Front/TURTWIG.png') // → '/anil/Graphics/...'
```

### Estado de partida (`core/state.js`)
`GameState` serializable a JSON (guardado en `localStorage` con 3 ranuras + exportar/importar archivo):
```js
{
  version, playTimeFrames,
  player: { name, gender: 'M'|'F', id, money, mapId, x, y, dir, badges?: n/a },
  flags: { [key]: true }, vars: { [key]: number|string }, selfSwitches: { 'map:event:A': true },
  party: [Pokemon], boxes: [[Pokemon|null ×30] ×N], bag: { [itemId]: qty },
  dex: { seen: { [speciesId]: true }, caught: { [speciesId]: true } },
  zygarde: { cells: [cellId], cores: [coreId], form: 'core'|'10'|'50'|'complete', abilities: { run, ram, terrain, climb, swim, detect, dive, fly, rebuild } },
  fragments: [pilarId], tablets: [tabletId], visited: [mapId], flyPoints: [pointId],
  options: { textSpeed, bgmVolume, seVolume, encounterMode: 'classic'|'visible', battleScene: true, ... },
  clock: { minutes } // hora del juego (ciclo día/noche propio, no reloj real)
}
```

## 4. Datos (`game/data`, generados por `npm run data`)

- `species.json`: `{ ID: { id, num, name, types[], baseStats{hp,atk,def,spe,spa,spd}, genderRatio, growthRate, baseExp, evs{}, catchRate, happiness, abilities[], hiddenAbilities[], moves[[lvl,MOVE]], tutorMoves[], eggMoves[], eggGroups[], height, weight, category, pokedex, evolutions[[target,method,param]], flags[], forms{ n: {overrides…, formName, megaStone, metrics} }, metrics{ back[x,y], front[x,y], shadow[x,y,size], altitude, animSpeed } } }`
- `moves.json`: `{ ID: { id, name, type, category(Physical|Special|Status), power, accuracy, pp, target, priority, functionCode, flags[], effectChance, description } }`
- `abilities.json`, `items.json` (`pocket`, `price`, `fieldUse`, `battleUse`, `flags`, `move` para MT), `types.json`
  (`weaknesses/resistances/immunities` del tipo **defensor**), `trainer_types.json` (referencia de Añil).
- `tilesets.json`: `{ tilesets: { id: { name, image, autotiles[7], tileCount, atlasWidth, atlasHeight, passages[], priorities[], terrainTags[] } }, autotiles: { name: {width,height} } }`
- `dex_axis.json`: inventario de 412 de la biblia (orden original) → IDs. **No es roster final (D28).**

Sprites de Pokémon (Añil, animados): `/anil/Graphics/Pokemon/{Front,Back,Front shiny,Back shiny}/<ID>[_forma].png`
son **tiras horizontales** de frames cuadrados (alto = lado del frame, n = ancho/alto).
Iconos: `Icons/<ID>.png` 128×64 (2 frames 64×64). Seguidores: `/anil/Graphics/Characters/Followers[ shiny]/<ID>.png`
(4×4 frames). Gritos: `/anil/Audio/SE/Cries/<ID>.ogg`.

## 5. Tiles y mapas

IDs RMXP (ver `src/shared/autotile.js`): 0 vacío; 48–383 autotiles (7 slots × 48 patrones); ≥384 tiles normales.
Tres capas (0 suelo, 1, 2). Atlas reempaquetado: 64 columnas (`regularTileAtlasPos`).
**Pasabilidad RMXP**: para capas 2→1→0: si el tile tiene el bit de dirección bloqueado → no pasa;
si `priority == 0` y tile no vacío → pasa (deja de mirar). Bits `passages`: 1 abajo, 2 izq, 4 der, 8 arriba
(0x0F = muro), 0x40 arbusto (hierba: medio cuerpo oculto), 0x80 mostrador (hablar a través).
**Prioridad**: tiles con `priority > 0` se dibujan por encima de personajes situados por encima de su línea
(z = (y + priority)·32 + 32, como RMXP). Terrain tags de Essentials (`Data/Scripts/.../TerrainTag`): hierba alta,
agua, cascada, salientes (ledges), hielo, etc.

### Definición de mapas de Axis (`src/content/maps/<id>.js`)
```js
export default {
  id: 'pueblo_inicial', name: '…', tileset: 7, width: 46, height: 36,
  outdoor: true, bgm: 'PrismaVilla1', battleback: 'Pueblo', encounters: { grass: [...], … },
  build(b) { /* MapBuilder DSL: rellenos, autotiles, stamps, caminos… */ },
  warps: [{ x, y, to: 'casa_prota', tx, ty, dir: 8, door: true }],
  connections: [{ dir: 'south', to: 'ruta_1', offset: 0 }],
  events: [{ id: 'mama', x, y, sprite: 'npc_mama', dir: 2, move: 'still'|'wander'|route, trigger: 'action'|'touch'|'auto'|'parallel', when: (s) => bool, script: async (ctx) => {…} }],
  onEnter: async (ctx) => {}, // opcional
}
```
El MapBuilder (`world/mapBuilder.js`) produce `layers: Uint16Array[3]` deterministas. Los **stamps**
(edificios, árboles, cercas…) se definen por tileset en `src/content/stamps/<tileset>.js` como rectángulos de
tiles del tileset original (8 columnas) o recortes probados de mapas de Añil. Herramienta de preview:
`node tools/preview_map.mjs <id>` → `tools/cache/previews/<id>.png`.

## 6. Escenas de historia (`src/script`)
Guiones como funciones `async (ctx) => {}`. Mientras un guion con bloqueo corre, el jugador no se mueve.
```js
await ctx.say(text, { speaker, portrait?, telepathy? })  // caja de mensaje; telepathy = estilo del Core
const i = await ctx.choice(['Sí', 'No'], { cancel: 1 })
await ctx.move(targetId|'player', ['up','up','left'], { wait: true })
await ctx.face(targetId, dir) / ctx.turnToPlayer()
await ctx.wait(frames) / ctx.fade('out'|'in', frames) / ctx.flash() / ctx.shake()
await ctx.warp(mapId, x, y, dir) / ctx.camera.pan(x, y) / ctx.emote(targetId, '!')
await ctx.battle({ trainer: 'gael_1' } | { wild: { species, level, … } }) → 'win'|'lose'|'run'|'caught'
ctx.flag(key) / ctx.setFlag(key, v=true) / ctx.var(key) / ctx.setVar(key, v)
await ctx.giveItem(id, n) / ctx.givePokemon(pokemon) / ctx.heal() / ctx.bgm(name) / ctx.se(name) / ctx.me(name)
```

## 7. Combate
- `battle/core`: **sin DOM**. `new Battle(config, ui)`; `await battle.run()` → `{ outcome: 'win'|'lose'|'run'|'caught'|'forfeit', … }`.
  `config = { type: 'wild'|'trainer', format: 'single'|'double', player: {name, party, bag}, opponent: { name, trainerType, party, ai, items }, rules: { canRun, canCatch, catchCondition?, expGain, … }, weather, terrain, battleback }`.
  `ui` implementa la interfaz **BattleUI** (todas async): `message(text)`, `chooseAction(battler)`, `chooseMove`,
  `chooseTarget`, `chooseSwitch(reason)`, `chooseItem`, `animateMove(user, move, targets)`, `animateDamage`,
  `animateHP(battler, from, to)`, `animateStatus`, `animateStat(battler, stat, stages)`, `faint`, `switchOut/In`,
  `throwBall(ball, shakes, caught)`, `expGain`, `levelUp`, `learnMove(pokemon, move) → replaceIndex|null`,
  `evolve(...)` (en overworld, tras el combate). Un `HeadlessBattleUI` para tests elige automáticamente.
  Mecánicas: portadas de Essentials 21.1 (`Pokemon Anil V4.13/Data/Scripts/028_…035_`), generación 9.
- `battle/scene`: presentación estilo BW2 (sprites animados de tira, cámara, cajas de datos, menús).

## 8. Pokémon (objeto serializable, `battle/core/pokemon.js`)
```js
{ uid, species, form, nickname, level, exp, gender, nature, ability, abilityIndex, shiny, alpha,
  ivs{hp..}, evs{hp..}, moves:[{id, pp, ppUps}], hp, status, statusCount, heldItem, happiness,
  ball, ot:{name,id}, metMap, metLevel, obtainedMode }
```
Funciones puras: `createPokemon(db, species, level, opts)`, `calcStats(db, pkmn)`, `expForLevel(rate, lv)`…

## 9. Pruebas
- `npm test` → `node --test tests/` (lógica pura: datos, combate, mapas, estado).
- Humo en navegador: `node tools/smoke.mjs` (playwright-core con Chrome del sistema) abre el juego,
  ejecuta un escenario y guarda capturas en `tools/cache/screens/`.
- Cada bloque jugable se verifica dentro del juego antes de darse por terminado.
