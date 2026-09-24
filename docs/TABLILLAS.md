# Las Tablillas de Axis (sección 4 del diseño de campaña)

**Fecha:** 24-09-2026 · **Estado:** DECIDIDO-DEV (D11, D12, X11, X24), revisable por el autor.
**Canon aplicable (biblia §7, §10.8–10.9, §18):** las quince Tablillas son **obligatorias** y forman **arcos de la
historia principal** repartidos por Axis, no misiones secundarias ni la rutina «Pilar–Tabla–Pilar–Tabla»; dos o tres
pistas abiertas a la vez, interpretables y sin coordenadas; un museo con función jugable; las que exigen Vuelo o
Reconstrucción van después de P8; ninguna depende de DLC, co-op ni de capturas posteriores a Arceus; Arceus conserva
tres y no se inventa una «Tabla Normal».
**Documentos hermanos:** `docs/CAMPANA.md` (bloques B02–B21), `docs/POKEDEX_DISTRIBUCION.md` (megapiedras de premio).

---

## 4.1 Identidad del conjunto (D12)

- Las **18 Tablillas son las 17 tablas de tipo de Essentials más la Tabla Legendaria** (`LEGENDPLATE`). El tipo Normal
  no tiene tabla. **`BLANKPLATE` («Tabla Normal» en los datos de Añil) se retira del reparto de Axis** (no aparece en
  ninguna tienda, suelo ni evento).
- **Arceus conserva tres**, que corresponden a sus fases en orden fijo (VIGENTE): **Terrax** (`EARTHPLATE`, fase
  Tierra), **Terror** (`SPOOKYPLATE`, fase Fantasma) y **Legendaria** (`LEGENDPLATE`, fase Normal: Arceus combate sin
  tabla, en su forma propia; la Legendaria no se equipa y la suelta al final).
- En combate, las 15 de campaña funcionan como los objetos del PBS: potencian su tipo equipadas. No hay fase Hada.

| Arco | Tabla | ID | Crónica | Lugar | Bloque |
|---|---|---|---|---|---|
| T01 | Tabla Pradal | `MEADOWPLATE` | I | Villa Zaguán, Arboleda de los Nombres | B03 |
| T02 | Tabla Linfa | `SPLASHPLATE` | II | Ciudad Caudal, Molino del Diezmo | B05 |
| T03 | Tabla Trueno | `ZAPPLATE` | III | Villa Brontia, campanario y subestación | B05 |
| T04 | Tabla Pétrea | `STONEPLATE` | IV | Ruta 6, Cantería Solano | B07 |
| T05 | Tabla Fuerte | `FISTPLATE` | V | Ciudad Estrato, Losa del Pulso | B09 |
| T06 | Tabla Acero | `IRONPLATE` | VI | Ciudad Lúmina, Museo de las Eras | B09 |
| T07 | Tabla Bicho | `INSECTPLATE` | VII | Reserva del Delta | B09 |
| T08 | Tabla Tóxica | `TOXICPLATE` | VIII | Ruta 8, Marisma Turbia | B09 |
| T09 | Tabla Mental | `MINDPLATE` | IX | Aldea Mnemos | B11 |
| T10 | Tabla Oscura | `DREADPLATE` | X | Bosque Neblino y Ruta 10 | B11 |
| T11 | Tabla Duende | `PIXIEPLATE` | XI | Islote Lumbre | B13 |
| T12 | Tabla Llama | `FLAMEPLATE` | XII | Volcán Tizón | B13 |
| T13 | Tabla Helada | `ICICLEPLATE` | XIII | Villa Boreal | B15 |
| T14 | Tabla Cielo | `SKYPLATE` | XIV | Ciudad Nexo → Mesa de los Vientos | B17 |
| T15 | Tabla Draco | `DRACOPLATE` | XV | Calzada del Rey (Sima del Eje) | B19 |
| — | Tabla Terrax | `EARTHPLATE` | — | Arceus (fase Tierra) | B21 |
| — | Tabla Terror | `SPOOKYPLATE` | — | Arceus (fase Fantasma) | B21 |
| — | Tabla Legendaria | `LEGENDPLATE` | — | Arceus (fase Normal) | B21 |

## 4.2 Libreta de pistas (X24)

Objeto clave `CLUENOTEBOOK` (ya definido en `game/data/items_axis.json`). Era de la madre de Casilda, que la entrega
tras el P1. Tiene cinco pestañas: **Pistas**, **Crónica** (textos de las Tablillas), **Profecía** (versos), **Diario**
(hechos del viaje) y **Células** (recuento por mapa).

- **Pistas activas:** como máximo **3**. Las demás esperan **en cola** y la siguiente se activa en cuanto quedan menos
  de 3; mientras queden Tablillas por descubrir, los hitos garantizan **al menos 2 activas** (injerto «progresión»).
- **Estados de cada pista:** *inicial* (vaga) → *segunda* (acotada tras hablar con alguien o visitar un sitio; añade un
  **anillo de zona** en el mapa regional, nunca una casilla) → *resuelta*.
- Si hace falta una capacidad que el jugador no tiene, la pista lo dice con una frase de Zygarde («Allí no llego
  todavía»; «Necesito cruzar agua profunda»): anticipación sin bloqueo.
- **Descubrimiento directo:** si el jugador llega al lugar de una Tablilla sin la pista activa, el arco empieza igual y
  la pista se añade aunque se supere el límite de 3.
- En el Museo de las Eras, la **Sala de las Crónicas** (abre tras T06) añade un panel por cada Tablilla conseguida;
  Rosalía la lee en voz alta.

## 4.3 La Crónica: historia antigua de Axis (X11, DECIDIDO-DEV)

Los Custodios grabaron su historia en las tablas que Arceus soltó al dormirse, el único material que no se destruye, y
después las escondieron. Son **hechos internos**, pero, como toda inscripción (biblia §3), pueden contener
interpretaciones: los personajes discuten algunas.

| Nº | Tablilla | Texto |
|---|---|---|
| I | Pradal | «Nadie recuerda quién alzó los diez Pilares. Cuando llegamos ya sostenían el cielo, y la hierba crecía a su alrededor como si los conociera.» |
| II | Linfa | «Una mujer tocaba una flauta azul. Cuando el mar se tragó los valles, tocó en lo alto; el que duerme abrió los ojos y el agua volvió a su sitio.» (la **Tañedora**) |
| III | Trueno | «Tras aquella noche aprendimos a escuchar: el rayo, el agua y la piedra respondían a los Pilares.» |
| IV | Pétrea | «Levantamos casas junto a ellos y los llamamos por lo que hacían: Umbral, Corriente, Impulso, Masa, Memoria. Los otros cinco no se dejaron nombrar tan fácilmente.» |
| V | Fuerte | «En Antea, la ciudad de antes, nació un rey fuerte y justo al principio, que quiso que el Eje le obedeciera como sus soldados.» |
| VI | Acero | «El rey forjó una corona que imitaba el sonido de la flauta. Los Pilares no le respondieron. Entonces robó la flauta verdadera.» |
| VII | Bicho | «Cuando el rey marchó hacia el centro, los enjambres huyeron al sur. Los pequeños saben antes que nadie cuándo va a cambiar la tierra.» |
| VIII | Tóxica | «El día en que tocó, el agua de los lagos se volvió amarga.» |
| IX | Mental | «El que duerme despertó y lo miró, y no le dio nada. Esa misma noche la tierra se abrió bajo el Puente: Antea se hundió en el mar y el valle se volvió abismo. Unos dijeron que fue su mano; otros, que fue la corona al romperse. Lo escribimos para no olvidarlo.» |
| X | Oscura | «Después el Creador se desprendió de sus tablas, una por cada forma del mundo, y se durmió. Guardó tres: lo que sostiene, lo que acecha y lo que es.» |
| XI | Duende | «Rompimos la flauta en diez y dimos una pieza a cada Pilar, porque cada Pilar sabe guardar lo suyo. Y pedimos a los tres de las nubes que se interpusieran si alguien volvía a llamar.» |
| XII | Llama | «Las fraguas del rey se apagaron. Con su hierro hicimos cerrojos, no espadas.» |
| XIII | Helada | «Vino un invierno largo. Los que se quedaron grabaron en estas tablas el camino al fondo del abismo, para que solo quien las reuniera todas pudiera bajar.» |
| XIV | Cielo | «Antes de cerrar los ojos, el que duerme nos mostró lo que vendría, y lo escribimos en los Pilares: cuando el que guarda el orden caiga en cien y cinco pedazos…» |
| XV | Draco | «El rey no murió en el abismo. Vivió muchos años sin corona, cuidando el puente que había roto. Sus últimas palabras fueron: el Eje no elige reyes; elige a quien camina.» |
| — | Terrax | «Lo que sostiene.» |
| — | Terror | «Lo que acecha.» |
| — | Legendaria | «Lo que es.» |

**Lectura temática.** La corona del Rey es el antecedente del Resonador Sintético de Genesis (P9 repite su error); la
Crónica IX deja **ambiguo** si fue Arceus o la corona rota quien abrió la Sima (no se fija un Arceus que castiga,
biblia §10.8); el Rey que acaba cuidando el puente deja abierto el futuro de Gael. La Crónica XI explica al Trío de las
Nubes y la XIII justifica que el P10 exija las quince.

## 4.4 Apertura de pistas y disponibilidad

| Arco | La pista inicial se abre en | Capacidad mínima | Disponible desde | Etapa de células |
|---|---|---|---|---|
| T01 | B02: calco dentro de la Libreta (la madre de Casilda tradujo la inscripción del P1) | ninguna | tras P1 | A |
| T02 | B03: el molinero Anselmo, en Caudal | Correr y P2 restaurado | tras P2 | B/C |
| T03 | B04: inscripción del núcleo del P2 y el campanero Sixto | Embestida | tras P2 | C |
| T04 | B06: inscripción del núcleo del P3 | Embestida y Correr | tras P3 | C/D |
| T05 | B08: inscripción del núcleo del P4 | ninguna nueva | tras P4 | D |
| T06 | B09: Rosalía, en la gala | ninguna | tras P4 | D |
| T07 | B09: el guardabosques Iván, en el Centro de Lúmina | ninguna | tras P4 | D |
| T08 | B09: Rosalía, tras T06 (inventario de 1962) | Terreno | tras P4 | D |
| T09 | B10: inscripción del núcleo del P5 | Terreno | tras P5 | E |
| T10 | B11: Nilo, encuentro nocturno en el Neblino | Trepar | tras P5 | E |
| T11 | B09: el farero Ramón, en Caleta Sonda (en cola hasta tener Nadar) | Nadar | tras P6 | F |
| T12 | B09: el mercado de Nexo (en cola hasta tener Nadar) | Nadar | tras P6 | F |
| T13 | B14: inscripción del núcleo del P7 | Embestida | tras P7 | H |
| T14 | B16: Don Evaristo, en Correos de Nexo (tras P8) | Vuelo | tras P8 | Completa |
| T15 | B18: inscripción del núcleo del P9 | Reconstrucción | tras P9 | Completa |

**No hay umbrales de Tablillas por Pilar.** El Mural del P5 se resuelve sin ninguna; los Pilares 1–9 no las piden. Solo
la Puerta de las Quince (P10) exige las quince (Crónica XIII). Así el ritmo alterna episodios de 1–4 Tablillas entre
Pilares sin convertirse en rutina (biblia §7). T01–T13 se completan antes de la Forma Completa; T14 (Vuelo) y T15
(Reconstrucción) son posteriores a P8 como exige la biblia.

## 4.5 Fichas T01–T15 (D11)

Formato: pista inicial · segunda pista · estado del mundo · capacidad mínima · problema · puzzle o confrontación ·
consecuencia · reintento. Ningún arco tiene estado de fallo permanente.

**T01 · Tabla Pradal: «La Arboleda de los Nombres»** · Villa Zaguán · Crónica I
- **Pista inicial** (calco de la Libreta): «Donde cada nombre echa raíz, la hierba guarda la primera tabla.»
- **Segunda pista** (el jardinero): el Árbol del Fundador se seca desde la raíz y la hierba muerta forma una espiral.
- **Estado del mundo:** fase 0, temblores. El árbol se inclina sobre la escuela.
- **Capacidad mínima:** ninguna.
- **Problema:** el consejo quiere talarlo. **Mirta** (9 años), cuyo árbol de nombre está al lado, se ata a él con una
  cuerda.
- **Puzzle:** subir al campanario, la única vista cenital, y ver que el centro de la espiral está 6 casillas más allá,
  bajo un banco de piedra. El latido del Core confirma el sitio. Se excava y aparece la Tablilla, que robaba el agua a
  las raíces.
- **Consecuencia:** el árbol se recupera y no se tala. Mirta regala una Semilla Milagro.
- **Reintento:** no hay estado de fallo.

**T02 · Tabla Linfa: «El Molino del Diezmo»** · Ciudad Caudal · Crónica II
- **Pista inicial** (Anselmo): «La muela del Diezmo pesa como un río.»
- **Segunda pista** (inscripción junto al verso II): «La segunda tabla gira donde el agua trabaja.»
- **Estado del mundo:** tras P2 todos los molinos giran menos el del Diezmo, que gira al revés.
- **Capacidad mínima:** Correr (canal alto) y P2 restaurado.
- **Problema:** el gremio quiere derribar el molino. **Anselmo** (70) se niega. Su hijo **Darío** trabaja para el
  Consorcio, que ha ofrecido comprarlo «para estudios hidráulicos».
- **Puzzle:** tres engranajes repartidos por el molino; hay que colocarlos y girarlos para que la rueda mueva la muela
  en el sentido correcto. El eje se abre y deja ver la Tablilla. Llegan técnicos del Consorcio a «tomar muestras»:
  combate (nivel 18–20).
- **Consecuencia:** el Diezmo muele de nuevo. Darío deja el Consorcio y avisa del Parque Eólico (anticipa el P3).
- **Reintento:** tras una derrota se vuelve a la puerta del molino.

**T03 · Tabla Trueno: «La campana que llama al rayo»** · Villa Brontia · Crónica III
- **Pista inicial** (inscripción del P2 y el campanero **Sixto**, 80): «Cada noche cae un rayo en el campanario, sin
  tormenta.»
- **Segunda pista** (Abril, aburrida): «Aquí ya ni se asustan. Cae siempre en la campana grande.»
- **Estado del mundo:** fase 0–1, apagón.
- **Capacidad mínima:** Embestida (escalera derrumbada).
- **Problema:** Sixto cree que es un castigo y el pueblo quiere derribar la torre.
- **Puzzle:** en la subestación, reconectar los cables: un circuito de interruptores con un solo camino válido, para
  desviar el rayo de la torre a la red. De noche el rayo carga la subestación y la campana suelta la Tablilla. Aparece
  una horda de Elekid.
- **Consecuencia:** Brontia recupera la luz a medias antes de P3; Sixto vuelve a tocar la campana. Recompensa:
  **Raichuita X**.
- **Reintento:** interruptores reiniciables.

**T04 · Tabla Pétrea: «La cantera cerrada»** · Ruta 6, Cantería Solano · Crónica IV · *en el camino principal*
- **Pista inicial** (inscripción del P3): «La cuarta tabla duerme entre capas de piedra.»
- **Segunda pista** (**Bea Solano**): su hermano **Quino** y la cuadrilla de Timburr han quedado atrapados.
- **Estado del mundo:** fase 1. Voladuras del Consorcio.
- **Capacidad mínima:** Embestida y Correr.
- **Problema:** un rescate. Garrido se niega a parar las voladuras y se retira cuando los canteros le señalan.
- **Puzzle:** Alerce enseña la regla por la Pokédex: «Nunca rompas la capa que sostiene a otra.» Las rocas tienen
  colores según su estrato y hay que romperlas con Embestida de arriba abajo. Si se rompe en mal orden hay un pequeño
  derrumbe y la sala se reinicia. En el último estrato aparecen la Tablilla y una veta de piedra activadora.
- **Consecuencia:** se rescata a la cuadrilla, se despeja la Ruta 6 y los canteros denuncian en público al Consorcio.
  Bea monta la piedra en un anillo («al que saca a alguien de la roca le damos un anillo de la roca») y Alerce la
  identifica: **Mega Aro** (`MEGARING`).
- **Reintento:** reinicio de la sala.

**T05 · Tabla Fuerte: «El Pulso de Estrato»** · Ciudad Estrato · Crónica V
- **Pista inicial** (inscripción del P4): «La quinta tabla se gana con las manos.»
- **Segunda pista** (Fermín): la **Losa del Pulso** de la plaza, sobre la que se echan pulsos desde hace siglos.
- **Estado del mundo:** tras P4, el pueblo decide si se queda o se va.
- **Capacidad mínima:** ninguna nueva.
- **Problema:** la **Maestra Herminia** (70), de la Escuela del Pico, quiere recuperar el torneo para retener a los
  jóvenes. Esa noche, restos del Consorcio intentan llevarse la Losa.
- **Confrontación:** torneo de tres combates contra mineros (nivel 33–34). La final es contra **Sol Galena** (Pangoro 34,
  Gurdurr 34, Tinkatuff 35). De noche, defensa de la Losa en un combate doble con Sol contra dos técnicos. Al tocar la
  Losa, Zygarde revela que es una Tablilla.
- **Consecuencia:** el torneo vuelve a celebrarse cada semana (revanchas). Recompensa: **Medichamita**.
- **Reintento:** el torneo se puede repetir.

**T06 · Tabla Acero: el Museo de las Eras** · Ciudad Lúmina · Crónica VI → ver §4.6.

**T07 · Tabla Bicho: «La colmena de la Reserva»** · Reserva del Delta · Crónica VII
- **Pista inicial** (el guardabosques **Iván**, en el Centro de Lúmina): la Reserva está cerrada por un enjambre.
- **Segunda pista:** la colmena gigante se ha construido alrededor de «una losa que zumba».
- **Estado del mundo:** fase 1. Los enjambres migran fuera de temporada.
- **Capacidad mínima:** ninguna (la laguna es opcional).
- **Problema:** hay que evacuar a los visitantes. Iván quiere quemar la colmena.
- **Puzzle:** seguir a los Cutiefly y Ribombee que llevan polen de tres flores, cada una de un bioma de la Reserva, y
  colocar las tres ante la colmena para que salga la reina. Combate contra **Vespiquen Alfa (nivel 36)**, captura
  opcional.
- **Consecuencia:** la colmena se traslada y la Reserva reabre con todos sus encuentros. Recompensa: **Scolipedita**.
- **Reintento:** el Alfa reaparece al descansar.

**T08 · Tabla Tóxica: «La laguna que fue clara»** · Ruta 8, Marisma Turbia · Crónica VIII
- **Pista inicial** (Rosalía, tras T06): «El inventario de 1962 cita una tabla amarga en la antigua Laguna Clara.»
- **Segunda pista** (**Doña Remedios**, curandera de los Palafitos): los Pokémon enferman cerca de las bombas del
  Consorcio.
- **Estado del mundo:** fase 1. Las bombas de Genesis remueven el lodo tóxico en busca de «biomarcadores celulares».
- **Capacidad mínima:** Terreno complicado.
- **Problema:** los jóvenes quieren abandonar los Palafitos. **Alerce acude en persona** e insiste en analizar él mismo
  el agua.
- **Puzzle:** triangular el origen con la Pokédex midiendo la concentración en 6 puntos (lecturas de más o menos). Hay
  que apagar tres bombas (combates contra técnicos); la Tablilla aparece bajo el lodo más denso.
- **Consecuencia:** la marisma empieza a sanar. Remedios, mirando el instrumental: «Hace dieciséis años vinieron unos
  señores a medir la laguna, con aparatos como ese.» Alerce: «Son aparatos corrientes.»
- **Reintento:** las mediciones se pueden repetir.

**T09 · Tabla Mental: «El niño que recuerda»** · Aldea Mnemos · Crónica IX
- **Pista inicial** (inscripción del P5): «La novena tabla sueña en voz ajena.»
- **Segunda pista:** **Íker** (8 años) recuerda cosas que nunca vivió y dibuja mapas antiguos.
- **Estado del mundo:** tras P5 la niebla se ha ido, pero Íker sigue igual.
- **Capacidad mínima:** Terreno complicado.
- **Problema:** los padres de Íker tienen miedo y el anciano del pueblo quiere «limpiarle» con un ritual.
- **Puzzle:** comparar los dibujos de Íker (Mnemos hace mil años) con la aldea actual; identificar tres lugares que
  siguen existiendo y deducir dónde estaba el pozo de los Custodios, hoy bajo la casa de té. Un Musharna ayuda a
  entrar.
- **Consecuencia:** Íker deja de soñar recuerdos ajenos. Recompensa: **Chimechita**.
- **Reintento:** sin fallo.

**T10 · Tabla Oscura: «La cuadrilla perdida»** · Bosque Neblino y Ruta 10 · Crónica X
- **Pista inicial** (encuentro nocturno en el Neblino): **Nilo** (22), técnico de Genesis, escondido y aterrado.
- **Segunda pista:** su cuadrilla subió a la Ruta 10 y no ha vuelto.
- **Estado del mundo:** fase 1–2. Sombras que se filtran desde el aljibe.
- **Capacidad mínima:** Trepar.
- **Problema:** rescatar a los enemigos, que siguen siendo personas.
- **Puzzle:** tramo de **sigilo nocturno** entre centinelas Honchkrow que avisan a los guardias de Genesis; si detectan
  al jugador, vuelve al último punto seguro (como en B01). La cuadrilla está en una cornisa (Trepar). En el dormidero,
  el **Honchkrow Alfa (nivel 42)**, junto a la Tablilla.
- **Consecuencia:** Nilo deserta y da los planos de Talasa (conduce a N4).
- **Reintento:** vuelta al punto seguro; el Alfa reaparece.

**T11 · Tabla Duende: «La noche de los farolillos»** · Islote Lumbre · Crónica XI
- **Pista inicial** (el farero **Ramón**, en B09): «En el islote bailan luces desde que la luna está rara.»
- **Segunda pista** (al volver con Nadar, tras P6): su nieta **Lucía** siguió a los Clefairy hasta el islote y no ha
  vuelto. «Bailan sin parar.»
- **Estado del mundo:** fase 2.
- **Capacidad mínima:** Nadar.
- **Puzzle:** imitar el baile del corro de Clefairy, una secuencia de ocho pasos sobre piedras que se encienden. Se abre
  la gruta de la luna, donde están Lucía y la Tablilla.
- **Consecuencia:** se celebra la fiesta de los farolillos. Ramón da la pista del P7: «las luces de la ciudad
  hundida». Recompensa: **Clefablita**.
- **Reintento:** el baile se puede repetir.

**T12 · Tabla Llama: «La forja fría»** · Volcán Tizón · Crónica XII
- **Pista inicial** (mercado de Nexo): los herreros de Tizón ya no mandan picos.
- **Segunda pista** (la **Maestra Brasa**): el fuego de la forja, que se alimenta del respiradero del volcán, se ha
  apagado.
- **Estado del mundo:** fase 2. El magma se enfría.
- **Capacidad mínima:** Nadar.
- **Problema:** un equipo de perforación de Genesis (jefa de perforación y técnicos, nivel 46–47) quiere una muestra de
  magma.
- **Puzzle:** en la Cueva Volcán hay que empujar bloques de obsidiana para desviar las coladas; donde se corta el flujo,
  la lava se enfría y se puede pisar. Así se reabren tres respiraderos.
- **Consecuencia:** la forja vuelve a arder. Brasa enseña un crisol antiguo «que ningún fuego funde» (semilla de la
  Piedra Crisol del DLC 2). Recompensa: **Houndoomita**.
- **Reintento:** las coladas se reinician al salir de la sala.

**T13 · Tabla Helada: «La torre de hielo»** · Villa Boreal · Crónica XIII
- **Pista inicial** (inscripción del P7): «La decimotercera tabla espera en el hielo más viejo.»
- **Segunda pista:** el tallista **Rosendo** (80, casi ciego) no reconoce el hielo del lago, que tiene capas antiguas de
  la glaciación-eco.
- **Estado del mundo:** fase 3 inminente y desvinculación.
- **Capacidad mínima:** tras P7 y Embestida.
- **Problema:** su sobrina nieta **Nieves** (16) no se atreve a tallar sola. El pueblo quiere suspender la Torre de Hielo
  que guía a los viajeros.
- **Puzzle:** hielo resbaladizo con **grietas**: cada casilla aguanta dos pasadas. Hay que planificar el camino y romper
  bloques con Embestida para sacar el bloque antiguo. Nieves lo talla y aparece la Tablilla.
- **Consecuencia:** se levanta la Torre, que luego es destino de Vuelo. Nieves se queda con el oficio. Recompensa:
  **Froslassita**.
- **Reintento:** el lago se reinicia.

**T14 · Tabla Cielo: «La carta sin destino»** · de Ciudad Nexo a la Mesa de los Vientos · Crónica XIV
- **Pista inicial** (Correos de Nexo, **Don Evaristo**, 84): una carta de hace 60 años dirigida «a la Mesa de los
  Vientos», devuelta otra vez.
- **Segunda pista** (el acertijo del sobre): «Entre el rayo y la sal, donde el sol de las cinco no hace sombra.» Está
  entre Brontia y las salinas de Estrato, sobre la Meseta.
- **Estado del mundo:** fase 3.
- **Capacidad mínima:** Vuelo. La Mesa aparece en el mapa de Vuelo al resolver el acertijo.
- **Problema:** una comunidad de cuidadores de Altaria lleva aislada desde las tormentas. La destinataria es **Aurora**
  (86), la hermana de Evaristo.
- **Confrontación:** los cuidadores no confían en el jugador; hay que ayudarles a recuperar su rebaño de Altaria,
  disperso por la crisis (tres encuentros visibles).
- **Consecuencia:** los hermanos se reencuentran gracias al Vuelo. Aurora entrega su «Piedra del Cielo» (la Tablilla).
  Recompensa: **Staraptorita**.
- **Reintento:** sin fallo.

**T15 · Tabla Draco: «La Calzada del Rey»** · Sima del Eje, brazo este · Crónica XV
- **Pista inicial** (inscripción del P9): «La última tabla está donde el rey trabajó.»
- **Segunda pista:** los **Peregrinos del Rey**, dirigidos por **Casandra** (50), levantan la Calzada con un trozo del
  Resonador.
- **Estado del mundo:** tras P9.
- **Capacidad mínima:** Reconstrucción.
- **Problema:** los Peregrinos creen que el Rey fue un héroe traicionado. Su reconstrucción forzada es inestable y
  amenaza con derrumbar la Calzada.
- **Confrontación:** estabilizar los tramos con la Reconstrucción auténtica en tres puntos y combatir con Casandra
  (Druddigon 63, Noivern 63, Shelgon 64, Kommo-o 65). En la cima, **Salamence Alfa (nivel 64)**, captura opcional.
- **Consecuencia:** la Crónica XV desmiente el mito; parte de los Peregrinos se queda a cuidar la Calzada. Recompensa:
  **Salamencita**. Con esta, la Libreta tiene el camino completo al fondo.
- **Reintento:** tramos reiniciables; el Alfa reaparece.

## 4.6 El Museo de las Eras (Ciudad Lúmina), T06

- **Curadora:** **Rosalía Quintana** (58). Fue arqueóloga de campo, cojea desde un derrumbe en una excavación, es
  meticulosa y tiene un humor seco. **No tiene relación con Genesis** ni es la NPC del DLC 2 (biblia §7, §13.9).
- **La pieza:** la «Losa votiva de Antea», una losa metálica en la sala clausurada **«Antea, la ciudad de antes»**.
  Rosalía cerró la sala porque la vitrina se agrietaba todas las noches. Es la **Tabla Acero**.
- **Situación:** la Fundación Meridiano (Vértice) financia la reapertura y ha ofrecido «restaurar» la losa en su
  laboratorio. Rosalía no se fía.
- **Pista inicial:** en la gala, Rosalía pide al jugador que vuelva de noche.
- **Segunda pista:** los «restauradores» han hecho seis réplicas para una exposición itinerante y han cambiado las
  etiquetas.
- **Puzzle: la Sala de Réplicas.** Seis losas y cuatro pistas repartidas por el museo:
  1. El peso anotado en la ficha de inventario de 1962 (hay una báscula en el taller).
  2. Una foto de hace 40 años muestra una grieta en forma de «Y» en la esquina inferior izquierda.
  3. En el borde, los glifos Unown dicen «EJE» solo en la original: las réplicas se copiaron de una foto en la que una
     etiqueta tapaba un glifo.
  4. La original conserva el frío.
  - El Core confirma solo al final. Un error hace que Rosalía diga «No» y la sala se reinicia.
- **Confrontación:** persecución hasta el muelle de carga y combate contra dos «restauradores» (nivel 35–36). La
  furgoneta se va vacía.
- **Consecuencia:** Rosalía entrega la Tablilla: «El museo no puede protegerla; tú sí.» Reabre la sala con la historia
  del Rey. El museo **revive fósiles** (Fósil Cráneo y Fósil Coraza de Fermín) y abre la **Sala de las Crónicas**. La
  guardería de Lúmina regala la **Audinita** y Rosalía entrega un **Eevee** que vivía en el taller del museo. En el archivo, una ficha de
  catálogo: «Expedición a la Laguna Clara (hace 16 años). Fondos: Fundación Meridiano. Resultados: no publicados.»
  Rosalía: «Nunca publicaron nada.» (Sin fotos ni nombres: la foto del equipo aparece mucho después, en Talasa.)
- **Capacidad mínima:** ninguna nueva. **Reintento:** la sala se reinicia.

## 4.7 Las tres de Arceus (D12, D22, D23)

- Al entrar al desenlace faltan tres; las conserva Arceus (VIGENTE). Tras el combate de Columna Lanza (B21) el jugador
  recibe **Terrax, Terror y Legendaria** y completa las dieciocho **capture o no a Arceus**.
- Fase Tierra: Arceus lleva equipada la Tabla Terrax. Fase Fantasma: la Tabla Terror. Fase Normal: sin objeto (su tipo
  propio); la Tabla Legendaria **no se equipa**, porque su efecto cambiaría el tipo en combate: la suelta cuando baja del
  50% de PS en la fase 3, momento en que se habilita la captura.
- Los 18 zócalos de Columna Lanza se encienden al completarse el conjunto.

## 4.8 Reglas de no bloqueo de los arcos

- Ningún arco destruye ni oculta para siempre su Tablilla: los estados de fallo reinician la sala o el combate.
- Ningún arco exige capturar nada (los Alfas de T07, T10 y T15 son captura opcional y reaparecen al descansar).
- Ningún arco exige DLC, co-op ni intercambio. Los arcos nocturnos (T03, T10, T11) se alcanzan con «descansar».
- Las capacidades mínimas de §4.4 se obtienen siempre antes de que el arco sea necesario: T01–T13 antes de la Forma
  Completa; T14 y T15 después, como pide la biblia; todas antes de la Puerta de las Quince.
- Si el jugador llega a la Puerta de las Quince sin alguna, la puerta nombra las que faltan y la Libreta marca su zona.
