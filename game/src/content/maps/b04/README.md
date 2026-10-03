# Bloque 4 — Pilar de la Corriente (P2): Ruta 3, Garganta del Albo y Escalera de Estanques

Guion: `docs/CAMPANA.md` B04 (+ §1.3–1.4, §2.3, §2.6, §3.1, §5.1), `docs/TABLILLAS.md` T02 (segunda pista) y T03
(apertura), `docs/POKEDEX_DISTRIBUCION.md` §7.1 (curva) y §7.3 («Ruta 3 y Garganta del Albo», «Pilar de la
Corriente»). Coordenadas en casillas (x → derecha, y → abajo). Fuentes únicas de coordenadas: `*_layout.js`.

Decisión vertical del creador (26-09): tres pisos exactos, con los cuatro entrenadores opcionales en el primero,
la Escalera de Estanques intacta en el segundo y Leandro/núcleo en el tercero. `pilar_corriente_floors.js` fija los
pisos nuevos. La isla del puzzle es ahora un rellano de ascenso, accesible al cerrar el ciclo. Los IDs de células,
flags, variables de agua, equipos y recompensas se conservan; al entrar a la base se copian las victorias de
entrenadores guardadas en el mapa antiguo.

## Mapas

| id | Archivos | Tamaño | TS | Notas |
|---|---|---|---|---|
| `ruta_3` | `ruta_3.js` + `ruta_3_layout.js` | 40×50 | 1 | Ribera en tres niveles con el Albo y sus cascadas, muelle, 3 cuestas de grava (`gravelSlope`: solo montado en el 10 %), mirador. Rehecha el 26-09 (`FORESTS` en el layout: bosques enteros por nivel, nunca sobre caras de terraza; cuestas despejadas; ramal al muelle; las terrazas siguen tras el borde oeste) |
| `garganta_albo` | `garganta_albo.js` + `garganta_albo_layout.js` | 40×40 | 1 | Desfiladero entre paredes de roca (`acantilado`, con cara visible en y 22–24 donde la roca retrocede) y repisas de hierba con pinos, Poza del Albo e islote, gran cascada y cornisa (Trepar), cascada pequeña y repisa, molino abandonado, esclusa de cabecera, 3 balizas del Consorcio, puerta del Pilar. El fondo de ambas orillas en x ≤ 15, y ≥ 34 es bosque: la Ruta 3 solo cubre el sur de x ≥ 8 y así la cámara nunca enseña su esquina vacía |
| `gruta_albo` | `gruta_albo.js` | 33×19 | 2 | Gruta lateral (sala irregular), montañero, 3 objetos. Encuentros de cueva 13–18 |
| `pozo_albo` | `pozo_albo.js` | 26×20 | 15 | Fondo submarino de la Poza (Buceo, etapa G): C085, respiradero, encuentros de Buceo 45–50 |
| `pilar_corriente_base` | `pilar_corriente_base.js` + `_floors.js` | 27×30 | 15 + kit Pilar | Piso 1: Bruno, Marta, Tomás e Inés; entrada y salida |
| `pilar_corriente` | `pilar_corriente.js` + `_layout.js` + `_tiles.js` + `_build.js` | 40×40 | 15 + kit Pilar | Piso 2: E1–E6, compuertas C1–C4, noria, reinicio, foso y rellano de ascenso. Tinte `pilarTone('P2')` |
| `pilar_corriente_nucleo` | `pilar_corriente_nucleo.js` + `_floors.js` | 27×30 | 15 + kit Pilar | Piso 3: Leandro, núcleo, estela del verso e inscripción |

Arte propio PROVISIONAL de `node tools/b04_assets.mjs` → `assets/objects/b04_noria.png` (dir 2 gira · 4 enganchada ·
6 suelta · 8 parada), `b04_compuerta.png` (2 cerrada · 4 abierta con agua), `b04_mando.png` (mandos/palancas) y
`b04_baliza.png` (baliza de resonancia con pulso). Prefijo `b04_` para no pisar el arte de B03 (`noria.png`, `compuerta.png`).

## Enlaces

| Desde | Casillas | Hacia | Estado |
|---|---|---|---|
| `ruta_3` este | y 32–34, `offset 29` | `ciudad_caudal` oeste (B03, sendero y 3–5, `offset −29`) | activo (`pending_links.js`; si Caudal no estuviera registrado: aviso y la escena de las gracias a las puertas de la ciudad) |
| `ruta_3` norte | x 8–11, `offset −8` | `garganta_albo` sur (x 16–19, `offset 8`) | activo |
| `garganta_albo` puerta del Pilar | warp (26,9), al pie de la columna; cerrada hasta `b04_choque` | `pilar_corriente_base` (13,24) ↑ | activo |
| `pilar_corriente_base` salida | warp (13,25) | `garganta_albo` (26,10) ↓ | activo |
| `pilar_corriente_base` escalera norte | warp (13,6) | `pilar_corriente` (20,37) ↑ | activo |
| `pilar_corriente` salida | warp (20,38), `dirTrigger 2` | `pilar_corriente_base` (13,8) ↓ | activo |
| `pilar_corriente` escalera central | warp (20,18) | `pilar_corriente_nucleo` (13,23) ↑ | ciclo completo o Pilar restaurado |
| `pilar_corriente_nucleo` salida | warp (13,25) | `pilar_corriente` (19,16) ↑, al lado del puente | siempre |
| `garganta_albo` boca de la Gruta | warp (7,32), `dirTrigger 4` | `gruta_albo` (24,14); vuelta desde el felpudo (24,15) pulsando abajo (`dirTrigger 2`) → (7,32) | activo (la boca de luz del recorte, fila 16, no es transitable) |
| `garganta_albo` remolino (13,9) | `diveSpot` (Buceo) | `pozo_albo` (6,10); superficie en (6,10) → remolino | activo con Buceo (etapa G) |

## Células (CAMPANA §2.3, `content/zygarde/cells.js`)

| Código | Clave | Mapa (casilla) | Etapa | Dónde / cómo |
|---|---|---|---|---|
| C016 | `cell_ruta_3_1` | ruta_3 (23,28) | B | cuesta de grava 1 (montado) |
| C017 | `cell_ruta_3_2` | ruta_3 (14,10) | B | cuesta de grava 2 (montado) |
| C018 | `cell_ruta_3_3` | ruta_3 (36,7) | B | cuesta 3, subida al mirador (montado) |
| C019 | `cell_garganta_1` | garganta_albo (9,21) | B | repisa de la cascada pequeña (cuesta de grava oeste) |
| C020 | `cell_garganta_2` | garganta_albo (15,18) | B | junto a la rueda del molino abandonado |
| C021–C023 | `cell_corriente_1..3` | pilar_corriente (20,7) · (20,29) · (7,9) | B | fondos de E1, E4 y E6 (solo con el estanque vacío) |
| C055 | `cell_garganta_3` | garganta_albo (15,1) | E | cornisa de la gran cascada (Trepar: pared (15,6) → (15,3)) |
| C069 | `cell_garganta_4` | garganta_albo (10,11) | F | islote de la Poza (Nadar) |
| C085 | `cell_garganta_5` | pozo_albo (21,8) | G | fondo del pozo (Buceo). **Mapa cambiado en el registro** a `pozo_albo` |

## Escenas y flags (`content/events/b04_*.js`)

| Escena | Dónde | Condición | Pone |
|---|---|---|---|
| El Core nota las balizas | garganta_albo, llegada (17,38) | — | `b04_garganta_llegada` |
| Técnicos Ribas / Noa / Salcedo + balizas | balizas (22,36), (30,22), (21,4) | combate ganado (si se pierde: curación normal, el técnico sigue ahí) | `b04_baliza_1..3`, var `b04_balizas`, objeto `RESONANCEBEACON` ×3, `b04_balizas_retiradas` |
| Leandro en la esclusa | (15,12) | hasta retirar las balizas | var `b04_leandro_esclusa` |
| Gael evacúa el barrio bajo (con Riolu) | ciudad_caudal (37,50) y (40,49), `evacuationEvents()` de `b04_caudal.js` | `b03_gael_b2` y sin `p2_restored` (frase distinta tras `b04_choque`) | — |
| Choque Gael / Leandro, se abre la puerta | acceso al Pilar (24–30,11) o al retirar la 3.ª baliza | `b04_balizas_retiradas` | `b04_choque` |
| Reto de Leandro («ver si sabes dónde pisas») | pilar_corriente, rellano (auto) | `b04_choque` | `b04_reto`; después, pistas por fase hablando con él |
| Escalera de Estanques | mandos C1 (24,33), C2 (36,7), C3 (16,4), C4 (3,6); noria (fondo E4, 20,27); reinicio (15,33) | — | vars `b04_compuertas`, `b04_noria`, `b04_agua`; `b04_ciclo` al cerrar el ciclo |
| La corriente llega al núcleo; suben las losas del puente | automática al cerrar el ciclo | `b04_ciclo` | paso a la escalera central; Leandro espera arriba |
| Combate con Leandro (Guardián) | piso 3 (al llegar o hablándole) | `b04_ciclo` | `b04_leandro_vencido` (si se pierde: cura y se le vuelve a hablar; var `b04_leandro_intentos`) |
| Restauración (verso II) + inscripción | piso 3, núcleo (13,11) | `b04_leandro_vencido` | `restorePillar(2)` → Fragmento 2, verso II, `p2_restored`; `advanceClue('T02', 2)`, `openClue('T03')`, `b04_inscripcion`, `b04_leandro_despedida` |
| Las gracias en la plaza + el inicial que nadie eligió | ciudad_caudal, plaza (auto al entrar) | `p2_restored` | `b04_gracias`, `b04_inicial` (inicial ni del jugador ni de Gael, nv 15) |

**Cambios en el mundo (`p2_restored`):** desaparecen los charcos del desbordamiento de Ruta 3 y Garganta
(`b04_flood.js`); vuelve la pesca en el Albo (antes, la tabla `fish_old` se retira del mapa); la esclusa de cabecera
queda abierta; pescador y montañera cambian de frase; el Pilar queda con la corriente en marcha y música propia.
**B03** (molinos de Caudal, charcos del Barrio bajo) y **B05** (vado de la Ruta 4) leen `p2_restored` en sus mapas.

**Reintentos sin pérdida (§2.6):** técnicos y entrenadores con la derrota normal (Centro Pokémon); Leandro es combate
de guion (`bossBattle` de `content/common/bossBattle.js`: sin cobrar, cura en la isla y se le vuelve a hablar); la Escalera no tiene fallo: la palanca de reinicio lo devuelve todo al estado inicial y, si el agua
sube con el jugador en un fondo, sale por la escalera más cercana. El puente del núcleo no vuelve a bajar tras el P2.
Tras el P2 la palanca de reinicio pasa a «mantenimiento» (se puede repetir el puzle; nada se pierde).

## La Escalera de Estanques (modelo)

Puro y probado en `content/events/b04_hydraulics.js`. Dos unidades de agua (E1 y E4 llenos al empezar). Compuertas:
C1 E1→E2 · (E2↔E3 comunicados, sin compuerta) · C2 E3→E4 · C3 E4→E5 · C4 E5→E6; noria E6→E1 con el engranaje
enganchado. Trinquete (DECIDIDO-DEV): C4 no se abre con la noria suelta y la noria no se suelta con C4 abierta (así el
agua nunca se «pierde» en E6). La solución de referencia de CAMPANA (C1+C2 → cerrar C2, abrir C3 → enganchar noria →
abrir C4 → abrir C2) funciona tal cual; la mínima del modelo es la misma sin el abrir/cerrar C2 de la fase 1
(C1 → C3 → noria → C4 → C2), que es lo que comprueba el test. `tests/b04_pilar.test.mjs` comprueba las 4 fases, que no hay trampas y que el
mapa construido conecta cada zona exactamente como el grafo en todos los estados del agua.

## Textos DECIDIDO-DEV (revisar)

Literales de CAMPANA marcados con «» en el código. Inventados: reto y reglas de Leandro en el rellano y sus pistas por
fase; líneas de Leandro en la esclusa, en el choque (además de los dos literales), en la isla (reto, victoria,
derrota) y en la plaza (discurso y agradecimiento); Gael tras el choque y en el barrio bajo; el aprendiz de la Casa de
las Esclusas mientras Leandro está fuera; frases del Core (balizas, puerta, Escalera, núcleo); inscripción junto al
verso: T02 «La segunda tabla gira donde el agua trabaja.» es LITERAL de TABLILLAS (segunda pista); T03 «La tercera
tabla llama al rayo desde lo alto.» es inventada, con el apunte de Leandro sobre Sixto; estela y placa del trinquete
(«— L. A., maestre»); técnicos, entrenadores, pescador Braulio, montañera, carteles; Alerce (salvo el literal).

## Pruebas rápidas

- Entrada del bloque (B01–B03 hechos): añadir a cualquier URL
  `&flags=prologue_seen,b01_starter_chosen,b01_dex_received,b01_left_town,p1_restored,zyg_10,b02_libreta,b03_caudal_llegada,b03_gael_b2&vars=starter:TURTWIG,gael_starter:LITTEN&party=GROTLE:22,STARAVIA:20,BUIZEL:19&core=1&zygarde=run&zform=10&fragments=1&debug`
- Ruta 3 desde Caudal: `http://localhost:8080/?scene=map&map=ciudad_caudal&x=1&y=4&dir=4` + lo anterior (tecla E: montar).
- Garganta: `?scene=map&map=garganta_albo&x=17&y=38&dir=8` + lo anterior.
- Pilar (tras el choque): `?scene=map&map=pilar_corriente&x=20&y=37&dir=8` + lo anterior con `,b04_balizas_retiradas,b04_choque` en `flags`.
- Núcleo con el ciclo cerrado: `?scene=map&map=pilar_corriente&x=20&y=12&dir=8` + lo anterior con
  `,b04_reto,b04_ciclo` en `flags` y `,b04_compuertas:15,b04_noria:1,b04_agua:6` en `vars`.
- Plaza (día siguiente): `?scene=map&map=ruta_3&x=37&y=33&dir=6` con `,b04_leandro_vencido,p2_restored,b04_leandro_despedida` y `fragments=2`.
- `node --test tests/b04_pilar.test.mjs` · `node tools/validate_content.mjs` · **recorrido completo**:
  `node tools/e2e_b04.mjs [--from=ruta3|garganta|pilar|nucleo|caudal]` (≈7 min desde la Ruta 3; capturas
  `tools/cache/screens/e2e_b04_*` y transcripción `e2e_b04_dialogos.txt`).

## Pendiente / notas para otros bloques

- C055 (Trepar), C069 (Nadar) y C085 (Buceo) se recogen al volver con esas capacidades (etapas E/F/G).
- La casa de Leandro en Caudal tras el P2 (`caudal_esclusas`) es de B03; molinos y vado, de B03/B05 vía `p2_restored`.
- Ediciones aditivas en B03: `maps/b03/ciudad_caudal.js` incluye `thanksEvents(CAUDAL_THANKS)` y
  `evacuationEvents()`; `maps/b03/caudal_esclusas.js` oculta a Leandro en su casa desde `b04_garganta_llegada` hasta
  `b04_gracias` (está en la esclusa de cabecera y luego en el Pilar) y el aprendiz lo explica.
- Desde la salida este de la Ruta 3 se ve negro por encima de Caudal (su fila 0 cae en la y 29 de la Ruta 3): si B03
  añade bosque en su borde norte-oeste, desaparece.
- `RESONANCEBEACON` (items_axis.json, bolsillo 8): objeto de historia, no vendible; quizá lo use un bloque de Genesis.
