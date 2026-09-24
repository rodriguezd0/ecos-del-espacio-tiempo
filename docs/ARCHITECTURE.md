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
| `zygardeCell` | `cell` (id único), `text`; brillo verde |

### Entrenadores (`content/trainers/index.js`)
Cada zona exporta `{ id: def }`: `{ name, class, sprite, overworld, party: [{species, level, moves?, ability?, item?,
nature?, form?, shiny?, ivs?, evs?}] | (state) => [...], items, ai: 0–100, money, bgm, victoryME, intro, loseText,
winText, format, canLose }`. `getTrainer(id, state)`. Uso: `ctx.battle({ trainer: 'gael_1' })`.

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

### Acciones de campo (`world/fieldActions.js`)
El menú de pausa devuelve `{ type: 'useItem', item }` | `{ type: 'fieldMove', move, partyIndex }` y MapScene lo
ejecuta como guion con `runFieldAction(ctx, action)`: **Cuerda Huida** (`ESCAPEROPE`) → confirma y lleva a
`state.healPoint` (objeto clave en Añil: no se gasta), **Libreta de pistas** (`CLUENOTEBOOK`) → `ui.openClues()`,
**Pokédex** (`POKEDEXAXIS`) → `ui.openPokedex()`; movimientos: Teletransporte/Excavar (= Cuerda Huida),
Dulce Aroma (encuentro si hay tabla), Destello (amplía la luz en mapas `dark`), Amortiguador/Batido (ceden PS).
Otros → «Aquí no se puede usar.». Añadir un objeto: `registerFieldItem('ID', async (ctx, id) => bool)`.
**Repelente**: `state.startRepel` al usarlo; `World` descuenta un paso por paso (no en hielo), bloquea salvajes de
nivel < al del primer Pokémon y al agotarse avisa y ofrece usar otro (`repelWoreOff`).

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
loseText, winText }), rules: { canRun, canLose, canSwitch, expGain, moneyGain, canCatch, catchCondition(battle)→
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
| `zygardeCell` | `cell` (clave), `text`, `onFound`, `when`; al recogerla comprueba la progresión |
| `ramRock` | `kind`: `'rock'` o `'log'`, `group` (se rompen juntos), `sprite`/`tileId`; fisura blanca con brillo verde |
| `roughTerrain` | `kind`: `'mud'`, `'sand'` o `'snow'`; `mounted` (además montado); a pie el jugador se hunde un poco |
| `gravelSlope` | cuesta de grava: solo montado en el 10 % (ofrece montar) |
| `climbWall` | `to: [x, y]`, `down`, `h` (alto de las vetas); anima la subida/bajada (`<protagonista>_climb` si existe) |
| `diveSpot` | `to, tx, ty, dir`; `surface: true` = salida del fondo |
| `diveVent` | respiradero verde / `kind: 'bolsa'`: recarga la burbuja y es el punto de regreso |
| `diveCurrent` | `dir`, `length`: corriente que empuja |
| `rebuildGap` | `tiles: [[x, y, capa, id]…]` en un zócalo hexagonal; las piedras suben y quedan (self switch A + patch) |

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
`zygardeStrip`), utilizables con `ctx.effect(nombre, opts)`. Seguidor por forma en `content/companion.js`.

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
  warps (destino registrado, llegada dentro y transitable); conexiones (destino, vuelta simétrica, algún paso por el
  borde); eventos (ids, coordenadas, objetos, entrenadores, gráficos en disco); encuentros (species.json, pesos,
  niveles); entrenadores (equipos formables también dinámicos, especies, movimientos, objetos, sprite); guiones
  (giveItem/addKeyItem y entrenadores por id); células (claves, `content/zygarde/cells.js`, `B01_CELLS`; las pendientes
  de otros bloques salen como nota); flags leídos por `when()` en `maps/b01` que ningún guion pone (`EXTERNAL_FLAGS`
  documenta los que pone otro bloque). Lo ejecuta `tests/content_validate.test.mjs`.
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
  de `content/events/b06_common.js` (`canLose` + `noMoneyLoss`; al perder cura y devuelve a la casilla de reintento sin
  tocar `state.healPoint`). Alcanzabilidad a pie de los mapas del bloque: `tests/b06_reach.test.mjs`.
- Recorrido: `node tools/e2e_b06.mjs [--from=anillo|galerias|sala] [--no-retry]` (ayudantes en `tools/e2e_b06_page.mjs`).
