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

*   **🔴 Gestión de Faltas & Sistema de BONUS:**
    *   Control de faltas del equipo (`-` / `+`).
    *   Cuando un equipo acumula **5 faltas o más**, la tarjeta del equipo se tiñe de color rojo resplandeciente y se activa un aviso parpadeante de **BONUS** (situación de penalización).

*   **📊 Historial Detallado de Partidos:**
    *   Muestra un registro permanente de todos los partidos completados del día en orden inverso (el más reciente al inicio).
    *   Detalla los marcadores finales, los máximos anotadores (top scorers) de cada partido, la duración del partido y la hora de finalización.

*   **🌓 Selector de Tema Claro / Oscuro:**
    *   Alterna entre un diseño futurista en modo oscuro con acentos de luces de neón naranja, y un modo claro limpio y estilizado con alta visibilidad al aire libre.
    *   Guarda tu preferencia automáticamente.

*   **💾 Persistencia Local Automática (`localStorage`):**
    *   Todo el estado de la aplicación (lista de asistencia, partido actual, marcador, reloj, historial y tema seleccionado) se guarda automáticamente en tu navegador. Si recargas la pestaña por accidente, nada se pierde.

---

## 🛠️ Tecnologías Utilizadas

*   **HTML5:** Estructura semántica moderna.
*   **Vanilla CSS:** Estilos personalizados avanzados, diseño glassmorphism, variables dinámicas para modo oscuro/claro y micro-animaciones fluidas.
*   **Vanilla JavaScript (ES6+):** Gestión de estado reactivo y algoritmos de cola sin frameworks ni dependencias externas.

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
