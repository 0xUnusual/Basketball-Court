/**
 * Basketball Court - App Logic
 * ============================================================
 * Estado del app:
 *   players        → todos los jugadores registrados hoy (con stats)
 *   queue          → cola ordenada de jugadores esperando
 *   teamA          → quinteto A en cancha (Modo Recreativo)
 *   teamB          → quinteto B en cancha (Modo Recreativo)
 *   scoreA/B       → puntos totales equipo A/B en partido actual
 *   playerScores   → { playerName: pts } del partido actual (Recreativo)
 *   matchHistory   → historial de partidos del día
 *   matchCount     → número de partido actual
 *   teamAIsDefender→ si el Equipo A es el defensor (ganó el anterior)
 *   timerInterval  → referencia al timer del partido
 *   timerSeconds   → segundos del cronómetro
 *   gameMode       → 'recreational' | 'tournament'
 *   tournamentTeamAName / tournamentTeamBName → nombres editables de equipos
 *   tournamentTeams → { a: [], b: [] } lista de jugadores por equipo
 *   tournamentStats → { playerName: { pts, min, reb, ast, stl, blk, tov, fouls, fgm, fga, onCourt } }
 *   tournamentMatchActive → si hay partido de torneo en curso
 *   tournamentScoreA/B → puntos del partido de torneo
 *   tTimerSeconds / tTimerRunning → timer exclusivo del torneo
 *   tShotClockSeconds / tShotClockActive → shot clock del torneo
 *   tIsCountdown → si el reloj de torneo hace cuenta regresiva
 */

/* ============================================================
   ESTADO GLOBAL
   ============================================================ */
const state = {
  // ---- Recreativo ----
  players:          [],
  queue:            [],
  teamA:            [],
  teamB:            [],
  scoreA:           0,
  scoreB:           0,
  foulsA:           0,
  foulsB:           0,
  playerScores:     {},
  matchHistory:     [],
  matchCount:       0,
  teamAIsDefender:  false,
  timerInterval:    null,
  timerSeconds:     0,
  timerRunning:     false,
  matchActive:      false,
  theme:            'dark',
  isCountdown:      false,
  shotClockSeconds: 24,
  shotClockActive:  false,

  // ---- Torneo ----
  gameMode:              'recreational',
  tournamentTeamAName:   'Equipo A',
  tournamentTeamBName:   'Equipo B',
  tournamentTeams:       { a: [], b: [] },
  tournamentJerseys:     {},         // { playerName: jerseyNumber }
  tournamentStats:       {},         // { playerName: { pts, min, reb, ast, stl, blk, tov, fouls, fgm, fga, onCourt, secOnCourt } }
  tournamentMatchActive: false,
  tournamentScoreA:      0,
  tournamentScoreB:      0,
  tournamentMatchCount:  0,
  tTimerInterval:        null,
  tTimerSeconds:         0,
  tTimerRunning:         false,
  tIsCountdown:          false,
  tShotClockSeconds:     24,
  tShotClockActive:      false,
  playerMinInterval:     null,       // intervalo para actualizar minutos en cancha
};

/* ============================================================
   STORAGE
   ============================================================ */
const STORAGE_KEY = 'basketball_court_state';

function saveState() {
  const toSave = {
    players:              state.players,
    queue:                state.queue,
    teamA:                state.teamA,
    teamB:                state.teamB,
    scoreA:               state.scoreA,
    scoreB:               state.scoreB,
    foulsA:               state.foulsA,
    foulsB:               state.foulsB,
    playerScores:         state.playerScores,
    matchHistory:         state.matchHistory,
    matchCount:           state.matchCount,
    teamAIsDefender:      state.teamAIsDefender,
    timerSeconds:         state.timerSeconds,
    timerRunning:         state.timerRunning,
    matchActive:          state.matchActive,
    theme:                state.theme,
    isCountdown:          state.isCountdown,
    shotClockSeconds:     state.shotClockSeconds,
    shotClockActive:      state.shotClockActive,
    // Torneo
    gameMode:             state.gameMode,
    tournamentTeamAName:  state.tournamentTeamAName,
    tournamentTeamBName:  state.tournamentTeamBName,
    tournamentTeams:      state.tournamentTeams,
    tournamentJerseys:    state.tournamentJerseys,
    tournamentStats:      state.tournamentStats,
    tournamentMatchActive:state.tournamentMatchActive,
    tournamentScoreA:     state.tournamentScoreA,
    tournamentScoreB:     state.tournamentScoreB,
    tournamentMatchCount: state.tournamentMatchCount,
    tTimerSeconds:        state.tTimerSeconds,
    tTimerRunning:        state.tTimerRunning,
    tIsCountdown:         state.tIsCountdown,
    tShotClockSeconds:    state.tShotClockSeconds,
    tShotClockActive:     state.tShotClockActive,
  };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave)); } catch(e) {}
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    Object.assign(state, saved);
    // Asegurar que tournamentTeams exista con la forma correcta
    if (!state.tournamentTeams || !state.tournamentTeams.a) {
      state.tournamentTeams = { a: [], b: [] };
    }
    if (!state.tournamentStats)   state.tournamentStats = {};
    if (!state.tournamentJerseys) state.tournamentJerseys = {};
  } catch(e) {}
}

/* ============================================================
   UTILITY
   ============================================================ */
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function formatTime(secs) {
  const m = String(Math.floor(secs / 60)).padStart(2, '0');
  const s = String(secs % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function now() {
  return new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' });
}

function playerKey(name) {
  return name.replace(/\s+/g, '_');
}

/* ============================================================
   TOAST
   ============================================================ */
function showToast(msg, type = 'info', duration = 3000) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toast-out 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/* ============================================================
   CONFETTI
   ============================================================ */
function launchConfetti() {
  const container = document.getElementById('confetti-container');
  const colors = ['#FF6B1A','#FFD700','#4ECDC4','#FF6B6B','#fff','#a78bfa'];
  for (let i = 0; i < 120; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + 'vw';
    piece.style.top = '-12px';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.width  = (Math.random() * 10 + 6) + 'px';
    piece.style.height = (Math.random() * 10 + 6) + 'px';
    piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    piece.style.animationDelay    = (Math.random() * 1.5) + 's';
    piece.style.animationDuration = (Math.random() * 1.5 + 1.5) + 's';
    container.appendChild(piece);
  }
  setTimeout(() => { container.innerHTML = ''; }, 4000);
}

/* ============================================================
   PARTICLES BACKGROUND
   ============================================================ */
function initParticles() {
  const container = document.getElementById('particles');
  for (let i = 0; i < 18; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 8 + 3;
    p.style.width  = size + 'px';
    p.style.height = size + 'px';
    p.style.left   = Math.random() * 100 + 'vw';
    p.style.background = Math.random() > 0.5
      ? 'rgba(255,107,26,0.6)'
      : 'rgba(78,205,196,0.6)';
    p.style.animationDuration = (Math.random() * 20 + 12) + 's';
    p.style.animationDelay   = (Math.random() * 10) + 's';
    container.appendChild(p);
  }
}

/* ============================================================
   TIMER (Modo Recreativo)
   ============================================================ */
function startTimer(resetSeconds = true) {
  if (resetSeconds) {
    state.timerSeconds = 0;
    state.isCountdown = false;
    state.shotClockSeconds = 24;
    state.shotClockActive = false;
  }
  clearInterval(state.timerInterval);
  state.timerRunning = true;
  updateTimerUI();
  updateShotClockUI();
  updateMatchTimerUI();
  
  state.timerInterval = setInterval(() => {
    if (state.isCountdown) {
      if (state.timerSeconds > 0) state.timerSeconds--;
      if (state.timerSeconds <= 0) {
        state.timerSeconds = 0;
        stopTimer();
        showToast('⏳ ¡Tiempo de juego finalizado!', 'info', 5000);
      }
    } else {
      state.timerSeconds++;
    }
    if (state.shotClockActive && state.shotClockSeconds > 0) {
      state.shotClockSeconds--;
      if (state.shotClockSeconds <= 0) {
        state.shotClockSeconds = 0;
        state.shotClockActive = false;
        stopTimer();
        showToast('⏱️ ¡Violación de Posesión (24s)!', 'error', 4000);
      }
    }
    updateShotClockUI();
    updateMatchTimerUI();
  }, 1000);
}

function stopTimer() {
  clearInterval(state.timerInterval);
  state.timerInterval = null;
  state.timerRunning = false;
  updateTimerUI();
}

function updateTimerUI() {
  const toggleBtn = document.getElementById('btn-timer-toggle');
  if (toggleBtn) {
    toggleBtn.innerHTML = state.timerRunning ? '⏸️ Pausa' : '▶️ Reanudar';
  }
}

function toggleTimer() {
  if (!state.matchActive) return;
  if (state.timerRunning) { stopTimer(); } else { startTimer(false); }
  saveState();
}

function resetTimer() {
  if (!state.matchActive) return;
  state.timerSeconds = 0;
  state.isCountdown = false;
  state.shotClockSeconds = 24;
  state.shotClockActive = false;
  updateShotClockUI();
  updateMatchTimerUI();
  saveState();
}

function setPresetTimer(seconds) {
  if (!state.matchActive) {
    showToast('Inicia un partido antes de programar el reloj', 'error');
    return;
  }
  state.timerSeconds = seconds;
  state.isCountdown = true;
  state.shotClockSeconds = 24;
  state.shotClockActive = false;
  updateShotClockUI();
  updateMatchTimerUI();
  saveState();
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  showToast(`⏱️ Cuenta atrás programada a ${m > 0 ? m + 'm' : s + 's'}`, 'success');
}

function adjustTimerTime(secondsToAdd) {
  if (!state.matchActive) {
    showToast('Inicia un partido antes de ajustar el reloj', 'error');
    return;
  }
  state.timerSeconds = Math.max(0, state.timerSeconds + secondsToAdd);
  updateMatchTimerUI();
  saveState();
  showToast(`⏱️ Tiempo ajustado: ${secondsToAdd > 0 ? '+' : ''}${secondsToAdd}s`, 'info');
}

function resetShotClock(seconds) {
  if (!state.matchActive) {
    showToast('Inicia un partido antes de reiniciar posesión', 'error');
    return;
  }
  state.shotClockSeconds = seconds;
  state.shotClockActive = true;
  updateShotClockUI();
  saveState();
  showToast(`🏀 Posesión iniciada a ${seconds}s`, 'success');
}

function updateShotClockUI() {
  const el = document.getElementById('shot-clock');
  if (el) {
    if (state.shotClockActive) {
      el.textContent = state.shotClockSeconds;
      el.classList.remove('inactive');
    } else {
      el.textContent = state.shotClockSeconds === 0 ? '0' : '--';
      el.classList.add('inactive');
    }
    if (state.shotClockActive && state.shotClockSeconds <= 5) {
      el.classList.add('critical');
    } else {
      el.classList.remove('critical');
    }
  }
}

function updateMatchTimerUI() {
  const el = document.getElementById('match-timer');
  if (el) {
    el.textContent = formatTime(state.timerSeconds);
    if (state.isCountdown && state.timerSeconds <= 10 && state.timerSeconds > 0) {
      el.classList.add('timer-critical');
    } else {
      el.classList.remove('timer-critical');
    }
  }
}

/* ============================================================
   TIMER TORNEO
   ============================================================ */
function tStartTimer(resetSeconds = true) {
  if (resetSeconds) {
    state.tTimerSeconds = 0;
    state.tIsCountdown = false;
    state.tShotClockSeconds = 24;
    state.tShotClockActive = false;
  }
  clearInterval(state.tTimerInterval);
  state.tTimerRunning = true;
  tUpdateTimerUI();
  tUpdateShotClockUI();
  tUpdateMatchTimerUI();
  state.tTimerInterval = setInterval(() => {
    if (state.tIsCountdown) {
      if (state.tTimerSeconds > 0) state.tTimerSeconds--;
      if (state.tTimerSeconds <= 0) {
        state.tTimerSeconds = 0;
        tStopTimer();
        showToast('⏳ ¡Tiempo de torneo finalizado!', 'info', 5000);
      }
    } else {
      state.tTimerSeconds++;
    }
    if (state.tShotClockActive && state.tShotClockSeconds > 0) {
      state.tShotClockSeconds--;
      if (state.tShotClockSeconds <= 0) {
        state.tShotClockSeconds = 0;
        state.tShotClockActive = false;
        tStopTimer();
        showToast('⏱️ ¡Violación de Posesión (24s)!', 'error', 4000);
      }
    }
    tUpdateShotClockUI();
    tUpdateMatchTimerUI();
  }, 1000);
}

function tStopTimer() {
  clearInterval(state.tTimerInterval);
  state.tTimerInterval = null;
  state.tTimerRunning = false;
  tUpdateTimerUI();
}

function tUpdateTimerUI() {
  const el = document.getElementById('t-btn-timer-toggle');
  if (el) el.innerHTML = state.tTimerRunning ? '⏸️ Pausa' : '▶️ Reanudar';
}

function tToggleTimer() {
  if (!state.tournamentMatchActive) return;
  if (state.tTimerRunning) { tStopTimer(); } else { tStartTimer(false); }
  saveState();
}

function tResetTimer() {
  if (!state.tournamentMatchActive) return;
  state.tTimerSeconds = 0;
  state.tIsCountdown = false;
  state.tShotClockSeconds = 24;
  state.tShotClockActive = false;
  tUpdateShotClockUI();
  tUpdateMatchTimerUI();
  saveState();
}

function tSetPresetTimer(seconds) {
  if (!state.tournamentMatchActive) { showToast('Inicia un partido de torneo primero', 'error'); return; }
  state.tTimerSeconds = seconds;
  state.tIsCountdown = true;
  state.tShotClockSeconds = 24;
  state.tShotClockActive = false;
  tUpdateShotClockUI();
  tUpdateMatchTimerUI();
  saveState();
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  showToast(`⏱️ Cuenta atrás programada a ${m > 0 ? m + 'm' : s + 's'}`, 'success');
}

function tAdjustTimerTime(secondsToAdd) {
  if (!state.tournamentMatchActive) { showToast('Inicia un partido de torneo primero', 'error'); return; }
  state.tTimerSeconds = Math.max(0, state.tTimerSeconds + secondsToAdd);
  tUpdateMatchTimerUI();
  saveState();
  showToast(`⏱️ Tiempo ajustado: ${secondsToAdd > 0 ? '+' : ''}${secondsToAdd}s`, 'info');
}

function tResetShotClock(seconds) {
  if (!state.tournamentMatchActive) { showToast('Inicia un partido de torneo primero', 'error'); return; }
  state.tShotClockSeconds = seconds;
  state.tShotClockActive = true;
  tUpdateShotClockUI();
  saveState();
  showToast(`🏀 Posesión iniciada a ${seconds}s`, 'success');
}

function tUpdateShotClockUI() {
  const el = document.getElementById('t-shot-clock');
  if (el) {
    if (state.tShotClockActive) {
      el.textContent = state.tShotClockSeconds;
      el.classList.remove('inactive');
    } else {
      el.textContent = state.tShotClockSeconds === 0 ? '0' : '--';
      el.classList.add('inactive');
    }
    if (state.tShotClockActive && state.tShotClockSeconds <= 5) {
      el.classList.add('critical');
    } else {
      el.classList.remove('critical');
    }
  }
}

function tUpdateMatchTimerUI() {
  const el = document.getElementById('t-match-timer');
  if (el) {
    el.textContent = formatTime(state.tTimerSeconds);
    if (state.tIsCountdown && state.tTimerSeconds <= 10 && state.tTimerSeconds > 0) {
      el.classList.add('timer-critical');
    } else {
      el.classList.remove('timer-critical');
    }
  }
}

/* ============================================================
   MINUTOS EN CANCHA (Torneo)
   Cada segundo verifica cuáles jugadores están onCourt y aumenta secOnCourt
   ============================================================ */
function startPlayerMinInterval() {
  clearInterval(state.playerMinInterval);
  state.playerMinInterval = setInterval(() => {
    if (!state.tournamentMatchActive) return;
    let changed = false;
    Object.entries(state.tournamentStats).forEach(([name, stats]) => {
      if (stats.onCourt) {
        stats.secOnCourt = (stats.secOnCourt || 0) + 1;
        stats.min = Math.floor(stats.secOnCourt / 60);
        changed = true;
      }
    });
    if (changed) {
      updateBoxScoreMinutesUI();
      // No guardar cada segundo para no saturar localStorage — guardar cada 10s
    }
  }, 1000);
}

function stopPlayerMinInterval() {
  clearInterval(state.playerMinInterval);
  state.playerMinInterval = null;
}

/** Formatea segundos totales en cancha a MM:SS */
function formatMinSec(totalSec) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

/** Actualiza solo la celda de minutos (MM:SS) sin re-render completo */
function updateBoxScoreMinutesUI() {
  Object.entries(state.tournamentStats).forEach(([name, stats]) => {
    const key = playerKey(name);
    const minEl = document.getElementById(`bs-min-${key}`);
    if (minEl) minEl.textContent = formatMinSec(stats.secOnCourt || 0);
  });
}

/* ============================================================
   THEME TOGGLER
   ============================================================ */
function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  saveState();
  applyTheme();
}

function applyTheme() {
  const btn = document.getElementById('btn-theme-toggle');
  const icon = btn ? btn.querySelector('.theme-icon') : null;
  const text = btn ? btn.querySelector('.theme-text') : null;
  if (state.theme === 'light') {
    document.body.classList.add('light-theme');
    if (icon) icon.textContent = '🌙';
    if (text) text.textContent = 'Oscuro';
  } else {
    document.body.classList.remove('light-theme');
    if (icon) icon.textContent = '☀️';
    if (text) text.textContent = 'Claro';
  }
}

/* ============================================================
   GAME MODE TOGGLE
   ============================================================ */
function setGameMode(mode) {
  state.gameMode = mode;
  saveState();
  applyGameMode();
}

function applyGameMode() {
  const panelQueue      = document.getElementById('panel-queue');
  const panelTournament = document.getElementById('panel-tournament');
  const panelCourt      = document.getElementById('panel-court');
  const btnRec          = document.getElementById('btn-mode-recreational');
  const btnTour         = document.getElementById('btn-mode-tournament');
  const navQueue        = document.getElementById('mobile-nav-queue');
  const navTournament   = document.getElementById('mobile-nav-tournament');

  if (state.gameMode === 'tournament') {
    panelQueue.classList.remove('active-tab');
    panelTournament.classList.add('active-tab');
    btnRec.classList.remove('active');
    btnTour.classList.add('active');
    if (navQueue)      navQueue.style.display = 'none';
    if (navTournament) navTournament.style.display = 'flex';
    
    // Sync mobile nav active state
    document.querySelectorAll('.mobile-nav-btn').forEach(b => b.classList.remove('active'));
    if (navTournament) navTournament.classList.add('active');
    
    // Ocultar panel de cancha si no hay partido de torneo activo
    if (panelCourt) {
      if (state.tournamentMatchActive) {
        panelCourt.style.display = 'flex';
      } else {
        panelCourt.style.display = 'none';
      }
    }
    
    // Restaurar nombre de equipos en los inputs
    const nameA = document.getElementById('tournament-team-a-name');
    const nameB = document.getElementById('tournament-team-b-name');
    if (nameA) nameA.value = state.tournamentTeamAName;
    if (nameB) nameB.value = state.tournamentTeamBName;
  } else {
    panelTournament.classList.remove('active-tab');
    panelQueue.classList.add('active-tab');
    btnTour.classList.remove('active');
    btnRec.classList.add('active');
    if (navQueue)      navQueue.style.display = 'flex';
    if (navTournament) navTournament.style.display = 'none';
    if (panelCourt)    panelCourt.style.display = 'flex'; // siempre visible en recreativo
    
    // Sync mobile nav active state
    document.querySelectorAll('.mobile-nav-btn').forEach(b => b.classList.remove('active'));
    if (navQueue) navQueue.classList.add('active');
  }

  renderCourt();
  renderTournamentCourt();
  renderTournamentRosters();
  renderHistory(); // Re-renderizar historial para filtrar según modo activo
}

/* ============================================================
   RENDER QUEUE LIST (Modo Recreativo)
   ============================================================ */
function renderQueue() {
  const list     = document.getElementById('queue-list');
  const emptyEl  = document.getElementById('queue-empty');
  const badgeEl  = document.getElementById('badge-queue');
  const hdrQueue = document.getElementById('hdr-queue');
  const hdrTotal = document.getElementById('hdr-total');
  const btnGen   = document.getElementById('btn-generate-match');
  const hint     = document.getElementById('generate-hint');

  const onCourt = [...state.teamA, ...state.teamB];
  const waiting = state.queue.filter(p => !onCourt.includes(p));

  list.innerHTML = '';

  if (state.queue.length === 0) {
    if (emptyEl) emptyEl.style.display = 'flex';
  } else {
    if (emptyEl) emptyEl.style.display = 'none';
    state.queue.forEach((player, idx) => {
      const isOnCourt = onCourt.includes(player);
      const item = document.createElement('div');
      item.className = 'queue-item' + (isOnCourt ? ' on-court' : '');
      item.dataset.player = player;

      const pos = document.createElement('div');
      pos.className = 'q-position' + (idx < 3 ? ' top3' : '');
      pos.textContent = idx + 1;

      const name = document.createElement('div');
      name.className = 'q-name';
      name.textContent = player;

      const status = document.createElement('div');
      status.className = 'q-status' + (isOnCourt ? ' playing' : '');
      status.textContent = isOnCourt ? 'Jugando' : 'Esperando';

      const removeBtn = document.createElement('button');
      removeBtn.className = 'q-remove';
      removeBtn.title = 'Quitar de la lista';
      removeBtn.innerHTML = '✕';
      removeBtn.addEventListener('click', () => removeFromQueue(player));
      if (isOnCourt) removeBtn.style.display = 'none';

      item.appendChild(pos);
      item.appendChild(name);
      item.appendChild(status);
      item.appendChild(removeBtn);
      list.appendChild(item);
    });
  }

  badgeEl.textContent  = waiting.length;
  hdrQueue.textContent = waiting.length;
  hdrTotal.textContent = state.players.length;

  const canGeneratePartial = !state.matchActive && waiting.length >= 6;
  btnGen.disabled = !canGeneratePartial;

  if (state.matchActive) {
    hint.textContent = 'Partido en curso – finaliza el partido actual';
  } else if (waiting.length < 6) {
    hint.textContent = `Necesitas al menos 6 jugadores (tienes ${waiting.length})`;
  } else if (waiting.length < 10) {
    hint.textContent = `Con ${waiting.length} jugadores: se generará un ${Math.floor(waiting.length/2)}vs${Math.ceil(waiting.length/2)}`;
  } else {
    hint.textContent = `¡Listo! ${waiting.length} jugadores disponibles → generará 5vs5`;
  }

  updateHeaderMatchCount();
}

/* ============================================================
   RENDER COURT (Modo Recreativo)
   ============================================================ */
function renderCourt() {
  const courtIdle      = document.getElementById('court-idle');
  const courtActive    = document.getElementById('court-active');
  const courtTournament = document.getElementById('court-tournament');

  if (state.gameMode === 'tournament') {
    courtIdle.style.display    = 'none';
    courtActive.style.display  = 'none';
    // court-tournament se controla en renderTournamentCourt
    return;
  }

  if (!state.matchActive) {
    courtIdle.style.display    = 'flex';
    courtActive.style.display  = 'none';
    courtTournament.style.display = 'none';
    return;
  }

  courtIdle.style.display    = 'none';
  courtActive.style.display  = 'flex';
  courtTournament.style.display = 'none';

  document.getElementById('match-number').textContent = `#${state.matchCount}`;
  document.getElementById('score-a').textContent = state.scoreA;
  document.getElementById('score-b').textContent = state.scoreB;
  document.getElementById('match-timer').textContent = formatTime(state.timerSeconds);
  document.getElementById('score-name-a').textContent = 'Equipo A';
  document.getElementById('score-name-b').textContent = 'Equipo B';

  const defBadge = document.getElementById('defender-badge');
  const cardA    = document.getElementById('team-card-a');
  const cardB    = document.getElementById('team-card-b');
  const tagA     = cardA.querySelector('.team-tag');
  const tagB     = cardB.querySelector('.team-tag');

  if (state.matchCount === 1) {
    defBadge.style.display = 'none';
    tagA.textContent = 'EQUIPO A';
    tagB.textContent = 'EQUIPO B';
  } else {
    defBadge.style.display = 'flex';
    if (state.teamAIsDefender) {
      tagA.textContent = '🏆 DEFENSOR';
      tagB.textContent = '⚡ RETADOR';
    } else {
      tagA.textContent = '⚡ RETADOR';
      tagB.textContent = '🏆 DEFENSOR';
    }
  }

  updateFoulsUI();
  updateTimerUI();
  updateShotClockUI();
  updateMatchTimerUI();
  renderPlayerScoreList('team-a-players', state.teamA, 'a');
  renderPlayerScoreList('team-b-players', state.teamB, 'b');
}

function adjustFouls(team, delta) {
  if (!state.matchActive) return;
  if (team === 'a') {
    state.foulsA = Math.max(0, state.foulsA + delta);
  } else {
    state.foulsB = Math.max(0, state.foulsB + delta);
  }
  saveState();
  updateFoulsUI();
}

function updateFoulsUI() {
  const foulCountAEl = document.getElementById('foul-count-a');
  const foulCountBEl = document.getElementById('foul-count-b');
  const cardA = document.getElementById('team-card-a');
  const cardB = document.getElementById('team-card-b');

  if (foulCountAEl) foulCountAEl.textContent = state.foulsA;
  if (foulCountBEl) foulCountBEl.textContent = state.foulsB;

  if (cardA) cardA.classList.toggle('bonus-active', state.foulsA >= 5);
  if (cardB) cardB.classList.toggle('bonus-active', state.foulsB >= 5);
}

function renderPlayerScoreList(containerId, players, team) {
  const ul = document.getElementById(containerId);
  ul.innerHTML = '';
  players.forEach(player => {
    const pts = state.playerScores[player] || 0;
    const li  = document.createElement('li');
    li.className = 'player-score-item';
    li.id = `psi-${playerKey(player)}`;

    const nameEl = document.createElement('div');
    nameEl.className = 'psi-name';
    nameEl.textContent = player;

    const ptsEl = document.createElement('div');
    ptsEl.className = 'psi-pts';
    ptsEl.id = `pts-${playerKey(player)}`;
    ptsEl.innerHTML = `${pts}<span> pts</span>`;

    const btns = document.createElement('div');
    btns.className = 'score-btns';
    [1, 2, 3].forEach(val => {
      const btn = document.createElement('button');
      btn.className = 'btn-score';
      btn.textContent = `+${val}`;
      btn.addEventListener('click', () => addPoints(player, team, val));
      btns.appendChild(btn);
    });

    const swapBtn = document.createElement('button');
    swapBtn.className = 'btn-swap-player';
    swapBtn.title = 'Sustituir jugador';
    swapBtn.innerHTML = '🔄';
    swapBtn.addEventListener('click', () => promptSubstitution(player, team));

    li.appendChild(swapBtn);
    li.appendChild(nameEl);
    li.appendChild(ptsEl);
    li.appendChild(btns);
    ul.appendChild(li);
  });
}

function promptSubstitution(playerOut, team) {
  const onCourt = [...state.teamA, ...state.teamB];
  const waiting = state.queue.filter(p => !onCourt.includes(p));
  if (waiting.length === 0) {
    showToast('No hay jugadores en espera en la lista de asistencia', 'error');
    return;
  }
  const dialog = document.createElement('div');
  dialog.className = 'modal-overlay sub-modal';
  dialog.style.zIndex = '1010';
  dialog.innerHTML = `
    <div class="modal-card">
      <div class="modal-trophy">🔄</div>
      <h2 class="modal-title" style="font-size: 1.6rem; margin-bottom: 8px;">Sustituir Jugador</h2>
      <p class="modal-sub">Selecciona quién entrará a la cancha en reemplazo de <strong>${playerOut}</strong>:</p>
      <div class="sub-players-list">
        ${waiting.map(p => `<button class="btn-sub-select" data-player="${p}">${p}</button>`).join('')}
      </div>
      <button class="btn-modal-cancel" style="margin-top: 16px; background: rgba(255,255,255,0.05); border: 1px solid var(--border); color: var(--text-secondary); width: 100%; padding: 12px 20px; border-radius: var(--radius-md); font-weight: 700; cursor: pointer; transition: var(--transition);">
        Cancelar
      </button>
    </div>
  `;
  document.body.appendChild(dialog);
  dialog.querySelectorAll('.btn-sub-select').forEach(btn => {
    btn.addEventListener('click', (e) => {
      performSubstitution(playerOut, e.target.dataset.player, team);
      dialog.remove();
    });
  });
  dialog.querySelector('.btn-modal-cancel').addEventListener('click', () => dialog.remove());
}

function performSubstitution(playerOut, playerIn, team) {
  if (team === 'a') {
    state.teamA = state.teamA.map(p => p === playerOut ? playerIn : p);
  } else {
    state.teamB = state.teamB.map(p => p === playerOut ? playerIn : p);
  }
  if (!(playerIn in state.playerScores)) state.playerScores[playerIn] = 0;
  state.queue = state.queue.filter(p => p !== playerIn);
  state.queue.push(playerOut);
  saveState();
  renderQueue();
  renderCourt();
  showToast(`🔄 ${playerIn} ha ingresado por ${playerOut}`, 'success');
}

/* ============================================================
   TOURNAMENT ROSTER MANAGEMENT
   ============================================================ */
function addTournamentPlayer(name, team, jerseyNumber) {
  const trimmed = name.trim();
  if (!trimmed) return;
  const currentList = state.tournamentTeams[team];
  if (currentList.some(p => p.toLowerCase() === trimmed.toLowerCase())) {
    showToast(`"${trimmed}" ya está en el equipo`, 'error');
    return;
  }
  currentList.push(trimmed);
  // Guardar número de camiseta si se proporcionó
  const jersey = parseInt(jerseyNumber);
  if (!isNaN(jersey) && jersey >= 0 && jersey <= 99) {
    state.tournamentJerseys[trimmed] = jersey;
  }
  saveState();
  renderTournamentRosters();
  updateTournamentGenerateBtn();
  const teamName = team === 'a' ? state.tournamentTeamAName : state.tournamentTeamBName;
  const jerseyStr = !isNaN(jersey) && jersey >= 0 ? ` (#${jersey})` : '';
  showToast(`✅ ${trimmed}${jerseyStr} agregado a ${teamName}`, 'success');
}

function removeTournamentPlayer(name, team) {
  state.tournamentTeams[team] = state.tournamentTeams[team].filter(p => p !== name);
  // Limpiar stats y jersey si existían
  delete state.tournamentStats[name];
  delete state.tournamentJerseys[name];
  saveState();
  renderTournamentRosters();
  updateTournamentGenerateBtn();
}

function renderTournamentRosters() {
  // Equipo A
  const listA  = document.getElementById('tournament-roster-a');
  const emptyA = document.getElementById('roster-a-empty');
  const listB  = document.getElementById('tournament-roster-b');
  const emptyB = document.getElementById('roster-b-empty');

  // Limpiar, conservando el empty placeholder
  listA.querySelectorAll('.roster-player-item').forEach(el => el.remove());
  listB.querySelectorAll('.roster-player-item').forEach(el => el.remove());

  // Team A
  if (state.tournamentTeams.a.length === 0) {
    if (emptyA) emptyA.style.display = 'flex';
  } else {
    if (emptyA) emptyA.style.display = 'none';
    state.tournamentTeams.a.forEach(player => {
      const item = createRosterItem(player, 'a');
      listA.appendChild(item);
    });
  }

  // Team B
  if (state.tournamentTeams.b.length === 0) {
    if (emptyB) emptyB.style.display = 'flex';
  } else {
    if (emptyB) emptyB.style.display = 'none';
    state.tournamentTeams.b.forEach(player => {
      const item = createRosterItem(player, 'b');
      listB.appendChild(item);
    });
  }

  // Actualizar badge del header con total de jugadores de torneo
  const total = state.tournamentTeams.a.length + state.tournamentTeams.b.length;
  const hdrTotal = document.getElementById('hdr-total');
  if (state.gameMode === 'tournament' && hdrTotal) hdrTotal.textContent = total;
}

function createRosterItem(player, team) {
  const item = document.createElement('div');
  item.className = `roster-player-item roster-item-${team}`;
  item.id = `roster-item-${playerKey(player)}`;

  const jersey = state.tournamentJerseys[player];
  const jerseyEl = document.createElement('span');
  jerseyEl.className = 'roster-jersey-badge';
  jerseyEl.textContent = jersey !== undefined ? `#${jersey}` : '—';

  const nameEl = document.createElement('span');
  nameEl.className = 'roster-player-name';
  nameEl.textContent = player;
  item.appendChild(jerseyEl);

  const removeBtn = document.createElement('button');
  removeBtn.className = 'roster-remove-btn';
  removeBtn.title = 'Quitar del equipo';
  removeBtn.innerHTML = '✕';
  removeBtn.addEventListener('click', () => {
    if (state.tournamentMatchActive) {
      showToast('No puedes editar el roster durante un partido de torneo', 'error');
      return;
    }
    removeTournamentPlayer(player, team);
  });

  item.appendChild(nameEl);
  item.appendChild(removeBtn);
  return item;
}

function updateTournamentGenerateBtn() {
  const btn  = document.getElementById('btn-generate-tournament');
  const hint = document.getElementById('generate-tournament-hint');
  if (!btn || !hint) return;

  const countA = state.tournamentTeams.a.length;
  const countB = state.tournamentTeams.b.length;
  const canStart = !state.tournamentMatchActive && countA > 0 && countB > 0;

  btn.disabled = !canStart;

  if (state.tournamentMatchActive) {
    hint.textContent = 'Partido de torneo en curso';
  } else if (countA === 0 && countB === 0) {
    hint.textContent = 'Agrega jugadores a ambos equipos';
  } else if (countA === 0) {
    hint.textContent = 'Agrega jugadores al Roster A';
  } else if (countB === 0) {
    hint.textContent = 'Agrega jugadores al Roster B';
  } else {
    hint.textContent = `${countA} vs ${countB} — Roster listo para iniciar`;
  }
}

/* ============================================================
   TOURNAMENT MATCH
   ============================================================ */
function generateTournamentMatch() {
  if (state.tournamentMatchActive) return;
  const countA = state.tournamentTeams.a.length;
  const countB = state.tournamentTeams.b.length;
  if (countA === 0 || countB === 0) {
    showToast('Ambos equipos deben tener al menos 1 jugador', 'error');
    return;
  }

  // Inicializar estadísticas de todos los jugadores
  state.tournamentStats = {};
  [...state.tournamentTeams.a, ...state.tournamentTeams.b].forEach(player => {
    state.tournamentStats[player] = {
      pts: 0, min: 0, secOnCourt: 0,
      reb: 0, ast: 0, stl: 0, blk: 0,
      tov: 0, fouls: 0,
      fgm2: 0, fga2: 0,
      fgm3: 0, fga3: 0,
      onCourt: true,
    };
  });

  state.tournamentScoreA = 0;
  state.tournamentScoreB = 0;
  state.tournamentMatchCount++;
  state.tournamentMatchActive = true;

  // Ocultar paneles laterales y expandir la cancha a pantalla completa
  document.body.classList.add('tournament-in-progress');

  // Leer nombres personalizados
  const nameAInput = document.getElementById('tournament-team-a-name');
  const nameBInput = document.getElementById('tournament-team-b-name');
  if (nameAInput) state.tournamentTeamAName = nameAInput.value.trim() || 'Equipo A';
  if (nameBInput) state.tournamentTeamBName = nameBInput.value.trim() || 'Equipo B';

  tStartTimer();
  startPlayerMinInterval();
  saveState();
  
  // Asegurar que el panel-court sea visible ahora que el partido está activo
  const panelCourt = document.getElementById('panel-court');
  if (panelCourt) panelCourt.style.display = 'flex';
  
  renderTournamentCourt();
  updateTournamentGenerateBtn();
  applyGameMode();
  showToast(`🏆 ¡Partido de torneo #${state.tournamentMatchCount} iniciado!`, 'success', 4000);

  // Cambiar al panel de cancha en móvil
  const courtBtn = document.querySelector('.mobile-nav-btn[data-target="court"]');
  if (courtBtn) courtBtn.click();
}

function renderTournamentCourt() {
  const courtIdle       = document.getElementById('court-idle');
  const courtActive     = document.getElementById('court-active');
  const courtTournament = document.getElementById('court-tournament');

  if (state.gameMode !== 'tournament') return;

  if (!state.tournamentMatchActive) {
    courtIdle.style.display       = 'flex';
    courtActive.style.display     = 'none';
    courtTournament.style.display = 'none';
    return;
  }

  courtIdle.style.display       = 'none';
  courtActive.style.display     = 'none';
  courtTournament.style.display = 'flex';

  // Scoreboard
  document.getElementById('tournament-match-number').textContent = `#${state.tournamentMatchCount}`;
  document.getElementById('t-score-a').textContent = state.tournamentScoreA;
  document.getElementById('t-score-b').textContent = state.tournamentScoreB;
  document.getElementById('t-score-name-a').textContent = state.tournamentTeamAName;
  document.getElementById('t-score-name-b').textContent = state.tournamentTeamBName;

  // Etiquetas de los box scores
  const bsLabelA = document.getElementById('bs-team-a-label');
  const bsLabelB = document.getElementById('bs-team-b-label');
  if (bsLabelA) bsLabelA.textContent = `📋 ${state.tournamentTeamAName} — Box Score`;
  if (bsLabelB) bsLabelB.textContent = `📋 ${state.tournamentTeamBName} — Box Score`;

  // Win buttons
  const winLabelA = document.getElementById('t-win-label-a');
  const winLabelB = document.getElementById('t-win-label-b');
  if (winLabelA) winLabelA.textContent = state.tournamentTeamAName;
  if (winLabelB) winLabelB.textContent = state.tournamentTeamBName;

  tUpdateTimerUI();
  tUpdateShotClockUI();
  tUpdateMatchTimerUI();

  // Box Score tables
  renderBoxScoreTable('a');
  renderBoxScoreTable('b');
}

/* ============================================================
   BOX SCORE TABLE RENDER
   ============================================================ */
function renderBoxScoreTable(team) {
  const tbody = document.getElementById(`boxscore-body-${team}`);
  if (!tbody) return;
  tbody.innerHTML = '';
  const players = state.tournamentTeams[team];

  players.forEach(player => {
    const stats = state.tournamentStats[player];
    if (!stats) return;

    const key = playerKey(player);
    const pct2 = stats.fga2 > 0 ? ((stats.fgm2 / stats.fga2) * 100).toFixed(0) : '—';
    const pct3 = stats.fga3 > 0 ? ((stats.fgm3 / stats.fga3) * 100).toFixed(0) : '—';
    const fg2Display = stats.fga2 > 0 ? `${pct2}% (${stats.fgm2}/${stats.fga2})` : '0/0';
    const fg3Display = stats.fga3 > 0 ? `${pct3}% (${stats.fgm3}/${stats.fga3})` : '0/0';
    
    const isOnCourt = stats.onCourt;
    const jersey = state.tournamentJerseys[player];
    const jerseyLabel = jersey !== undefined ? `<span class="bs-jersey-badge">#${jersey}</span>` : '';
    const minDisplay = formatMinSec(stats.secOnCourt || 0);

    const tr = document.createElement('tr');
    tr.id = `bs-row-${key}`;
    tr.className = isOnCourt ? 'bs-row-oncourt' : 'bs-row-bench';

    tr.innerHTML = `
      <td class="bs-player-name">${jerseyLabel}${player}</td>
      <td class="bs-status-cell">
        <button class="btn-court-status ${isOnCourt ? 'btn-oncourt' : 'btn-bench'}" 
                id="bs-status-${key}"
                title="${isOnCourt ? 'En cancha – click para enviar a la banca' : 'En la banca – click para mandar a cancha'}"
                data-player="${player}" data-team="${team}">
          ${isOnCourt ? '🟢 Cancha' : '🪑 Banca'}
        </button>
      </td>
      <td class="bs-stat" id="bs-min-${key}">${minDisplay}</td>
      <td class="bs-stat">
        <div class="bs-stat-controls">
          <button class="bs-ctrl bs-minus" data-player="${player}" data-stat="pts" data-team="${team}">−</button>
          <span id="bs-pts-${key}">${stats.pts}</span>
          <button class="bs-ctrl bs-plus" data-player="${player}" data-stat="pts" data-team="${team}">+</button>
        </div>
      </td>
      <td class="bs-stat">
        <div class="bs-stat-controls">
          <button class="bs-ctrl bs-minus" data-player="${player}" data-stat="reb" data-team="${team}">−</button>
          <span id="bs-reb-${key}">${stats.reb}</span>
          <button class="bs-ctrl bs-plus" data-player="${player}" data-stat="reb" data-team="${team}">+</button>
        </div>
      </td>
      <td class="bs-stat">
        <div class="bs-stat-controls">
          <button class="bs-ctrl bs-minus" data-player="${player}" data-stat="ast" data-team="${team}">−</button>
          <span id="bs-ast-${key}">${stats.ast}</span>
          <button class="bs-ctrl bs-plus" data-player="${player}" data-stat="ast" data-team="${team}">+</button>
        </div>
      </td>
      <td class="bs-stat">
        <div class="bs-stat-controls">
          <button class="bs-ctrl bs-minus" data-player="${player}" data-stat="stl" data-team="${team}">−</button>
          <span id="bs-stl-${key}">${stats.stl}</span>
          <button class="bs-ctrl bs-plus" data-player="${player}" data-stat="stl" data-team="${team}">+</button>
        </div>
      </td>
      <td class="bs-stat">
        <div class="bs-stat-controls">
          <button class="bs-ctrl bs-minus" data-player="${player}" data-stat="blk" data-team="${team}">−</button>
          <span id="bs-blk-${key}">${stats.blk}</span>
          <button class="bs-ctrl bs-plus" data-player="${player}" data-stat="blk" data-team="${team}">+</button>
        </div>
      </td>
      <td class="bs-stat">
        <div class="bs-stat-controls">
          <button class="bs-ctrl bs-minus" data-player="${player}" data-stat="tov" data-team="${team}">−</button>
          <span id="bs-tov-${key}">${stats.tov}</span>
          <button class="bs-ctrl bs-plus" data-player="${player}" data-stat="tov" data-team="${team}">+</button>
        </div>
      </td>
      <td class="bs-stat">
        <div class="bs-stat-controls">
          <button class="bs-ctrl bs-minus" data-player="${player}" data-stat="fouls" data-team="${team}">−</button>
          <span id="bs-fouls-${key}">${stats.fouls}</span>
          <button class="bs-ctrl bs-plus" data-player="${player}" data-stat="fouls" data-team="${team}">+</button>
        </div>
      </td>
      <td class="bs-shots-cell">
        <div class="bs-shots-controls">
          <div class="bs-shots-row">
            <button class="bs-shot-btn bs-shot-make2" data-player="${player}" data-team="${team}" title="Canasta 2 anotada (+2 PTS, +1 FGM2/FGA2)">✅ +2</button>
            <button class="bs-shot-btn bs-shot-make3" data-player="${player}" data-team="${team}" title="Canasta 3 anotada (+3 PTS, +1 FGM3/FGA3)">☄️ +3</button>
          </div>
          <div class="bs-shots-row">
            <button class="bs-shot-btn bs-shot-miss2" data-player="${player}" data-team="${team}" title="Tiro de 2 fallado (+1 FGA2)">❌ Falla 2</button>
            <button class="bs-shot-btn bs-shot-miss3" data-player="${player}" data-team="${team}" title="Tiro de 3 fallado (+1 FGA3)">❌ Falla 3</button>
          </div>
          <div class="bs-fg-pct-container">
            <span class="bs-fg-pct" id="bs-fg2-${key}">2PT: ${fg2Display}</span>
            <span class="bs-fg-pct" id="bs-fg3-${key}">3PT: ${fg3Display}</span>
          </div>
        </div>
      </td>
    `;

    tbody.appendChild(tr);
  });

  // Bind events for this table after rendering
  bindBoxScoreEvents(tbody, team);
}

function bindBoxScoreEvents(tbody, team) {
  // Stat controls (+ / -)
  tbody.querySelectorAll('.bs-ctrl').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const player = e.currentTarget.dataset.player;
      const stat   = e.currentTarget.dataset.stat;
      const delta  = e.currentTarget.classList.contains('bs-plus') ? 1 : -1;
      updateTournamentStat(player, stat, delta, team);
    });
  });

  // Shot make/miss events
  tbody.querySelectorAll('.bs-shot-make2').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const player = e.currentTarget.dataset.player;
      registerShot(player, 'make2', team);
    });
  });
  tbody.querySelectorAll('.bs-shot-make3').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const player = e.currentTarget.dataset.player;
      registerShot(player, 'make3', team);
    });
  });
  tbody.querySelectorAll('.bs-shot-miss2').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const player = e.currentTarget.dataset.player;
      registerShot(player, 'miss2', team);
    });
  });
  tbody.querySelectorAll('.bs-shot-miss3').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const player = e.currentTarget.dataset.player;
      registerShot(player, 'miss3', team);
    });
  });

  // Court/Bench toggle
  tbody.querySelectorAll('.btn-court-status').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const player = e.currentTarget.dataset.player;
      togglePlayerCourtStatus(player);
    });
  });
}

/* ============================================================
   TOURNAMENT STAT UPDATES
   ============================================================ */
function updateTournamentStat(player, stat, delta, team) {
  if (!state.tournamentMatchActive) return;
  const stats = state.tournamentStats[player];
  if (!stats) return;

  stats[stat] = Math.max(0, (stats[stat] || 0) + delta);

  // Si son puntos, actualizar marcador del equipo
  if (stat === 'pts') {
    if (team === 'a') {
      state.tournamentScoreA = Math.max(0, state.tournamentScoreA + delta);
      const el = document.getElementById('t-score-a');
      if (el) {
        el.textContent = state.tournamentScoreA;
        el.classList.remove('bump');
        void el.offsetWidth;
        el.classList.add('bump');
        setTimeout(() => el.classList.remove('bump'), 250);
      }
    } else {
      state.tournamentScoreB = Math.max(0, state.tournamentScoreB + delta);
      const el = document.getElementById('t-score-b');
      if (el) {
        el.textContent = state.tournamentScoreB;
        el.classList.remove('bump');
        void el.offsetWidth;
        el.classList.add('bump');
        setTimeout(() => el.classList.remove('bump'), 250);
      }
    }
  }

  // Actualizar celda del DOM directamente sin re-render completo
  const key = playerKey(player);
  const statEl = document.getElementById(`bs-${stat}-${key}`);
  if (statEl) statEl.textContent = stats[stat];

  saveState();
}

function registerShot(player, type, team) {
  if (!state.tournamentMatchActive) return;
  const stats = state.tournamentStats[player];
  if (!stats) return;

  if (type === 'make2') {
    stats.fga2 = (stats.fga2 || 0) + 1;
    stats.fgm2 = (stats.fgm2 || 0) + 1;
    updateTournamentStat(player, 'pts', 2, team);
  } else if (type === 'make3') {
    stats.fga3 = (stats.fga3 || 0) + 1;
    stats.fgm3 = (stats.fgm3 || 0) + 1;
    updateTournamentStat(player, 'pts', 3, team);
  } else if (type === 'miss2') {
    stats.fga2 = (stats.fga2 || 0) + 1;
  } else if (type === 'miss3') {
    stats.fga3 = (stats.fga3 || 0) + 1;
  }

  // Actualizar el FG% en el DOM
  updateFGDisplay(player);
  saveState();
}

function updateFGDisplay(player) {
  const stats = state.tournamentStats[player];
  if (!stats) return;
  const key = playerKey(player);
  const fg2El = document.getElementById(`bs-fg2-${key}`);
  const fg3El = document.getElementById(`bs-fg3-${key}`);
  
  if (fg2El) {
    if (stats.fga2 > 0) {
      const pct = ((stats.fgm2 / stats.fga2) * 100).toFixed(0);
      fg2El.textContent = `2PT: ${pct}% (${stats.fgm2}/${stats.fga2})`;
    } else {
      fg2El.textContent = '2PT: 0/0';
    }
  }
  
  if (fg3El) {
    if (stats.fga3 > 0) {
      const pct = ((stats.fgm3 / stats.fga3) * 100).toFixed(0);
      fg3El.textContent = `3PT: ${pct}% (${stats.fgm3}/${stats.fga3})`;
    } else {
      fg3El.textContent = '3PT: 0/0';
    }
  }
}

function togglePlayerCourtStatus(player) {
  if (!state.tournamentMatchActive) return;
  const stats = state.tournamentStats[player];
  if (!stats) return;

  stats.onCourt = !stats.onCourt;
  saveState();

  // Actualizar el botón y la fila sin re-render completo
  const key = playerKey(player);
  const btn = document.getElementById(`bs-status-${key}`);
  const row = document.getElementById(`bs-row-${key}`);

  if (btn) {
    btn.textContent = stats.onCourt ? '🟢 Cancha' : '🪑 Banca';
    btn.className = `btn-court-status ${stats.onCourt ? 'btn-oncourt' : 'btn-bench'}`;
    btn.title = stats.onCourt
      ? 'En cancha – click para enviar a la banca'
      : 'En la banca – click para mandar a cancha';
  }
  if (row) {
    row.className = stats.onCourt ? 'bs-row-oncourt' : 'bs-row-bench';
  }

  showToast(
    stats.onCourt ? `🟢 ${player} entró a la cancha` : `🪑 ${player} fue a la banca`,
    'info', 2000
  );
}

/* ============================================================
   TOURNAMENT: REGISTER WINNER
   ============================================================ */
function registerTournamentWinner(winnerTeam) {
  if (!state.tournamentMatchActive) return;
  tStopTimer();
  stopPlayerMinInterval();

  // Restaurar los paneles laterales al finalizar el torneo
  document.body.classList.remove('tournament-in-progress');

  // Guardar segundos finales
  Object.values(state.tournamentStats).forEach(stats => {
    stats.min = Math.floor((stats.secOnCourt || 0) / 60);
  });

  const winnerName  = winnerTeam === 'a' ? state.tournamentTeamAName : state.tournamentTeamBName;
  const winnerScore = winnerTeam === 'a' ? state.tournamentScoreA : state.tournamentScoreB;
  const loserScore  = winnerTeam === 'a' ? state.tournamentScoreB : state.tournamentScoreA;

  const matchRecord = {
    number:        state.tournamentMatchCount,
    winner:        winnerTeam,
    winnerName,
    scoreA:        state.tournamentScoreA,
    scoreB:        state.tournamentScoreB,
    teamAName:     state.tournamentTeamAName,
    teamBName:     state.tournamentTeamBName,
    stats:         JSON.parse(JSON.stringify(state.tournamentStats)),
    teamA:         [...state.tournamentTeams.a],
    teamB:         [...state.tournamentTeams.b],
    duration:      state.tTimerSeconds,
    time:          now(),
    isTournament:  true,
  };
  state.matchHistory.push(matchRecord);
  state.tournamentMatchActive = false;
  saveState();

  launchConfetti();
  showTournamentWinnerModal(winnerTeam, winnerName, winnerScore, loserScore);
  
  // Ocultar panel de cancha y aplicar modo para reflejar el estado finalizado
  applyGameMode();
  
  updateTournamentGenerateBtn();
  renderTournamentRosters(); // Actualizar rosters en panel izquierdo
  showToast('🏆 Partido de torneo finalizado y guardado', 'success', 4000);
}

function showTournamentWinnerModal(winnerTeam, winnerName, winnerScore, loserScore) {
  const modal   = document.getElementById('tournament-winner-modal');
  const titleEl = document.getElementById('t-modal-winner-name');
  const subEl   = document.getElementById('t-modal-winner-sub');
  const summaryEl = document.getElementById('t-modal-score-summary');
  const playersEl = document.getElementById('t-modal-winner-players');

  titleEl.textContent = `🏆 ${winnerName} Ganó!`;
  subEl.textContent   = 'Partido de torneo finalizado';

  const colorA = winnerTeam === 'a' ? '#4ECDC4' : '#FF6B6B';
  const colorB = winnerTeam === 'b' ? '#4ECDC4' : '#FF6B6B';
  summaryEl.innerHTML = `
    <div class="mss-block">
      <div class="mss-score" style="color:${colorA}">${state.tournamentScoreA}</div>
      <div class="mss-label">${state.tournamentTeamAName}</div>
    </div>
    <div class="mss-vs">—</div>
    <div class="mss-block">
      <div class="mss-score" style="color:${colorB}">${state.tournamentScoreB}</div>
      <div class="mss-label">${state.tournamentTeamBName}</div>
    </div>
  `;

  const winnerPlayers = winnerTeam === 'a' ? state.tournamentTeams.a : state.tournamentTeams.b;
  const topScorers = winnerPlayers
    .map(p => ({ name: p, pts: (state.tournamentStats[p] || {}).pts || 0 }))
    .sort((a, b) => b.pts - a.pts);

  playersEl.innerHTML = `<div class="modal-players-title">⭐ Top anotadores del equipo ganador</div>`;
  topScorers.slice(0, 5).forEach(({ name, pts }) => {
    const row = document.createElement('div');
    row.className = 'modal-player-row';
    row.innerHTML = `<span>${name}</span><span class="modal-player-pts">${pts} pts</span>`;
    playersEl.appendChild(row);
  });

  modal.style.display = 'flex';
  document.getElementById('t-btn-modal-close').onclick = () => { modal.style.display = 'none'; };
}

function addLatePlayer(team, name, jerseyNumber) {
  const trimmed = name.trim();
  if (!trimmed) return;
  
  const currentList = state.tournamentTeams[team];
  if (currentList.some(p => p.toLowerCase() === trimmed.toLowerCase())) {
    showToast(`"${trimmed}" ya está en el equipo`, 'error');
    return;
  }
  
  // Agregar al roster del equipo
  currentList.push(trimmed);
  
  // Guardar jersey
  const jersey = parseInt(jerseyNumber);
  if (!isNaN(jersey) && jersey >= 0 && jersey <= 99) {
    state.tournamentJerseys[trimmed] = jersey;
  }
  
  // Inicializar estadísticas (entra directamente a la cancha)
  state.tournamentStats[trimmed] = {
    pts: 0, min: 0, secOnCourt: 0,
    reb: 0, ast: 0, stl: 0, blk: 0,
    tov: 0, fouls: 0,
    fgm2: 0, fga2: 0,
    fgm3: 0, fga3: 0,
    onCourt: true,
  };
  
  saveState();
  renderTournamentCourt();
  showToast(`⚡ ${trimmed} ingresó tarde al partido`, 'success');
}
function exportBoxScore(team) {
  const teamName = team === 'a' ? state.tournamentTeamAName : state.tournamentTeamBName;
  const players  = state.tournamentTeams[team];

  if (players.length === 0) {
    showToast(`No hay jugadores en ${teamName}`, 'error');
    return;
  }

  const scoreA = state.tournamentScoreA;
  const scoreB = state.tournamentScoreB;
  const matchNum = state.tournamentMatchCount || 1;
  const duration = formatTime(state.tTimerSeconds || 0);
  const dateStr = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  // Generar datos de texto para portapapeles
  let text = `🏀 *BOX SCORE — ${teamName.toUpperCase()}*\n`;
  text += `🏆 Partido de Torneo #${matchNum} | ${dateStr}\n`;
  text += `📊 ${state.tournamentTeamAName} ${scoreA} — ${scoreB} ${state.tournamentTeamBName}\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `${'#'.padEnd(4)}${ 'Jugador'.padEnd(14) }MIN    PTS  REB  AST  ROB  BLQ  PER  FAL  2PT%     3PT%\n`;
  text += `────────────────────────────────────────────────────────\n`;

  let rowsHtml = '';
  let totPts = 0, totReb = 0, totAst = 0, totStl = 0, totBlk = 0, totTov = 0, totFouls = 0;
  let totFgm2 = 0, totFga2 = 0, totFgm3 = 0, totFga3 = 0;

  players.forEach(player => {
    const s = state.tournamentStats[player] || {};
    const pts = s.pts || 0;
    const reb = s.reb || 0;
    const ast = s.ast || 0;
    const stl = s.stl || 0;
    const blk = s.blk || 0;
    const tov = s.tov || 0;
    const fouls = s.fouls || 0;
    
    totPts += pts; totReb += reb; totAst += ast; totStl += stl; totBlk += blk; totTov += tov; totFouls += fouls;
    
    const fgm2 = s.fgm2 || 0; const fga2 = s.fga2 || 0;
    const fgm3 = s.fgm3 || 0; const fga3 = s.fga3 || 0;
    totFgm2 += fgm2; totFga2 += fga2; totFgm3 += fgm3; totFga3 += fga3;

    const pct2 = fga2 > 0 ? `${((fgm2 / fga2) * 100).toFixed(0)}%` : '—';
    const pct3 = fga3 > 0 ? `${((fgm3 / fga3) * 100).toFixed(0)}%` : '—';
    const fg2Str = fga2 > 0 ? `${fgm2}-${fga2} (${pct2})` : '0-0';
    const fg3Str = fga3 > 0 ? `${fgm3}-${fga3} (${pct3})` : '0-0';

    const jersey = state.tournamentJerseys[player];
    const jerseyStr = jersey !== undefined ? `#${jersey}` : '—';
    const minSec = formatMinSec(s.secOnCourt || 0);

    text += `${jerseyStr.padEnd(4)}${player.substring(0,11).padEnd(14)}${minSec.padEnd(7)}${String(pts).padStart(3)}  ${String(reb).padStart(3)}  ${String(ast).padStart(3)}  ${String(stl).padStart(3)}  ${String(blk).padStart(3)}  ${String(tov).padStart(3)}  ${String(fouls).padStart(3)}  ${fg2Str.padEnd(9)}  ${fg3Str}\n`;

    rowsHtml += `
      <tr>
        <td class="col-num">${jerseyStr}</td>
        <td class="col-name">${player}</td>
        <td>${minSec}</td>
        <td class="col-pts">${pts}</td>
        <td>${fg2Str}</td>
        <td>${fg3Str}</td>
        <td>${reb}</td>
        <td>${ast}</td>
        <td>${stl}</td>
        <td>${blk}</td>
        <td>${tov}</td>
        <td>${fouls}</td>
      </tr>
    `;
  });

  const totPct2 = totFga2 > 0 ? `${((totFgm2 / totFga2) * 100).toFixed(0)}%` : '—';
  const totPct3 = totFga3 > 0 ? `${((totFgm3 / totFga3) * 100).toFixed(0)}%` : '—';

  rowsHtml += `
    <tr class="total-row">
      <td></td>
      <td class="col-name">TOTALES</td>
      <td></td>
      <td class="col-pts">${totPts}</td>
      <td>${totFgm2}-${totFga2} (${totPct2})</td>
      <td>${totFgm3}-${totFga3} (${totPct3})</td>
      <td>${totReb}</td>
      <td>${totAst}</td>
      <td>${totStl}</td>
      <td>${totBlk}</td>
      <td>${totTov}</td>
      <td>${totFouls}</td>
    </tr>
  `;

  // Copiar al portapapeles como respaldo
  navigator.clipboard.writeText(text).catch(() => {});

  // Generar HTML Premium para PDF / Impresión
  const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Box Score — ${teamName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Montserrat:wght@700;800&display=swap');
    body {
      background-color: #0f172a;
      color: #f8fafc;
      font-family: 'Inter', sans-serif;
      margin: 0;
      padding: 30px;
    }
    .report-card {
      max-width: 1000px;
      margin: 0 auto;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 16px;
      padding: 32px;
      box-shadow: 0 20px 50px rgba(0,0,0,0.5);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #334155;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .team-title {
      font-family: 'Montserrat', sans-serif;
      font-size: 28px;
      font-weight: 800;
      background: linear-gradient(135deg, #ff6b1a, #ff9f43);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin: 0 0 8px 0;
    }
    .match-info {
      font-size: 16px;
      color: #94a3b8;
      font-weight: 600;
    }
    .match-score {
      font-family: 'Montserrat', sans-serif;
      font-size: 20px;
      color: #e2e8f0;
      background: #0f172a;
      padding: 8px 16px;
      border-radius: 8px;
      border: 1px solid #334155;
    }
    .actions {
      text-align: right;
      margin-bottom: 20px;
    }
    .btn-print {
      background: linear-gradient(135deg, #ff6b1a, #e05610);
      color: #fff;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      font-weight: 700;
      cursor: pointer;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(255,107,26,0.3);
      transition: all 0.2s;
    }
    .btn-print:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(255,107,26,0.4);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    th {
      text-align: center;
      padding: 12px 8px;
      color: #94a3b8;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      border-bottom: 1px solid #334155;
    }
    th.col-name, td.col-name {
      text-align: left;
    }
    td {
      padding: 14px 8px;
      text-align: center;
      font-size: 14px;
      border-bottom: 1px solid #334155 / 40%;
      color: #cbd5e1;
    }
    tr:nth-child(even) {
      background: rgba(255,255,255,0.02);
    }
    .col-num {
      font-weight: 700;
      color: #ff9f43;
    }
    .col-name {
      font-weight: 700;
      color: #f8fafc;
    }
    .col-pts {
      font-weight: 800;
      color: #38bdf8;
      font-size: 15px;
    }
    .total-row td {
      border-top: 2px solid #64748b;
      font-weight: 800;
      color: #fff;
      background: #0f172a;
    }
    @media print {
      body { background: #fff; color: #000; padding: 0; }
      .report-card { border: none; box-shadow: none; background: #fff; color: #000; width: 100%; max-width: none; }
      .actions { display: none; }
      .team-title { -webkit-text-fill-color: #d9534f; }
      th { color: #333; border-bottom: 2px solid #000; }
      td { color: #111; border-bottom: 1px solid #ccc; }
      .total-row td { background: #eee; border-top: 2px solid #000; color: #000; }
    }
  </style>
</head>
<body>
  <div class="report-card">
    <div class="actions">
      <button class="btn-print" onclick="window.print()">🖨️ Guardar como PDF / Imprimir</button>
    </div>
    <div class="header">
      <div>
        <h1 class="team-title">${teamName}</h1>
        <div class="match-info">Partido #${matchNum} • ${dateStr} • Duración: ${duration}</div>
      </div>
      <div class="match-score">
        ${state.tournamentTeamAName} ${scoreA} — ${scoreB} ${state.tournamentTeamBName}
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th class="col-name">Jugador</th>
          <th>MIN</th>
          <th>PTS</th>
          <th>2-PT</th>
          <th>3-PT</th>
          <th>REB</th>
          <th>AST</th>
          <th>ROB</th>
          <th>BLQ</th>
          <th>PER</th>
          <th>FAL</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  </div>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(htmlContent);
    win.document.close();
    showToast(`📊 Reporte Premium de ${teamName} abierto (y copiado al portapapeles)`, 'success', 4000);
  } else {
    // Si el navegador bloqueó el popup, descargamos el archivo HTML directamente
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BoxScore_${teamName.replace(/\s+/g, '_')}_Partido${matchNum}.html`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`📥 Reporte Premium descargado (popup bloqueado)`, 'success', 4000);
  }
}

/* ============================================================
   DAY SUMMARY / HISTORY
   ============================================================ */
function getMVPOfDay() {
  if (state.matchHistory.length === 0) return null;
  const totalPoints = {};
  state.matchHistory.forEach(match => {
    if (match.isTournament) {
      Object.entries(match.stats || {}).forEach(([player, s]) => {
        totalPoints[player] = (totalPoints[player] || 0) + (s.pts || 0);
      });
    } else {
      Object.entries(match.playerScores || {}).forEach(([player, pts]) => {
        totalPoints[player] = (totalPoints[player] || 0) + pts;
      });
    }
  });
  let mvp = null, maxPts = -1;
  Object.entries(totalPoints).forEach(([player, pts]) => {
    if (pts > maxPts) { maxPts = pts; mvp = { name: player, pts }; }
  });
  return mvp;
}

function shareDaySummary() {
  if (state.matchHistory.length === 0) {
    showToast('Aún no hay partidos jugados hoy para compartir', 'error');
    return;
  }
  const mvp = getMVPOfDay();
  let text = `🏀 *BASKETBALL COURT - RESUMEN DEL DÍA* 🏀\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `🏆 *Partidos jugados:* ${state.matchHistory.length}\n\n`;
  text += `*Resultados:*\n`;
  state.matchHistory.forEach(match => {
    if (match.isTournament) {
      text += `• Torneo #${match.number}: ${match.teamAName} (${match.scoreA}) vs ${match.teamBName} (${match.scoreB}) → *${match.winnerName}* 🏆\n`;
    } else {
      text += `• Partido #${match.number}: Equipo A (${match.scoreA}) vs Equipo B (${match.scoreB}) → Ganador: *Equipo ${match.winner}* 🏆\n`;
    }
  });
  text += `\n`;
  if (mvp && mvp.pts > 0) {
    text += `⭐ *MVP del Día:* ${mvp.name} con *${mvp.pts} pts* totales anotados. 🔥\n`;
  }
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `Generado desde Basketball Court.`;
  navigator.clipboard.writeText(text).then(() => {
    showToast('📋 ¡Resumen copiado al portapapeles! Abriendo WhatsApp...', 'success', 4000);
    setTimeout(() => {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    }, 1000);
  }).catch(() => showToast('Error al copiar al portapapeles.', 'error'));
}

/* ============================================================
   RENDER HISTORY
   ============================================================ */
function renderHistory() {
  const list    = document.getElementById('history-list');
  const emptyEl = document.getElementById('history-empty');
  const badge   = document.getElementById('badge-history');

  // Filtrar el historial según el modo de juego activo
  const activeHistory = state.matchHistory.filter(match => {
    if (state.gameMode === 'tournament') {
      return match.isTournament === true;
    } else {
      return !match.isTournament;
    }
  });

  badge.textContent = activeHistory.length;

  if (activeHistory.length === 0) {
    list.innerHTML = '';
    if (emptyEl) emptyEl.style.display = 'flex';
    return;
  }
  if (emptyEl) emptyEl.style.display = 'none';
  list.innerHTML = '';

  [...activeHistory].reverse().forEach(match => {
    const card = document.createElement('div');
    card.className = 'history-card';

    if (match.isTournament) {
      // Tarjeta de torneo
      card.classList.add('history-card-tournament');
      card.innerHTML = `
        <div class="history-card-header">
          <span class="hc-number">🏆 Torneo #${match.number}</span>
          <span class="hc-winner-tag">🥇 ${match.winnerName}</span>
        </div>
        <div class="hc-teams">
          <div class="hc-team ${match.winner === 'a' ? 'winner' : 'loser'}">
            <span class="hc-team-name">${match.winner === 'a' ? '🏆 ' : ''}${match.teamAName}</span>
            <span class="hc-team-score">${match.scoreA}</span>
          </div>
          <div class="hc-team ${match.winner === 'b' ? 'winner' : 'loser'}">
            <span class="hc-team-name">${match.winner === 'b' ? '🏆 ' : ''}${match.teamBName}</span>
            <span class="hc-team-score">${match.scoreB}</span>
          </div>
        </div>
        <div class="hc-divider"></div>
        <div class="hc-scorers">
          ${Object.entries(match.stats || {})
            .sort((a, b) => (b[1].pts || 0) - (a[1].pts || 0))
            .slice(0, 5)
            .map(([name, s]) => `<div class="hc-scorer"><span>${name}</span><span>${s.pts || 0} pts · ${s.reb || 0} reb · ${s.ast || 0} ast</span></div>`)
            .join('')}
        </div>
        <div class="hc-time">Duración: ${formatTime(match.duration)} · ${match.time}</div>
      `;
    } else {
      // Tarjeta recreativa (original)
      const header = document.createElement('div');
      header.className = 'history-card-header';
      header.innerHTML = `
        <span class="hc-number">Partido #${match.number}</span>
        <span class="hc-winner-tag">🏆 ${match.winnerName}</span>
      `;
      const teamsEl = document.createElement('div');
      teamsEl.className = 'hc-teams';
      ['A','B'].forEach(t => {
        const isWinner = match.winner === t;
        const row = document.createElement('div');
        row.className = `hc-team ${isWinner ? 'winner' : 'loser'}`;
        row.innerHTML = `
          <span class="hc-team-name">${isWinner ? '🏆 ' : ''}Equipo ${t}</span>
          <span class="hc-team-score">${t === 'A' ? match.scoreA : match.scoreB}</span>
        `;
        teamsEl.appendChild(row);
      });

      const scorerEntries = Object.entries(match.playerScores || {})
        .filter(([,pts]) => pts > 0)
        .sort((a,b) => b[1]-a[1])
        .slice(0, 5);

      card.appendChild(header);
      card.appendChild(teamsEl);

      if (scorerEntries.length > 0) {
        const divider = document.createElement('div');
        divider.className = 'hc-divider';
        card.appendChild(divider);
        const scorers = document.createElement('div');
        scorers.className = 'hc-scorers';
        scorerEntries.forEach(([name, pts]) => {
          const row = document.createElement('div');
          row.className = 'hc-scorer';
          row.innerHTML = `<span>${name}</span><span>${pts} pts</span>`;
          scorers.appendChild(row);
        });
        card.appendChild(scorers);
      }

      const timeEl = document.createElement('div');
      timeEl.className = 'hc-time';
      timeEl.textContent = `Duración: ${formatTime(match.duration)} · ${match.time}`;
      card.appendChild(timeEl);
    }

    list.appendChild(card);
  });
}

/* ============================================================
   UPDATE HEADER MATCH COUNT
   ============================================================ */
function updateHeaderMatchCount() {
  document.getElementById('hdr-matches').textContent = state.matchHistory.length;
}

/* ============================================================
   ADD PLAYER (Recreativo)
   ============================================================ */
function addPlayer(name) {
  const trimmed = name.trim();
  if (!trimmed) return;
  if (state.queue.some(p => p.toLowerCase() === trimmed.toLowerCase())) {
    showToast(`"${trimmed}" ya está en la lista`, 'error');
    return;
  }
  if (!state.players.includes(trimmed)) state.players.push(trimmed);
  state.queue.push(trimmed);
  saveState();
  renderQueue();
  showToast(`✅ ${trimmed} agregado a la lista`, 'success');
}

function removeFromQueue(player) {
  state.queue = state.queue.filter(p => p !== player);
  saveState();
  renderQueue();
  showToast(`Removido: ${player}`, 'info');
}

/* ============================================================
   GENERATE MATCH (Recreativo)
   ============================================================ */
function generateMatch() {
  if (state.matchActive) return;
  const onCourt = [...state.teamA, ...state.teamB];
  const available = state.queue.filter(p => !onCourt.includes(p));
  if (available.length < 6) {
    showToast('Necesitas al menos 6 jugadores para generar un partido', 'error');
    return;
  }
  const teamSize = available.length >= 10 ? 5 : Math.floor(available.length / 2);
  const needed   = teamSize * 2;
  const selected = available.slice(0, needed);
  state.teamA = selected.slice(0, teamSize);
  state.teamB = selected.slice(teamSize, needed);
  state.scoreA = 0;
  state.scoreB = 0;
  state.foulsA = 0;
  state.foulsB = 0;
  state.playerScores = {};
  [...state.teamA, ...state.teamB].forEach(p => { state.playerScores[p] = 0; });
  state.matchCount++;
  state.matchActive = true;
  state.teamAIsDefender = false;
  startTimer();
  saveState();
  renderQueue();
  renderCourt();
  showToast(`⚡ Partido #${state.matchCount} iniciado! ${teamSize}vs${teamSize}`, 'success', 4000);
}

function generateNextMatch(winnerTeam) {
  const winnerPlayers = winnerTeam === 'A' ? [...state.teamA] : [...state.teamB];
  const loserPlayers  = winnerTeam === 'A' ? [...state.teamB] : [...state.teamA];
  state.queue = state.queue.filter(p => !loserPlayers.includes(p));
  state.queue.push(...loserPlayers);
  const onCourt   = winnerPlayers;
  const available = state.queue.filter(p => !onCourt.includes(p));
  const teamSize  = winnerPlayers.length;
  if (available.length === 0) {
    state.matchActive = false;
    stopTimer();
    saveState();
    renderQueue();
    renderCourt();
    showToast('🏆 ¡No hay más retadores! Agrega más jugadores.', 'info', 5000);
    return;
  }
  const challengers = available.slice(0, teamSize);
  if (winnerTeam === 'A') {
    state.teamA = winnerPlayers;
    state.teamB = challengers;
    state.teamAIsDefender = true;
  } else {
    state.teamB = winnerPlayers;
    state.teamA = challengers;
    state.teamAIsDefender = false;
  }
  state.scoreA = 0;
  state.scoreB = 0;
  state.foulsA = 0;
  state.foulsB = 0;
  state.playerScores = {};
  [...state.teamA, ...state.teamB].forEach(p => { state.playerScores[p] = 0; });
  state.matchCount++;
  state.matchActive = true;
  startTimer();
  saveState();
  renderQueue();
  renderCourt();
  showToast(`⚡ Partido #${state.matchCount} en curso!`, 'success', 3000);
}

/* ============================================================
   ADD POINTS (Recreativo)
   ============================================================ */
function addPoints(player, team, pts) {
  if (!state.matchActive) return;
  state.playerScores[player] = (state.playerScores[player] || 0) + pts;
  if (team === 'a') {
    state.scoreA += pts;
    const scoreEl = document.getElementById('score-a');
    scoreEl.textContent = state.scoreA;
    scoreEl.classList.remove('bump');
    void scoreEl.offsetWidth;
    scoreEl.classList.add('bump');
    setTimeout(() => scoreEl.classList.remove('bump'), 250);
  } else {
    state.scoreB += pts;
    const scoreEl = document.getElementById('score-b');
    scoreEl.textContent = state.scoreB;
    scoreEl.classList.remove('bump');
    void scoreEl.offsetWidth;
    scoreEl.classList.add('bump');
    setTimeout(() => scoreEl.classList.remove('bump'), 250);
  }
  const ptsEl = document.getElementById(`pts-${playerKey(player)}`);
  if (ptsEl) ptsEl.innerHTML = `${state.playerScores[player]}<span> pts</span>`;
  saveState();
}

/* ============================================================
   REGISTER WINNER (Recreativo)
   ============================================================ */
function registerWinner(winnerTeam) {
  if (!state.matchActive) return;
  stopTimer();
  const winnerName   = `Equipo ${winnerTeam}`;
  const winnerScore  = winnerTeam === 'A' ? state.scoreA : state.scoreB;
  const loserScore   = winnerTeam === 'A' ? state.scoreB : state.scoreA;
  const winnerRoster = winnerTeam === 'A' ? state.teamA : state.teamB;

  const matchRecord = {
    number:       state.matchCount,
    winner:       winnerTeam,
    winnerName,
    scoreA:       state.scoreA,
    scoreB:       state.scoreB,
    playerScores: { ...state.playerScores },
    teamA:        [...state.teamA],
    teamB:        [...state.teamB],
    duration:     state.timerSeconds,
    time:         now(),
  };
  state.matchHistory.push(matchRecord);
  state.matchActive = false;
  saveState();
  showWinnerModal(winnerTeam, winnerName, winnerScore, loserScore, winnerRoster);
  launchConfetti();
  renderHistory();
}

function showWinnerModal(winnerTeam, winnerName, winnerScore, loserScore, winnerRoster) {
  const modal     = document.getElementById('winner-modal');
  const titleEl   = document.getElementById('modal-winner-name');
  const subEl     = document.getElementById('modal-winner-sub');
  const summaryEl = document.getElementById('modal-score-summary');
  const playersEl = document.getElementById('modal-winner-players');

  titleEl.textContent = `🏆 ${winnerName} Ganó!`;
  const onCourt   = [...state.teamA, ...state.teamB];
  const available = state.queue.filter(p => !onCourt.includes(p));
  const loserCount = winnerTeam === 'A' ? state.teamB.length : state.teamA.length;

  subEl.textContent = available.length >= loserCount
    ? `${winnerName} se queda en cancha. Los perdedores van al final de la cola.`
    : `${winnerName} se queda en cancha. No hay suficientes jugadores en cola.`;

  const colorA = winnerTeam === 'A' ? '#4ECDC4' : '#FF6B6B';
  const colorB = winnerTeam === 'B' ? '#4ECDC4' : '#FF6B6B';
  summaryEl.innerHTML = `
    <div class="mss-block">
      <div class="mss-score" style="color:${colorA}">${state.scoreA}</div>
      <div class="mss-label">Equipo A</div>
    </div>
    <div class="mss-vs">—</div>
    <div class="mss-block">
      <div class="mss-score" style="color:${colorB}">${state.scoreB}</div>
      <div class="mss-label">Equipo B</div>
    </div>
  `;

  const winnerScorers = winnerRoster
    .map(p => ({ name: p, pts: state.playerScores[p] || 0 }))
    .sort((a,b) => b.pts - a.pts);

  playersEl.innerHTML = `<div class="modal-players-title">⭐ Anotadores del equipo ganador</div>`;
  winnerScorers.forEach(({ name, pts }) => {
    const row = document.createElement('div');
    row.className = 'modal-player-row';
    row.innerHTML = `<span>${name}</span><span class="modal-player-pts">${pts} pts</span>`;
    playersEl.appendChild(row);
  });

  modal.style.display = 'flex';
  document.getElementById('btn-modal-continue').onclick = () => {
    modal.style.display = 'none';
    generateNextMatch(winnerTeam);
  };
}

/* ============================================================
   RESET DAY
   ============================================================ */
function resetDay() {
  if (!confirm('¿Reiniciar el día? Se borrará toda la lista y el historial de hoy.')) return;
  stopTimer();
  tStopTimer();
  stopPlayerMinInterval();
  Object.assign(state, {
    players: [], queue: [], teamA: [], teamB: [],
    scoreA: 0, scoreB: 0, foulsA: 0, foulsB: 0,
    playerScores: {}, matchHistory: [], matchCount: 0,
    teamAIsDefender: false, timerSeconds: 0, matchActive: false,
    isCountdown: false, shotClockSeconds: 24, shotClockActive: false,
    // Torneo
    tournamentTeams:      { a: [], b: [] },
    tournamentJerseys:    {},
    tournamentStats:      {},
    tournamentMatchActive: false,
    tournamentScoreA: 0, tournamentScoreB: 0,
    tournamentMatchCount: 0,
    tTimerSeconds: 0, tTimerRunning: false,
    tIsCountdown: false, tShotClockSeconds: 24, tShotClockActive: false,
    tournamentTeamAName: 'Equipo A',
    tournamentTeamBName: 'Equipo B',
  });
  // Asegurar que los paneles laterales se restauren al reiniciar
  document.body.classList.remove('tournament-in-progress');
  saveState();
  renderQueue();
  renderCourt();
  renderHistory();
  renderTournamentRosters();
  renderTournamentCourt();
  updateTournamentGenerateBtn();
  const nameA = document.getElementById('tournament-team-a-name');
  const nameB = document.getElementById('tournament-team-b-name');
  if (nameA) nameA.value = 'Equipo A';
  if (nameB) nameB.value = 'Equipo B';
  showToast('Día reiniciado 🏀', 'info');
}

/* ============================================================
   EVENT LISTENERS
   ============================================================ */
function initEventListeners() {
  // ---- Recreativo ----
  document.getElementById('btn-add-player').addEventListener('click', () => {
    const input = document.getElementById('player-name-input');
    addPlayer(input.value);
    input.value = '';
    input.focus();
  });
  document.getElementById('player-name-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { addPlayer(e.target.value); e.target.value = ''; }
  });
  document.getElementById('btn-generate-match').addEventListener('click', generateMatch);
  document.getElementById('btn-win-a').addEventListener('click', () => registerWinner('A'));
  document.getElementById('btn-win-b').addEventListener('click', () => registerWinner('B'));
  document.getElementById('btn-reset-day').addEventListener('click', resetDay);
  document.getElementById('btn-timer-toggle').addEventListener('click', toggleTimer);
  document.getElementById('btn-timer-reset').addEventListener('click', resetTimer);
  document.getElementById('btn-preset-10').addEventListener('click', () => setPresetTimer(10 * 60));
  document.getElementById('btn-preset-12').addEventListener('click', () => setPresetTimer(12 * 60));
  document.getElementById('btn-preset-1').addEventListener('click', () => setPresetTimer(1 * 60));
  document.getElementById('btn-preset-10s').addEventListener('click', () => setPresetTimer(10));
  document.getElementById('btn-adjust-plus-min').addEventListener('click', () => adjustTimerTime(60));
  document.getElementById('btn-adjust-plus-sec').addEventListener('click', () => adjustTimerTime(10));
  document.getElementById('btn-shot-24').addEventListener('click', () => resetShotClock(24));
  document.getElementById('btn-shot-14').addEventListener('click', () => resetShotClock(14));
  document.getElementById('btn-foul-plus-a').addEventListener('click', () => adjustFouls('a', 1));
  document.getElementById('btn-foul-minus-a').addEventListener('click', () => adjustFouls('a', -1));
  document.getElementById('btn-foul-plus-b').addEventListener('click', () => adjustFouls('b', 1));
  document.getElementById('btn-foul-minus-b').addEventListener('click', () => adjustFouls('b', -1));
  document.getElementById('btn-theme-toggle').addEventListener('click', toggleTheme);
  document.getElementById('btn-share-day').addEventListener('click', shareDaySummary);

  // ---- Torneo ----
  document.getElementById('btn-add-tournament-a').addEventListener('click', () => {
    const nameInput   = document.getElementById('tournament-player-a-input');
    const jerseyInput = document.getElementById('tournament-jersey-a-input');
    addTournamentPlayer(nameInput.value, 'a', jerseyInput.value);
    nameInput.value   = '';
    jerseyInput.value = '';
    nameInput.focus();
  });
  document.getElementById('tournament-player-a-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const jerseyInput = document.getElementById('tournament-jersey-a-input');
      addTournamentPlayer(e.target.value, 'a', jerseyInput.value);
      e.target.value    = '';
      jerseyInput.value = '';
    }
  });
  document.getElementById('btn-add-tournament-b').addEventListener('click', () => {
    const nameInput   = document.getElementById('tournament-player-b-input');
    const jerseyInput = document.getElementById('tournament-jersey-b-input');
    addTournamentPlayer(nameInput.value, 'b', jerseyInput.value);
    nameInput.value   = '';
    jerseyInput.value = '';
    nameInput.focus();
  });
  document.getElementById('tournament-player-b-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const jerseyInput = document.getElementById('tournament-jersey-b-input');
      addTournamentPlayer(e.target.value, 'b', jerseyInput.value);
      e.target.value    = '';
      jerseyInput.value = '';
    }
  });
  document.getElementById('btn-generate-tournament').addEventListener('click', generateTournamentMatch);

  // Nombres de equipos editables
  document.getElementById('tournament-team-a-name').addEventListener('input', (e) => {
    state.tournamentTeamAName = e.target.value.trim() || 'Equipo A';
    saveState();
    if (state.tournamentMatchActive) {
      const el = document.getElementById('t-score-name-a');
      if (el) el.textContent = state.tournamentTeamAName;
      const bsLabel = document.getElementById('bs-team-a-label');
      if (bsLabel) bsLabel.textContent = `📋 ${state.tournamentTeamAName} — Box Score`;
      const winLabel = document.getElementById('t-win-label-a');
      if (winLabel) winLabel.textContent = state.tournamentTeamAName;
    }
  });
  document.getElementById('tournament-team-b-name').addEventListener('input', (e) => {
    state.tournamentTeamBName = e.target.value.trim() || 'Equipo B';
    saveState();
    if (state.tournamentMatchActive) {
      const el = document.getElementById('t-score-name-b');
      if (el) el.textContent = state.tournamentTeamBName;
      const bsLabel = document.getElementById('bs-team-b-label');
      if (bsLabel) bsLabel.textContent = `📋 ${state.tournamentTeamBName} — Box Score`;
      const winLabel = document.getElementById('t-win-label-b');
      if (winLabel) winLabel.textContent = state.tournamentTeamBName;
    }
  });

  // Exportar box score
  document.getElementById('btn-export-a').addEventListener('click', () => exportBoxScore('a'));
  document.getElementById('btn-export-b').addEventListener('click', () => exportBoxScore('b'));

  // Timer de torneo
  document.getElementById('t-btn-timer-toggle').addEventListener('click', tToggleTimer);
  document.getElementById('t-btn-timer-reset').addEventListener('click', tResetTimer);
  document.getElementById('t-btn-preset-10').addEventListener('click', () => tSetPresetTimer(10 * 60));
  document.getElementById('t-btn-preset-12').addEventListener('click', () => tSetPresetTimer(12 * 60));
  document.getElementById('t-btn-preset-1').addEventListener('click', () => tSetPresetTimer(1 * 60));
  document.getElementById('t-btn-preset-10s').addEventListener('click', () => tSetPresetTimer(10));
  document.getElementById('t-btn-adjust-plus-min').addEventListener('click', () => tAdjustTimerTime(60));
  document.getElementById('t-btn-adjust-plus-sec').addEventListener('click', () => tAdjustTimerTime(10));
  document.getElementById('t-btn-shot-24').addEventListener('click', () => tResetShotClock(24));
  document.getElementById('t-btn-shot-14').addEventListener('click', () => tResetShotClock(14));

  // Ganador del torneo
  document.getElementById('t-btn-win-a').addEventListener('click', () => registerTournamentWinner('a'));
  document.getElementById('t-btn-win-b').addEventListener('click', () => registerTournamentWinner('b'));

  // Agregar jugadores tarde desde el box score
  document.getElementById('btn-add-late-a').addEventListener('click', () => {
    const nameInput = document.getElementById('late-name-a');
    const jerseyInput = document.getElementById('late-jersey-a');
    addLatePlayer('a', nameInput.value, jerseyInput.value);
    nameInput.value = '';
    jerseyInput.value = '';
  });
  document.getElementById('late-name-a').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const jerseyInput = document.getElementById('late-jersey-a');
      addLatePlayer('a', e.target.value, jerseyInput.value);
      e.target.value = '';
      jerseyInput.value = '';
    }
  });

  document.getElementById('btn-add-late-b').addEventListener('click', () => {
    const nameInput = document.getElementById('late-name-b');
    const jerseyInput = document.getElementById('late-jersey-b');
    addLatePlayer('b', nameInput.value, jerseyInput.value);
    nameInput.value = '';
    jerseyInput.value = '';
  });
  document.getElementById('late-name-b').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const jerseyInput = document.getElementById('late-jersey-b');
      addLatePlayer('b', e.target.value, jerseyInput.value);
      e.target.value = '';
      jerseyInput.value = '';
    }
  });

  // ---- Mode Toggle ----
  document.getElementById('btn-mode-recreational').addEventListener('click', () => setGameMode('recreational'));
  document.getElementById('btn-mode-tournament').addEventListener('click', () => setGameMode('tournament'));

  // ---- Mobile Nav ----
  document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget.dataset.target;
      document.querySelectorAll('.mobile-nav-btn').forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      document.querySelectorAll('.panel').forEach(p => p.classList.remove('active-tab'));
      const activePanel = document.getElementById(`panel-${target}`);
      if (activePanel) activePanel.classList.add('active-tab');
    });
  });
}

/* ============================================================
   INIT
   ============================================================ */
function init() {
  loadState();
  initParticles();
  applyTheme();
  initEventListeners();

  // Si había partido recreativo activo al recargar, reanudar timer
  if (state.matchActive && state.timerRunning) {
    startTimer(false);
  } else {
    state.timerRunning = false;
    updateTimerUI();
    updateShotClockUI();
    updateMatchTimerUI();
  }

  // Si había partido de torneo activo al recargar, reanudar timer de torneo y minutos
  if (state.tournamentMatchActive && state.tTimerRunning) {
    tStartTimer(false);
    startPlayerMinInterval();
    document.body.classList.add('tournament-in-progress');
  } else {
    state.tTimerRunning = false;
    tUpdateTimerUI();
    tUpdateShotClockUI();
    tUpdateMatchTimerUI();
  }

  renderQueue();
  renderCourt();
  renderHistory();
  renderTournamentRosters();
  renderTournamentCourt();
  updateTournamentGenerateBtn();
  applyGameMode();
}

document.addEventListener('DOMContentLoaded', init);
