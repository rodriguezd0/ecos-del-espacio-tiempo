# Bloque 20 — Pilar del Origen (P10)

CAMPANA B20 (D19, D20; §6.3–6.4 Gael). Entrada: `b19_calzada`, nueve Fragmentos (F01–F09), quince Tablillas (T01–T15)
y la Forma Completa (`zyg_complete` / capacidad `rebuild`); la Flauta NO hace falta. Salida: `p10_restored`,
`b20_flute` (Flauta Azur, `AZUREFLUTE`), verso X, falsa calma (fase de crisis 4 derivada de `p10_restored`).

## Tres plantas (X36, reparto confirmado 03-10)

La columna `pilar_torre` se alza en la Sima del Eje, detrás del Umbral: centro 18, puerta 37, llegada exterior
(18,38). La Puerta de las Quince conserva nichos, requisitos y el camino proyectado. Los mapas llevan `pillar.floor`:

| planta | salas |
|---|---|
| 1 | Puerta de las Quince y los nueve tramos de la Senda del Origen, incluidas orientación girada, eco y fondo. |
| 2 | Cielo Interior: Tornadus, Thundurus y Landorus. |
| 3 | Terraza del Último Sello (Gael) y la sala del Núcleo del Origen. |

Las bocas entre plantas se dibujan como escalinatas del kit común. Los retornos llegan fuera de sus disparadores:
Cielo → Senda 9 (12,4), Terraza → Cielo (15,3), Núcleo → Terraza (12,5). Gael camina hasta la estela y baja por la
escalinata antes de desaparecer. Se conservan todos los IDs, coordenadas de guardado, flags y switches; no hace falta
migrar de mapa al cargar. El nodo del Origen sigue en (10,12), con su Salto de B21 y la Red B22a.

Esta **Senda del Origen** pertenece al P10. La Senda del Lazo de B15 y su acceso postgame a Cumbre Azur se conservan.

## Mapas

| id | tileset | tamaño | qué es |
|---|---|---|---|
| `puerta_quince` | 2 (Cueva1, `sala_gris` + kit de Pilar) | 32×34 | Fondo de la Sima. La Puerta de las Quince: muro con 15 nichos (T01–T15) y los tres de Arceus; la puerta dice qué Tablillas (nombre y lugar) o Fragmentos faltan y abre la pista en la Libreta; con todo, la losa se hunde y un camino se proyecta sobre el vacío (15 haces) que la Reconstrucción alza. |
| `senda_origen_1` … `_9` | 2 (el 2 y el 7, 15 Cueva Azul) | 24×18 | Nueve tramos, cada uno eco de un Pilar (tabla siguiente). Mismo marco: llegada (12,16), boca norte (12,2)/(12,4), claridad sur (12,17). |
| `senda_origen_6_giro` | 2 | 18×24 | Gemelo girado del tramo 6 (espacio imposible de B12). |
| `senda_origen_7_fondo` / `_7_eco` | 15 / 2 | 24×18 | Fondo buceado de la cisterna y su eco seco (caracola de B14). |
| `cielo_interior` | 2 (Cueva1 con las islas de B12) + panorama `cielo` | 31×56 | Islas de piedra sobre un mar de nubes; el Trío de las Nubes en tres terrazas con dos Manantiales entre medias; cada terraza con el rastro de su guardián (columnas mordidas por el viento, cristales cargados, peñas caídas). **Desviación pendiente de decisión del autor**: CAMPANA dice «8 + panorama `cielo`»; se hace en Cueva1 porque sus islas flotantes con cara de roca son las del Mundo Distorsión (anotado en la cabecera del mapa). |
| `terraza_ultimo_sello` | 8 (InteriorLiga + kit de Pilar) + panorama `cielo` | 26×24 | Gael: cura, B6 y la conversación del verso X. |
| `nucleo_origen` | 8 (`sala_trono`) | 21×28 | Fragmento 10, la Flauta Azur, la profecía entera y la falsa calma. El emblema de la Liga de `sala_trono` (se lee como una Poké Ball) queda tapado con alfombra lisa y la cámara de núcleo del kit (`NUCLEO.emblem`). |

Coordenadas: `layout.js` (fuente única de mapas, eventos, pruebas y E2E). Construcción: `paint.js`, `senda_build.js`,
`puerta_build.js`, `senda6_map.js`, `senda_defs.js`. Eventos: `content/events/b20_*.js` (reglas puras en `b20_logic.js`).
Arte propio (provisional, D30): `node tools/b20_assets.mjs [--preview]` (nichos, haz, fragmento, losa, reja).

### Senda del Origen: los nueve ecos

| tramo | eco | mecánica (reutilizada, solo lectura) |
|---|---|---|
| 1 | Umbral · Correr | Tres piedras giratorias de B02 (acertijo en la estela) abren la losa del dintel; cuesta de grava montado. |
| 2 | Corriente · Nadar | Se nada al islote, el mando abre la compuerta (B04) y el estanque se vacía (objeto oculto en el fondo). |
| 3 | Impulso · Embestida | Ráfagas y veleta de B06; la veleta está tapada por una roca agrietada. |
| 4 | Masa · Terreno | Barro (Terreno) y placa de contrapeso de B08: solo baja montado. **Manantial 1**. |
| 5 | Memoria · Trepar | Losa de recuerdo (eco de B10) que enseña el único camino por el Suelo Olvidado; pared con vetas. |
| 6 | Invertido · Ancla | Arista de giro y postes Ancla del espacio imposible de B12 (`world/impossible`). |
| 7 | Ecos · Buceo | Cisterna: Buceo (B13) al fondo; la caracola (B14) lleva al eco seco donde se alza la reja que sigue alzada en el presente. **Manantial 2**. |
| 8 | Alma | Tres voces a la vez (B16): controles en espejo, el viento que devuelve a quien se para y tres puertas de caballeros y bribones. |
| 9 | Convergencia · Reconstrucción | Sala de ejes de **B18** (`world/axis`): tres cristales de cambio tensan la Cadena Roja (`REDCHAIN`); hacia el tiempo la cascada del canal se detiene y se sube por ella; hacia el espacio se abre el pliegue a la repisa alta; allí la Reconstrucción alza el tramo roto. Escombros detenidos hasta la isla del objeto. En la pared, el último mensaje de los Custodios y el verso X. |

El tramo 9 usa su propia variable de eje (`b20_t9_eje`), no la de la Cámara del Cruce (`cadena_eje`): la primera vez se
entra sin tensar, después conserva la última tensión del tramo (también al guardar y cargar: `syncAxis` en `onEnter`), y
nunca altera la de B18. Su rejilla (`T9.room`, leyenda `AXIS_LEGEND`) pinta el mapa, crea los eventos
(`axisRoomEvents`, `passTile` 405 de Cueva1, `voidBlocks`) y la usan el solucionador, las pruebas y el E2E. Con
cualquier tensión se puede volver de la repisa de la salida a la llegada (cristal en la repisa central y en la del oeste).

Vuelta atrás: todos los tramos se recorren también de norte a sur. En el tramo 7, desde la repisa norte se nada al pozo
y su remolino (`T7.wellDive`, (11,5); a un lado para no tapar la oferta de nadar desde (12,4)) baja al túnel del fondo.

## Entradas, salidas y vecinos

| desde | casilla | a | notas |
|---|---|---|---|
| `sima_eje` (B19) Umbral | empujar ↑ en (18,37) | `puerta_quince` (16,31) ↑ | Lo pone B19 (`b19/links.js#PUERTA_QUINCE`). |
| `puerta_quince` claridad sur | (16,33) | `sima_eje` en `def.puertaQuinceArrival` (18,38) ↓ | `b20_puerta.js#toSima` (import dinámico; si faltara el mapa, texto neutro). |
| `puerta_quince` boca de la Senda | (16,2) | `senda_origen_1` (12,16) ↑ | Tras `b20_camino`. |
| tramo n boca norte / claridad sur | (12,2) / (12,17) | tramo n+1 (12,16) / tramo n−1 (12,4) | El 6 llega en (11,14) y se sale en (11,3). |
| `senda_origen_9` escalera | (12,2) | `cielo_interior` (15,51) ↑ | Vuelta por la escalera (15,52) → (12,4). |
| `cielo_interior` escalera superior | (15,2), tras `b20_trio` | `terraza_ultimo_sello` (12,21) ↑ | Vuelta desde (12,22) → (15,3) ↓. |
| `terraza_ultimo_sello` dintel | (12,3), tras `b20_gael_b6` | `nucleo_origen` (10,22) ↑ | Vuelta pulsando ↓ en (10,23) → (12,5). |
| `nucleo_origen` sello del suelo | (10,12) | — | **B21** cuelga el Salto de Convergencia con `registerOriginNode(fn)` (import en `nucleo_origen.js`). |

## Secuencia y flags (`content/events/b20_common.js`)

| paso | flags / vars |
|---|---|
| Puerta | `b20_puerta_llegada`, `b20_puerta_faltan`, var `b20_nichos` (máscara de nichos), `b20_puerta_abierta`, `b20_camino`, `b20_puerta_centro` |
| Tramos | `b20_tramo_1..9` (superados), `b20_t<n>_visto` (líneas de entrada), `b20_t1_losa`, vars `b20_t1_piedra_a/b/c`, `b20_t2_compuerta`, `b20_t3_pista`, vars de veleta `b06_veleta_b20_t3_*`, `b20_t4_placa`, `b20_t4_pista`, `b20_t5_suelo`, `b20_t5_caida`, `b20_t6_caida`, `b20_t6_ancla`, `b20_t7_reja`, `b20_t7_eco_visto`, `b20_t8_voces`, `b20_t8_puerta`, var `b20_t8_variante`, `b20_t9_cristal`, `b20_t9_cascada`, `b20_t9_pliegue`, var `b20_t9_eje`, `b20_t9_hueco`, `b20_custodios`, `verse_10` |
| Manantiales | `b20_manantial_1` (tramo 4), `_2` (tramo 7), `_3` y `_4` (Cielo): curan y fijan el punto de cura (y el Ancla en mapas imposibles) |
| Trío de las Nubes | `b20_cielo_llegada`, `b20_tornadus`, `b20_thundurus`, `b20_landorus`, var `b20_trio_respuesta` (`cielo` · `fuerza` · `zygarde`), `b20_trio`. Lee `b17_torre_*` / var `b17_torres_apagadas` (línea de Landorus) |
| Gael | `b20_gael_cura`, `b20_gael_b6`, var `b20_gael_intentos`, `b20_gael_charla`, `b20_gael_se_va`. Lee var `b16_mesprit_respuesta` (`culpa` · `lejos` · `permiso`) |
| Núcleo | `F10`, `p10_restored`, `b20_flute` + `AZUREFLUTE`, `b20_profecia`, `b20_falsa_calma` |

Combates: Trío (Tornadus 68, Thundurus 68, Landorus 70; sin huida; captura desactivada «No es momento: es un sello.»;
si se pierde, reintento en la franja con el equipo curado) y Gael B6 (`trainers/b20.js#b20_gael_b6`: Staraptor 70,
Lucario 70, Weavile 70, Garchomp 71, Absol 71 con Absolita, inicial final 72; `CombateRival` y «Ultimo Pokemon» con su
último Pokémon; obligatorio, con reintento y nueva cura).

## Objetos y encuentros

Objetos: Puerta `FULLRESTORE` (25,29), `MAXREVIVE` oculto (6,30); tramo 1 `ULTRABALL`×3 (18,9); 2 `MAXREVIVE` oculto
en el fondo (5,12); 3 `MAXELIXIR` (5,12); 4 `PPUP` (18,10); 5 `RARECANDY` (14,4); 6 `FULLRESTORE` en la pared violeta
(solo girado); 7 `DIVEBALL`×3 en el fondo (17,12); 9 `PPMAX` en la isla de los escombros (20,15); Cielo `FULLRESTORE`
(21,42), `MAXELIXIR` (8,24). Sin células (CAMPANA: ninguna en el Origen). Encuentros (`content/encounters/b20.js`,
POKEDEX_DISTRIBUCION): cueva en los tramos 1, 2, 4 y 9 (Unown O-R-I-G-E-N, Bronzong, Dragonair, Hakamo-o, Metang; 62–68).

## Pruebas rápidas

Base `B` = `party=GARCHOMP:100,METAGROSS:100,LUCARIO:98,TORTERRA:98,STARAPTOR:96&fragments=9&tablets=15&noenc=1&core=1&zygarde=all&zform=complete&zcells=100&zcores=5&items=REDCHAIN,GLYPHKEY,CLUENOTEBOOK,ZYGARDECUBE&vars=gael_starter:LITTEN,b16_mesprit_respuesta:lejos&flags=b01_dex_received,b02_libreta,p1_restored,p2_restored,p3_restored,p4_restored,p5_restored,p6_restored,p7_restored,p8_restored,p9_restored,verse_1,verse_2,verse_3,verse_4,verse_5,verse_6,verse_7,verse_8,verse_9,zyg_10,zyg_50,zyg_complete,zyg_rebuild_tutorial,b19_calzada&debug`

- Puerta (con una Tablilla menos para ver qué falta: `tablets=14`): `/?scene=map&map=puerta_quince&x=16&y=31&dir=8&` + `B`
- Tramo n: `/?scene=map&map=senda_origen_<n>&x=12&y=16&dir=8&` + `B` (tramo 6: `x=11&y=14`)
- Cielo Interior: `/?scene=map&map=cielo_interior&x=15&y=51&dir=8&` + `B`
- Terraza: `/?scene=map&map=terraza_ultimo_sello&x=12&y=21&dir=8&` + `B` (añadir `,b20_trio` a `flags`)
- Núcleo: `/?scene=map&map=nucleo_origen&x=10&y=22&dir=8&` + `B` (añadir `,b20_trio,b20_gael_b6,b20_gael_charla,b20_gael_se_va`)
- Variantes: `vars=…,b16_mesprit_respuesta:culpa|permiso` (línea de Gael), `flags=…,b17_torre_viento` (línea de Landorus);
  «Yo respondo por ella» con una partida de protagonista chica (lo cubren las pruebas de contenido para los dos géneros).

Comprobaciones: `node --test tests/b20_content.test.mjs tests/b20_reach.test.mjs tests/b20_vertical.test.mjs`, `node tools/validate_content.mjs`,
`node tools/preview_map.mjs senda_origen_9 --pass`. Recorrido completo: `node tools/e2e_b20.mjs [--from=<tramo>]
[--only=<tramo>] [--to=<tramo>] [--no-retry]` con tramos `exterior puerta t1 … t9 cielo terraza nucleo` (capturas
`tools/cache/screens/e2e_b20_*`, transcripción `e2e_b20_dialogos.txt`; derrota simulada contra Thundurus y Gael).

## Coordinación

- Cambios mínimos y aditivos fuera del bloque: `battle/scene/setup.js` y `battle/scene/sceneUI.js` (`lastPokemonBgm`),
  `world/devTools.js` (`?tablets=N`, `?items=…`), `content/services/zones.js` (prefijo `senda_origen_` en el grupo del
  Origen), `ui/core/overlay.js` (los avisos que no caben en una línea se parten en varias: el de la Cadena Roja de
  `world/axis` se salía por los lados), `docs/ARCHITECTURE.md` §21; registros regenerados (`maps/index.js`,
  `trainers/index.js`).
- Otros bloques: B19 declara `puertaQuinceArrival` y el warp del Umbral; B21 registra el Nodo del Origen con
  `registerOriginNode` (una línea en `nucleo_origen.js`); B18 publica `world/axis` (tramo 9 lo usa sin tocarlo).
- Textos DECIDIDO-DEV a revisar por el autor: inscripciones de las estelas de los tramos, líneas de entrada de Zygarde,
  textos de la Puerta (nichos, qué falta), el último mensaje de los Custodios, las líneas del Trío y sus respuestas,
  las frases no canon de Gael (llegada, derrota, despedida), los Manantiales y la narración del Núcleo. Canon literal:
  «No es momento: es un sello», «Yo respondo por él/ella», las líneas de Gael de §6.4 («Siéntate…», «¿"Querrá ser quien
  llama"?…», «Yo pedí permiso.», las tres de Mesprit, «Gael. No respondí contra ti.» — «Ya. Por eso es peor.»), la
  profecía y la falsa calma («El Eje está entero. Pero quien lo sostiene duerme.»).
