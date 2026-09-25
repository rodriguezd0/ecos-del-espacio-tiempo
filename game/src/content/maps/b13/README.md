# Bloque 13 — Interludio 6: Estación Talasa, Islote Lumbre y Volcán Tizón

Guion: `docs/CAMPANA.md` «B13», §1.4 (Mar del Sur, Talasa, Lumbre, Tizón), §2.1 y §2.4 (Buceo, N4), §2.3 (C057–C063,
C065–C067, C087), §2.6 (reintentos), §5.2–5.5 (Vértice, Casia, Garrido, Alerce). `docs/TABLILLAS.md` T11 y T12.
Encuentros: `docs/POKEDEX_DISTRIBUCION.md` §7.3 (`content/encounters/b13.js`). Dinero: `docs/BALANCE.md`.
Entrada: `p6_restored` + `zyg_50` (Nadar). Salida: flag `b13_talasa` (despedida en el embarcadero).
**Fuentes únicas de coordenadas:** `mar_layout.js`, `talasa_layout.js`, `lumbre_layout.js`, `tizon_layout.js`,
`tizon_cueva_layout.js`; interiores en sus eventos (`GREENHOUSE`, `OFFICE`, `LAB`, `CRATER`, `LUMBRE.GROTTO`).

## Mapas

| id | Archivo | Tamaño | TS | Notas |
|---|---|---|---|---|
| `mar_del_sur` | `mar_del_sur.js` + `mar_layout.js` + `mar_build.js` | 190×50 | 1 | Mar abierto: bancos de arena, farallones, escollos (dos barreras con paso camino de Talasa), islas de basalto, boyas-farolillo hacia Lumbre (de noche, encendidas), aviso del Arrecife del Eco, 6 nadadores/marineros, C057, C058, C061, C062, C065, C066 |
| `estacion_talasa` | `estacion_talasa.js` + `talasa_layout.js` + `talasa_build.js` | 40×40 | 5 | Plataforma del Consorcio sobre pilotes: pantalán, cubiertas N/O/S/E con barandillas, paso del control (técnico), compuerta de la cubierta sur (consola del invernadero), torre de dirección, laboratorio sellado (tarjeta), dársena con escalerilla y remolino (Buceo), C059 (ante el laboratorio), C060 |
| `talasa_invernadero` | `talasa_invernadero.js` | 20×15 | 4 | Tanques de cultivo de Solosis, investigadora Amaia (entrenadora; hasta vencerla no deja usar la consola), consola de la compuerta |
| `talasa_despacho` | `talasa_despacho.js` | 15×11 | 4 | Foto del «Proyecto Laguna» (rostro rascado, cuaderno verde; «Alerce no se gira.»), tarjeta de dirección en la mesa, terminal y archivadores metálicos contra la pared del fondo (piezas de Interior1 sin stamp: `INTERIOR_PIECES`), Alerce de espaldas en los archivadores |
| `talasa_laboratorio` | `talasa_laboratorio.js` | 26×17 | 4 | Tanque de presión «Muestra Z-4», Casia y Garrido, pantalla de Vértice |
| `talasa_pilotes` | `talasa_pilotes.js` | 40×40 | 15 | Fondo bajo la plataforma (mismas coordenadas que la superficie): C087, dos respiraderos, objetos |
| `islote_lumbre` | `islote_lumbre.js` + `lumbre_layout.js` + `lumbre_build.js` | 24×24 | 9 | Cerezos, farolillos, corro de 8 piedras, Clefairy de noche, peña de la luna, banco para descansar, barca de Lucía, Dama Hortensia |
| `lumbre_gruta` | `lumbre_gruta.js` | 18×15 | 14 | Gruta de la luna: Lucía dormida, pedestal con la Tabla Duende, C063 |
| `volcan_tizon` | `volcan_tizon.js` + `tizon_layout.js` + `tizon_build.js` | 40×50 | 5 | Playa al oeste, caserío de la forja (Brasa, herreros, fragua, yunques), dos terrazas de ceniza, bocamina; C067 |
| `tizon_casa` | `tizon_casa.js` | 13×11 | 4 | Casa de Brasa: cama (descansar), arcón del crisol, el abuelo |
| `tizon_cueva` | `tizon_cueva.js` + `tizon_cueva_layout.js` | 40×50 | 13 | Vestíbulo (técnica Olaia) y tres galerías de coladas unidas por túneles (warps en el mismo mapa); `noSwim`, oscura |
| `tizon_crater` | `tizon_crater.js` | 40×50 | 13 | Cráter: lago de magma, sonda y jefa de perforación, vieja fragua de piedra (Tabla Llama), cráter frío con costra (postgame) |

Arte propio (PROVISIONAL): `node tools/b13_assets.mjs` → `assets/objects/b13_*.png` (barca, tanque, pantalla, cultivo,
foto, tablilla, piedra del baile, farolillo, peña de la luna, obsidiana, respiradero, colada, sonda, fragua, compuerta,
pilote). Filas = estados (ver comentario del generador).

## Enlaces y puertas

| Desde | Casilla / borde | Hacia |
|---|---|---|
| `mar_del_sur` borde norte | x 0–35 · 36–125 · 126–189 | `caleta_sonda` (offset 0), `ruta_15` (36), `ciudad_nexo` (126); vuelta `south` con offsets 0, −36, −126 (`maps/b09b/links.js`) |
| `mar_del_sur` borde sur | x 20–43 · 76–115 | `islote_lumbre` (20), `estacion_talasa` (76); vuelta `north` −20, −76 |
| `mar_del_sur` borde este | y 0–49 | `volcan_tizon` (0); vuelta `west` 0 |
| `estacion_talasa` | pantalán x 19, y 3–9; llegada (18–20,10) | se desembarca nadando en (19,3) |
| `estacion_talasa` puertas | invernadero (9,26) · torre (32,32) · laboratorio (30,23) (evento sellado: tarjeta) | `talasa_invernadero` (9,13) · `talasa_despacho` (6,9) · `talasa_laboratorio` (12,15) |
| `estacion_talasa` dársena | escalerilla (14,18) → agua; remolino (20,23) | `talasa_pilotes` (20,23) (Buceo, punto equivalente); se emerge en la dársena (x 15–24, y 17–29) o al norte de la plataforma (x 4–35, y 5–8) |
| `islote_lumbre` peña de la luna | (11,18), abierta tras el baile; la boca da a la playa del sur (se entra desde (11,19); el cuerpo de la roca, x 10–12 y 16–17, no se pisa) | `lumbre_gruta` (9,12); salida (9,13) → islote (11,19) ↓ |
| `volcan_tizon` bocamina | (21,4) | `tizon_cueva` (30,46); salida (30,47) → (21,6) |
| `volcan_tizon` casa de Brasa | (14,38) | `tizon_casa` (6,9) |
| `tizon_cueva` túneles | vestíbulo (24,45) ↔ sala 1 (18,43)/(19,43) · sala 1 (11,37) ↔ sala 2 (8,30)/(7,30) · sala 2 (20,20) ↔ sala 3 (10,14)/(9,14) | mismo mapa |
| `tizon_cueva` salida norte | (28,3) | `tizon_crater` (20,44); vuelta (20,46) → cueva (28,5) |

Casillas de reintento (§2.6, `bossBattle`): laboratorio (12,14) ↑ junto a la puerta, con Alerce a la derecha (hablar
con él, Casia o Garrido repite el doble con el equipo curado); cráter (20,25) ↑ (hablar con la jefa).

## Historia (flags `b13_*`, `content/events/b13_common.js#F`)

| Paso | Dónde | Pone |
|---|---|---|
| Aviso del Core en el muelle de buzos antes de N4 | `caleta_sonda` (22,30) | `b13_buceo_pista` |
| Llamada de Alerce (menciona los planos si `b11_planos_talasa`) | al entrar nadando en el mar | `b13_mar_llamada` |
| Alerce llega en barca: «Esta vez voy yo.» (Nilo en la barca si `b11_nilo_desertor`) | embarcadero (18–20,10) | `b13_talasa_llegada` |
| Técnico del control (paso al oeste), investigadora y consola | cubierta N (8,14); invernadero | `b13_talasa_invernadero` (compuerta abierta) |
| Foto del «Proyecto Laguna» y tarjeta de dirección | despacho | `b13_talasa_foto`, `b13_talasa_tarjeta` |
| Casia y Garrido; doble con Alerce (Probopass 50, Bronzong 50, Gastrodon 51, Porygon2 52); escena clave a mitad del combate (fase de diálogo al caer el primer Pokémon de Casia) | laboratorio | `b13_talasa_lab_dentro`, `b13_talasa_combate` |
| Alerce abre el tanque sin mirar; Vértice en pantalla (Líder Supremo); N4 se une | laboratorio | `zyg_core_4`, `b13_talasa_n4` |
| Despedida al atardecer (19:10): Porygon 40 de Nilo (si desertó), «Llamé a Gael…» «…Ha dejado de contestar.» | embarcadero | `b13_nilo_porygon`, `b13_alerce_gael`, **`b13_talasa`** |
| Resonancia del Buceo (con N4): burbuja; con 70 células y N1–N4 se activa el Buceo | `caleta_sonda` (22,30) | `b13_dive_resonance`, `b13_buceo_escena`, `zyg_dive` |
| T11: Ramón (segunda pista, con Nadar) | Faro Sonda | `b13_t11_ramon`, T11 paso 2 |
| T11: llegada al islote (descubrimiento directo), de noche el corro enseña el baile (8 pasos), la peña se abre | Islote Lumbre | `b13_t11_islote`, `b13_t11_baile` |
| T11: Lucía, Tabla Duende | gruta | `b13_t11_lucia`, `b13_t11_tablilla`, PIXIEPLATE |
| T11: fiesta de los farolillos (21:00): Clefablita y la pista del P7 («las luces de la ciudad hundida»); al acabar, fundido y Ramón y Lucía vuelven al faro | playa de Caleta (el jugador aparece en (22,23)) | `b13_t11_fiesta` |
| T12: llegada (descubrimiento directo), Brasa (segunda pista) | caserío | `b13_t12_llegada`, `b13_t12_brasa` |
| T12: tres galerías de coladas; cada respiradero se reabre a mano | cueva | `b13_colada_<n>` (var), `b13_t12_respiradero_<n>`, `b13_t12_respiraderos` |
| T12: jefa de perforación Maite (combate de guion) y Tabla Llama en la vieja fragua | cráter | `b13_t12_jefa`, `b13_t12_tablilla`, FLAMEPLATE |
| T12: la forja arde; crisol «que ningún fuego funde»; Houndoomita | Brasa | `b13_t12_forja` |

Reglas de puzles: `content/events/b13_dance_logic.js` (baile; pisar una piedra apagada que no toca reinicia sin
castigo, pisar una ya encendida no cuenta; hace falta ver la demostración del Clefairy del centro) y `b13_lava_logic.js`
(un bloque empujado a la BOCA de una colada la tapona y la colada entera se enfría; no entra en lava corriente ni en las
casillas de llegada de los túneles, `keep`, para que ningún empujón deje al jugador encerrado; las salas sin resolver se
reinician al salir de ellas; `tests/b13_content.test.mjs` recorre todos los estados de cada sala). Reintento: descanso en
el banco del islote o la cama de Brasa.

## Coordinación con otros bloques

- **B14 (Fondo del Mar del Sur)**: `fondo_mar_sur` (180×50) usa las mismas coordenadas que el mar; `mar_del_sur` declara
  `dive: { map: 'fondo_mar_sur' }` solo si está registrado y pone remolinos sin destino fijo en `WHIRLPOOLS`
  (los puntos donde B14 pone sus haces de subida). El mar mide 190 de ancho: las 10 columnas del este (x 180–189) no
  tienen fondo (`divePoint` daría una casilla fuera de su mapa; allí no hay remolinos).
- **B09b**: `links.js` fija los offsets del mar (antes `null`); `caleta_sonda.js` y `caleta_faro.js` añaden los eventos
  de `b13_caleta.js` (resonancia, fiesta, Ramón B13, Lucía en el faro) sin cambiar los suyos.
- **Atlas** (`ui/logic/regionMapData.js`, sin tocar): es esquemático y sigue el dibujo de CAMPANA §1.2, que pinta el
  mar a la derecha de la costa; conserva el orden de sectores (Lumbre oeste, Talasa centro, Tizón este), aunque el
  islote quede a la derecha de Nexo en la ilustración. No se cambia (es de otro propietario y no afecta al juego).
- El **Bastión Axis** (sector este del mar, CAMPANA §1.3) es de postgame (B22): aquí no se construye ni se enlaza.

## Pruebas

- `node --test tests/b13_reach.test.mjs tests/b13_content.test.mjs` · `node tools/validate_content.mjs`
- `node tools/pass_ascii.mjs <id>` · `node tools/preview_map.mjs <id> --pass`
- Recorrido: `node tools/e2e_b13.mjs [--from=mar|talasa|caleta|buceo|lumbre|tizon] [--only=<tramo>] [--no-retry]`

URLs (servidor en `http://localhost:8080`; `B` = `&party=GARCHOMP:78,METAGROSS:76&fragments=6&zygarde=run,ram,terrain,climb,swim&zcells=56&zcores=3&noenc=1&debug&flags=p1_restored,p2_restored,p3_restored,p4_restored,p5_restored,p6_restored,zyg_10,zyg_50,b11_planos_talasa,b11_nilo_desertor`):

- Muelle de buzos (entrada del bloque): `/?scene=map&map=caleta_sonda&x=22&y=28&dir=2` + `B`
- Talasa, en el pantalán: `/?scene=map&map=estacion_talasa&x=19&y=4&dir=2` + `B` + `,b13_mar_llamada`
- Laboratorio (con tarjeta): `/?scene=map&map=estacion_talasa&x=30&y=24&dir=8` + `B` + `,b13_mar_llamada,b13_talasa_llegada,b13_talasa_invernadero,b13_talasa_tarjeta`
- Islote de noche: `/?scene=map&map=islote_lumbre&x=11&y=6&dir=2&time=22` + `B`
- Tizón: `/?scene=map&map=volcan_tizon&x=9&y=36&dir=6` + `B`; cueva: `/?scene=map&map=tizon_cueva&x=30&y=46&dir=8` + `B`
- Buceo en la dársena: `/?scene=map&map=estacion_talasa&x=14&y=18&dir=6&zcores=4` + `B` con `zygarde=…,dive`
