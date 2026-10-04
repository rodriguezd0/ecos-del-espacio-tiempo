# Pokédex de Axis: curva, distribución y reconciliación (sección 7 del diseño de campaña)

**Fecha:** 24-09-2026 · **Estado:** DECIDIDO-DEV (D28, D29), revisable por el autor.
**Canon aplicable (biblia §15–16):** inventario candidato de 412 nombres (336 generales, 7 Paradojas, 11 Ultraentes, 58
legendarios); reconciliaciones pendientes: Bramaluna, Ditto, Sableye, Latias/Latios y fauna submarina; las mismas tablas
en modo clásico y visible; Alfa raro (≈3% como punto de partida, no constante); captura legendaria exigente y explicada
en pantalla; el 100% se completa en solitario; ninguna forma regional exigida que no aparezca.
**Datos:** IDs de `game/data/species.json` (Añil); evoluciones leídas del PBS crudo
(`Pokemon Anil V4.13/PBS/pokemon.txt` y `pokemon_forms.txt`). Documentos hermanos: `docs/CAMPANA.md`,
`docs/TABLILLAS.md`.

---

## 7.1 Curva de niveles

> **Curva del principio rebajada — DECIDIDO (autor, 25-09-2026), DECISIONES X35:** B02–B04 más bajos y el orden B02 → B03
> obligado (puente de la Ruta 2 hasta el P1). `tools/audit_progression.mjs` comprueba etapa a etapa que ningún mapa
> alcanzable supere en más de 8 niveles el nivel esperado (test `tests/progression_audit.test.mjs`).

| Tramo | Bloque | Salvajes | Entrenadores | Jefes | Nivel esperado del jugador |
|---|---|---|---|---|---|
| Apertura y Ruta 1 | B01 | 2–4 | 3–6 | Gael 5 | 6 |
| P1 | B02 | 5–8 | 5–8 | Casilda 9–10 | 10 |
| Interludio 1 | B03 | 6–10 | 7–11 | Gael 8–10 | 12 |
| P2 | B04 | 11–18 | 13–17 | Técnicos 14–16; Leandro 17–19 | 19 |
| Interludio 2 | B05 | 16–22 | 18–22 | Técnicos 18–20 (T02) | 23 |
| P3 | B06 | 20–27 | 22–25 | Doble con Gael 22–25; Casia 23–25; Abril 26–28 | 28 |
| Interludio 3 | B07 | 24–29 | 25–29 | — (Mega Aro) | 30 |
| P4 | B08 | 27–34 | 28–31 | Garrido 31–32; Fermín 32–34 | 34 |
| Interludio 4 | B09 | 30–38 | 31–36 | Gael 31–34; Sol 34–35; restauradores 35–36; Vespiquen Alfa 36 | 37 |
| P5 | B10 | 35–41 | 36–39 | Olvido 38–40 | 40 |
| Interludio 5 | B11 | 37–45 | 38–43 | Honchkrow Alfa 42; Gael 41–43 | 43 |
| P6 | B12 | 40–47 | — | — | 46 |
| Interludio 6 | B13 | 42–50 | 44–48 | Perforación 46–47; doble de Talasa 49–51 | 50 |
| P7 | B14 | 48–55 | 49–52 | Bramaluna Alfa 56 | 55 |
| Interludio 7 | B15 | 50–58 | 52–56 | Gael 53–56 | 57 |
| P8 | B16 | 55–60 | — | Azelf 58 | 59 |
| Interludio 8 | B17 | 55–62 | 58–62 | Torres del Anillo 58–60 (opcional) | 62 |
| P9 | B18 | 60–65 | 60–62 | Casia 61–62; Garrido 61–63; Vértice 64–67; Dialga o Palkia 65 | 66 |
| Interludio 9 | B19 | 60–65 | 62–64 | Casandra 63–65; Salamence Alfa 64 | 67 |
| P10 | B20 | 62–68 | — | Tornadus 68, Thundurus 68, Landorus 70; Gael 70–72 | 71 |
| Final | B21 | — | — | Arceus 75 (tres fases) | 72 |
| Postgame | B22 | 65–80 | 70–80 | Legendarios 70–80; revanchas de Guardianes 72–75 | — |
| DLC 1 y DLC 2 | B23–B24 | 70–85 | 75–85 | Gael 80–82; Hoopa Desatado 80 | — |

Ayudas: Repartir Exp desde B03 (desactivable); revanchas semanales del Torneo del Pulso (T05); curación garantizada
antes de cada jefe de Pilar (Centro cercano, Mamá, manantiales de P10).

## 7.2 Leyenda y reglas de encuentro

| Método | Significado |
|---|---|
| Hierba | Hierba alta (día y noche iguales si no hay tabla de noche) |
| Hierba (día) / Hierba (noche) | Tablas por franja horaria del reloj de juego (TEC-06); «descansar» cambia la franja |
| Hierba (con lluvia) | Sustitución parcial mientras llueve («descansar hasta tormenta» en posadas) |
| Hierba agitada | Hierba que se mueve (Audino) |
| Árbol de miel | Se unta miel y se vuelve tras descansar |
| Cueva / ruina | Encuentros en interiores y mazmorras |
| Nadar / Buceo | Superficie con el 50% / fondos con la burbuja de Zygarde |
| Caña Vieja / Caña Buena / Supercaña | `OLDROD` (Caudal, B03) · `GOODROD` (Nexo, B09) · `SUPERROD` (Caleta Sonda, B09) |
| Capa de eco | Salas de eco del Pilar de los Ecos |
| Visible fijo | Pokémon en el mapa con posición fija (captura o combate al tocarlo) |
| Evento / regalo | Entrega de un NPC o evento único |

- **Modos clásico y visible** usan exactamente las mismas tablas y porcentajes (biblia §15).
- La **capa de cielo de crisis** nunca cambia tablas (TEC-06).
- Las «etapas» A–H son las de CAMPANA.md §2.3 (A sin capacidad · B Correr · C tras P2 · D Terreno · E Trepar · F Nadar ·
  G Buceo · H tras P7 · Completa · P10 · Post).
- Las tablas de etapas avanzadas en zonas tempranas (por ejemplo, Nadar en Caudal) solo se activan al tener la
  capacidad; sus niveles corresponden al momento en que se usan.

## 7.3 Distribución por zona

Tablas generadas y verificadas con script (ver §7.10). Porcentajes por método; cada tabla suma 100 salvo las marcadas
como parciales o de evento.

#### Ruta 1 · etapa A · acceso: libre (B01)

| Método | Nv. | Especies (%) | Nota |
|---|---|---|---|
| Hierba (día) | 2–4 | Starly 20, Bidoof 20, Lillipup 15, Kricketot 15, Shinx 10, Budew 10, Wurmple 10 | tabla de B01 |
| Hierba (noche) | 2–4 | Hoothoot 20, Bidoof 20, Kricketot 20, Lillipup 15, Shinx 10, Wurmple 10, Budew 5 |  |

#### Ruta 10 (tramo bajo) · etapa A · acceso: libre desde el cruce oeste de la Ruta 1

| Método | Nv. | Especies (%) | Nota |
|---|---|---|---|
| Hierba (día) | 4–7 | Starly 20, Pidove 20, Budew 15, Lillipup 15, Wurmple 15, Kricketot 15 |  |
| Hierba (noche) | 4–7 | Hoothoot 30, Kricketot 25, Lillipup 20, Wurmple 15, Budew 10 |  |

#### Pilar del Umbral (Ruinas del Dintel) · etapa A · acceso: libre

| Método | Nv. | Especies (%) | Nota |
|---|---|---|---|
| Cueva / ruina | 5–8 | Geodude 30, Zubat 30, Machop 15, Nacli 15, Bonsly 6, Onix 4 |  |
| Evento / regalo | 7 | Geodude | Geodude de la Cámara (D08), regalo opcional que espera si se rechaza |

#### Villa Zaguán y Ruta 2 · etapa A · acceso: libre (Ruta 2 al sur del puente del arroyo: tras el P1, X35)

| Método | Nv. | Especies (%) | Nota |
|---|---|---|---|
| Hierba (día) | 5–8 · 6–10 | Pidove 20, Fletchling 15, Pawmi 15, Buneary 15, Wooloo 15, Silcoon 5, Cascoon 5, Abra 5, Ralts 5 | Zaguán y Explanada 5–8; Ruta 2 6–10 (X35) |
| Hierba (noche) | 5–8 · 6–10 | Nickit 20, Buneary 15, Wooloo 15, Pidove 10, Pawmi 10, Abra 10, Ralts 10, Silcoon 5, Cascoon 5 | ídem |
| Árbol de miel | 7–11 | Combee 30, Burmy 25, Cherubi 20, Aipom 19, Heracross 5, Munchlax 1 |  |
| Caña Vieja | 8–12 | Magikarp 70, Goldeen 30 |  |
| Nadar | 35–40 | Psyduck 60, Marill 40 | estanque; con Nadar (etapa F) |

#### Ciudad Caudal (canales) · etapa A · acceso: tras el P1 (puente de la Ruta 2, X35)

| Método | Nv. | Especies (%) | Nota |
|---|---|---|---|
| Caña Vieja | 8–13 | Magikarp 60, Goldeen 25, Barboach 15 |  |
| Nadar | 35–40 | Buizel 50, Psyduck 30, Marill 20 | con Nadar (etapa F) |

#### Ruta 3 y Garganta del Albo · etapa B · acceso: Correr

| Método | Nv. | Especies (%) | Nota |
|---|---|---|---|
| Hierba (día) | 11–16 | Buizel 20, Wooper 20, Psyduck 15, Yanma 15, Azurill 13, Starly 10, Staravia 5, Riolu 2 |  |
| Hierba (noche) | 11–16 | Kricketune 20, Murkrow 20, Wooper 20, Psyduck 15, Azurill 10, Yanma 10, Riolu 5 |  |
| Cueva / ruina | 12–16 | Zubat 35, Geodude 30, Machop 20, Tinkatink 15 | grutas de la Garganta |
| Caña Vieja | 11–14 | Magikarp 50, Barboach 50 |  |
| Buceo | 45–50 | Barboach 60, Whiscash 40 | Pozo del Albo (etapa G) |

#### Pilar de la Corriente (Escalera de Estanques) · etapa B · acceso: Correr

| Método | Nv. | Especies (%) | Nota |
|---|---|---|---|
| Cueva / ruina | 13–18 | Wooper 30, Marill 25, Shellos 20, Psyduck 20, Golbat 5 | Shellos forma Mar Oeste |

#### Ruta 4 · etapa C · acceso: vado abierto al restaurar P2

| Método | Nv. | Especies (%) | Nota |
|---|---|---|---|
| Hierba | 16–22 | Ponyta 20, Glameow 20, Mudbray 17, Stunky 15, Pachirisu 15, Luxio 5, Shinx 5, Lickitung 3 |  |
| Hierba agitada | 20 | Audino 100 |  |
| Árbol de miel | 18–22 | Combee 30, Heracross 30, Burmy 20, Aipom 19, Munchlax 1 |  |
| Caña Vieja | 16–20 | Goldeen 60, Magikarp 40 |  |
| Caña Buena | 25–30 | Seaking 40, Goldeen 40, Barboach 20 |  |

#### Villa Brontia, Ruta 5 y Meseta del Impulso · etapa C · acceso: Ruta 4 (tras P2); Ruta 5 con Embestida

| Método | Nv. | Especies (%) | Nota |
|---|---|---|---|
| Hierba (día) | 20–26 | Emolga 15, Pawmo 15, Swablu 15, Dedenne 12, Drifloon 10, Togedemaru 10, Girafarig 10, Dubwool 5, Wooloo 5, Elekid 3 | Drifloon junto al Parque Eólico |
| Hierba (noche) | 20–26 | Noctowl 20, Murkrow 15, Emolga 15, Dedenne 15, Girafarig 10, Swablu 10, Togedemaru 10, Elekid 5 |  |
| Visible fijo | 24 | Cyclizar | en la Meseta (y montura de Abril) |

#### Pilar del Impulso (Galerías del Soplo) · etapa C · acceso: Embestida

| Método | Nv. | Especies (%) | Nota |
|---|---|---|---|
| Cueva / ruina | 23–27 | Magnemite 30, Noibat 25, Drifloon 20, Pikachu 15, Pichu 10 |  |

#### Ruta 6 y Cantería Solano · etapa D · acceso: vendavales retirados al restaurar P3

| Método | Nv. | Especies (%) | Nota |
|---|---|---|---|
| Hierba (día) | 24–29 | Gligar 20, Timburr 20, Rhyhorn 15, Meditite 15, Nosepass 12, Machoke 10, Bombirdier 5, Absol 3 |  |
| Hierba (noche) | 24–29 | Houndour 25, Gligar 15, Rhyhorn 15, Meditite 15, Timburr 15, Nosepass 12, Absol 3 |  |
| Cueva / ruina | 25–29 | Graveler 30, Nacli 25, Tinkatink 25, Onix 20 | galerías de la Cantería |

#### Ciudad Estrato y Mina Galena · etapa D · acceso: Ruta 6

| Método | Nv. | Especies (%) | Nota |
|---|---|---|---|
| Cueva / ruina | 27–33 | Gurdurr 25, Naclstack 25, Tinkatuff 20, Carbink 15, Sableye 15 |  |
| Cueva / ruina | 30–35 | Carbink 30, Sableye 25, Onix 25, Graveler 15, Duraludon 5 | galería honda (tras P4) |
| Evento / regalo | 25 | Cranidos, Shieldon | Fósil Cráneo y Fósil Coraza (Fermín, tras P4); se reviven en el Museo de Lúmina (tras T06) |

#### Dunas de Ceniza · etapa D · acceso: Terreno complicado

| Método | Nv. | Especies (%) | Nota |
|---|---|---|---|
| Hierba | 28–34 | Hippopotas 30, Skorupi 25, Darumaka 25, Sigilyph 20 | arena profunda; Sigilyph junto a las ruinas |
| Cueva / ruina | 30–34 | Graveler 35, Hippopotas 29, Nosepass 20, Carbink 10, Gible 5, Gabite 1 | Cueva de las Dunas |

#### Pilar de la Masa (Cámara de los Contrapesos) · etapa D · acceso: Terreno complicado

| Método | Nv. | Especies (%) | Nota |
|---|---|---|---|
| Cueva / ruina | 30–34 | Graveler 25, Onix 20, Nosepass 20, Naclstack 15, Bronzor 12, Carbink 8 |  |

#### Ruta 7 · etapa D · acceso: Paso del Derrumbe despejado tras P4

| Método | Nv. | Especies (%) | Nota |
|---|---|---|---|
| Hierba (día) | 30–35 | Herdier 20, Glameow 15, Staravia 15, Ponyta 15, Stufful 10, Cutiefly 10, Skuntank 5, Abra 4, Scyther 3, Mudsdale 3 |  |
| Hierba (noche) | 30–35 | Hoothoot 20, Herdier 20, Glameow 15, Stunky 15, Skuntank 10, Stufful 10, Abra 5, Scyther 5 |  |
| Hierba agitada | 33 | Audino 100 |  |

#### Ciudad Lúmina (Parque de las Eras) · etapa D · acceso: Ruta 7

| Método | Nv. | Especies (%) | Nota |
|---|---|---|---|
| Hierba (día) | 30–35 | Mime Jr. 35, Ralts 35, Pichu 30 |  |
| Hierba (noche) | 30–35 | Munna 50, Ralts 25, Mime Jr. 25 |  |
| Evento / regalo | 5–20 | Eevee, Rotom, Milcery | Eevee (Rosalía, tras T06), Rotom (tienda de trastos, de noche), Milcery (pastelería) |

#### Ruta 14 y Reserva del Delta · etapa D · acceso: Lúmina; Reserva interior tras T07

| Método | Nv. | Especies (%) | Nota |
|---|---|---|---|
| Hierba | 32–38 | Tangela 12, Chatot 12, Tropius 10, Carnivine 10, Scyther 8, Girafarig 8, Yanma 8, Oricorio 8, Comfey 8, Stufful 6, Flamigo 5, Ribombee 2, Happiny 2, Chansey 1 | Oricorio: estilo según el néctar de la zona |
| Visible fijo | 34 | Applin | huerto de la Reserva |
| Árbol de miel | 32–36 | Combee 30, Burmy 25, Aipom 25, Cherubi 18, Munchlax 2 |  |
| Nadar | 35–40 | Wooper 60, Quagsire 20, Psyduck 20 | laguna (etapa F) |
| Caña Buena | 30–36 | Barboach 60, Goldeen 40 |  |

#### Ruta 8, Marisma Turbia y Palafitos · etapa D · acceso: Terreno complicado

| Método | Nv. | Especies (%) | Nota |
|---|---|---|---|
| Hierba | 33–38 | Croagunk 20, Skorupi 15, Wooper (Paldea) 15, Venipede 15, Toedscool 15, Carnivine 10, Stunky 5, Whirlipede 5 |  |
| Hierba (con lluvia) | 33–38 | Goomy 15 | sustituye a Skorupi mientras llueve (tabla parcial) |
| Nadar | 35–40 | Shellos 60, Wooper 40 | aguas hondas (etapa F) |
| Caña Buena | 33–38 | Barboach 70, Goldeen 25, Whiscash 5 |  |

#### Aldea Mnemos · etapa D · acceso: Terreno complicado (por la Marisma)

| Método | Nv. | Especies (%) | Nota |
|---|---|---|---|
| Hierba (día) | 35–40 | Pancham 30, Chingling 25, Bronzor 25, Honedge 20 | Honedge junto al Santuario de los Glifos |
| Hierba (noche) | 35–40 | Munna 25, Misdreavus 25, Duskull 25, Gastly 25 |  |
| Árbol de miel | 35–38 | Cherubi 60, Combee 40 |  |
| Evento / regalo | 35–40 | Sinistea, Spiritomb | Sinistea (casa de té); Spiritomb (Losa del Olvido, de noche, con la Piedra Espíritu `ODDKEYSTONE` que da Olvido tras P5) |

#### Pilar de la Memoria (Archivo Hondo) · etapa D · acceso: Terreno complicado

| Método | Nv. | Especies (%) | Nota |
|---|---|---|---|
| Cueva / ruina | 36–41 | Unown 30, Haunter 25, Elgyem 25, Chimecho 17, Bronzong 3 | Unown en todas sus formas |

#### Ruta 9 y Bosque Neblino · etapa E · acceso: niebla disipada tras P5

| Método | Nv. | Especies (%) | Nota |
|---|---|---|---|
| Hierba (día) | 37–43 | Hatenna 20, Ponyta (Galar) 20, Toedscool 15, Venipede 15, Applin 12, Hattrem 5, Thievul 5, Cutiefly 5, Mimikyu 3 |  |
| Hierba (noche) | 37–43 | Misdreavus 25, Noctowl 20, Thievul 20, Hatenna 15, Mimikyu 10, Gastly 8, Honchkrow 2 |  |

#### Ruta 10 (tramo alto) y Monte del Portal · etapa E · acceso: Trepar

| Método | Nv. | Especies (%) | Nota |
|---|---|---|---|
| Hierba (día) | 40–45 | Swablu 20, Bombirdier 15, Sneasel 15, Staravia 12, Medicham 10, Absol 10, Altaria 5, Riolu 5, Larvitar 5, Bagon 3 |  |
| Hierba (noche) | 40–45 | Clefairy 25, Sneasel 20, Absol 15, Noctowl 15, Cleffa 10, Swablu 10, Larvitar 5 |  |
| Cueva / ruina | 40–45 | Noibat 33, Machoke 32, Graveler 32, Druddigon 3 | paredes y grutas del Monte |

#### Pilar Invertido (Mundo Distorsión) · etapa E · acceso: Trepar

| Método | Nv. | Especies (%) | Nota |
|---|---|---|---|
| Cueva / ruina | 42–47 | Haunter 20, Dusclops 18, Sableye 17, Beheeyem 15, Drifblim 15, Golbat 10, Mismagius 3, Noivern 2 | solo fuera de las salas de puzzle |

#### Mar del Sur (superficie), costas y Ruta 15 · etapa F · acceso: Nadar; costa y muelles desde P4

| Método | Nv. | Especies (%) | Nota |
|---|---|---|---|
| Nadar | 42–50 | Tentacool 20, Wingull 15, Pelipper 10, Mantyke 10, Finneon 10, Frillish 10, Tentacruel 10, Bruxish 5, Shellos (Mar Este) 5, Mantine 5 |  |
| Caña Buena | 30–40 | Remoraid 30, Clauncher 30, Wishiwashi 20, Corsola 20 | desde los muelles de Nexo y Caleta Sonda (tras P4) |
| Supercaña | 40–46 | Gyarados 25, Lumineon 25, Octillery 20, Clawitzer 20, Dondozo 5, Tatsugiri 5 | desde los muelles con la Supercaña del B09 (X35; antes 45–50) |
| Hierba | 30–38 | Pyukumuku 40, Flamigo 30, Wingull 30 | playas de la Ruta 15 y del Delta (tras P4) |
| Visible fijo | 32–45 | Binacle 97, Barbaracle 3 | rocas de la costa |

#### Estación Talasa · etapa F · acceso: Nadar

| Método | Nv. | Especies (%) | Nota |
|---|---|---|---|
| Cueva / ruina | 45–50 | Solosis 40, Magnemite 35, Magneton 20, Duosion 5 | invernadero y cubiertas |
| Evento / regalo | 40 | Porygon | regalo de Nilo |

#### Volcán Tizón (con el caserío de la forja) · etapa F · acceso: Nadar

| Método | Nv. | Especies (%) | Nota |
|---|---|---|---|
| Hierba | 45–50 | Fletchinder 60, Houndour 25, Ponyta 12, Talonflame 3 | ladera |
| Cueva / ruina | 45–50 | Magby 25, Houndour 25, Darumaka 22, Magmar 20, Houndoom 5, Larvesta 3 | Cueva Volcán |

#### Islote Lumbre · etapa F · acceso: Nadar

| Método | Nv. | Especies (%) | Nota |
|---|---|---|---|
| Hierba (día) | 45–50 | Comfey 30, Cutiefly 25, Swirlix 25, Ribombee 20 |  |
| Hierba (noche) | 45–50 | Clefairy 50, Cleffa 20, Swirlix 15, Comfey 15 |  |

#### Fondo del Mar del Sur · etapa G · acceso: Buceo

| Método | Nv. | Especies (%) | Nota |
|---|---|---|---|
| Buceo | 48–54 | Chinchou 20, Clamperl 15, Skrelp 12, Relicanth 10, Corsola 8, Wishiwashi 8, Remoraid 7, Tatsugiri 5, Lanturn 5, Jellicent 5, Dondozo 3, Dragalge 2 | fauna exclusiva de Buceo |

#### Arrecife del Eco y Pilar de los Ecos (Ruinas de Antea) · etapa G · acceso: Buceo

| Método | Nv. | Especies (%) | Nota |
|---|---|---|---|
| Buceo | 50–55 | Relicanth 40, Lanturn 30, Corsola 30 | capa presente |
| Capa de eco | 50–55 | Cranidos 25, Shieldon 25, Corsola (Galar) 25, Dreepy 22, Drakloak 3 | Antea seca y era primigenia; sin Paradojas |
| Visible fijo | 58 | Bramaluna | Bramaluna Alfa real en la Fosa del Eco, tras P7 (ratio 10; reaparece al descansar) |

#### Ruta 11 y Paso del Norte · etapa H · acceso: hielo-eco retirado tras P7

| Método | Nv. | Especies (%) | Nota |
|---|---|---|---|
| Hierba | 50–55 | Snover 20, Cubchoo 20, Sneasel 15, Swinub 15, Bergmite 12, Absol 8, Piloswine 5, Staraptor 3, Frigibax 2 |  |

#### Ruta 13, Villa Boreal y Mar Boreal · etapa H · acceso: Terreno (nieve); mar con Nadar

| Método | Nv. | Especies (%) | Nota |
|---|---|---|---|
| Hierba (día) | 52–57 | Snorunt 30, Smoochum 25, Snover 20, Cubchoo 15, Abomasnow 5, Beartic 5 |  |
| Hierba (noche) | 52–57 | Snorunt 30, Sneasel 25, Cubchoo 20, Smoochum 15, Beartic 8, Weavile 2 |  |
| Nadar | 52–57 | Wingull 50, Frillish 30, Pelipper 20 | Mar Boreal |
| Buceo | 52–57 | Clamperl 60, Relicanth 40 | Mar Boreal |

#### Gruta Escarcha · etapa H · acceso: tras P7

| Método | Nv. | Especies (%) | Nota |
|---|---|---|---|
| Cueva / ruina | 53–58 | Snorunt 25, Bergmite 20, Frigibax 15, Swinub 15, Golbat 11, Glalie 5, Avalugg 3, Arctibax 3, Jynx 3 | de día |
| Cueva / ruina | 53–58 | Snorunt 25, Bergmite 20, Frigibax 15, Swinub 15, Golbat 11, Glalie 5, Avalugg 3, Arctibax 3, Froslass 3 | de noche (Froslass sustituye a Jynx) |

#### Lagos del Alma · etapa H · acceso: Nadar

| Método | Nv. | Especies (%) | Nota |
|---|---|---|---|
| Hierba | 55–60 | Azumarill 25, Quagsire 25, Kirlia 25, Chimecho 22, Yanmega 3 |  |
| Nadar | 55–60 | Whiscash 40, Azumarill 30, Quagsire 30 |  |
| Supercaña | 55–60 | Magikarp 60, Goldeen 20, Whiscash 14, Dratini 5, Dragonair 1 | Lago del Sentir |
| Caña Buena | 20–25 | Feebas 100 | 6 casillas especiales del Lago del Sentir (cambian cada día de juego) |

#### Pilar del Alma (Santuario) · etapa H · acceso: Nadar

| Método | Nv. | Especies (%) | Nota |
|---|---|---|---|
| Cueva / ruina | 55–60 | Bronzong 35, Hattrem 31, Beheeyem 30, Gardevoir 2, Gallade 2 |  |

#### Mesa de los Vientos · etapa Completa · acceso: Vuelo (T14)

| Método | Nv. | Especies (%) | Nota |
|---|---|---|---|
| Hierba | 58–62 | Altaria 30, Staraptor 25, Tropius 20, Noivern 12, Drifblim 10, Togetic 3 |  |

#### Calzada del Rey · etapa Completa · acceso: Reconstrucción (tras P9)

| Método | Nv. | Especies (%) | Nota |
|---|---|---|---|
| Cueva / ruina | 60–64 | Shelgon 30, Jangmo-o 30, Druddigon 20, Gabite 15, Hakamo-o 5 |  |
| Visible fijo | 64 | Salamence | Salamence Alfa (T15), captura opcional |

#### Sima del Eje · etapa Completa · acceso: Reconstrucción

| Método | Nv. | Especies (%) | Nota |
|---|---|---|---|
| Cueva / ruina | 60–65 | Deino 20, Beldum 20, Gible 20, Duraludon 15, Elgyem 15, Zweilous 5, Metang 5 |  |

#### Pilar del Origen (Senda del Origen) · etapa P10 · acceso: 9 Fragmentos + 15 Tablillas + Completa

| Método | Nv. | Especies (%) | Nota |
|---|---|---|---|
| Cueva / ruina | 62–68 | Unown 30, Bronzong 20, Dragonair 20, Hakamo-o 15, Metang 15 |  |

#### Ruinas de Talasa (postgame) · etapa Post · acceso: tras el final

| Método | Nv. | Especies (%) | Nota |
|---|---|---|---|
| Cueva / ruina | 65–70 | Ditto 50, Duosion 45, Porygon2 5 |  |

#### Grieta del Porvenir (postgame) · etapa Post · acceso: tras el final

| Método | Nv. | Especies (%) | Nota |
|---|---|---|---|
| Visible fijo | 70–72 | Ferrodada, Ferrosaco, Ferropalmas, Ferrocuello, Ferropolilla, Ferropúas, Ferropaladín | estáticos visibles con condición propia (CAMPANA.md, B22) |

**Alfas fijos de historia:** Vespiquen Alfa (T07, nv 36), Honchkrow Alfa (T10, nv 42), Bramaluna Alfa (P7 como eco no
capturable; real en la Fosa del Eco, nv 58), Salamence Alfa (T15, nv 64). Todos reaparecen al descansar hasta capturarse.

## 7.4 Regalos, eventos y objetos de progreso

| Qué | Quién / dónde | Bloque |
|---|---|---|
| Inicial elegido (Turtwig, Litten o Sobble) | Alerce, laboratorio | B01 |
| Inicial que nadie eligió | Alerce, en Caudal tras P2 | B04 |
| Huevo del inicial de Gael | Casa de Gael, epílogo | B21 |
| Geodude (nv 8, opcional) | Cámara del Umbral | B02 |
| Fósil Cráneo y Fósil Coraza | Fermín, tras P4 (se reviven en el Museo de Lúmina) | B08–B09 |
| Eevee · Milcery · Rotom | Rosalía (tras T06) · pastelería · tienda de trastos de noche | B09 |
| Huevo de Togepi | Mamá, jardín de Villa Alba | B11 |
| Porygon | Nilo, Estación Talasa | B13 |
| Sinistea · Spiritomb | Casa de té · Losa del Olvido con la Piedra Espíritu | B10 |
| Repartir Exp (`EXPSHARE`) | Lía, Centro de Zaguán | B03 |
| Caña Vieja · Caña Buena · Supercaña | Caudal · Nexo · Caleta Sonda | B03 · B09 · B09 |
| Cordón Unión (`LINKINGCORD`) | Grandes Almacenes de Lúmina | B09 |
| Amuleto Iris (`SHINYCHARM`) | Alerce, al registrar como capturadas las 346 especies generales del juego base | Postgame |

**Objetos de evolución.** Grandes Almacenes de Lúmina (tras P4): Piedra Fuego, Agua, Trueno, Hoja, Hielo y Lunar.
Mercado de minerales de Estrato (tras P4): Piedra Alba, Noche y Día. Piedra Oval: guardería de Lúmina. Objetos de
intercambio (Revestimiento Metálico, Protector, Electrizador, Magmatizador, Mejora, Disco Extraño, Tela Terrible, Escama
Bella, Diente y Escama Marinos, Dulce de Nata, Saquito Fragante): tiendas y objetos en el suelo desde B09. En los datos de
Añil casi todas las evoluciones por intercambio tienen además una alternativa por nivel (Kadabra, Machoke, Graveler,
Haunter y Gurdurr a nivel 45; Scyther nv 45; Rhydon, Electabuzz, Magmar y Porygon2 nv 50…) o por el Cordón Unión: todo
se completa en solitario.

## 7.5 Especies fuera de la campaña principal

| Especie o grupo | Cuándo | Dónde |
|---|---|---|
| Bramaluna (captura) | Tras P7 (campaña) | Fosa del Eco |
| Ditto | Postgame base | Ruinas de Talasa (resultado de los intentos de «reproducir» de Genesis) |
| 7 Paradojas de hierro | Postgame base | Grieta del Porvenir |
| Latias y Latios | Postgame base | Lago del Sentir / Mar del Sur |
| Legendarios del postgame base | Postgame base | CAMPANA.md B22 (Giratina, el no elegido, Arceus si no se capturó, trío del Alma, Trío de las Nubes, aves, bestias, Lugia, Ho-Oh, Kyogre, Groudon, Rayquaza, Regis y Regigigas, Heatran, Darkrai, Cresselia, Mewtwo, Marshadow) |
| Hoopa | DLC 1 | Almenara |
| 11 Ultraentes y el resto de legendarios/singulares | DLC 2 | CAMPANA.md B24 |

Durante la historia **no se capturan** Uxie, Mesprit, Azelf ni el Trío de las Nubes (sus reencuentros del postgame son
distintos de las pruebas); Dialga o Palkia elegido y Arceus se pueden capturar en la historia pero no es obligatorio.

## 7.6 Formas regionales y variantes

- **Necesarias para completar líneas:** Wooper de Paldea (→ Clodsire), Corsola de Galar (→ Cursola). Mr. Rime se obtiene
  de Mr. Mime normal con Piedra Alba (dato de Añil), así que Mr. Mime de Galar no es necesario.
- **Opcionales de color:** Ponyta de Galar (Neblino), Shellos Mar Este (Mar del Sur), estilos de Oricorio por néctar
  (Reserva, Brontia, Mnemos, Islote Lumbre), capas de Burmy por terreno, formas de Unown.
- **No distribuidas (evitan especies fuera de la Pokédex):** Sneasel de Hisui (→ Sneasler), Darumaka de Galar, Raichu de
  Alola, Mr. Mime de Galar. Pueden añadirse más adelante como variantes sin cambiar el recuento.

## 7.7 Megaevolución

- **Mega Aro** (`MEGARING`): B07, T04 (la Cantería Solano), jugador ~nivel 28: «suficientemente pronto» (biblia §11,
  §15). No hay Megas de iniciales.
- **Solo se distribuyen las 47 referencias de la lista del autor** (biblia §16.5).

**Juego base (29):**

| Megapiedra | ID | Dónde |
|---|---|---|
| Heracrossita | `HERACRONITE` | Ruta 4, hueco de árbol tras una roca agrietada (Embestida) |
| Raichuita X | `RAICHUITEX` | T03 |
| Absolita | `ABSOLITE` | Ruta 6, cornisa del cañón (Trepar, regreso) |
| Medichamita | `MEDICHAMITE` | T05 |
| Audinita | `AUDINITE` | Guardería de Lúmina, tras T06 |
| Scolipedita | `SCOLIPITE` | T07 |
| Galladita | `GALLADITE` | Parque de las Eras (Lúmina) |
| Gardevoirita | `GARDEVOIRITE` | Santuario de los Glifos (Mnemos), tras P5 |
| Steelixita | `STEELIXITE` | Galería honda de la Mina Galena, tras P4 |
| Garchompita | `GARCHOMPITE` | Cueva de las Dunas |
| Scizorita | `SCIZORITE` | Astillero de Nexo |
| Chimechita | `CHIMECHITE` | T09 |
| Lopunnita | `LOPUNNITE` | Bosque Neblino |
| Altarianita | `ALTARIANITE` | Ruta 10, tramo alto |
| Gengarita | `GENGARITEX` | Pilar Invertido (El Sumidero) |
| Lucarita | `LUCARIONITE` | Casilda, tras P6 |
| Gyaradosita | `GYARADOSITE` | Pescador de Caudal, con Nadar |
| Houndoomita | `HOUNDOOMINITE` | T12 |
| Clefablita | `CLEFABLITE` | T11 |
| Barbaraclita | `BARBARACITE` | Rocas de Caleta Sonda |
| Tatsugirita | `TATSUGIRINITE` | Fondo del Mar del Sur (sector este) |
| Glalita | `GLALITITE` | Gruta Escarcha |
| Baxcaliburita | `BAXCALIBRITE` | Gruta Escarcha, al fondo |
| Froslassita | `FROSLASSITE` | T13 |
| Abomasnowita | `ABOMASITE` | Ruta 13 |
| Tyranitarita | `TYRANITARITE` | Senda del Lazo, tramo bajo |
| Staraptorita | `STARAPTITE` | T14 |
| Salamencita | `SALAMENCITE` | T15 |
| Metagrossita | `METAGROSSITE` | Sima del Eje |

**Postgame base (14):** Alakazamita (`ALAKAZITE`, Ruinas de Talasa) · Raichuita Y (`RAICHUITEY`, subestación de
Brontia tras Zapdos) · Dragonitita (`DRAGONITITE`, Lago del Sentir) · Lucarita Z (`LUCARIONITEZ`) y Absolita Z
(`ABSOLITEZ`), premios del Bastión Axis · Latiasita y Latiosita (`LATIASITE`, `LATIOSITE`, tras sus encuentros) ·
Mewtwonita X e Y (`MEWTWONITEX`, `MEWTWONITEY`, Instalación Cierzo) · Heatranita (`HEATRANITE`, Forja de Tizón tras
Heatran) · Darkrainita (`DARKRANITE`, tras Darkrai) · Kyogre y Groudon Primigenios con el Prisma Azul y el Prisma Rojo
(`BLUEORB`, `REDORB`) · Mega Rayquaza con Ascenso Draco (`DRAGONASCENT`, se aprende en el Balcón del Cielo).

**DLC 2 (3):** Diancita (`DIANCITE`), Zeraoranita (`ZERAORITE`), Magearnita (`MAGEARNITE`). **DLC 1 (1):** Zygardita
(`ZYGARDITE`).

**Existen en los datos de Añil pero NO se distribuyen (PENDIENTE del autor):** Gengarita Y (`GENGARITEY`; la lista dice
«Mega Gengar» una vez), Garchompita Z (`GARCHOMPITEZ`), Inteleonita (`INTELEONITE`, rompería la paridad entre
iniciales) y el resto de megapiedras de Añil fuera de la lista (Machampita, Eeveeita, Snorlaxita, Pikachuita,
Hatterenita, Duraludonita, Flappletunita, Alcremita, Dragalgita, Sablenita, etc.).

## 7.8 Reconciliación del inventario (D28)

La Pokédex de Axis pasa de 412 a **425 entradas**:

| Bloque | Entradas |
|---|---|
| General | **346** = 336 + Ditto, Sableye, Chinchou, Lanturn, Relicanth, Clamperl, Huntail, Gorebyss, Skrelp, Dragalge |
| Paradojas | **8** = 7 de hierro + Bramaluna |
| Ultraentes | **11** |
| Legendarios y singulares | **60** = 58 + Latias y Latios |

| Especie | Decisión | Motivo canónico |
|---|---|---|
| `ROARINGMOON` | Se añade como única Paradoja del pasado | Bramaluna Alfa es la entidad dominante del P7 (biblia §6.7). No se añade ninguna otra Paradoja del pasado (§6.7, §16) |
| `DITTO` | General; postgame (Ruinas de Talasa) | Phione por crianza con Manaphy (biblia §12) y cría general; encaja con el «reproducir» de Genesis |
| `SABLEYE` | General; Mina Galena y Pilar Invertido | Misión de Diancie (biblia §12) |
| `LATIAS`, `LATIOS` | Legendarios del postgame base | Sus Megas están en la lista del autor (biblia §16.5) |
| `CHINCHOU`, `LANTURN`, `CLAMPERL`, `HUNTAIL`, `GOREBYSS`, `RELICANTH`, `DRAGALGE` | General; fauna de Buceo | Candidatos citados por la biblia §8 para dar especies exclusivas al mar |
| `SKRELP` | General | Necesario para que Dragalge tenga línea completa |

Manaphy y Phione siguen en el DLC 2. Las 7 Paradojas de hierro quedan en el postgame, **fuera** del Pilar de los Ecos.

## 7.9 Tasas y reglas de captura (D29)

- **Alfa:** 1 de cada 64 encuentros salvajes no legendarios (≈1,6%, por debajo del 3% orientativo de la biblia para que
  se sientan raros). Tamaño ×1,5 (visible en ambos modos: sprite mayor en modo visible, marca en el modo clásico), nivel
  +3 a +5 sobre la tabla, 3 IV al máximo y un movimiento huevo.
- **Variocolor:** 1/4096; 1/1365 con el Amuleto Iris. Un Alfa también puede ser variocolor. Sin variocolor en los
  encuentros de historia (Zygarde, Bramaluna eco, el elegido del P9, Arceus en el final); sí en los reencuentros del
  postgame.
- **Legendarios:** la condición de captura se explica en pantalla (en el botón Ball). Un intento bloqueado **no gasta**
  el objeto ni el turno. La Master Ball solo se puede usar cuando la captura está habilitada. Si un legendario se
  debilita, reaparece al descansar (Arceus: CAMPANA.md B21–B22).
- **Encuentros visibles:** misma tabla que el modo clásico; el destello variocolor y el tamaño Alfa se ven antes del
  combate.

## 7.10 Verificación y notas técnicas

- **Cobertura (script sobre `species.json` y el PBS crudo):** las **336 generales, las 11 añadidas y las 7 Paradojas**
  se obtienen por captura, regalo o evolución con los métodos de Añil. Resultado: **0 especies sin método**. Tablas con
  porcentajes que suman 100 (salvo las parciales marcadas). El script está en el scratchpad de la sesión
  (`dex_synth.js`); se recomienda moverlo a `tools/` como test de datos (`node --test`) junto con los invariantes de
  células de CAMPANA.md §2.5.
- **Evoluciones fuera de la Pokédex de Axis** que permiten los datos de Añil: Scyther + Piedra Noche → Kleavor; Eevee +
  Peluca Regia / Pluma Eólica → Royaleon / Cefireon. Decisión TÉCNICA: Peluca Regia y Pluma Eólica no se distribuyen;
  la Piedra Noche avisa antes de usarse en Scyther y Kleavor no cuenta para la Pokédex regional.
- **Conversor corregido:** `tools/extract_data.mjs` conserva los campos vacíos de `Evolutions` al trocear en
  tripletas; `Happiness` y `Trade` usan `null` como parámetro y los métodos siguientes conservan su posición.
- **Catálogo regional corregido (04-10-2026, e717e01):** el generador comparte `buildAxisDex` con
  `tools/axis_dex_source.mjs`; el JSON y la UI incluyen las 425 especies reconciliadas. Las entradas 1–412 conservan
  su número y las 13 incorporaciones ocupan 413–425. `tests/axis_dex.test.mjs` comprueba catálogo, generación y lista.
