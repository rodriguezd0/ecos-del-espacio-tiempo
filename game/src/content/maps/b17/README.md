# Bloque 17 — Interludio 8: Axis en eclipse

CAMPANA B17. Entrada: Vuelo, `p8_restored` y `zyg_complete` (crisis en fase 3, cielo roto). Salida: **`b17_vigilia`**
(«Van a intentarlo por la fuerza.»); el jugador sale por la Senda del Mirador hacia el Puente de la Convergencia (B18).
T14 (Tabla Cielo), las tres torres del Anillo de Captación y el Círculo del Jardín son opcionales; la Vigilia pide T14
(`b17_t14_reencuentro`) y haber visto la ocupación del Mirador Sur (`b17_mirador_visto`).

## Mapas

| id | tileset | tamaño | qué es |
|---|---|---|---|
| `senda_mirador` | 1 (Exterior1) | 40×50 | Borde norte de la Sima del Eje. Senda desde Caudal junto al Río Albo (cascada al vacío), descansadero, Mirador Norte (losas con barandilla), tramo derrumbado (Reconstrucción) hacia la Cabeza del Puente, tablero del Puente (x 18–22) hasta el borde sur, espolones de las torres del Viento (oeste) y de la Tormenta (este) y bajada a la Sima (x 11–12). BGM `Amenaza`, fondo de combate `Acantilado` (antes `Espacio`, X35). Desde Caudal solo se entra tras el P8 (verja, X35). |
| `mirador_sur` | 5 (Exterior3) | 40×40 | Borde sur de la Sima. Antes del P8, paseo público; del P8 al P9, recinto del Consorcio (valla de obra, caravana, contenedores, depósito, andamio hasta el Resonador Sintético sobre el vacío, técnicos). Estribo del Puente (x 19–21), espolón de la Torre del Temblor (este) y bajada a la Sima (x 3–4) con un tramo desprendido (Reconstrucción, y 7–8). |
| `mesa_vientos` | 1 | 40×40 | Mesa de roca por encima de las nubes (solo por Vuelo). Estrado de llegada, caserío de los cuidadores de Altaria (cabaña de Aurora y casa de los cuidadores), corral, prados de hierba alta, molinos, el Alto (Trepar, roca del deseo reservada para el postgame) y la Aguja del Viento (Reconstrucción). |
| `mesa_vientos_casa` | 4 (Interior1) | 13×11 | Cabaña de Aurora. |

Coordenadas: `senda_layout.js`, `mirador_layout.js`, `mesa_layout.js` (fuente única del mapa, los eventos, las pruebas
y el E2E). Construcción: `*_build.js`. Eventos: `content/events/b17_*.js`. Arte propio: `node tools/b17_assets.mjs`
(torres, consola, Resonador, losa del Círculo, panoramas `b17_sima.png` y `b17_nubes.png`).

### Técnica del vacío (`rim.js`)

La Sima y el mar de nubes son casillas «vacías»: capas 0/1 a 0 y capa 2 = 503 (tile invisible que bloquea), con un
`panorama` de fondo (`{ image, parallax, scroll }`, `render/panorama.js`). Los bordes decorados (caras de terraza,
borde de roca) se pintan en la capa 1 del vacío (`paintVoidEdges`). `patch.js` coloca stamps horneados (Exterior1 /
Exterior3) como parches de página para la ocupación condicional (valla, caravana, andamios, barreras).

## Entradas, salidas y vecinos

| desde | casilla | a | notas |
|---|---|---|---|
| `senda_mirador` norte | x 14–17, y 0 | `ciudad_caudal` (B03) sur x 44–47 | `north`, offset −30 (Caudal ya lo tenía preparado). |
| `senda_mirador` sur | x 18–22, y 49 | `puente_convergencia` (B18) norte x 18–22 | `south`, offset 0, solo si el mapa está registrado. Cordón de la Policía Regional en (18..22, 38) hasta `b17_vigilia`. |
| `senda_mirador` bajada | x 11–12, y 49 pulsando abajo | `sima_eje` (B19) | Warp de B19 (`b19/links.js#descentWarps`). Sin `sima_eje`, aviso neutro en (11..12, 39). |
| `mirador_sur` sur | x 13–16, y 39 | `ciudad_lumina` (B09a) norte x 33–36 | `south`, offset −20. |
| `mirador_sur` norte | x 19–21, y 0 | `puente_convergencia` (B18) sur x 19–21 | `north`, offset 0, si está registrado. Barrera de obra en (19..21, 14) hasta el P9 (con `p9_restored` el Puente cruza la Sima entera: Lúmina ↔ Caudal). |
| `mirador_sur` bajada | x 3–4, y 0 pulsando arriba | `sima_eje` (B19) | Warp de B19. Tramo desprendido en (3..4, 7..8) con zócalos a los dos lados (y 9 y y 6, flag `b17_mirador_bajada`): el Mirador se visita desde B09, pero la Sima solo con Reconstrucción (G14). Sin `sima_eje`, además, aviso neutro en (3..4, 13). |
| `mesa_vientos` | punto de Vuelo (17,31) ↑ | — | Destino `mesa_vientos` del mapa de Vuelo (`regionMapData` `flyUnlock`), se desbloquea al resolver el acertijo. |
| `mesa_vientos` puerta (5,27) | | `mesa_vientos_casa` (6,9) | Vuelta a (5,28). Cerrada (Brisa) hasta `b17_mesa_confianza`. |

Mapas de otros bloques con eventos de B17 (líneas aditivas, todas condicionadas): `villa_alba` y `casa_prota_1f` (B01,
Círculo del Jardín), `ciudad_caudal` (B03, Vigilia), `nexo_correos` (B09b, T14), `b09a_lumina.js` (texto del guarda del
Mirador según P8/P9).

## Secuencia y flags (`content/events/b17_common.js`)

| paso | flags / vars |
|---|---|
| T14: Don Evaristo confía la carta (con Vuelo, tras `b16_t14_carta`) y el acertijo del sobre | `b17_t14_sobre`, `b17_t14_acertijo` (+ `unlockFlyPoint('mesa_vientos')`, `advanceClue('T14', 2)`) |
| Mesa: llegada, los tres Altaria del rebaño (prado a pie · Aguja con Reconstrucción · Alto con Trepar) | `b17_mesa_llegada`, `b17_altaria_1..3`, `b17_aguja` (hueco de la Aguja) |
| Confianza, Aurora lee la carta, vuelo a Nexo, reencuentro | `b17_mesa_confianza`, `b17_t14_aurora`, `b17_t14_viaje`, `b17_t14_reencuentro` (`SKYPLATE` + `STARAPTITE`) |
| Aviso de Alerce (T14 resuelta y el Mirador sin ver) | `b17_alerce_aviso` (+ nota `b17_mirador_aviso`, que se resuelve al ver la ocupación) |
| Mirador Sur ocupado (escena en el paso de la avenida, ante la puerta o al subir de la Sima; lleva al jugador a la valla) | `b17_mirador_visto` (+ nota `b17_anillo` en la Libreta) |
| Mensaje de Alerce (T14 + Mirador) | `b17_alerce_llamada` |
| Torres del Anillo (opcionales) | `b17_torre_{viento,tormenta,temblor}`, `b17_torre_<id>_tecnicos`, var `b17_torre_<id>_piedras`, flag `b17_torres_regla` (aviso de la regla), `b17_torre_<id>_caja` (caja de suministros: al apagarla o, si llega el P9 antes, en la torre abandonada) |
| Bajada del Mirador Sur a la Sima | `b17_mirador_bajada` |
| **Torres apagadas (la lee B20)** | **var `b17_torres_apagadas` (0–3)**: si es > 0, Landorus dice «Alguien apagó las torres. Lo sentimos.» |
| Círculo del Jardín (opcional, X26) | `b17_circulo_mama`, `b17_circulo_danza`, var `b17_circulo_paso` (0–6), **`b17_circulo`** (destino de Vuelo; B21 lo consulta), `b17_circulo_piedras`, vars `b17_clefairy_0..2` (día de juego del último combate) |
| Tramo derrumbado de la Senda | `b17_senda_derrumbe`; llegada `b17_senda_llegada` |
| **Vigilia (salida)** | **`b17_vigilia`** |

Globales que se leen: `p8_restored` (entrada y fase 3), `p9_restored` (B18: Genesis se retira del Mirador Sur),
`b16_t14_carta`, `game_cleared` (postgame: los Clefairy bailan sin la escena de Mamá).

## Torres del Anillo de Captación (`b17_torres_logic.js`, `b17_torres.js`)

Tres salas ASCII en los espolones del borde: Viento (`senda_mirador`, origen (1,30)), Tormenta (`senda_mirador`,
(29,30)) y Temblor (`mirador_sur`, (26,6)). Regla: con la torre encendida, un zócalo alzado aguanta si está a ≤ 3
casillas de roca firme (`LIMIT`); la ruta directa muere en un zócalo suelto y hay otra por las peñas. Al llegar a la
plataforma, combate doble de los dos técnicos (58–60, `bossBattle` con reintento a la entrada); la consola apaga la
torre (`FULLRESTORE` + `RARECANDY`, línea de Zygarde) y deja las piedras de la solución en pie. `solveRoom` resuelve
cada sala para las pruebas y el E2E. Con el P9 (Genesis se retira) la torre que siga encendida queda abandonada: la
tierra sostiene cualquier piedra y la caja de suministros sigue junto a la consola (una sola vez, CAMPANA §2.6).

## Círculo del Jardín (`b17_circulo.js`, `b17_circulo_logic.js`)

Del P8 en adelante, al entrar en casa Mamá cuenta lo de los Clefairy (y ofrece descansar hasta la noche). De noche en
Villa Alba, tres Clefairy bailan y pisan seis losas hundidas alrededor del jardín de la plaza: (20,14) (25,14) (28,18)
(25,22) (20,22) (17,18), en el orden oeste · este · noroeste · sureste · noreste · suroeste. Cada losa son dos eventos:
el dibujo `circulo_losa_i` (atravesable) y el disparador `circulo_piedra_i` (sin gráfico, `noOver`: se usa mirándolo).
Alzarlas en orden con Reconstrucción deja el Círculo en pie; un error las hunde y los Clefairy vuelven a bailar. Luego
el anciano de B01 (vuelve a su piedra al terminar), Mamá, 3 Piedras Lunares y el Círculo como destino de Vuelo: `villa_alba.flyLandings` ofrece «Villa
Alba» o «Círculo del Jardín» (`world/zygarde/actions.js#chooseLanding`). De noche aparecen Clefairy visibles (55–58),
uno por día de juego en cada uno de sus tres sitios.

## Entrenadores, encuentros y objetos

- Técnicos de Genesis (dobles, dinero 40): Ismael y Lorena (Viento), Tobías y Sara (Tormenta), Rubén y Elvira (Temblor).
- Senda (tras el P8): Montañero Óscar (12,25), Veterana Amparo (33,22). Mirador Sur (tras el P8): Fotógrafa Marcela
  (9,26), Aspirante Inés (30,24). Niveles 58–62 (`content/trainers/b17.js`).
- Encuentros (`content/encounters/b17.js`): hierba de la Mesa (Altaria, Staraptor, Tropius, Noivern, Drifblim, Togetic,
  58–62); Sima del Eje (cueva, 60–65) solo en la Cabeza del Puente y el tablero de la Senda (tierra sobre el vacío,
  `encounterZones`); el Mirador Sur no tiene encuentros; rebaño de Altaria 58/59/60 (no se capturan); Clefairy del
  Círculo 55–58. Sin células.
- Objetos: Senda `MAXREVIVE` (7,14), `ULTRABALL`×3 (37,28), `PPUP` oculto (2,29), `MAXELIXIR` (14,36), `STARDUST`
  (2,35); Mirador Sur `HYPERPOTION`×2 (1,22), `COMETSHARD` oculto (38,16), `STARPIECE` (34,14); Mesa `STARPIECE`
  (37,20), `PPUP` (24,6), `SHARPBEAK` oculto (3,19), `ULTRABALL`×2 (27,33).

## Pruebas rápidas

Base `B` = `party=GARCHOMP:80,LUCARIO:78,STARAPTOR:76,TORTERRA:76&fragments=8&noenc=1&time=13&core=1&zygarde=all&zform=complete&zcells=100&zcores=5&vars=starter:TURTWIG,gael_starter:LITTEN&flags=b01_dex_received,b01_left_town,b02_libreta,p1_restored,p2_restored,p3_restored,p4_restored,p5_restored,p6_restored,p7_restored,p8_restored,zyg_10,zyg_50,zyg_complete,zyg_core_2,zyg_core_3,zyg_core_4,zyg_core_5,zyg_dive,b13_talasa,b15_n5,b16_hito,b16_genesis_registro,b16_vuelo_aviso,zyg_rebuild_tutorial,b16_t14_carta,b04_gracias,b04_inicial&debug`

- T14 (Don Evaristo): `/?scene=map&map=nexo_correos&x=7&y=8&dir=6&` + `B` (hablar mirando a la izquierda)
- Mesa: `/?scene=map&map=mesa_vientos&x=17&y=31&dir=8&` + `B` (añadir `,b17_t14_sobre,b17_t14_acertijo` a `flags`)
- Mirador Sur ocupado: `/?scene=map&map=mirador_sur&x=14&y=38&dir=8&` + `B` (añadir `,b17_t14_reencuentro`)
- Torre del Temblor: `/?scene=map&map=mirador_sur&x=30&y=20&dir=8&` + `B`; Viento: `map=senda_mirador&x=6&y=29&dir=2`
- Vigilia: `/?scene=map&map=ciudad_caudal&x=38&y=12&dir=8&` + `B` (añadir `,b17_t14_reencuentro,b17_mirador_visto,b17_alerce_llamada`)
- Senda (salida): `/?scene=map&map=senda_mirador&x=15&y=1&dir=2&` + `B` (añadir `,b17_senda_llegada,b17_t14_reencuentro,b17_mirador_visto,b17_vigilia`)
- Círculo: `/?scene=map&map=casa_prota_1f&x=7&y=9&dir=8&` + `B` con `time=14` (Mamá cuenta lo de los Clefairy)

Comprobaciones: `node --test tests/b17_content.test.mjs tests/b17_reach.test.mjs`, `node tools/validate_content.mjs`,
`node tools/preview_map.mjs senda_mirador --pass` (igual con `mirador_sur`, `mesa_vientos`). Recorrido completo:
`node tools/e2e_b17.mjs [--from=<tramo>] [--only=<tramo>] [--to=<tramo>]` con tramos
`t14 mesa mirador temblor viento vigilia senda circulo` (capturas `tools/cache/screens/e2e_b17_*`, transcripción
`e2e_b17_dialogos.txt`; conductor de B16, tramos en `tools/e2e_b17_stages.mjs`).

## Coordinación

- Revisión (verificación del bloque): `events/b03_caudal_npcs.js`, una línea del barquero (decía que la Senda del
  Mirador «está cerrada» y la verja sur de Caudal ya está abierta: ahora habla del paso cortado al viejo Puente).
- Cambios mínimos y aditivos fuera del bloque: `maps/b01/villa_alba.js` (`...b17VillaAlbaEvents()` y `flyLandings`),
  `maps/b01/casa_prota_1f.js` (`...b17HomeEvents()`), `maps/b03/ciudad_caudal.js` (`...b17CaudalEvents()`),
  `maps/b09b/nexo_correos.js` (dos páginas del evento `evaristo` y `...correosB17Events()`), `events/b09a_lumina.js`
  (texto del guarda del Mirador), `world/zygarde/actions.js` (`chooseLanding` + lectura de `def.flyLandings` en el
  Vuelo), `tools/validate_content.mjs` (`p8_restored` en `EXTERNAL_FLAGS`).
- B18: los tableros casan con el Puente con offset 0 (Senda x 18–22 al sur; Mirador Sur x 19–21 al norte; su barrera del
  estribo cae con `p9_restored`). B18 añade lo suyo de forma aditiva. B19: warps de las bajadas (`b19/links.js`); desde
  la Sima, la bajada del Mirador Sur se sube reconstruyendo su tramo desprendido (zócalos en y 6). B20: var
  `b17_torres_apagadas`. B21: `b17_circulo`.
- Textos DECIDIDO-DEV a revisar por el autor: acertijo del sobre y diálogo con Don Evaristo, cuidadores (Brisa, Céfiro,
  Nube), Aurora y el reencuentro, la ocupación (técnicos, carteles del Consorcio, Zygarde), las torres y sus técnicos,
  la radio de los Guardianes y la Vigilia salvo la línea de canon, Mamá / danza / anciano salvo las dos líneas de canon,
  entrenadores. Líneas de canon literal: «Van a intentarlo por la fuerza.», «Mi abuelo decía que no había que
  moverlas… No dijo nada de levantarlas.», «Tu abuela decía que en el jardín dormía algo. Yo creía que era un cuento.»
