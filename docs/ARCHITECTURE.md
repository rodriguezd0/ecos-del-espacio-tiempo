# Arquitectura — Pokémon: Ecos del Espacio-Tiempo (Three.js)

Contrato técnico para todo el código del juego. Si un módulo necesita desviarse, se actualiza este
documento en el mismo cambio. La **continuidad narrativa** manda la biblia
(`docs/biblia_axis_v2.txt`), el registro `docs/DECISIONES.md` y el guion de cada bloque (`docs/bloques/`);
este documento solo fija la técnica. Un agente de contenido debería poder trabajar solo con este archivo,
`docs/stamps.md` (catálogo de stamps/brushes) y el guion de su bloque.

## 1. Principios

- **2D pixel art con Three.js**: cámara ortográfica, capas, iluminación y efectos. Nada de 3D libre.
- Resolución interna **512×384** (16×12 tiles de 32 px, como Añil/Essentials). Escalado entero por CSS
  (`image-rendering: pixelated`), letterbox negro.
- Arte a escala DS×2: un "píxel de arte" = 2 px de pantalla. Tiles 32 px; personajes BW ≈ 64×64 por frame.
- **Convención de coordenadas Three.js**: cámara `OrthographicCamera(0, 512, 0, -384)` y un grupo raíz con
  `scale.y = -1`, de modo que todo el contenido se posiciona en **píxeles con y hacia abajo** (como RMXP).
  Todas las texturas se crean con `flipY = false`, así que **v = 0 es la fila superior** de la imagen.
  Materiales con `side: THREE.DoubleSide` (la escala negativa invierte el winding).
- **ES modules sin bundler**. `three` se importa como `import * as THREE from 'three'` (importmap en
  `game/index.html` → `game/vendor/three.module.js`).
- Recursos de Añil se sirven sin copiar en `/anil/<ruta original>` (ver `server.mjs`). Recursos propios o
  procesados en `game/assets/`. Nunca referenciar rutas absolutas del disco. El servidor sirve `game/` como raíz.
- Lógica pura (datos, combate, mapas, estado) **sin dependencias del DOM** para poder probarla con `node --test`.
- Textos del juego en **español**.
- El estado de guardado se modifica **solo a través de las APIs de `GameState`** (§3). En bucles de
  render/lógica por frame se permite mutación local por rendimiento.

## 2. Estructura

```
server.mjs                 servidor de desarrollo (puerto 8080, sin caché, SSE de cambios, /anil/)
tools/                     herramientas Node (extracción PBS/rxdata/audio, atlas, previews, validadores, pruebas)
  lib/map_node.mjs         construir mapas en Node (builder + stamps + tiles vacíos)
  preview_map.mjs          mapa → PNG (tools/cache/previews/<id>.png)
  smoke.mjs                humo en Chrome headless con teclas y capturas
  e2e_flows.mjs            flujos completos en navegador (guardar/cargar, mensajes, objetos, repelente…)
  perf_map.mjs             rendimiento por fotograma y fugas de recursos Three.js al cambiar de mapa
tests/                     node --test (lógica pura + integración sin navegador)
game/
  index.html               canvas #world (WebGL) + canvas #ui (2D) superpuestos
  data/*.json              species, moves, abilities, items (+ items_axis), types, trainer_types, tilesets, dex_axis, audio_index
  assets/                  tilesets reempaquetados, autotiles, personajes propios, items/ (iconos propios opcionales)
  src/
    main.js                arranque y rutas de desarrollo (?scene=…)
    core/                  engine, input, assets, scenes, state (+ stateData, storageOps)
    render/                vista del mundo, tilemap, sprites, compositor, fx de pantalla, clima, efectos, cámara
    world/                 mapScene, world, builder/loader de mapas, eventos y tipos, jugador, seguidores,
                           encuentros, combate desde el mapa (battleFlow), acciones de campo (fieldActions)
    script/                ScriptRunner y contexto `ctx` de los guiones
    ui/                    capa UI canvas 2D (fachada ui/api.js): mensajes, menús, pantallas
    battle/core/           motor de combate puro       battle/scene/  presentación estilo BW2
    audio/                 WebAudio (engine.audio) + catálogo semántico
    content/               CONTENIDO DE AXIS: mapas, eventos, cutscenes, entrenadores, personajes, stamps
```

## 3. Núcleo (`src/core`)

### Engine (`core/engine.js`) — singleton `engine`
```js
engine.renderer  engine.ui { canvas, ctx }  engine.input  engine.assets  engine.audio  engine.scenes
engine.data      // { species, moves, abilities, items (items.json + items_axis.json), types, trainerTypes, tilesets, dex }
engine.state     // GameState de la partida en curso o null (título)
engine.frame     // fotogramas lógicos (60 Hz)   engine.debug // ?debug en la URL
engine.reportError(err) // registra y muestra una caja de error (pulsar para ocultar)
```
Bucle: lógica a **paso fijo de 60 Hz** (`update(dt=1/60)`, suma el tiempo de juego con `state.tickPlayTime`),
render una vez por frame de pantalla.

### Escenas (`core/scenes.js`)
```js
class Scene { async enter(params) {} exit() {} update(dt) {} render(renderer) {} drawUI(g) {} get transparent() { return false } }
const result = await engine.scenes.push(scene, params)  // se resuelve con el valor de pop(result)
engine.scenes.pop(result, scene = top)   engine.scenes.replace(scene, params)   engine.scenes.top
```
Solo la escena superior recibe `update`. Las UI transparentes (`UIScene`) llaman cada frame a
`updateWhilePaused(dt)` de las escenas de debajo: **MapScene lo implementa** (guiones, rutas, fundidos,
efectos y clima siguen vivos bajo mensajes/menús, sin input). `push`/`pop` vacían el input (`input.flush()`)
para que una pulsación no se propague al cerrar un menú. Un fallo en `exit()` se registra y no bloquea `pop`.

### Input (`core/input.js`)
Botones `UP DOWN LEFT RIGHT A B START SELECT RUN L R`. Teclado: flechas/WASD, **A** = Z/Espacio/Intro,
**B** = X/Esc/Retroceso, **START** = C/Tab, SELECT = V, RUN = Mayús, L/R = Q/E. Gamepad estándar.
`input.pressed(b)` (flanco), `held(b)`, `repeat(b)` (auto-repeat de menús), `dir4()` → 2/4/6/8 o 0.

### Assets (`core/assets.js`)
`await assets.image(url)`, `tryImage(url)` (null si falta), `texture(url)`, `json(url)`, `font(family, url)`,
`assets.anil('Graphics/…')` → URL servida. Texturas crudas de mundo: `render/textures.js`
(`loadRawTexture`, `tryRawTexture`, `loadRepeatTexture` — todas cacheadas por URL: no se liberan al cambiar de mapa).

### Estado de partida (`core/state.js`, forma y migraciones en `core/stateData.js`)
`data` es JSON puro (`SAVE_VERSION = 2`): `version, createdAt, savedAt, playTimeFrames, player{name, gender,
id, money, mapId, x, y, dir}, flags, vars, selfSwitches, party[≤6], boxes[30][30] (null = hueco),
boxNames[30], bag{id: n}, registeredItem, dex{seen, caught, obtained}, zygarde{cells, cores, form,
abilities}, fragments, tablets, visited, flyPoints, clues[{id, text, solved}], options, clock{minutes},
lastHeal{mapId,x,y,dir}|null, repel{steps, item}`.

API de `GameState` (todas validan y lanzan `Error` con mensaje en español):
```js
// flags / variables / self switches
flag(k) setFlag(k, v=true) var(k, def=0) setVar(k, v) selfSwitch(map, ev, 'A') setSelfSwitch(map, ev, 'A', v)
// jugador
player  setPosition(mapId, x, y, dir)  addMoney(n)  playTimeFrames  tickPlayTime(n=1)
healPoint  setHealPoint(mapId, x, y, dir=2)           // destino tras perder y de la Cuerda Huida
// opciones (sustituyen el objeto: inmutable)
options  setOption(key, value) → opciones  setOptions({ … })
// mochila y objetos clave
itemCount(id) hasItem(id, n) addItem(id, n) removeItem(id, n)→bool
addKeyItem(id) hasKeyItem(id) removeKeyItem(id)       // cantidad fija 1
registeredItem  registerItem(id|null)
// repelente
repelSteps  repelItem  startRepel(itemId, pasos)→false si ya hay uno  stepRepel()→true al agotarse
// equipo
party  addPokemon(p)→{where:'party'|'box'|'none', box, slot}  setParty(list)  setPartyMember(i, p)
removePartyMember(i) swapParty(a, b) firstAblePokemon() leadPokemon() allFainted()
// cajas del PC
boxes boxCount boxName(b) renameBox(b, nombre≤12) boxPokemon(b, s) setBoxPokemon(b, s, p) setBoxes(boxes)
depositPokemon(i, box=0)→{box, slot}  withdrawPokemon(box, slot)→índice  releasePokemon(ref)→Pokémon
movePokemon(from, to)          // ref = { party: i } | { box, slot }; { party: ≥longitud } = añadir al final
// Pokédex, pistas, Axis, reloj
registerSeen(sp) registerCaught(sp) seenCount() caughtCount() hasPokedex() obtainPokedex()
clues hasClue(id) addClue(id, texto)→bool solveClue(id)
hasCell/addCell hasCore/addCore zygardeAbility(k)/setZygardeAbility(k, v) addFragment addTablet
hasFlyPoint(id) unlockFlyPoint(id)   // destinos de Vuelo desbloqueados por guion (id de lugar del atlas, §7e)
hour advanceMinutes(m) isDay()
```
El equipo nunca se queda sin un Pokémon capaz de combatir (depositar/mover/liberar lanzan «¡Es tu último
Pokémon!»). Las operaciones puras de cajas están en `core/storageOps.js` (reexportadas por `ui/logic/storageLogic.js`).

**Guardado** (`SaveSystem`, 3 ranuras en `localStorage` `ecos.save.<n>` + archivo):
`list()` → `[null | {slot, corrupt:true} | {slot, name, gender, mapId, playTimeFrames, savedAt, dexCaught,
fragments, party}]`, `save(slot, state)`, `load(slot)` → GameState migrado | null (lanza si está dañada),
`remove(slot)`, `exportFile(state)`, `await importFile(file)`. `migrate(raw)` convierte cualquier versión
anterior sin perder datos (rellena campos, normaliza cajas a 30×30, mueve `vars.repelSteps` → `repel`,
equipo > 6 → cajas) y no modifica la entrada. **Campo nuevo en el guardado → añadirlo en `newGameData` y,
si hace falta convertir, en `migrate` subiendo `SAVE_VERSION` + test en `tests/integration_save.test.mjs`.**

## 4. Datos (`game/data`, generados por `npm run data`)

`npm run data` = `extract_data.mjs` + `extract_tilesets.mjs` + `extract_audio.mjs` (índice de audio).
- `species.json`: `{ ID: { id, num, name, types[], baseStats{hp,atk,def,spe,spa,spd}, genderRatio, growthRate, baseExp, evs{}, catchRate, happiness, abilities[], hiddenAbilities[], moves[[lvl,MOVE]], tutorMoves[], eggMoves[], eggGroups[], height, weight, category, pokedex, evolutions[[target,method,param]], flags[], forms{…}, metrics{…} } }`
- `moves.json`: `{ ID: { id, name, type, category, power, accuracy, pp, target, priority, functionCode, flags[], effectChance, description } }`
- `items.json` (`pocket` 1–8, `price`, `fieldUse`, `battleUse`, `flags`, `move` para MT) + **`items_axis.json`**
  (objetos propios: AZUREFRAGMENT, AZUREFLUTE, CLUENOTEBOOK, POKEDEXAXIS… y sobrescrituras de Añil como las cañas de
  X17: OLDROD «Caña Vieja», GOODROD «Caña Buena», SUPERROD «Supercaña»). La fusión de `main.js` sustituye la entrada
  ENTERA: una sobrescritura copia todos los campos de `items.json`. Campo opcional **`icon`**: archivo
  de `Graphics/Items` de Añil (o `game/assets/items/<icon>.png`) que usa la UI en lugar del id.
  Objetos clave y Tablillas (`content/story/tablets.js`) no se tiran ni se venden (`ui/logic/bagLogic.js#isProtectedItem`,
  `canToss`, `canSell`).
- `abilities.json`, `types.json`, `trainer_types.json`, `tilesets.json`, `dex_axis.json` (inventario de 412; **no es roster final, D28**).

Sprites de Pokémon (Añil): `/anil/Graphics/Pokemon/{Front,Back,Front shiny,Back shiny}/<ID>[_forma].png` (tiras
horizontales), iconos `Icons/<ID>.png`, seguidores `Graphics/Characters/Followers[ shiny]/<ID>.png`, gritos `Audio/SE/Cries/<ID>.ogg`.

## 5. Mapas y eventos

IDs RMXP (`src/shared/autotile.js`): 0 vacío; 48–383 autotiles (7 slots × 48); ≥384 tiles normales
(ID = 384 + y·8 + x en la imagen original de 8 columnas). Tres capas. **Pasabilidad RMXP** (capas 2→1→0; bits
1 abajo, 2 izq, 4 der, 8 arriba, 0x40 arbusto, 0x80 mostrador). **Prioridad** > 0 se dibuja sobre personajes.
Terrain tags de Essentials (`world/terrain.js`): Ledge, Grass, TallGrass (encuentros, `mustWalk`), agua
(Water/DeepWater/StillWater), Waterfall, Ice, Bridge, Puddle…

### Registro y definición (`content/maps/index.js` → `content/maps/<bloque>/<id>.js`)
Registrar: `MAPS.<id> = () => import('./b01/<id>.js')`. Definición (export default):
```js
{
  id: 'villa_alba', name: 'Villa Alba', tileset: 7, width: 46, height: 36,
  outdoor: true,                 // día/noche y combate "exterior"; dayNight: false lo desactiva
  bgm: 'town_start',             // nombre semántico (§7c) o archivo de Audio/BGM; se pide al entrar (no reinicia la misma)
  battleback: 'Pueblo', cave: false, encounters: { grass: [[peso,'ESPECIE',min,max],…], grassNight, cave, water, stepChance: { grass: 21 } },
  start: { x, y, dir },          // aparición por defecto (se busca la casilla libre más cercana)
  weather: 'rain' | { type: 'rain', power: 5 },   fog: { name, opacity, sx, sy, zoom, blend }   dark: { amount: .94, radius: 72 }
  tone: [r, g, b, gris],         // tono propio del mapa      showLocation: false   noFollower: true   noCore: true
  escapeRope: false,             // prohíbe Cuerda Huida / Teletransporte / Excavar aquí
  seed, library: false, stamps: {…}, brushes: {…}, fallback: {…},   // ver §5 builder
  build(b) { … } | layers: [capa0, capa1, capa2],
  warps: [{ x, y, to, tx, ty, dir, door: true }, { x, y, to, tx, ty, dirTrigger: 2 }],  // dirTrigger: alfombra (pulsar hacia dir)
  connections: [{ dir: 'north'|'south'|'east'|'west', to, offset: 0 }],
  events: [ … ],                 // ver abajo
  onEnter: async (ctx) => {},    // guion bloqueante al entrar (warp o carga)
}
```
Validación: `world/mapLoader.js#validateMapDef`. En Node: `buildMapNode(id)` (`tools/lib/map_node.mjs`);
preview `node tools/preview_map.mjs <id> [--pass] [--grid]`. `tests/integration_maps.test.mjs` construye TODOS
los mapas registrados que existan, crea sus eventos con un GameState real y comprueba warps/conexiones.

### MapBuilder (`world/mapBuilder.js`) — `build(b)`
Capa `null` = la que diga el brush/stamp. Brushes/stamps por nombre de la biblioteca del tileset
(`content/stamps/<Imagen>.js`, catálogo en `docs/stamps.md`, visor `/src/content/stamps/viewer.html`).
```js
b.fill(layer, brush)  b.rect(layer, x, y, w, h, brush)  b.tile(layer, x, y, brush)  b.erase(layer, x, y, w, h)
b.paint(brush, cells[[x,y]…], { layer, mask })  b.blob(layer, cells, brush)  b.cellsWhere((x,y,b)=>bool)
b.path(layer, points, brush, { width })  b.line(layer, x0, y0, x1, y1, brush, width)
b.scatter(layer, x, y, w, h, brush, densidad, opts)  b.scatterStamps(nombre, x, y, w, h, n, { spacing, onlyIf })
b.stamp(nombre|def, x, y, opts)  b.autotile(layer, x, y, w, h, slot)  b.get(layer, x, y)  b.set(layer, x, y, id)
b.mark(kind, x, y, data)  b.hasStamp(n)  b.hasBrush(n)
```
Brushes: `{ tile, variants }`, `{ autotile: slot }`, `{ nine: [x,y] }`, `pattern`, `grid`, `forest`, `cliff`,
`terrace`, `room`, `cave`, `line`. Stamps: `{ src:[x,y,w,h], layer, door }`, `{ from: { map, x, y, w, h, layers } }`
(horneados con `node tools/stamps_bake.mjs`) o `{ tiles: { w, h, layers } }`. **Ojo**: el agua exterior se pinta con
el brush `agua` + `orilla` (el autotile de agua de Añil solo tiene válidos sus 4 bloques interiores).
Kit de Pilar, tinte por Pilar, tiles propios y biblioteca por bioma: §12.

### Eventos (`world/mapEvent.js`, tipos en `world/eventTypes.js`)
```js
{ id, x, y, name?,
  // propiedades de página (sirven en la raíz o en pages[]; gana la ÚLTIMA página cuya when() se cumple):
  when: (state, ev) => bool, sprite: 'gael'|'anil:chaval1'|'chaval1'|'follower:PIKACHU:0:0'|'asset:ruta.png',
  tileId, dir: 2|4|6|8, pattern, move: 'still'|'wander'|{ wander: n }|'random'|'look'|'toward'|'face'|[ruta]|{ route, repeat },
  speed: 3, freq: 3, trigger: 'action'|'touch'|'eventTouch'|'auto'|'parallel', script: async (ctx) => {},
  through, solid, alwaysOnTop, stepAnime, walkAnime, directionFix, opacity, sight: n (eventTouch: visión),
  light: { radius, intensity } (mapas oscuros), glow: 'zygardeCell', shadow, lock: false, noOver, patch: [[x,y,capa,id]],
  restrictTo: (x, y) => bool,
  pages: [{ … }, { … }] }
```
Disparadores: `action` (A delante o debajo), `touch` (el jugador lo toca/pisa), `eventTouch` (el evento toca al
jugador; con `sight` = entrenador que ve), `auto` (bloqueante al cumplirse), `parallel` (en bucle, no bloquea).
Durante un guion bloqueante el evento que lo disparó queda "bloqueado" mirando al jugador (salvo `lock: false`).
Cambiar de página cancela su ruta forzada y **libera** a quien la esperaba (`ctx.move`).
Sprites: ids de `content/characters.js` (arte propio: `protagonista_m/_f`, `gael`, `profesor`, `policia`, `vecino`,
`vecina`, `anciano`, `zygarde_core`, `zygarde_celula`…), `anil:<charset o clase>` o nombre de `Graphics/Characters`.

**Tipos de evento** (`type`): textos genéricos sustituibles por propiedades.
| type | propiedades |
|---|---|
| `sign` | `text` (skin de cartel) o `script` |
| `item` | `item`, `count=1`, `hidden`, `sprite` (desaparece al cogerlo; self switch A) |
| `trainer` | `name`, `sprite`, `dir`, `sight=4`, `party` o `trainer` (id de `content/trainers`), `intro`, `defeat`, `after`, `trainerType`, `eyeBgm`, `battle:{…}` |
| `ramRock` | Embestida de Zygarde (`ram`); `blockedText`, `askText` |
| `roughTerrain` | bloquea hasta `terrain` |
| `climbWall` | `to:[x,y]` con `climb` |
| `diveSpot` | `to`, `tx`, `ty`, `dir` con `dive` (surfeando) |
| `rebuildGap` | `tiles:[[x,y,capa,id]…]` con `rebuild` (persiste con `patch`) |
| `zygardeCell` | `cell` (id único), `text`; sprite `zygarde_celula` flotante + brillo verde |

### Entrenadores (`content/trainers/index.js`)
Cada zona exporta `{ id: def }`: `{ name, class, sprite, overworld, party: [{species, level, moves?, ability?, item?,
nature?, form?, shiny?, ivs?, evs?}] | (state) => [...], items, ai: 0–100, money, bgm, victoryME, intro, loseText,
winText, format, canLose }`. `getTrainer(id, state)`. Uso: `ctx.battle({ trainer: 'gael_1' })`.
`money` (base del premio) sale de la tabla de `docs/BALANCE.md` según la clase (`content/trainerMoney.js`; fuera de
`content/trainers/` porque todo `*.js` de esa carpeta se registra como entrenadores); `moneyKind`/`moneyException` para
clases que no están en la tabla. Lo comprueba `tests/trainer_money.test.mjs`.

## 6. Guiones (`src/script`)

Guiones = `async (ctx) => {}` ejecutados por `ScriptRunner` (`scene.runScript(fn, event, nombre, { blocking })`).
Mientras corre uno bloqueante el jugador no se mueve y el reloj de juego se detiene. Al terminar el último
guion bloqueante se cierra cualquier mensaje dejado abierto con `keepOpen`. Los errores se registran y
muestran (no cuelgan el juego). Esperas en fotogramas lógicos (60 = 1 s).

`ctx` completo (`script/context.js`):
```js
ctx.scene ctx.world ctx.state ctx.db ctx.ui ctx.audio ctx.event ctx.player ctx.map ctx.directionTo(a, b)
// diálogo (ui/api.js)
await ctx.say(texto, { speaker, telepathy, keepOpen, auto, skin, position, se })
const i = await ctx.choice(['Sí', 'No'], { message, cancel: 1, index })   await ctx.confirm(texto) → bool
await ctx.number({ min, max, initial, message })
// personajes: objetivo = id de evento | 'player' | 'follower' | 'core' | 'this'/null (el evento) | objeto
await ctx.move(obj, ['up','left',{ jump:[x,y] },{ wait: 30 },'turn_down', …], { wait: true, through: true, speed })
ctx.face(obj, 'up'|8|{x,y})   ctx.turnToPlayer(obj)   await ctx.approach(obj)   await ctx.movePlayerTo(x, y, { through, speed })
await ctx.jump(obj, dx, dy)   await ctx.emote(obj, '!'|'?'|'…'|'♪'|'♥')   ctx.facingTile() → {x, y}
// pantalla
await ctx.wait(frames)   await ctx.fade('out'|'in', frames, color)   await ctx.flash(color, frames, alpha)
await ctx.shake(power, speed, frames)   await ctx.tone([r,g,b,gris], frames)   await ctx.transition(nombre, frames)
await ctx.weather(tipo, potencia)   const h = ctx.effect(nombre, opts); h.remove(frames)   // §7d
await ctx.camera.pan(x, y, frames)   await ctx.camera.reset(frames)   ctx.camera.follow(obj)   ctx.camera.shake(…)
// mapas y combates
await ctx.warp(mapId, x, y, dir, { fade: true, door: false, frames: 16 })
await ctx.battle({ trainer: 'id' } | { type: 'trainer', opponent: { name, party } } | { wild: { species, level } }, …) → 'win'|'lose'|'run'|'caught'|'forfeit'
await ctx.wildBattle({ species, level, form, shiny })
// estado (setFlag/setVar/setSelfSwitch refrescan las páginas de los eventos)
ctx.flag(k) ctx.setFlag(k, v) ctx.var(k, def) ctx.setVar(k, v) ctx.selfSwitch('A', obj) ctx.setSelfSwitch('A', v, obj)
ctx.erase(obj) ctx.setTile(x, y, capa, id) ctx.bridge(altura|0) ctx.zygarde('ram'|…) ctx.requestRefresh()
// objetos y Pokémon
await ctx.giveItem(id, n, { found, silent })   // objetos clave con addKeyItem (no se acumulan)
await ctx.givePokemon({ species, level, … } | pokemon, { silent }) → pokemon   ctx.heal()
ctx.setHealPoint(x = jugador, y = jugador, dir = 2, mapId = actual)   // punto de derrota/Cuerda Huida
ctx.bgm(nombre, opts) ctx.se(nombre) ctx.me(nombre) ctx.cry(especie, forma)
```
Para cualquier otra cosa del estado: `ctx.state.<API §3>` (p. ej. `ctx.state.obtainPokedex()`, `ctx.state.addClue(id, texto)`).

### Combates de guion (`content/common/bossBattle.js`)
Guardianes, jefes, Genesis y Gael (CAMPANA §2.6, `docs/BALANCE.md`): perder **no** es derrota general. Módulo puro:
```js
import { bossBattle } from '../common/bossBattle.js';
const r = await bossBattle(ctx, { trainer: 'leandro' }, { x, y, dir = 8, map = mapa actual } | null,
  { loseText: 'Otra vez.' | [...], speaker: 'Leandro', onLose: (ctx) => ctx.setVar('intentos', 1), warp: { fade } });
// r: 'win' | 'caught' (superado) | 'run' (huida de un salvaje) | 'lose' (ya curado y en la casilla de reintento)
bossBattleRequest(request)   // la petición con canLose (arriba y en rules) + rules.noMoneyLoss, sin modificar la entrada
```
Fuerza `canLose` (el motor solo dice «¡No te quedan Pokémon!» y «¡Has perdido contra …!»: sin «¡Estás fuera de
combate!» ni vuelta al punto de cura) y `rules.noMoneyLoss` (sin «Has pagado…»). Al perder (o si el combate falla):
`ctx.heal()` → `onLose(ctx)` (estado del reintento) → warp a `retry` (sin `retry`, fundido y se queda en su casilla:
«se le vuelve a hablar») → `loseText`. **Nunca toca `state.healPoint`.** Los combates de Gael que siguen la historia
aunque se pierda (B1–B5) pasan `canLose` + `noMoneyLoss` a `ctx.battle` y curan con su propia frase.
`scriptedBattle(ctx, request, retry)` (B06, reexportado por `events/b06_common.js`) es el mismo helper. Tests:
`tests/boss_battle.test.mjs` (incluye el motor real: `moneyChange` 0 y sin aviso de derrota).

### Acciones de campo (`world/fieldActions.js`)
El menú de pausa devuelve `{ type: 'useItem', item }` | `{ type: 'fieldMove', move, partyIndex }` y MapScene lo
ejecuta como guion con `runFieldAction(ctx, action)`: **Cuerda Huida** (`ESCAPEROPE`) → confirma y lleva a
`state.healPoint` (objeto clave en Añil: no se gasta), **Libreta de pistas** (`CLUENOTEBOOK`) → `ui.openClues()`,
**Pokédex** (`POKEDEXAXIS`) → `ui.openPokedex()`; movimientos: Teletransporte/Excavar (= Cuerda Huida),
Dulce Aroma (encuentro si hay tabla), Destello (amplía la luz en mapas `dark`), Amortiguador/Batido (ceden PS).
Otros → «Aquí no se puede usar.». Añadir un objeto: `registerFieldItem('ID', async (ctx, id) => bool)`.
**Repelente**: `state.startRepel` al usarlo; `World` descuenta un paso por paso (no en hielo), bloquea salvajes de
nivel < al del primer Pokémon y al agotarse avisa y ofrece usar otro (`repelWoreOff`).
**Nadar y agua** (`world/waterAccess.js`, puro): A mirando al agua ofrece nadar (`swimHook`) solo si `canOfferSwim(world)`:
agua navegable que no se pisa y sin tile Bridge encima (el agua bajo un tablero no cuenta), casilla actual que deja
salir hacia ella (Essentials) y nunca desde un puente (`world.bridge` > 0, tile con tag Bridge o pasarela sin tag:
`isOnBridge`, franja de ≤ 5 casillas entre agua cuyos dos extremos llegan a tierra; un embarcadero con la punta en el
agua sí deja nadar). La aparición (`nearestFreeSpot(map, x, y, { canSwim })`, warps y `?x=&y=`) solo acepta agua con
la capacidad `swim`: sin Nadar se busca tierra y el jugador nunca aparece nadando.

## 6b. Historia transversal (propietario: story)

Sistemas narrativos de toda la campaña (CAMPANA §1.7, §3.0, §3.1; TABLILLAS.md). Datos y lógica PUROS en
`content/story/` (sin DOM ni motor: se prueban con `node --test`); la presentación (`storyFx.js`) se carga bajo demanda.

**Datos** (`content/story/`):
- `clues.js` — `CLUE_ARCS` T01–T15: `{ id, title, tablet, place, zone (id de mapa: anillo del mapa regional), block,
  opens: { block, by, flag|null }, available: { label, flag: 'pN_restored' }, abilities[], queueUntil: { ability }|null,
  after, night, steps: [{ label, by, text }×2], closes: { tablet } }`. `MAX_ACTIVE_CLUES = 3`, `ZYGARDE_LINES`.
- `tablets.js` — `TABLETS` (18 = 17 tablas de tipo + `LEGENDPLATE`; **sin `BLANKPLATE`**): `{ id, name, type, arc,
  chronicle, place, block, arceusPhase }`; `CAMPAIGN_TABLETS` (15), `ARCEUS_TABLETS` (3), `missingCampaignTablets(state)`,
  `hasAllCampaignTablets(state)` (Puerta de las Quince).
- `chronicle.js` — `CHRONICLE` I–XV y `ARCEUS_CHRONICLE`; `chronicleFor(tabletId)`; se desbloquea con `state.tablets`.
- `verses.js` — `VERSES` I–X `{ n, numeral, pillarName, text, readBy, effect, keep }` y `CONFIRMATION`; `unownText`,
  `partialTranslation`, `verseTranslation(verse, full)`; traducción total con `GLYPHKEY`. Flags `verse_<n>`, `verse_confirmation`.
- `fragments.js` — `FRAGMENTS` 1–10 `{ id: 'F01'…, flag: 'pN_restored', name, place, keeper, tint (kit de Pilar),
  localEffect }`; `highestRestoredPillar(state)`, `hasFragment(state, n)`.
- `crisis.js` — fases 0–4 + 5 (cielo restablecido, flag `game_cleared`): 1 desde P3, 2 desde P6, 3 desde P8, 4 desde P10.
  `crisisPhase(state)` (var `crisis_phase` la fuerza), `crisisLayer(fase)`, `crisisTone`.

**Estado de las pistas** (`clueLogic.js`): cada pista de arco es una entrada de `state.clues`
`{ id, text, solved, status: 'active'|'queued'|'solved', step: 1|2, seen, order }` (se modifica con el nuevo
`GameState.updateClue(id, patch)`, inmutable). Máximo 3 activas; el resto en cola por orden de apertura; T11/T12
esperan a Nadar; el descubrimiento directo supera el límite. Las notas sueltas de `state.addClue` no ocupan hueco.
`clueZones(state)` → `[{ id, zone, place }]` (segundas pistas activas) para el mapa regional; `syncClueSchedule(state)`
abre las pistas cuyo hito (`opens.flag`) ya pasó.

**API para guiones** (`content/story/api.js`; en los guiones como `ctx.story.*`, o importando las funciones con ctx primero):
```js
await ctx.story.openClue('T01', { direct, silent })  → 'active'|'queued'|'solved'   (aviso «Nueva pista en la Libreta»)
await ctx.story.advanceClue('T01', 2)                 // segunda pista (la activa aunque estuviera en cola)
await ctx.story.closeClue('T01')                      // resuelve y deja pasar la siguiente de la cola
await ctx.story.giveTablet('MEADOWPLATE')             // mochila + state.addTablet + animación + Crónica + cierra su arco
await ctx.story.revealVerse(3 | 'confirmation')       // placa Unown (Fonts/Annon.ttf), traducción parcial/total
await ctx.story.restorePillar(n, { core: {x, y}, onRestored: async (ctx, fragmento) => {}, requirePrevious = true,
  showVerse = true, bgmAfter, force })                // «Pilar restaurado» → true | false
await ctx.story.forgeAzureFlute()                     // los diez Fragmentos → AZUREFLUTE (B20)
ctx.story.setCrisisPhase(3 | null)   ctx.story.crisisPhase()   ctx.story.clueStatus('T02')   ctx.story.refreshClues()
```
`restorePillar`: jingle `VinculoSupremo` → brillo del núcleo (`softLight` con el tinte del Pilar, destello, temblor) →
Fragmento Azur n (`state.addFragment('F0n')` y contador del objeto `AZUREFRAGMENT`) → verso n → flag `pN_restored` →
`opts.onRestored` (efecto local) → `LeyendaPrisma`. Cadena de resonancia: sin el Fragmento n−1 el núcleo no responde.

**Libreta** (`ui/screens/clues.js`, `ui.openClues({ tab: 'clues'|'prophecy'|'chronicle'|'tablets'|'journal'|'cells' })`):
pestañas Pistas (abiertas n/3 con «¡Nuevo!», en espera, notas, resueltas; frase de Zygarde si falta una capacidad),
Profecía, Crónica, Tablillas (18 casillas), **Diario** (hitos vividos: una entrada genérica por etapa completada —flag de
salida de cada bloque de CAMPANA, `content/story/journal.js#JOURNAL_BLOCKS`— y por Pilar restaurado, con lugar, Fragmento
y efecto local de `fragments.js`) y **Células** (mapas visitados con células: encontradas/total y dónde estaban las ya
recogidas, de `content/zygarde/cells.js`). Q/E cambian de pestaña. Vista pura en `content/story/notebook.js`
(`journalRows`, `cellRows`, `tabCounter`). Las segundas pistas activas dibujan un aro azul en el mapa regional
(`clueZones` → `ui/logic/regionMapData.js#clueRings`).

**Cielo de crisis** (`content/story/crisisSky.js`): MapScene lo sincroniza cada fotograma en mapas `outdoor` (un mapa
se excluye con `crisis: false`): tono propio de la fase sumado al de día/noche, aurora + luna + grietas (fase 3), luna
(fase 4), atardeceres largos (fase 2), tormentas secas (fase 1) y temblores nocturnos (fase 0, solo tras
`b01_left_town`). Probar: `?scene=map&map=dev_story&vars=crisis_phase:3&time=23`.

**Descanso** (`world/rest.js`): `await ctx.rest({ kind: 'home'|'bed'|'center'|'inn'|'camp', storm, heal = true,
message, mode, slot })` → `{ rested, mode, slot }`. «Descansar» elige Mañana (8:00) / Tarde (15:00) / Noche (21:00);
«Dormir profundamente» solo en `home` (despierta a las 8:00 y prueba los ganchos `registerDreamHook(async ctx => bool)`,
con la pantalla en negro); «Descansar hasta tormenta» solo en `inn` con `storm: true` (3 h de juego de clima `storm`
en exteriores: `stormActive(state)`, `stormWeather(state, def)` que consulta MapScene). Cada descanso cura, suma la
var `rest_count` y llama a `registerRestHook((ctx, { mode, kind }) => …)` (reaparición de Alfas y legendarios).

**Transporte** (`world/transport.js`): `TRAIN` (tras `p4_restored`; Caudal, Brontia, Estrato, Lúmina, Nexo; cada
estación se activa al usarla — flag `train_station_<id>` — o al visitar su mapa) y `FERRY` (tras `p7_restored`;
Nexo ↔ Caleta Sonda, Nexo ↔ Villa Boreal). En el mapa de la estación: `stationEvent({ id, x, y, station: 'caudal' })`,
`portEvent({ id, x, y, port: 'nexo' })` o `takeTrain(ctx, 'caudal')` / `takeFerry(ctx, 'nexo')` /
`takeTransport(ctx, from, { network })`. Llegada: `arrival: { x, y, dir }` de cada parada (null = `start` del mapa;
quien construya el mapa rellena sus coordenadas en `TRAIN`/`FERRY`). Tarjeta de viaje con fundido.

**Fuentes** (`ui/core/text.js`): `font: 'unown'` (Annon; cargar antes con `ensureUnownFont()` de `storyFx.js`) y
`font: 'note'` (Power Green Small ×2, como `small`). Las Power Green se rasterizan a su tamaño nativo (`grid`: 12 px,
Small 9 px; muestreo a 4× para esquivar el difuminado horizontal del navegador) y se amplían por vecino más cercano
a escala ENTERA (`system`/`narrow` ×2, `small`/`note` ×2, `tiny` = Power Green ×1, `big` ×4). Los glifos rotos del TTF
(m, w, M, W, «…», la «l» de Small) y las rayas — – que faltan se dibujan con `ui/core/glyphPatches.js`; los caracteres
que no tiene la fuente caen a una genérica. Test: `tests/ui_glyphs.test.mjs`.
**Mapa de prueba**: `?scene=map&map=dev_story&debug` (pistas, Tablillas, Pilar, cielo, Clave Glífica, descanso, tren y ferri).

## 7. Combate

Desde el mapa: `world/battleFlow.js#runBattle(scene, request)` (lo usan `ctx.battle/wildBattle`): destellos +
transición, `battle(request)` de **`battle/api.js`** (implementación instalada por `battle/scene` con
`installBattle(fn)`), aplica el resultado y, si pierde sin `canLose`, derrota → curación y `state.healPoint` sin volver
a mostrar el mapa del combate. El aviso «¡Estás fuera de combate!» (`BLACKOUT_TEXT`) sale una sola vez: lo da el motor
(resultado `blackedOut: true`) y el mapa solo lo repite si faltó (`results.js#whiteoutText`). Espesura, Mar Llamas,
Torrente, Enjambre (y Sobrecarga de Añil) no muestran cartel ni mensaje, como en Essentials.
`request`: `{ type, trainer: id|def, opponent: { name, trainerType, party }, wild, format, rules, canLose, bgm,
transition, battleback, environment, weather (del mapa: 'rain'…), time, cave, phases, seed }`.
Dobles con varios rivales y un aliado (B06, `battle/scene/setup.js`): `{ type: 'trainer', format: 'double',
trainers: ['id'|def, …], ally: { name, party: [spec…], skill } }` → un rival del motor por entrenador (un sprite de
combate por cada uno) y `config.ally`; el resultado solo devuelve el equipo del jugador (`allyParty` aparte).
Resultado: `{ outcome: 'win'|'lose'|'run'|'caught'|'forfeit', party?, caught?, stored?, canLose? }`.

Motor puro `battle/core` (sin DOM): `import { Battle, HeadlessBattleUI, normalizeConfig } from './battle/core/index.js'`,
`const result = await new Battle(config, ui).run()`.
`config` (`battleConfig.js`, `normalizeConfig` valida con mensajes claros): `{ db, type: 'wild'|'trainer', format:
'single'|'double', seed|rng, player: { name, id, party, bag, money, badges, megaRing, expAll, dexCaught,
caughtSpecies, hasPokedex }, ally?, opponent: {…}|[…] ({ name, trainerType, party, items, skill, baseMoney,
loseText, winText, megaRing, megaRingName }), rules: { canRun, canLose, canSwitch, expGain, moneyGain, canCatch, catchCondition(battle)→
{allowed, reason}, storageFull, … }, weather: 'None'|'Sun'|'Rain'|'Sandstorm'|'Hail'|…, terrain, environment,
time: 'day'|'night', battleback, phases, phaseTarget }`. Los equipos se clonan (la entrada no se modifica).
`ui` = interfaz **BattleUI** (`battleUI.js`, todo async). Obligatorios: `message(text, {brief, paused})`,
`chooseAction(battler, ctx)` → 'fight'|'bag'|'pokemon'|'run'|'cancel', `chooseMove(battler, moves, ctx)` →
`{index, mega}|null`, `chooseTarget(battler, move, candidates)` → índice|-1, `chooseSwitch({battler, reason,
canCancel, party})` → índice|-1, `chooseItem(battler, {bag, party, firstAction})` → `{item, target, move}|null`,
`confirm(text)` → bool, `learnMove(pokemon, moveId)` → 0..3|null. Opcionales (presentación): `start, abilitySplash,
animateMove, animateCommon, animateDamage, animateHP, animateStatus, animateStat, faint, switchOut, switchIn,
throwBall, expGain, levelUp, changeForm, refresh, end`. `HeadlessBattleUI({ script, confirm, learnMove })` para tests.
Presentación BW2 en `battle/scene/` (propietario: battle-scene). Aplicación del resultado: `battle/scene/results.js`.

**Textos del combate**: todos los `pbDisplay*`/`pbDisplayConfirm` pasan por `fixSpanish` = `shared/spanish.js#contractArticles`
(«de/a + el|El» → «del/al»: «Los PS del Nacli rival», «No afecta al Pidove salvaje»; no toca «él» ni tildes/eñes
vecinas); la escena lo aplica también a sus propios textos (`sceneUI.message/confirm`). Test: `tests/spanish_text.test.mjs`.
**Repartir Exp** (moderno, gen 6+): `EXPSHARE` es objeto clave (`items_axis.json`). `ui/logic/expShare.js` (puro):
`hasExpShare(state)`, `isExpShareOn(state)` (lo tiene y no existe el flag `exp_share_off`: al recibirlo queda activado),
`toggleExpShare(state)` → bool, `expShareMessage(on)`, `expShareLabel(state, id)` ('ON'|'OFF' en la lista de la Mochila).
«Usar» en la Mochila lo activa/desactiva (`ui/screens/bagUse.js`); `battle/scene/setup.js` rellena `player.expAll` y el
motor (`battleExp.js`) da a los Pokémon capaces que no participan el 50 % de la experiencia, con un único aviso «¡Tus otros
Pokémon también ganaron puntos de experiencia!». Test: `tests/battle_exp_share.test.mjs`.

## 7b. Interfaz (`src/ui`)

Todo a través de `import { ui } from '../ui/api.js'` (en Node sin DOM es un stub que resuelve al instante):
```js
await ui.message(texto, { speaker, telepathy, auto, keepOpen, skin, position, se })   ui.closeMessage()
await ui.choice(items, { message, cancel, index, x, y })   await ui.confirm(texto)   await ui.number({ min, max, initial, message })
await ui.textEntry({ title, initial, maxLength, iconSpecies, gender })
await ui.openPauseMenu()   await ui.openParty({ mode: 'view'|'select'|'switch', message, filter, annotations })
await ui.openBag({ mode: 'field'|'battle'|'select', filter, message }) → itemId|null
await ui.openSummary(pokemon, { party, index, page })   await ui.openPokedex({ species })   await ui.openClues()
await ui.openShop(items, { mode, greeting })   await ui.openStorage()   await ui.openSave() → bool   await ui.openLoad() → GameState|null
await ui.openOptions()   await ui.openTrainerCard()   await ui.openZygarde()   await ui.openRegionMap({ fly })
ui.showLocation(nombre)   ui.toast(texto)   await ui.learnMove(pokemon, moveId) → índice|null   await ui.evolve(pokemon, especie) → bool
```
- Códigos de texto (en JS con doble barra): `\n \f \PN (jugador) \PM (dinero) \v[k] \c[n] \b \r \. \| \wt[n] \wtnp[n] \^ \se[x]`.
- Pantallas = escenas apiladas (`ScreenScene` con fundido; diálogos = `UIScene` transparentes).
- Opciones: `ui/core/options.js` (`currentOptions`, `setOption` → `state.setOption`; sin partida, `localStorage`).
- Iconos de objeto: `ui/core/widgets.js#drawItemIcon` (respeta `item.icon`; cae a `assets/items/`, al id y a `000`).
- Componentes para otras pantallas: `ui/core/text.js` (`drawText`, `wrapLines`), `windowskin.js` (`drawWindow`),
  `widgets.js`, `pokemonGfx.js`, `message/messageBox.js`. Lógica pura probada en `tests/ui_*.test.mjs`.

## 7c. Audio (`engine.audio`, `src/audio`)

```js
engine.audio.playBGM(nombre, { volume, pitch, fadeIn, fadeOutPrevious, restart, position })  // no reinicia la misma pista
engine.audio.stopBGM(frames)  pushBGM()  resumeBGM(frames)      // combates: guardar/restaurar la música
await engine.audio.playME(nombre)   // fanfarria: pausa la música y la reanuda
engine.audio.playSE(nombre, { volume, pitch })  playCry(especie|pokemon, forma, { faint })  playCoreSignal()
engine.audio.setVolume('bgm'|'se'|'me'|'cry', v)  stopAll()  nowPlaying()  debugState()
```
Nombres semánticos en `audio/catalog.js` (**todas las BGM son provisionales, X04**): BGM `title, town_start, town,
route, forest, cave, ruins, lab, pokecenter, genesis_base, prologue, tension, distortion, battle_wild,
battle_trainer, battle_rival, battle_genesis, battle_boss, battle_legendary, victory_*`…; ME `item_get,
key_item_get, pokemon_get, heal, save, capture, evolution_*`…; SE `cursor, decision, cancel, buzzer, menu_open,
door_enter, door_exit, bump, jump, exclaim, repel, use_item, core_signal`…. Cualquier otro nombre = archivo de
Añil sin extensión (`'Door enter'`, `'Anim/Fire1'`). Los volúmenes siguen `state.options`. Jukebox: `?scene=audio`.

## 7d. Render y efectos (`src/render`)

MapScene compone: `WorldView` (tilemaps + personajes + globos) → `Compositor` (tono día/noche + clima + `def.tone`,
oscuridad con luces) → efectos luminosos → pasada final (destello, fundido, transiciones).
- **Efectos** (`ctx.effect(nombre, opts)` → `{ remove(frames), object, set(opts) }`; x/y en casillas):
  `zygardeCell {x, y, size, color}`, `cracks {x, y, length, branches, seed, color}`, `zygardeRebuild {tiles}`,
  `softLight {x, y, radius, pulse, intensity, color}`, `visionCone {event, reach, width, color}`,
  `aurora {color}`, `moon {x, y, radius (px de pantalla), color}`. Comunes: `alpha`, `fadeIn`.
- **Clima** (`ctx.weather`): `none rain storm heavyRain snow blizzard sandstorm fog sun`, potencia 0–9.
- **Transiciones** (`ctx.transition`, quedan en negro hasta `scene.fx.clearTransition()`): `fade snakeSquares
  diagonalBubbleTL diagonalBubbleBR risingSplash bars spinBall mosaic zoomIn shrinkingPieces iris`.
- Emociones: `! ? … ♪ ♥`. Día/noche: `render/dayNight.js` (reloj de juego, 1 min por segundo real, provisional TEC-06).
- **Costuras entre mapas conectados** (`world/seams.js`, puro): la cámara no se limita por los lados con conexión, así
  que junto a un vecino de otro tamaño o desplazado quedaban casillas sin mapa (franjas negras). `planSeams(entries)`
  rellena cada casilla vacía que la cámara puede enseñar (`cameraReach`: margen 9×7 por los lados abiertos) repitiendo
  el borde (periodo 2) del mapa cargado más cercano (empate por id: no cambia al cruzar); `WorldView.syncSeams` lo
  rehace al cambiar el mapa actual, los vecinos o sus desplazamientos y `TilemapView.setSeamFill` lo dibuja en una
  malla bajo el suelo de todos los mapas (`SEAM_ORDER`). Solo decorado (no se pisa); mapas sin conexiones, sin relleno.
  Test: `tests/world_seams.test.mjs` (ninguna casilla visible vacía en los mapas conectados de B01–B06).
- Recursos: tilesets y texturas cacheadas globalmente; al cambiar de mapa se liberan geometrías/materiales de
  tilemaps, sprites, partículas de clima y efectos (verificado con `tools/perf_map.mjs`: 0 fugas en 20 warps).
  Rendimiento medido (mapa 120×120 con 40 NPC, headless): lógica ≈0,1 ms/frame, dibujo ≈0,6 ms/frame (CPU).

## 7e. Servicios de pueblo, pesca y atlas (propietario: services)

Todo se importa desde `content/services/index.js` (módulos puros salvo los guiones, que usan `ctx`).

**Catálogo de mapas por zona** (`content/services/zones.js`, CAMPANA §1.3–1.8, música y fondos TÉCNICO X04/X20):
```js
export default { id: 'ruta_4', ...zoneDefaults('ruta_4'), tileset: 1, … }   // { name, bgm, battleback } (sin nulls)
mapInfo(id) → { id, place, name, bgm, battleback } | null    mapDisplayName(id)    mapPlace(id) → id de lugar del atlas
```
Cubre todos los ids de mapa de CAMPANA (test) y resuelve interiores por prefijo (`zaguan_centro`, `caudal_tienda` →
población). `ui/core/mapNames.js#mapName` lo usa como respaldo del `name` de la definición.

**Centro Pokémon** (`services/pokecenter.js`, tileset 4 con `mostrador_centro` y `pc_centro` + piezas `svc_*` en línea):
```js
// content/maps/<bloque>/zaguan_centro.js
export default pokemonCenterMap({ id: 'zaguan_centro', exit: { map: 'villa_zaguan', x: 20, y: 15 } });
// opts: name, bgm ('pokecenter'), shop: false | { list, items, extra, remove, greeting, prices }, pc: false,
//       rest: false, nurseSprite ('enfermera'), clerkSprite ('tendero'), events: [...]
// en el exterior: { x, y, to: 'zaguan_centro', ...CENTER_ENTRY, door: true }
```
Interior 19×14 (`CENTER_LAYOUT`): enfermera (9,5), casilla de cura (9,7) mirando arriba, máquina con las Poké Balls
de Añil (`Healing balls 1/2`, una por Pokémon, parpadean con el ME `heal`), PC (14–15,5), mostrador de tienda con
dependiente (13,11), rincón de descanso (X25) y salida de 3 casillas (8–10,12). Curar = `ctx.heal()` +
`ctx.setHealPoint(9, 7, 8)`. Piezas sueltas para Centros con otro diseño: `nurseEvent(opts)`,
`pokemonCenterHeal(ctx, { machine, healPoint })`, `playHealMachine(ctx, { x, y, offsetX, count, onHeal })`,
`pcEvents(x, y)`, `buildCenter(b)`.

**Tiendas** (`services/shop.js`): `STOCK_TABLES` (`general`, `balls`, `fishing`; tramos por Pilares restaurados
`p1_restored`…, TÉCNICO provisional). `shopStock(state, { list, items, extra, remove })`,
`clerkEvent({ x, y, dir, list, extra, greeting, prices })`, `openMart(ctx, opts)` y el interior
`shopMap({ id, exit, list, extra, bgm })` (15×12, dependiente en (9,8), `SHOP_LAYOUT`).

**Posada y descanso** (`services/inn.js`, delega en `ctx.rest` de `world/rest.js`): `innkeeperEvent({ x, y, price,
storm })` («Descansar hasta tormenta» solo con `storm: true`), `restSpotEvent(id, x, y, { kind: 'center'|'camp' })`.

**Tutor y Recordador** (`services/moveTeaching.js`): `moveTutorEvent({ x, y, moves: ['FIREPUNCH', { move, cost }],
cost: { money } | { item, count } })`, `moveReminderEvent({ x, y, cost })`; puros `tutorCanLearn`,
`relearnableMoves`, `costLabel`, `teachMove(ctx, índice, mov)`.

**Pesca** (`world/fishing.js`, registrada en `fieldActions`): OLDROD/GOODROD/SUPERROD desde la Mochila mirando a agua
con `canFish`. Tablas del mapa en el formato de encuentros: `encounters: { fish_old: [[peso,'ESPECIE',min,max]…],
fish_good, fish_super }` (admiten `fish_oldNight`…). Essentials: pica con 20+25×caña % (×1,5 Viscosidad/Ventosas),
5–10 puntos de espera, «¡Algo ha picado!» y ½–1 s para pulsar A; pulsar antes o no tener tabla → «Parece que no
pican…». Animación: hoja `protagonista_<m|f>_fish_offset` si existe en `content/characters.js`; si no, caña, sedal y
boya provisionales dibujados con Three.js. API pura: `biteChance`, `rollFishing(rng, …)`, `fishingSpot(world)`,
`fishingType(encounters, rod, hora)`.

**Atlas y mapa regional** (`ui/logic/regionMapData.js`; pantalla `ui/screens/regionMap.js`):
`REGION_MAP = { terrain[20×30], grid, places, points (alias), roads, seaRoads, rivers }`. Lugares en las casillas de la
ilustración `game/assets/ui/region_map.png` (+ `region_map.json`, agente de arte; test de coincidencia) con
`links` direccionales de las tablas de CAMPANA (test de simetría), `pillar(s)`, `parent`, `fly`, `flyUnlock`,
`mapIds`, `flyTo: { map }`. Funciones: `pointAt`, `pointForMap`, `canFlyTo(lugar, flyPoints, visited)`,
`flyDestinations(state)`, `resolveFlyTarget(idLugar, loadMapDefinition)` → `{ mapId, x, y, dir }` (usa
**`flyPoint: { x, y, dir }` de la definición del mapa** del pueblo, o su `start`), `registerRegionMarks(fn)`.
`ui.openRegionMap({ fly: true })` devuelve el id del lugar elegido (solo visitados o desbloqueados); las marcas de
células salen de `world/zygarde/detection.js#regionPointMarks`. Sin la ilustración se dibuja una versión
provisional con los mismos datos. Prueba: `?scene=map&map=dev_services&debug` (Centro, tienda, lago con las tres
cañas, tutor, recordador, posadero y cartógrafa con el mapa y el Vuelo).

## 7f. Sistema de campo de Zygarde (propietario: zygarde)

CAMPANA §2 (D10) y biblia §8. Datos en `content/zygarde/`, lógica en `world/zygarde/`, pantalla `ui/screens/zygarde.js`.

**Datos** (puros):
- `content/zygarde/cells.js`: `CELLS` (100: `{ id: 'C001', key: 'cell_villa_alba_1', map, area, stage 'A'–'H', where,
  required, scripted }`), `cellByKey`, `cellById`, `cellsOnMap`, `stageCounts`, `CELL_MAPS`. **La clave `key` es lo que
  se guarda** (`state.addCell(key)`) y el `cell` del evento. `map` = id PREVISTO: si un bloque crea el mapa con otro id,
  se corrige aquí (lo vigila `tests/zygarde_content.test.mjs`). Las `scripted` (C009, C029–C032) se dan por guion.
- `content/zygarde/thresholds.js`: `CAPABILITIES` (§2.1: `{ key, name, short, form, cells, cores, milestone, requires,
  hint }`), `FORMS`/`FORM_ORDER` (`core`, `'10'`, `'50'`, `complete`), `STAGES`, `CORES` (N1–N5 con requisitos y lo que
  desbloquean), `PILLARS`, `TIMELINE`, `MILESTONES`, `FORM_FLAGS` (`zyg_10`, `zyg_50`, `zyg_complete`), `coreFlag(id)`
  (`zyg_core_2`…). Claves: `run ram terrain climb swim detect dive fly rebuild jump anchor`.
- Hitos (flags): `run` → `p1_restored` · `climb` → `p5_restored` · `dive` → **`b13_dive_resonance`** (nombre técnico
  para la resonancia del muelle de buzos) · `complete` (Vuelo + Reconstrucción) → `p8_restored` · `jump` →
  `p10_restored` · `anchor` → `game_cleared`.
- `content/zygarde/texts.js`: líneas de «recuerdo» (telepatía sobria), `missingPartsLine(n)` («Me faltan dos partes.»),
  textos de obstáculos sin cifras (`FIELD_TEXT`).

**Progresión** (`world/zygarde/progression.js`, puro; `scenes.js` con `ctx`):
```js
capabilityStatus(state, key) → { unlocked, eligible, cellsMissing, coresMissing, milestoneMet, requiresMet }
pendingCapabilities(state) → ['run', …]   missingParts(state, key)   unlockedForms(state)   naturalForm(state)
applyUnlock(state, key) → { changed, formChanged }   joinCore(state, 'N2')   canChooseForm(state, form)   zygardeSummary(state)
// Guiones de bloque:
await checkZygardeProgress(ctx, { scenes = true })   // activa lo que ya se cumple (escena corta genérica); la llama sola zygardeCell
await reachMilestone(ctx, 'run' | 'climb' | 'dive' | 'complete' | 'jump' | 'anchor')  // flag + activa o «Me faltan N partes.»
await grantCore(ctx, 'N2', { scenes })   await unlockCapability(ctx, key, { scene })   await remindMissing(ctx)
```
Una escena de bloque con su propio guion (N2 en el Colector, puente del P8…) llama a `grantCore`/`reachMilestone` con
`{ scenes: false }`. El Core, al hablarle, recuerda las partes que faltan si hay un hito esperando.
`GameState` (añadido): `zygardeForm`, `setZygardeForm(null|'core'|'10'|'50'|'complete')`, `cellCount()`.

**Montura** (`world/zygarde/mount.js`): tecla **R (E)** monta/desmonta el 10 % (exteriores y cuevas; `mount: false`
o `noMount` lo prohíben); montado + Mayús = galope a velocidad 5.5 (el doble que la carrera humana, 4.5; hook
`world.runSpeed`). Nadando o en mapas `underwater` se muestra el 50 %. Arte: `<protagonista>_ride10`, `_ride50` y, bajo el
agua, `_dive` (content/characters.js); sin arte, fallback con el seguidor de Añil bajo el jugador (Character extra en
`world.extraCharacters`, que WorldView dibuja). Consultas: `isRiding(world)`, `isMounted(world, form)`, `mountForm`,
`playerWeight(world)` (1 a pie, 3 montado: puzles de peso de B08), `setRiding(world, on)`, `canRide(world)`.

**Tipos de evento** (`world/zygarde/eventTypes.js`, registrados en `world/eventTypes.js`, sustituyen a los básicos):
| type | propiedades |
|---|---|
| `zygardeCell` | `cell` (clave), `text`, `onFound`, `when`, `sprite` (por defecto `zygarde_celula`, que flota con pulso; `''` lo quita) dentro de un brillo hexagonal (`size` 88, `alpha` 0.4); al recogerla comprueba la progresión |
| `ramRock` | `kind`: `'rock'` o `'log'`, `group` (se rompen juntos), `sprite`/`tileId`; fisura blanca con brillo verde |
| `roughTerrain` | `kind`: `'mud'`, `'sand'` o `'snow'`; `mounted` (además montado); a pie el jugador se hunde un poco |
| `gravelSlope` | cuesta de grava: solo montado en el 10 % (ofrece montar) |
| `climbWall` | `to: [x, y]`, `down`, `h` (alto de las vetas); anima la subida/bajada (`<protagonista>_climb` si existe) |
| `diveSpot` | `to, tx, ty, dir`; `surface: true` = salida del fondo |
| `diveVent` | respiradero verde / `kind: 'bolsa'`: recarga la burbuja y es el punto de regreso |
| `diveCurrent` | `dir`, `length`: corriente que empuja |
| `rebuildGap` | `tiles: [[x, y, capa, id]…]` en un zócalo hexagonal; las piedras suben y quedan (self switch A + patch). Aditivo B16: `flag` (estado global compartido por varios zócalos del mismo hueco, en vez del self switch), `when(state, ev)` (el zócalo aparece solo si se cumple), `tutorial` (`true` → `FIELD_TEXT.rebuildTutorial` o lista de líneas telepáticas; se dice la primera vez que se reconstruye con tutorial y marca `REBUILD_TUTORIAL_FLAG` = `zyg_rebuild_tutorial`), `onRebuilt(ctx)`, `blockedText`/`askText`/`doneText` (§17) |

`zygardeArea(type, prefijo, x, y, w, h, extra)` crea un evento por casilla (barro, arena, nieve, grava).

**Buceo** (`dive.js`): mapa con `underwater: { shallow: [[x, y, w, h]…] }` (+ `dark`). Medidor de 8 segmentos en el
HUD; pierde uno cada 5 s en lo profundo; al agotarse, fundido y regreso al último respiradero sin daño. Luz radio 3
(5 con Destello en el equipo). **Detección** (`detection.js`): latido (sonido y anillo) del Core/10 % a ≤ 10 casillas de
una célula; rótulo «Células: n/m» al entrar en un mapa con células; con `detect`, flecha verde hacia la célula más
cercana; `regionCellMarks(state)` / `regionPointMarks(state, points)` para el mapa regional (visitados; en la crisis del
P8, todos). **Acciones** (`actions.js`): `flyWithZygarde(ctx)` (usa `ui.openRegionMap({ fly: true })` y
`resolveFlyTarget` de services; disgregación en hexágonos y tira `<protagonista>_vuelo`), `changeForm(ctx, form)`,
`convergenceJump(ctx, { to, x, y, dir, frames = 1500 })` (B21: 10 % deliberado, estelas; saltable con A/B desde la
segunda vez, flag `zyg_jump_seen`), `spatialAnchor(ctx, { onAnchor })` + `canAnchor(state, def)` (postgame, mapas con
`anchorZone: true`), `ramBreak`, `climbWall`, `rebuildStones`, `diveDown`, `surfaceUp`.

**Pantalla y Arca**: `ui.openZygarde()` (desde el menú de pausa o usando el Arca `ZYGARDECUBE` en la Mochila) muestra
forma, células, núcleos, formas (con el Arca se cambia entre las desbloqueadas) y capacidades con iconos, sin umbrales.
Devuelve `{ type: 'zygarde', action: 'fly' | 'formChanged' }`, que el mapa ejecuta (`registerFieldAction` en
`world/fieldActions.js`).

**Integración** (aditiva): MapScene crea `scene.zygarde = new ZygardeField(scene)` (`world/zygarde/field.js`) y lo llama en
`enter/enterMap/onConnectionCrossed/refreshFollower/update/updateWhilePaused/drawUI/exit`; efectos Three.js propios
registrados con `registerEffect(name, factory)` de `render/effects.js` (`zygardeHexBurst`, `zygardeFissure`,
`zygardeVeins`, `zygardeSocket`, `zygardeWhirl`, `zygardeVent`, `zygardeCurrent`, `zygardeBubble`, `zygardeHeartbeat`,
`zygardeStrip`), utilizables con `ctx.effect(nombre, opts)`. Seguidor por forma en `content/companion.js`. Con Zygarde en
el equipo (B21, D21) `refreshFollower` no lo repite como Pokémon acompañante: camina como compañero de campo y sigue
el siguiente Pokémon capaz.

**Pruebas**: `tests/zygarde_{data,progress,field,content}.test.mjs` (invariantes 1–3 del grafo, umbrales, escenas,
montura, obstáculos, detección, Buceo, Vuelo). Mapas `dev_zygarde` (tileset 1: cresta con roca/troncos/grava, barro,
nieve, arena honda, pared, estanque con remolino, sima con zócalo, 3 células) y `dev_zygarde_fondo` (tileset 15).
Parámetros: `?zygarde=all|run,ram…` (adopta la forma natural), `?zform=core|10|50|complete`, `?zcells=N` (primeras N
del registro), `?zcores=N`, `?zmount=1`. Ej.: `?scene=map&map=dev_zygarde&zygarde=all&debug`.

## 8. Pokémon (objeto serializable, `battle/core/pokemon.js`)
```js
{ uid, species, form, nickname, level, exp, gender, nature, ability, abilityIndex, shiny, alpha,
  ivs{hp..}, evs{hp..}, moves:[{id, pp, ppUps}], hp, status, statusCount, heldItem, happiness,
  ball, ot:{name,id}, metMap, metLevel, obtainedMode }
```
Funciones puras: `createPokemon(db, species, level, opts)`, `calcStats`, `maxHP`, `displayName`, `healed`,
`expForLevel`, `withExp`, `withEVs`, `evolutionTarget`…

## 9. Desarrollo y pruebas

**Rutas** (`?scene=`): `title` (por defecto), `map`, `ui`, `audio`, `battle`, `sprites`, `boot`.
**Mapa**: `?scene=map&map=<id>&x=&y=&dir=&debug` y además `time=HH[:MM]`, `weather=rain[:7]`, `mode=visible|classic`,
`zygarde=all|ram,climb…`, `dark=1`, `through=1`, `noenc=1`, `fx=aurora,moon,cracks,cell`, `follower=0`,
`flags=a,b`, `vars=k:v,…`, `core=1`, `fragments=N` (Fragmentos Azur F01…F0N). Sin partida se crea una de prueba
(Pikachu nv 8).
**Teclas con `?debug`** en el mapa: T +1 h · Y clima siguiente · U oscuridad · G atravesar muros · N modo de
encuentros · B efectos de crisis · J transición de combate · K encuentro salvaje · L linterna. Consola:
`window.__map` (MapScene: `.state`, `.world`, `.runScript(fn)`, `.transfer(id, x, y)`), `window.__ui`.
**UI**: `?scene=ui&open=<prueba>&frame=<n>&speed=<0..3>`.

Pruebas:
- `npm test` → `node --test tests/` (datos, combate, mapas, estado, UI lógica) incluidos los de integración
  `tests/integration_{save,state,world,maps}.test.mjs` (guardado/migración, API de estado, repelente y acciones de
  campo, carga de todos los mapas registrados).
- Humo: `node tools/smoke.mjs --url="http://localhost:8080/?scene=…&debug" --name=n --keys="ArrowUp*3:200,KeyZ,snap"`
  (capturas en `tools/cache/screens/`, revisar con un visor).
- Flujos completos: `node tools/e2e_flows.mjs [saveload keepopen clues repel escape]`.
- Rendimiento/fugas: `node tools/perf_map.mjs [--map=<id>] [--seconds=5] [--warps=10]`.
- Cada bloque jugable se verifica dentro del juego antes de darse por terminado.

## 10. Bloque 1: cinemáticas, integración de combate, contenido y validación (propietario: b01)

### 10.1 Cinemáticas (`content/cutscenes`)
- **Director** (`director.js`, PURO): reloj de fotogramas propio. `await d.wait(n)`, `await d.tween(obj, { x: 100 }, n,
  'linear'|'in'|'out'|'inOut'|'back'|fn)`, `const stop = d.every((frame) => …)` (devolver `false` la quita),
  `d.caption(texto, { frames, fade, style: 'small'|'center' })`, `d.waitFor(promesa)`, `d.check()`, `d.cancel()` (todo lo
  pendiente y futuro rechaza con `CancelledError`; `isCancel(err)`), `d.stepsFor(acelerando)` (×`SPEED_UP` = 3).
- **CineOverlay** (`cineOverlay.js`): escena transparente encima de la escena filmada (escenario propio o MapScene):
  la actualiza 1 vez por fotograma (×3 manteniendo A), START salta si el Director es `skippable`, dibuja rótulos.
  `await stageScene(overlay, escena, params)` sustituye la pila y vuelve a poner el overlay encima;
  `untilFrame(pred, ms)` espera por fotogramas de pantalla.
- **Prólogo** (`prologue.js`): `await playPrologue({ skippable, from })` → `'done'|'skipped'|'error'` (nunca lanza; rueda
  con una partida provisional y termina en negro). Planos `SHOTS`: `p01` (Distorsión, `prologueP01.js`), `p02`–`p03`
  (`montana_portal` sobre MapScene, `prologueMountain.js`/`prologueBattle.js`), `montaje`, `p04` (victoria) y `final`
  (dispersión y pueblo, `prologueFinale.js`, escenario `prologueStage.js`: modos `distortion|sky|village|black`).
  Partículas y brillos en `cineGfx.js` (`target: { x, y, k, kill, minAge }`).
- **Dispersión P-04** (`prologueData.js`, PURO; CAMPANA §2.4): `CORE_TRAILS` = cinco estelas grandes N1–N5 (norte del
  pueblo, meseta del este, el propio aljibe, mar del sur, norte helado) con su `arc`; `resolveRegionPoints(atlas)` las
  sitúa con los lugares de `ui/logic/regionMapData.js` (`montana_portal`, `villa_alba`, `meseta_impulso`, `mar_del_sur`,
  `villa_boreal`) ajustadas a tierra/mar (`snapCell`); `landGrid(atlas)`/`terrainAt` admiten `terrain` (X02) y el
  formato antiguo `grid`; `coreLaunchVector(from, to, speed, arc)`. `regionCanvas.js` pinta el plano nocturno por tipo.
- **Rutas**: `?scene=prologue[&shot=p01|p02|p03|montaje|p04|final][&skip=1]` (al acabar vuelve al título) y
  `&full=1[&noprologue=1]` (flujo completo de partida nueva: `content/newgame.js#newGameFlow`). Prólogo visto =
  `localStorage['ecos.prologue_seen']` (START lo salta) + flag `prologue_seen`.

### 10.2 Resultado de combate y sprites de entrenador
- `battle(config)` (battle/api.js, con escena o sin DOM) devuelve SIEMPRE el resultado normalizado de
  `battle/scene/results.js#finalizeBattleResult`: `{ …motor, outcome, party, caught, stored, canLose, trainer? }`.
  El motor (`buildResult`) sigue entregando `playerParty`; `resultParty(r)` acepta ambos. `stored: true` = ya aplicado a
  la partida (escena real: equipo, dinero, mochila, vistos, capturas con mote y evoluciones); con `stored: false`
  `world/battleFlow.js` lo aplica con `applyBattleResult` + `storeCaught` de `caughtList(r)`. `applyBattleResult` nunca
  deja el equipo vacío. Las implementaciones de `installBattle(fn)` pueden devolver resultados crudos: battleFlow los
  normaliza. La derrota usa `state.healPoint`.
- Sprite del rival: `battle/scene/trainerSprites.js#resolveTrainerSprite(sprite, { anilUrl })` → `{ file, cols, source }`
  con `getBattleSprite` de `content/characters.js`: ids propios (`gael_front`, `guardiana_front`…), `anil:<clase>`
  (content/anilClasses.js), `anil:<ARCHIVO>` de Graphics/Trainers, charsets con `battle.front` (`gael` → `gael_front`),
  ruta `.png` o `Graphics/Trainers/<X>.png`. Si no carga: aviso y `anil:CHICO`.

### 10.3 Contenido del Bloque 1 (`content/maps/b01`, `content/events/b01*`; detalle en `maps/b01/README.md`)
- Elenco `CAST` (Agente Olmedo, familia Arenzana, Lía) en `events/b01_town_common.js`; `setHomeHealPoint(ctx)`.
- Células: `events/b01_cells.js` — `B01_CELLS [{ id, code, map, x, y, stage, required, where }]`, `cellsOf(map)`,
  `cellEvent(cell, { when })` (tipo `zygardeCell`: el tipo acepta `when(state, ev)` extra), `collectCell(ctx, id,
  { react })` (recoger desde un guion: texto «(n/100)», reacción del Core y `checkZygardeProgress`).
- C001: `events/b01_town_cell.js` (`parterreCellEvents()`, `parterreScene(ctx)`).
- Enlaces con bloques futuros: `maps/b01/pending_links.js` — `PENDING_LINKS` (`villa_zaguan` B02 sur, `ruta_10` B11
  oeste: offset, texto del aviso y lo que debe respetar el destino), `mapRegistered(id)`, `linkIfReady(id)` →
  conexión o null. La Ruta 1 abre el enlace sola cuando el mapa se registra.
- Arte del bloque: `node tools/b01_assets.mjs [--preview]` → `assets/objects/ventana_monte.png` (vista del Monte del
  Portal en la ventana de la habitación) y `assets/objects/tripode.png` (trípode del Consorcio).

### 10.4 Validación de contenido y recorrido E2E
- `node tools/validate_content.mjs [--quiet] [--json]` (sale con 1 si hay errores; API `validateContent()` →
  `{ report, stats, files }`, comprobaciones en `tools/validate_content_lib.mjs`): cada mapa construye y crea sus eventos;
  warps (destino registrado; el de ORIGEN se puede activar como en `world/world.js` —sin `dirTrigger`, alguna casilla
  vecina pisable desde la que pisarlo o empujarlo (puertas sobre muros); con `dirTrigger` 2/4/6/8, su casilla pisable—;
  la LLEGADA está dentro, pintada (una casilla sin tiles es el vacío), transitable con la altura de puente a 0 —si no,
  se aparece nadando o en otra casilla— y no encerrada: algún paso, warp vecino o borde con conexión); conexiones
  (destino, vuelta simétrica, algún paso por el borde y cada llegada al vecino pintada y no encerrada); llegadas de
  tren/ferri (`world/transport.js`), `start` y `flyPoint` con las mismas reglas. Avisos: evento sólido que tapa una
  llegada en todo momento de la historia (se evalúa con la partida nueva y con todos los flags/self switches), warp
  inalcanzable a pie/nadando desde las entradas conocidas del mapa y `dirTrigger` que corta un paso transitable al que
  se llega por otro lado (`reachableFrom`/`entrySeeds`: sobreaproximan —ignoran eventos, cuentan Nadar y puentes, los
  warps normales son sumideros— y siembran desde `start`, `flyPoint`, llegadas, conexiones, tren/ferri, `ctx.warp`
  literales y las vecinas de cada evento, para no dar falsos positivos). Además: eventos (ids, coordenadas, objetos,
  entrenadores, gráficos en disco); encuentros (species.json, pesos,
  niveles); entrenadores (equipos formables también dinámicos, especies, movimientos, objetos, sprite); guiones
  (giveItem/addKeyItem y entrenadores por id); células (claves, `content/zygarde/cells.js`, `B01_CELLS`; las pendientes
  de otros bloques salen como nota); flags leídos por `when()` en `maps/b01` que ningún guion pone (`EXTERNAL_FLAGS`
  documenta los que pone otro bloque). Lo ejecutan `tests/content_validate.test.mjs` y (warps y conexiones con mapas
  sintéticos) `tests/validate_warps.test.mjs`.
- `node tools/e2e_b01.mjs [--base=…] [--prologue] [--headed]`: el Bloque 1 completo con teclas reales (título →
  prólogo saltado o acelerado → «¿Quién eres?» → casa → laboratorio → señal → sigilo → Core → Gael → Pokédex → C001 →
  regalo de Mamá → Ruta 1 → cartel del Umbral), piloto automático en los combates (`installBattle` + `auto`),
  comprobación de flags y de la transcripción de diálogos por hito, capturas `tools/cache/screens/e2e_b01_*.png` y
  transcripción `e2e_b01_dialogos.txt`. Ayudantes en página: `tools/e2e_b01_page.mjs` (`window.__e2e`).

## 11. Arte provisional de la campaña (propietario: art; detalle en `docs/arte.md` §6–8)

Todo es **PROVISIONAL (D30)** y se regenera con `node tools/pixel_build.mjs [id…] [--preview] [--lineup]`
(fuentes en `tools/pixel_chars/`) y `node tools/pixel_map.mjs`. Tests: `tests/art_campaign.test.mjs`,
`tests/art_region_map.test.mjs` (+ `tests/characters.test.mjs`, que valida todo el registro).

**Registro** (`content/characters.js` + entradas de campaña en `content/characters_campaign.js`):
```js
getCharacter(id)            // también alias: 'casilda' → Guardiana, 'alerce' → profesor, 'ramon' → 'anil:capitan'…
getBattleSprite(id)         // 'leandro_front', 'casilda_front', 'anil:minero'…
playerVariant('M'|'F', v)   // v: run | ride10 | ride50 | dive | climb | fish | vuelo → id de hoja o null
getCharacter('protagonista_f').variants  // { run, ride10, ride50, dive, climb, fish, vuelo }
listAliases()               // { alias: destino }
```
- Tipos de hoja: `charset` (4×4; frames 64×64 o **96×96** en montura 10%, nado 50%, buceo y pesca), `battle_back`,
  `battle_front` (160×160) y **`effect`** (tira `cols × rows`: `protagonista_*_vuelo` 8×1 de 96×96, `zygarde_hex` 4×2
  de 32×32). Los charsets se anclan abajo-centro como cualquier otro (`render/charsets.js` deduce el frame de la imagen).
- La hoja de pesca se llama `protagonista_<m|f>_fish_offset`: por el nombre, `render/charsets.js` la dibuja 16 px más
  abajo (convención de Essentials) y `offsetY: 16` lo documenta en la entrada.
- `ride10` es la pareja completa (seguidor ZYGARDE_1 de Añil + jinete): mientras se monta basta con usarla como
  `characterName` y ocultar el seguidor; `ride50` sirve como `charsets.surf`. En las filas laterales la pareja no está
  centrada en su frame: la entrada lleva `anchorX: { 4, 6 }` (px) y `world/zygarde/mount.js` lo aplica como `xOffset`
  del jugador (`anchorOffsetX`), sin tocar el arte.
- Elenco con combate (`<id>` + `<id>_front`): leandro, abril, fermin, olvido, sol, vertice (+ `vertice_lider` con el
  mismo frontal), casia, garrido, genesis_tecnico, genesis_tecnica. Sin combate: genesis_investigador/a, enfermera,
  dependiente, molinero, buzo, archivista. Clases de Añil nuevas: `anil:minero`/`minera`, `anil:buceador`/`buceadora`.
- Visor: `?scene=sprites&char=<id>&mode=<walk|run|ride10|ride50|dive|climb|fish|vuelo>&battle`.

**Mapa regional**: `assets/ui/region_map.png` (480×320, solo relieve; la pantalla de services dibuja encima),
`assets/ui/region_map_marcado.png` (con caminos y marcadores) y `assets/ui/region_map.json`
(`coords: { id: [x, y] }`, `places: { id: { name, kind, xy, cell, mapIds, pillar(s)?, parent?, flyOnly? } }`,
`paths`, `seaPaths`); cada lugar en el centro de su casilla de 16 px.

## 12. Biblioteca de stamps para toda la campaña (propietario: stamps; catálogo en `docs/stamps.md`)

**Bibliotecas** (`loadStampLibrary(ts)`): 1, 2 (y 12–15), 3, 4, 5, **6** (ExteriorSafari), 7, **8** (InteriorLiga),
**9** (ExteriorPrisma), **11** (InteriorTorre). `docs/stamps.md` incluye la tabla «bioma de CAMPANA → tileset → piezas».

**Tiles propios (overlay)** — `content/stamps/extraTiles.js`: piezas que Añil no tiene, dibujadas por
`tools/stamps_extra.mjs` (+ `_art`, `_terrain`) en filas VACÍAS de los atlas `game/assets/tilesets/<Imagen>.png`, con su
pasabilidad/prioridad/terrain tag escritos en `game/data/tilesets.json` para todos los tilesets de esa imagen.
`npm run data` lo vuelve a aplicar tras extraer; `node tools/stamps_extra.mjs --check` (y un test) avisan si falta.
```js
EXTRA_PIECES[nombre]   // { w, h, kind: 'stamp'|'nine'|'pattern'|'line', layer, pass: ['x.'…], prio, tag, desc, tags }
EXTRA_LAYOUTS[imagen]  // { row, rows, pieces: { nombre: [col, fila] } }
extraTiles(imagen) → [{ id, name, dx, dy, passage, priority, terrain }]   extraDefs(imagen) → { stamps, brushes }
```
Las entradas del overlay llevan `extra: true` y `derive.js` no las hereda entre imágenes. `TERRAIN_PATCHES` corrige
terrain tags de Añil que la campaña necesita (orilla y playa de ExteriorSafari → agua navegable, como en Exterior1).

**Kit común de Pilar (X23)** — `content/stamps/pilar.js`. Mismos nombres `pilar_*` en 2/12–15, 11 y 8 (kit exterior
en 1 y 7): monolito, dintel, canal (`pilar_canal`/`_v`, brush línea), placa Unown, glifos, pedestal, columna(s),
escalinata(s), cámara de núcleo, zócalos (`pilar_zocalo`, `_gastado`, `_vivo`), losa de eco, aristas, manantial y
`pilar_enlosado` (brush nine). Tinte por Pilar = **tono del mapa** (`def.tone`, que el compositor suma a día/noche):
```js
import { PILAR_TINTS, PILAR_KIT, PILAR_KIT_EXTERIOR, PILAR_TILESETS, pilarTone } from '../stamps/pilar.js';
tone: pilarTone('P1')                         // P1 ocre … P10 oro; pilarTone(n, intensidad 0..1)
await ctx.tone(pilarTone('P6', 0.5), 30)      // cambio en guion
```
Sala de prueba: `?scene=map&map=dev_stamps&debug` (`vars=pilar:N` aplica el tinte N al entrar).

**Brushes nuevos**: `edge2` (`{ edge2: { src, fill? } }`, borde doble: playas con espuma) en `content/stamps/brushes.js`.
`world/mapBuilder.js#resolveBrush` (cambio aditivo) delega en `paintBrush` los `{ nine: 'ids' }` —antes el builder
los pintaba mal— y cualquier tipo que no conozca si hay pintor.

**Gráficos de evento de barreras** — `game/assets/objects/barreras.png` (`tools/stamps_objects.mjs`), charset 4×4 con
brillo animado: `dir 2` roca agrietada, `4` tronco agrietado, `6` vetas verdes de Trepar (superposición), `8` roca nevada.
```js
{ id: 'roca1', type: 'ramRock', x, y, sprite: 'asset:objects/barreras.png', dir: 2, directionFix: true, stepAnime: true }
{ id: 'pared1', type: 'climbWall', x, y, to: [x, y - 3], sprite: 'asset:objects/barreras.png', dir: 6, directionFix: true, stepAnime: true }
```
Herramientas: `tools/stamps_scan.mjs` (catálogo visual de objetos de un tileset), `tools/stamps_demo.mjs` (+
`stamps_demo_campaign.mjs`: kit y tintes, costa, nieve, oriental, sala solemne, ciudad, barreras). Tests:
`tests/stamps.test.mjs`, `tests/stamps_campaign.test.mjs`.

## 13. Bloque 6: Pilar del Impulso (propietario: b06; detalle en `content/maps/b06/README.md`)

- **Ráfagas y veletas** (reutilizables): reglas puras en `content/events/b06_wind_logic.js` (`settleWind`,
  `rotateDir`, `parseRoom` de salas ASCII y el solucionador `solveRoom`/`solvableWith` para tests) y eventos en
  `content/events/b06_wind.js`: `gustEvents(sala, ox, oy, { prefix, active, only })` (un evento `touch` por ráfaga,
  hoja `asset:objects/rafagas(_fuertes).png`; los sectores con veleta tienen 4 páginas por la var
  `b06_veleta_<sala>_<letra>`) y `vaneEvents(sala, ox, oy)`. Fuerza 1 se remonta montado, fuerza 2 nunca; si el viento
  choca o da la vuelta devuelve al jugador a la casilla de partida.
- Arte propio: `node tools/b06_assets.mjs` (ráfagas, veleta, esfera del Colector, aerogenerador, campana, hoguera).
- Combates de guion que se pueden perder sin pérdida (§2.6 de CAMPANA): `scriptedBattle(ctx, request, { x, y, dir })`
  reexportado por `content/events/b06_common.js` desde el helper común `content/common/bossBattle.js` (§6, «Combates de
  guion»: `canLose` + `noMoneyLoss`; al perder cura y devuelve a la casilla de reintento sin tocar `state.healPoint`).
  Alcanzabilidad a pie de los mapas del bloque: `tests/b06_reach.test.mjs`.
- Recorrido: `node tools/e2e_b06.mjs [--from=anillo|galerias|sala] [--no-retry]` (ayudantes en `tools/e2e_b06_page.mjs`).

## 14. Bloque 7: Ruta 6 y la Cantería Solano (propietario: b07; detalle en `content/maps/b07/README.md`)

- **Rescate estratigráfico** (reutilizable): reglas puras en `content/events/b07_strata_logic.js` —salas ASCII
  (`parseRoom`), `canBreak`/`supported` («una roca sostiene a las vecinas en cruz de una capa más alta»), solucionador
  `solveRoom` y `deadEnds` para tests— y salas en `content/events/b07_strata_rooms.js`. Eventos en
  `content/events/b07_galerias.js`: una roca por evento (hoja `asset:objects/b07_estratos.png`, fila = capa) cuya
  máscara de rotas vive en la var `b07_sala_<n>`; romper en mal orden → derrumbe, la sala vuelve a 0 y el jugador a
  su entrada. `resetRoomIfUnsolved(state, n)` al bajar a una sala.
- **Mega Aro**: `giveMegaRing(ctx)` de `content/events/b07_megaring.js` (objeto clave `MEGARING` con la presentación
  de `content/story/storyFx.js#openObtain`); `battle/scene/setup.js` ya lee el aro de la mochila (tecla E en combate).
- **Rutas de escena** (reutilizable): `stageRoute(ctx, ev, x, y)` / `terrainPath(map, …)` de
  `content/events/b07_path.js` llevan a un personaje de escena por el suelo (BFS sobre `gameMap.passable`, esquivando
  a la gente) en vez de la ruta en L que atraviesa acantilados.
- Arte propio: `node tools/b07_assets.mjs [--preview]`. Pruebas: `tests/b07_{strata,reach,content,staging}.test.mjs`.
  Recorrido: `node tools/e2e_b07.mjs [--from=canteria|galerias|herreria] [--no-retry]` (ayudantes en
  `tools/e2e_b07_page.mjs`: el piloto megaevoluciona en cuanto puede).

## 15. Bloque 11: Neblino, Ruta 10, el Monte y el regreso a casa (propietario: b11; detalle en `content/maps/b11/README.md`)

- **Huevos** (reutilizable, `world/eggs.js`): `createEgg(db, species, { ot, metMap, steps })` → Pokémon con
  `egg: true` y `eggSteps`; `addEggToParty(state, egg)` (sin registro en la Pokédex; `false` si el equipo está lleno);
  `stepPartyEggs` (puro). `mapScene.js#stepTaken` llama a `eggStep(scene)`, que descuenta un paso y lanza la escena de
  eclosión (`hatchEgg`: registro, grito, ME, mote opcional). Tests: `tests/b11_eggs.test.mjs`.
- **Guardería y crianza** (transversal, `world/daycare.js` + `content/services/daycare.js`): port de DayCare/EggGenerator
  de Essentials 21.1 con la configuración de Añil (gen 9: sin EXP al caminar, movimientos huevo compartidos entre dos de
  la misma especie, sin herencia de MT, bebé sin incienso). Puro: `depositPokemon/withdrawPokemon/compatibility/
  stepDaycare/generateEgg/collectEgg` (Lazo Destino, Piedra Eterna, objetos recios, Poké Ball de la familia,
  descendencia alternativa: Manaphy + Ditto → Phione). Estado en `state.daycare` (`setDaycare`); `mapScene.js#stepTaken`
  llama a `daycareStep(scene)` (cada 256 pasos, 20/50/70 % u 40/80/88 % con `OVALCHARM`). En un mapa:
  `daycareEvent({ x, y })` (encargada: dejar, recoger pagando `(niveles+1)×100`, «¿cómo están?» y entrega del Huevo;
  si el equipo está lleno, el Huevo espera). Tests: `tests/daycare*.test.mjs`.
- **Zonas de encuentros** (aditivo, `world/encounters.js`): un mapa puede declarar
  `encounterZones: [{ x0, y0, x1, y1, encounters }]`; `world.encountersAt(x, y)` elige la tabla de la zona (o la del
  mapa), y los encuentros visibles (`visibleEncounters.js#tablesAt`) usan la tabla de la casilla donde aparecen.
- **Sigilo con reloj** (T10): la dirección de cada centinela es función del fotograma (`b11_t10.js#sentinelDir`), lo
  que permite probar en `tests/b11_reach.test.mjs` que el paso es resoluble y planificarlo en el E2E.
- Combates de guion salvajes (Alfas): `wildBossBattle` de `content/events/b11_common.js` es el helper común
  `bossBattle` (§6: captura = superado, huida = nada que recuperar, derrota = curado y a la casilla de reintento con
  `loseText`). Arte propio: `node tools/b11_assets.mjs`.
- Detalles de mapa sin romper otras piezas (`content/maps/b11/paint.js`): `safeStamp`/`decorate` solo colocan un
  stamp sobre suelo despejado (sin sustituir árboles, troncos, caminos, orillas, hierba alta ni otras piezas) y fuera
  de las casillas reservadas; `fillGaps` rellena con piezas de 2×2 los huecos cortos que deja `forestFill`, que admite
  `maxRun` para partir las franjas largas de bosque en trozos de alturas variadas.
- Recorrido: `node tools/e2e_b11.mjs [--from=neblino|ruta10|villa|campamento|t09|cerro] [--only=<tramo>] [--no-retry]`
  (ayudantes en `tools/e2e_b11_page.mjs`).

## 16. Bloque 12: Pilar Invertido, espacio imposible 2D (propietario: b12; detalle en `content/maps/b12/README.md`)

- **Espacio imposible** (reutilizable; B20 reusa aristas y Anclas), `world/impossible/`: reglas puras en `logic.js`
  (`isVoidCell` = capas 0 y 1 vacías; `rotatePoint`/`rotateDir`/`twinPosition` para mapas gemelos girados 90°;
  `encodeAnchor`/`decodeAnchor` de la var `ancla_actual` = 'mapa|x|y|dir'; `inGaze`/`bridgeExists` de los puentes de
  la mirada; salas de dos orientaciones descritas con una rejilla física, `parseFacetRoom`/`facetMasks`, y el grafo
  `facetNeighbours`/`facetReach` para tests y solucionadores). Tipos de evento (`eventTypes.js`, registrados al final de
  `world/eventTypes.js`): `ancla` (poste: fija el punto seguro), `arista` (veta: gira la pantalla y carga `twin`),
  `puenteMirada`, `cascadaInvertida` (ascensor de un sentido; `open(state)`), `pulsador` (flag). Acciones
  (`actions.js`): `touchAnchor`, `fallToAnchor` (fundido, sin daño ni contador, vuelve al Ancla o a `fallback`),
  `turnToTwin`, `rideInvertedFall`.
- Un mapa lo activa con `impossible: { section, sectionMaps, spawn, fallFlag, onFirstFall, reach }`; `MapScene` crea
  `scene.impossible` (`field.js`, cambio aditivo): cada fotograma actualiza la opacidad de los puentes, detecta el giro
  encima de uno y el paso al vacío → caída. Al entrar por warp en otra sección, la llegada es el punto seguro. Sin
  salvajes sobre el vacío: `scene.impossible.overVoid()` corta el encuentro clásico del paso (hook `encountersEnabled`)
  y `VisibleEncounters#eligible` no hace aparecer ni caminar visibles por él.
- **Giro de pantalla** (`render/compositor.js#setRotation`, `render/screenFx.js#rotateTo(angle, frames, zoom)`): el
  pase final gira y escala la imagen; lo usan las aristas (90°) y el aljibe (media vuelta).
- **Panorama** (`render/panorama.js`, el «panorama» de RMXP): `def.panorama = { shader: 'distorsion' | image, parallax }`
  se dibuja detrás de los tilemaps y asoma por el vacío; `scene.panorama.silhouette({ url, from, to, frames, … })` cruza
  una silueta por el fondo (sombra de Giratina) y devuelve una promesa.
- `item` acepta `when` además de su self-switch. Los `trainer` aceptan `after` como función del estado.
- Tiles propios del Mundo Distorsión: `node tools/distortion_tiles.mjs [--check] [--preview]` (en `npm run data`,
  añade filas al atlas de Cueva1 y escribe `content/stamps/distortion.js`); arte: `node tools/b12_assets.mjs`.
- Pruebas: `tests/b12_{impossible,reach,content}.test.mjs`. Recorrido: `node tools/e2e_b12.mjs [--from=<tramo>]
  [--only=<tramo>]` (conductor `tools/e2e_b12_driver.mjs`; ayudantes `tools/e2e_b12_page.mjs` con planificadores de La
  Cara Vuelta y La Mirada).

## 17. Bloque 16: Pilar del Alma y la Forma Completa (propietario: b16; detalle en `content/maps/b16/README.md`)

- **Reconstrucción (API para B17, B18 y B20)**: el tipo `rebuildGap` (§7f) es un zócalo sólido que se usa mirándolo.
  Un hueco con dos zócalos (uno a cada lado) comparte `flag`; las piedras son `tiles` en capa 2 (patch persistente en
  la página «hecho», que además se vuelve `through`). Primer uso de un bloque:
  ```js
  { id: 'zocalo_x', type: 'rebuildGap', x, y, tiles: [[x, y, 2, id]…], flag: 'b17_hueco', tutorial: true,
    when: (s) => s.flag('b17_algo'), onRebuilt: async (ctx) => { … } }
  ```
  `tutorial: true` dice `FIELD_TEXT.rebuildTutorial` (content/zygarde/texts.js) solo si aún no se vio ningún tutorial
  (`REBUILD_TUTORIAL_FLAG` de `world/zygarde/eventTypes.js`); B16 usa su propio texto (lista). Sin la capacidad
  `rebuild` el zócalo solo dice `blockedText`. Para alzar piedras desde una escena: `rebuildStones(ctx, tiles)` de
  `world/zygarde/actions.js` (lo hace el hito con el primer hueco). Tiles de zócalo: `extraDefs('Exterior1').stamps`
  `pilar_zocalo` / `pilar_zocalo_vivo` (ver `b16_hito.js#gapTiles`).
- **Forma Completa en escena propia**: `reachMilestone(ctx, 'complete', { scenes: false, sayMissing: false })` devuelve
  `{ missing }`; `canBecomeComplete(state)` (`b16_hito.js`). Si faltan células, la célula 100 dispara la escena corta
  genérica (`checkZygardeProgress` + `MEMORY_LINES.complete`, que ahora es la línea de CAMPANA).
- **Combate sin Mochila**: `rules.sealedBag` (`true` o texto) en la petición de combate; `battle/core/battleItems.js
  #pbItemMenu` muestra el texto y vuelve al menú sin abrir la Mochila (no se toca el inventario). Azelf:
  `b16_querer.js#azelfRequest` + `bossBattle` (reintento inmediato con el equipo curado).
- **Pesca por casilla** (`world/fishing.js#fishingSystem(world, spot, rodId, { state })`): un mapa puede declarar
  `fishingAt(state, x, y) → tabla | null` (Feebas: `b16_feebas.js`, 6 casillas por día de juego + descansos); si no, la
  zona de `encounterZones` con tabla de esa caña, y si no la del mapa.
- **Controles en espejo**: `def.mirrorControls: true` invierte izquierda/derecha mientras ese mapa esté activo
  (`b16_recuerdo.js#installMirrorInput`, Proxy sobre `world.input.dir4`; nunca queda invertido fuera). El jugador lleva
  el aspecto de Gael con `player.setCharsets` y lo recupera al salir (`ensurePlayerLooksLikePlayer`). Antes de ponerle
  otro aspecto se baja de la montura del 10 % (`b16_recuerdo.js#dismountForMemory`): si no, `syncMount` repone el
  aspecto guardado del jugador en el primer fotograma del mapa nuevo.
- Reglas puras con solucionador para pruebas y E2E: `b16_saber_logic.js` (glifos; caballeros y bribones con
  `consistentExits`), `b16_mirror_logic.js` (salas ASCII del reflejo invertido, `solveMirror`), `b16_wind_logic.js`
  (pasillo del viento, `corridorPath`). El ritual del Telar publica `window.__b16Ritual` (solo navegador) para el E2E.
- Pruebas: `tests/b16_{content,reach}.test.mjs`. Recorrido: `node tools/e2e_b16.mjs [--from=<tramo>] [--only=<tramo>]`
  (conductor `tools/e2e_b16_driver.mjs`, tramos `tools/e2e_b16_stages.mjs`, ayudantes `tools/e2e_b16_page.mjs`).

## 18. Bloque 13: Talasa, Lumbre, Tizón y el Buceo genérico (propietario: b13; detalle en `content/maps/b13/README.md`)

- **Buceo genérico (API para B14 y DLC)**: un mapa de superficie declara su fondo con `dive: { map, dx?, dy? }` y el
  fondo declara su superficie con `underwater: { shallow, surface: { map, dx?, dy?, areas? } }` (`areas` = rectángulos
  del fondo con agua abierta encima; sin `areas`, cualquiera). Puras en `world/zygarde/dive.js`: `divePoint(def, x, y)`
  (fondo bajo una casilla), `surfacePoint(def, x, y)` (superficie sobre una casilla del fondo o `null` si está tapada) y
  `diveSpotTarget(def, d, x, y)` (destino de un `diveSpot`). Un `diveSpot` sin `to`/`tx`/`ty` baja (o sube con
  `surface: true`) a la casilla equivalente; con ellos, a un destino fijo (como antes). Bajo el agua, pulsar A sin nada
  delante ofrece emerger en la casilla equivalente (`world.actionButton` → `fieldHook('surface')` →
  `surfaceHere` de `world/zygarde/actions.js`; fuera de `areas` dice `FIELD_TEXT.surfaceBlocked`). El cambio de mapa
  lleva el fundido de `diveDown`/`surfaceUp`. Ejemplo: `estacion_talasa` (`dive`) ↔ `talasa_pilotes` (`underwater`).
- `def.noSwim: true` impide nadar en un mapa aunque el terrain tag sea agua (`world/waterAccess.js#swimAllowed`): en
  Cueva Volcán el autotile de lava lleva el tag de agua de Añil.
- **Fases de diálogo en combate** (`battle/core/bossPhases.js`): una fase `{ faint: true, messages: ['…'] }` muestra
  los mensajes cuando cae el combatiente `phaseTarget` y deja que se debilite con normalidad (escena «a mitad del
  combate», sin transformarse). En dobles, `phaseTarget: 1` es el primer puesto rival.
- `CAPABILITY_FLAGS` (`content/zygarde/thresholds.js`): al activarse el Buceo se pone el flag `zyg_dive`
  (`progression.js#applyUnlock`). Hito del Buceo: `reachMilestone(ctx, 'dive')` en el muelle de buzos de Caleta.
- `MapScene.loadNeighbors` recalcula el offset de un vecino ya cargado (costas con mapas de alturas distintas: Caleta,
  Ruta 15 y Nexo sobre el Mar del Sur de 190 casillas). `tools/validate_content_lib.mjs` cuenta como borde transitable
  el que se cruza nadando. `tools/gen_registries.mjs` no se rompe si un mapa en obras de otro bloque no importa: conserva
  su entrada anterior o lo omite con un aviso.
- Reglas puras con solucionador para pruebas y E2E: `content/events/b13_dance_logic.js` (baile de los Clefairy) y
  `b13_lava_logic.js` (coladas, bloques de obsidiana y respiraderos; `solveRoom`; las casillas `keep` de llegada de los
  túneles no admiten bloques y un test recorre todos los estados de cada sala para asegurar que siempre se puede volver a
  una boca). Arte propio: `node tools/b13_assets.mjs`.
- Pruebas: `tests/b13_{reach,content}.test.mjs`. Recorrido: `node tools/e2e_b13.mjs [--from=<tramo>] [--only=<tramo>]
  [--no-retry]` (conductor `tools/e2e_b13_driver.mjs` con nado y pasos cortos, tramos `tools/e2e_b13_steps.mjs` y
  `tools/e2e_b13_islands.mjs`, ayudantes `tools/e2e_b13_page.mjs`).

## 19. Bloque 17: Interludio 8, Axis en eclipse (propietario: b17; detalle en `content/maps/b17/README.md`)

- **Vacío con panorama** (`content/maps/b17/rim.js`): la Sima y el mar de nubes son casillas con capas 0/1 a 0 y la
  capa 2 = `VOID_WALL` (503, tile invisible que bloquea); el mapa declara `panorama: { image, parallax, scroll }` y se
  ve el fondo detrás. `paintVoid` / `paintVoidEdges(b, isVoid, isLand, { faceRows })` pintan el vacío y las caras de
  roca (capa 1). Tiles de zócalo de Reconstrucción por tileset: `socketTiles(image)`. Stamps horneados como parches de
  página (ocupación condicional sin tocar el mapa base): `patch.js#stampPatch(baked, name, x, y)` y `barrierLine`.
- **Aterrizajes del Vuelo por mapa**: una definición puede declarar `flyLandings(state) → [{ label, x, y, dir }] | null`;
  `world/zygarde/actions.js#chooseLanding(ctx, dest, { loadDef })` pregunta entre las opciones (null = destino normal;
  cancelar = no vuela). Villa Alba lo usa para el Círculo del Jardín.
- **Salas de piedras con regla de apoyo** (`content/events/b17_torres_logic.js`): salas ASCII (`#` roca, `E`
  entrada, `o` peña, `P` plataforma, `X` torre, `s` zócalo, `.` vacío); un zócalo alzado aguanta si está a ≤ `LIMIT`
  zócalos de roca firme (con la torre encendida). `raise(room, raised, i, px, py, { unlimited })` → `{ ok, raised, reason: 'raised'|'far'|'loose' }`,
  `solveRoom` y `solutionSockets` para pruebas y E2E. Eventos: `b17_torres.js#towerEvents(t, tiles)`.
- **Losa usable de frente y pisable**: un evento atravesable con gráfico es «over trigger» (solo se activa estando
  encima). Para una losa que se pisa y se usa mirándola: dibujo en un evento `through` y disparador en otro sin gráfico
  con `noOver: true` en la misma casilla (`b17_circulo.js#slabEvents`).
- Enlaces con bloques posteriores sin romper nada si faltan: conexiones condicionadas a `mapRegistered(id)`
  (`maps/b17/links.js`) y aviso neutro en las bajadas si `sima_eje` no existe; B19 añade los warps
  (`b19/links.js#descentWarps`).
- Pruebas: `tests/b17_{content,reach}.test.mjs` (BFS con la pasabilidad real). Recorrido: `node tools/e2e_b17.mjs
  [--from=<tramo>] [--only=<tramo>] [--to=<tramo>]` (conductor `tools/e2e_b16_driver.mjs`, tramos
  `tools/e2e_b17_stages.mjs`; ayudantes `window.__b16`).

## 20. Bloque 19: la Calzada del Rey y la Sima del Eje (propietario: b19; detalle en `content/maps/b19/README.md`)

- **Piedras que aguantan un paso** (reutilizable; T15): reglas puras en `content/events/b19_spans_logic.js` —tramos ASCII
  (`o` piedra, `P` aguja), `spanCells`/`cellsOf`, máscara de caídas (`isFallen`/`withFallen`), `isGoal` (todas caídas
  menos la pisada, junto a la aguja), `isStranded`, `solveSpan` (recorridos hamiltonianos) y `solutionSteps` para el
  E2E— y eventos en `b19_spans.js`: cada piedra es un evento `through` con gráfico que, en pie, escribe un «suelo
  invisible» pasable en la capa 2 (`PASS_TILE` 391 de Exterior1, parche de página) y al caer vuelve al vacío (503);
  disparadores `touch` en cada piedra y en la orilla (`onStone`/`onEdge`: cae la anterior, derrumbe con vuelta al borde,
  reinicio al volver a la orilla); la aguja alza la calzada de verdad con `raiseCalzada(ctx, tiles)` (losas por filas,
  más rápido que `rebuildStones` para tramos largos) y su página final la reaplica como `patch`.
- **Plaza de estrado de cualquier tamaño**: `maps/b19/tiles.js#estradoTile(rect, x, y)` (anillos del estrado 6×6 de
  Exterior1 y ladrillo en el interior); la calzada de 3 de ancho con `CALZADA.v/h/body` y, para recodos y cruces de
  cualquier forma sin costuras, `roadTileAt(x, y, isRoad)` (bordillo según las vecinas).
- Enlaces por warps con los bordes de B17 (`maps/b19/links.js#DESCENTS`, `descentWarps(id)`, `simaEdgeWarps()`) y con
  B20 (`puertaQuinceArrival` en la definición de `sima_eje`).
- Pruebas: `tests/b19_{content,reach}.test.mjs`. Recorrido: `node tools/e2e_b19.mjs [--from=<tramo>] [--only=<tramo>]
  [--no-retry]` (ayudantes `tools/e2e_b19_page.mjs`, `window.__b19`).

## 21. Bloque 20: Pilar del Origen (propietario: b20; detalle en `content/maps/b20/README.md`)

- **Senda del Origen**: nueve tramos de 24×18 con el mismo marco (`maps/b20/layout.js`: fuente única de coordenadas;
  `senda_defs.js#tramoDef`), cada uno eco de un Pilar hecho con las piezas de su bloque (solo lectura): piedras de B02,
  compuerta de B04, ráfagas y veletas de B06 (`gustEvents`/`vaneEvents`), pesos de B08, losa de recuerdo de B10,
  espacio imposible de B12, caracola de B14 y Buceo de B13, controles en espejo y caballeros y bribones de B16 y la
  **tensión de ejes de B18** (`world/axis`: el tramo 9 es una sala ASCII con `axisRoomEvents`, su propia variable de eje
  `b20_t9_eje`, `passTile` 405 de Cueva1 y `voidBlocks`). Reglas puras en `content/events/b20_logic.js`.
- **`lastPokemonBgm`** (aditivo en `battle/scene/setup.js` y `sceneUI.js`): un entrenador (o la petición de combate)
  puede declarar la música que suena cuando le queda su último Pokémon (Gael B6: «Ultimo Pokemon»).
- **`?tablets=N`** y **`?items=ID[:n],…`** (aditivos en `world/devTools.js`): dan las N primeras Tablillas de campaña y
  objetos en la Mochila (URL de pruebas; p. ej. `items=REDCHAIN,GLYPHKEY` para el tramo 9).
- **Avisos de varias líneas** (aditivo en `ui/core/overlay.js`): `ui.toast(texto)` parte en líneas lo que no cabe en el
  ancho de la pantalla (antes se salía por los lados; p. ej. `AXIS_TEXT` de `world/axis/actions.js`).
- **Nodo del Origen**: `registerOriginNode(fn)` (`content/events/b20_nucleo.js`) deja a B21 colgar su guion del sello
  del Núcleo tras la Flauta Azur.
- Pruebas: `tests/b20_{content,reach}.test.mjs`. Recorrido: `node tools/e2e_b20.mjs [--from=<tramo>] [--only=<tramo>]
  [--to=<tramo>] [--no-retry]` (conductor de B16 ampliado en `tools/e2e_b20_driver.mjs`, ayudantes `window.__b20`).

## 22. Bloque 18: Pilar de la Convergencia y la tensión de ejes (propietario: b18; detalle en `content/maps/b18/README.md`)

- **Tensión de ejes con la Cadena Roja** (`src/world/axis/`, genérico; lo usan la Cámara del Cruce y el tramo 9 de la
  Senda del Origen de B20). Una variable de partida guarda el eje tensado (`AXIS_VAR` = `cadena_eje`, o la que se pase
  en `axisVar`): `'time'` (hacia Dialga: lo que se mueve se congela; los escombros que caen se quedan en el aire y se
  pisan, las corrientes se vuelven cristal pisable, los pliegues se cierran), `'space'` (hacia Palkia: los pliegues,
  pares de marcas violetas, conectan casillas lejanas; todo vuelve a moverse) o `null` (sin tensar: todo se mueve).
  - `logic.js` (puro): salas ASCII (`parseAxisRoom(rows)`; leyenda `AXIS_LEGEND`: `#` muro, `.` suelo, ` ` vacío,
    `D` escombro, `C` cristal, `E` entrada = punto seguro, `X` salida, `o` objeto, `^ v < >` corriente, `1–9` pliegue),
    reglas (`walkableAt`, `isVoidAt`, `slideFrom` —una corriente que desemboca en el vacío hace caer—, `stepResult`,
    `afterTension`, `crystalsNear`), solucionador (`solveAxis`, `solveAxisRoom`, `axisReach`, `planSummary`,
    `solvableWithout(room, eje)` para exigir un eje) y **trampas** (`axisTraps(room)`: estados alcanzables desde la
    entrada o una salida, con cualquier eje, sin vuelta a la entrada o sin llegar a la salida; debe ser `[]`). Tono:
    `axisTone(base, eje)` + caché `setAxisCache`/`cachedAxis` para un `get tone()` del mapa.
  - `eventTypes.js` (registrados en `world/eventTypes.js`): `axisCrystal` (sólido; A → elegir eje; `requires`
    'REDCHAIN', `tutorial` + `tutorialFlag`, `onTense`), `axisDebris` (página «cae» con patch capa 2 = 0 y «congelado»
    con patch capa 2 = `passTile`, por defecto 385, un tile transparente y pasable del tileset), `axisCurrent` (`dir`;
    `touch` → arrastre) y `axisFold` (`to`; `touch` con el espacio tensado → la otra marca). Todos aceptan `axisVar` y
    `when(state, ev)`. Arte en `assets/objects/eje_*.png` (`node tools/b18_assets.mjs`).
  - `roomEvents.js#axisRoomEvents(room, { ox, oy, prefix, axisVar, safe, passTile, crystal, items, when })`: todos los
    eventos de una sala a partir de su ASCII (misma geometría para el mapa, las pruebas y el E2E).
  - `actions.js`: `tenseChain(ctx, eje, { axisVar, safe })` (variable, destello, páginas al momento; si la casilla del
    jugador deja de ser segura cae o la corriente lo arrastra), `rideCurrent`, `crossFold`, `fallToSafe` (caída sin
    daño: vuelta a la entrada de la sala) y `syncAxis(ctx)` (en el `onEnter` del mapa).
- **`voidBlocks`** (aditivo en `world/gameMap.js`): con `def.voidBlocks`, una casilla con las tres capas vacías es
  vacío y no se pisa (`isVoid(x, y)`; `passable`, `playerPassable` y `passableStrict`); sin la opción nada cambia. El
  abismo se ve por el panorama. **Panorama `sima`** (aditivo en `render/panorama.js`): shader de abismo sin imagen.
- **Combate del elegido**: `b18_nucleo.js#boundRequest(choice)` (nivel 65, sin huida) y `chainCatchCondition(battle)`
  (`rules.catchCondition`: captura solo con los PS del rival por debajo del 50 %; motivo en el combate y aviso antes).
- Enlaces con B17 (Senda del Mirador al norte, Mirador Sur al sur, offset 0) condicionados a `mapRegistered`
  (`maps/b18/pending_links.js`).
- Pruebas: `tests/b18_{axis,content,scenes,reach}.test.mjs` (el BFS de la Cámara recorre estados (casilla, eje) con
  las reglas del motor; ayudantes en `tests/b18_helpers.mjs`). Recorrido: `node tools/e2e_b18.mjs [--from=<tramo>]
  [--only=<tramo>] [--to=<tramo>] [--no-retry]` (conductor de B16 ampliado en `tools/e2e_b18_driver.mjs`: juega cada
  sala con el plan del solucionador y comprueba la casilla y el eje tras cada acción; ayudantes `window.__b18`).
