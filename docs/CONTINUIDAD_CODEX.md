# Continuidad del proyecto en Codex

Actualizado: **07-10-2026**. Estado del juego contrastado hasta **`fb5cae3`**, con documentación y herramientas de entrega verificadas después de ese commit. Esta guía permite continuar el proyecto desde otro equipo sin depender de la conversación anterior. El README de la raíz contiene las instrucciones de entrega y publicación; este documento conserva el conocimiento de desarrollo y QA. Destino solicitado: cuenta **`rodriguezd0`**, repositorio propuesto **`ecos-del-espacio-tiempo`**. Su creación y push deben comprobarse en la entrega; esta guía no los da por realizados.

## 1. Estado que recibe el próximo desarrollador

**Pokémon: Ecos del Espacio-Tiempo**, región Axis, es un fangame 2D de navegador con Three.js. La campaña B01–B21, postgame B22 y DLC B23/B24 están implementados. El objetivo anterior de terminar el juego completo está cumplido; las siguientes tareas deben partir de nuevas revisiones del autor, no de la antigua lista de pausa.

| Alcance | Estado comprobado | Tipo de prueba |
|---|---|---|
| B01–B21 | Nueva partida → diez Pilares → resolución → créditos → despertar → guardar/cargar → postgame habilitado | Una partida continua, sin preparar su progreso |
| B22a–e | Búsquedas legendarias, Red, sueños, Paradojas, Bastión, revanchas y archivos | Bancos de bloque en Chrome con fixtures declarados |
| B23 Almenara | Ocho mapas, Gael, Hoopa, Mega Zygarde, sellado/captura opcional, regreso | Banco de bloque; 13 hitos y nueve combates reales |
| B24 Expediciones | 30/30 Hallazgos, siete Ultrazonas, crianza, evoluciones e hipótesis insulares | Banco acumulado; 79 hitos y 47 combates reales |
| Pokédex | 425/425 especies con métodos compatibles en solitario | Auditoría de fuentes, evolución/crianza y pruebas del motor |
| Base del juego `fb5cae3` | **2484/2484 pruebas**, sin fallos, saltos ni cancelaciones | Cierre del parpadeo, 29,526 s |
| Integración de entrega, 07-10 | **2518/2518 pruebas**, sin fallos, saltos ni cancelaciones | Suite completa Node 26, 22,834 s; añade 13 pruebas del empaquetador y 21 del publicador |
| Mapas | 272 construidos sin errores; 45 costuras limpias | Validador, QA de mapas y auditor de progresión |
| Arte humano y atlas | Aprobación del autor del 04-10-2026 registrada por archivo | Láminas, visor real, hashes y regresiones |

Los bancos B22–B24 prueban desplazamientos, menús, daño, capturas y requisitos reales después de preparar equipo, historia y recursos. **No son una extensión jugada desde el guardado continuo B21.** El auditor de obtención demuestra métodos y compatibilidad; no acredita que una sola partida de navegador haya capturado las 425 especies. El detalle del cierre está en [CIERRE_CONTENIDO.md](CIERRE_CONTENIDO.md) y [REVISION_REQUISITOS.md](REVISION_REQUISITOS.md).

### La partida continua que ya terminó

Identidad de QA: **`QAut8uoab`**, ID de jugador **12703**. Se creó desde el título, con almacenamiento de Chrome aislado. El proceso original terminó con código 0 y cerró su navegador de QA. Su ID de proceso antiguo no sirve para reanudarlo en otro equipo.

Último guardado por UI: **`casa_prota_2f`, (8,6)**. Estado final:

- 100 células únicas, cinco Núcleos, diez Fragmentos y dieciocho Tablillas; T13 resuelto.
- Zygarde conserva Forma Completa, Salto y Anclaje. `game_cleared` y `b21_fin` habilitan el postgame después del despertar.
- Elección real de P9: **DIALGA**. Inicial real de Gael: **LITTEN**.
- Equipo: Inteleon 62, Rotom 56, Porygon-Z 56, Bramaluna 65, Zygarde 70 y huevo de Litten 1. Otros seis Pokémon en el PC; doce registros con UID distintos.
- Dinero: **92040**. El huevo de Gael se recibió por UI después de liberar un hueco con el PC. Tras cargar, una segunda visita confirmó que no se duplica.
- La recarga final desde el título conservó los datos persistentes completos y todos los huecos del PC. Reloj escrito/cargado: **484 → 484**. Después de la segunda visita se guardó de nuevo en casa.

El recorrido y sus comandos se describen en [e2e_campaign_README.md](../tools/e2e_campaign_README.md). La evidencia original vive en `tools/cache/campaign/`, carpeta ignorada por Git; **un clon no contiene automáticamente esa partida ni sus capturas**.

## 2. Lectura y decisiones que prevalecen

Para una modificación, leer primero este documento y el README; después las instrucciones del repositorio `AGENTS.md`, la sección de [DECISIONES.md](DECISIONES.md) que afecte al cambio y el README del bloque correspondiente.

Orden de continuidad narrativa: instrucciones actuales del autor → decisiones posteriores fechadas → [biblia_axis_v2.txt](biblia_axis_v2.txt) → [CAMPANA.md](CAMPANA.md) y guion de bloque. Las decisiones posteriores corrigen textos y cifras anteriores. La implementación y las pruebas deben respetar esa continuidad; una expectativa antigua del conductor puede estar equivocada.

| Documento | Para qué usarlo |
|---|---|
| [DECISIONES.md](DECISIONES.md) | D01–D30, TEC y X01–X38; distingue autor, desarrollo, provisional y descartado |
| [CAMPANA.md](CAMPANA.md) | Atlas, escenas, progresión, personajes y requisitos exactos de B01–B24 |
| [TABLILLAS.md](TABLILLAS.md) | T01–T15, Crónica, versos, tres Tablillas de Arceus y Libreta |
| [POKEDEX_DISTRIBUCION.md](POKEDEX_DISTRIBUCION.md) | Encuentros, evolución, crianza, megapiedras y obtención en solitario |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Contratos técnicos de estado, eventos, mapas, combate y presentación |
| [arte.md](arte.md), [stamps.md](stamps.md) | Fuentes de arte, aprobación, escala y piezas de mapas |
| [PENDIENTES.md](PENDIENTES.md) | Historial de pausa, tareas cerradas y revisiones posteriores |
| [CIERRE_CONTENIDO.md](CIERRE_CONTENIDO.md), [REVISION_REQUISITOS.md](REVISION_REQUISITOS.md) | Qué se verificó, con qué evidencia y sus límites |
| [COBERTURA.md](COBERTURA.md), [battle_coverage.md](battle_coverage.md) | Inventario de sistemas y manejadores del combate; no equivalen a cobertura de pruebas de todo el proyecto |
| [MODO_DESARROLLADOR.md](MODO_DESARROLLADOR.md), [QA_MAPAS.md](QA_MAPAS.md) | Diagnóstico manual y avisos geométricos revisados |
| [RECURSOS_EXTERNOS.md](RECURSOS_EXTERNOS.md) | Conjunto externo, empaquetado, integridad y atribuciones |

Las cabeceras de pausa de septiembre son antecedentes. `prota_kit` ya está integrado y vuelve a pasar; no hay que reproducir como fallo actual el antiguo 1591/1592. Algunas secciones técnicas antiguas conservan cifras del inventario inicial de 412 especies o marcan arte anterior como provisional: para el catálogo y la aprobación actuales prevalecen D28/D30 y el cierre de octubre.

### Preferencias permanentes del autor

- **Copy breve en UI:** etiquetas, botones y estados; sin párrafos que repitan el botón, lo obvio o detalles internos. Sin aclaraciones preventivas no solicitadas. Revisar también éxito, error, carga y vacío. Conservar los mensajes pedidos expresamente y los diálogos narrativos canónicos.
- El autor pidió autonomía para las decisiones abiertas de desarrollo. Registrar una resolución nueva como **DECIDIDO-DEV**, con motivo y alcance; sigue siendo revisable. No convertir material descartado en canon.
- Informes de progreso frecuentes y menos agentes simultáneos. En trabajo compartido, asignar archivos, respetar las ediciones ajenas y coordinar los índices y hooks comunes.
- Zygarde es serio y habla poco (**X34**): no da instrucciones de rutas, pistas de puzzles ni anuncios de futuras capacidades. Células quietas, apoyadas en el suelo, con el sprite original; sin pitido, flecha, latido o luz de proximidad. La detección mejorada es discreta y silenciosa en el mapa regional.
- La cámara sigue centrada también en bordes y esquinas. El exterior continúa visualmente fuera del mapa; interiores y cuevas muestran negro.
- Los NPC de escenas caminan por suelo válido. Si el destino está ocupado, esperan; no completar una despedida mediante teletransporte.

### Aprobaciones y reglas que no deben perderse

**D30/X32, 04-10-2026:** trece poses frontales nuevas, kit M/F de dieciocho hojas, veintinueve personajes de campo y atlas aprobados. `content/characters.js`, alias y `assets/ui/region_map.json` registran fecha y autor; la aprobación corresponde a los PNG presentados. No alcanza automáticamente a dibujos futuros ni a todos los objetos secundarios de los DLC. Core y célula conservan las referencias originales del creador.

**X37:** conservar la regla de `render/followerSize.js`: reducir gráficos sobredimensionados sin ampliar pequeños. Onix 0,5; Yanma 0,75; Zygarde mantiene su tamaño.

**X38:** separar globalmente jugador, Zygarde y acompañante según la huella opaca, preservando escala, cadena y movimiento. Está implementado en `5a3bdbb`; no sustituirlo por una distancia fija en un mapa concreto.

**X33:** cooperativo contra entrenadores reales de la historia. PvP conserva niveles reales y usa copias curadas sin recompensas. En historia en equipo, ambos manejan los suyos y reciben experiencia, movimientos, evoluciones, dinero y derrota del entrenador en sus partidas. Mochila cerrada online. Jefes con fases y combates que ya son dobles siguen individuales. Una desconexión interrumpe la historia en equipo sin ganador; en PvP gana el que sigue conectado.

## 3. Arrancar desde otro equipo

### Lo que contiene Git y lo que hay que aportar

El código es ESM sin bundler. Están versionados `package-lock.json`, `game/data/`, recursos propios/procesados de `game/assets/` y ambos módulos de Three.js en `game/vendor/`. Un clon contiene esas salidas; no hace falta regenerar todos los datos para empezar.

| Recurso | Situación y acción |
|---|---|
| Node/npm | El desarrollo previo usó Node **24.21.0** portátil en Windows; el `node` del PATH en la entrega del 07-10 es **26.10.0**. Son runtimes distintos. `package.json` no declara una versión mínima; usar un Node compatible con ESM, `node --test` y el glob del script de pruebas. |
| Dependencias | Ejecutar `npm.cmd ci` en PowerShell, o `npm ci` en otros sistemas, desde la raíz. El lock fija `three`, `ws`, `playwright-core` y `pngjs`. `node_modules/` no se publica. |
| Recursos originales de Añil | Copia local **`Pokemon Anil V4.13/`** en la raíz, ignorada por Git. El servidor sirve directamente esa carpeta bajo `/anil/`. No la reemplaza `npm ci`. |
| Recursos requeridos de Añil | Sprites, UI, fuentes, audio y efectos de `Graphics/`, `Audio/`, `Fonts/`. La auditoría local contó **21770 archivos / 648240995 bytes (≈618 MiB)** en esas tres carpetas, incluido `Audio/Game.exe`, que se excluye. El paquete definitivo suma **21779 archivos / 651369249 bytes** al añadir PBS/Data. Mantener nombres, espacios y mayúsculas de las rutas. |
| Fuentes para regenerar Añil | `Data/{species_metrics.dat,Tilesets.rxdata,PkmnAnimations.rxdata}` y `PBS/{pokemon.txt,pokemon_forms.txt,moves.txt,abilities.txt,items.txt,types.txt,trainer_types.txt}`. No hacen falta para jugar con las salidas procesadas existentes; sí para rehacerlas. |
| Chrome para E2E | `playwright-core` no descarga un navegador. El conductor continuo fija `C:/Program Files/Google/Chrome/Application/chrome.exe`; otras herramientas prueban también rutas de Edge. Revisar la cabecera del conductor antes de ejecutarlo en otro sistema. |
| Node portátil del equipo original | `.tools/` está ignorada. Las rutas `.tools/node-v24.21.0-win-x64` de notas antiguas no existen por haber clonado; usar el Node instalado o aportar ese runtime. |
| Evidencia y perfiles de pruebas | `tools/cache/` está ignorada. Los scripts versionados permiten repetir las pruebas, pero no contienen sus resultados históricos. |
| Partidas | `saves/` está ignorada y `localStorage` vive en cada navegador/origen. Transferir una partida mediante el flujo de exportar/importar o una copia acordada de sus archivos; publicar el código no las migra. |

El juego completo **requiere los recursos externos de Añil** aunque el servidor llegue a mostrar el título con fuentes de respaldo. Si faltan, habrá 404 de sprites/audio/UI; no es evidencia de que el clon sea jugable. Consultar en el README de entrega y [RECURSOS_EXTERNOS.md](RECURSOS_EXTERNOS.md) cómo se proporciona ese conjunto. La ruta de Añil está fijada en `server.mjs`; no existe un `ANIL_ROOT` configurable por entorno en esa versión. El ZIP/manifiesto de entrega están generados y verificados localmente, fuera del historial; su publicación sigue pendiente.

```powershell
# Desde la raíz del clon, con Node/npm y los recursos externos disponibles:
npm.cmd ci
npm.cmd run serve
```

Abrir **`http://localhost:8080/`** después de arrancar el servidor. En otros sistemas, los comandos equivalentes son `npm ci` y `npm run serve`. PowerShell puede bloquear `npm.ps1`; usar `npm.cmd` sin cambiar la política de ejecución. `npm.cmd run vendor` es opcional para renovar `three.module.js`, `three.core.js` y `LICENSE.three.txt` desde la dependencia; mantener ambos módulos de la misma versión. Las salidas existentes bastan para arrancar. `npm.cmd run serve` ejecuta `server.mjs`, sirve `game/` y `/anil/`, instala WebSocket de multijugador y el servicio de partidas. Parámetros reales: `PORT`, `HOST`, `SAVES_DIR`; por defecto 8080, todas las interfaces y `saves/`.

El juego usa HTTP/WebSocket; un hosting estático no sustituye este servidor para salas y guardados en disco. GitHub contiene el proyecto, no un proceso de juego permanente. No hay que reutilizar IDs de sesiones o procesos de la conversación anterior.

El aviso «Actualización disponible» no importa los módulos nuevos dentro de una escena ya abierta. Tras una corrección de producción, guardar por UI en una posición segura y recargar normalmente para probarla. No recargar en mitad de un combate.

### Herramientas de la entrega

[package_handoff_assets.mjs](../tools/package_handoff_assets.mjs) selecciona recursos, genera el ZIP y verifica el manifiesto y el contenido SHA256 de cada entrada. Crear o verificar ese paquete requiere **Windows con `powershell.exe` y .NET ZipArchive**; no cambia la política de ejecución de PowerShell. Esto es un requisito de la herramienta de empaquetado, separado del servidor Node.

```powershell
node tools/package_handoff_assets.mjs --check
node tools/package_handoff_assets.mjs --verify
```

La ejecución sin argumentos construye el paquete en `tools/cache/publicacion/`. La versión definitiva contiene **21779 entradas / 651369249 bytes sin comprimir**; el ZIP verificado ocupa **577506019 bytes**. `Graphics/UI/Save/panels.png` es arte legítimo de la interfaz y se conserva. El filtro compartido de selección/manifiesto excluye partidas, cachés y enlaces personales; no confundir esa carpeta de UI con los guardados del jugador. La primera selección que omitió ese PNG fue reemplazada por el paquete corregido.

[publish_handoff.mjs](../tools/publish_handoff.mjs) se ejecuta en una terminal normal con Git escribible y `gh` autenticado como `rodriguezd0`. Usa el CLI portable si está disponible en `.tools/gh-2.102.0/bin/gh.exe`; un clon sin esa carpeta necesita `gh` en el PATH. El script fija `github.com`, exige origin HTTPS con el destino correcto, comprueba archivos pendientes y staged, verifica los recursos y configura el helper Git de `gh`. Después prepara el commit, publica `master` y la rama histórica existente sin force y confirma el commit del tag, los tamaños y los digests de la Release.

```powershell
node tools/publish_handoff.mjs
```

Puede reconocer una Release completa o subir solo sus recursos faltantes, sin reemplazar los ya subidos. Para reanudar hay que conservar el mismo ZIP y manifiesto: reconstruirlos cambia metadatos/hash y el publicador rechaza una discrepancia con el tag existente. Los archivos ajenos, cuenta/destino incorrectos, errores de paquete y recursos incompletos o de distinto contenido bloquean la operación.

Las [13 pruebas del empaquetador](../tests/handoff_assets.test.mjs) construyen y alteran ZIP reales con fixtures aislados. Las [21 pruebas del publicador](../tests/publish_handoff.test.mjs) sustituyen `spawnSync` y operaciones de archivos por mocks, restaurándolos después: cubren fallos cerrados, credenciales/host, staging y reanudación de Release, **sin ejecutar Git ni contactar GitHub**. La integración completa de entrega pasó 2518/2518; no demuestra que una publicación real ya haya ocurrido.

### Datos y arte: regenerar solo cuando corresponda

`npm run data` encadena extracción PBS, tilesets, piezas de atlas, bosque/playa/Distorsión/puntas, audio y animaciones. Requiere el Añil original; modifica salidas versionadas. Leer el script de `package.json` y revisar el diff antes de integrar. No ejecutarlo como intento genérico de arreglar un clon sin recursos.

Los personajes propios se construyen con `tools/pixel_build.mjs`, las fuentes en `tools/pixel_chars/` y el atlas con `tools/pixel_map.mjs`. Los objetos de cada bloque tienen `tools/bXX_assets.mjs`. Para una propuesta visual, generar primero en una carpeta alternativa con `--out`, comparar dimensiones/píxeles y solicitar la revisión de ese arte cuando el encargo lo requiera; conservar el PNG aprobado en producción hasta entonces.

Algunas utilidades antiguas citadas en documentación viven dentro de `tools/cache/` —por ejemplo, `tools/cache/art/prota_review.mjs`— y **no están versionadas**. Usar primero los generadores y visores de `tools/`; recuperar o rehacer una utilidad de caché si se necesita, sin asumir que existe en el clon.

## 4. Mapa técnico para encontrar cada cambio

La lógica corre a 60 Hz. El mundo WebGL y la UI canvas están superpuestos, con resolución interna **512×384**, tiles de 32 px y escalado entero. El arte de campo se exporta a ×2 exacto. Direcciones de rejilla: 2 abajo, 4 izquierda, 6 derecha, 8 arriba. Three.js usa un grupo raíz invertido en Y; texturas con `flipY=false`.

| Área | Archivos y responsabilidad |
|---|---|
| Arranque/escenas | `game/src/main.js`, `core/engine.js`, `core/scenes.js`, `core/input.js`, `core/assets.js` |
| Persistencia | `core/state.js`, `stateData.js`, `storageOps.js`, `saveSync.js`; servidor `server/saves.mjs` |
| Mundo y mapas | `world/mapScene.js`, `world.js`, `gameMap.js`, `mapLoader.js`, `mapBuilder.js`, `player.js`, `character.js` |
| Eventos y guiones | `world/mapEvent.js`, `eventTypes.js`, `script/runner.js`, `script/context.js`, `content/events/bXX_*.js` |
| Dibujo, cámara y carga | `render/worldView.js`, `tilemapView.js`, `tileAtlas.js`, `camera.js`, `charsets.js`, `characterSprite.js`, compositor/fx |
| Seguidores | `world/follower.js`, `followerFormation.js`, `followerSpacing.js`; `render/followerSize.js`; huellas en `render/charsets.js` |
| Pasabilidad y puertas | `world/terrain.js`, `tileEmptiness.js`, `treeTips.js`, `borderFill.js`, `waterAccess.js`, `doorAnimation.js`; `render/doorPanel.js` |
| Mecánicas de Pilares | `world/zygarde/`, `world/impossible/`, `world/axis/`, `content/stamps/pilarVertical.js` |
| Reloj, descanso, huevos/cría | `world/rest.js`, `eggs.js`, `daycare.js`; crisis independiente en `content/story/crisis*.js` |
| Historia e inventario | `content/story/api.js`, `verses.js`, `fragments.js`, `tablets.js`, `notebook.js`, `clues.js`; `content/zygarde/{cells,thresholds}.js` |
| Combate puro | `battle/core/` y `battle/api.js`: RNG, turnos, efectos, captura, experiencia, evolución, IA |
| Combate en pantalla | `battle/scene/`: `setup.js`, `runner.js`, `battleScene.js`, `layout.js`, `gfx/actors.js`, `hud/`, `fx/`; aplicación desde `world/battleFlow.js` |
| Multijugador | `net/` y `battle/link/linkBattle.js`; salas en `server/multiplayer.mjs` |
| UI/servicios | `ui/api.js`, `ui/screens/`, `ui/logic/`, `content/services/`; atlas/catálogo en `ui/logic/regionMapData.js`, `content/services/zones.js` y `assets/ui/region_map.json` |
| Contenido | `content/maps/bXX/`, `events/bXX_*.js`, `trainers/bXX.js`, `encounters/bXX.js`; datos base y propios en `game/data/` |
| Pruebas y construcción Node | `tests/`, `tools/lib/map_node.mjs`, `validate_content.mjs`, `check_seams.mjs`, `qa_maps.mjs`, auditores y conductores E2E |

Consultar los nombres vigentes con `rg --files` antes de editar: algunas áreas se dividen en varios módulos. `content/maps/index.js` y `content/trainers/index.js` son **generados** por `tools/gen_registries.mjs`; `node tools/gen_registries.mjs --check` comprueba si están al día. Regenerarlos después de añadir definiciones importables, coordinando con quienes trabajen en contenido. `zones.js` y el atlas necesitan además su integración de lugares/nombres; el índice de mapas no la hace automáticamente.

### Estado, guardados y migraciones

`GameState.data` es JSON puro: identidad, posición, flags, vars, selfswitches, equipo, PC de 30×30, bolsa, Pokédex, células/Núcleos/capacidades, Fragmentos, Tablillas, pistas, visitados/Vuelo, opciones, reloj y punto de cura. Modificarlo mediante APIs de `GameState`, no escribiendo arrays o flags desde un controlador de QA continua. Los Pokémon tienen UID; conservar datos completos y huecos al trasladarlos entre equipo/PC.

`SaveSystem` usa tres ranuras `ecos.save.<n>`, `ecos.lastSlot` y exportación/importación de archivo. `saveSync.js` añade `ecos.owner`, refleja el guardado en `saves/<dueño>/ranura<N>.json` y reconcilia por `savedAt`. Cambiar equipo o liberar Pokémon exige que quede alguien capaz de combatir. Los regalos que no caben quedan pendientes; no consumir fósiles ni fijar una entrega antes de que haya un Pokémon real.

Un campo persistente nuevo requiere revisar `newGameData`, `migrate`, versión y regresión de carga. Un mapa reorganizado necesita conservar IDs/flags/selfswitches o una migración explícita. `redirectArrival` se aplica antes de buscar una casilla libre: permite trasladar un guardado antiguo a su sala nueva conservando dirección/coordenadas válidas. No reconstruir capturas o regalos perdidos a partir de un flag: puede representar una liberación o intercambio legítimos.

### Hooks de campaña/postgame

Los mapas antiguos acumulan decoradores de B22/B23/B24. Añadir el nuevo evento preservando listas y páginas existentes; no reemplazar todo `events`. El orden del wrapper importa: por ejemplo, Tizón conserva Forja/Heatran, pistas B22b, avistamientos y expediciones B24. Casilda del postgame es `b22e_guardian_casilda`; ofrece la pista de Marshadow antes del menú de revancha aunque ya haya abandonado las ruinas en la historia.

Las búsquedas requieren **`game_cleared && b21_fin`**, no solo victoria contra Arceus: evitar abrirlas dentro del epílogo. Captura fija un estado permanente; KO guarda el contador `rest_count` y reaparece tras descanso. Comprobar el Pokémon exigido **en el equipo**, vivo cuando la condición lo diga y sin huevos; el PC no satisface esos rituales. Las exhibiciones del Bastión usan copias y Mochila sellada, con estado real aislado también en la UI y el runner.

## 5. Campaña y Pilares verticales

La campaña no es una lista de mapas independientes: cada bloque conserva recompensas, elecciones y capacidades para el siguiente. Mantener la curva inicial rebajada y los cierres de X35; no subir equipos ni abrir caminos para que pase una prueba. Gael elige después del jugador el inicial con ventaja; Pokédex/Balls se entregan tras el primer duelo.

### Orden de bloques

| Bloque | Hilo de campaña |
|---|---|
| B01 | Prólogo, Villa Alba, inicial, sigilo, Laberinto/Core, Gael y Ruta 1 |
| B02 / B03 | P1 Umbral / Ruta 2, Caudal y T01 |
| B04 / B05 | P2 Corriente / Molino, Ruta 4 y Brontia |
| B06 / B07 | P3 Impulso/N2 / Ruta 6, Cantería y Mega Aro |
| B08 | P4 Masa, Estrato, Mina, Dunas y Fermín |
| B09a / B09b | Lúmina, museo/Reserva / Marisma, Nexo y Caleta |
| B10 / B11 | P5 Memoria / Neblino, Monte y regreso a casa |
| B12 / B13 | P6 Invertido/N3/Nadar / Talasa/N4, Lumbre, Tizón y Buceo |
| B14 / B15 | P7 Ecos/Bramaluna / norte, Boreal, Gael/N5, T13 y costa |
| B16 / B17 | P8 Alma/Telar/Cadena Roja/Completa / eclipse, torres y Vigilia |
| B18 / B19 | P9 Convergencia/elección / Calzada del Rey y T15 |
| B20 / B21 | P10 Origen/Trío/Gael/Flauta / Salto, Zygarde voluntario, Arceus y epílogo |

### Las tres plantas de cada Pilar (X36)

Hay tres **pisos**, aunque uno pueda contener varios mapas, gemelos o salas. Las definiciones declaran `pillar: { id, floor }`; no contar cada gemelo como un cuarto piso. Los puzzles conservan sus identidades y los entrenadores opcionales siguen opcionales.

| Pilar/bloque | Piso 1 | Piso 2 | Piso 3 |
|---|---|---|---|
| P1 / B02 | `ruinas_dintel_base`, entrenadores | `ruinas_dintel`, mecanismos y Geodude | `ruinas_dintel_nucleo`, Casilda/núcleo |
| P2 / B04 | `pilar_corriente_base` | `pilar_corriente`, estanques | `pilar_corriente_nucleo`, Leandro |
| P3 / B06 | `anillo_vientos_base` | `galerias_soplo` y `anillo_vientos` | `anillo_vientos_nucleo`, Abril |
| P4 / B08 | `camara_contrapesos_base` | `camara_contrapesos` | `camara_contrapesos_nucleo`, Fermín |
| P5 / B10 | `mnemos_archivo`, Archivo de papel | `archivo_hondo`, puzzles | `archivo_hondo_nucleo`, Olvido |
| P6 / B12 | `pilar_invertido`, Cara Vuelta/gemelos | `pilar_invertido_mirada` | Sumidero y `pilar_invertido_nucleo`, sello/N3 |
| P7 / B14 | `antea_base`, ruinas | `antea_*`, presente/Antea y capas del tiempo | `fosa_eco`, eco y Bramaluna Alfa |
| P8 / B16 | `santuario_alma`, Uxie | `santuario_alma_sentir` y recuerdo, Mesprit | `santuario_alma_querer`, Azelf y Telar |
| P9 / B18 | `puente_convergencia`, Casia/Garrido/Vértice | `camara_cruce`, Cámara del Cruce | `camara_cruce_nucleo`, Dialga/Palkia |
| P10 / B20 | Puerta de las Quince y `senda_origen_*` | `cielo_interior`, Trío de las Nubes | `terraza_ultimo_sello` y `nucleo_origen`, Gael/Flauta |

Las columnas exteriores usan `pilar_torre` (7×10, puerta central) y el kit común `pilarVertical.js`. P6 se ve detrás del aljibe con el parche que preserva el prólogo. Su interior es exclusivamente de puzzles: sin encuentros, entrenadores ni Guardián; la sombra canónica de Giratina es una aparición, no una batalla. **Anclaje es exclusivamente postgame y nunca una llave del P6.**

Comprobar ida, bajada, vuelta antes/después de restaurar y carga antigua. Las plantas P1–P5 trasladan derrotas de entrenadores mediante selfswitches compatibles; P9 redirige guardados de la antigua cámara del núcleo y P8 recoloca los antiguos espacios en su planta. No borrar estas migraciones al simplificar `onEnter`.

Dos nombres parecidos son lugares distintos: **Senda del Lazo (B15)** abre Cumbre Azur en el postgame; **Senda del Origen (B20)** pertenece al P10. Mantener ambos accesos y sus hooks B22a.

Entradas actuales útiles para diagnóstico:

- P9: `senda_mirador` **(20,48) → `puente_convergencia` (20,1)** por warp, no conexión de borde. Vuelta al exterior (20,49). La escalera sube a la Cámara.
- P10: columna en Puerta de las Quince, centro X18/puerta Y37; llegada exterior (18,38). Nodo B21/B22a del núcleo: **(10,12)**.
- Regreso P10: Senda 9 salida norte → Cielo → Terraza → Núcleo. El arco del Cielo es un evento, no una arista del grafo general de warps.

### Colección y capacidades

Las cien células son **95 físicas y cinco entregas de guion** (C009 y C029–C032). N1–N5 se obtienen en Laberinto, Parque Eólico, P6, Talasa y Boreal. Las últimas C097–C100 están en los tres pisos actuales de P8; C100 está en Querer, **antes del Telar**. P8 admite restauración parcial para salir y recoger lo que falte sin exigir antes Forma Completa. T13 y los regresos opcionales son parte del cierre continuo.

Fuente ejecutable: `content/zygarde/thresholds.js`; cifras principales:

| Capacidad | Células/Núcleos e hito |
|---|---|
| Montura Correr | 10, N1 y P1 restaurado; correr humano ya existe desde el principio |
| Embestida | 18 y N1 |
| Terreno | 25 y N1/N2 |
| Trepar | 35, N1/N2 y P5 restaurado |
| Nadar | 50 y N1/N2/N3 |
| Detección silenciosa | 60, N1–N3 y Nadar |
| Buceo | 70, N1–N4 y resonancia B13 |
| Completa, Volar, Reconstruir | 100, cinco Núcleos y P8 restaurado |
| Salto | Hito posterior a P10, en B21 |
| Anclaje | Después del final, postgame |

La colección usa claves persistentes, no solo un contador. Preservar todas las células anteriores al añadir mapas. La auditoría local comprobó entrada/retorno de las 95 coordenadas con capacidades previas a Completa; la partida continua después recogió las cien de verdad.

### Final B21

Zygarde se incorpora por voluntad con Honor Ball/Arca; si el equipo está lleno, el PC se gestiona mediante la UI real. Las capacidades de campo permanecen. Arceus tiene orden fijo **Tierra → Fantasma → Normal**, curación del 25 % en transiciones, captura solo en fase 3 por debajo del 50 % y reintento/retirada conservando fase. No alterar el snapshot de inicio para hacer ganar una prueba.

El final no acaba al vencer: resolución y T16–T18 → pueblo libre → regalo pendiente de Gael → televisión/carguero → créditos → despertar → guardar/cargar. Los guardados antiguos de casa se recuperan según el tramo del epílogo que falta, sin repetir créditos ni regalos ya terminados.

## 6. Postgame y DLC: localizar requisitos

Los README locales son la guía de accesos y coordenadas. Los comunes `b22*_common.js`, módulos de combates y `layout.js` contienen el contrato ejecutable.

| Bloque | Implementación y reglas importantes |
|---|---|
| [B22a](../game/src/content/maps/b22a/README.md) | Giratina profundo, Salto/Anclaje, Red de nodos conocidos, otro Dialga/Palkia con orbe y elegido en equipo, Arceus y Trío del Alma |
| [B22b](../game/src/content/maps/b22b/README.md) | Nubes/aves/bestias; pistas de Guardianes, movimientos propios con PP, avistamientos distintos y rastros persistentes |
| [B22c](../game/src/content/maps/b22c/README.md) | Lugia con guía accesible sin destellos obligatorios; Ho-Oh/amanecer/Cenizas; orbes/rituales Kyogre y Groudon; Rayquaza con ambos en equipo y tormenta; Latias y Latios itinerante |
| [B22d](../game/src/content/maps/b22d/README.md) | Nueve legendarios: Regis/Regigigas, Heatran, Darkrai/Cresselia, Mewtwo y Marshadow. Sueño profundo distinto de descanso. Mewtwo exige 300 vistos y tres prototipos diferentes |
| [B22e](../game/src/content/maps/b22e/README.md) | Siete Paradojas, Bastión con copias/Mochila sellada/PB, revanchas P1–P5 y cuartos de Alerce/Talasa. Palanca recupera todos los bloques no resueltos |
| [B23](../game/src/content/maps/b23/README.md) | Robo/carta/ferri; EXP-03 natural, Zygardita voluntaria; Hoopa comprueba Mega Zygarde del jugador en el historial del combate real; KO, sellado y captura opcional son estados distintos |
| [B24](../game/src/content/maps/b24/README.md) | Sabela/Registro: máximo tres activos, Rumor→Indicio→Hallazgo, oleadas 0/3/7/12. Requisitos de rescate, sigilo, pasos, movimientos, crianza y Ultraentes se observan en juego; exhibiciones excluidas |

Los intentos de captura bloqueados no consumen Ball ni turno. Capturas y regalos requieren posesión real en equipo/PC; un flag no crea un Pokémon. Comprobar KO→descanso, huida, derrota protegida, cancelación y regreso incluso cuando el expediente se pausa. Rayquaza no acepta Kyogre/Groudon guardados en el PC; Regigigas tampoco acepta los Regis en cajas o huevos.

## 7. Metodología de cambios y pruebas

Para un bug, conservar la reproducción → escribir regresión funcional **RED antes de editar producto** → corrección mínima GREEN → revisión independiente → prueba real cuando afecte presentación o flujo de juego. Medir al menos 80 % del alcance nuevo pertinente y declarar si es cobertura de módulo o solo de líneas cambiadas. No presentar el porcentaje de un helper como el de todo el motor.

Las pruebas de mapas deben construir mapas y eventos reales con `World`/`GameState`, contrastar colisión, ocupantes, warps y retornos. Un BFS aislado no sustituye el caso dinámico de un entrenador que camina sobre una célula. Usar `world.terrainAt(...)` cuando el juego distingue el agua bajo un puente; `terrainTagAt` sin contexto de puente puede predecir mal un desembarco.

| Comprobación | Comando desde la raíz |
|---|---|
| Suite Node | `npm.cmd test` en PowerShell; `npm test` en otros sistemas |
| Registros | `node tools/gen_registries.mjs --check` |
| Contenido/mapas | `node tools/validate_content.mjs --json` |
| Costuras | `node tools/check_seams.mjs --no-png` |
| QA de un mapa | `node tools/qa_maps.mjs --no-png --out=tools/cache/qa_actual.md <mapa>` |
| Fugas de progresión | `node tools/audit_progression.mjs --json` |
| Obtención en solitario | `node tools/audit_pokedex.mjs --solo` |
| Preview real de mapa | `node tools/preview_map.mjs <mapa> --pass --grid` |
| Pruebas focalizadas | `node --test tests/<archivo>.test.mjs` |

Para cobertura focalizada, añadir `--experimental-test-coverage` y `--test-coverage-include=<módulo o patrón>` a `node --test`. Los glob son de Node, no un listado de archivos inventado; en PowerShell se pueden pasar entre comillas. Las herramientas de QA escriben salidas: revisar `--out` para no reemplazar un informe histórico o un documento canónico por accidente.

La base de juego **2484/2484** está documentada en `suite_player_sprite_transition.log`. La última suite completa de entrega, ejecutada el **07-10 con Node 26**, pasó **2518/2518 en 22,834 s**, sin fallos, saltos ni cancelaciones: `publicacion/suite_handoff.log`. Las 34 pruebas adicionales corresponden a las herramientas de entrega; no hubo cambios posteriores de gameplay. El último validador de cierre tuvo 31 avisos y la QA mantuvo avisos revisados en 13 mapas —copas sobre suelo y trece obstáculos altos de los espejos—; no eran errores ni árboles cortados. Leer el tipo y la geometría antes de convertir todo aviso en un cambio de arte.

Cobertura focalizada de las herramientas de entrega: empaquetador **93,49 % líneas / 81,72 % ramas / 92 % funciones**; publicador **99,39 % / 86,11 % / 100 %**. Cada porcentaje corresponde a su módulo bajo ese foco, no a cobertura global del proyecto ni a una ejecución real de GitHub.

El inventario de manejadores del combate informa 463/463 códigos, 737/737 movimientos aprendibles de Axis y 218/218 habilidades usadas por sus especies. `TERASHIFT` queda fuera del sistema implementado de teracristalización; `CENIZASSAGRADAS` no tiene efecto de mochila en combate en la base de Añil. Esto es un inventario de soporte, no una prueba exhaustiva de toda combinación posible.

### QA continua: controles, autonomía del piloto y reanudación

```powershell
node tools/e2e_campaign.mjs
# Solo si se han transferido identidad, storageState y checkpoint reales:
node tools/e2e_campaign.mjs --resume
```

El conductor crea un nombre QA único desde el título, contexto aislado y un mismo GameState. Los helpers consultan estado, registran diálogos/batallas y planifican rutas; las acciones se ejecutan por teclas, menús y el motor. No usar F9, URL de desarrollo, flags, teleport, equipo/objetos/niveles preparados ni soluciones inyectadas en esa partida. La autonomía del piloto permite decidir ataques, cambios, compras, capturas, entrenamiento y aprendizaje disponibles en juego; no cambiar resultados ni azar.

Se acelera con **Opciones reales**: texto instantáneo y animaciones de combate desactivadas, Shift para correr. Un fallo del conductor escribe evidencia y mantiene el navegador mientras espera una modificación de `campaign_retry.json`; ese archivo es una señal de reintento de la herramienta, no progreso de GameState. Leer antes el estado vivo y conservar la misma partida. `--resume` abre un contexto nuevo con el almacenamiento guardado por UI y empieza después del último bloque cerrado; no reconstruye automáticamente un tramo vivo que nunca se guardó.

| Control | Tecla |
|---|---|
| Movimiento | Flechas o WASD |
| A / confirmar | Z, Espacio o Intro |
| B / volver | X, Esc o Retroceso |
| Pausa | C o Tab |
| Correr | Mayús |
| L / R | Q / E; E monta/desmonta cuando corresponde |
| SELECT | V |
| Desarrollador | F9 con mapa libre; esperar pasos/guiones/transiciones |

Volar se abre desde pausa→Zygarde→Volar y usa destinos habilitados/visitados. Las posadas y el descanso cambian el **reloj del juego**, no la hora del equipo. Los sueños requieren dormir profundamente; esperar tormenta no se sustituye por escribir clima.

Los bancos por bloque `tools/e2e_bXX.mjs` pueden usar fixtures de historia/equipo/recursos o una derrota inducida en el arnés. Revisar su cabecera y helpers, y declararlo en el informe. `e2e_campaign_double.mjs` es un banco de presentación separado; nunca usar su equipo preparado como parte de la campaña continua.

### Qué se compara al guardar/cargar

`e2e_campaign_checkpoint_reload.mjs` exporta `persistentSaveData`, `readPersistentSaveData`, `readSavedSlotData` y `clockReloadError`; `e2e_campaign_reload.mjs` los reutiliza para el cierre.

La baseline es el **JSON exacto que Guardar escribió en la ranura**, validado por slot, identidad, fecha y coincidencia con la partida viva. El reloj puede avanzar al cerrar el menú después de esa escritura: comparar solo con una lectura viva posterior produjo un falso retroceso en B13.

Comparar todos los datos persistentes: ID/nombre, Pokémon completos/UID, posición de cada caja/hueco, bolsa/dinero, flags/vars/selfswitches, colecciones, pistas, viajes, opciones, posición y punto de cura. Solo se excluyen `playTimeFrames` y `clock` de la igualdad literal. El reloj se valida aparte: entero 0..1439, avance modular de hasta quince minutos, cruce de medianoche permitido; ausencia, retroceso/reset o salto grande fallan.

Recargas físicas realizadas sobre la misma QA: **B13, B15 y B21**, con horas 1219, 149 y 484 respectivamente. El intercambio posterior del PC en B16 conservó todos los registros al depositar Rampardos y retirar Bramaluna. El helper acepta también reanudar una interrupción legítima entre depósito y retirada, sin duplicar ni perder UID.

## 8. Bugs y trampas ya resueltos

Son antecedentes útiles para diagnosticar, no una lista de incidencias altas abiertas. No reabrirlos solo porque una nota vieja o `campaign_failure.json` siga en caché.

| Caso | Causa / resolución que hay que conservar |
|---|---|
| `prota_kit` antiguo | Faltaba el módulo recuperado del WIP. Ya integrado; suite actual verde. |
| Ezequiel/C065 | El entrenador se acercaba hasta la célula de Mar del Sur y la tapaba. Origen actual (135,15); célula (135,16) intacta. Regresión de movimiento/victoria/recogida. |
| Nerea/C059 | Podía acabar sobre otra célula al salir por el oeste del despacho. Origen desplazado una casilla al este; premio/páginas/células conservados. |
| Talasa doble | Un verificador aceptaba solo Casia; ahora exige Casia **y Garrido en el mismo combate**. Reintentar únicamente tras una derrota nueva con regreso real, no por una derrota histórica. |
| B14 eco/Alfa | El eco no es capturable; restauración/F07/T13 preceden al Alfa físico opcional. Perder cura localmente; ganar sin capturar requiere descanso. No repetir la restauración al reanudar. |
| Retornos marinos/Boreal | Expectativas de coordenadas antiguas y planificador sin contexto de puente/Nadar. Retornar por eventos registrados y controlar terreno del World con el bridge vigente. |
| Grafo de viajes | Warps aparentes pueden estar detrás de barreras; filtrar con flags/capacidades y comprobar también llegadas inversas. Cielo→Terraza de P10 es un evento y requiere recorrido explícito. |
| Río de P9 | Un tap no produjo el paso esperado; geometría, solver y ocupantes eran válidos y el fallo no se reprodujo. Reanudación estricta desde sala/casilla/eje observados; no se cambió colisión ni esperas a ciegas. |
| Reloj de recarga | Lectura viva tras cerrar Guardar era posterior al payload. Se corrigió la baseline; el control sigue rechazando un retroceso real. |
| Puertas/escuela | Máscaras de panel y acceso de la Escuela del Pico revisados contra el atlas; el monitor inicial capturaba negro. Las capturas válidas de animación llevan prefijo `door_chrome_phases_`. |
| Parpadeo al correr | `setGraphic` borraba la hoja y esperaba `.then` incluso en caché. La hoja lista se aplica síncronamente; durante frío el jugador conserva la anterior. |

### El incidente de las 99 derrotas de Arceus

El piloto original repetía «Reintentar fase» con el snapshot de Fantasma que ya tenía cinco Pokémon debilitados. Provocó 99 derrotas reales y encontró una salida de producto que al agotar el límite no curaba/recolocaba. **No demuestra que el jugador tenga que perder 99 veces ni que ese sea el balance normal.**

- `9366916` corrige el retorno seguro al agotar el límite, con regresión de producto.
- `46b20b6` acota el piloto: una comprobación de Reintentar y después Retirarse; máximo tres retiradas por fase, derrota nueva protegida, dinero/posición/cura observados y fase sin retroceso.
- La QA se recuperó en la misma partida mediante el manantial real y ganó la fase restante en 17 turnos, dinero intacto. **No ejecutó una nueva retirada después de esa cura.** La ruta de retirada se cubre por regresiones; no atribuirle una retirada Chrome que no ocurrió.

### Parpadeo del protagonista: evidencia reciente

Cambio `fb5cae3`, limitado a `render/charsets.js` y `characterSprite.js`, sin modificar PNG aprobados. La conservación de hoja/caché síncrona se aplica al jugador; NPC mantienen su contrato. Gráfico vacío/tile, transparencia, cambio de clave y `dispose` cancelan cargas tardías, incluida la sombra.

RED Node: seis fallos entre nueve regresiones nuevas. GREEN: **12/12** incluyendo tres pruebas previas de huellas. Cobertura del foco: **92,64 % líneas / 88,89 % ramas / 80,95 % funciones**; CharacterSprite 100 % de líneas, charsets 80,80 %. Es cobertura de esos módulos bajo ese foco, no del render completo.

Chrome RED observó desapariciones M/F tanto en frío como en transiciones cacheadas, aunque solo se pidió una vez cada PNG. Chrome GREEN: M/F, carga normal y demora declarada de 350 ms, **72 transiciones, 1518 fotogramas y cero invisibles**, sin errores. Comando reproducible: `node tools/e2e_player_sprite_transition.mjs`; `--expect-gap` corresponde a la reproducción histórica contra código anterior, no al resultado esperado de esta versión.

## 9. Evidencia, límites y próximo trabajo

### Archivos locales útiles si se transfieren

Todos estos nombres están bajo `tools/cache/` y no se garantizan en Git. Para conservar la continuidad de una sesión concreta, transferir el conjunto pertinente sin mezclar guardados de personas distintas.

| Grupo | Archivos / uso |
|---|---|
| Reanudación de QA | `campaign/campaign_identity.json`, `campaign_browser_storage.json`, `campaign_checkpoint.json` |
| Auditoría de campaña | `campaign_checkpoint_Bxx.json`, diálogos Bxx, `campaign_live.json`, `campaign_connections.jsonl`, capturas; `campaign_failure.json` puede ser histórico |
| Recarga final | `campaign_final_before_reload_live.json`, `campaign_final_before_reload.json` (incluye payload), `campaign_final_after_reload.json`, `campaign_final_reload_audit.json` |
| Huevo/última ranura | `campaign_b21_worker_audit.json`, `campaign_b21_final_slot_audit.json`, `campaign_final_dialogos.json`; capturas finales 874–897 |
| Revisión de fuentes | `progression_inventory_report.md`, `progression_inventory_sources.json`, auditor de Pokédex y trazas |
| Mapas | `trainer_contact_final_validator.json`, `trainer_contact_final_map_qa.json`, previews/costuras y `audit_progression_final.json` |
| Arte/seguidores | `arte-final/`, informes de aprobación, `follower_spacing_review.md`, `follower_spacing_changed_coverage.json`, registros de puertas |
| Parpadeo | `player_sprite_transition/{red,green}/report.json`, capturas y `player_sprite_transition_node_{red,green}.log` |
| Base del juego | `suite_player_sprite_transition.log` |
| Integración de entrega | `publicacion/suite_handoff.log`, `publish_handoff_node_red.log`, `publish_handoff_green.log` |
| Paquete externo | `publicacion/handoff_assets_report.json`, `handoff_assets_build.log`, `handoff_assets_verify.log`, `handoff_assets_green.log`, `handoff_assets_save_ui_red.log` y ZIP/manifiesto definitivos |

Un informe ausente en un clon significa que la salida estaba ignorada, no que deba inventarse ni que la prueba haya sido ejecutada en ese equipo. Las pruebas/scripts y los resúmenes versionados permiten repetirla y reconstruir evidencia. El almacenamiento de QA y `saves/` no deben mezclarse con partidas del autor al ejecutar un banco.

### Límites declarados

- Las comprobaciones de navegador se hicieron en Chrome de escritorio, mayormente headless con SwiftShader. No acreditan todas las GPU, navegadores, móviles, mandos ni resoluciones posibles.
- La campaña continua cubre una identidad, un inicial, una elección P9 y un itinerario. Otros caminos tienen pruebas focalizadas/bancos; no afirmar que se recorrieron todos desde Nueva partida.
- El cierre verificó acceso al postgame sobre el mismo guardado B21. B22–B24 y las 425 obtenciones no fueron una única continuación sin fixtures de esa QA.
- Las tasas Alfa/variocolor y elecciones de música/fondos conservan su carácter revisable. El arte aprobado tiene alcance concreto; objetos secundarios y referencias de Añil pueden recibir nuevas revisiones.
- Las rocas de cueva mantienen la pasabilidad especial de tres puzzles (Cámara, Tizón y Gruta Escarcha). No aplicarles una regla exterior de rocas sin rehacer/verificar esos puzzles.
- Los scripts de navegador contienen rutas Windows concretas y algunos no permiten elegir puerto por CLI. Adaptar el lanzamiento del arnés en otro sistema con una regresión acotada; no cambiar la historia para resolver portabilidad.
- Los logs de cobertura parciales, inventarios de funciones y revisiones visuales no equivalen a una garantía universal de ausencia de bugs.

### Puntos de historia Git que orientan

| Commit | Qué conserva |
|---|---|
| `274c47d` | Notas de la pausa de septiembre; antecedente |
| `030e80d` | Tandas 1–4 de mapas/correcciones del autor |
| `de7afc5` | P6 y primer postgame B22a |
| `0a3026e` | Integración de postgame y revisión de B22e |
| `8c81a5c` | P7–P10 verticales |
| `3c0bafe` | Disposición de dos Pokémon propios en dobles/cooperativo |
| `5a3bdbb` | Separación global de seguidores X38 |
| `8d77f09` | Baseline exacta de payload, reloj y verificadores de recarga |
| `9366916` | Salida segura al límite de reintentos de Arceus |
| `46b20b6` | Piloto B21 acotado y reentrada con Zygarde incorporado |
| `ff0a3ef` | Cierre documentado de campaña continua/créditos/recarga |
| `fb5cae3` | Protagonista visible al empezar/dejar de correr |

La rama **`wip-pausa-25-09`** es material histórico parcialmente recuperado. No fusionarla completa: contenido útil ya se integró selectivamente y la rama arrastra geometría/fixtures anteriores a los Pilares verticales.

### Cómo iniciar la siguiente revisión

1. Comprobar la revisión actual de Git, leer README/AGENTS y verificar los recursos externos; no asumir las carpetas ignoradas del equipo anterior.
2. Arrancar el servidor y reproducir el problema del autor en una partida aislada o una copia/exportación acordada. Registrar mapa/casilla, dirección, forma/montura, hora/clima, eventos vivos, entrada por UI y versión cargada.
3. Distinguir fallo de producto, expectation antigua del arnés, recurso ausente y módulo cacheado. Un regreso seguro o una corrección del piloto no autoriza a falsear GameState.
4. Aplicar TDD, conservar migraciones/hooks, revisar el diff y obtener revisión independiente. Ejecutar el foco y el recorrido pertinente; ampliar a integración cuando un cambio o un fallo nuevo lo justifique.
5. Actualizar los documentos del alcance y guardar evidencia reproducible. En un nuevo encargo de publicación, seguir la autorización vigente y los permisos reales de Git; este documento no confirma por sí mismo que un push haya ocurrido.

Al cerrar esta guía el **07-10-2026**, `.git` está en modo solo lectura en el entorno administrado y GitHub aún no tiene una cuenta autenticada para la entrega. El destino consultado devolvió 404; no se confirmó creación de repositorio, commit de entrega, push ni Release publicados. Las operaciones de publicación pertenecen al responsable de la entrega desde una terminal autorizada; no sortear ese límite mediante otro shell, credenciales o copias del repositorio. El resultado real debe quedar registrado en el README de publicación.
