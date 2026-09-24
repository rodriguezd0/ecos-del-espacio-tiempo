# Bloque 5 — Interludio 2: el Molino del Diezmo, Ruta 4 y Villa Brontia

Guion: `docs/CAMPANA.md` «B05», §1.3–1.4, §2.3, §3.1, §5.4 · `docs/TABLILLAS.md` T02 y T03 ·
`docs/POKEDEX_DISTRIBUCION.md` «Ruta 4» y «Villa Brontia, Ruta 5 y Meseta». Coordenadas en casillas (x → derecha,
y → abajo). Fuentes únicas: `ruta_4_layout.js`, `villa_brontia_layout.js`, `links.js`, `MILL`/`CANAL` en
`events/b05_t02.js`, `BELFRY` en `events/b05_t03.js` y `STATION` en `events/b05_t03_station.js`.

## Mapas

| id | Tamaño | TS | Notas |
|---|---|---|---|
| `ruta_4` | 80×30 | 1 | Vega del Albo con el **vado** (se construye seco, con orillas a ambos lados del paso; el evento `vado` aplica el río entero —`FORD_TILES`, capas 0 y 1, y los extremos del camino— hasta `p2_restored`), charcas, casa de labranza, dos terrazas (T1, T2) con escaleras hasta la meseta. BGM `Ruta 3` |
| `villa_brontia` | 44×40 | 1 | Calles en cruz, plaza con fuente, **campanario** (sprite propio), cerro de los **molinos** (sprites animados), corrales de Wooloo, borde sur de la meseta con escalera. BGM `PuebloMarengo`. `flyPoint` (4,14) |
| `brontia_centro` | 19×14 | 4 | `pokemonCenterMap` (services) |
| `brontia_tienda` | 15×12 | 4 | `shopMap` + Miel |
| `brontia_posada` | 15×12 | 4 | `innkeeperEvent({ storm: true })`: «Descansar hasta tormenta» (X25) |
| `brontia_casa_abril` | 13×11 | 4 | Antes del P3, solo la nota de Abril (acampa en el Anillo, B06); tras el P3, Abril de noche |
| `brontia_campanario` | 20×12 | 4 | Planta baja (Sixto, escombros de Embestida) y campanil (campana grande, cable cortado, Tablilla, Elekid) |
| `brontia_subestacion` | 19×13 | 4 | Tablero de 3×3 cajas y 12 interruptores, palanca general, operaria |
| `brontia_estacion` | 27×17 | 4 | Stamp `estacion_tren`; taquilla `stationEvent({ station: 'brontia' })` por el mostrador (x 19–21, y 7) |
| `molino_diezmo` | 30×12 | 4 | Sala de la muela (tren de engranajes, palanca del embrague, muela) y desván (puerta trasera) |
| `caudal_canal_alto` | 24×16 | 1 | Patio trasero del Diezmo: canal elevado, cuesta de grava (Correr) y la rueda dentada grande |

Arte propio del bloque (PROVISIONAL, D30): `node tools/b05_assets.mjs [--preview]` → `game/assets/objects/b05_*.png`
(molino de viento, campanario, rayo, engranajes, muela, cuadro de la subestación, hierba agitada, sacos, rueda
hidráulica —a derechas y al revés, con la corona de su eje—, campana grande, Tablillas en el suelo).

## Enlaces

| Desde | Casillas | Hacia | Notas |
|---|---|---|---|
| `ruta_4` oeste | x 0, y 14–15 | `ciudad_caudal` | `west`, offset −15 (Caudal `east` +15, `b03/pending_links.js`) |
| `ruta_4` este | x 79, y 4–7 | `villa_brontia` | `east`, offset −14 (Brontia `west` +14, calle y 18–21) |
| `villa_brontia` este | x 43, y 18–21 | `ruta_5` (B06) | **activo**: `east`, offset 0 ↔ Ruta 5 `west`, offset 0 (`maps/b06/pending_links.js`); probado en ambos sentidos |
| `villa_brontia` sur | x 20–24, y 39 (escalera) | `ruta_6` (B07) | **pendiente**: `south`, offset 7 → la Ruta 6 abre su norte en x 13–17 y conecta `north` con offset −7. **Vendavales** (polvo y viento, aviso y paso atrás en y 36) hasta `p3_restored` |
| `villa_brontia` norte | x 20–23, y 0 | `ruta_11` (B15) | **pendiente**: `north`, offset 7 → la Ruta 11 abre su sur en x 13–16 y conecta `south` con offset −7. **Hielo-eco** (bloques de hielo en y 0, aviso en y 1) hasta `p7_restored` |
| Caudal (14,35) puerta del Diezmo | → | `molino_diezmo` (7,10) | warp de B03; salida del molino (felpudo x 7–9, y 10) → Caudal (14,36) (`MOLINO_DOOR` en `links.js`) |
| `molino_diezmo` desván (22–23,4) ↑ | → | `caudal_canal_alto` (4,12) | puerta trasera; vuelta por la puerta (4,11) → desván (22,5) |
| Puertas de Brontia | Centro (4,13) · tienda (12,13) · Abril (30,8) · posada (4,30) · subestación (37,32) · estación (28,33) · campanario (25,15) | interiores | llegada al salir: la casilla de debajo |

Tren (tras P4): `world/transport.js` → `TRAIN` `brontia` con llegada (28,34) ↓, delante de la estación.

## Secuencia, flags y escenas

| Escena | Dónde | Condición | Pone |
|---|---|---|---|
| Anselmo (T02; la pista ya la abre B03 en la calle y B04 da la segunda; si faltan, descubrimiento directo) | `molino_diezmo` auto | `p2_restored && !b05_t02_anselmo` | `b05_t02_anselmo`, pista T02 |
| Ruedas dentadas | sacos (2,9) · desván (20,7) · canal alto (21,3) | — | `b05_t02_engranaje_p/m/g` |
| Tren de engranajes | huecos (4,4) (6,4) (8,4) | — | vars `b05_t02_hueco_N`, `b05_t02_sentido_N` |
| Embrague: los trinquetes frenan el giro al revés y la muela muele a derechas | palanca (12,6) | tren correcto | `b05_t02_eje_abierto` |
| Técnicos del Consorcio (18–20) y Darío | auto | eje abierto | vars `b05_t02_visita`, `b05_t02_tec_0/1`; `b05_t02_tecnicos`, `b05_t02_dario` |
| Tabla Linfa (SPLASHPLATE) | muela (8,8) | técnicos vencidos | `b05_t02_tablilla` (**el Diezmo muele**: la rueda de B03 lo lee con la Tablilla) |
| Roca de tutorial (Embestida) | Ruta 4 (70,24) | aviso del Core sin Embestida | `b05_r4_roca_vista` |
| Llegada a Brontia | franja x 1, y 18–21 | `!b05_brontia` | **`b05_brontia` (salida del bloque)** |
| Sixto (T03) | campanario (3,6) | — | `b05_t03_sixto`, pista T03 |
| Campana grande / cable cortado | campanil (15,5) / (12,5–6) | escombros rotos | `b05_t03_campanil` |
| Abril (segunda pista, si falta) | plaza (25,22) de día · su casa (7,7) de noche | **tras P3** (antes acampa en el Anillo, B06, que da la pista allí; en su casa solo hay una nota) | `b05_t03_abril`, pista T03 paso 2 |
| Operaria | subestación (4,8) | — | `b05_t03_operaria` |
| Circuito | palanca general (14,4) | camino válido | `b05_t03_circuito` |
| El rayo carga la red | `villa_brontia` auto | de noche con el circuito | `b05_t03_rayo`, **`b05_brontia_luz`** (luz a medias) |
| Horda de Elekid y Tabla Trueno (ZAPPLATE) | campanil (15,7) | tras el rayo | `b05_t03_elekid`, `b05_t03_tablilla`; Sixto toca la campana y da la Raichuita X (`b05_t03_raichuita`) |
| Molino atascado (Embestida) | Brontia (40,10) | — | `b05_molino_puerta` → aparece C027 |

**Puzzle T02 (colocar y girar).** Tras el P2 la rueda hidráulica del Diezmo gira al revés, contra el agua (TABLILLAS T02;
la noria de B03 en Caudal, la del canal alto y la corona del eje dentro del molino lo muestran). Cada hueco tiene un
círculo de tiza del tamaño que admite (1 pequeña, 2 mediana, 3 grande); cada rueda lleva un trinquete que solo deja
girar en un sentido (flecha de tiza; «darle la vuelta» lo cambia). Al echar el embrague, un tren bien montado no deja
girar al revés: el agua empuja la rueda a derechas, cada rueda gira al revés que la que la mueve y la muela muele a
derechas → solución única: pequeña a izquierdas, mediana a derechas, grande a izquierdas (`b05_gears.js`, test).
**Puzzle T03 (un solo camino válido).** Cajas J00 (entrada del pararrayos) … J22 (red); quemadas J01, J12, J20 (si les
llega corriente, salta el diferencial y se abren todos los interruptores). Camino único J00→J10→J11→J21→J22:
interruptores (7,6), (8,7), (9,8), (10,9) (`b05_circuit.js`, test con las 4096 combinaciones).

**Reintentos (CAMPANA §2.6):** perder con los técnicos devuelve a la puerta del molino curado (siguen junto a la
muela: se les habla o se examina la muela); perder o huir de la horda deja la Tablilla en su sitio; la hierba
agitada y el árbol de miel se renuevan al descansar; los interruptores se reinician con la palanca.

**Noche en Brontia (`b05_brontia_night.js`):** de noche y antes de P3, apagón (oscuridad del compositor, velas en
las ventanas); tras el rayo, farolas encendidas y penumbra suave; tras P3, normal. Hasta desviar el rayo, cae uno
cada noche sobre el campanario (destello, trueno y sprite).

## Células (§2.3)

| Código | Clave | Mapa (casilla) | Dónde |
|---|---|---|---|
| C025 | `cell_ruta_4_1` | ruta_4 (56,26) | vega sur, junto al árbol de miel (a 16 casillas de la roca de tutorial: CAMPANA §2.1, test) |
| C026 | `cell_ruta_4_2` | ruta_4 (77,27) | rincón tras la roca agrietada (Embestida) |
| C027 | `cell_brontia_1` | villa_brontia (39,11) | junto al molino de la puerta atascada (aparece al abrirla) |
| C073 | `cell_ruta_4_3` | ruta_4 (16,26) | poza del río (Nadar) |

## Entrenadores y objetos

`content/trainers/b05.js`: Pescador Tomás, Excursionista Nuria, Montañero Hugo, Ornitólogo Samuel, Joven Dani (19–22) y
los técnicos del Consorcio (18–20, `canLose`). Objetos: Superpoción, 2 Super Ball, Repelente, Revivir, Cura Total,
Miel ×2 (una oculta), Éter oculto, **Heracrossita** (hueco del árbol del rincón), **Raichuita X** (Sixto).

## Pruebas rápidas

- T02: `?scene=map&map=molino_diezmo&x=7&y=10&dir=8&party=GROTLE:27,LUXIO:26&flags=p1_restored,p2_restored&core=1&zygarde=run&zcores=1&noenc=1&debug`
- Vado anegado / abierto: `?scene=map&map=ruta_4&x=6&y=14&dir=6&core=1&noenc=1&debug` (añadir `&flags=p2_restored`)
- Embestida en la Ruta 4: `?scene=map&map=ruta_4&x=52&y=22&party=GROTLE:27&flags=p2_restored&core=1&zygarde=run&zcores=1&zcells=17&noenc=1&debug` (la C025, en (56,26), es la 18.ª; la roca de tutorial está en (70,24))
- Abril tras el P3 (plaza, de día): `?scene=map&map=villa_brontia&x=25&y=24&flags=p2_restored,p3_restored,b05_brontia&time=10&debug`
- Brontia de noche: `?scene=map&map=villa_brontia&x=22&y=19&flags=p2_restored,b05_brontia&core=1&time=22&debug`
- Subestación: `?scene=map&map=brontia_subestacion&x=9&y=11&dir=8&flags=p2_restored&debug`
- Campanil tras el rayo: `?scene=map&map=brontia_campanario&x=16&y=4&party=GROTLE:27,LUXIO:26&flags=p2_restored,b05_t03_rayo,b05_t03_circuito&zygarde=run,ram&time=22&debug`
- `node --test tests/b05.test.mjs` · `node tools/validate_content.mjs` · **recorrido completo**: `node tools/e2e_b05.mjs`
  (≈9 min; `--from=ruta4|brontia` para empezar más tarde con el estado preajustado; capturas `tools/cache/screens/e2e_b05_*`).

## Coordinación con otros bloques

- **B03** (Caudal): **pendiente de B03** — el Anselmo del exterior (`b03_caudal_npcs.js`) sigue en la calle aunque el
  Anselmo del bloque 5 esté dentro del molino; se sugiere ocultarlo con `!flag('b05_t02_anselmo') || flag('b05_t02_tablilla')`.
  Su noria del Diezmo gira al revés tras P2 hasta la Tabla Linfa: el molino del B05 lo muestra igual (canal alto y corona).
- **B04** (ya existe): da la segunda pista de T02 (inscripción junto al verso II) y abre T03 (inscripción del P2 y el
  apunte de Leandro sobre Sixto). El bloque 5 las vuelve a abrir por descubrimiento directo sin pisar el paso ya dado.
- **B06** (ya existe): la salida este de Brontia está conectada con la Ruta 5 (offset 0, simétrico). Abril acampa en el
  Anillo hasta el P3 (da allí la segunda pista de T03) y, tras el P3, «se queda en Brontia una temporada»: el bloque 5 la
  pone en la plaza de día y en su casa de noche (`abrilTalk` en `events/b05_brontia.js`).
- **B07**: el vendaval lo cierra Brontia hasta `p3_restored`; la Ruta 6 no necesita repetirlo en su borde norte.
- **B15**: el hielo-eco lo cierra Brontia hasta `p7_restored`.
