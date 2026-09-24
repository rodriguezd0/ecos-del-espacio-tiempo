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
  (objetos propios: AZUREFRAGMENT, AZUREFLUTE, CLUENOTEBOOK, POKEDEXAXIS). Campo opcional **`icon`**: archivo
  de `Graphics/Items` de Añil (o `game/assets/items/<icon>.png`) que usa la UI en lugar del id.
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

## 7. Combate

Desde el mapa: `world/battleFlow.js#runBattle(scene, request)` (lo usan `ctx.battle/wildBattle`): destellos +
transición, `battle(request)` de **`battle/api.js`** (implementación instalada por `battle/scene` con
`installBattle(fn)`), aplica el resultado y, si pierde sin `canLose`, derrota → curación y `state.healPoint`.
`request`: `{ type, trainer: id|def, opponent: { name, trainerType, party }, wild, format, rules, canLose, bgm,
transition, battleback, environment, weather (del mapa: 'rain'…), time, cave, phases, seed }`.
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
`flags=a,b`, `vars=k:v,…`, `core=1`. Sin partida se crea una de prueba (Pikachu nv 8).
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
