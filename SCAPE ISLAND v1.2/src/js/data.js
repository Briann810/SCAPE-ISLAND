// ============================================================
//  DATA.JS — CONFIGURACIÓN CENTRAL DEL JUEGO
//  Modifica aquí las preguntas, opciones y recompensas.
//  El resto del juego se adapta automáticamente.
//  Ejemplo: si quieres un juego de Ciencias, solo cambia el
//  array PREGUNTAS (y, si quieres, los íconos en RECOMPENSAS).
// ============================================================

// ─── PREGUNTAS ───────────────────────────────────────────────
// Para cambiar el tema del juego, edita solo esta lista.
// Cada pregunta tiene:
//   nivel     : 1-10 (define la dificultad y recompensas)
//   pregunta  : texto de la pregunta
//   opciones  : array de 4 opciones [A, B, C, D]
//   respuesta : índice correcto (0=A, 1=B, 2=C, 3=D)
//   hint      : pista opcional que aparece en el modal

const PREGUNTAS = [
  {
    nivel: 1,
    pregunta: "¿Cuál de las siguientes es una función lineal?",
    opciones: [
      "y = x² + 1",
      "y = 3x − 2",
      "y = √x",
      "y = 1/x"
    ],
    respuesta: 1,
    hint: "Una función lineal tiene la forma y = mx + b"
  },
  {
    nivel: 2,
    pregunta: "¿Qué representa la pendiente de una función lineal?",
    opciones: [
      "La rapidez de cambio",
      "El vértice",
      "El dominio",
      "La raíz"
    ],
    respuesta: 0,
    hint: "La pendiente indica cuánto sube o baja la recta por cada unidad"
  },
  {
    nivel: 3,
    pregunta: "¿Qué gráfica corresponde a una función cuadrática?",
    opciones: [
      "Recta",
      "Circunferencia",
      "Parábola",
      "Elipse"
    ],
    respuesta: 2,
    hint: "La función cuadrática tiene la forma y = ax² + bx + c"
  },
  {
    nivel: 4,
    pregunta: "Si en y = ax² + bx + c, el valor de 'a' es positivo, la parábola:",
    opciones: [
      "Abre hacia abajo",
      "Abre hacia arriba",
      "Es una recta",
      "No tiene vértice"
    ],
    respuesta: 1,
    hint: "El signo de 'a' determina la dirección de apertura"
  },
  {
    nivel: 5,
    pregunta: "El vértice de una parábola representa:",
    opciones: [
      "Una raíz",
      "El dominio",
      "Un máximo o mínimo",
      "La pendiente"
    ],
    respuesta: 2,
    hint: "El vértice es el punto más alto o más bajo de la parábola"
  },
  {
    nivel: 6,
    pregunta: "Las raíces de una función representan:",
    opciones: [
      "Los cortes con el eje X",
      "Los cortes con el eje Y",
      "El vértice",
      "La pendiente"
    ],
    respuesta: 0,
    hint: "Las raíces son los valores donde f(x) = 0"
  },
  {
    nivel: 7,
    pregunta: "¿Cuál de las siguientes funciones tiene dominio restringido?",
    opciones: [
      "y = 2x + 3",
      "y = x²",
      "y = √(x − 1)",
      "y = 5x − 4"
    ],
    respuesta: 2,
    hint: "La raíz cuadrada solo está definida para valores ≥ 0"
  },
  {
    nivel: 8,
    pregunta: "Una parábola abre hacia abajo. ¿Qué representa su vértice?",
    opciones: [
      "Un mínimo",
      "Un máximo",
      "Una raíz",
      "El dominio"
    ],
    respuesta: 1,
    hint: "Si 'a' es negativo la parábola abre hacia abajo y su vértice es el punto más alto"
  },
  {
    nivel: 9,
    pregunta: "Si una parábola abre hacia arriba y corta al eje X en dos puntos, entonces:",
    opciones: [
      "Tiene dos raíces reales",
      "No tiene raíces",
      "Tiene una raíz",
      "No tiene vértice"
    ],
    respuesta: 0,
    hint: "Cada intersección con el eje X es una raíz real"
  },
  {
    nivel: 10,
    pregunta: "La altura de una pelota se modela con h(x) = −x² + 6x + 7. ¿Qué representa el vértice de la parábola?",
    opciones: [
      "La altura inicial",
      "La altura máxima de la pelota",
      "El momento en que toca el suelo",
      "La velocidad de la pelota"
    ],
    respuesta: 1,
    hint: "Calcula el vértice con x = −b/(2a) = −6/(2·(−1)) = 3, luego h(3) = −9 + 18 + 7 = 16"
  }
];

// ─── RECOMPENSAS POR NIVEL ────────────────────────────────────
// Define qué recurso otorga cada nivel al completarse CORRECTAMENTE.
// El recurso siempre es el mismo para ese nivel; la CANTIDAD entregada
// depende del número de intento en que se respondió bien (ver
// TABLA_PUNTOS_POR_INTENTO más abajo: 1er intento da más, luego baja).
// Recursos disponibles: comida, agua, madera, herramientas
//   🌲 = madera   |   🛠️ = herramientas   |   🍖 = comida   |   💧 = agua
const RECOMPENSAS = {
  1:  { recurso: "madera",       icono: "🌲" },
  2:  { recurso: "agua",         icono: "💧" },
  3:  { recurso: "comida",       icono: "🍖" },
  4:  { recurso: "madera",       icono: "🌲" },
  5:  { recurso: "agua",         icono: "💧" },
  6:  { recurso: "herramientas", icono: "🛠️" },
  7:  { recurso: "madera",       icono: "🌲" },
  8:  { recurso: "comida",       icono: "🍖" },
  9:  { recurso: "herramientas", icono: "🛠️" },
  10: { recurso: "herramientas", icono: "🛠️" }
};

// ─── PUNTOS / RECURSO SEGÚN EL INTENTO EN QUE SE RESPONDE BIEN ─
// 1er intento = 100 | 2do = 50 | 3ro = 25 | 4to = 5 | 5to+ = 0
// El mismo número se usa como PUNTAJE GLOBAL y como CANTIDAD de
// madera/herramientas otorgada (si el recurso del nivel es comida
// o agua, esa cantidad se interpreta igual, ver game.js).
const TABLA_PUNTOS_POR_INTENTO = [100, 50, 25, 5]; // índice 0 = intento 1
const PUNTOS_INTENTOS_EXTRA = 0; // a partir del intento 5

// ─── RECUPERACIÓN DE VIDA AL COMER (según dificultad del nivel) ─
// Fácil (nivel 1-3)      → recupera bastante vida
// Intermedio (nivel 4-5) → recupera una cantidad media
// Difícil (nivel 6-9)    → recupera poca vida
// Integrador (nivel 10)  → recupera poca vida
const RECUPERACION_VIDA_POR_DIFICULTAD = {
  facil:       20,
  intermedio:  10,
  dificil:     5,
  integrador:  5
};

// ─── ENERGÍA RECUPERADA POR CADA UNIDAD DE AGUA GANADA ────────
// El agua es el único recurso que repone energía.
const ENERGIA_POR_AGUA = 4;

// ─── POSICIONES DE LOS NODOS EN EL MAPA (% del contenedor) ───
// Ajusta left/top para mover los círculos sobre el mapa.
// Coinciden con el recorrido punteado de la imagen de referencia
// (MAPA FINAL CON LOS ELEMENTOS QUE SERÁN INTEGRADOS).
const POSICIONES_NODOS = [
  { id: 1,  left: "17%", top: "65%" },
  { id: 2,  left: "22%", top: "57%" },
  { id: 3,  left: "17%", top: "38%" },
  { id: 4,  left: "34%", top: "32%" },
  { id: 5,  left: "45%", top: "17%" },
  { id: 6,  left: "62%", top: "23%" },
  { id: 7,  left: "73%", top: "43%" },
  { id: 8,  left: "62%", top: "63%" },
  { id: 9,  left: "45%", top: "80%" },
  { id: 10, left: "70%", top: "82%" }
];

// ─── CONFIGURACIÓN GENERAL ────────────────────────────────────
const CONFIG = {
  duracionCarga: 2000,        // ms de pantalla de carga (2 segundos)

  vidaInicial:   100,
  vidaMax:       100,

  energiaInicial: 100,
  energiaMax:     100,
  energiaTickMs:  2000,      // cada cuánto baja la energía (10 segundos)
  energiaBajaPorTick: 1,      // cuánto baja cada tick

  vidaPerdidaPorError: 20,    // vida que se pierde por cada respuesta incorrecta

  recursosIniciales: {
    comida: 10,
    agua: 8,
    madera: 20,
    herramientas: 5
  }
};
