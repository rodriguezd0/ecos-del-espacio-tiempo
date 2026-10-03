# Bloque 8 — Pilar de la Masa (P4) y T05 «El Pulso de Estrato»

Guion: `docs/CAMPANA.md` «B08», §1.3 (Ciudad Estrato), §1.8, §2.3 (C036–C040), §2.6 (reintentos), §5.3 (Garrido) y
§6.2 (Gael no aparece en este bloque). `docs/TABLILLAS.md` T05. Encuentros: `docs/POKEDEX_DISTRIBUCION.md` §7.3
(«Ciudad Estrato y Mina Galena», «Dunas de Ceniza», «Pilar de la Masa») y §7.7 (Steelixita, Garchompita,
Medichamita). **Fuente única de coordenadas:** `layout.js`; el trazado de la Cámara está en
`content/events/b08_balance_logic.js` (lo comparten el mapa, las reglas, los tests y el E2E).

## Mapas

| id | Archivo | Tamaño | TS | Notas |
|---|---|---|---|---|
| `ciudad_estrato` | `ciudad_estrato.js` + `ciudad_estrato_build.js` | 56×48 | 5 | Cañón escalonado en tres rellanos (alto y 0–11, plaza y 15–29, bajo y 33–47). Estación, casa de los Galena, Escuela del Pico, Centro, tienda, oficinas del Consorcio, dos casas, boca de la Mina Galena en el macizo del este, plaza con la **Losa del Pulso** (25,21), mercado de minerales (caravana; abre tras el P4) y vía del tren (y 11). BGM `CiudadVerde`, fondo `ZonaEscarpada` |
| `estrato_centro` / `estrato_tienda` | plantillas de `content/services` | — | 4 | Centro Pokémon y tienda (extra: Superrepelente, Cura Total) |
| `estrato_estacion` | `estrato_estacion.js` | 27×17 | 4 | Andén y taquilla (`stationEvent`, parada `estrato`); tren suspendido hasta el P4 |
| `estrato_casa_galena`, `estrato_escuela`, `estrato_casa_norte`, `estrato_consorcio`, `estrato_casa_sur` | `interior_kit.js` + uno por casa | 11–19 × 11–14 | 4 | Casa de Fermín y Sol; escuela (Herminia); minero jubilado (Roca Suave); oficina del Consorcio; familia con la pared agrietada |
| `mina_galena` | `mina_galena.js` + `cave_kit.js` | 44×35 | 2 | Seis salas: vestíbulo, galería, veta de cristal (C036), pozo lateral y fondo del pozo (Garrido), montacargas. BGM `Cueva`, fondo `CuevaOscura` |
| `mina_galena_honda` | `mina_galena_honda.js` | 30×22 | 2 | Galería honda (arcilla): fósiles, Steelixita. Solo tras el P4 |
| `dunas_ceniza` | `dunas_ceniza.js` | 60×50 | 6 | Desierto de ceniza con una cresta N–S y tres **vados de ceniza honda** (Terreno complicado, `roughTerrain` arena); campos de ceniza honda con C037 y C038; ruinas de zócalos; boca del Cerro Plomo; boquete a la cueva. En el borde oeste, las **paredes del cañón** (x ≤ 3, filas ≤ 19 y ≥ 24) continúan la roca de Estrato: la única boca es la de las filas 20–23 |
| `dunas_cueva` | `dunas_cueva.js` | 32×20 | 2 | Cueva de las Dunas (arcilla): montañero, Garchompita |
| `cerro_plomo` | `cerro_plomo.js` | 30×30 | 2 | Galería de los Galena (gris): verja con candado (3 casillas) y antesala con la puerta del Pilar |
| `camara_contrapesos_base` | `camara_contrapesos_base.js` | 27×25 | 2 | Piso 1: Blanca y Octavio, trasladados del Cerro conservando derrotas de partidas anteriores |
| `camara_contrapesos` | `camara_contrapesos.js` + `camara_build.js` | 40×35 | 2 | Piso 2: puzzle completo de contrapesos, kit `pilar_*`, tono `pilarTone('P4')`, encuentros con `stepChance` reducido |
| `camara_contrapesos_nucleo` | `camara_contrapesos_nucleo.js` | 27×25 | 2 | Piso 3: Fermín, su combate y el núcleo |

La columna exterior de piedra (7×10) sobresale del Cerro Plomo y se ve desde las Dunas. La galería y la verja de
los Galena siguen siendo el acceso. Las nuevas plantas llevan `pillar: { id: 'P4', floor: 1/2/3 }`.

Arte propio (PROVISIONAL, D30): `node tools/b08_assets.mjs` → `assets/objects/b08_*.png` (bloque, piedra, placa,
suelo quebradizo, arena honda, platillos, balanza, eje, contrapesos, losas, palancas, perforadora, vagoneta, piedra
flotante, grietas, Losa del Pulso 3×1, verja, vía, fósiles, entibos).

## Enlaces

| Desde | Casilla / borde | Hacia | Notas |
|---|---|---|---|
| `ciudad_estrato` norte | x 26–30, y 0 | `ruta_6` (B07) | `north`, offset 13 ↔ Ruta 6 `south`, offset −13. `linkIfReady` (`links.js`); **activo** |
| `ciudad_estrato` oeste | x 0, y 22–25 | `ruta_7` (B09a) | `west`, offset 6 ↔ Ruta 7 `east`, offset −6. **Activo**; el Paso del Derrumbe (en la Ruta 7) se despeja con `p4_restored` |
| `ciudad_estrato` este | x 55, y 38–41 | `dunas_ceniza` | `east`, offset 18 ↔ Dunas `west` (x 0, y 20–23), offset −18. El resto del borde este de Estrato (filas 0–37 y 42–47) es roca, igual que el oeste de las Dunas enfrente: no hay otro cruce ni costura de hierba contra ceniza |
| puertas de Estrato | estación (8,9) · Galena (19,7) · escuela (37,8) · casa norte (44,9) · Centro (8,21) · tienda (38,20) · Consorcio (9,40) · casa sur (19,39) | interiores | llegada sobre el felpudo (`ESTRATO_INTERIORS`); salida pulsando abajo → delante de la puerta |
| boca de la mina | (50,23), empujar desde (50,24) | `mina_galena` | (21,32) ↑; salida (21,33) → (50,25) |
| montacargas | (21,5) desde (21,6) | `mina_galena_honda` | solo con `p4_restored` (antes, cascotes); escalera (14,4) → (21,6) |
| boquete de las Dunas | (7,7) | `dunas_cueva` | (6,6) ↓; escalera (6,4) → (7,9) |
| boca del Cerro | (46,23) desde (46,24) | `cerro_plomo` | (14,26) ↑; salida (14,27) → (46,25) |
| puerta del Pilar en Cerro | (14,5) | `camara_contrapesos_base` | (13,20) ↑; escalera sur (13,22) → Cerro (14,6) |
| escalera norte de la base | (13,5) | `camara_contrapesos` | (14,33) ↑; salida (14,34) → base (13,6) |
| escalera de la Cámara | A en (8,6), después de la Balanza | `camara_contrapesos_nucleo` | (13,20) ↑; escalera sur (13,22) → Cámara (8,7) |
| tren | taquilla de la estación | red `TRAIN` | llegada a Estrato (8,10) (`world/transport.js`) |

## Secuencia y flags

| Escena | Dónde | Condición | Pone |
|---|---|---|---|
| Llegada: temblor y el Core («Aquí la tierra ha olvidado cuánto pesa») | Estrato (auto) | `!b08_llegada` | `b08_llegada` |
| **Discusión** ante la mina: Fermín, Sol y la representante del Consorcio («problema humano»); Fermín baja a la mina; Sol pide ayuda (texto con género) | franja (49–51,25) o boca | `!b08_discusion` | `b08_discusion` |
| **Técnicos** del pozo lateral (Íñigo: Houndour/Skorupi 29; Mireia: Bronzor 29/Magneton 30), vista 3 | túnel (29,16) y (31,16) | antes de Garrido | autointerruptor A; `b08_mina_tecnicos` |
| **Garrido** junto a la perforadora parada: «la cámara rechaza las perforadoras porque el peso crece» → combate Gurdurr 31, Rhyhorn 31, Houndoom 32 | franja (35–37,10) | `!b08_garrido` | `b08_garrido_visto`, `b08_garrido` |
| Fermín echa a Garrido y cuenta la entrada por el Cerro (y la lucecita de C038) | pozo | tras Garrido | `b08_fermin_cerro` |
| Fermín abre la verja de la familia | Cerro (13–15,18) | `b08_fermin_cerro` | `b08_cerro_abierto` |
| **Cámara**: Balanza (ver abajo), abre la escalera del piso 3 | palanca (25,11) | solución | `b08_balanza`, var `b08_camara` |
| **Combate con Fermín** (Graveler 32, Naclstack 32, Mudsdale 33, Onix 33, Rhydon 34) | piso 3, (13,11), franja y12 o hablarle | `b08_balanza && !b08_fermin` | `b08_fermin_nucleo`, `b08_fermin_reto`, `b08_fermin` |
| **Núcleo**: `restorePillar(4)` (Fragmento F04, verso IV, lo lee Fermín), efecto local, inscripción de T05 y descubrimiento de T05, despedida | piso 3, pedestal (13,6) desde (13,7) | `b08_fermin` | **`p4_restored` (salida)**, `verse_4`, `b08_fermin_despedida` |
| **Cooperativa**: la opción de compra caduca («el suelo es estable… sin intervención nuestra»), cooperativa minera, fósiles, 2.ª pista de T05, tren y Paso del Derrumbe | Estrato (auto, plaza) | `p4_restored && !b08_cooperativa` | `b08_cooperativa`, `b08_fosiles`, `b08_t05_losa`; `SKULLFOSSIL`, `ARMORFOSSIL` |
| T05: Herminia en la escuela propone recuperar el Torneo del Pulso | escuela (8,4) | `p4_restored` | `b08_t05_herminia`, `b08_t05_torneo_abierto` (T05 directo si faltaba) |
| **Torneo del Pulso**: Tito (Machoke/Naclstack 33), Lola (Meditite/Tinkatuff 33), Quique (Gurdurr/Mudsdale 34) y la final contra **Sol** (Pangoro 34, Gurdurr 34, Tinkatuff 35) | Herminia en la plaza (22,21) | torneo abierto | var `b08_t05_ronda`; `b08_t05_torneo` |
| **Noche**: dos técnicos intentan llevarse la Losa → combate **doble con Sol de aliada** (Rogelio: Skuntank 35/Croagunk 34; Susana: Duosion/Magneton 35) | plaza (auto de 20:00 a 5:59) | `b08_t05_torneo` | `b08_t05_defensa_empezada`, `b08_t05_defensa` |
| Tocar la Losa: el Core revela la **Tabla Fuerte** (`FISTPLATE`); Herminia da la **Medichamita** | Losa (25,21) desde (25,22) | defendida | `b08_t05_tablilla`, `b08_t05_medichamita` |
| Revancha semanal (mismas rondas; Pepita) | Herminia | tras descansar (`rest_count` > var `b08_t05_revancha`) | var `b08_t05_revancha` |

**Reintentos (CAMPANA §2.6):** todos los combates de guion usan `bossBattle` (sin perder dinero): técnicos → (25,17);
Garrido → (36,12); Fermín → (13,14) del piso 3; torneo → se reinicia desde la 1.ª ronda hablando con Herminia; noche → los
técnicos siguen forcejeando y se reintenta hablando con Sol. La Cámara nunca queda bloqueada (abajo).

## Cámara de los Contrapesos (mazmorra)

Reglas literales de CAMPANA: a pie el jugador pesa **1**; montado en el 10 %, **3**; bloque de basalto **2**; piedra
suelta **1**. Las **placas** bajan con 3 o más y suben plataformas; el **suelo quebradizo** se rompe con 3 o más: se
cae sin daño a la galería inferior (C039) y hay escalinata de vuelta; la **arena profunda** solo se cruza montado; la
**palanca de retorno** de la entrada devuelve bloques y piedras. **Gran Balanza:** A = bloque + bloque; B = bloque +
piedra + piedra; C = piedra + jugador montado.

Trazado (40×35): entrada (10–25, 22–29) con la estela de reglas (16,28) y la palanca de retorno (12,28); pasillo de
entrada (13–15, 30–33); **puente quebradizo** (17–19, 18–21) hacia la terraza de la Balanza (5–34, 13–17); platillos
A (11–12,12), B (17–19,12), C (24–25,12) y palanca (25,11) solo accionable desde (25,12); **arena** (26–29, 23–26)
hacia el ala este (30–35, 20–27) con la **placa** (34,21) y el foso de la plataforma (31–33, 18–19); escalinata
(31–33, 28–30) a la **galería inferior** (21–35, 31–33) donde caen el jugador (23,32) y están las tres piedras.
Losa de la subida (6–8,10), escalera al piso 3 (8,6). Bloques en (18,24), (13,26), (22,27); piedras en (25,32), (28,32), (32,32).

Decisiones de implementación (a revisar):
- **Los tres platillos deben cargar todo el peso de la cámara (4 + 4 + 4).** Con solo «pesos iguales», (1, 1, 1) a
  pie también valdría y la montura no sería imprescindible. Con esta regla la única solución es la de CAMPANA
  (`balanceSolutions()`, test). La estela lo dice con palabras («Tres platos y un solo peso. Todo lo que la cámara
  guarda, sobre ellos») y el Core da la pista de montar si a pie falta solo el peso del jugador.
- Los contrapesos se **empujan** andando contra ellos y se pueden **tirar** (A delante → «Tirar»): un error nunca
  bloquea el puzle; la palanca de retorno lo repone todo, **incluidas las losas rotas**.
- La placa, una vez hundida, **queda enclavada** (la plataforma no vuelve a bajar).
- Montar encima de una losa quebradiza la rompe (vigilante paralelo); por un agujero se cae también a pie. Las
  piedras de abajo solo suben por la escalinata y la plataforma: la placa es obligatoria.

## Encuentros, objetos, entrenadores y células

- Encuentros (`content/encounters/b08.js`): Mina Galena (Gurdurr, Naclstack, Tinkatuff, Carbink, Sableye 27–33),
  galería honda (Carbink, Sableye, Onix, Graveler, Duraludon 30–35), Dunas (matorral: Hippopotas, Skorupi, Darumaka
  28–34; **Sigilyph solo junto a las ruinas**, `encounterZones` con `DUNAS.ruinsZone`, como dice la nota de POKEDEX), Cueva de las Dunas (Graveler, Hippopotas, Nosepass, Carbink, Gible, Gabite 30–34), Cerro Plomo y
  Cámara (Graveler, Onix, Nosepass, Naclstack, Bronzor, Carbink 30–34).
- Objetos: Estrato (Éter oculto, Piedra Dura, 3 Super Balls); mina (Superpoción oculta, Revivir, Pepita, Hiperpoción,
  Cura Total, Éter oculto); galería honda (**Steelixita**, Pepita, Revivir Máximo oculto); Dunas (Arena Fina, Roca
  Calor, Polvoestelar oculto, Revivir, Superrepelente oculto); Cueva de las Dunas (**Garchompita**, Superrepelente,
  Hueso Raro oculto); Cerro (Revivir oculto, Hiperpoción, Polvoestelar); Cámara (Piedra Pómez). Regalos: Roca Suave
  (minero jubilado), Fósil Cráneo y Fósil Coraza (Fermín), Tabla Fuerte y **Medichamita** (T05), Pepita (revancha).
  Mercado de minerales tras el P4: Piedra Alba, Noche, Día, Eterna, Dura.
- Entrenadores (`content/trainers/b08.js`): Rufo (veta), Adrián, Nerea y Carmen (Dunas), Julián (cueva), Blanca y
  Octavio (Cerro), más los de guion de arriba.
- Células (claves de `content/zygarde/cells.js`): **C036** `cell_mina_galena_1` (5,18) al pie de la veta · **C037**
  `cell_dunas_1` (31,34) y **C038** `cell_dunas_2` (55,38) en ceniza honda (Terreno) · **C039** `cell_masa_1` (22,31)
  galería inferior · **C040** `cell_masa_2` (21,13) junto a la Balanza.

## Cómo probar

Servidor: `npm run serve` (http://localhost:8080). URLs de desarrollo (`&debug` muestra coordenadas):

- Llegada: `/?scene=map&map=ciudad_estrato&x=28&y=1&dir=2&flags=p3_restored&zygarde=run,ram,terrain&zcells=35&party=LUCARIO:40&noenc=1&debug`
- Mina con la discusión hecha: `/?scene=map&map=mina_galena&x=21&y=32&dir=8&flags=p3_restored,b08_llegada,b08_discusion&zygarde=run,ram,terrain&zcells=35&party=LUCARIO:40&noenc=1&debug`
- Dunas (ceniza honda): `/?scene=map&map=dunas_ceniza&x=1&y=21&dir=6&flags=p3_restored,b08_garrido,b08_fermin_cerro&zygarde=run,ram,terrain&zcells=35&noenc=1&debug`
- Cámara: `/?scene=map&map=camara_contrapesos&x=14&y=33&dir=8&flags=p3_restored,b08_fermin_cerro,b08_cerro_abierto&zygarde=run,ram,terrain&zcells=35&party=LUCARIO:40&noenc=1&debug` (E = montar)
- Cooperativa: `/?scene=map&map=dunas_ceniza&x=2&y=21&dir=4&flags=p3_restored,b08_balanza,b08_fermin,p4_restored,verse_4&fragments=4&zygarde=run,ram,terrain&noenc=1&debug`
- T05 de noche: `/?scene=map&map=ciudad_estrato&x=25&y=25&dir=8&flags=p4_restored,b08_cooperativa,b08_t05_torneo_abierto,b08_t05_torneo&time=21&party=LUCARIO:45&noenc=1&debug`

Tests: `node --test tests/b08_logic.test.mjs tests/b08_reach.test.mjs` (reglas del puzle, solución única, plan de
referencia, sin trampas; BFS de todos los mapas: puertas no saltables, objetos/células/entrenadores alcanzables).
E2E: `node tools/e2e_b08.mjs [--from=estrato|mina|dunas|cerro|camara|cooperativa|t05] [--gender=M] [--headed]`
(capturas y diálogos en `tools/cache/screens/e2e_b08_*`).

## Pendiente / fuera de este bloque

- Postgame (B22): Prisma Rojo en la galería honda, Regirock (Cueva Sellada del Pico, Mina Galena), Thundurus (Dunas),
  Landorus (Cerro Plomo), Terrakion (Cueva de las Dunas): no colocados.
- Revivir los fósiles: museo de Lúmina (B09a).
- Arte PROVISIONAL (D30) de los objetos del puzle y de la Losa.
