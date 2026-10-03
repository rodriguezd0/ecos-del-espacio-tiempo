# Campaña de Axis — documento maestro

**Proyecto:** Pokémon: Ecos del Espacio-Tiempo · **Fecha:** 24-09-2026 · **Estado:** DECIDIDO-DEV (síntesis final),
revisable por el autor según la política de autonomía de `docs/DECISIONES.md`.

**Fuentes de canon (por orden de precedencia):** decisiones del autor en `docs/DECISIONES.md` (D01–D08, D02b, D05b,
X01, X03, X04, X05, TEC-01…06) → `docs/biblia_axis_v2.txt` (VIGENTE) → `docs/bloques/B01_apertura.md` (bloque 1 ya
guionado). Datos: `game/data/species.json`, `items.json`, `items_axis.json`, `moves.json`, `dex_axis.json`.

**Documentos hermanos:** `docs/TABLILLAS.md` (sección 4: T01–T15, museo, Crónica, las tres de Arceus, Libreta) ·
`docs/POKEDEX_DISTRIBUCION.md` (sección 7: curva, tablas por zona, megapiedras, reconciliación D28) ·
`docs/DECISIONES.md` (registro D09–D30 y X02, X06+).

**Convenciones.**
- Todo lo que no es VIGENTE (biblia) ni DECIDIDO (autor) es **DECIDIDO-DEV** y está en el registro de DECISIONES.md.
- IDs de especies, movimientos y objetos: los del PBS de Añil. «ID nuevo» = objeto que hay que añadir a
  `game/data/items_axis.json` (lista completa en §2.9).
- Tilesets por ID de `tilesets.json`: 1 Exterior1 · 2 Cueva1 · 3 Exterior2 · 4 Interior1 · 5 Exterior3 ·
  6 ExteriorSafari · 7 ExteriorBosqueCeleste · 8 InteriorLiga · 9 ExteriorPrisma · 11 InteriorTorre · 12 Cueva Hielo ·
  13 Cueva Volcán · 14 Cueva Morada · 15 Cueva Azul.
- BGM y fondos de combate: nombres de archivo de `Pokemon Anil V4.13/Audio/BGM` y `Graphics/Battlebacks`
  (TÉCNICO provisional, X04/X20: reemplazables).
- Bloques de implementación: **B01** (existente) y **B02–B24** (este documento). Flags en `snake_case` con prefijo del
  bloque (`b02_…`); estados globales sin prefijo (`p1_restored`, `zyg_10`, `zyg_50`, `zyg_complete`…).

**Lo que este documento NO reintroduce (DESCARTADO en la biblia):** sueño o voz explicativa, altar, trato policial,
Mankey/paquete, Snorlax con Poké Flauta, campeón de Sinnoh o amnesia, fase Hada, Estabilizador Z, Unown como
transporte, suero o muerte de Gael, tres plantas por Pilar como fórmula, Guardianes como líderes de gimnasio
disfrazados, topónimos de Añil/Kanto/Sinnoh como canon (salvo Columna Lanza, VIGENTE).

### La campaña en doce líneas

1. Axis tiene dos ejes: el **vertical** va de la Cumbre Azur (Columna Lanza, en su techo) a la Sima del Eje (Pilar del
   Origen, en su fondo); el **del agua** es el Río Albo, que nace en la gran cascada del Monte del Portal (prólogo).
2. La primera mitad es un bucle horario desde Villa Alba que vuelve a casa (P1–P6). **Cada Pilar restaurado deshace la
   anomalía que bloquea el tramo siguiente**: ese es su efecto local real (biblia §3).
3. 100 células y 5 núcleos repartidos en 8 etapas; ninguna en zonas de Forma Completa; el grafo S0–S10 (§2.5)
   demuestra que no hay bloqueos, con márgenes de +4 a +11 células en cada umbral.
4. Las 18 Tablillas son las 17 tablas de tipo más la Tabla Legendaria. No existe «Tabla Normal» (BLANKPLATE no se usa).
5. Las 15 Tablillas son arcos de historia regional y a la vez la **Crónica** de Axis (la Tañedora, el Rey del Eje,
   Antea) y el mapa de bajada al Origen. No hay umbrales de Tablillas por Pilar: solo P10 exige las 15.
6. Genesis actúa desde el principio con fachadas (Consorcio y Fundación Meridiano). Su líder, el Dr. Aurelio Vértice,
   es mecenas del museo, se revela en la Estación Talasa, cae en el P9 y abandona Axis en el epílogo.
7. Alerce participó en el «Proyecto Laguna» (la laguna que hoy es la Marisma Turbia) y calló. Se revela por subtexto en
   una escalera de diez escenas, casi todas **después** del P5, sin confesión. Combate como aliado en Talasa.
8. Gael oyó la misma señal, pidió permiso y esperó. Su herida pasa de «esperé permiso» a «quiero ser quien llama», que
   enlaza con los anillos de Hoopa del DLC 1.
9. La profecía del elegido (D02/D02b) son diez versos Unown, uno por Pilar; el Core la insinúa, las inscripciones la
   revelan y Arceus la confirma en Columna Lanza.
10. El Trío de las Nubes es el último sello del Pacto (Crónica XI) y además ha sentido el drenaje de Genesis; cede
    cuando Zygarde responde por el protagonista.
11. Arceus despierta «para medir»: tres fases fijas (Tierra, Fantasma, Normal), una pregunta por fase, captura solo en
    la fase 3 y reintento sin pérdida.
12. Pokédex de Axis: 425 entradas (412 + 13 reconciliaciones). Todo el juego base y su postgame se completan en
    solitario; nada obligatorio depende de DLC, co-op ni capturas posteriores a Arceus.

---

## 1. Atlas de Axis (X02, DECIDIDO-DEV)

### 1.1 Lógica del territorio

- **Eje vertical.** La **Cumbre Azur** (centro-norte) es la cima más alta; en su techo, sobre las nubes, está
  **Columna Lanza** (VIGENTE). Durante la campaña no se sube a pie: la **Senda del Lazo** forma un bucle espacial. La
  **Sima del Eje** (centro-sur) es el abismo que se abrió en tiempos del Rey del Eje (Crónica IX, §4 de TABLILLAS.md);
  el Puente de la Convergencia (P9) la cruza y en su fondo está el Pilar del Origen (P10). El Salto de Convergencia
  recorre este eje de abajo arriba.
- **Eje del agua.** El **Río Albo** nace en la gran cascada del **Monte del Portal** (noroeste; X22), atraviesa la
  Garganta del Albo (P2) y Ciudad Caudal, se hunde en la Sima y reaparece en el Delta, junto a Ciudad Nexo. Es la
  misma agua del prólogo.
- **Ritmo.** Primera mitad en sentido horario desde Villa Alba: sur, centro, este, sureste, sur, oeste, noroeste y
  regreso a casa (P1–P6). Segunda mitad: el mar del sur (P7), el norte helado (P8) y el centro vertical (P9–P10).
- **Barreras legibles.** Solo físicas: cuestas de grava, troncos y rocas agrietadas, barro/arena/nieve, paredes, agua
  profunda, fondos, vacíos, niebla, vendavales, hielo-eco. Ninguna puerta muestra una cifra.

| Barrera (lectura en mapa) | Aspecto | Se supera con |
|---|---|---|
| Cuesta de grava, pasarela quebradiza | grava suelta con marcas de derrape | Correr (montura 10%) |
| Roca agrietada, tronco caído | fisura blanca con brillo verde tenue | Embestida |
| Barro, arena profunda, nieve honda | textura con huellas hundidas | Terreno complicado |
| Pared con raíces o asideros | vetas verticales verdes | Trepar |
| Agua profunda | — | Nadar (50%) |
| Agua oscura con burbujas | remolino azul marino | Buceo (50%) |
| Vacío con zócalos hexagonales gastados | piedras con hexágonos | Reconstrucción (Completa) |
| Destino ya visitado | — | Vuelo (Completa) |
| Vendaval de la Ruta 6, vado de la Ruta 4, Paso del Derrumbe, niebla del Neblino, hielo-eco | anomalía visible | restaurar el Pilar anterior |

### 1.2 Mapa regional (esquema)

```
                     ~ ~ ~ ~ ~ ~ ~ ~ ~  MAR BOREAL  ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
                                                         (Instalación Cierzo, post)
   /\/\/\ MONTE DEL PORTAL            /\  CUMBRE AZUR           LAGOS DEL ALMA ·P8
  ≈≈≈ gran cascada ≈≈≈ [aljibe ·P6]  /  \ (Columna Lanza)        (Saber/Sentir/Querer)
          ║ (Trepar)                /____\                              ║
          ║ Ruta 10 (alto)           ║ Ruta 12 «Senda del Lazo»    VILLA BOREAL ─ Gruta Escarcha
 BOSQUE   ║        [Laberinto de      ║ (bucle espacial)                ║ Ruta 13 (nieve)
 NEBLINO ═╣         la Profundidad]   ╚════════ PASO DEL NORTE ═════════╝
   ║ R9   ║             ║                             ║ Ruta 11 (hielo-eco hasta P7)
   ║      ╚═ Ruta 10 ═╗ VILLA ALBA  (Cerro del Alba)   ║
   ║      (bajo)      ╚══╗ Ruta 1                      ║                  MESETA DEL IMPULSO ·P3
 ALDEA MNEMOS ·P5        ║                             ║                (Anillo de los Vientos,
   ║            [P1 Umbral]─ VILLA ZAGUÁN              ║                 Parque Eólico)
   ║ Ruta 8                  ║ Ruta 2                  ║                        ║ Ruta 5 (troncos)
 (Marisma Turbia,  GARGANTA  ║                    VILLA BRONTIA ══════════════╝
  Palafitos)       DEL ALBO ·P2                        ║ Ruta 6 (vendavales hasta P3; Cantería)
   ║                  ╚ R3 ═ CIUDAD CAUDAL ══ Ruta 4 ══╝ (vado hasta P2)
   ║                          ║ Senda del Mirador       ║
   ║               (((  SIMA DEL EJE  )))═══ Calzada del Rey (T15)
   ║                P9 Puente / P10 Fondo               ║
   ║                          ║ Mirador Sur (Grieta del Porvenir, post)
 CIUDAD LÚMINA ═══════════════╩══════ Ruta 7 (Paso del Derrumbe hasta P4) ═══ CIUDAD ESTRATO ═ DUNAS DE CENIZA
   ║ Ruta 14 (Reserva del Delta)          (tren regional tras P4)                      (Cerro Plomo ·P4)
 CIUDAD NEXO ≈≈≈≈≈≈≈≈≈≈ MAR DEL SUR · sector este ≈≈ VOLCÁN TIZÓN (forja) ≈≈ BASTIÓN AXIS (post)
   ║ Ruta 15 (Sendero de los Acantilados)   ≈ sector centro ≈ ESTACIÓN TALASA (Sima Marina, post)
 CALETA SONDA ≈≈ sector oeste ≈ Islote Lumbre
   ░░ ARRECIFE DEL ECO · Ruinas de Antea ·P7 ░░        ~ FONDO DEL MAR DEL SUR (Buceo) ~
```

Cambios respecto a la propuesta base (reducción de producción pedida por los jueces): el mar del sur es **un solo
mapa en tres sectores con capa de superficie y capa de fondo** (sustituye a las antiguas Rutas 15 marina, 16 y 17); la
antigua Ruta 16 terrestre pasa a ser la **Ruta 15, Sendero de los Acantilados**; el caserío de herreros vive dentro del
primer mapa del Volcán Tizón y los Palafitos dentro del mapa de la Ruta 8.

### 1.3 Poblaciones

| Población (estado) | Bioma | TS | Tamaño | Conexiones | Servicios | BGM | Acceso |
|---|---|---|---|---|---|---|---|
| **Villa Alba** (X01) | Pueblo de piedemonte entre bosque | 7 | 46×36 (Map233) | N Laberinto · S Ruta 1 | Casa (Mamá cura), Laboratorio de Alerce (puerta del fondo cerrada hasta el epílogo), casa de Gael, 2 casas. Sin Centro ni tienda | X04 (nostálgica) | Inicio |
| **Villa Zaguán** | Aldea de huertos a la salida del bosque | 1 | 40×36 | N Ruta 1 · O explanada del P1 · S Ruta 2 | **Primer Centro Pokémon**, tienda, Arboleda de los Nombres, campanario, Casa del Dintel (Casilda) | PrismaVilla2 | Libre |
| **Ciudad Caudal** (historial) | Ciudad fluvial de canales y esclusas | 3 + autotile agua | 64×56 | N Ruta 2 · NO Ruta 3 · E Ruta 4 · S Senda del Mirador | Centro, tienda, Casa de las Esclusas (Leandro), Barrio de los Molinos, pescador (Caña Vieja), mercado fluvial, tutor, estación (tras P4) | CiudadCeleste | Tras el P1 (puente de la Ruta 2, X35) |
| **Villa Brontia** (historial) | Meseta con molinos y campanario | 1 | 44×40 | O Ruta 4 · E Ruta 5 · N Ruta 11 · S Ruta 6 | Centro, tienda, subestación, campanario de Sixto, casa de Abril, corrales de Wooloo, posada, estación | PuebloMarengo | Vado de la Ruta 4 (tras P2) |
| **Ciudad Estrato** (historial) | Ciudad minera en cañón escalonado | 5 | 56×48 | N Ruta 6 · E Dunas de Ceniza · O Ruta 7 | Centro, tienda, Mina Galena, Escuela del Pico, oficinas del Consorcio, casa de Fermín, mercado de minerales (tras P4), estación | CiudadVerde | Ruta 6 (tras P3) |
| **Ciudad Lúmina** (historial) | Capital cultural | 3 (museo con piezas de 1) | 72×64 | E Ruta 7 · NO Ruta 8 · S Ruta 14 · N Mirador Sur | Centro, Grandes Almacenes (Cordón Unión, piedras), **Museo de las Eras**, estación central, guardería, Parque de las Eras, tienda de trastos, pastelería, Hotel Mirador, tutor | CiudadAzulona | Ruta 7 (tras P4) |
| **Aldea Mnemos** (historial) | Aldea de bambú, cerezos y archivos | 9 | 48×44 | SE Ruta 8 · N Ruta 9 | Centro, herbolario, **Archivo Hondo (P5)**, casa de té, Santuario de los Glifos, casa de Olvido | PrismaVilla1 | Terreno (Marisma) |
| **Ciudad Nexo** (historial) | Puerto y nudo de comunicaciones | 1 | 64×52 | N Ruta 14 · O Ruta 15 · S/E Mar del Sur | Centro, tienda, puerto (ferris tras P7), faro, astillero, Correos (Don Evaristo), Aduana Vieja (DLC 2), pescador (Caña Buena), estación | CiudadCarmin | Tras P4 |
| **Caleta Sonda** | Pueblo de pescadores y buzos | 1 + palmeras de 6 | 36×32 | E Ruta 15 · O/S Arrecife del Eco | Centro pequeño, tienda de pesca (Supercaña), Faro Sonda (Ramón), muelle de buzos | Azul Tema | Ruta 15 (tras P4) |
| **Villa Boreal** (historial) | Pueblo de observadores de auroras | 1 (nieve) | 44×40 | S Ruta 13 · N Lagos del Alma · E Gruta Escarcha · O Mar Boreal | Centro, tienda, Observatorio Boreal, Talleres del Hielo, posada, muelle (ferri tras P7) | Emociones | Tras P7 |
| **Mesa de los Vientos** | Comunidad aislada sobre una mesa rocosa | 1 | 40×40 | Solo por Vuelo | Cuidadores de Altaria (curan) | viento | Vuelo (T14) |
| **Bastión Axis** (historial) | Fortaleza costera convertida en instalación de combate | 3 + 8 | 40×40 + interiores | Mar del Sur (sector este) | Instalación de combate, Centro | Torre Batalla | Postgame |

No se usan «Aldea Glífica» (su función la cumple el Santuario de los Glifos de Mnemos), «Laberinto del Orden» ni
«Pueblo Pétreo» (X21).

### 1.4 Rutas y zonas

| Zona | Bioma | TS | Tamaño | Conexiones | BGM | Acceso / capacidad |
|---|---|---|---|---|---|---|
| **Ruta 1** | Bosque y claros | 7 | 30×60 | N Villa Alba · S Zaguán · O cruce a Ruta 10 · E Cerro del Alba | Ruta 1 | Libre. Cuesta de grava al mirador (Correr); cornisa del Cerro del Alba (Trepar) |
| **Laberinto de la Profundidad** (X03) | Laberinto privado de setos y piedra | 7 / 2 | 40×34 | S Villa Alba | Amenaza | Solo en la apertura; después la familia Arenzana lo cierra. Nodo de la Red de Convergencia en el postgame |
| **Ruta 2** | Pradera, estanque, puentes | 1 | 30×70 | N Zaguán · S Caudal | Ruta 2 | Libre hasta el puente del arroyo; al sur, tras el P1 (X35). Rampa (Correr), estanque (Nadar) |
| **Ruta 3** | Ribera con cuestas de grava | 1 | 40×50 | SE Caudal · NO Garganta | PrismaRuta1 | **Correr** |
| **Garganta del Albo** | Desfiladero con cascadas | 1 + 2 | 40×40 | S Ruta 3 · Pilar de la Corriente | PrismaRuta1 | Correr (Pozo del Albo: Buceo; pared: Trepar) |
| **Ruta 4** | Vega inundable y subida a la meseta | 1 | 80×30 | O Caudal · E Brontia | Ruta 3 | **Vado abierto al restaurar P2** |
| **Ruta 5** | Meseta ventosa | 1 | 60×40 | O Brontia · E Meseta | viento | **Embestida** (troncos) |
| **Meseta del Impulso** | Altiplano con el Anillo de los Vientos y el Parque Eólico | 1 + 4 | 50×50 | O Ruta 5 | viento / GuaridaRocket (parque ocupado) | Embestida |
| **Ruta 6** | Cañón escalonado con la Cantería Solano | 5 + 6 | 30×70 | N Brontia · S Estrato | PrismaRuta2 | **Vendavales hasta P3**; derrumbe (T04) |
| **Dunas de Ceniza** | Desierto gris con el Cerro Plomo | 6 | 60×50 | O Estrato | IslaCanela | **Terreno complicado** |
| **Ruta 7** | Valle ferroviario al sur de la Sima | 5 | 90×30 | E Estrato · O Lúmina · N Mirador de la Calzada | Ruta 3 | **Paso del Derrumbe despejado al restaurar P4** |
| **Ruta 14 y Reserva del Delta** | Delta tropical | 6 | 60×60 | N Lúmina · S Nexo | ZonaSafari | Libre; Reserva interior tras T07; laguna con Nadar/Buceo |
| **Ruta 8, Marisma Turbia y Palafitos** | Marisma de barro con caserío sobre pilotes | 6 | 50×70 | SE Lúmina · NO Mnemos | PuebloLavanda | **Terreno complicado**; los Palafitos (curandera Remedios, puesto) son parte del mapa |
| **Ruta 9 y Bosque Neblino** | Bosque lila de cristales | 7 | 50×60 | S Mnemos · N Ruta 10 | PrismaBosqueArcoiris | **Niebla del olvido en bucle hasta P5** |
| **Ruta 10** | Faldas del Monte | 7 / 1 | 60×40 | E Ruta 1 · O Monte · S Neblino | BosqueVerde | Tramo bajo libre; tramo alto con **Trepar** |
| **Monte del Portal** (`montana_portal`, B01) | Ruina de montaña: gran cascada, explanada, escalinata ascendente, aljibe | 1 + 2 | 50×70 | E Ruta 10 | Intro (eco del prólogo) | **Trepar** |
| **Cerro del Alba** | Cornisa y cima sobre Villa Alba | 1 | 24×30 | Ruta 1 | Ruta 1 | Trepar; brasero de Ho-Oh (post) |
| **Ruta 11** | Vertiente nevada | 1 (nieve) | 30×70 | S Brontia · N Paso del Norte | PrismaRuta2 | **Hielo-eco hasta P7** |
| **Paso del Norte** | Collado con refugio | 1 (nieve) | 30×30 | S Ruta 11 · O Ruta 12 · N Ruta 13 | PrismaRuta2 | Tras P7 |
| **Ruta 12, Senda del Lazo** | Ladera de la Cumbre Azur | 1 | 40×50 | E Paso del Norte | Transicion | Tramo bajo libre; el alto es un bucle que solo rompe el Anclaje espacial (postgame) |
| **Ruta 13** | Nieve profunda | 1 (nieve) | 30×60 | S Paso del Norte · N Villa Boreal | Ruta 2 | **Terreno complicado** |
| **Lagos del Alma** | Tres lagos glaciares con santuario central | 1 + 11 | 60×60 | S Villa Boreal | VinculoSupremo | **Nadar** |
| **Gruta Escarcha** | Cueva de hielo | 12 | 2 × 40×40 | O Villa Boreal | Cueva | Tras P7 |
| **Mar Boreal** | Mar frío | 1 | 50×40 | E Villa Boreal | Azul Tema | Nadar, tras P7 |
| **Ruta 15, Sendero de los Acantilados** | Acantilados y playas | 1 | 90×40 | E Nexo · O Caleta Sonda | Azul Tema | Sendero libre tras P4 |
| **Mar del Sur** (superficie) | Un mar en tres sectores (oeste: Caleta y Lumbre; centro: Talasa; este: Tizón y Bastión) | 1 | 3 × 60×50 | Nexo, Caleta Sonda, Ruta 15 | Azul Tema | **Nadar** |
| **Fondo del Mar del Sur** | Capa submarina de los tres sectores; Fosa Abisal al este | 15 (+ fog `007-Water01`) | 3 × 60×50 | Remolinos del Mar del Sur | Emociones | **Buceo** |
| **Islote Lumbre** | Islote de cerezos y farolillos | 9 | 24×24 | Mar del Sur (oeste) | Pokeflauta | Nadar |
| **Volcán Tizón** | Cono volcánico; el caserío de la forja ocupa la ladera | 13 + 5 | 3 × 40×50 | Mar del Sur (este) | MansionQuemada | Nadar |
| **Estación Talasa** | Plataforma de investigación (Genesis) | 5 + 4 | 40×40 + 3 interiores | Mar del Sur (centro) | GuaridaRocket | Nadar |
| **Arrecife del Eco** | Arrecife y Ruinas de Antea (P7) | 15 + capas de eco con 2/7 | 4 salas × 3 capas | Mar frente a Caleta Sonda | Emociones | **Buceo** |
| **Sima del Eje** | Abismo central | 1 + 2 + 8 | varios | N Senda del Mirador (Caudal) · S Mirador Sur (Lúmina) · E Calzada del Rey | Amenaza / Climax | **Reconstrucción** |
| **Cumbre Azur, Columna Lanza** | Cima sobre las nubes | 8 + panorama `astral` | 30×40 | Salto de Convergencia (final); Vuelo y Senda del Lazo (post) | Final2 | Salto |

### 1.5 Pilares y lugares de trama

Decisión posterior del creador (26-09; X36): los diez Pilares son columnas verticales de tres pisos.
La primera planta reúne a los entrenadores, la segunda conserva los puzzles y la tercera contiene al Guardián
y al núcleo en P1–P5, implementados el 03-10. P6 conserva solo puzzles. El reparto de P7–P10 se confirmó
el 03-10. Estos repartos sustituyen las descripciones antiguas de una sola planta en los bloques de abajo.

| Pilar | Lugar | TS | Estructura | Acceso | Custodia / presencia |
|---|---|---|---|---|---|
| P1 Umbral | Ruinas del Dintel, junto a Villa Zaguán | 2 + 7 (+ kit de Pilar) | 3 pisos: entrenadores → dinteles y Geodude → Casilda y núcleo | Ninguno | Guardiana **Casilda Roquer** |
| P2 Corriente | Garganta del Albo | 15 | 3 pisos: entrenadores → Escalera de Estanques → Leandro y núcleo | Correr | Guardián **Leandro Alcántara** |
| P3 Impulso | Anillo de los Vientos, Meseta | 1 + 2 | 3 pisos: entrenadores → galerías y campanas → Abril y núcleo | Embestida (y vado de P2) | Guardiana **Abril Céspedes** |
| P4 Masa | Cerro Plomo, Dunas de Ceniza | 2 | 3 pisos: entrenadores → Cámara de los Contrapesos → Fermín y núcleo | Terreno (y P3) | Guardián **Fermín Galena** |
| P5 Memoria | Archivo Hondo, Aldea Mnemos | 4 + 11 + 9 | 3 pisos: Archivo de papel y entrenadores → cinco estancias de recuerdos → Olvido y núcleo | Terreno (Marisma) y P4 | Guardiana **Olvido Arrieta** |
| P6 Invertido | Monte del Portal → Mundo Distorsión | 14 + fondo MundoDistorsion + fog `portal` | 3 pisos: Cara Vuelta → Mirada → Sumidero y sello | Trepar | Nadie; la sombra de Giratina cruza una vez |
| P7 Ecos | Ruinas de Antea, Arrecife del Eco | 15 + capas | 3 pisos: ruinas → cuatro salas con tres capas temporales → Bramaluna | Buceo | Bramaluna Alfa (dominante, no guardiana) |
| P8 Alma | Santuario del Alma, Lagos del Alma | 11 + 1 | 3 pisos: Uxie → Mesprit → Azelf y Telar | Nadar (y P7) | Uxie, Mesprit y Azelf |
| P9 Convergencia | Puente de la Convergencia sobre la Sima | 8 + 1 | 3 pisos: puente → Cámara del Cruce → Dialga/Palkia | Reconstrucción | Dialga y Palkia |
| P10 Origen | Fondo de la Sima | 8 + 2 | 3 pisos: Senda → Cielo Interior → Gael y núcleo; Puerta de las Quince en el acceso | 9 Fragmentos, 15 Tablillas, Completa | Trío de las Nubes y Gael |

### 1.6 Zonas de postgame (detalle en §8)

Mundo Distorsión profundo (por el aljibe) · Columna Lanza y la Senda del Lazo abierta · **Grieta del Porvenir**
(Mirador Sur de la Sima: Paradojas de hierro) · Ruinas de Talasa (Ditto) · Sima Marina bajo Talasa (Lugia) · Cerro del
Alba (Ho-Oh) · Fosa Abisal (Kyogre) y Veta Magmática (Groudon) · tres Cuevas Selladas y la Cámara del Coloso (Regis) ·
Instalación Cierzo (Mewtwo) · Bastión Axis · Red de Convergencia (Laberinto, Origen, Columna Lanza, aljibe). Solo DLC 2:
Isla Pétalo, Isla del Estandarte, Cráter del Lucero, Sala de los Dos Ideales.

### 1.7 Transporte (X12)

- **Carrera humana** desde el inicio (X05); la montura del 10% es el doble de rápida.
- **Tren regional** tras P4 (el hundimiento de Estrato había suspendido la línea): Caudal, Brontia, Estrato, Lúmina y
  Nexo; cada estación se activa al visitarla.
- **Ferris** tras P7 (las mareas del eco se calman): Nexo ↔ Caleta Sonda y Nexo ↔ Villa Boreal.
- **Vuelo** (Completa) a lugares descubiertos, en 2D con selector de destino. Presentación original: Zygarde se
  disgrega en su red de hexágonos verdes y se rehace en el destino con el jugador (no vuela como un pájaro).
- **Red de Convergencia** (postgame): solo cuatro lugares excepcionales (Laberinto, Origen, Columna Lanza, aljibe),
  nunca ciudades. No es teletransporte entre poblaciones (biblia §8).

### 1.8 Reglas de producción (TÉCNICO, injerto de la propuesta «producción»)

- **Kit común de Pilar (X23).** Unos 12 *stamps* sacados de InteriorTorre (11) y Cueva1 (2): monolito, dintel, canal
  de resonancia, placa Unown, pedestal de Fragmento, columna quebrada, escalinata, cámara de núcleo, zócalo hexagonal,
  losa de eco, arista violeta y manantial. Se reutilizan en los diez recintos con un **tinte por Pilar** (P1 ocre,
  P2 azul, P3 blanco, P4 gris plomo, P5 sepia, P6 violeta, P7 verde agua, P8 rosa pálido, P9 plata, P10 oro). Añadirlos
  a `docs/stamps.md` como grupo `pilar_*`. Así los interiores dejan de «parecer solo cueva» (biblia §14).
- **Regla de redundancia.** Ningún par de mapas repite a la vez bioma y tileset, salvo el mar (un único mar por capa).
- **Nieve.** Ruta 11, Paso del Norte, Ruta 13 y Villa Boreal usan Exterior1 con sus piezas de nieve; verificar al
  mapear (si faltan, piezas de Cueva Hielo en bordes). No se usa ExteriorBosqueCeleste para la nieve.

**Fondos de combate por zona.**

| Zona | Fondo | Zona | Fondo |
|---|---|---|---|
| Villa Alba, Ruta 1, Ruta 10 | Bosque | Garganta, Caudal (agua) | water_rio |
| Zaguán, Ruta 2 | Pradera / PraderaFlores | P1, P5 | Templo |
| P2, cuevas de agua | CuevaAzul / water_cueva_azul | Meseta, P3 | Acantilado |
| Parque Eólico | Central | Ruta 6, Cantería | ZonaEscarpada |
| Dunas, Ruta 7 | Desierto | P4, Mina | Cueva / CuevaOscura |
| Reserva, Ruta 14 | Pradera3 | Marisma | Pradera2 |
| Neblino | BosqueLila | Monte del Portal | Monte |
| P6 | MundoDistorsion | Mar del Sur | water / Playa |
| Buceo, P7 presente | Sub | P7 eco | Templo (Antea) / Pradera3 (primigenia) |
| Talasa | BaseVillano / Laboratorio | Volcán Tizón | Volcan / CuevaRoja |
| Norte (rutas) | snow / CimaNevada | Gruta Escarcha | CuevaHielo |
| Lagos del Alma, P8 | Templo / Agua | Sima, P9 | Espacio |
| Trío de las Nubes | Volando | P10, Cumbre | Cielo / Monte |
| Columna Lanza | ColumnaLanza (fases 1–2) · Arceus (fase 3) | Ultrazonas (DLC 2) | Ultraespacio |

**Música por situación (X20).**

| Situación | Tema | Situación | Tema |
|---|---|---|---|
| Salvaje | PrismaSalvaje | Entrenadores | PrismaEntrenador |
| Gael (B1–B5) | CombateRival | Gael B6 | CombateRival → «Ultimo Pokemon» en su último Pokémon |
| Guardianes | CombateLider | Casia y Garrido | CombateComandante |
| Vértice | CombateGiovanniFinal | Técnicos de Genesis | EncuentroRocket |
| Bramaluna, Alfas | PrismaBoss | Legendarios de Pilar | Legendario |
| Trío de las Nubes | Legendario menor | Arceus fases 1–2 / fase 3 | Legendario mayor / PrismaBossFinal |
| Pilar restaurado | VinculoSupremo (jingle) → LeyendaPrisma | Flauta Azur | Pokeflauta |
| Prólogo | Climax; cascada con motivo de Intro | Créditos | Creditos |

---

## 2. Zygarde: progresión y grafo de disponibilidad (D10)

### 2.1 Umbrales finales

| Capacidad | Forma | Células | Núcleos | Condición narrativa | Escena |
|---|---|---|---|---|---|
| **Correr** (montura) | 10% | 10 | N1 | P1 restaurado | A la salida de las Ruinas del Dintel, al atardecer, con Casilda y Gael delante. Garantizada: hay 10 células en el camino obligatorio antes del núcleo (§2.3) |
| **Embestida** | 10% | 18 | N1 | — | Automática al llegar a 18: «Recuerdo cómo se abre paso». Siempre hay una roca de tutorial a menos de 20 casillas |
| **Terreno complicado** | 10% | 25 | N1+N2 | — | Al unirse N2 en el Colector del Parque Eólico (o al llegar a 25 si faltaban) |
| **Trepar** | 10% | 35 | N1+N2 | P5 restaurado | Núcleo del Archivo Hondo: Zygarde «recuerda» subir |
| **Nadar** | 50% | 50 | N1–N3 | — | Al liberar N3 en el P6 (o al llegar a 50) |
| **Detección mejorada** | 50% | 60 | N1–N3 | — | Automática |
| **Buceo** (burbuja) | 50% | 70 | N1–N4 | Resonancia en el muelle de buzos | Caleta Sonda: Zygarde envuelve al jugador en su campo |
| **Vuelo + Reconstrucción** | Completa | 100 | N1–N5 | Crisis al terminar P8 | Lagos del Alma (puente de hielo, §3 B16). Si faltan células, al recoger la número 100 |
| **Anclaje espacial** | Completa | — | — | Tras Arceus | Solo Senda del Lazo y Mundo Distorsión profundo (X16) |
| **Salto de Convergencia** | 10% deliberado | — | — | Tras P10 | Nodo del Origen → Columna Lanza |

Regla general: si se cumple el hito narrativo sin las células, el Core dice cuántas faltan («Me faltan dos partes») y
la capacidad se activa al recoger la que falta, con una escena corta genérica. **No hay Estabilizador Z.** El **Arca de
Zygarde** (`ZYGARDECUBE`, existe en Añil) es un objeto de los antiguos Custodios que aparece junto al Fragmento 1
(X15): cuenta células, cambia de forma, no obliga a nada. La permanencia del 100% nace de la crisis y del vínculo.

### 2.2 Detección

> **Revisado — DECIDIDO (autor, 25-09-2026), DECISIONES X34:** sin latido, pitido ni flecha. Antes del 50% solo queda
> el rótulo «Células: n/m»; la Detección mejorada son solo las marcas del mapa regional. Lo que sigue se conserva como
> referencia del diseño original.

1. **Antes del 50%.** El Core, y luego el 10%, **laten** cuando hay una célula a 10 casillas o menos (sonido y brillo
   más rápidos al acercarse). El rótulo de cada mapa visitado muestra «Células: n/m» (Arca y Pokédex, D05b). Cada
   Guardián da una pista verbal sobre la célula más escondida de su comarca.
2. **Detección mejorada (60).** Flecha hacia la célula más cercana del mapa y marcas en el mapa regional para los mapas
   visitados.
3. **Crisis de P8.** Todas las células restantes brillan en el mapa regional, también en zonas no visitadas.

### 2.3 Las 100 células

Clave de evento persistente: `cell_<mapa>_<n>` (injerto «producción»); ID de catálogo `C###`. «Oblig.» = en el camino
obligatorio o entregada por guion. Etapas: A sin capacidad · B Correr · C tras P2/Embestida · D Terreno (tras P3/P4) ·
E Trepar · F Nadar · G Buceo · H tras P7.

| ID | Evento | Mapa | Etapa | Ubicación | Oblig. |
|---|---|---|---|---|---|
| C001 | `cell_villa_alba_1` | Villa Alba | A | Parterre central; escena forzada al salir del laboratorio con la Pokédex (`b01_dex_received`) | Sí |
| C002 | `cell_ruta_1_1` | Ruta 1 | A | Puente de troncos del primer arroyo (paso único) | Sí |
| C003 | `cell_ruta_1_2` | Ruta 1 | A | Estrechamiento entre rocas junto a la hierba alta | Sí |
| C004 | `cell_ruta_1_3` | Ruta 1 | A | Junto al Bichero Luis (el camino pasa a su lado) | Sí |
| C005 | `cell_ruta_1_4` | Ruta 1 | A | Junto al cartel «Pilar del Umbral» | Sí |
| C006 | `cell_ruta_1_5` | Ruta 1 | A | Claro del este | — |
| C007 | `cell_ruta_10_1` | Ruta 10 (baja) | A | Orilla del Albo | — |
| C008 | `cell_zaguan_1` | Villa Zaguán | A | Calle principal, junto a la Arboleda | Sí |
| C009 | `cell_zaguan_2` | Villa Zaguán (Casilda) | A | Regalo al aceptar acompañar: «Esto brillaba en el patio» | Sí |
| C010 | `cell_umbral_1` | Pilar del Umbral | A | Antesala | Sí |
| C011 | `cell_umbral_2` | Pilar del Umbral | A | Galería de los Dinteles | Sí |
| C012 | `cell_umbral_3` | Pilar del Umbral | A | Cámara de Geodude | Sí |
| C013 | `cell_ruta_2_1` | Ruta 2 | A | Bajo el puente | — |
| C014 | `cell_caudal_1` | Ciudad Caudal | A | Esclusa mayor | — |
| C015 | `cell_ruta_2_2` | Ruta 2 | B | Rampa de grava | — |
| C016–C018 | `cell_ruta_3_1…3` | Ruta 3 | B | Tres cuestas de grava | Sí (una) |
| C019–C020 | `cell_garganta_1…2` | Garganta del Albo | B | Repisa de la cascada pequeña; molino abandonado | — |
| C021–C023 | `cell_corriente_1…3` | Pilar de la Corriente | B | Fondos de estanques vaciados (E1, E4, E6) | Sí |
| C024 | `cell_ruta_1_6` | Ruta 1 | B | Cuesta de grava al mirador | — |
| C025–C026 | `cell_ruta_4_1…2` | Ruta 4 | C | Vega; C026 tras una roca agrietada | — |
| C027 | `cell_brontia_1` | Villa Brontia | C | Molino de la puerta atascada | — |
| C028 | `cell_ruta_5_1` | Ruta 5 | C | Tras los troncos | — |
| C029–C032 | `cell_colector_1…4` | Parque Eólico (Colector) | C | Liberadas por guion al romper el Colector | Sí |
| C033–C034 | `cell_impulso_1…2` | Pilar del Impulso | C | Galería de las Flechas; Sala de las Campanas | Sí |
| C035 | `cell_ruta_6_1` | Ruta 6 | D | Bancal de la Cantería | — |
| C036 | `cell_mina_galena_1` | Mina Galena | D | Veta de cristal | — |
| C037–C038 | `cell_dunas_1…2` | Dunas de Ceniza | D | Arena profunda | — |
| C039–C040 | `cell_masa_1…2` | Pilar de la Masa | D | Galería inferior; junto a la Gran Balanza | Sí |
| C041 | `cell_ruta_7_1` | Ruta 7 | D | Bajo el andén abandonado | — |
| C042 | `cell_lumina_1` | Ciudad Lúmina | D | Parque de las Eras | — |
| C043 | `cell_reserva_1` | Reserva del Delta | D | Huerto | — |
| C044 | `cell_marisma_1` | Ruta 8 (Marisma) | D | Barro junto a una bomba del Consorcio | — |
| C045 | `cell_mnemos_1` | Aldea Mnemos | D | Bambú tras la casa de té | — |
| C046 | `cell_memoria_1` | Pilar de la Memoria | D | Estancia de los Rollos | Sí |
| C047–C048 | `cell_neblino_1…2` | Ruta 9 y Neblino | E | Copa de un tronco hueco; repisa de cristal | — |
| C049 | `cell_ruta_10_2` | Ruta 10 (alta) | E | Pared de raíces | — |
| C050–C051 | `cell_monte_1…2` | Monte del Portal | E | Explanada quemada; mitad de la escalinata | Sí (una) |
| C052–C053 | `cell_invertido_1…2` | Pilar Invertido | E | La Cara Vuelta; El Sumidero | Sí |
| C054 | `cell_cerro_alba_1` | Cerro del Alba | E | Cornisa | — |
| C055 | `cell_garganta_3` | Garganta del Albo | E | Pared | — |
| C056 | `cell_ruta_6_2` | Ruta 6 | E | Pared del cañón | — |
| C057–C058 | `cell_mar_sur_1…2` | Mar del Sur (centro) | F | Escollos camino de Talasa | — |
| C059–C060 | `cell_talasa_1…2` | Estación Talasa | F | Cubiertas; siguen accesibles tras el asalto | Sí (una) |
| C061–C062 | `cell_mar_sur_3…4` | Mar del Sur (oeste) | F | Frente a Caleta Sonda | — |
| C063 | `cell_lumbre_1` | Islote Lumbre | F | Gruta de la luna | — |
| C064 | `cell_caleta_1` | Caleta Sonda | F | Muelle de buzos | — |
| C065–C066 | `cell_mar_sur_5…6` | Mar del Sur (este) | F | Islas de basalto | — |
| C067 | `cell_tizon_1` | Volcán Tizón | F | Forja fría | — |
| C068 | `cell_caudal_2` | Ciudad Caudal | F | Bajo el tercer puente (canal) | — |
| C069 | `cell_garganta_4` | Garganta del Albo | F | Poza grande | — |
| C070 | `cell_zaguan_3` | Ruta 2 / Zaguán | F | Estanque | — |
| C071 | `cell_reserva_2` | Reserva del Delta | F | Laguna | — |
| C072 | `cell_marisma_2` | Ruta 8 (Marisma) | F | Aguas hondas | — |
| C073 | `cell_ruta_4_3` | Ruta 4 | F | Río | — |
| C074 | `cell_mnemos_2` | Aldea Mnemos | F | Estanque de lotos | — |
| C075 | `cell_nexo_1` | Ciudad Nexo | F | Desembocadura del Albo en el Delta | — |
| C076 | `cell_monte_3` | Monte del Portal | F | Poza al pie de la gran cascada | — |
| C077–C078 | `cell_fondo_sur_1…2` | Fondo del Mar del Sur (centro) | G | Praderas de algas | — |
| C079–C080 | `cell_fondo_sur_3…4` | Fondo del Mar del Sur (oeste) | G | Bajo el Islote Lumbre | — |
| C081 | `cell_fondo_sur_5` | Fosa Abisal (este) | G | Borde de la Fosa | — |
| C082–C084 | `cell_ecos_1…3` | Pilar de los Ecos | G | Capa presente; las caracolas siguen funcionando tras P7 | Sí |
| C085 | `cell_garganta_5` | Pozo del Albo | G | Fondo del pozo | — |
| C086 | `cell_caleta_2` | Caleta Sonda | G | Bosque de algas | — |
| C087 | `cell_talasa_3` | Estación Talasa | G | Pilotes | — |
| C088 | `cell_reserva_3` | Reserva del Delta | G | Fondo de la laguna | — |
| C089–C090 | `cell_ruta_11_1…2` | Ruta 11 | H | Nieve de la vertiente | — |
| C091–C092 | `cell_ruta_13_1…2` | Ruta 13 | H | Nieve profunda | — |
| C093 | `cell_boreal_1` | Villa Boreal | H | Tejado del Observatorio | — |
| C094 | `cell_escarcha_1` | Gruta Escarcha | H | Lago helado | — |
| C095 | `cell_lagos_1` | Lagos del Alma | H | Islote del Lago del Sentir | — |
| C096 | `cell_mar_boreal_1` | Mar Boreal | H | Témpano | — |
| C097–C100 | `cell_alma_1…4` | Pilar del Alma | H | Una por ala y una en el Telar | Sí |

**Recuento por etapa:** A 14 · B 10 · C 10 · D 12 · E 10 · F 20 · G 12 · H 12 = **100**. Ninguna célula en zonas que
exijan Forma Completa (Mesa de los Vientos, Puente, Calzada, Sima, Origen). Obligatorias antes del núcleo del P1:
C001–C005, C008–C012 = **10**.

### 2.4 Los cinco núcleos

El plano final del prólogo (P-04) muestra **cinco estelas grandes** hacia el norte del pueblo, la meseta del este, el
propio aljibe, el mar del sur y el norte helado: anticipan N1–N5 sin texto.

| Núcleo | Dónde | Por qué está ahí | Escena | Desbloquea |
|---|---|---|---|---|
| **N1** | Laberinto de la Profundidad | La piedra central del laberinto es un nodo antiguo de la Red de Convergencia; los Arenzana levantaron el laberinto «para que nadie llegara a la piedra por casualidad». El Core se refugió en el único lugar que reconocía | B01 §4.6 | Compañero; Correr con P1 |
| **N2** | Colector del Parque Eólico (P3) | Genesis instaló un Colector de resonancia que atrae células; N2, que vagaba sobre la meseta, quedó atrapado en la esfera «Muestra Z-2» | Tras vencer a Casia se abre la esfera y los núcleos se funden. Zygarde: «Ahora recuerdo cómo se pisa la tierra blanda.» Casia: «Solo lo estábamos escuchando.» | Terreno (25) |
| **N3** | Núcleo del Pilar Invertido (P6) | Al expulsar a Giratina, N3 fue arrastrado al aljibe y se fundió con el mecanismo del Pilar para **taponar la brecha** | Restaurar el Pilar para que selle sin N3. Zygarde muestra dolor y gratitud por primera vez | 50% + Nadar (50) |
| **N4** | Estación Talasa (P6→P7) | Cayó al mar del sur; la draga de Genesis lo recuperó y lo estudia en un tanque de presión («Muestra Z-4») | Asalto con Alerce (§3 B13). Vértice, por pantalla: «Déjales el núcleo. Ya hemos aprendido lo que necesitábamos.» | Buceo (70) |
| **N5** | Villa Boreal (P7→P8) | Cayó al norte y quedó atrapado en el hielo-eco; Gael lo encontró cuando el hielo retrocedió, pero no le responde | Combate B5 con Gael y entrega (§6). Zygarde, a Gael, por primera vez: «Gracias, Gael.» | Completa (100 + crisis) |

### 2.5 Grafo de disponibilidad sin bloqueos

| Estado | Capacidades y hitos | Se abre | Células alcanzables (acum.) | Umbral siguiente | Margen |
|---|---|---|---|---|---|
| S0 | Core (N1) | Villa Alba, Ruta 1, Ruta 10 baja, Zaguán, P1, Ruta 2 hasta el puente del arroyo (cerrado hasta el P1, X35) | **12** (10 obligatorias antes del núcleo) | Correr: 10 + P1 | +2 |
| S1 | Correr (y P1) | Ruta 2 (tramo sur), Caudal, rampas, Ruta 3, Garganta, **P2** | **24** | Embestida: 18 | +6 |
| S2 | P2 restaurado; Embestida | Ruta 4 (vado), Brontia, Ruta 5, Meseta, Colector (N2), **P3** | **34** | Terreno: 25 + N2 (N2 solo pide Embestida) | +9 |
| S3 | P3 restaurado; Terreno | Ruta 6, Estrato, Mina, Dunas, **P4** | 34 + parte de D | — | — |
| S4 | P4 restaurado | Ruta 7, Lúmina, Reserva, Nexo, Ruta 15, Caleta Sonda, Marisma, Mnemos, **P5** | **46** (A–D) | Trepar: 35 + P5 | +11 |
| S5 | P5 restaurado; Trepar | Neblino, Ruta 10 alta, Cerro del Alba, Monte, **P6** (N3) | **56** (A–E) | Nadar: 50 + N3 (N3 solo pide Trepar) | +6 |
| S6 | 50%: Nadar (Detección a 60) | Mar del Sur, islas, Talasa (N4), regresos por agua | **76** (A–F) | Buceo: 70 + N4 (N4 en superficie) | +6 |
| S7 | Buceo | Fondos, Arrecife, **P7** | **88** (A–G) | — | — |
| S8 | P7 restaurado | Ruta 11, Paso del Norte, Senda del Lazo baja, Ruta 13, Villa Boreal (N5), Gruta, Mar Boreal, Lagos, **P8** | **100** (A–H) | Completa: 100 + N5 + P8 | 0 (todas alcanzables) |
| S9 | Completa: Vuelo y Reconstrucción | Mesa de los Vientos, Sima, **P9**, Calzada del Rey | 100 | — | — |
| S10 | P9 restaurado y 15 Tablillas | **P10**, Columna Lanza | — | Final | — |

**Puertas y procedencia de su condición.** Ninguna condición depende de algo que la propia puerta desbloquea.

| Puerta | Condición | Se obtiene en | Correcta |
|---|---|---|---|
| G0 puente de la Ruta 2 (X35) | P1 | Ruinas del Dintel (S0) | Sí |
| G1 cuestas de grava | Correr | P1 y células A (S0) | Sí |
| G2 vado de la Ruta 4 | P2 | Garganta (tras G1) | Sí |
| G3 troncos | Embestida (18) | A+B = 24 (tras G1) | Sí |
| G4 vendavales de la Ruta 6 | P3 | Meseta (tras G2 y G3) | Sí |
| G5 barro, arena, nieve | Terreno (25 + N2) | N2 tras G3; 34 células | Sí |
| G6 Paso del Derrumbe | P4 | Dunas (tras G4 y G5) | Sí |
| G7 niebla del Neblino | P5 | Mnemos (tras G5 y G6) | Sí |
| G8 paredes | Trepar (35 + P5) | 46 células (A–D) | Sí |
| G9 agua profunda | Nadar (50 + N3) | N3 tras G8 | Sí |
| G10 fondos | Buceo (70 + N4) | N4 tras G9; 76 células | Sí |
| G11 hielo-eco y Mar Boreal | P7 | Tras G10 | Sí |
| G12 Lagos del Alma | Nadar y G11 | — | Sí |
| G13 Forma Completa | 100 + N5 + P8 | N5 tras G11; ninguna célula en zonas de Completa | Sí |
| G14 Puente, Sima y Calzada | Reconstrucción | Tras G13 | Sí |
| G15 Mesa de los Vientos | Vuelo | Tras G13 | Sí |
| G16 Puerta de las Quince | 15 Tablillas y 9 Fragmentos | T01–T13 en etapas A–H; T14 tras G15; T15 tras G14 y P9; Fragmentos de P1–P9 | Sí |
| G17 Columna Lanza | P10 y Salto | — | Sí |

**Invariantes (se convierten en tests de datos con `node --test` sobre las tablas de contenido, injerto
«progresión»):**

1. Para cada umbral U con capacidad k, las células con requisito anterior a k son ≥ U (tabla superior).
2. Ningún núcleo exige la capacidad que desbloquea (N2 pide Embestida y da Terreno; N3 pide Trepar y da Nadar; N4 pide
   Nadar y da Buceo; N5 pide P7 y da Completa).
3. Requisitos de Pilar: P1 nada · P2 Correr · P3 Embestida + P2 · P4 Terreno + P3 · P5 Terreno + P4 · P6 Trepar ·
   P7 Buceo · P8 Nadar + P7 · P9 Reconstrucción + Cadena Roja · P10 Completa + 15 Tablillas + 9 Fragmentos. Cada uno se
   obtiene en un estado anterior. **Cadena de resonancia (injerto «progresión»):** el núcleo del Pilar N solo despierta
   si el jugador lleva el Fragmento N−1; la exploración puede adelantarse, la restauración no.
4. Los cambios de mapa son **solo aditivos**: restaurar abre caminos y nunca los cierra (el aljibe queda como «puerta
   anclada»; las caracolas de Antea siguen funcionando; Talasa, el Parque y la Mina siguen accesibles).
5. Ninguna Tablilla obligatoria exige una capacidad posterior a su disponibilidad; las de Vuelo/Reconstrucción son
   posteriores a P8 (biblia §7).
6. Solitario: ninguna pieza obligatoria depende de co-op, intercambio ni DLC; el Cordón Unión y los métodos de nivel
   de Añil resuelven las evoluciones por intercambio.
7. El cielo de crisis es una capa independiente del reloj (TEC-06): nunca altera tablas obligatorias ni accesos.

### 2.6 Nada se puede perder

- Los Pilares siguen abiertos tras restaurarse. Los recintos de Genesis (Parque, Talasa) siguen accesibles.
- Las células de guion (C009, C029–C032) se entregan siempre; si el jugador pierde contra Casia, vuelve a la puerta del
  Colector con el equipo curado.
- **Jefes y legendarios:** un Alfa o legendario debilitado reaparece al descansar (casa, Centro o campamento). Ninguna
  Tablilla depende de capturar nada.
- **Regalos de NPC** esperan hasta recogerse: Geodude del Umbral, inicial no elegido, huevo de Togepi, Porygon de Nilo,
  Eevee, Milcery, Rotom, fósiles, huevo del inicial de Gael.
- **Combates de Gael B2–B5** continúan la historia aunque el jugador pierda (cambia su frase; injerto «progresión»).
  B1 ya funciona así (B01). B6 hay que ganarlo; si se pierde, Gael espera y vuelve a curar.
- **Pistas descubiertas directamente:** si se llega al lugar de una Tablilla sin la pista, el arco empieza igual (§4.2
  de TABLILLAS.md).

### 2.7 Formas de campo

- **Core** (apertura–P1): sigue al jugador (D06), ilumina un radio de 2 casillas.
- **10%**: seguidor y montura. **50%**: forma serpentiforme; se monta para Nadar y crea la burbuja de Buceo.
- **Completa**: Vuelo y Reconstrucción, solo en **puntos señalizados** (piedras con hexágonos gastados), con colisión
  real y persistente (biblia §8).
- El Arca permite volver a 10% o 50% en cualquier momento. Zygarde **no ocupa plaza en el equipo** hasta el final;
  después sus funciones de campo siguen activas aunque esté en el PC.

### 2.8 Buceo: la burbuja de Zygarde (injerto «progresión»)

- Campo verde de 50% alrededor del jugador, con **medidor de resonancia de 8 segmentos** en el HUD: pierde uno cada
  5 s en zonas profundas (las someras no gastan). Se recarga en **respiraderos verdes** y bolsas de aire, colocados a
  menos de 40 s de recorrido entre sí.
- Si se agota: fundido y regreso al último respiradero, **sin daño ni pérdida**.
- Luz: radio 3 alrededor de Zygarde (5 si un Pokémon del equipo conoce Destello). Corrientes visibles como flechas de
  burbujas. Encuentros de la tabla «Buceo» (§7).

### 2.9 Objetos clave de la campaña

| Objeto | ID | Estado | Dónde |
|---|---|---|---|
| Pokédex | `POKEDEXAXIS` | ya en `items_axis.json` | B01 |
| Libreta de pistas | `CLUENOTEBOOK` | ya en `items_axis.json` | Casilda, P1 |
| Arca de Zygarde | `ZYGARDECUBE` | Añil | Núcleo del P1 |
| Fragmento Azur ×10 | `AZUREFRAGMENT` | ya en `items_axis.json` | P1–P10 |
| Flauta Azur | `AZUREFLUTE` | ya en `items_axis.json` | P10 |
| Mega Aro | `MEGARING` | Añil | T04 (B07) |
| Clave Glífica | `GLYPHKEY` | ID nuevo | P5 |
| Hebra del Saber / del Sentir / del Querer | `KNOWLEDGETHREAD` · `EMOTIONTHREAD` · `WILLTHREAD` | IDs nuevos | P8 |
| Cadena Roja | `REDCHAIN` | ID nuevo | P8 (se conserva «templada» tras P9) |
| Diamansfera / Lustresfera | `ADAMANTORB` / `LUSTROUSORB` | Añil | P9 (orbe del no elegido) |
| Llave del cuarto del fondo | `ALERCEKEY` | ID nuevo | Epílogo |
| Atrapasueños | `DREAMCATCHER` | ID nuevo | Postgame (Mamá, tras Darkrai) |
| Piedra Magma | `MAGMASTONE` | ID nuevo (no está en Añil) | Postgame (Forja de Tizón) |
| Piedra Crisol | `CRUCIBLESTONE` | ID nuevo | DLC 2 |
| Engranaje antiguo ×5 | `ANCIENTGEAR` | ID nuevo | DLC 2 (Magearna) |

---

## 3. Capítulos: guion de implementación por bloques

### 3.0 El hilo de la profecía (D02, D02b; X10)

La profecía está grabada en escritura Unown en los núcleos. Su origen se explica en la Crónica XIV (TABLILLAS.md §4.3):
los Custodios escribieron lo que Arceus les mostró antes de dormirse. La Pokédex traduce los versos a medias hasta el
P5; desde el P5 la **Clave Glífica** (`GLYPHKEY`) permite leer Unown directamente. Todos quedan en la pestaña
«Profecía» de la Libreta.

| Verso | Pilar | Texto | Quién lo lee | Efecto |
|---|---|---|---|---|
| I | Umbral | «Cuando el que guarda el orden caiga en cien y cinco pedazos,» | El Core, a medias | «Cien. Y cinco. …Soy yo.» Casilda: «Serán números.» |
| II | Corriente | «el agua olvidará su cauce,» | Core y Leandro | Describe lo que ya pasa en Caudal |
| III | Impulso | «el viento, su camino,» | Core y Abril | — |
| IV | Masa | «y la tierra, su peso.» | Core y Fermín | Los personajes notan que el texto va por delante de ellos |
| V | Memoria | «Entonces uno caminará entre el tiempo y el espacio llevando consigo al guardián roto.» | Olvido completa I–V | «Eres tú.» Gael lo leyó antes. Clave Glífica |
| VI | Invertido | «Bajará donde el mundo se da la vuelta, y volverá.» | Jugador | — |
| VII | Ecos | «Oirá lo que fue sin quedarse en ello.» | Jugador | — |
| VIII | Alma | «Sabrá, sentirá y querrá, y el guardián volverá a ser entero.» | Lo recita el trío | Anticipa la Forma Completa |
| IX | Convergencia | «Donde el tiempo y el espacio se cruzan, atará a uno y dejará marchar al otro.» | Jugador | Anticipa la elección |
| X | Origen | «Dos partirán del mismo alba: uno responderá a la llamada; el otro querrá ser quien llama. Y el que duerme despertará para medirlos.» | Jugador y Gael | «Alba» es amanecer y es el pueblo |
| — | Columna Lanza | Arceus: «Respondiste a la llamada. Eres aquel del que hablaban las piedras.» | — | **Confirmación final** |

La insinuación inicial ya está en B01 §4.6 («Las piedras de este lugar recuerdan una promesa. Alguien que caminaría
entre el tiempo y el espacio.»).

### 3.1 La crisis global (D19)

**Causa (hecho interno).** La brecha que abrió Giratina en el aljibe y la dispersión de Zygarde dejaron la red de los
diez Pilares sin su agente de respuesta. La red se sostenía con la reserva del sueño de Arceus. Cada Pilar restaurado
repara su anclaje y su función local (efecto real, biblia §3), pero la **sincronía** de la red solo vuelve cuando
despierta el Creador; por eso el desgaste global avanza con la trama aunque se arreglen los síntomas locales. Las
extracciones de Genesis lo aceleran. Genesis no causó el prólogo (biblia §4).

| Fase | Tramo | Señales globales (capa de cielo) | Síntomas locales (cada Pilar arregla el suyo) |
|---|---|---|---|
| 0 | Apertura–P2 | Temblores nocturnos, destello verde, Pokémon inquietos | Puertas de Zaguán que se abren solas (P1); el Albo se desborda de día y se seca de noche (P2) |
| 1 | P3–P5 | Tormentas secas, flores fuera de temporada, Absol en las rutas | Vendavales sin rumbo y apagones (P3); Estrato se hunde y las piedras flotan un palmo de noche (P4); niebla del olvido (P5) |
| 2 | P6–P7 | Atardeceres de dos horas, estrellas que tiemblan | Sombras que se filtran al Neblino (P6); mareas del eco en el sur y glaciación-eco en el norte (P7) |
| 3 | P8–P10 | **Eclipse de Convergencia** (nombre de trabajo): luna agrandada con anillo violeta, auroras en todo Axis, grietas luminosas, estrellas que se desplazan | Desvinculación de los Pokémon del norte (P8); relojes desfasados y una Sima que se ensancha (P9) |
| 4 | Tras P10 | **Falsa calma**: las grietas se cierran, la luna sigue grande y el cielo zumba | — |
| — | Tras Arceus | Cielo restablecido | — |

**Descanso (X25).** «Descansar» (cama, Centro, posada, campamento) cambia la franja horaria y nunca activa sueños.
«Dormir profundamente» (solo en la cama de casa, opción explícita) puede activar sueños en el postgame (Darkrai).
«Descansar hasta tormenta» existe en la posada de Brontia, la de Villa Boreal y el Hotel Mirador de Lúmina
(fenómenos meteorológicos: Goomy con lluvia, Ferropúas y otros encuentros del postgame). El cielo de crisis
es una capa independiente del reloj (TEC-06).

### 3.2 Formato de los bloques

Cada bloque lista: **mapas** · **entrada** · **problema** · **secuencia** (escenas con líneas clave; el resto del
diálogo se escribe al implementar, respetando las voces fijadas) · **mazmorra** · **combates** (equipos y niveles) ·
**cambio en el mundo** · **recompensas** · **salida** (flags) · **reintento**. Voces: Zygarde sobrio y telepático
(`telepathy: true`); Gael competente, orgulloso y serio; Alerce sobrio y cauto, sin revelar su pasado; Genesis
cortés, preciso, nunca bufonesco.

### B01 — Prólogo y apertura (existente) · ajustes DECIDIDO-DEV

B01 se mantiene íntegro. Ajustes compatibles, sin reescribir escenas:

- **Nombres (X07):** el policía es el **Agente Olmedo**; los dueños del Laberinto, la **familia Arenzana**; la ayudante
  del laboratorio, **Lía**.
- **Prólogo P-04:** las cinco estelas grandes salen en cinco direcciones (§2.4).
- **Habitación:** desde la ventana se ve el Monte del Portal con su cascada (fondo del mapa).
- **Células (D10):** C001 en el parterre con escena forzada al salir del laboratorio («Aquí. Una parte de mí.»);
  C002–C005 en pasos obligados de la Ruta 1; C006 en el claro del este.
- **Ruta 1:** dos **topógrafos del Consorcio Meridiano** miden temblores con un trípode (primera presencia de Genesis,
  sin nombre: «Lecturas de campo. Siga, por favor.»). El cruce oeste lleva a la Ruta 10 baja (C007).
- **Escena oculta (se muestra en P8, Ala del Sentir):** mientras el jugador se cuela en el Laberinto, Gael vuelve
  corriendo al laboratorio: «Profesor, el sonido viene del Laberinto. Llame a los Arenzana, pida permiso…». Alerce:
  «No. Esperaremos a la policía.» Gael espera. Por eso está en el laboratorio cuando vuelven (encaja con B01 §4.7).
- **Salida:** Pokédex, 5 Poké Balls, 3 Pociones, 5 células, rumbo al Umbral. Estado `b01_left_town`.

### B02 — Pilar del Umbral (P1)

- **Mapas:** `villa_zaguan` (1), `zaguan_centro` (4), `casa_dintel` (4), `explanada_umbral` (7, 30×30),
  `ruinas_dintel` (2 + kit de Pilar tinte ocre, 44×40, 5 salas en un solo nivel).
- **Entrada:** `b01_left_town`; Core; 5 células; nivel ~7.
- **Problema humano:** en Zaguán las puertas no cierran por la noche, la gente duerme mal y teme que se derrumben las
  ruinas. **Casilda Roquer** (64) lleva cuarenta años limpiando unas piedras que para ella «son piedras, muy viejas,
  nada más».
- **Secuencia:**
  1. Zaguán: primer **Centro Pokémon** (tutorial de curación y PC). C008 en la calle principal. Vecinos: «Anoche se me
     abrió la puerta tres veces. Sin viento.»
  2. Explanada: Gael espera fuera. «Llegué antes. No me ha dejado pasar.» No combate.
  3. Casilda bloquea el paso: «Aquí no entra nadie a hacer turismo.» El Core se acerca al dintel y la ranura brilla un
     instante; Casilda lo ve y calla. «…Voy contigo. Para que no te abras la cabeza.» Entrega **C009** («Esto brillaba en
     el patio. Lo guardé en un tarro, no sé por qué»).
  4. Mazmorra (abajo). Casilda comenta cada sala con escepticismo decreciente.
  5. Núcleo: el jugador acerca el Core a una columna hueca. Sale el **Fragmento Azur 1** (`AZUREFRAGMENT`) y se abre el
     **Arca** (`ZYGARDECUBE`), una caja hexagonal que Casilda «siempre vio cerrada». Se enciende el verso I. Core:
     «Cien. Y cinco. …Soy yo.» Casilda: «Serán números.»
  6. Salida al atardecer: con ≥10 células el Core se rodea de células y forma el **10%**. Gael lo ve desde la explanada
     y se va sin hablar. Llega un «equipo de medición» del Consorcio; una científica sin nombre (Casia) le dice a
     Casilda: «Qué interesante: responde a un niño y no a cuarenta años de cuidados.» Casilda los echa: «Aquí se mide
     con los ojos. Fuera.»
  7. Casilda entrega la **Libreta de pistas** (`CLUENOTEBOOK`): «Mi madre apuntaba aquí lo que decían las piedras.
     Yo nunca le hice caso.» Dentro hay un calco con la primera pista (T01).
- **Mazmorra: Ruinas del Dintel** (luz limitada que ilumina el Core; entrenadores Excursionista Remo, Arqueóloga Inés,
  Montañero Paco, nv 5–8, X35):
  1. *Antesala* (C010). Inscripción: «El primero mira al alba. El segundo, al agua que no se va. El tercero, a quien
     entra.»
  2. *Galería de los Dinteles* (C011). Tres piedras giratorias en tres alcobas (D08). La primera se orienta al este
     (hay un tragaluz); la segunda al **estanque quieto** (el arroyo que sale de la sala es el señuelo); la tercera
     hacia la puerta por la que entró el jugador. Cada acierto hace brillar la ranura en verde si el Core está a 3
     casillas o menos. Equivocarse no penaliza: la piedra vuelve a girar.
  3. *Cámara de Geodude* (C012). Con las tres piedras se desliza un muro: un **Geodude** encajado en una grieta desde
     los temblores. El jugador lo saca (interacción A mantenido); agradecido, **rompe la roca** que corta el paso (D08).
     Después ofrece acompañar al jugador (regalo opcional, nv 7; si se rechaza, espera en la cámara).
  4. *Cámara de la Guardiana*: combate.
  5. *Núcleo*.
- **Combate: Casilda** — Bonsly 9, Nacli 9, Hippopotas 10 (X35; antes 11/11/12) (Chorro Arena/tormenta de arena). Motivo: «Si esto va a
  despertar por alguien, que sea por alguien capaz de defenderlo.» Si el jugador pierde: reaparece en la antesala, se
  habla con Casilda y cura («Otra vez. Con cabeza.»).
- **Cambio en el mundo:** las puertas de Zaguán vuelven a cerrar; cesan los temblores alrededor de Villa Alba (los
  Starly vuelven a los tejados).
- **Recompensas:** Fragmento 1, Arca, **Correr** (10%), Libreta, pista T01, 3 Pociones y 2 Cuerdas Huida (Casilda).
- **Salida:** `p1_restored`, `zyg_10`, `b02_libreta`. Nivel ~10 (X35). El P1 abre el puente del arroyo de la Ruta 2
  (los temblores cesan; hasta entonces un operario de Zaguán no deja pasar: X35).

### B03 — Interludio 1: Zaguán, Ruta 2 y llegada a Caudal

- **Mapas:** `ruta_2`, `ciudad_caudal` y sus interiores (Centro, tienda, Casa de las Esclusas, molinos).
- **Entrada:** 10% y T01 activa.
- **Problema:** el Árbol del Fundador de la Arboleda se muere (T01). En Caudal, inundaciones de día y canales secos de
  noche.
- **Secuencia:**
  1. **T01** «La Arboleda de los Nombres» (TABLILLAS.md).
  2. Lía, en el Centro de Zaguán, entrega el **Repartir Exp** (`EXPSHARE`) de parte de Alerce (desactivable).
  3. Ruta 2 (rampa de grava si ya tiene Correr, C015) y llegada a Caudal.
  4. **Gael, combate B2**, en el puente de entrada: «Encontré una célula. Se me escapó de las manos… hacia ti.»
     Equipo: Starly 8, Riolu 9, inicial 10 (X35; antes 12/12/14).
  5. Alerce llama por la Pokédex: «¿Balizas de tres patas en la Garganta? …Da igual. Id con cuidado.» (subtexto:
     reconoce el instrumental).
  6. El molinero **Anselmo** abre la pista T02 («La muela del Diezmo pesa como un río»). El pescador da la **Caña
     Vieja** (`OLDROD`).
- **Salida:** hacia la Ruta 3 (Correr). `b03_gael_b2`.

### B04 — Pilar de la Corriente (P2) (D09: acceso por Correr, sin Nadar)

- **Mapas:** `ruta_3`, `garganta_albo`, `pilar_corriente` (15 + kit tinte azul, 40×40, un solo mapa de estanques).
- **Entrada:** Correr; nivel ~12 (X35).
- **Problema humano:** el Albo se ha vuelto errático y el barrio bajo de Caudal se inunda. **Leandro Alcántara** (38,
  **orgullo**), Maestre de Esclusas, se niega a recibir ayuda: su casa lleva trescientos años «llevando el río a mano»
  y ha empeorado las cosas manipulando las esclusas. Genesis ha plantado **balizas de resonancia** en la Garganta que
  agravan las crecidas.
- **Secuencia:**
  1. Ruta 3 por las **cuestas de grava**, solo transitables montado (C016–C018).
  2. Retirar tres balizas: tres combates contra técnicos (nv 14–16, X35; Magnemite, Bronzor, Solosis). Las balizas se
     recogen (objeto de historia, no se venden).
  3. Mientras, **Gael evacúa el barrio bajo** con sus Pokémon; Leandro y Gael chocan («Nadie te ha pedido nada,
     chaval.» / «Por eso lo hago yo.»).
  4. Leandro reta al jugador dentro del Pilar para «ver si sabe dónde pisa».
  5. Escalera de Estanques y núcleo.
- **Mazmorra: Escalera de Estanques** (seis estanques escalonados E1–E6 alrededor del núcleo; 4 entrenadores
  Pescador/Buceadora, nv 14–17, X35):
  - **Reglas.** Un estanque **lleno** levanta losas flotantes (puentes). Uno **vacío** deja caminar por su fondo
    (palancas, objetos y las células C021–C023). Cuatro compuertas C1–C4 dejan pasar el agua cuesta abajo, de E1 a E6.
    La **noria** sube el agua de E6 a E1, solo con su engranaje enganchado; la palanca del engranaje está en el fondo
    de E4.
  - **Objetivo:** cerrar el ciclo E1→E6→noria→E1 con todas las compuertas abiertas: así fluye la corriente del núcleo.
  - **Solución de referencia (4 fases):** (1) abrir C1 y C2, cerrar C3: E1 se vacía y se cruza su fondo hasta el mando
    de C3; (2) cerrar C2 y abrir C3: E4 se vacía y se engancha la noria; (3) abrir C4: E6 se llena, la noria gira y
    suben las losas de E2; (4) por esas losas se llega al mando de C2 y se abre. Ciclo completo.
  - Sin temporizador; una palanca en la entrada devuelve todo al estado inicial.
- **Combate: Leandro** — Barboach 17, Buizel 17, Marill 18, Quagsire 19 (X35; antes 19/19/20/21). Reintento: se le vuelve a hablar.
- **Respuesta:** Leandro: «Trescientos años girando llaves… y el río solo necesitaba que alguien lo escuchara.» Al día
  siguiente da las gracias al jugador en la plaza, a lo grande.
- **Cambio en el mundo:** el Albo recupera su cauce; los molinos vuelven a girar (salvo el del Diezmo, T02); se abre el
  **vado de la Ruta 4**; vuelve la pesca.
- **Recompensas:** Fragmento 2, verso II. Alerce viaja a Caudal para ver el río y entrega **el inicial que nadie
  eligió** (X13): «Lleva días mirando la puerta.» Pista T03.
- **Salida:** `p2_restored`. Nivel ~19 (X35).

### B05 — Interludio 2: el Molino del Diezmo, Ruta 4 y Villa Brontia

- **Mapas:** `ruta_4`, `villa_brontia` e interiores (subestación, campanario, posada), `molino_diezmo` (4).
- **Entrada:** Ruta 4 abierta.
- **Problema:** el Molino del Diezmo gira al revés (T02). Brontia está a oscuras.
- **Secuencia:** **T02**; **Embestida** al llegar a 18 células (roca de tutorial en la Ruta 4); llegada a Brontia;
  **T03** (antes o después de P3). Genesis: el Consorcio tiene firmado con el ayuntamiento el «mantenimiento» del
  Parque Eólico, que desde entonces no produce.
- **Salida:** Embestida y Ruta 5. `b05_brontia`.

### B06 — Pilar del Impulso (P3)

- **Mapas:** `ruta_5`, `meseta_impulso` (1), `parque_eolico` (4, ocupado), `anillo_vientos` (1) y `galerias_soplo`
  (2 + kit tinte blanco).
- **Entrada:** Embestida; nivel ~23.
- **Problema humano:** apagones en Brontia y vientos que dispersan los rebaños de Wooloo. **Abril Céspedes** (19,
  **tedio**) se aburre: «Cinco años vigilando una piedra que no hace nada.» Genesis ha convertido el Parque Eólico en un
  **Colector de células**.
- **Secuencia:**
  1. **Combate doble con Gael de aliado** en la puerta del Parque: Gael (Staravia 24, inicial evolucionado 25) y el
     jugador contra dos técnicos (Magnemite 22, Solosis 22).
  2. Infiltración breve en el Parque (dos técnicos) y **Casia**: «Doctora **Casia Varela**. No somos un consorcio.
     Somos **Genesis**.» Doctrina: «¿Quién votó a Dialga? ¿Quién eligió que el tiempo tuviera dueño?» Combate: Solosis 23,
     Magnemite 24, Elgyem 25.
  3. Se rompe el Colector: **4 células** (C029–C032) y **N2**; fusión con el Core (§2.4) → **Terreno complicado**.
     Gael se queda mirando las pantallas de Genesis (curiosidad) antes de irse.
  4. Abril reta al jugador antes de las galerías: «Termina rápido, que se me enfría la comida.»
  5. Galerías del Soplo y núcleo.
- **Mazmorra: Anillo de los Vientos y Galerías del Soplo** (3 secciones):
  - **Reglas.** Las casillas de ráfaga empujan una casilla por paso. Las de fuerza 1 solo se remontan **montado**; las
    de fuerza 2, nunca. Cada **veleta** cambia la dirección de las ráfagas de su sector en ciclo N→E→S→O.
  - (a) *Galería de las Flechas* (C033): encadenar ráfagas hasta la salida.
  - (b) *Galería del Remolino*: un bucle de viento que se abre en línea girando dos veletas.
  - (c) *Sala de las Campanas* (C034): tres monolitos del anillo exterior llevan grabado el ritmo largo–corto–corto y
    cada uno mira hacia una campana. Se golpea la Norte (larga: mantener A), la Este (corta) y la Oeste (corta). No hay
    tiempo límite: se trata de llegar a cada campana en ese orden entre ráfagas.
- **Combate: Abril** — Emolga 26, Drifloon 26, Staravia 27, Cyclizar 28.
- **Respuesta:** Abril, tras el núcleo: «Vale. Esto no es aburrido.» Decide quedarse en Brontia «porque por fin pasa
  algo».
- **Cambio en el mundo:** el viento recupera su rumbo; el Parque da luz a Brontia; **cesan los vendavales de la Ruta
  6**; los Drifloon vuelven al molino.
- **Recompensas:** Fragmento 3, N2, Terreno complicado, verso III, pista T04.
- **Salida:** `p3_restored`, `zyg_core_2`. Nivel ~28.

### B07 — Interludio 3: Ruta 6 y la Cantería Solano

- **Mapas:** `ruta_6` (5 + 6), `canteria_solano` (5 + 2, galerías estratificadas).
- **Entrada:** Ruta 6 abierta.
- **Problema:** un derrumbe provocado por **voladuras del Consorcio** atrapa al cantero **Quino Solano** y a su
  cuadrilla de Timburr y corta la Ruta 6 (T04).
- **Secuencia:** **T04** (rescate estratigráfico). Como es una emergencia geológica, **Alerce viene en persona** y
  enseña la regla de los estratos. Primera aparición de **Ulises Garrido**, director de Operaciones de Genesis: no
  combate; se retira cuando los canteros lo señalan en público.
- **Mega Aro (X14):** en el último estrato, junto a la Tablilla, aparece una veta de **piedra activadora**. **Bea
  Solano**: «En Solano, al que saca a alguien de la roca le damos un anillo de la roca.» Lo monta la herrería de la
  cantería. Alerce lo examina: «Es una Piedra Activadora. Responde a los lazos… Te va a hacer falta.» → **Mega Aro**
  (`MEGARING`), nivel del jugador ~28.
- **Salida:** hacia Estrato. `b07_megaring`.

### B08 — Pilar de la Masa (P4)

- **Mapas:** `ciudad_estrato`, `mina_galena` (2), `dunas_ceniza` (6), `cerro_plomo` y `camara_contrapesos` (2 + kit
  tinte plomo, 40×35).
- **Entrada:** Terreno complicado; nivel ~31.
- **Problema humano:** Estrato se hunde (casas agrietadas) y la mina se muere. El Consorcio ofrece comprar la **Mina
  Galena** y los terrenos del Cerro Plomo. **Fermín Galena** (51, **carga familiar**) prometió a su padre no venderla
  nunca; su hija **Sol** quiere vender para salvar los empleos.
- **Secuencia:**
  1. Bajar a la mina: Garrido ha excavado un pozo lateral hacia el Pilar. Espera a que el protagonista abra el Pilar
     para **grabar su firma de resonancia**. Combate: Gurdurr 31, Rhyhorn 31, Houndoom 32. El pozo no llega a nada: la
     cámara «rechaza» las perforadoras porque el peso crece.
  2. Cruzar las Dunas (arena profunda, Terreno) hasta el Cerro Plomo.
  3. Cámara de los Contrapesos; combate con Fermín; núcleo.
- **Mazmorra: Cámara de los Contrapesos:**
  - **Reglas de peso:** a pie el jugador pesa 1; montado en el 10%, 3; un bloque de basalto, 2; una piedra suelta, 1.
    Las **placas** bajan con 3 o más y suben plataformas vinculadas. El **suelo quebradizo** se rompe con 3 o más
    (montado): el jugador cae a la galería inferior sin daño (C039) y tiene rampa de vuelta. La **arena profunda** solo
    se cruza montado. La tensión del puzzle está en cuándo montar y cuándo bajarse.
  - **La Gran Balanza:** tres platillos que deben pesar lo mismo, con el jugador sobre el C (donde está la palanca).
    Hay 3 bloques y 3 piedras. **Solución:** A = bloque + bloque (4); B = bloque + piedra + piedra (4); C = piedra +
    **jugador montado** (1 + 3 = 4). La montura resulta imprescindible (C040 junto a la Balanza).
  - Palanca de retorno en la entrada: devuelve bloques y piedras.
- **Combate: Fermín** — Graveler 32, Naclstack 32, Mudsdale 33, Onix 33, Rhydon 34.
- **Respuesta:** Fermín y Sol eligen una **cooperativa minera**. La opción de compra de Genesis caduca porque exigía
  «estabilidad del suelo» y el suelo ya es estable por el Pilar, no por ellos.
- **Cambio en el mundo:** se detiene el hundimiento; las piedras ya no flotan; los mineros **despejan el Paso del
  Derrumbe (Ruta 7)**; vuelve el **tren**; aparecen fósiles en la galería honda; abre el mercado de minerales.
- **Recompensas:** Fragmento 4, **Fósil Cráneo y Fósil Coraza** (`SKULLFOSSIL`, `ARMORFOSSIL`, regalo de Fermín),
  verso IV, pista T05.
- **Salida:** `p4_restored`. Nivel ~34.

### B09 — Interludio 4: Lúmina, el museo, la Reserva, la Marisma, Nexo y Caleta Sonda

- **Mapas:** `ruta_7`, `ciudad_lumina` e interiores (Museo de las Eras, Hotel Mirador, Grandes Almacenes, guardería,
  tienda de trastos, pastelería), `ruta_14_reserva`, `ruta_8_marisma` (con Palafitos), `ciudad_nexo`, `ruta_15`,
  `caleta_sonda`.
- **Entrada:** Ruta 7 y tren.
- **Problema:** Axis se abre al sur y aparecen varias crisis a la vez (tramo de mayor libertad: hasta 3 pistas activas).
- **Secuencia:**
  1. **Gala del Museo de las Eras** en el Hotel Mirador, automática al llegar a Lúmina. El mecenas es el **Dr. Aurelio
     Vértice** (Fundación Meridiano). Al jugador: «Así que tú eres quien lleva a ese… acompañante. Lúmina le debe mucho a
     la gente que escucha a las piedras.» Elogia en público un informe de Gael sobre migraciones de Staravia
     (seducción). **Gael, combate B3**, en la escalinata del museo: Staravia 32, Lucario 32, Gabite 31, Absol 32,
     inicial evolucionado 34. **Rosalía Quintana** pide al jugador que vuelva de noche: pista T06.
  2. **T06** (museo), **T05** (Estrato, el Pulso), **T07** (Reserva), **T08** (Marisma). Orden libre.
  3. En el archivo del museo, tras T06, una ficha de catálogo: «Expedición a la Laguna Clara (hace 16 años). Fondos:
     Fundación Meridiano. Resultados: no publicados.» Rosalía: «Nunca publicaron nada.» Sin nombres ni fotos.
  4. Nexo: el pescador da la **Caña Buena** (`GOODROD`); los ferris están parados por el «mar revuelto»; mar adentro se
     ve una plataforma del Consorcio (Talasa). En el mercado, los herreros de Tizón «ya no mandan picos» (pista T12, en
     cola hasta tener Nadar).
  5. Ruta 15 hasta Caleta Sonda: los pescadores hablan de mareas que traen barcos antiguos; el farero **Ramón** abre la
     pista T11 (en cola hasta tener Nadar). Tienda de pesca: **Supercaña** (`SUPERROD`).
  6. Palafitos y llegada a Mnemos.
- **Alerce en T08:** insiste en analizar él mismo el agua. La curandera **Remedios**: «Hace dieciséis años vinieron
  unos señores a medir la laguna, con aparatos como ese.» Alerce: «Son aparatos corrientes.» (subtexto rebajado).
- **Regalos:** Eevee (tras T06), Audinita (guardería, tras T06), Milcery (pastelería), Rotom (tienda de trastos, de
  noche), revivir fósiles en el museo.
- **Salida:** Aldea Mnemos. `b09_gala`, `b09_gael_b3`.

### B10 — Pilar de la Memoria (P5) (D09: acceso por la Marisma con Terreno)

- **Mapas:** `aldea_mnemos` e interiores, `archivo_hondo` (11 + 9 + kit tinte sepia, espiral de 6 estancias).
- **Entrada:** Terreno complicado; nivel ~37.
- **Problema humano:** la **niebla del olvido** baja del Bosque Neblino. Los vecinos olvidan nombres y días recientes;
  la tinta del Archivo se borra. **Olvido Arrieta** (78, **fascinación**), que lo apunta todo, es la única que no
  pierde la memoria. Genesis está **copiando el Archivo** antes de que desaparezca. Casia, cameo sin combate: «Nosotros
  también salvamos lo que se pierde.»
- **Secuencia:**
  1. Repartir las «notas de nombres» de Olvido entre cinco vecinos (misión breve dentro del capítulo).
  2. Bajar por la espiral del Archivo; ordenar el Mural; combatir con Olvido; restaurar.
- **Mazmorra: Archivo Hondo** (una espiral descendente, **sin plantas**):
  - **Losas de recuerdo:** al pisarlas se reproduce un **eco-recuerdo**, un custodio translúcido que hace una acción.
    Se pueden repetir sin límite.
    1. *Estancia del Suelo Olvidado:* el custodio cruza un suelo invisible; su recorrido es el único seguro. Pisar fuera
       devuelve a la entrada de la estancia.
    2. *Estancia de las Dos Manos:* dos custodios mueven dos palancas en posiciones concretas; el jugador las reproduce
       una tras otra (las palancas se quedan donde se ponen).
    3. *Estancia de la Lectura:* un custodio lee un relato de glifos que el jugador compone en una puerta glífica. El
       texto queda en la Libreta.
    4. *Estancia de los Rollos* (C046): reproducir el orden en que un custodio coloca rollos en una estantería.
  - **Sala del Mural:** seis paneles que ordenar según la historia: (1) los Pilares ya existían; (2) la Tañedora y el
    mar; (3) los pueblos aprenden a escuchar; (4) el rey y la corona; (5) la tierra se abre; (6) la flauta rota. Basta
    con las inscripciones de P1–P4 y el texto de la Estancia 3: **no hace falta ninguna Tablilla** (cada Tablilla que
    se tenga añade una pista opcional). Los errores no penalizan.
- **Combate: Olvido** — «¡Existes! Eres una nota a pie de página que camina.» Chimecho 38, Beheeyem 38, Bronzong 39,
  Spiritomb 40.
- **Revelaciones:** el verso V completo; Olvido: «Eres tú.» Gael estuvo aquí antes y leyó el verso. En el Archivo, el
  **Informe del incidente de la Laguna Clara (hace 16 años)**, con el nombre del responsable de calibración tachado.
  Olvido: «Alguien no quería que se supiera quién calibró. Los tachones también son memoria.» Nadie dice un nombre.
  Alerce, por la Pokédex, calla un momento largo al oír el verso V.
- **Cambio en el mundo:** la niebla se levanta y **se abre la Ruta 9 hacia el norte**; vuelven los recuerdos y la tinta.
- **Recompensas:** Fragmento 5, **Trepar** (35 + P5), **Clave Glífica**, pista T09, Gardevoirita (Santuario de los
  Glifos).
- **Salida:** `p5_restored`. Nivel ~40.

### B11 — Interludio 5: Bosque Neblino, el Monte y la casa

- **Mapas:** `ruta_9_neblino`, `ruta_10` (alta), `campamento_monte` (1), `villa_alba`, `laboratorio_alerce`.
- **Entrada:** Trepar y Ruta 9.
- **Problema:** un desertor de Genesis se esconde en el bosque (T10). Genesis tiene un **campamento al pie del Monte del
  Portal**: miden el aljibe y **perforan la explanada del prólogo**; cajas etiquetadas «EXP-03» (el germen de la
  Zygardita, D26).
- **Secuencia:**
  1. **T09** (Íker, Mnemos) y **T10** (la cuadrilla perdida) en cualquier orden.
  2. Regreso a **Villa Alba** por la Ruta 10 y la Ruta 1 (primer regreso a casa).
  3. Mamá entrega el **huevo de Togepi**: «Una Togepi puso un huevo en el jardín y no ha vuelto. Creo que es para ti.»
  4. En el laboratorio, **Gael se enfrenta a Alerce**: «Usted sabía quiénes eran desde el principio.» Alerce: «Sabía de
     qué eran capaces.» Gael se va.
  5. **Gael, combate B4**, al pie del Monte: intentó escalar y el aljibe no le respondió. «Cuando vuelvas, cuéntame qué
     hay. …No. Da igual.» Equipo: Staraptor 41, Lucario 41, Gabite 41, Absol 42, inicial final 43.
- **Salida:** el ascenso. `b11_gael_b4`.

### B12 — Pilar Invertido (P6)

- **Mapas:** `montana_portal` (el mapa del prólogo, de día, con marcas de perforación), `pilar_invertido_*` (14 + fondo
  MundoDistorsion + fog `portal` + kit tinte violeta): 3 salas de La Cara Vuelta (cada una con su mapa gemelo girado),
  La Mirada, El Sumidero, núcleo.
- **Entrada:** Trepar; nivel ~43.
- **Problema:** no hay problema humano ni Guardián. Lo que está en juego es personal para Zygarde: siente a N3 al otro
  lado. El aljibe filtra sombras hacia el Neblino y vuelven los temblores nocturnos a Villa Alba.
- **Secuencia:**
  1. Subir el Monte por paredes y raíces (C050). La explanada del prólogo, reconocible: piedras quemadas, la cascada,
     las huellas del combate y los agujeros de la perforación de Genesis (campamento ya abandonado).
  2. Subir la **escalinata ascendente** (C051) hasta el aljibe, que responde a Zygarde: el portal se abre «solo por un
     tiempo».
  3. Atravesar el Mundo Distorsión.
- **Espacio imposible 2D (reglas):**
  - **Anclas:** postes de piedra que funcionan como puntos seguros al tocarlos. Caer al vacío (sin suelo en la
    orientación actual) funde a negro y devuelve a la última Ancla, **sin daño ni contador**.
  - **(a) La Cara Vuelta** (C052). Tres salas; cada una existe en **dos orientaciones precalculadas como mapas gemelos**
    (injerto «producción»). Las vetas violetas marcan **aristas**: al cruzar una, la pantalla gira 90° y se carga el
    gemelo; la pared pasa a ser suelo. Los controles siguen referidos a la pantalla. Objetivo: llegar a la salida de
    cada sala usando qué gemelo conviene en cada tramo.
  - **(b) La Mirada.** Los puentes solo existen mientras el jugador **los mira** (a 4 casillas o menos en la dirección
    de avance). Si gira encima de uno, cae y vuelve al Ancla. Hay que planificar la ruta girando solo sobre islotes.
  - **(c) El Sumidero** (C053). **Cascadas invertidas**: ascensores de un solo sentido que se activan abriendo su boca
    con un pulsador. En el vacío más grande **cruza una vez la sombra de Giratina** al fondo, en parallax, durante unos
    4 s: el sonido ambiente cae y el 10% se queda inmóvil. Core: «No mires. No nos busca. Aún.» Sin combate ni cartel.
  - **Núcleo.** N3 está fundido con el sello de la brecha. El jugador toca tres Anclas en orden mientras el sello se
    vuelve a formar sin N3.
- **Respuesta:** Zygarde, en la explanada interior: «Aquí lo empujé. Tres noches.» Primera vez que muestra dolor y
  gratitud.
- **Cambio en el mundo:** el aljibe queda como **puerta anclada** estable (se puede volver a entrar; X16); las sombras
  dejan de filtrarse; cesan los temblores; la fauna del Monte se calma. La crisis entra en fase 2 (gradual; no la causa
  el Fragmento).
- **Recompensas:** Fragmento 6, N3, **50% con Nadar**, verso VI, Gengarita (`GENGARITEX`, rincón del Sumidero). Al
  volver a Zaguán, Casilda entrega la **Lucarita** (`LUCARIONITE`): «Mi marido la encontró hace años. Ahora sé para quién
  era.»
- **Salida:** `p6_restored`, `zyg_50`. Nivel ~46.

### B13 — Interludio 6: Estación Talasa, Islote Lumbre y Volcán Tizón

- **Mapas:** `mar_del_sur` (superficie, 3 sectores), `estacion_talasa` (5 + 4, 3 interiores), `islote_lumbre`,
  `volcan_tizon` (3 mapas; caserío en la ladera), `caleta_sonda` (muelle de buzos).
- **Entrada:** Nadar.
- **Problema:** Genesis tiene N4 en la **Estación Talasa**. Nilo (T10) dio los planos.
- **Asalto a Talasa:**
  1. Alerce llega en barca: «Esta vez voy yo.»
  2. Técnicos de nivel 45–48 y un invernadero de Solosis cultivados.
  3. En el despacho de dirección, una **foto enmarcada**: «Proyecto Laguna — equipo de campo». Un rostro está rascado;
     las manos de esa figura sostienen un cuaderno de tapas verdes idéntico al que lleva Alerce. Si el jugador la mira,
     Alerce no se gira. Nadie comenta nada.
  4. **Combate doble aliado:** jugador y Alerce contra **Casia y Garrido**. Casia: Reuniclus 50, Magneton 49,
     Beheeyem 49. Garrido: Conkeldurr 50, Houndoom 50, Rhydon 51. **Alerce: Probopass 50, Bronzong 50, Gastrodon 51,
     Porygon2 52.** Si se pierde, se reintenta desde la puerta del laboratorio con el equipo curado.
  5. **Escena clave**, a mitad del combate: Casia: «Profesor. ¿Sigue calibrando a mano? Vértice siempre decía que usted
     era el único que sabía escuchar a los Pilares.» Alerce: «Ya no.» Después, Alerce abre el tanque de presión
     manejando los controles sin mirar.
  6. **Vértice aparece en una pantalla** como Líder Supremo de Genesis: «Déjales el núcleo. Ya hemos aprendido lo que
     necesitábamos.»
  7. **N4** se une al Core. Nilo regala un **Porygon**: «Era del laboratorio. No puedo quedármelo.»
- **Otras acciones:** **T11** (Islote Lumbre) y **T12** (Volcán Tizón). **Buceo** (70 + N4) en el muelle de buzos de
  Caleta Sonda: Zygarde envuelve al jugador en su campo. **Detección mejorada** a las 60 células.
- **Cambio:** la crisis entra en fase 2 visible (atardeceres largos).
- **Salida:** `b13_talasa`, `zyg_core_4`, `zyg_dive`. Hacia el Arrecife del Eco.

### B14 — Pilar de los Ecos (P7)

- **Mapas:** `fondo_mar_sur`, `arrecife_eco`, `antea_*` (4 salas × 3 capas: presente sumergido en 15; Antea seca en
  2/7 con piezas de ciudad; era primigenia en 7 con helechos), `fosa_eco` (cámara del núcleo).
- **Entrada:** Buceo; nivel ~51.
- **Problema humano:** las «mareas del eco» se llevan a los pescadores de Caleta Sonda durante horas; vuelven con
  monedas antiguas. El joven buzo **Fausto** no ha vuelto: está atrapado en un día de Antea que se repite. Genesis
  **draga Antea** en busca de reliquias del Rey (los planos de la corona, base de su Resonador).
- **Mazmorra: Ruinas de Antea** (reduce a 3 capas la propuesta base):
  - **Caracolas del eco.** Golpear una cambia **la sala entera** entre el presente sumergido (se bucea) y su eco (no hay
    agua; se camina). Cuanto más hondo, más antiguo: salas 1–2 alternan presente ↔ Antea seca; salas 3–4 alternan
    presente ↔ Antea ↔ era primigenia.
  - **Causalidad de un solo sentido (injerto «producción»):** lo que se hace en el pasado persiste en el presente, y no
    al revés. Mover una estatua en Antea abre un paso en la ruina sumergida; plantar un helecho en la era primigenia
    hace crecer una raíz por la que se trepa en Antea; cerrar una compuerta seca una sala del presente.
  - En los ecos solo aparecen especies antiguas (Cranidos, Shieldon, Relicanth, Corsola de Galar, Dreepy). **No hay
    Paradojas nuevas** (biblia §6.7, §16).
  - **Fausto** (sala 2, capa Antea): repite el mismo día; hay que llevarle a una caracola en el orden de su rutina
    para que «despierte». Vuelve a Caleta por su cuenta.
  - **Bramaluna Alfa** (`ROARINGMOON`) patrulla la era primigenia (salas 3–4), visible, con cono de visión de 5
    casillas y aviso de rugido. Si ve al jugador, embiste: fundido y regreso a la última caracola, sin combate ni daño.
    Anida en la cámara del núcleo, así que el combate final es obligatorio.
- **Combate: Bramaluna Alfa** — dominante del eco, **no guardiana**. Nivel 56, tamaño Alfa, Energía Potenciadora
  (Paleosíntesis). Danza Dragón, Triturar, Garra Dragón, Acróbata. Es un **eco**: la Poké Ball la atraviesa y la
  captura está desactivada con mensaje explicativo («Es un eco: no hay nada que atrapar»). Victoria: el eco se
  desestabiliza. Derrota: el jugador vuelve a la cámara anterior, junto a un manantial de curación del eco.
- **Cambio en el mundo:** las mareas se normalizan; Fausto vuelve; **el hielo-eco retrocede del norte (se abre la Ruta
  11)**; se reanudan los **ferris**; la draga de Genesis queda inservible.
- **Recompensas:** Fragmento 7, verso VII, pista T13. **Bramaluna Alfa pasa a ser real en la Fosa del Eco** (captura
  opcional: nivel 58, ratio de captura 10, reaparece al descansar si se debilita).
- **Salida:** `p7_restored`. Nivel ~55.

### B15 — Interludio 7: el norte, Villa Boreal y el quinto núcleo

- **Mapas:** `ruta_11`, `paso_del_norte`, `ruta_12_senda_lazo` (tramo bajo), `ruta_13`, `villa_boreal` e interiores
  (Observatorio Boreal, Talleres del Hielo, posada), `gruta_escarcha`, `mar_boreal`.
- **Entrada:** Ruta 11 abierta.
- **Problema:** **desvinculación**. En el norte los Pokémon no reconocen a sus entrenadores (el Frigibax del tallista
  Rosendo no se le acerca). En la Senda del Lazo se sube y se vuelve al principio; la columna de luz de la Cumbre Azur
  atrae a curiosos.
- **Secuencia:** Ruta 11, Paso del Norte, Senda del Lazo baja (Tyranitarita), Ruta 13, Villa Boreal y **T13**.
- **Gael, combate B5 y entrega de N5**, en el Observatorio Boreal: «Si me ganas, es tuyo. Si no… también. Pero quiero
  saberlo.» Usa **Mega Absol con un aro negro de piedra violeta** (prototipo de Genesis: acto de captación). Equipo:
  Staraptor 53, Lucario 53, Weavile 53, Garchomp 54, Absol 55 (Mega), inicial final 56. Tras el combate, le da N5:
  «A mí no me habla. Nunca me ha hablado.» Zygarde, a Gael, por primera vez: «Gracias, Gael.» Gael no contesta y se va.
  Alerce, más tarde: «Ese aro no es de ninguna tienda.»
- **Salida:** `b15_n5`, `zyg_core_5`. Hacia los Lagos del Alma.

### B16 — Pilar del Alma (P8) (D17)

- **Mapas:** `lagos_alma` (1 + 11), `santuario_alma` (11 + kit tinte rosa pálido): patio central, Ala del Saber, Ala
  del Sentir, Ala del Querer, Telar del Alma.
- **Entrada:** Nadar y P7; nivel ~57.
- **Problema humano:** desvinculación en todo el norte; en Boreal piden marcharse.
- **Estructura:** las tres alas se hacen **en cualquier orden**; después, el Telar. Una célula por ala y otra en el
  Telar (C097–C100, obligatorias).
- **Uxie, conocimiento: Ala del Saber** (combina las propuestas; sin trivia arbitraria):
  - *Ronda 1, «Lo que viste»* (injerto «producción»): siete pedestales con los glifos de las cámaras P1–P7 y siete
    relieves con lo que cada Pilar reparó (puertas que cierran, cauce, viento, peso, memoria, sombras, mareas). Se
    coloca cada glifo junto a su efecto; un error devuelve el glifo a su pedestal. Solo exige recordar el propio viaje
    (la Libreta, pestaña «Diario», lo registra).
  - *Rondas 2 y 3, «Lo que se deduce»*: puertas con inscripciones de las que **solo una dice la verdad** (caballeros y
    bribones), de 3 y luego 4 puertas. Las inscripciones hablan de lo vivido («La que miente dice que el Albo corría
    hacia atrás»).
  - Un error provoca el «olvido» de Uxie: la ronda vuelve a empezar, sin más castigo. Premio: **Hebra del Saber**.
- **Mesprit, emoción: Ala del Sentir** (combina narrativa + «progresión»):
  - Una sala de espejos donde el **reflejo del jugador se mueve invertido**. Mesprit se esconde entre reflejos; hay que
    llevar el reflejo propio hasta el suyo. Cada captura muestra una emoción de alguien del viaje: el orgullo de
    Leandro, la carga de Fermín, el miedo de Fausto.
  - **Último espejo: el recuerdo de Gael.** El jugador **controla a Gael** (controles en espejo) y revive su día del
    Laberinto (la escena oculta de B01: corre al laboratorio, pide permiso, Alerce dice «Esperaremos a la policía», y
    espera), luego la explanada del Umbral, donde Casilda no le deja pasar, y el aljibe que no le respondió.
  - Mesprit pregunta: «¿Qué le dirías?» Tres respuestas, **ninguna incorrecta**: «No fue culpa tuya» · «Tú también
    llegaste lejos» · «Deberías haber entrado sin pedir permiso». La elección cambia una línea de Gael en P10 (§6.4).
    Premio: **Hebra del Sentir**.
- **Azelf, voluntad: Ala del Querer.** Pasillo donde el viento de Azelf empuja hacia atrás si el jugador se detiene
  (sin castigo: vuelve a la última repisa). Después, combate contra **Azelf nivel 58 sin objetos de la mochila** (la
  interfaz explica el sello antes de empezar), con estadísticas normales, sin equipo a 1 PS y sin transformaciones.
  Movimientos: Poder Pasado, Psíquico, Maquinación, Lanzallamas. Al perder, se reintenta al momento con el equipo
  curado. Premio: **Hebra del Querer**.
- **La Cadena Roja** (`REDCHAIN`, ID nuevo): en el **Telar del Alma** el trío trenza las tres Hebras. Ritual breve
  (secuencia de tres pulsaciones). No hay herrero.
- **El trío** presta su poder, recita el verso VIII y vuelve a sus alas (no se captura en la historia; reencuentros
  distintos en el postgame, §8).
- **Hito de la Forma Completa** (injerto «producción», adaptado):
  1. Al salir, el cielo se rompe: auroras, luna enorme, grietas; los lagos se hielan y hierven a la vez (fase 3).
  2. El **puente de hielo** de la salida, lleno de vecinos de Boreal que habían subido a ver la aurora, se quiebra.
  3. Zygarde: «Si no me sostengo ahora, no habrá nada que sostener.» Con 100 células y 5 núcleos, las células convergen
     en la **Forma Completa**, sostiene el puente y lo **reconstruye** (primera Reconstrucción, tutorial). «Nada me
     obliga. El mundo necesita que esté entero, y elijo estarlo.»
  4. Por radio, los Guardianes informan desde sus comarcas: Leandro cierra las esclusas, Abril evacúa la Meseta, Fermín
     apuntala la mina.
  5. **Si faltan células:** Zygarde sostiene el puente a medias hasta que todos cruzan (sin víctimas) y no puede
     formarse: «Me faltan [n] partes. Las siento todas encendidas.» Las células restantes brillan en el mapa regional y
     el hito ocurre al recoger la número 100, con la misma escena en versión corta.
- **Cambio en el mundo:** vuelve el vínculo de los Pokémon del norte. Crisis en fase 3 (Eclipse de Convergencia).
- **Recompensas:** Fragmento 8, Cadena Roja, **Forma Completa con Vuelo y Reconstrucción**, pista T14.
- **Salida:** `p8_restored`, `zyg_complete`. Nivel ~59.

### B17 — Interludio 8: Axis en eclipse

- **Mapas:** `mesa_vientos`, `mirador_sur` (ocupado), `senda_mirador`, `villa_alba` (noche de crisis), torres del
  **Anillo de Captación** en el borde de la Sima.
- **Entrada:** Vuelo.
- **Problema:** Genesis ocupa el **Mirador Sur** («estudio geotécnico del Consorcio»), levanta andamios hacia el puente
  roto y monta un **Resonador Sintético** con una **Cadena Sintética** construida con lo que registró desde fuera del P8.
  Lo alimenta el **Anillo de Captación**: tres torres en el borde de la Sima que drenan viento, tormenta y temblor
  (injerto «progresión»; prepara la motivación del Trío, §B20).
- **Secuencia:**
  1. **T14** (Mesa de los Vientos, con Vuelo).
  2. **Torres del Anillo** (opcional): cada torre se apaga con un puzzle breve de Reconstrucción y un combate de
     técnicos (nv 58–60). Recompensa: objetos (Restauración Total, Caramelo Raro). Apagarlas no es obligatorio; cambia
     una línea del Trío en P10.
  3. **Círculo del Jardín** (X26, opcional, de noche en Villa Alba): Mamá cuenta que los Clefairy bailan en el jardín
     «desde que la luna está rara». Los Clefairy pisan en secuencia seis puntos hundidos; el jugador memoriza la danza y
     alza las piedras en ese orden con Reconstrucción. El anciano de B01: «Mi abuelo decía que no había que moverlas…
     No dijo nada de levantarlas.» El Círculo queda en pie para siempre (el cartel «Donde el bosque guarda sus piedras»
     se vuelve literal). Mamá: «Tu abuela decía que en el jardín dormía algo. Yo creía que era un cuento.» Recompensa:
     3 Piedras Lunares y encuentros nocturnos de Clefairy en el jardín; el Círculo pasa a ser destino de Vuelo.
  4. **Vigilia:** cada Guardián sostiene su Pilar. En Caudal se reúnen Leandro, Olmedo y Alerce: «Van a intentarlo por
     la fuerza.»
- **Salida:** la Senda del Mirador, en el borde norte de la Sima. `b17_vigilia`. Hasta el P8 la Senda está cerrada
  desde Caudal (verja con candado de la Casa de las Esclusas y rápidos del Albo, X35); fondo de combate Acantilado.

### B18 — Pilar de la Convergencia (P9) (D18)

- **Mapas:** `senda_mirador`, `puente_convergencia` (1 + 8), `camara_cruce` (8 + kit tinte plata, 3 salas).
- **Entrada:** Reconstrucción y Cadena Roja; nivel ~62.
- **Problema:** Genesis pretende **forzar la aparición** de Dialga y Palkia con su cadena falsa y abrir un paso directo
  al Creador sin la Flauta: lo mismo que intentó el Rey del Eje con su corona (Crónicas V–IX).
- **Secuencia:**
  1. Reconstruir el tramo central del Puente desde el borde norte (tres puntos señalizados).
  2. Combates en secuencia sobre el puente; entre uno y otro, Alerce (desde el borde) ofrece curar:
     - **Casia:** Reuniclus 62, Magnezone 61, Beheeyem 61, Hatterene 62.
     - **Garrido:** Conkeldurr 62, Rhyperior 62, Tinkaton 61, Houndoom 63 (Mega).
     - **Vértice**, en el Resonador: Magnezone 64, Porygon-Z 65, Hydreigon 65, Metagross 66, Alakazam 67 (Mega).
       Antes del combate, al jugador: «Él te enseñó a escuchar. ¿Quién crees que le enseñó a él?»
  3. Tras vencer a Vértice, el Resonador se sobrecarga y la Cadena Sintética se parte. **Dialga y Palkia irrumpen**
     furiosos en la Cámara del Cruce. Vértice, a Gael (que ha llegado por el borde sur): «Ven conmigo. Tú sabes lo que
     es esperar.» Gael: «No voy a pedirle permiso a nadie. Tampoco a usted.» Vértice **se retira** en el aerodeslizador
     de Genesis y **se le cae el cuaderno de campo**. Olmedo llega con la Policía Regional y detiene a Casia y a Garrido.
     Gael **recoge el cuaderno** y se marcha.
  4. Cámara del Cruce y elección.
- **Mazmorra: Cámara del Cruce** (3 salas):
  - La Cadena Roja permite «tensar» hacia uno de los dos ejes; hay cristales de cambio en cada sala.
  - **Hacia Dialga (tiempo):** lo que se mueve se congela: los escombros que caen se quedan en el aire y sirven de
    peldaños; las corrientes se vuelven cristal pisable; los pliegues se cierran.
  - **Hacia Palkia (espacio):** los **pliegues** (pares de marcas violetas) conectan casillas lejanas; todo lo que se
    movía vuelve a moverse.
  - Salas: (1) de la Caída, (2) del Río, (3) del Cruce, que combina las dos.
- **Elección (verso IX):**
  - El núcleo pide **atar a uno**. El jugador elige a Dialga o a Palkia (confirmación explícita; la elección queda
    fijada).
  - **Combate** contra el elegido, nivel 65 (Dialga: Distorsión, Garra Metal, Pulso Dragón, Poder Pasado · Palkia:
    Corte Vacío, Hidropulso, Pulso Dragón, Poder Pasado). La captura se habilita **por debajo del 50% de PS** («la
    Cadena lo retiene»); la interfaz lo avisa. **Capturarlo es opcional.**
  - **Victoria (captura o derrota del legendario):** el eje queda atado, el Pilar se restaura y se libera el Fragmento
    9 igual. Si se debilitó sin capturarse, el elegido permanece en la Cámara del Cruce y reaparece tras descansar,
    tantas veces como haga falta (nivel 65).
  - **Derrota del jugador:** vuelve a la entrada de la Cámara con el equipo curado; la elección se conserva.
  - El no elegido regresa a su dimensión y **deja su orbe** en la plataforma como promesa (Dialga elegido → Palkia deja
    la **Lustresfera**; Palkia elegido → Dialga deja la **Diamansfera**).
  - La Cadena Roja queda «templada» (objeto clave conservado; no se consume).
- **Cambio en el mundo:** los relojes se sincronizan y la Sima deja de ensancharse.
- **Recompensas:** Fragmento 9, el orbe del no elegido, el elegido (si se captura), pista T15.
- **Salida:** `p9_restored`, variable `p9_choice` (`DIALGA` | `PALKIA`), `p9_chosen_caught`. Nivel ~66.

### B19 — Interludio 9: la Calzada del Rey

- **Mapas:** `calzada_rey` (1 + 2), `sima_eje`, `puerta_quince`.
- **Entrada:** P9 restaurado.
- **Problema:** los **Peregrinos del Rey** usan un trozo del Resonador para levantar a la fuerza la Calzada del Rey
  (T15).
- **Secuencia:** **T15**, la última Crónica, que completa el camino. Alerce, antes de la bajada: «Si ves a Gael… no le
  digas nada que yo no haya tenido el valor de decir.»
- **Salida:** la Puerta de las Quince. `b19_calzada`.

### B20 — Pilar del Origen (P10) (D20)

- **Mapas:** `puerta_quince`, `senda_origen` (9 tramos de 24×18), `cielo_interior` (8 + panorama `cielo`),
  `terraza_ultimo_sello`, `nucleo_origen`.
- **Entrada:** 9 Fragmentos, 15 Tablillas y Forma Completa. **No se exige la Flauta** (biblia §6.10). Nivel ~67. La
  puerta indica qué falta si no se cumplen las condiciones.
- **Puerta de las Quince:** quince nichos. Cada Tablilla colocada proyecta un tramo del camino en el vacío y la
  Reconstrucción levanta sus piedras (Crónica XIII). Tres nichos del centro siguen oscuros: los de Arceus.
- **Senda del Origen** (combina narrativa + «progresión»): un **recorrido** de 9 tramos breves, cada uno eco de un
  Pilar y de una capacidad, sin jefes:
  1. dinteles giratorios (Umbral; Correr por grava);
  2. estanques y compuerta (Corriente; Nadar);
  3. ráfagas con veleta (Impulso; Embestida);
  4. placa de contrapeso (Masa; Terreno);
  5. losa de recuerdo que se sigue (Memoria; Trepar);
  6. arista de giro con Ancla (Invertido);
  7. caracola del eco en una cisterna (Ecos; Buceo);
  8. tres voces que hay que seguir a la vez: saber, sentir, querer (Alma);
  9. cascada detenida y pliegue (Convergencia; Reconstrucción).
  Dos **Manantiales del Origen** curan y guardan punto de control. En las paredes, el verso X y el último mensaje de los
  Custodios.
- **Cielo Interior y Trío de las Nubes:**
  - Caverna con cielo propio. **Motivo (D20):** son el **último sello del Pacto de las Nubes** (Crónica XI: los
    Custodios les pidieron interponerse si alguien volvía a llamar) y **acaban de sentir** cómo manos humanas
    desgarraban el viento, la tormenta y la tierra (el Anillo de Captación). Para ellos, un humano con el último
    Fragmento es la misma amenaza que el Rey. No son siervos de nadie ni están hipnotizados.
  - Combates en secuencia: **Tornadus 68** (Vendaval, Maquinación), **Thundurus 68** (Rayo, Pulso Umbrío), **Landorus
    70** (Tierra Viva, Roca Afilada), con manantiales curativos entre uno y otro. **Captura desactivada** («No es
    momento: es un sello»).
  - Después preguntan: «¿Para qué lo despiertas?» Tres respuestas, todas válidas: «para arreglar el cielo» · «para que
    nadie lo haga por la fuerza» · «no lo sé; Zygarde me lo pidió». Zygarde Completo se pone junto al protagonista:
    «Yo respondo por él.» / «Yo respondo por ella.» El Trío se retira al cielo (búsqueda en el postgame). Si el jugador
    apagó torres del Anillo, Landorus añade: «Alguien apagó las torres. Lo sentimos.»
- **Gael** en la Terraza del Último Sello (§6.4): cura al equipo, combate B6 y conversación sobre el verso X. Se va por
  la Senda sin llevarse nada.
- **Núcleo:** el Pilar responde y libera el **Fragmento 10**. **Los diez se elevan y se unen solos** por resonancia con
  Zygarde, sin artesano: **Flauta Azur** (`AZUREFLUTE`). La profecía se lee entera de corrido.
- **Falsa calma (D19):** se cierran las grietas del cielo, pero la luna sigue grande y el cielo zumba. Zygarde: «El Eje
  está entero. Pero quien lo sostiene duerme.»
- **Salida:** `p10_restored`, `b20_flute`. Nivel ~71.

### B21 — Final: Columna Lanza y epílogo (D21, D22, D23, D24)

1. **Salto de Convergencia.** Zygarde adopta a propósito la forma 10%: «Súbete. Esta forma sabe correr por los caminos
   viejos.» El Nodo del Origen (hexágono del suelo) lo lleva a Columna Lanza: velocidad, espacio estirado, destellos de
   ruinas (20–30 s). Aviso previo: «No podrás volver hasta terminar lo que empiece allí. Prepárate cuanto quieras.» El
   nodo espera. Se puede saltar desde la segunda vez con el mismo estado final. Los Unown solo aparecen como escritura.
2. **Captura voluntaria de Zygarde (D21).** Al llegar, antes de tocar la Flauta: «Antes de despertarlo… llévame contigo.
   No como parte del camino. Como parte del combate.» Respuestas «Sí» / «Todavía no» (la escena espera).
   - Esfera: una **Honor Ball** (`PREMIERBALL`) que no se lanza: Zygarde se acerca y la toca.
   - Entra en **Forma Completa, nivel 70**, habilidad Agrupamiento, con Mil Flechas, Mil Temblores, Fuerza Telúrica y
     Danza Dragón.
   - **Con el equipo lleno:** el Arca abre un menú obligatorio para enviar a un Pokémon al PC (sin cancelar);
     después se puede reordenar.
   - Las capacidades de campo siguen activas aunque Zygarde esté en el PC (dependen del vínculo).
3. **Despertar.** El jugador toca la Flauta Azur y Arceus despierta. **Motivo (D22):** el Creador no despierta para quien
   lo llama, sino **para medir** lo que el mundo ha hecho mientras dormía. No es malvado, ni está controlado, ni deja de
   reconocer al jugador. Cada fase es una pregunta:
   - Tierra: «¿Sostienes lo que reparaste?»
   - Fantasma: «¿Miras la sombra sin volverte ella?» (alude al Rey y a Genesis)
   - Normal: «¿Qué eres cuando no queda nada que ganar?»
4. **Combate en tres fases, orden fijo (D23).** Arceus nivel 75, habilidad Multitipo, un único combate sin volver al
   mapa.
   - **Fase Tierra:** lleva la Tabla Terrax (`EARTHPLATE`). Sentencia, Roca Afilada, Danza Espada, Recuperación.
   - **Fase Fantasma:** lleva la Tabla Terror (`SPOOKYPLATE`). Sentencia, Bola Sombra, Paz Mental, Recuperación.
   - **Fase Normal:** sin objeto (su forma propia). Sentencia, Velocidad Extrema, Hiperrayo, Recuperación una sola vez.
     **La Tabla Legendaria no se equipa** (cambiaría el tipo): es el objeto que suelta al final.
   - **Transición:** cuando los PS de Arceus llegan a 0 en las fases 1 y 2, no se debilita: suelta la Tabla y cambia de
     tipo, recupera todos sus PS y se borran cambios de estadísticas y trampas de campo. El equipo del jugador
     **recupera el 25% de sus PS máximos** («la Tabla liberada devuelve fuerza a quien la liberó»); los debilitados
     siguen debilitados. La mochila se puede usar en todo momento.
   - **Captura:** desactivada en las fases 1 y 2 (Balls en gris, mensaje «Arceus aún sostiene la Tabla X»); ningún
     intento consume objeto ni turno. En la fase 3 se activa cuando Arceus baja del 50% de PS y **suelta la Tabla
     Legendaria**; desde ese momento no usa Recuperación. La Master Ball solo se puede usar entonces y garantiza la
     captura. Ratio de captura 3; no huye.
   - **Derrota del jugador:** «Reintentar fase» (equipo y objetos como al empezar esa fase) o «Retirarse» (antecámara con
     el equipo curado). La fase alcanzada se guarda; al volver, Arceus la retoma con todos sus PS.
   - **Arceus debilitado en la fase 3:** cuenta como victoria. La historia sigue y Arceus queda en Columna Lanza para un
     reencuentro en el postgame (§8.1).
5. **Resolución.** El jugador recibe **Terrax, Terror y Legendaria** y completa las 18 Tablillas, capture o no a Arceus.
   Arceus confirma la profecía: «Respondiste a la llamada. Eres aquel del que hablaban las piedras.» El eje que no se
   eligió en el P9 queda reparado; se apaga la aurora, la luna vuelve a su tamaño y vuelve el ciclo normal.
6. **Epílogo (D24):**
   - Zygarde en 10% devuelve al jugador por el Salto hasta el **nodo del Laberinto**. Olmedo, en la verja: «Otra vez tú.»
   - Mamá, en la puerta de casa.
   - **Alerce entrega la llave del cuarto del fondo** (`ALERCEKEY`): «Hay cosas ahí que debería haber enseñado hace
     tiempo. Cuando quieras.» Dentro (postgame), fotos y cuadernos del Proyecto Laguna. No hay confesión.
   - Montaje de los Guardianes en sus Pilares (y los Clefairy del Círculo del Jardín, si se levantó).
   - **La casa de Gael, vacía.** Una nota y un **huevo de su inicial**: «Para que tu Pokédex no tenga huecos por mi
     culpa.»
   - En la tele: «El Dr. Vértice ha abandonado Axis en un carguero con bandera extranjera.» En la cubierta, Vértice
     busca un cuaderno que no encuentra.
   - Créditos sobre los lugares restaurados (BGM Creditos). El jugador despierta en su cuarto. Zygarde sigue en Forma
     Completa **por decisión propia y por el vínculo**; el Arca solo gestiona formas. Empieza el postgame.
- **Salida:** `game_cleared`, `arceus_caught` (opcional).

---

## 5. Genesis (D13, D14, D15; X08)

### 5.1 Estructura

- **Doctrina (VIGENTE):** entender, reproducir, aprovechar, controlar y decidir. Genesis identifica su voluntad con el
  interés de todos. **No destruye lo que necesita:** mide, ocupa, copia y extrae (biblia §9).
- **Fachadas (DECIDIDO-DEV):** el **Consorcio Meridiano de Estudios Geofísicos** (operaciones de campo) y la
  **Fundación Meridiano** (mecenazgo cultural). El nombre «Genesis» no se dice en público hasta el P3.
- **Rangos:** técnicos de campo, investigadores, dos directores y el Líder Supremo.
- **Emblema:** dos tubos de ensayo cruzados sobre un círculo.
- **Uniforme y paleta** (sin el verde de Zygarde):
  - Técnicos: mono **petróleo #1F4E5A** con peto **blanco clínico #F2F4F5**, botas y guantes **carbón #2B2D31**, visor
    y emblema **magenta-violeta #B03A8C**. Maletín de instrumentos; nada de aspecto militar.
  - Directores: bata blanca larga con solapas carbón y ribete magenta.
  - Líder: traje carbón con alfiler magenta; en su aparición como líder, bata blanca y capa corta carbón.
- **Origen:** hace 16 años existía un proyecto clandestino de estudio de anomalías, el **Proyecto Laguna**. Tras el
  incidente de la Laguna Clara (la inducción de resonancia drenó la laguna; hoy es la Marisma Turbia), Vértice rebautizó
  el grupo como **Genesis**, «empezar de cero». Genesis no causó el prólogo.
- **Técnicos (8–12 combates repartidos):** Magnemite/Magneton, Bronzor, Solosis/Duosion, Elgyem, Porygon, Stunky,
  Skorupi, Houndour, Croagunk, Venipede, al nivel del tramo.

### 5.2 Líder Supremo: Dr. Aurelio Vértice (D14)

- **Perfil:** 63 años, geofísico. Alto y delgado, pelo plateado peinado hacia atrás, barba blanca corta, gafas redondas
  con tinte violeta. Cortés e irónico. Su frase de fondo: «La profecía es una cerradura; yo fabrico llaves.»
- **Primera aparición:** gala del Museo de las Eras (B09), como mecenas. No menciona a Alerce.
- **Revelación como líder:** pantalla de Talasa (B13).
- **Combate:** P9 (B18). Magnezone 64, Porygon-Z 65, Hydreigon 65, Metagross 66, Alakazam 67 (Mega). BGM
  CombateGiovanniFinal.
- **Fuga:** se retira en P9 en el aerodeslizador (pierde el cuaderno que recoge Gael) y **abandona Axis por mar en el
  epílogo**. En el DLC 1 solo aparece en un mensaje grabado.

### 5.3 Directores y personal

- **Dra. Casia Varela** (41), Investigación. Precisa; llama a las personas por sus datos; trabaja con células. Cameo sin
  nombre en P1; se presenta en P3 (Solosis 23, Magnemite 24, Elgyem 25); cameo en P5; Talasa (Reuniclus 50, Magneton 49,
  Beheeyem 49); P9 (Reuniclus 62, Magnezone 61, Beheeyem 61, Hatterene 62).
- **Ulises Garrido** (47), Operaciones. Excapataz pragmático, nada cruel. Aparece en B07 (sin combate); P4 (Gurdurr 31,
  Rhyhorn 31, Houndoom 32); Talasa (Conkeldurr 50, Houndoom 50, Rhydon 51); P9 (Conkeldurr 62, Rhyperior 62, Tinkaton
  61, Houndoom 63 Mega).
- Casia y Garrido son **detenidos** por Olmedo en P9.
- **Nilo** (22), técnico que deserta en T10 y regala el Porygon en Talasa.

### 5.4 Actos por capítulo

| Tramo | Fase | Acto | Resultado |
|---|---|---|---|
| Apertura (B01) | Investigación | Topógrafos en la Ruta 1 | Presencia sin nombre |
| P1 (B02) | Investigación | «Equipo de medición» en el Umbral; Casia hiere a Casilda con su frase | Casilda los echa |
| P2 y T02 | Investigación | Balizas de resonancia en la Garganta; oferta por el Molino del Diezmo | Balizas retiradas; Darío deja el Consorcio |
| P3 (B06) | **Ocupación** | Parque Eólico convertido en Colector de células | Revelan su nombre; pierden N2 y 4 células |
| B07 y P4 | Ocupación | Voladuras en la Cantería; opción de compra de la mina; pozo lateral; graban la firma de P4 | Pierden la compra; se llevan datos |
| B09 | Influencia | Gala; intento de llevarse la Tabla Acero (T06); bombas de la Marisma (T08) | Fracaso; se expone el daño ecológico |
| P5 (B10) | **Extracción de información** | Copian el Archivo | Se llevan copias (ambigüedad moral) |
| B11 | Extracción | Campamento del Monte; perforación de la explanada (EXP-03); cuadrilla perdida (T10) | Se llevan el cristal |
| P6 (B12) | — | No pueden entrar en el aljibe; midieron desde fuera | — |
| B13 | Extracción | Talasa: N4, cultivos celulares; perforación del volcán (T12) | Revelan al líder; sueltan N4 a propósito |
| P7 (B14) | Extracción | Dragado de Antea (reliquias y planos de la corona) | Base de su Resonador |
| B15 | Captación | Aro negro de Mega Evolución para Gael | Semilla del DLC 1 |
| B17 y P9 | **Culminación** | Operación Convergencia: Mirador Sur, Anillo de Captación, Resonador y Cadena Sintética | Derrota, detenciones y retirada de Vértice |
| Epílogo | — | Vértice sale de Axis | Quedan restos de la organización |

### 5.5 Alerce: verdad interna y revelación (D15)

- **Verdad interna (solo para el equipo).** Alerce desarrolló el método de **«escucha» de los Pilares**, que calibraba a
  mano. Codiseñó la inducción de resonancia de la Laguna Clara. La noche anterior avisó del riesgo, pero no lo impidió.
  La laguna se drenó en una semana, el caserío perdió su medio de vida y la marisma se volvió tóxica. Alerce destruyó sus
  notas, se fue a Villa Alba y **nunca testificó**: su culpa es el silencio. Reconoció la señal del Core y por eso hizo
  esperar a Gael.
- **Escalera de revelación** (subtexto; nunca hay confesión; lo más directo ocurre después del P5):
  1. B01: «…Un núcleo.»
  2. B03: «¿Balizas de tres patas en la Garganta? …Da igual.»
  3. B09: ficha de catálogo de la expedición a la Laguna Clara, «resultados no publicados» (sin nombres).
  4. T08: Remedios: «Vinieron unos señores a medir la laguna, con aparatos como ese.» / «Son aparatos corrientes.»
  5. P5: informe con el nombre del responsable de calibración tachado.
  6. B11: «Usted sabía quiénes eran desde el principio.» / «Sabía de qué eran capaces.»
  7. **Talasa, escena clave:** la foto con el rostro rascado y el cuaderno; «¿Sigue calibrando a mano?» / «Ya no.»
  8. P9: Vértice al jugador: «Él te enseñó a escuchar. ¿Quién crees que le enseñó a él?»
  9. B19: «Si ves a Gael… no le digas nada que yo no haya tenido el valor de decir.»
  10. Epílogo: la llave del cuarto del fondo (y, en el postgame, los cuadernos del Proyecto Laguna).
- **Combate aliado:** en Talasa, contra Casia y Garrido, con Probopass 50, Bronzong 50, Gastrodon 51 y Porygon2 52.

---

## 6. Gael (D16)

### 6.1 El arco

- **Herida concreta.** Oyó la misma señal que el protagonista, **pidió permiso y esperó** porque Alerce se lo negó.
  Desde entonces ve cómo el mundo responde a quien no esperó.
- **Contradicción.** Defiende el mérito, pero termina queriendo **ser quien llama** (verso X): enlaza con los anillos de
  Hoopa del DLC 1.
- **Alternancia:** orgullo, distancia, ayuda, orgullo herido, seducción de Genesis, distancia, respeto, herida y camino
  abierto (biblia §9: respeto, ayuda, orgullo y distancia).
- **Regla de juego:** B1–B5 continúan la historia aunque el jugador pierda (cambia la frase de Gael); B6 hay que
  ganarlo.

### 6.2 Escenas por bloque

| Bloque | Escena | Tono |
|---|---|---|
| B01 | Duelo B1: «No ha sido suerte» (y la escena oculta del permiso) | Orgullo |
| B02 | Casilda no le deja entrar; ve formarse el 10% y se va en silencio | Distancia |
| B03 | B2 en el puente de Caudal: «Se me escapó… hacia ti» | Orgullo herido |
| B04 | Evacúa el barrio bajo y choca con Leandro | Ayuda |
| B06 | Combate doble junto al jugador en el Parque Eólico; se queda mirando los datos de Genesis | Ayuda y curiosidad |
| B09 | Vértice elogia su informe en la gala; B3 en la escalinata del museo | Seducción de Genesis |
| B10 | Leyó el verso V antes que nadie y se fue | Esperanza y herida |
| B11 | Se enfrenta a Alerce; B4 al pie del Monte | Distancia |
| B13 | No aparece. Alerce: «Ha dejado de contestar.» | Ausencia |
| B15 | B5 con Mega Absol y el aro negro; entrega N5; «Gracias, Gael» | Respeto y herida |
| B16 | En el Ala del Sentir el jugador revive, en su piel, el día del Laberinto | Empatía |
| B18 | Rechaza a Vértice: «No voy a pedirle permiso a nadie. Tampoco a usted.» Recoge el cuaderno | Distancia |
| B20 | Cura al equipo, B6 y la conversación | Cierre abierto |
| B21 | Casa vacía, nota y huevo | Abierto |

### 6.3 Equipos

El inicial de Gael es el que tiene ventaja sobre el del jugador (D05): Turtwig → Gael lleva Litten; Litten → Sobble;
Sobble → Turtwig.

| Combate | Lugar | Equipo |
|---|---|---|
| B1 | Villa Alba (B01) | Inicial 5 |
| B2 | Puente de Caudal | Starly 8, Riolu 9, inicial 10 (X35) |
| Doble (aliado) | Parque Eólico | Staravia 24, inicial evolucionado 25 |
| B3 | Museo de Lúmina | Staravia 32, Lucario 32, Gabite 31, Absol 32, inicial evolucionado 34 |
| B4 | Pie del Monte | Staraptor 41, Lucario 41, Gabite 41, Absol 42, inicial final 43 |
| B5 | Observatorio Boreal | Staraptor 53, Lucario 53, Weavile 53, Garchomp 54, Absol 55 (Mega), inicial final 56 |
| B6 | Terraza del Último Sello (P10) | Staraptor 70, Lucario 70, Weavile 70, Garchomp 71, Absol 71 (Mega), inicial final 72 |

BGM: CombateRival; en B6, «Ultimo Pokemon» con su último Pokémon.

### 6.4 El Pilar del Origen

- **Curación (decisión; antecedente histórico ratificado como DECIDIDO-DEV):** «Siéntate. No voy a pelear contra un
  equipo roto. No quiero ganarte con trampas ni perder con excusas.» Usa su botiquín de campo y el equipo del jugador
  queda curado por completo.
- **Conversación tras B6:**
  - Leen juntos el verso X. Gael: «¿"Querrá ser quien llama"? …Eso sí lo entiendo.»
  - Gael: «Yo pedí permiso.»
  - Línea que depende de la respuesta dada a Mesprit (B16): «No fue culpa tuya» → «No quiero que me consueles.» ·
    «Tú también llegaste lejos» → «Lejos no es a tu lado.» · «Deberías haber entrado sin pedir permiso» → «…Quizá la
    próxima vez.»
  - Zygarde, que por primera vez dice su nombre ante él: «Gael. No respondí contra ti.» Gael: «Ya. Por eso es peor.»
  - Se va por la Senda sin llevarse nada.

### 6.5 Final del juego base

Gael no muere, no se redime, no es perdonado ni se une a Genesis en pantalla. Se lleva el cuaderno de Vértice, deja el
huevo de su inicial y se marcha de Villa Alba. Su destino queda para el DLC 1.

---

## 8. Postgame y DLC

### B22 — Postgame del juego base

Lo orientan personajes conocidos (Guardianes, Alerce, Rosalía, Ramón, Mamá). Todo se completa en solitario. Las
condiciones de captura se explican en pantalla; un intento bloqueado no gasta objeto ni turno; un legendario debilitado
reaparece al descansar.

| Legendario | Lugar | Requisito | Encuentro |
|---|---|---|---|
| Giratina | Mundo Distorsión profundo (por el aljibe) | Anclaje espacial | Fijar tres «caras» con el Anclaje; la Griseosfera está dentro. Forma Origen, nv 75, captura desde el turno 3 |
| Dialga o Palkia (el no elegido) | Columna Lanza, plataforma del otro | El elegido en el equipo y **el orbe que dejó el no elegido** | Rugido, temblor y aparición. Nv 75. Si el elegido no se capturó, primero se captura en la Cámara del Cruce |
| Arceus (si no se capturó) | Columna Lanza | Descansar tras el final | Solo fase Normal, nv 75, captura por debajo del 50% |
| Uxie | Ala del Saber | 15 Crónicas en la Libreta | «Última pregunta» sobre el propio viaje; combate nv 70 |
| Mesprit | Ala del Sentir | — | Visible, se mueve por los espejos; tocar su reflejo abre el combate (nv 70) |
| Azelf | Ala del Querer | — | Combate con objetos permitidos, nv 70 |
| Tornadus | Meseta del Impulso | Pista de Abril | Columna de vendaval que se desplaza; alcanzarla montado. Nv 70 |
| Thundurus | Dunas de Ceniza | Pista de Fermín | Tormenta seca; seguir los rayos. Nv 70 |
| Landorus | Cerro Plomo | Tornadus y Thundurus capturados | Temblores que convergen. Nv 72 |
| Articuno | Lago interior de la Gruta Escarcha | Pista de Rosendo | Capullo de hielo que se funde con un movimiento de Fuego. Nv 70 |
| Zapdos | Sala de turbinas del Parque Eólico | Pista de Abril | Cáscara de fulgurita que se rompe con un movimiento de Roca o Hielo. Nv 70 |
| Moltres | Cráter frío de Tizón | Pista de la Maestra Brasa | Costra de basalto que se rompe por choque térmico con un movimiento de Agua. Nv 70 |
| Raikou | Meseta y Rutas 4, 5 y 11 | — | Tres avistamientos con huida y rastro de marcas de rayo (la Detección los marca); el cuarto, fijo, en el Anillo de los Vientos. Nv 70 |
| Entei | Ruta 6, Dunas, Ruta 7 y Tizón | — | Rastro de hierba chamuscada; cuarto encuentro en la Cantería. Nv 70 |
| Suicune | Río Albo | — | Rastro de agua que se aclara; cuarto encuentro en el Lago del Sentir. Nv 70 |
| Lugia | Sima Marina bajo Talasa | Buceo y pista de Ramón | Oscuridad con destellos de Aerochorro; opción de accesibilidad: destellos largos o guía sonora. Nv 75 |
| Ho-Oh | Cerro del Alba | Ceniza Sagrada (`SACREDASH`, regalo de Olvido) | Encender el brasero al amanecer. Nv 75 |
| Kyogre | Fosa Abisal (fondo del Mar del Sur, este) | Prisma Azul (`BLUEORB`, eco de Antea) y Danza Lluvia en la superficie | Nv 75 |
| Groudon | Veta Magmática bajo Tizón | Prisma Rojo (`REDORB`, galería honda de la Mina Galena) y Día Soleado | Nv 75 |
| Rayquaza | Balcón del Cielo, Cumbre Azur | Kyogre y Groudon en el equipo, con tormenta | Nv 78; Ascenso Draco |
| Regirock | Cueva Sellada del Pico (Mina Galena) | Leer el relieve de los mineros con Fermín | Nv 70 |
| Regice | Cueva Sellada de la Escarcha | Talla de hielo con Rosendo | Nv 70 |
| Registeel | Cueva Sellada del Engranaje (túneles viejos de Lúmina) | Reloj restaurado con Rosalía | Nv 70 |
| Regigigas | Cámara del Coloso (Archivo Hondo) | Los tres Regis en el equipo | Nv 75 |
| Heatran | Cráter activo de Tizón | Piedra Magma (`MAGMASTONE`, ID nuevo) de la Forja | Nv 72 |
| Darkrai | Pesadilla de Villa Alba | Tras el rumor de Mamá («tienes mala cara, ¿duermes bien?»), la primera vez que se elige «dormir profundamente» de noche en casa | Nv 70. Si se debilita, vuelve en el siguiente sueño profundo. Sin probabilidades ni esperas en tiempo real |
| Cresselia | Islote Lumbre, de noche | Atrapasueños (`DREAMCATCHER`, ID nuevo) que Mamá teje tras el encuentro con Darkrai | Nv 70 |
| Mewtwo | Instalación Cierzo (islote del Mar Boreal) | 300 especies vistas | Tres prototipos fallidos (combates sin captura: ataque extremo, defensa extrema, tipo cambiante) y el original, nv 80. **La instalación no es de Genesis:** es un proyecto extranjero abandonado |
| Marshadow | Pilar del Umbral, de noche | Aviso de Casilda | Seguir la sombra que se mueve a destiempo. Nv 70 |
| Latias | Reflejo en el Lago del Sentir | Rocío Bondad (`SOULDEW`, eco de Antea) | Nv 70 |
| Latios | Mar del Sur, itinerante | Haber visto a Latias | Nv 70 |
| Paradojas de hierro (7) | Grieta del Porvenir | Tras el final | Ver abajo |

**Paradojas de hierro (Grieta del Porvenir, Mirador Sur de la Sima).** Son ecos de un futuro posible que abrió el
Resonador de Genesis al sobrecargarse en P9 (no tienen relación con el Pilar de los Ecos, que es solo pasado; biblia
§6.7). Estáticos y visibles, nivel 70–72, captura normal; cada uno con su condición:

| Paradoja | ID | Condición |
|---|---|---|
| Ferrodada | `IRONTREADS` | Rueda por el cauce seco; solo aparece si el jugador recorre el tramo a pie, sin montura |
| Ferrosaco | `IRONBUNDLE` | De noche, junto a la escarcha del borde; se acerca si el jugador se queda quieto 5 s |
| Ferropalmas | `IRONHANDS` | Hay que embestir tres bloques de hierro hasta su plataforma |
| Ferrocuello | `IRONJUGULIS` | Vuela en círculos solo al amanecer |
| Ferropolilla | `IRONMOTH` | De noche; se acerca a la luz de Zygarde (radio mayor con Destello) |
| Ferropúas | `IRONTHORNS` | Solo con tormenta («descansar hasta tormenta» en el Hotel Mirador de Lúmina) |
| Ferropaladín | `IRONVALIANT` | Al final de la grieta, a mediodía, tras haber visto a los otros seis |

**Otros contenidos:** Bastión Axis (instalación de combate, X18) · revanchas de los Guardianes, nivel 72–75 · cuarto de
Alerce con los archivos del Proyecto Laguna · Red de Convergencia · Ruinas de Talasa (Ditto) · Senda del Lazo abierta
con el Anclaje espacial.

### B23 — DLC 1: «Almenara» (Gael, Hoopa y Mega Zygarde) (D25, D26)

**Región nueva pequeña:** la península de **Almenara**, al otro lado del mar oriental, en ferri desde Nexo. Unos 8
mapas: Puerto Almenara (bazar y Centro), Ruta A1 (palmeral), Ruta A2 (salinas), Oasis del Vaso con las ruinas de la
Vasija, Monte Candil, **El Crisol** (antigua refinería de sal convertida en laboratorio) y la Torre del Crisol
(mazmorra final). Tilesets 9, 6, 1 y 11.

**Origen de la Zygardita (D26):** es el cristal **EXP-03** que Genesis perforó en la explanada del prólogo (B11). Se
formó de forma natural allí donde Zygarde Completo combatió tres noches: la roca quedó impregnada de su resonancia.
Genesis solo lo extrajo; no hay laboratorio que la sintetice, ni herencia del profesor, ni regalo de Arceus.

1. **D1-01, Consecuencias.** Meses después, un **anillo de Hoopa** se lleva la piedra-nodo del Laberinto. Alerce recibe
   una carta de Gael con coordenadas y sin firma.
2. **D1-02, La nueva operación.** Los restos de Genesis, reorganizados por Gael, usan los anillos para **extraer
   residuos de resonancia** de los Pilares y de hábitats legendarios. No capturan legendarios: solo energía. Problemas
   locales: el oasis se seca, el faro del puerto se apaga.
3. **D1-03, El Crisol.** Infiltración y combates contra técnicos que ahora siguen a Gael. Un **mensaje grabado de
   Vértice** se niega a ayudarle. Gael: «No necesito su permiso.» Aparece la Zygardita.
4. **D1-04, La culminación de Gael.** En la Torre, Gael canaliza por un anillo la energía robada hacia la Zygardita:
   quiere **despertarla sin Zygarde**, ser quien llama. **No toca a Zygarde.** El cristal no responde a la fuerza: se
   agrieta y la energía desbocada empieza a desestabilizar a Hoopa. Zygarde acude **por voluntad propia** junto al
   jugador y la piedra responde al vínculo: **Mega Zygarde**. Combate final contra Gael (nivel 80–82): Staraptor,
   Lucario, Garchomp, Weavile, Absol (Mega) e inicial.
5. **D1-05, La resolución.** Hoopa Desatado se descontrola (nivel 80). Hay que calmarlo con Mega Zygarde y sellarlo con
   la **Vasija Castigo** (`PRISONBOTTLE`); la captura es opcional y Hoopa reaparece si se debilita. **Gael se marcha**
   por el último anillo con los que le son fieles: no muere, no lo detienen, no se redime.

**Límites del DLC 1:** no hay más legendarios protagonistas que Hoopa y Zygarde. Sin suero, sin secuestro de Zygarde,
sin liberación masiva de legendarios.

### B24 — DLC 2: Registro de Expediciones (D27)

- **Orientadora:** la cronista y cartógrafa **Sabela Ferreiro** (34), exempleada de la autoridad portuaria, con oficina
  en la Aduana Vieja de Nexo. Práctica, directa, le encantan los mapas mal hechos. Sin relación con el museo ni con
  Genesis; no es un Galletano.
- **Sistema:** tablón de rumores con 6 categorías (Sueños, Clima, Ruinas, Movimientos, Profundidad, Anomalías). Como
  máximo **3 expediciones activas**. Cada una pasa de **Rumor** a **Indicio** (tras visitar un sitio o hablar con
  alguien) y a **Hallazgo**. Para confirmar una hipótesis, el jugador **marca un lugar en el mapa**; si se equivoca no
  pasa nada y Sabela da otra pista. Las expediciones se desbloquean en cuatro oleadas. Datos en JSON con banderas
  `dlc2_<id>_<fase>`.

| Legendario | Lugar y requisito |
|---|---|
| Mew | «El impostor»: un Pokémon común con una conducta imposible (un Bidoof que camina sobre el agua) en una de 5 rutas; con tres informes se revela. Nv 70 |
| Celebi | Santuario del Bosque Neblino: acercarse con sigilo (sin correr ni montar) y ofrecer bayas. Nv 70 |
| Jirachi | Mesa de los Vientos, noche despejada, con Trozo Estrella (`STARPIECE`) en la roca del deseo. Nv 70 |
| Manaphy | Huevo en la Cuna de Coral de Antea (Buceo) |
| Phione | Manaphy y Ditto en la guardería |
| Shaymin | Isla Pétalo (barco desde Nexo); Gracídea (`GRACIDEA`) de la florista tras el encuentro |
| Victini | Isla del Estandarte (barco) |
| Cobalion / Terrakion / Virizion | Cantería (proteger a unos Timburr de un derrumbe) / Cueva de las Dunas / Bosque Neblino: «pruebas de justicia» |
| Keldeo | Cascada de la Garganta del Albo, con los tres en el equipo |
| Reshiram o Zekrom | Sala de los Dos Ideales, en la Sima. La **Piedra Crisol** (`CRUCIBLESTONE`) se rompe al elegir; con sus fragmentos, la Forja de Tizón hace otra para el segundo. Nv 75 |
| Kyurem | Gruta Escarcha, al fondo, con Reshiram y Zekrom en el equipo. Punta ADN (`DNASPLICERS`) |
| Meloetta | Camino de bambú de Mnemos al atardecer: responder a su canto con **Canto** |
| Xerneas | Reserva del Delta: 300 pasos sin debilitar a ningún salvaje |
| Yveltal | Calzada del Rey: 10 victorias seguidas contra salvajes en la Sima |
| Diancie | Mina Galena: escoltar a un Carbink y defenderlo de 3 Sableye |
| Volcanion | Termas de Tizón: un mecanismo de Agua y otro de Fuego; el primero sigue activo 20 pasos, así que se resuelve en solitario |
| Cosmog | Rescate en el Cráter del Lucero |
| Solgaleo o Lunala | Cosmoem evoluciona con Piedra Día o Piedra Noche (Añil); el otro, en la Cumbre Azur de día o de noche |
| Ultraentes (11) | **7 Ultrazonas** pequeñas con reglas propias, viajando con Solgaleo o Lunala, siempre con regreso seguro: Cristal (Nihilego), Selva (Buzzwole, Pheromosa), Tormenta (Xurkitree), Cielo Alto (Celesteela, Kartana), Abismo (Guzzlord), Fortaleza (Stakataka, Blacephalon), Veneno (Poipole → Naganadel). Ente Ball (`BEASTBALL`) |
| Necrozma | «La luz perdida», en el Cráter del Lucero, tras los Ultraentes: crisis local distinta del Eclipse de Convergencia |
| Magearna | Cinco Engranajes antiguos (Estrato, Talasa, Brontia, museo, astillero de Nexo) y reparación en la tienda de trastos de Lúmina |
| Zeraora | Subestación de Brontia: despertarlo con **Danza Lluvia seguida de Trueno** (la «tormenta eléctrica» que pidió el autor) |

---

## Anexo A — Correcciones aplicadas respecto a la propuesta base

La base es la propuesta «narrativa». Se aplicaron todas las correcciones de los jueces y se injertaron ideas de
«progresión» y «producción»:

- **Grafo:** 10 células obligatorias antes del núcleo del P1 (C001–C005, C008–C012); margen de Buceo subido a +6 (dos
  células de Nadar más: C075, C076); Pilares siempre accesibles tras restaurarse; invariantes como tests de datos;
  cadena de resonancia (Fragmento N−1).
- **Tablillas:** sin llaves ni umbrales de Tablillas por Pilar (solo P10 exige las 15); cola de pistas con mínimo 2
  activas (TABLILLAS.md §4.2).
- **Alerce:** eliminadas «Lo diseñé hace años para otra cosa» (el Mega Aro sale de la Cantería), «aún guardo su taza»,
  la foto con su nombre en el museo, «Tú eras uno de los de las batas» y «Pregúntale por la Laguna». La escena clave
  sigue en Talasa, sin confesión.
- **Crónica IX:** ya no afirma que Arceus abriera la tierra: queda ambiguo (TABLILLAS.md §4.3).
- **P9:** captura del elegido opcional; el Fragmento 9 se obtiene igual; el orbe del no elegido es el que se usa en el
  reencuentro.
- **Megapiedras:** solo las de la lista del autor (biblia §16.5); Gengarita Y, Garchompita Z e Inteleonita quedan fuera
  (POKEDEX_DISTRIBUCION.md §7.7); se incluyen Lucarita Z y Absolita Z.
- **DLC 1:** Gael no arrastra a Zygarde: intenta forzar la Zygardita. **DLC 2:** 7 Ultrazonas (recuento corregido).
- **Darkrai:** activación determinista, sin el 25% ni la espera de 20 minutos del historial.
- **Producción:** mar del sur en un solo mapa por capas; caserío de Tizón y Palafitos dentro de sus mapas; norte en
  Exterior1 con nieve; P6 con mapas gemelos de dos orientaciones; P7 con 3 capas y causalidad pasado→presente; kit
  común de Pilar; tablas de fondos y BGM; claves persistentes `cell_<mapa>_<n>`.
- **Injertos narrativos:** Mesprit jugado como Gael con controles en espejo; Uxie con una ronda de «lo que viste»;
  Senda del Origen en 9 tramos-eco; Trío motivado por el Pacto y por el Anillo de Captación, con el aval de Zygarde;
  Círculo del Jardín de Villa Alba; hito de la Forma Completa con el puente de hielo; medidor de la burbuja de Buceo;
  combates de Gael que no bloquean; Mamá teje el Atrapasueños.
