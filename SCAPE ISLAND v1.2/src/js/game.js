// ============================================================
//  GAME.JS — Lógica principal del juego
//  ------------------------------------------------------------
//  ORDEN DE EJECUCIÓN GENERAL:
//    1. iniciarCarga()        → pantalla de carga (1s)
//    2. mostrarBienvenida()   → frase inicial + botón "Empezar"
//    3. iniciarJuego()        → arranca cronómetro, vida, energía
//    4. renderizarNodos()     → dibuja los círculos sobre el mapa
//    5. clic en nodo          → abrirModal()
//    6. elegir opción + confirmar → confirmarRespuesta()
//    7. si vida llega a 0     → mostrarDerrota()
//    8. si se responden las 10 preguntas → finalizarJuego()
//
//  SISTEMA DE RECURSOS (resumen):
//    🍖 comida        → recupera VIDA (más en fácil, menos en difícil)
//    💧 agua          → recupera ENERGÍA (única forma de recuperarla)
//    🌲 madera        → material para el barco, da PUNTOS según intento
//    🛠️ herramientas  → material para el barco, da PUNTOS según intento
//
//  El puntaje y la cantidad de madera/herramientas entregada
//  dependen del intento en el que se responde correctamente:
//    intento 1 → 100 | intento 2 → 50 | intento 3 → 25
//    intento 4 → 5   | intento 5+ → 0 (ya no entrega recurso)
// ============================================================

// ── Estado global del juego ─────────────────────────────────
const estado = {
  nivelActual:        1,       // siguiente nodo desbloqueado (1 = primer nodo)
  respuestas:         {},      // { nivelId: true } nodos ya respondidos correctamente
  intentosPorNivel:   {},      // { nivelId: numeroDeIntentosUsados }
  recursos:           {},      // cantidades actuales de recursos
  vida:               0,
  energia:            0,
  cronometroSeg:       0,
  intervaloCron:       null,
  intervaloEnergia:    null,
  intervaloDrainVida:  null,   // intervalo que drena vida cuando energía = 0
  opcionSeleccionada:  null,
  juegoActivo:         false,  // false mientras está pausado / perdido / terminado
  sonidoActivo:        true,
  historialPartidas:   [],     // lista guardada de partidas anteriores (en sesión)
  puntajeAcumulado:   { madera: 0, herramientas: 0 } // para pantalla final
};

// ── Referencias al DOM ──────────────────────────────────────
const pantallaCarga       = document.getElementById('pantalla-carga');
const pantallaBienvenida  = document.getElementById('pantalla-bienvenida');
const btnEmpezar          = document.getElementById('btn-empezar');
const pantallaJuego       = document.getElementById('pantalla-juego');
const cronometroEl        = document.getElementById('cronometro');
const vidaFill            = document.getElementById('vida-fill');
const vidaVal             = document.getElementById('vida-val');
const energiaFill         = document.getElementById('energia-fill');
const energiaVal          = document.getElementById('energia-val');
const capaRecursos        = document.getElementById('capa-recursos');
const capaNodos           = document.getElementById('capa-nodos');
const overlayModal        = document.getElementById('overlay-modal');
const contenidoModal      = document.getElementById('contenido-modal');
const modalFinal          = document.getElementById('modal-final');
const toastEl             = document.getElementById('toast');

const btnInstrucciones    = document.getElementById('btn-instrucciones');
const overlayInstrucciones = document.getElementById('overlay-instrucciones');
const btnCerrarInstrucciones = document.getElementById('btn-cerrar-instrucciones');

const btnSonido           = document.getElementById('btn-sonido');
const iconoNota           = document.getElementById('icono-nota');

const overlayDerrota      = document.getElementById('overlay-derrota');
const btnReintentarDerrota = document.getElementById('btn-reintentar-derrota');

const audioUI             = document.getElementById('sonido-ui');
const audioMusica         = document.getElementById('musica-fondo');
const audioCorrecta       = document.getElementById('sonido-correcta');
const audioIncorrecta     = document.getElementById('sonido-incorrecta');
const audioVictoria       = document.getElementById('sonido-victoria');
const audioGameOver       = document.getElementById('sonido-gameover');

// ============================================================
//  1. PANTALLA DE CARGA (1 segundo, luego pasa a bienvenida)
// ============================================================
function iniciarCarga() {
  pantallaCarga.style.display = 'flex';
  pantallaCarga.style.opacity = '1';
  pantallaJuego.classList.remove('visible');

  setTimeout(() => {
    pantallaCarga.style.transition = 'opacity 0.5s ease';
    pantallaCarga.style.opacity = '0';
    setTimeout(() => {
      pantallaCarga.style.display = 'none';
      mostrarBienvenida();
    }, 500);
  }, CONFIG.duracionCarga);
}

// ============================================================
//  2. PANTALLA DE BIENVENIDA (frase inicial)
// ============================================================
function mostrarBienvenida() {
  pantallaBienvenida.classList.add('visible');
}

btnEmpezar.addEventListener('click', () => {
  reproducirSonidoUI();
  pantallaBienvenida.classList.remove('visible');
  iniciarJuego();
  // La música ambiental arranca con la primera interacción del usuario
  // (los navegadores bloquean el autoplay de audio sin interacción previa).
  intentarReproducirMusica();
});

// ============================================================
//  3. INICIAR / REINICIAR JUEGO
// ============================================================
function iniciarJuego() {
  // Reiniciar estado completo
  estado.recursos          = { ...CONFIG.recursosIniciales };
  estado.nivelActual       = 1;
  estado.respuestas        = {};
  estado.intentosPorNivel  = {};
  estado.opcionSeleccionada = null;
  estado.vida              = CONFIG.vidaInicial;
  estado.energia           = CONFIG.energiaInicial;
  estado.cronometroSeg     = 0;
  estado.juegoActivo       = true;
  estado.puntajeAcumulado  = { madera: 0, herramientas: 0 };

  pantallaJuego.classList.add('visible');
  overlayDerrota.classList.remove('abierto');
  modalFinal.classList.remove('visible');
  clearInterval(estado.intervaloDrainVida);
  estado.intervaloDrainVida = null;

  actualizarBarras();
  renderizarRecursos();
  renderizarNodos();
  iniciarCronometro();
  iniciarTickEnergia();
}

// ============================================================
//  4. CRONÓMETRO (contador superior, empieza en 00:00)
// ============================================================
function iniciarCronometro() {
  clearInterval(estado.intervaloCron);
  estado.cronometroSeg = 0;
  actualizarCronometro();

  estado.intervaloCron = setInterval(() => {
    if (!estado.juegoActivo) return;
    estado.cronometroSeg++;
    actualizarCronometro();
  }, 1000);
}

function detenerCronometro() {
  clearInterval(estado.intervaloCron);
}

// Formatea segundos → MM:SS
function formatearTiempo(seg) {
  const m = String(Math.floor(seg / 60)).padStart(2, '0');
  const s = String(seg % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function actualizarCronometro() {
  cronometroEl.textContent = formatearTiempo(estado.cronometroSeg);
}

// ============================================================
//  5. TICK DE ENERGÍA
//  La energía baja 1 cada CONFIG.energiaTickMs (10s por defecto).
//  Si la energía llega a 0 simplemente se queda en 0 (no pierde
//  la partida por sí sola; el agua es la forma de recuperarla).
// ============================================================
function iniciarTickEnergia() {
  clearInterval(estado.intervaloEnergia);
  estado.intervaloEnergia = setInterval(() => {
    if (!estado.juegoActivo) return;
    estado.energia = Math.max(0, estado.energia - CONFIG.energiaBajaPorTick);
    actualizarBarras();

    // Si la energía llega a 0, arrancar drenaje de vida (1 por segundo)
    if (estado.energia <= 0) {
      if (!estado.intervaloDrainVida) {
        estado.intervaloDrainVida = setInterval(() => {
          if (!estado.juegoActivo) { clearInterval(estado.intervaloDrainVida); estado.intervaloDrainVida = null; return; }
          estado.vida = Math.max(0, estado.vida - 1);
          actualizarBarras();
          if (estado.vida <= 0) {
            clearInterval(estado.intervaloDrainVida);
            estado.intervaloDrainVida = null;
            cerrarModal();
            mostrarDerrota();
          }
        }, 1000);
      }
    } else {
      // Si recuperó energía, detener el drenaje de vida
      if (estado.intervaloDrainVida) {
        clearInterval(estado.intervaloDrainVida);
        estado.intervaloDrainVida = null;
      }
    }
  }, CONFIG.energiaTickMs);
}

function detenerTickEnergia() {
  clearInterval(estado.intervaloEnergia);
  clearInterval(estado.intervaloDrainVida);
  estado.intervaloDrainVida = null;
}

// ============================================================
//  6. RENDERIZAR NODOS EN EL MAPA
// ============================================================
function renderizarNodos() {
  capaNodos.innerHTML = '';

  POSICIONES_NODOS.forEach(pos => {
    const nodo = document.createElement('button');
    nodo.className = 'nodo';
    nodo.dataset.id = pos.id;
    nodo.textContent = pos.id;
    nodo.style.left = pos.left;
    nodo.style.top  = pos.top;

    // Determinar estado visual: completo (rojo) > activo (turquesa) > bloqueado
    if (estado.respuestas[pos.id]) {
      nodo.classList.add('completo');
    } else if (pos.id === estado.nivelActual) {
      nodo.classList.add('activo', 'siguiente-disponible');
    } else if (pos.id < estado.nivelActual) {
      nodo.classList.add('completo');
    } else {
      nodo.classList.add('bloqueado');
    }

    nodo.addEventListener('click', () => manejarClicNodo(pos.id));
    capaNodos.appendChild(nodo);
  });
}

// ============================================================
//  7. MANEJAR CLIC EN NODO
//  Los nodos posteriores al nivel actual permanecen bloqueados
//  hasta responder correctamente el nodo anterior.
// ============================================================
function manejarClicNodo(id) {
  if (!estado.juegoActivo) return;

  if (id > estado.nivelActual) {
    mostrarToast(`Completa la estación ${id - 1} primero 🔒`);
    return;
  }
  abrirModal(id);
}

// ============================================================
//  8. ABRIR MODAL DE PREGUNTA
// ============================================================
function abrirModal(id) {
  const preguntaData  = PREGUNTAS[id - 1];
  const yaRespondido  = !!estado.respuestas[id];

  reproducirSonidoUI();

  if (yaRespondido) {
    // Estación ya completada: solo mostrar "respuesta correcta"
    contenidoModal.innerHTML = plantillaYaRespondido(id);
  } else {
    estado.opcionSeleccionada = null;
    contenidoModal.innerHTML = plantillaPregunta(id, preguntaData);
    registrarEventosOpciones(id, preguntaData);
  }

  overlayModal.classList.add('abierto');
  document.getElementById('btn-cerrar-modal').addEventListener('click', cerrarModal);
}

// ============================================================
//  9. PLANTILLA HTML — PREGUNTA
// ============================================================
function plantillaPregunta(id, datos) {
  const letras = ['A', 'B', 'C', 'D'];
  const difLabel = obtenerDificultad(id);

  const opcionesHTML = datos.opciones.map((op, i) => `
    <button class="opcion-btn" data-idx="${i}">
      <span class="opcion-letra">${letras[i]}</span>
      <span>${op}</span>
    </button>
  `).join('');

  return `
    <button class="modal-cerrar" id="btn-cerrar-modal">✕</button>

    <div>
      <span class="modal-nivel">Estación ${id}</span>
      <span class="modal-dificultad ${difLabel.clase}">${difLabel.texto}</span>
    </div>

    <p class="modal-pregunta">${datos.pregunta}</p>

    <div class="modal-opciones" id="contenedor-opciones">
      ${opcionesHTML}
    </div>

    <div class="modal-hint" id="hint-box">💡 ${datos.hint}</div>

    <button class="btn-confirmar" id="btn-confirmar" disabled>
      Confirmar respuesta
    </button>
  `;
}

// ============================================================
//  10. PLANTILLA HTML — YA RESPONDIDO
// ============================================================
function plantillaYaRespondido(id) {
  const recomp = RECOMPENSAS[id];
  const intentos = estado.intentosPorNivel[id] || 1;
  const puntos = puntosPorIntento(intentos);

  return `
    <button class="modal-cerrar" id="btn-cerrar-modal">✕</button>
    <div class="modal-correcto">
      <div class="check-grande">✅</div>
      <h2>¡Respuesta Correcta!</h2>
      <p>Ya completaste esta estación.</p>
      <div>
        <span class="recompensa-tag">${recomp.icono} +${puntos} ${nombreRecurso(recomp.recurso)}</span>
        <span class="puntos-tag">⭐ ${puntos} pts</span>
      </div>
    </div>
  `;
}

// ============================================================
//  11. EVENTOS DE OPCIONES EN EL MODAL
// ============================================================
function registrarEventosOpciones(id, datos) {
  const botones = document.querySelectorAll('.opcion-btn');
  const btnConfirmar = document.getElementById('btn-confirmar');

  botones.forEach(btn => {
    btn.addEventListener('click', () => {
      botones.forEach(b => { b.style.borderColor = ''; b.style.background = ''; });

      btn.style.borderColor = 'var(--turquesa)';
      btn.style.background = 'rgba(90,187,171,0.1)';
      estado.opcionSeleccionada = parseInt(btn.dataset.idx);
      btnConfirmar.disabled = false;

      document.getElementById('hint-box').style.display = 'block';
    });
  });

  btnConfirmar.addEventListener('click', () => confirmarRespuesta(id, datos));
}

// ============================================================
//  12. CONFIRMAR RESPUESTA
//  - Si es correcta: otorga recurso + puntos según el intento,
//    desbloquea el siguiente nodo y, si el recurso es comida o
//    agua, aplica su efecto inmediato (vida / energía).
//  - Si es incorrecta: resta vida (-20), cuenta el intento y
//    cierra el modal para que el jugador reintente más tarde.
// ============================================================
function confirmarRespuesta(id, datos) {
  const seleccionado = estado.opcionSeleccionada;
  const correcto      = datos.respuesta;
  const botones       = document.querySelectorAll('.opcion-btn');
  const btnConfirmar  = document.getElementById('btn-confirmar');

  botones.forEach(b => b.disabled = true);
  btnConfirmar.disabled = true;

  // Contar este intento (independiente de si es correcto o no)
  estado.intentosPorNivel[id] = (estado.intentosPorNivel[id] || 0) + 1;

  botones[correcto].classList.add('correcta');

  if (seleccionado !== correcto) {
    botones[seleccionado].classList.add('incorrecta');

    // ── RESPUESTA INCORRECTA ──
    reproducirSonido(audioIncorrecta);
    aplicarDanioPorError();

    setTimeout(() => {
      // Si la vida llegó a 0, mostrar derrota en vez del toast normal
      if (estado.vida <= 0) {
        cerrarModal();
        mostrarDerrota();
      } else {
        mostrarToast('Respuesta incorrecta. ¡Inténtalo de nuevo! ❌');
        cerrarModal();
      }
    }, 1200);
    return;
  }

  // ── RESPUESTA CORRECTA ──
  estado.respuestas[id] = true;
  reproducirSonido(audioCorrecta);

  const numeroIntento = estado.intentosPorNivel[id]; // 1, 2, 3...
  const puntos = puntosPorIntento(numeroIntento);

  otorgarRecompensa(id, puntos);
  renderizarRecursos();
  actualizarBarras();

  // Desbloquear siguiente nodo
  if (id >= estado.nivelActual) {
    estado.nivelActual = id + 1;
  }

  // Actualizar nodo en el mapa (pasa a rojo / completo)
  const nodoEl = capaNodos.querySelector(`[data-id="${id}"]`);
  if (nodoEl) {
    nodoEl.classList.remove('activo', 'bloqueado', 'siguiente-disponible');
    nodoEl.classList.add('completo');
  }

  // Activar el siguiente nodo si existe
  const sigNodo = capaNodos.querySelector(`[data-id="${estado.nivelActual}"]`);
  if (sigNodo) {
    sigNodo.classList.remove('bloqueado');
    sigNodo.classList.add('activo', 'siguiente-disponible');
  }

  // Mostrar el modal de "¡correcto!" después de un breve instante
  setTimeout(() => {
    contenidoModal.innerHTML = plantillaYaRespondido(id);
    document.getElementById('btn-cerrar-modal').addEventListener('click', cerrarModal);

    // Si era la última pregunta → finalizar el juego
    if (Object.keys(estado.respuestas).length === PREGUNTAS.length) {
      setTimeout(() => {
        cerrarModal();
        finalizarJuego();
      }, 1500);
    }
  }, 800);
}

// ============================================================
//  13. OTORGAR RECOMPENSA SEGÚN EL RECURSO DEL NIVEL
//  - madera / herramientas → suman "puntos" unidades (según intento)
//  - comida                → recupera vida según dificultad del nivel
//  - agua                  → recupera energía (cantidad fija por agua)
// ============================================================
function otorgarRecompensa(id, puntos) {
  const recomp = RECOMPENSAS[id];
  const tipo = recomp.recurso;

  if (tipo === 'madera' || tipo === 'herramientas') {
    estado.recursos[tipo] = (estado.recursos[tipo] || 0) + puntos;
    // Acumular puntaje por tipo para pantalla final
    estado.puntajeAcumulado[tipo] = (estado.puntajeAcumulado[tipo] || 0) + puntos;
    return;
  }

  if (tipo === 'comida') {
    estado.recursos.comida = (estado.recursos.comida || 0) + 1;
    const recuperacion = recuperacionVidaPorNivel(id);
    estado.vida = Math.min(CONFIG.vidaMax, estado.vida + recuperacion);
    return;
  }

  if (tipo === 'agua') {
    estado.recursos.agua = (estado.recursos.agua || 0) + 1;
    estado.energia = Math.min(CONFIG.energiaMax, estado.energia + ENERGIA_POR_AGUA);
    return;
  }
}

// Devuelve cuánta vida recupera la comida según la dificultad del nivel
function recuperacionVidaPorNivel(id) {
  const dif = obtenerDificultad(id).clave;
  return RECUPERACION_VIDA_POR_DIFICULTAD[dif] || 5;
}

// Devuelve los puntos correspondientes al número de intento (1-based)
function puntosPorIntento(numeroIntento) {
  const idx = numeroIntento - 1;
  if (idx >= 0 && idx < TABLA_PUNTOS_POR_INTENTO.length) {
    return TABLA_PUNTOS_POR_INTENTO[idx];
  }
  return PUNTOS_INTENTOS_EXTRA; // intento 5 en adelante = 0
}

// Nombre amigable del recurso para mostrar en el modal
function nombreRecurso(tipo) {
  const nombres = { comida: 'comida', agua: 'agua', madera: 'madera', herramientas: 'herramientas' };
  return nombres[tipo] || tipo;
}

// ============================================================
//  14. APLICAR DAÑO POR RESPUESTA INCORRECTA
// ============================================================
function aplicarDanioPorError() {
  estado.vida = Math.max(0, estado.vida - CONFIG.vidaPerdidaPorError);
  actualizarBarras();
}

// ============================================================
//  15. CERRAR MODAL DE PREGUNTA
// ============================================================
function cerrarModal() {
  reproducirSonidoUI();
  overlayModal.classList.remove('abierto');
}

// ============================================================
//  16. ACTUALIZAR BARRAS VIDA / ENERGÍA
// ============================================================
function actualizarBarras() {
  const pVida    = Math.round((estado.vida    / CONFIG.vidaMax)    * 100);
  const pEnergia = Math.round((estado.energia / CONFIG.energiaMax) * 100);
  vidaFill.style.width    = pVida + '%';
  energiaFill.style.width = pEnergia + '%';
  vidaVal.textContent     = `${estado.vida}/${CONFIG.vidaMax}`;
  energiaVal.textContent  = `${estado.energia}/${CONFIG.energiaMax}`;
}

// ============================================================
//  17. RENDERIZAR RECURSOS EN EL PANEL
// ============================================================
function renderizarRecursos() {
  // Íconos fijos por tipo de recurso (🌲 reemplaza al ícono anterior de madera)
  const iconos = {
    comida:       '🍖',
    agua:         '💧',
    madera:       '🌲',
    herramientas: '🛠️'
  };

  capaRecursos.innerHTML = Object.entries(estado.recursos).map(([tipo, val]) => `
    <div class="recurso-item">
      <div class="recurso-icono">${iconos[tipo] || '📦'}</div>
      <div class="recurso-val">${val}</div>
    </div>
  `).join('');
}

// ============================================================
//  18. OBTENER ETIQUETA DE DIFICULTAD
//  clave: usada internamente para RECUPERACION_VIDA_POR_DIFICULTAD
// ============================================================
function obtenerDificultad(nivel) {
  if (nivel <= 3) return { texto: 'Fácil',      clase: 'dif-facil',      clave: 'facil' };
  if (nivel <= 5) return { texto: 'Intermedio', clase: 'dif-intermedio', clave: 'intermedio' };
  if (nivel <= 9) return { texto: 'Difícil',    clase: 'dif-dificil',    clave: 'dificil' };
  return                  { texto: 'Integrador', clase: 'dif-integrador', clave: 'integrador' };
}

// ============================================================
//  19. MOSTRAR DERROTA (vida llegó a 0)
// ============================================================
function mostrarDerrota() {
  estado.juegoActivo = false;
  detenerCronometro();
  detenerTickEnergia();
  reproducirSonido(audioGameOver);
  overlayDerrota.classList.add('abierto');
}

btnReintentarDerrota.addEventListener('click', () => {
  reproducirSonidoUI();
  overlayDerrota.classList.remove('abierto');
  iniciarJuego();
});

// ============================================================
//  20. FINALIZAR JUEGO — MOSTRAR RESULTADOS (victoria)
// ============================================================
function finalizarJuego() {
  estado.juegoActivo = false;
  detenerCronometro();
  detenerTickEnergia();

  const tiempoFinal = estado.cronometroSeg;
  const puntaje = calcularPuntajeTotal();
  const ptsMadera = estado.puntajeAcumulado.madera || 0;
  const ptsHerramientas = estado.puntajeAcumulado.herramientas || 0;

  // Guardar en historial de partidas (en memoria, dura la sesión)
  const partida = {
    fecha:    new Date().toLocaleString('es-PE'),
    tiempo:   formatearTiempo(tiempoFinal),
    puntaje:  puntaje,
    recursos: ptsMadera + ptsHerramientas
  };
  estado.historialPartidas.push(partida);

  document.getElementById('final-tiempo').textContent    = formatearTiempo(tiempoFinal);
  document.getElementById('final-puntaje').textContent   = puntaje;
  document.getElementById('final-preguntas').textContent = PREGUNTAS.length + '/' + PREGUNTAS.length;

  // Recursos para el bote
  document.getElementById('final-madera-pts').textContent       = ptsMadera;
  document.getElementById('final-herramientas-pts').textContent = ptsHerramientas;
  document.getElementById('final-recursos-total').textContent   = ptsMadera + ptsHerramientas;

  const listaEl = document.getElementById('lista-historial');
  listaEl.innerHTML = estado.historialPartidas.map((p, i) => `
    <div class="historial-item">
      <span>Partida ${i + 1} — ${p.fecha}</span>
      <span>⏱ ${p.tiempo} | ⭐ ${p.recursos}</span>
    </div>
  `).join('');

  // Reproducir victoria después de un pequeño retraso
  setTimeout(() => reproducirSonido(audioVictoria), 400);
  modalFinal.classList.add('visible');
}

// ============================================================
//  21. CALCULAR PUNTAJE TOTAL
//  Suma los puntos obtenidos en cada nivel según el intento en
//  que se respondió correctamente (ver TABLA_PUNTOS_POR_INTENTO).
// ============================================================
function calcularPuntajeTotal() {
  let total = 0;
  Object.keys(estado.intentosPorNivel).forEach(id => {
    if (estado.respuestas[id]) {
      total += puntosPorIntento(estado.intentosPorNivel[id]);
    }
  });
  return total;
}

// ============================================================
//  22. TOAST (NOTIFICACIÓN BREVE)
// ============================================================
function mostrarToast(mensaje) {
  toastEl.textContent = mensaje;
  toastEl.classList.add('visible');
  setTimeout(() => toastEl.classList.remove('visible'), 2200);
}

// ============================================================
//  23. REINICIAR JUEGO (desde el modal final)
// ============================================================
function reiniciarJuego() {
  modalFinal.classList.remove('visible');
  iniciarJuego();
}

// ============================================================
//  24. MODAL DE INSTRUCCIONES
// ============================================================
btnInstrucciones.addEventListener('click', () => {
  reproducirSonidoUI();
  overlayInstrucciones.classList.add('abierto');
});

btnCerrarInstrucciones.addEventListener('click', () => {
  reproducirSonidoUI();
  overlayInstrucciones.classList.remove('abierto');
});

// ============================================================
//  25. SONIDO — clic al abrir/cerrar ventanas + botón de mute
// ============================================================
function reproducirSonidoUI() {
  if (!estado.sonidoActivo) return;
  try {
    audioUI.currentTime = 0;
    audioUI.play();
  } catch (e) { /* el navegador puede bloquear el primer intento */ }
}

function reproducirSonido(audioEl) {
  if (!estado.sonidoActivo || !audioEl) return;
  try {
    audioEl.currentTime = 0;
    audioEl.play();
  } catch (e) {}
}

function intentarReproducirMusica() {
  if (!estado.sonidoActivo) return;
  audioMusica.volume = 0.4;
  audioMusica.play().catch(() => { /* requiere interacción del usuario, ya la tuvimos */ });
}

btnSonido.addEventListener('click', () => {
  estado.sonidoActivo = !estado.sonidoActivo;

  if (estado.sonidoActivo) {
    btnSonido.style.background = '';
    btnSonido.style.color = '';
    iconoNota.style.opacity = '1';
    audioMusica.muted = false;
    intentarReproducirMusica();
  } else {
    btnSonido.style.background = '#08707d';
    btnSonido.style.color = '#fff';
    iconoNota.style.opacity = '1';
    audioMusica.muted = true;
  }
});

// ============================================================
//  ARRANQUE DEL JUEGO
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  iniciarCarga();
});
