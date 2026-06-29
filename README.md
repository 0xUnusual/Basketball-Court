# 🏀 Basketball Court

Una aplicación web interactiva premium de nivel profesional (SPA) diseñada para la gestión rápida y dinámica de partidos de baloncesto callejero o ligas amateurs. 

Con una regla clara: **"el equipo ganador se queda en cancha y el perdedor va al final de la cola"**.

---

## ✨ Características Principales

*   **📋 Registro & Gestión de Asistencia:**
    *   Añade jugadores con solo escribir su nombre y pulsar `Enter` o el botón `+`.
    *   Lista de espera ordenada en tiempo real con numeración de posiciones.
    *   Marcado especial (color dorado) para los próximos 3 jugadores que entrarán a la cancha.
    *   Estados interactivos en vivo: **Esperando** y **Jugando**.

*   **⚡ Generador de Quintetos Automático:**
    *   Genera partidos 5vs5 al presionar "Generar Partido".
    *   Adaptable: Si hay entre 6 y 9 jugadores, genera partidos de tamaños equilibrados (por ejemplo, 3vs3 o 4vs4).

*   **🏀 Cancha Virtual & Marcador Premium:**
    *   Visualización interactiva de los equipos actuales en juego.
    *   Cronómetro de partido con controles manuales integrados de **Pausa**, **Reanudar** y **Reset**.
    *   **Registro de Anotación Individual:** Botones de `+1`, `+2` y `+3` junto al nombre de cada jugador. Los puntos individuales se suman al marcador global del equipo al instante.
    *   Indicador visual de **Equipo Defensor** (ganador del partido anterior) y **Equipo Retador**.

*   **⏱️ Reloj de Partido & Cuenta Regresiva:**
    *   Botones de preselección para programar **cuenta regresiva** de **10m**, **12m**, **1m** y **10s**.
    *   Botones de ajuste manual (`+1m` y `+10s`) para añadir o restaurar tiempo sobre la marcha.
    *   Alerta visual crítica: El cronómetro late y brilla en rojo neón cuando la cuenta regresiva es de menos de 10 segundos.

*   **⏱️ Reloj de Posesión (Shot Clock):**
    *   Reloj de posesión de 24 y 14 segundos integrado para arbitraje rápido.
    *   **Activación condicional**: Inicia apagado (`--`) y no descuenta segundos hasta que se establezca explícitamente (`24s` o `14s`).
    *   Detiene automáticamente el cronómetro principal al expirar la posesión con una alerta visual.
    *   Parpadeo de advertencia en rojo cuando queden 5 segundos o menos de posesión.

*   **🔄 Sistema de Sustituciones (Cambios en cancha):**
    *   Botón integrado (`🔄`) junto a cada jugador activo en cancha.
    *   Modal interactivo para elegir un reemplazo entre los jugadores de la cola de espera.
    *   El jugador saliente se reincorpora automáticamente al final de la cola.

*   **📤 Compartir Resumen del Día (WhatsApp):**
    *   Botón `📤 Resumen` en el panel de Historial.
    *   Genera un reporte del día formateado con emojis para copiar al portapapeles.
    *   Incluye total de partidos, marcadores detallados, y calcula el **MVP del Día** (el jugador con más puntos totales acumulados en la jornada).
    *   Redirección directa a WhatsApp para compartir con tu grupo de juego.

*   **🔴 Gestión de Faltas & Sistema de BONUS:**
    *   Control de faltas del equipo (`-` / `+`).
    *   Cuando un equipo acumula **5 faltas o más**, la tarjeta del equipo se tiñe de color rojo resplandeciente y se activa un aviso parpadeante de **BONUS** (situación de penalización).

*   **📊 Historial Detallado de Partidos:**
    *   Muestra un registro permanente de todos los partidos completados del día en orden inverso (el más reciente al inicio).
    *   Detalla los marcadores finales, los máximos anotadores (top scorers) de cada partido, la duración del partido y la hora de finalización.

*   **🏆 Modo Torneo & Box Score Detallado:**
    *   **Rosters de Equipos Independientes**: Apartados separados para dos equipos con nombres totalmente editables directamente en el DOM.
    *   **Identificación por Camiseta**: Asignación opcional del número de camiseta al agregar jugadores (mostrando un badge `#N`).
    *   **Registro Tardío**: Formulario rápido "+ Jugador" en el Box Score para dar de alta a jugadores que lleguen tarde.
    *   **Cálculo de Tiros y Efectividad Separada**: Controles independientes para tiros de 2 puntos (`+2 ✅` / `2PT ❌`) y 3 puntos (`+3 ✅` / `3PT ❌`) con cálculo automático de porcentajes de efectividad en tiempo real (2PT% y 3PT%).
    *   **Control Preciso de Minutos y Segundos (MM:SS)**: Registro automático del tiempo de juego de cada basquetbolista en base a si está en cancha (`🟢 Cancha`) o banca (`🪑 Banca`).
    *   **Reloj de Torneo Independiente**: Cronómetro y shot clock específicos para el modo torneo.
    *   **Exportación Premium (PDF / Impresión)**: Generador interactivo de reportes en HTML con un diseño dark-mode estilizado e impresión adaptada (`@media print` optimizado para PDF) y copiado rápido al portapapeles.
    *   **Historiales Separados**: Historial limpio que filtra y muestra solo los partidos correspondientes al modo de juego activo.

*   **📱 Diseño 100% Responsivo (Responsive Design):**
    *   Optimizada para cualquier dispositivo: Teléfonos inteligentes, tablets y computadoras de escritorio.
    *   **Menú de Navegación Móvil (Bottom Tab Bar)**: En pantallas pequeñas, el diseño se divide en pestañas intuitivas en la parte inferior para alternar de forma fluida entre la lista de espera, el panel de juego (Cancha) y el historial.
    *   **Tablas Scrollables**: Las amplias tablas del Box Score cuentan con desplazamiento horizontal adaptado a pantallas de móviles para no romper la fluidez del diseño.
    *   **Ocultación de Paneles Dinámica**: Durante un partido de torneo activo, los paneles laterales se ocultan y la cancha se expande al 100% del ancho para máxima legibilidad.

*   **🌓 Selector de Tema Claro / Oscuro:**
    *   Alterna entre un diseño futurista en modo oscuro con acentos de luces de neón naranja, y un modo claro limpio y estilizado con alta visibilidad al aire libre.
    *   Guarda tu preferencia automáticamente.

*   **💾 Persistencia Local Automática (`localStorage`):**
    *   Todo el estado de la aplicación (lista de asistencia, partido actual, marcador, reloj, historial y tema seleccionado) se guarda automáticamente en tu navegador. Si recargas la pestaña por accidente, nada se pierde.

---

## 🛠️ Tecnologías Utilizadas

*   **HTML5:** Estructura semántica moderna.
*   **Vanilla CSS:** Estilos personalizados avanzados, diseño glassmorphism, variables dinámicas para modo oscuro/claro, micro-animaciones fluidas y diseño responsivo adaptado a móviles.
*   **Vanilla JavaScript (ES6+):** Gestión de estado reactivo, cronómetros individuales paralelos y exportación dinámica.

---

## 🚀 Instalación y Uso Rápido

La aplicación es completamente portable y autocontenida. No requiere de servidores web complejos ni de herramientas de compilación.

1. Descarga el repositorio o los archivos `index.html`, `styles.css` y `app.js` en una sola carpeta.
2. Haz **doble clic en `index.html`** para abrirlo en cualquier navegador web moderno.
3. ¡Listo! Comienza a agregar jugadores y a disfrutar del juego.

---

## 📐 Lógica del Sistema de Rotación

Cuando un partido finaliza y registras al ganador:
1. El equipo **ganador permanece en la cancha** y pasa al estado **Defensor** (manteniendo su composición de jugadores).
2. Los integrantes del equipo **perdedor son retirados de la cancha** y enviados automáticamente al **final de la cola de espera**, preservando el orden de llegada de los demás.
3. Se seleccionan los siguientes jugadores de la parte superior de la lista de asistencia para conformar el nuevo equipo **Retador**.

---

Desarrollado con pasión por el baloncesto 🏀.
