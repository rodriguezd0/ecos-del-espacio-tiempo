# Bloque 1 — Prólogo y apertura en Villa Alba

Guion de implementación del primer bloque jugable. Fuentes: biblia §2, §4, §5, §8, §13 y decisiones D01–D08,
D02b, D05b, X01, X03 (docs/DECISIONES.md). Todo diálogo aquí es **nuevo** (la biblia no lo tenía escrito) y se ciñe al
canon: Zygarde sobrio y telepático; Gael competente, orgulloso y serio; Alerce sobrio y cauto, sin revelar su pasado;
policía responsable (sin tratos). Los códigos `\PN` = nombre del jugador. Flags en `snake_case` con prefijo `b01_`.

## 0. Flujo de partida nueva

1. Título → **Nueva partida**.
2. **Prólogo cinemático (P-01…P-04)** — sin control del jugador, se puede acelerar con A pero no saltar la primera vez
   (flag `prologue_seen`; en partidas posteriores se puede saltar con START).
3. Pantalla sobria "¿Quién eres?" sobre fondo del cielo nocturno de Axis: elegir chico/chica (sprites caminando),
   luego nombre con ui.textEntry (campo vacío, mínimo 1 carácter, máximo 10; sin nombre canónico por D01; "Axel"
   está descartado como nombre de héroe). Nada de discurso de profesor.
4. Rótulo: **"Axis. Tres días después."** → fundido a la habitación del protagonista (planta alta de su casa, mañana).

## 1. Prólogo (escena cinemática `content/cutscenes/prologue.js`)

Plano a plano (duraciones orientativas; la biblia no fija duración total):

- **P-01 · Mundo Distorsión.** Fondo `Battlebacks/MundoDistorsion_bg.png` con deriva lenta, rocas flotantes y
  partículas violáceas. Dialga (izquierda) y Palkia (derecha) frente a Giratina (Forma Origen si hay sprite; si no,
  Alterada). Tres intercambios de ataques como destellos de color (acero-azul, rosa-nacarado contra sombra): temblor
  de pantalla. Dialga y Palkia retroceden y se desvanecen hacia el fondo, derrotados. Giratina ruge (grito) y rasga el
  espacio: una grieta horizontal se abre bajo él. Sin texto (la biblia no fija motivo ni movimientos).
- **P-02 · Montaña, cascada y portal.** Mapa `montana_portal` (el mismo que se revisitará en el Pilar 6), de noche:
  gran cascada a un lado, explanada de ruinas, **escalinata ascendente** hasta una plataforma con el **portal
  horizontal**: cavidad circular de piedra semejante a un aljibe. La cámara sube por la escalinata. El aljibe se
  ilumina de violeta; Giratina **emerge** del portal (sprite subiendo + sombra), la cascada se agita.
- **P-03 · Zygarde responde.** Cientos de puntos verdes convergen desde el horizonte hacia la explanada y forman a
  **Zygarde Forma Completa** (efecto de hexágonos verdes #B9FF66). Enfrentamiento en la explanada.
- **Montaje de dos días y tercera noche.** Rótulos pequeños: "Primer día" (atardecer, tono anaranjado), "Segundo día"
  (lluvia, luz gris), "Tercera noche" (luna, tono azul). En cada uno: destellos, temblores, rocas que caen, la
  cascada cambiando. Coste visible: Zygarde cada vez más oscuro/tembloroso.
- **P-04 · Victoria y dispersión.** Zygarde empuja a Giratina de vuelta al aljibe; el portal se apaga. Zygarde queda
  inmóvil, pierde cohesión y se deshace en luz verde: **100 destellos pequeños (células) y 5 mayores (núcleos)** se
  dispersan por el cielo de Axis (plano de mapa de región oscuro con estelas). Uno de los núcleos cae hacia el norte de
  un pequeño pueblo entre bosques. Fundido a negro. Sin narrador omnisciente.

## 2. Mapas del bloque

| id | Nombre | Tileset | Tamaño | Notas |
|---|---|---|---|---|
| `villa_alba` | Villa Alba | 7 ExteriorBosqueCeleste | 46×36 | Distribución de la biblia §5: casa roja del protagonista al SO, casa verde de Gael al NO, laboratorio compacto turquesa al E, casa roja NPC al N, casa verde NPC al SE, jardín/parterre central con vegetación, accesos N y S. Bordes de bosque. Salida N custodiada por el policía hacia el Laberinto; salida S a Ruta 1. Piedras antiguas con liquen dispersas (vestigios naturalizados). |
| `casa_prota_1f` | Casa (planta baja) | 4 Interior1 | ~12×10 | Salón-cocina, mesa, TV, la madre. Escalera a la planta alta. |
| `casa_prota_2f` | Habitación | 4 Interior1 | ~10×8 | Cama, PC (almacenamiento), escritorio, ventana. Punto de inicio. |
| `casa_gael` | Casa de Gael | 4 Interior1 | ~12×10 | Estanterías con libros de investigación; nota de Gael. (Familia de Gael sin escribir: no se inventa.) |
| `laboratorio_alerce` | Laboratorio de Alerce | 4 Interior1 | ~16×13 | Lugar de trabajo local: mesas, ordenadores, libros, instrumental, máquina con 3 Poké Balls. Ayudante NPC. Puerta cerrada al fondo (sin uso en este bloque; no se revela nada). |
| `casa_vecinos_n` / `casa_vecinos_se` | Casas de vecinos | 4 Interior1 | ~10×8 | NPCs con diálogos cotidianos. |
| `laberinto_profundidad` | Laberinto de la Profundidad | 7 (setos) o 2 | ~40×34 | Laberinto privado de setos y piedra levantado sobre vestigios; sección de sigilo; cámara derruida en el centro con el Core. |
| `ruta_1` | Ruta 1 | 7 | ~30×60 | Hacia el sur: hierba alta, entrenadores, primeras células, cartel "Hacia el Pilar del Umbral". |

## 3. Estados de historia (flags)

`b01_woke` → `b01_met_mom` → `b01_starter_chosen` → `b01_signal_heard` → `b01_police_entered` →
`b01_core_found` → `b01_escorted` → `b01_gael_duel_done` → `b01_dex_received` → `b01_left_town`.
Variables: `starter` ('TURTWIG'|'LITTEN'|'SOBBLE'), `gael_starter`.
Invariantes: el Core no puede estar en dos sitios (evento del Core del laberinto desaparece con `b01_core_found`);
recompensas únicas; el jugador puede explorar el pueblo antes de cada incidente.

## 4. Escenas y diálogos

### 4.1 Despertar (`casa_prota_2f`, auto al empezar)
Sin sueño explicativo. Luz de mañana por la ventana.
- Al bajar, **Mamá** (auto, una vez):
  - "¡Buenos días, \PN! ¿Has dormido algo? Con los temblores de estas noches, ni los Starly del tejado pegaban ojo."
  - "Ah, ha pasado por aquí el profesor Alerce. Dice que te espera en el laboratorio esta mañana."
  - "No sé qué tramáis, pero lo decía con una cara muy seria. …Bueno, ¡él siempre la pone!"
  - (Si se le vuelve a hablar) "Si alguna vez tus Pokémon están cansados, vuelve a casa. Aquí siempre hay sitio para
    descansar." → a partir de `b01_starter_chosen`, ofrece curar: "¿Descansáis un poco?" (Sí → fundido + ME curación).

### 4.2 Pueblo (exploración libre)
- **Policía** en la salida norte (bloquea el paso; se aparta solo en la escena 4.4):
  - "Alto ahí. Al otro lado está el Laberinto de la Profundidad. Es propiedad privada."
  - "Los dueños no viven en Villa Alba, y desde los temblores nos pidieron que nadie entre. Hay muros que no aguantan
    ni una mirada."
- **Vecinos** (textos cotidianos, sin canon inventado):
  - Anciano junto a una piedra con liquen: "Estas piedras estaban aquí antes que el pueblo. Nadie sabe quién las puso.
    Mi abuelo decía que no había que moverlas… y aquí siguen."
  - Vecina: "Hace tres noches el cielo del norte se puso verde un momento. Mi marido dice que fue un relámpago. Un
    relámpago verde, ¿tú has visto alguno?"
  - Niño: "¡Gael ha ido al laboratorio muy temprano! Siempre llega antes que nadie."
- **Cartel** del pueblo: "Villa Alba — Donde el bosque guarda sus piedras."
- **Cartel** del laboratorio: "Laboratorio Pokémon del Prof. Alerce."
- **Cartel** salida sur: "Ruta 1 — Hacia el sur de Axis."

### 4.3 Laboratorio: elección de inicial
Al entrar (auto): Gael junto a la máquina; Alerce en su mesa.
- **Gael**: "Llegas tarde, \PN. Llevo aquí desde que abrió." / "El profesor no ha querido empezar sin ti."
- **Alerce**: "Buenos días, \PN. Gracias por venir."
- **Alerce**: "Los temblores de estas noches no se parecen a nada que haya registrado en Villa Alba. Necesito datos de
  campo: qué Pokémon se mueven, dónde, y qué cambia en el terreno."
- **Alerce**: "Para eso necesito gente que conozca estos bosques. Y cada uno necesitará un compañero."
- **Alerce**: "En esa máquina hay tres Pokémon. Elige al que quieras que te acompañe."
- Interacción con cada Poké Ball: sprite + grito + "¿Eliges a Turtwig, el Pokémon Hojita?" (usar la categoría de
  especies.json) → Sí/No. Tras confirmar: ME de obtención, "¡\PN ha recibido a <especie>!", opción de mote.
- **Gael** (elige el de ventaja de tipo): "Entonces yo me quedo con este." (toma la Poké Ball) "No es personal. Es
  lo lógico."
- **Alerce**: "Cuidad de ellos. Y no os alejéis del pueblo todavía: quiero que os familiaricéis primero."
- Flag `b01_starter_chosen`. Gael sale antes que el jugador.

### 4.4 La señal
Al salir del laboratorio (auto, una vez): sonido `core_signal` (electrónico, agudo, breve) desde el norte. Pantalla
tiembla levemente. El inicial del jugador (seguidor) mira hacia el norte.
- Mensaje (narración neutra): "Un sonido agudo, como un pitido que no termina de ser un grito, llega desde el norte."
- El jugador recupera el control. Al acercarse a la salida norte (evento touch): el **policía** está mirando hacia el
  laberinto; suena la señal otra vez.
  - Policía: "…¿Otra vez? Eso no es ningún muro cayéndose."
  - Policía (al jugador): "Tú, quédate aquí. Voy a echar un vistazo. Y ni se te ocurra seguirme."
  - El policía entra en el laberinto (ruta de movimiento) y el paso queda libre. Flag `b01_police_entered`.

### 4.5 Sigilo en el Laberinto de la Profundidad
- Sección breve: pasillos de setos altos y muros viejos con liquen; el policía patrulla dos tramos con cono de
  visión (4 casillas en línea recta, bloqueado por muros). Indicación visual: "!" y linterna.
- **Detección**: "¡Eh! ¿Qué te he dicho?" → fundido → el jugador reaparece en la entrada del laberinto (punto
  seguro) mirando al norte; el policía vuelve a su ruta. Sin penalización adicional. Tras 3 detecciones, el policía
  acorta su patrulla (accesibilidad).
- El centro del laberinto: **cámara derruida** con grietas y escombros, luz verde tenue.

### 4.6 El Core
Sprite del Core agotado entre piedras rotas, pulsando débilmente. Al acercarse (auto):
- La pantalla se tiñe de verde un instante; los mensajes del Core usan `telepathy: true`.
- **Core**: "…"
- **Core**: "Puedes oírme."
- **Core**: "No te acerques más rápido. Estoy… incompleto."
- **Core**: "Lo que era se ha dispersado por esta tierra. Sin ello no puedo sostener el equilibrio."
- **Core**: "Las piedras de este lugar recuerdan una promesa. Alguien que caminaría entre el tiempo y el espacio."
  (D02/D02b: insinuación de la profecía; no se explica más.)
- **Core**: "Te he estado esperando. Aunque no sabía que eras tú."
- Elección: "Te ayudaré." / "¿Qué eres?" → si pregunta: "Una parte. Un núcleo. El resto está lejos." → vuelve a la
  elección. Al aceptar: "Entonces iré contigo."
- El Core pasa a seguir al jugador en el mapa (acompañante de campo, fuera del equipo; D06). Flag `b01_core_found`.
- Entra el **policía** (camina hasta ellos):
  - "¡Aquí estás! ¿Tienes idea de lo que…?" (ve al Core) "…¿Qué es eso?"
  - "No. No voy a fingir que sé qué hacer con esto. Ni voy a dejarte aquí dentro."
  - "Vamos al laboratorio. El profesor Alerce sabrá qué es… o eso espero."
  - Fundido; escolta al laboratorio. Flag `b01_escorted`.

### 4.7 Regreso al profesor y duelo con Gael
En el laboratorio (auto): Alerce, ayudante, Gael, policía.
- Policía: "Profesor, lo encontré en el centro del laberinto. Con… eso."
- **Alerce** (se acerca despacio; pausa): "…Un núcleo."
- **Alerce**: "Quiero decir… una criatura así no debería estar en Villa Alba. Ni en ninguna parte, sola."
  (Subtexto: sabe demasiado. No se explica.)
- **Alerce**: "Gracias, agente. Yo me hago cargo."
- Policía: "Más le vale. Y tú: la próxima vez que te diga que te quedes quieto, te quedas quieto." (Se va.)
- **Core** (solo el jugador lo oye; telepathy): "Este humano sabe qué soy."
- **Alerce**: "Parece que ha decidido quedarse contigo, \PN. Eso… no es algo que se pueda ordenar."
- **Gael**: "¿Decidido? ¿Por qué él/ella?" (usar pronombre según género del jugador)
- **Gael**: "Llevo años aquí, profesor. Leyendo cada informe que me dejaba leer. Y aparece esa cosa y se va con quien
  menos lo buscaba."
- **Gael**: "Muy bien. Quiero ver qué es lo que ha visto en ti. \PN, combate conmigo."
- **Combate** Gael (inicial con ventaja, nivel 5; IA básica). Derrota del jugador: no hay game over aquí (el combate
  continúa la historia; se cura y Gael comenta). Victoria:
  - Gael: "…Vale. No ha sido suerte. Todavía no sé qué ha sido, pero suerte no."
  - Derrota: "Ya está. Sigo sin entenderlo." (la historia continúa igual)
- **Alerce** (D05b): "Tomad esto. Los dos." → **Pokédex** + **5 Poké Balls** a cada uno.
  - "La Pokédex registra a cada Pokémon que veáis o capturéis. Y también me enviará lecturas del terreno."
  - "Anoche mis instrumentos marcaron una lectura extraña al sur, en las ruinas del **Pilar del Umbral**, pasada la
    Ruta 1. Nunca había reaccionado así."
  - **Core** (telepathy): "Allí. Algo antiguo se ha movido." (recortado: DECISIONES X34, autor 25-09-2026)
  - Alerce: "Id con cuidado. Y \PN… cuida de él. Creo que él también cuidará de ti."
  - Gael: "Nos vemos allí. Llegaré antes." (sale)
- Flags `b01_gael_duel_done`, `b01_dex_received`. La mamá, al volver a casa, cura y da un regalo cotidiano
  (p. ej. 3 Pociones: "Por si acaso. Y vuelve de vez en cuando.").

### 4.8 Ruta 1
- Hierba alta con encuentros (tabla abajo), 2–3 entrenadores de nivel 3–6, objetos en el suelo.
- **Primeras células de Zygarde** (colocación PROVISIONAL, D10): la célula quieta en el suelo, sin brillo; al tocarlas:
  sonido, "Has encontrado una Célula de Zygarde. (n/100)" y un destello breve. El Core no reacciona ni da las gracias
  (DECISIONES X34, autor 25-09-2026).
- Cartel final: "Pilar del Umbral — Ruinas antiguas. Se ruega respeto." (fin del bloque 1; bloque 2 empieza aquí).

## 5. Encuentros Ruta 1 (provisional, especies del inventario Axis)
Hierba, nivel 2–4: Starly 20 %, Bidoof 20 %, Lillipup 15 %, Kricketot 15 %, Shinx 10 %, Budew 10 %, Wurmple 10 %.
Mismas tablas para el modo visible (biblia §15).

## 6. Entrenadores
- `gael_1`: inicial con ventaja nv 5.
- Ruta 1: "Joven Pablo" (Bidoof nv 4), "Chica Nerea" (Starly nv 3, Budew nv 3), "Bichero Luis" (Wurmple nv 3,
  Kricketot nv 4). Nombres genéricos de NPC (sin canon).
