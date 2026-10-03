# Bloque 12 — Pilar Invertido (P6): el Monte del Portal de día y el Mundo Distorsión

Guion: `docs/CAMPANA.md` «B12» (espacio imposible 2D, La Cara Vuelta, La Mirada, El Sumidero, núcleo, Respuesta),
§1.4 (Monte del Portal), §1.8 (fondos MundoDistorsion, niebla `portal`, música), §2.3 (C050–C053, C076), §2.4 (N3 →
50 % y Nadar), §2.6 (reintentos), §3.0 (verso VI). Encuentros: `docs/POKEDEX_DISTRIBUCION.md` §7.3 (Gengarita,
Lucarita). **Fuente única de coordenadas:** `layout.js` (y `rooms.js` para las salas de La Cara Vuelta).
Mecánicas genéricas en `world/impossible/` (docs/ARCHITECTURE.md §16). **X36 (creador, 26-09-2026):** P6 vertical,
con tres pisos de puzzles y sin Pokémon, entrenadores ni Guardián. La sombra canónica de Giratina es una aparición
al fondo, sin combate. Reparto: piso 1, explanada y Cara Vuelta; piso 2, Mirada; piso 3, Sumidero y sello con N3.

## Mapas

| id | Archivo | Tamaño | TS | Notas |
|---|---|---|---|---|
| `montana_portal` | `b01/montana_portal.js` + `monte_build.js` | 50×50 | 1 | El mapa del prólogo **ampliado en su sitio** (antes 44 de ancho; el prólogo no cambia: todo lo del B12 depende de `b01_left_town`). Macizo más ancho con la repisa de la cascada (Trepar) y su gruta, poza mayor (C076), hierba alta en las terrazas y la repisa (`encounterZones`), marcas de la batalla del prólogo, pozos de sondeo de Genesis (tras `b11_exp03`), estacas y sensores alrededor del aljibe, huellas que se dan la vuelta, la montañera |
| `monte_gruta` | `monte_gruta.js` | 26×20 | 2 | Gruta de la repisa (encuentros de cueva del Monte, 3 objetos) |
| `pilar_invertido` | `pilar_invertido.js` | 40×34 | 14 | Piso 1: rellano bajo el aljibe, plaza con columnas y zarpazos, islote de acceso a Cara Vuelta y ascenso al segundo piso al resolverla |
| `pilar_invertido_cara_{1,2,3}` y `…_giro` | `facet_map.js` (+ 6 envoltorios) | 31×31 / 35×35 | 14 | Piso 1, La Cara Vuelta: tres salas × dos orientaciones precalculadas (base y gemelo girado 90° horario) derivadas de la misma rejilla física (`rooms.js`); margen de vacío de 9 casillas. Glifo de regreso con A en cada llegada |
| `pilar_invertido_mirada` | `pilar_invertido_mirada.js` | 30×26 | 14 | Piso 2: islotes y puentes que solo existen mirándolos. Escaleras de descenso y ascenso |
| `pilar_invertido_sumidero` | `pilar_invertido_sumidero.js` | 34×48 | 14 | Piso 3: islas a distintas alturas, cascadas invertidas, pulsadores y rincón de la Gengarita. Escalera de regreso al segundo piso y acceso de revisita al sello tras completar las cascadas |
| `pilar_invertido_nucleo` | `pilar_invertido_nucleo.js` | 33×31 | 14 | Piso 3, sello: plataforma octogonal, N3 y tres Anclas; regreso al Sumidero antes de restaurar y portal directo al piso 1 después |

Todos los del Mundo Distorsión: `DISTORTION_ENV` de `paint.js` (Cueva Morada, fondo procedural `panorama: { shader:
'distorsion' }`, niebla `portal`, sin seguidor Pokémon ni montura, Cuerda Huida) y tono violeta rebajado. Música y
fondo de combate por zona (`services/zones.js`, grupo «Pilar Invertido»: MundoDistorsion).
Tiles propios: `node tools/distortion_tiles.mjs [--check] [--preview]` (en `npm run data`; filas añadidas al atlas
de Cueva1 → `content/stamps/distortion.js`). Arte de objetos: `node tools/b12_assets.mjs` (postes de Ancla con símbolo
veta/ojo/gota, veta de arista, losa de puente, cascada invertida, pulsador, sello, portal, marcas del Monte, material de
Genesis).

Columna exterior: se reutilizan las ocho filas superiores del arte `pilar_torre`, detrás del brocal del Monte
(x14–20, y0–7). Se muestra por páginas en `b12_vertical.js` tras `b01_left_town` y P5/P6 restaurado. La base y la
puerta de la torre se omiten para conservar el aljibe horizontal del prólogo, su estrado y su colisión. No se
cambia ninguna posición del prólogo ni la del nodo postgame (20,11). El acceso sigue siendo el brocal (17,10).

## Enlaces

| Desde | Casilla | Hacia | Llegada / notas |
|---|---|---|---|
| `campamento_monte` (B11) senda | x 9–12, y 0 | `montana_portal` | (17,48) ↑ (sin cambios). Vuelta: borde sur x 16–18 |
| `montana_portal` aljibe | (17,10), desde (17,11) ↑ + A | `pilar_invertido` | (19,7) ↓. Antes del P6: «Me reconoce.» la primera vez; siempre pregunta. Media vuelta de pantalla |
| `montana_portal` pared de raíces | pie (47,37) ↑ / lo alto (47,33) ↓ | (repisa) | Trepar |
| `montana_portal` boca de la gruta | (44,11) | `monte_gruta` | (12,16) ↑. Salida: (12,17) ↓ → (44,13) |
| `pilar_invertido` aljibe (techo) | (19,5), desde (19,6) + A | `montana_portal` | (17,12) ↓ |
| `pilar_invertido` portal | (37,18) | `pilar_invertido_cara_1` | llegada de la sala (15,20) ↑ |
| salida de cada sala (X) | — | sala siguiente / `pilar_invertido_mirada` | La salida de la tercera sala es la escalera al piso 2: Mirada (5,20) ↑ |
| Cara Vuelta, glifo de llegada | inicio físico de cada gemelo + A | `pilar_invertido` | (36,18) ←; permite volver sin perder objetos, células ni progreso |
| `pilar_invertido` escalera | (37,20) | `pilar_invertido_mirada` | (5,20) ↑, tras `b12_cara_vuelta` o `p6_restored` |
| `pilar_invertido_mirada` descenso | (5,21) | `pilar_invertido` | (37,19) ←; disponible antes y después del P6 |
| `pilar_invertido_mirada` ascenso | (26,5) | `pilar_invertido_sumidero` | (16,42) ↑ |
| `pilar_invertido_sumidero` descenso | (16,43) | `pilar_invertido_mirada` | (25,5) ←, fuera de la escalera de ascenso |
| `pilar_invertido_sumidero` portal | (26,8) | `pilar_invertido_nucleo` | (16,25) ↑ |
| `pilar_invertido_sumidero` escalera de revisita | (19,43) | `pilar_invertido_nucleo` | (16,25) ↑; tras `b12_sumidero` o `p6_restored` |
| `pilar_invertido_nucleo` regreso | (16,26) | `pilar_invertido_sumidero` | (16,42) ↑; rellano inferior conectado al descenso al piso 2; no exige restaurar ni Fragmento 5 |
| `pilar_invertido_nucleo` portal (tras el P6) | (16,21) | `pilar_invertido` | (20,15) ↑ |

## Espacio imposible: reglas

- **Vacío**: casilla sin suelo (capas 0 y 1 vacías). Terminar un paso en ella → fundido y vuelta a la última **Ancla**
  (var `ancla_actual`), **sin daño ni contador**. Al entrar por warp en otra sección, la llegada es el punto seguro.
- **Anclas**: postes; se tocan empujándolos. El de la entrada de cada sección lleva un símbolo (veta en La Cara Vuelta,
  ojo en La Mirada, gota en El Sumidero): es el orden del núcleo.
- **Aristas** (La Cara Vuelta): pisar la veta violeta gira la pantalla 90° y carga el mapa gemelo; los controles siguen
  siendo de pantalla. Lo que era pared (bloque con vetas) pasa a ser suelo, y al revés.
- **Puentes de la mirada** (La Mirada): existen a ≤ 4 casillas en la dirección en que se mira. Girar encima de uno =
  caer. Se gira sobre los islotes.
- **Cascadas invertidas** (El Sumidero): ascensores de un solo sentido; cada una se abre con su pulsador. Desde la isla
  alta del oeste no hay bajada: se cae (sin daño) al último poste.

Soluciones: sala 1, 1 giro; sala 2, 2 giros (C052 en la repisa que solo existe girada); sala 3, 4 giros (espiral).
Mirada: I0 → I1 (Ancla ojo) → P1 → I2 → P2 → I5. Sumidero: pulsador 1 → cascada W1 → I1 (Ancla) → pulsador 2 (I3) →
W2 → I2 (C053, sombra, pulsador 3, rincón) → caer → I1 → I3 → W3 → I4 → núcleo. Núcleo: veta (11,18) → ojo (16,9) →
gota (21,18).

## Secuencia, flags y reintentos

| Escena | Dónde | Condición | Pone |
|---|---|---|---|
| Temblores nocturnos (cada ≈25 s; la primera vez Zygarde: «Tiembla otra vez. Viene del Monte, del aljibe.») | Villa Alba (paralelo) | `b11_gael_b4 && !p6_restored`, de noche | `b12_temblor_visto` |
| Llegada de día: «Aquí. Esta es la piedra donde me rompí.» | Monte (17,48) | `b11_gael_b4` | `b12_monte_llegada` |
| El aljibe responde; bajada | Monte (17,10) | partida real | `b12_aljibe_abierto` |
| Llegada al interior | explanada (19,7) | | `b12_interior_visto` |
| Primera Ancla / primera caída | cualquiera | | `b12_ancla_vista` / `b12_caida_vista` |
| Entradas de las salas; salida de la 3.ª | La Cara Vuelta | | `b12_cara_{1,2,3}_vista`, `b12_cara_vuelta` |
| La Mirada | | | `b12_mirada_vista`, `b12_mirada` |
| Pulsadores; pista de caer; **sombra de Giratina** (al pisar la mitad este de la isla alta, x 9–12, y 11–17, donde está C053: nadie sale sin verla; ≈4 s, masa negra con contorno violeta tenue que tapa las nebulosas, solo baja la música, Zygarde inmóvil, «No mires. No nos busca. Aún.») | El Sumidero | | `b12_pulsador_{1,2,3}`, `b12_pista_caida`, `b12_sombra`, `b12_sumidero` |
| Núcleo: tres Anclas en orden (el error reinicia, sin castigo) → sello → **`restorePillar(6)`** (F06, verso VI) → N3 se libera y se une (**50 % y Nadar** con ≥ 50 células; si no, «Me faltan N partes») | núcleo | Fragmento 5 | var `b12_nucleo_orden`, `b12_sello`, `p6_restored`, `zyg_core_3`, `zyg_50` |
| **Respuesta**: «Aquí lo empujé. Tres noches.» (dolor y gratitud) | explanada (20,15) | `p6_restored` | `b12_respuesta` |
| Vuelta al Monte: el aljibe es puerta anclada (se puede volver a bajar, X16) | Monte (17,12) | `p6_restored` | `b12_regreso` |
| **Lucarita** de Casilda («Mi marido la encontró hace años. Ahora sé para quién era.») | Villa Zaguán (auto; espera en (19,16)) | `p6_restored && b02_salida` | `b12_lucarita` |

**Reintentos (§2.6):** no hay combate de jefe; caer no cuesta nada; el orden equivocado del núcleo solo reinicia la
cuenta; sin el Fragmento 5 el sello no se cierra y se puede volver. Las Anclas guardan el progreso de cada sección.
Crisis: la fase 2 llega sola con `p6_restored` (`story/crisis.js`).

Partidas anteriores: los IDs, las orientaciones, los puzzles, las posiciones de las Anclas, los objetos y las
células se conservan. Las escaleras nuevas añaden accesos firmes al borde de los rellanos, sin abrir puentes ni
saltar cascadas. `ImpossibleField` conserva el Ancla del gemelo dentro de una sección; al cambiar de sección,
registra la llegada como punto seguro. No se exige Anclaje espacial (X16: exclusivamente postgame).

## Células y objetos

| Código | Clave | Casilla | Dónde |
|---|---|---|---|
| C050 | `cell_monte_1` | montana_portal (26,46) | explanada quemada |
| C051 | `cell_monte_2` | montana_portal (17,21) | mitad de la escalinata (obligatoria) |
| C052 | `cell_invertido_1` | pilar_invertido_cara_2_giro (sala física (15,6)) | repisa que solo existe girada (obligatoria) |
| C053 | `cell_invertido_2` | pilar_invertido_sumidero (10,12) | isla alta (obligatoria) |
| C076 | `cell_monte_3` | montana_portal (39,41) | poza al pie de la gran cascada (Nadar) |

Objetos: **Gengarita** (GENGARITEX) en el rincón del Sumidero (2,4) · **Lucarita** (LUCARIONITE) de Casilda · Monte:
Ultra Ball ×2 (47,5, repisa), Hiperpoción (4,29), Revivir oculto (31,48) · Gruta: Piedra Noche, Máximo Repelente,
Caramelo Raro oculto · Explanada interior: Hiperpoción (9,23) · La Cara Vuelta: Éter Máximo (sala 2, girada), Restaurar
Todo (sala 3, girada) · La Mirada: Más PP (4,4), Ultra Ball ×3 (22,17) · Sumidero: Poción Máxima (29,30).
Encuentros (`encounters/b12.js`): Monte hierba = Ruta 10 alta (B11); gruta 40–45. El interior del P6 queda sin
encuentros por X36, incluida la explanada. Sin entrenadores ni Guardián.

## Cambios en el mundo

Tras `p6_restored`: el aljibe queda como puerta anclada (se baja y se sube cuando se quiera); cesan los temblores de
Villa Alba; la montañera y la Médium del Neblino (B11) cuentan que las sombras ya no bajan; Casilda espera en Zaguán
con la Lucarita; Zygarde 50 % con Nadar (`zyg_50`). Líneas del acompañante en `content/companion.js`.

## Pruebas rápidas

Estado base `B` (B11 terminado): `flags=b01_dex_received,b01_left_town,p1_restored,p2_restored,p3_restored,p4_restored,p5_restored,zyg_10,zyg_core_2,b02_salida,b11_exp03,b11_gael_b4&fragments=5&zygarde=run,ram,terrain,climb&zcells=49&zcores=2&party=TORTERRA:66,LUCARIO:62&noenc=1&debug`

- Monte de día: `?scene=map&map=montana_portal&x=17&y=48&dir=8&time=11&` + `B`
- Explanada interior: `?scene=map&map=pilar_invertido&x=19&y=7&dir=2&` + `B` (añadir `b12_interior_visto`)
- La Cara Vuelta: `?scene=map&map=pilar_invertido_cara_1&x=15&y=20&dir=8&` + `B`
- La Mirada / El Sumidero / núcleo: `map=pilar_invertido_mirada&x=5&y=20` · `map=pilar_invertido_sumidero&x=16&y=42` ·
  `map=pilar_invertido_nucleo&x=16&y=25` (+ `&dir=8&` + `B`, `zcells=53` para Nadar al restaurar)
- Villa Alba de noche (temblores): `?scene=map&map=villa_alba&x=22&y=30&dir=2&time=22&` + `B` (y los flags de B01)
- Lucarita: `?scene=map&map=villa_zaguan&x=19&y=3&dir=2&` + `B` con `p6_restored`
- `node --test tests/b12_impossible.test.mjs tests/b12_reach.test.mjs tests/b12_content.test.mjs tests/b12_vertical.test.mjs` (`b12_reach`: BFS a
  pie sobre los mapas reales: no se salta ninguna puerta —aljibe, aristas, puentes, cascadas, sello—, sin estados
  trampa y todo lo obligatorio al alcance) · `node tools/preview_map.mjs pilar_invertido --pass`.
- **Recorrido completo**: `node tools/e2e_b12.mjs` (incluye ascenso cerrado, glifo de regreso, descensos por las tres
  plantas antes de restaurar, caída al vacío y sobre puente, y revisita; `--from=alba|monte|cara|mirada|sumidero|nucleo|regreso|nadar|zaguan`,
  `--only=<tramo>`). Capturas `tools/cache/screens/e2e_b12_*` y transcripción `e2e_b12_dialogos.txt`.

## Coordinación con otros bloques

- **B01**: `montana_portal.js` crece a 50 de ancho y suma eventos/warps/zonas del B12 con llamadas a `monte_build.js` y
  `b12_monte.js` (el prólogo no cambia: todo va con `b01_left_town`); `villa_alba.js` suma el temblor nocturno.
- **B02**: `villa_zaguan.js` suma Casilda con la Lucarita.
- **B11**: se conserva la llegada (17,48) desde el campamento y el borde sur; los pozos de sondeo del Monte salen con
  `b11_exp03`; la Médium del Neblino cambia su frase tras el P6 (`after` como función).
- **B13+**: entrada con `p6_restored`, `zyg_50` (Nadar) y `zyg_core_3`.
- **B20**: reutiliza aristas y Anclas (`world/impossible/`).
- **B22a**: el nodo del aljibe (`aljibeNodeEvents`) y la grieta a Distorsión profunda (`explanadaB22aEvents`) se
  añaden desde los eventos del B12. La grieta conserva (26,23) y su regreso (26,22); ambos hooks son de postgame.
