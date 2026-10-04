# Bloque 18 — Pilar de la Convergencia (P9)

CAMPANA B18 (D18). Entrada: `b17_vigilia`, Cadena Roja (`REDCHAIN`) y Reconstrucción (`zyg_complete`); nivel ~62.
Salida: **`p9_restored`**, var **`p9_choice`** (`DIALGA` | `PALKIA`) y var **`p9_chosen_caught`** (true/false); la
Cadena Roja se conserva «templada» (`b18_cadena_templada`) y la pista T15 queda abierta. Nivel ~66.

## Tres plantas (X36, reparto confirmado 03-10)

La columna exterior de siete por diez casillas está en `senda_mirador` (centro 20, puerta 48). El rellano permite
rodearla; el cordón policial cubre también sus lados hasta la Vigilia. Todos los interiores llevan `pillar.floor`:

| planta | mapa | contenido |
|---|---|---|
| 1 | `puente_convergencia` | Puente, Reconstrucción, Casia, Garrido, Vértice y la escena de Genesis. |
| 2 | `camara_cruce` | Vestíbulo y los tres puzzles de ejes. |
| 3 | `camara_cruce_nucleo` | Dialga/Palkia, elección, Fragmento 9, orbe e inscripción. |

La planta del puente conserva toda su geometría. `camara_cruce_nucleo` conserva las coordenadas del núcleo anterior.
`camara_cruce.redirectArrival` reconoce un guardado antiguo allí **antes** de buscar una casilla libre y lo lleva a
la planta 3; `cruceEnter` conserva sus switches. Elección, descansos, captura, recompensas y flags no cambian.
Perder contra el elegido devuelve a la entrada de la planta 2 (10,13), curado y con la elección fijada.

## Mapas

| id | tileset | tamaño | qué es |
|---|---|---|---|
| `puente_convergencia` | 1 (Exterior1 + kit de Pilar) | 40×60 | Planta 1 interior: tablero x 18–22, campamento de Alerce, tres huecos, plataforma de Genesis y escalinata del Cruce. Conserva el panorama de la Sima, el fondo `Espacio` y todas sus coordenadas. Sus extremos salen por warps a la Senda y al Mirador Sur. |
| `camara_cruce` | 8 (InteriorLiga + kit común de Pilar, tinte plata) | 58×42 | Planta 2: Vestíbulo → Caída → Río → Cruce. Salas suspendidas sobre la Sima, BGM `Transicion`, Cuerda Huida y tensión de ejes. El Cruce y el atajo suben al núcleo. |
| `camara_cruce_nucleo` | 8 (mismo kit y tinte) | 58×42 | Planta 3: sala del núcleo en su rectángulo original, con Dialga/Palkia y las recompensas. La escalinata sur baja al vestíbulo. |

Coordenadas: `puente_layout.js`, `cruce_layout.js` (fuente única del mapa, los eventos, las pruebas y el E2E); salas
ASCII en `content/events/b18_cruce_rooms.js`. Construcción: `puente_build.js`, `cruce_build.js`. Eventos:
`content/events/b18_{common,puente,genesis,cruce,nucleo}.js`. Entrenadores `content/trainers/b18.js`, encuentros
`content/encounters/b18.js`. Arte propio: `node tools/b18_assets.mjs [--preview]` (`assets/objects/eje_*.png`,
`b18_resonador.png`, `b18_cadena.png`, `b18_aerodeslizador.png`, `b18_objetos.png`).

## Entradas, salidas y vecinos

| desde | casilla | a | notas |
|---|---|---|---|
| `senda_mirador` columna | (20,48) | `puente_convergencia` (20,1) | Entrada a la planta 1. |
| `puente_convergencia` norte | x 18–22, y 0 pulsando arriba | `senda_mirador` (20,49) | Warp de salida, fuera de la puerta. |
| `puente_convergencia` sur | x 19–21, y 59 pulsando abajo | `mirador_sur` (B17), misma x, y 1 | Warp de salida. Vallado de Genesis en (18..22,53) y barrera de B17 hasta `p9_restored`. |
| `mirador_sur` norte | x 19–21, y 0 pulsando arriba | `puente_convergencia`, misma x, y 58 | Conserva el paso entre ambos Miradores y los eventos de Grieta postgame. |
| `puente_convergencia` boca (20,41) | empujar hacia arriba desde (20,43) | `camara_cruce` (10,13) | Sellada por la Cadena Sintética (evento en (20,42)) hasta `b18_irrupcion`. |
| `camara_cruce` escalinata del vestíbulo | x 9–11, y 14 pulsando abajo | `puente_convergencia` (20,43) | |
| salas | dintel de cada sala (warp en el hueco, se empuja desde la casilla X) | escalinata de la sala siguiente | Vestíbulo (7,4) → Caída (10,36); Caída (8,23) → Río (28,16); Río (24,4) → Cruce (28,38). Cruce (27,23) sube a `camara_cruce_nucleo` (48,18). |
| atajo | vestíbulo (13,4) | `camara_cruce_nucleo` (48,18) | Sellado (`atajo_sellado`) hasta `b18_nucleo_visto`. |
| núcleo, escalinata sur | x 47–49, y 19 pulsando abajo | `camara_cruce` (13,5) | Regreso al vestíbulo, fuera del warp del atajo. |

## Secuencia y flags (`content/events/b18_common.js`)

| paso | flags / vars |
|---|---|
| Llegada: Alerce con el catalejo; relojes desfasados; «Olmedo reúne a la Policía Regional en la Senda» | `b18_llegada` |
| Tres zócalos del tramo central (tipo `rebuildGap` de B16 con `flag`, `tutorial`, `onRebuilt`), desde el borde norte | `b18_tramo_1..3`; el tercero: `b18_puente_entero` (Alerce pasa al borde de la plataforma) |
| Casia intercepta (franja y 32, x 12–28): combate de guion (`bossBattle`, reintento en (20,31)); Alerce cura | `b18_casia_intro`, `b18_casia`, `b18_cura_1` |
| Garrido (franja y 35, x 10–30), reintento en (20,34); Alerce cura | `b18_garrido_intro`, `b18_garrido`, `b18_cura_2` |
| Vértice en el Resonador: «Él te enseñó a escuchar. ¿Quién crees que le enseñó a él?» y combate (reintento en (20,45)) | `b18_vertice_frase`, `b18_vertice` |
| Sobrecarga, la Cadena Sintética se parte, Dialga y Palkia irrumpen en la Cámara | `b18_resonador_roto`, `b18_irrupcion` |
| Gael por el borde sur; «Ven conmigo. Tú sabes lo que es esperar.» / «No voy a pedirle permiso a nadie. Tampoco a usted.»; Vértice se va en el aerodeslizador y se le cae el cuaderno | `b18_gael`, `b18_vertice_huye` |
| Olmedo detiene a Casia y a Garrido; Gael recoge el cuaderno y se va; Alerce cura antes de bajar | `b18_detenidos`, `b18_cuaderno`, `b18_escena`, `b18_cura_3` |
| Cámara: llegada; tutorial del primer cristal (Zygarde); salas superadas | `b18_camara_llegada`, `b18_cristal_tutorial`, `b18_sala_1..3`, var **`cadena_eje`** (`time` \| `space`) |
| Núcleo: llegada (se abre el atajo); verso IX antes de elegir | `b18_nucleo_visto`, `verse_9` |
| Elección con confirmación explícita («¿Estás seguro/segura de tu elección?») | var **`p9_choice`**, var `p9_chosen_caught` = false, var `b18_elegido_descanso` = −1 |
| Combate con el elegido (nivel 65; captura solo por debajo del 50 % de PS; aviso antes). Perder: entrada de la Cámara (10,13) con el equipo curado y la elección conservada | var `b18_elegido_derrotas` |
| Victoria (captura o derrota): eje atado, `restorePillar(9)` (Fragmento 9), el no elegido se va y deja su orbe, Cadena templada, relojes y Sima, inscripción → T15 | `b18_eje_atado`, **`p9_restored`**, `b18_cadena_templada`, `b18_inscripcion` (+ `openClue('T15')`) |
| Debilitado sin capturar: reaparece junto al núcleo tras descansar (var `rest_count` > `b18_elegido_descanso`), tantas veces como haga falta | `b18_elegido_descanso`; captura → `p9_chosen_caught` = true |
| Orbe del no elegido (Dialga elegido → `LUSTROUSORB` Lustresfera; Palkia elegido → `ADAMANTORB` Diamansfera) | `b18_orbe` |
| Despedida en el Puente (Alerce y Olmedo: relojes sincronizados, la Sima ya no se abre); si se vuelve por otro lado (campamento, Senda) Alerce se acerca andando y vuelve a su posición | `b18_despedida` |
| Con la Tabla Draco (B19, `b19_tablilla`) Alerce espera en la Calzada del Rey: Alerce, Olmedo y el agente dejan el Puente (la despedida ya no salta) | — |

## Cámara del Cruce: tensión de ejes (`src/world/axis`, docs/ARCHITECTURE.md §22)

En cada sala hay cristales de cambio (sólidos): con la Cadena Roja se tensa hacia **Dialga (tiempo)**: los escombros
que caen se quedan en el aire y se pisan, las corrientes de luz se vuelven cristal pisable, los pliegues se cierran; o
hacia **Palkia (espacio)**: los pliegues (pares de marcas violetas) llevan de una marca a la otra y todo vuelve a
moverse. Caer (escombro que cae, corriente que desemboca en el vacío, tensar hacia Palkia encima de un escombro) devuelve
a la entrada de la sala, sin daño. La tensión se guarda en la partida (`cadena_eje`) y tiñe el mapa.

| sala | rejilla (esquina) | qué enseña | solución más corta desde E sin tensar |
|---|---|---|---|
| Vestíbulo | 13×7 en (4,5) | el tiempo (franja de escombros ante la puerta); estela Unown en (12,12), se lee desde abajo | 9 pasos, 1 tensión (tiempo) |
| (1) Caída | 13×11 en (4,24) | escombros (tiempo) hasta una isla y un pliegue (espacio) hasta la salida; `MAXREVIVE` (16,29) | 13 pasos, 2 tensiones |
| (2) Río | 13×10 en (22,5) | llegar a la orilla del pliegue con el espacio tensado dejándose llevar por la corriente; el río norte se cruza congelado; `PPMAX` (25,9) | 27 pasos, 2 tensiones |
| (3) Cruce | 15×13 en (21,24) | combina las dos: escombros → isla → corriente → pliegue → escombros; `TIMERBALL`×3 (35,32) | 28 pasos, 3 tensiones |

Todas las salas pasan `axisTraps(room) === []` (ningún estado alcanzable deja al jugador sin volver a la entrada ni sin
llegar a la salida, con cualquier eje) y Caída, Río y Cruce no se resuelven sin uno de los dos ejes
(`solvableWithout`). El núcleo (17×18 en (40,2)): Dialga (43,9) al oeste, Palkia (53,9) al este, núcleo (48,9) (se usa
desde (48,10)), el elegido baja a (48,7), el orbe queda en (51,12), placa Unown en (47,4).

## Entrenadores, encuentros y objetos

- Casia (Reuniclus 62, Magnezone 61, Beheeyem 61, Hatterene 62), Garrido (Conkeldurr 62, Rhyperior 62, Tinkaton 61,
  Houndoom 63 con Houndoomita, Megaaro), Vértice (Magnezone 64, Porygon-Z 65, Hydreigon 65, Metagross 66, Alakazam 67
  con Alakazamita, Megaaro; BGM `CombateGiovanniFinal`). Dinero de BALANCE (comandantes 80, Vértice 120).
- Técnicos del Resonador (visión 4, hasta la escena): Braulio (11,40) Magnezone 60, Bronzong 61; Irene (29,40)
  Porygon2 60, Drapion 60, Duosion 61.
- Encuentros «Sima del Eje» (POKEDEX_DISTRIBUCION §7.3, cueva 60–65): el Rellano y la plataforma del Puente y las salas
  de la Cámara. Sin células.
- Objetos: Puente `ULTRABALL`×2 (28,10), `MAXPOTION` oculto (12,11), `RARECANDY` (18,26, segundo estribo),
  `FULLRESTORE` (29,44), `DUSKBALL`×3 (22,52); Cámara: los de las salas. Buhonera en el Rellano (Poké Balls y
  curaciones). Tienda de Alerce: descansar (campamento) y punto de cura.

## Pruebas rápidas

Base `B` = `party=GARCHOMP:90,METAGROSS:88,TYRANITAR:88,LUCARIO:88&fragments=8&noenc=1&time=13&core=1&zygarde=all&zform=complete&zcells=100&zcores=5&items=REDCHAIN,MASTERBALL:3&vars=starter:TURTWIG,gael_starter:LITTEN&flags=b01_dex_received,b01_left_town,b02_libreta,p1_restored,p2_restored,p3_restored,p4_restored,p5_restored,p6_restored,p7_restored,p8_restored,verse_8,zyg_10,zyg_50,zyg_complete,zyg_core_2,zyg_core_3,zyg_core_4,zyg_core_5,zyg_dive,zyg_rebuild_tutorial,b15_n5,b16_hito,b17_vigilia&debug`

- Llegada al Puente: `http://localhost:8080/?scene=map&map=puente_convergencia&x=20&y=1&dir=2&` + `B`
- Plataforma (Casia, Garrido, Vértice): `…&map=puente_convergencia&x=20&y=29&dir=2&` + `B` añadiendo
  `,b18_llegada,b18_tramo_1,b18_tramo_2,b18_tramo_3,b18_puente_entero` a `flags`
- Boca de la Cámara (tras la escena): `…&map=puente_convergencia&x=20&y=43&dir=8&` + `B` añadiendo los anteriores y
  `,b18_casia,b18_garrido,b18_vertice,b18_resonador_roto,b18_irrupcion,b18_gael,b18_vertice_huye,b18_cuaderno,b18_detenidos,b18_escena`
- Núcleo: `…&map=camara_cruce_nucleo&x=48&y=18&dir=8&` + lo anterior con `,b18_camara_llegada,b18_cristal_tutorial,b18_sala_1,b18_sala_2,b18_sala_3` y `vars=cadena_eje:time`
- Una sala suelta: `…&map=camara_cruce&x=10&y=36&dir=8&` (Caída), `x=28&y=16` (Río), `x=28&y=38` (Cruce)

Comprobaciones: `node --test tests/b18_axis.test.mjs tests/b18_content.test.mjs tests/b18_scenes.test.mjs
tests/b18_reach.test.mjs tests/b18_vertical.test.mjs`, `node tools/validate_content.mjs`. Recorrido completo: `node tools/e2e_b18.mjs
[--from=<tramo>] [--only=<tramo>] [--to=<tramo>] [--no-retry]`, tramos `exterior puente genesis cruce nucleo reaparece guardado_postgame`
(capturas `tools/cache/screens/e2e_b18_*`, transcripción `e2e_b18_dialogos.txt`). En la Cámara el E2E juega cada sala con
el plan del solucionador y comprueba tras cada acción que el jugador está en la casilla y con el eje que dicen las reglas.

## Coordinación

- Cambios mínimos y aditivos fuera del bloque: `world/gameMap.js` (`voidBlocks` + `isVoid`), `world/eventTypes.js`
  (registra `AXIS_EVENT_TYPES`), `render/panorama.js` (shader `sima`). Nuevo y genérico: `world/axis/*` (B20 ya lo usa en
  el tramo 9 de la Senda del Origen con su variable `b20_t9_eje`).
- B17: los extremos del tablero se conectan por warps y conservan los dos sentidos. Las dos barreras del
  tramo sur (el vallado de B18 y la barrera del estribo de B17) se abren con `p9_restored`. El anillo del Mirador Sur
  (B17, (23,2)) es, según Alerce en la llegada, el colector de las torres; el resonador que usa Vértice está en la
  plataforma. Sugerencia para B17 (su carpeta): el anillo sigue zumbando hasta `p9_restored`; tras
  `b18_resonador_roto` podría mostrarse apagado.
- B19/B21/B22: `p9_choice`, `p9_chosen_caught`, `LUSTROUSORB`/`ADAMANTORB` (reencuentro en Columna Lanza); `b18_cuaderno`
  (Gael tiene el cuaderno de Vértice); `b18_vertice_huye` (Vértice sale de Axis en el epílogo).
- Líneas de canon literal: «Él te enseñó a escuchar. ¿Quién crees que le enseñó a él?», «Ven conmigo. Tú sabes lo que es
  esperar.», «No voy a pedirle permiso a nadie. Tampoco a usted.», «La última tabla está donde el rey trabajó.» (T15).
- Textos DECIDIDO-DEV a revisar por el autor: llegada de Alerce (relojes, Olmedo, la tienda y la buhonera), líneas de
  Zygarde, intros y derrotas de Casia, Garrido y Vértice (salvo la línea de canon), técnicos (Braulio e Irene) y sus
  frases, la sobrecarga y la irrupción, Olmedo (detención, «Primero el Laberinto y ahora esto…» —sin «Otra vez tú», que es su línea de canon del
  epílogo—, «…Ese chico…»), el cierre de Alerce, textos
  de la Cámara (estelas, cristales, tutorial, rótulos de las salas, atajo), del núcleo (elección, aviso de captura,
  retirada del no elegido, «una promesa», Cadena templada) y la despedida (relojes sincronizados).
- El reencuentro en Columna Lanza se integra mediante B22a, conservando elección y orbe. Si el autor quiere otra música para el
  combate del elegido, `MUSIC.legendary` en `b18_common.js`.
