/**
 * Basketball Court - App Logic
 * ============================================================
 * Estado del app:
 *   players  → todos los jugadores registrados hoy (con stats)
 *   queue    → cola ordenada de jugadores esperando
 *   teamA    → quinteto A en cancha
 *   teamB    → quinteto B en cancha
 *   scoreA   → puntos totales equipo A en partido actual
 *   scoreB   → puntos totales equipo B en partido actual
 *   playerScores → { playerName: pts } del partido actual
 *   matchHistory → historial de partidos del día
 *   matchCount → número de partido actual
 *   teamAIsDefender → si el Equipo A es el defensor (ganó el anterior)
 *   timerInterval → referencia al timer del partido
 *   timerSeconds → segundos del cronómetro
 */

/* ============================================================
   ESTADO GLOBAL
   ============================================================ */
const state = {
  players:       [],
  queue:         [],
  teamA:         [],
  teamB:         [],
  scoreA:        0,
  scoreB:        0,
  foulsA:        0,
  foulsB:        0,
  playerScores:  {},
  matchHistory:  [],
  matchCount:    0,
  teamAIsDefender: false,
  timerInterval: null,
  timerSeconds:  0,
  timerRunning:  false,
  matchActive:   false,
  theme:         'dark',
};

/* ============================================================
   STORAGE
   ============================================================ */
const STORAGE_KEY = 'basketball_court_state';

function saveState() {
  const toSave = {
    players:       state.players,
    queue:         state.queue,
    teamA:         state.teamA,
    teamB:         state.teamB,
    scoreA:        state.scoreA,
    scoreB:        state.scoreB,
    foulsA:        state.foulsA,
    foulsB:        state.foulsB,
    playerScores:  state.playerScores,
    matchHistory:  state.matchHistory,
    matchCount:    state.matchCount,
    teamAIsDefender: state.teamAIsDefender,
    timerSeconds:  state.timerSeconds,
    timerRunning:  state.timerRunning,
    matchActive:   state.matchActive,
    theme:         state.theme,
  };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave)); } catch(e) {}
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    Object.assign(state, saved);
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
   TIMER
   ============================================================ */
function startTimer(resetSeconds = true) {
  if (resetSeconds) state.timerSeconds = 0;
  clearInterval(state.timerInterval);
  state.timerRunning = true;
  updateTimerUI();
  state.timerInterval = setInterval(() => {
    state.timerSeconds++;
    document.getElementById('match-timer').textContent = formatTime(state.timerSeconds);
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
    if (state.timerRunning) {
      toggleBtn.innerHTML = '⏸️ Pausa';
    } else {
      toggleBtn.innerHTML = '▶️ Reanudar';
    }
  }
}

function toggleTimer() {
  if (!state.matchActive) return;
  if (state.timerRunning) {
    stopTimer();
  } else {
    startTimer(false);
  }
  saveState();
}

function resetTimer() {
  if (!state.matchActive) return;
  state.timerSeconds = 0;
  document.getElementById('match-timer').textContent = formatTime(0);
  saveState();
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
   RENDER QUEUE LIST
   ============================================================ */
function renderQueue() {
  const list     = document.getElementById('queue-list');
  const emptyEl  = document.getElementById('queue-empty');
  const badgeEl  = document.getElementById('badge-queue');
  const hdrQueue = document.getElementById('hdr-queue');
  const hdrTotal = document.getElementById('hdr-total');
  const btnGen   = document.getElementById('btn-generate-match');
  const hint     = document.getElementById('generate-hint');

  // Jugadores que están esperando (no están en cancha)
  const onCourt  = [...state.teamA, ...state.teamB];
  const waiting  = state.queue.filter(p => !onCourt.includes(p));

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

  // Badges y header chips
  badgeEl.textContent  = waiting.length;
  hdrQueue.textContent = waiting.length;
  hdrTotal.textContent = state.players.length;

  // Botón generar partido
  const canGenerate = !state.matchActive && waiting.length >= 10;
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
   RENDER COURT (Partido activo)
   ============================================================ */
function renderCourt() {
  const courtIdle   = document.getElementById('court-idle');
  const courtActive = document.getElementById('court-active');

  if (!state.matchActive) {
    courtIdle.style.display   = 'flex';
    courtActive.style.display = 'none';
    return;
  }

  courtIdle.style.display   = 'none';
  courtActive.style.display = 'flex';

  // Match number
  document.getElementById('match-number').textContent = `#${state.matchCount}`;

  // Scoreboard
  document.getElementById('score-a').textContent = state.scoreA;
  document.getElementById('score-b').textContent = state.scoreB;
  document.getElementById('match-timer').textContent = formatTime(state.timerSeconds);

  // Team names in scoreboard
  document.getElementById('score-name-a').textContent = 'Equipo A';
  document.getElementById('score-name-b').textContent = 'Equipo B';

  // Defender badge
  const defBadge  = document.getElementById('defender-badge');
  const cardA     = document.getElementById('team-card-a');
  const cardB     = document.getElementById('team-card-b');
  const tagA      = cardA.querySelector('.team-tag');
  const tagB      = cardB.querySelector('.team-tag');

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

  // Update fouls UI
  updateFoulsUI();
  updateTimerUI();

  // Team A players
  renderPlayerScoreList('team-a-players', state.teamA, 'a');
  // Team B players
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

  if (cardA) {
    if (state.foulsA >= 5) {
      cardA.classList.add('bonus-active');
    } else {
      cardA.classList.remove('bonus-active');
    }
  }

  if (cardB) {
    if (state.foulsB >= 5) {
      cardB.classList.add('bonus-active');
    } else {
      cardB.classList.remove('bonus-active');
    }
  }
}

function renderPlayerScoreList(containerId, players, team) {
  const ul = document.getElementById(containerId);
  ul.innerHTML = '';
  players.forEach(player => {
    const pts = state.playerScores[player] || 0;
    const li  = document.createElement('li');
    li.className = 'player-score-item';
    li.id = `psi-${player.replace(/\s+/g,'_')}`;

    const nameEl = document.createElement('div');
    nameEl.className = 'psi-name';
    nameEl.textContent = player;

    const ptsEl = document.createElement('div');
    ptsEl.className = 'psi-pts';
    ptsEl.id = `pts-${player.replace(/\s+/g,'_')}`;
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

    li.appendChild(nameEl);
    li.appendChild(ptsEl);
    li.appendChild(btns);
    ul.appendChild(li);
  });
}

/* ============================================================
   RENDER HISTORY
   ============================================================ */
function renderHistory() {
  const list    = document.getElementById('history-list');
  const emptyEl = document.getElementById('history-empty');
  const badge   = document.getElementById('badge-history');

  badge.textContent = state.matchHistory.length;

  if (state.matchHistory.length === 0) {
    list.innerHTML = '';
    if (emptyEl) emptyEl.style.display = 'flex';
    return;
  }

  if (emptyEl) emptyEl.style.display = 'none';
  list.innerHTML = '';

  // Mostrar más reciente primero
  [...state.matchHistory].reverse().forEach(match => {
    const card = document.createElement('div');
    card.className = 'history-card';

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

    // Top scorers
    const scorerEntries = Object.entries(match.playerScores)
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
   ADD PLAYER
   ============================================================ */
function addPlayer(name) {
  const trimmed = name.trim();
  if (!trimmed) return;

  // No duplicados
  if (state.queue.some(p => p.toLowerCase() === trimmed.toLowerCase())) {
    showToast(`"${trimmed}" ya está en la lista`, 'error');
    return;
  }

  // Agregar al registro de jugadores si no existe
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
   GENERATE MATCH
   ============================================================ */
function generateMatch() {
  if (state.matchActive) return;

  const onCourt = [...state.teamA, ...state.teamB];
  const available = state.queue.filter(p => !onCourt.includes(p));

  if (available.length < 6) {
    showToast('Necesitas al menos 6 jugadores para generar un partido', 'error');
    return;
  }

  const teamSize  = available.length >= 10 ? 5 : Math.floor(available.length / 2);
  const needed    = teamSize * 2;

  // Tomar los primeros `needed` de la cola (en orden, sin mezclar)
  const selected  = available.slice(0, needed);
  // Dividir en dos grupos
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

/* ============================================================
   GENERATE NEXT MATCH (después de que alguien ganó)
   ============================================================ */
function generateNextMatch(winnerTeam) {
  // Los ganadores se quedan en su slot
  const winnerPlayers = winnerTeam === 'A' ? [...state.teamA] : [...state.teamB];
  const loserPlayers  = winnerTeam === 'A' ? [...state.teamB] : [...state.teamA];

  // Los perdedores van al FINAL de la cola (en el mismo orden)
  // Primero sacarlos de sus posiciones actuales en la cola
  state.queue = state.queue.filter(p => !loserPlayers.includes(p));
  // Agregarlos al final
  state.queue.push(...loserPlayers);

  // Los jugadores que siguen en la cola (excluyendo al equipo ganador)
  const onCourt   = winnerPlayers;
  const available = state.queue.filter(p => !onCourt.includes(p));
  const teamSize  = winnerPlayers.length;

  if (available.length < teamSize) {
    // No hay suficientes para armar un retador completo
    // Usar los que haya
    if (available.length === 0) {
      // Solo el equipo ganador, no hay retador
      state.matchActive = false;
      stopTimer();
      saveState();
      renderQueue();
      renderCourt();
      showToast('🏆 ¡No hay más retadores! Agrega más jugadores.', 'info', 5000);
      return;
    }
  }

  const challengers = available.slice(0, teamSize);

  // Configurar el nuevo partido
  if (winnerTeam === 'A') {
    // Equipo A defiende, equipo B son los retadores
    state.teamA = winnerPlayers;
    state.teamB = challengers;
    state.teamAIsDefender = true;
  } else {
    // Equipo B defiende, equipo A son los retadores
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
   ADD POINTS TO PLAYER
   ============================================================ */
function addPoints(player, team, pts) {
  if (!state.matchActive) return;

  state.playerScores[player] = (state.playerScores[player] || 0) + pts;

  if (team === 'a') {
    state.scoreA += pts;
    // Animación bump al marcador
    const scoreEl = document.getElementById('score-a');
    scoreEl.textContent = state.scoreA;
    scoreEl.classList.remove('bump');
    void scoreEl.offsetWidth; // reflow
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

  // Actualizar pts del jugador en el DOM directamente (sin re-render completo)
  const ptsEl = document.getElementById(`pts-${player.replace(/\s+/g,'_')}`);
  if (ptsEl) ptsEl.innerHTML = `${state.playerScores[player]}<span> pts</span>`;

  saveState();
}

/* ============================================================
   REGISTER WINNER
   ============================================================ */
function registerWinner(winnerTeam) {
  if (!state.matchActive) return;
  stopTimer();

  const winnerName   = `Equipo ${winnerTeam}`;
  const winnerScore  = winnerTeam === 'A' ? state.scoreA : state.scoreB;
  const loserScore   = winnerTeam === 'A' ? state.scoreB : state.scoreA;
  const winnerRoster = winnerTeam === 'A' ? state.teamA : state.teamB;
  const loserRoster  = winnerTeam === 'A' ? state.teamB : state.teamA;

  // Guardar en historial
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

  // Mostrar modal de ganador
  showWinnerModal(winnerTeam, winnerName, winnerScore, loserScore, winnerRoster);
  launchConfetti();
  renderHistory();
}

/* ============================================================
   WINNER MODAL
   ============================================================ */
function showWinnerModal(winnerTeam, winnerName, winnerScore, loserScore, winnerRoster) {
  const modal       = document.getElementById('winner-modal');
  const titleEl     = document.getElementById('modal-winner-name');
  const subEl       = document.getElementById('modal-winner-sub');
  const summaryEl   = document.getElementById('modal-score-summary');
  const playersEl   = document.getElementById('modal-winner-players');

  titleEl.textContent = `🏆 ${winnerName} Ganó!`;

  const onCourt = [...state.teamA, ...state.teamB];
  const available = state.queue.filter(p => !onCourt.includes(p));
  const loserCount = winnerTeam === 'A' ? state.teamB.length : state.teamA.length;

  if (available.length >= loserCount) {
    subEl.textContent = `${winnerName} se queda en cancha. Los perdedores van al final de la cola. Los siguientes retadores están listos.`;
  } else {
    subEl.textContent = `${winnerName} se queda en cancha. No hay suficientes jugadores en cola para el siguiente partido.`;
  }

  // Scoreboard resumen
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

  // Tabla de puntos del equipo ganador
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
  state.players       = [];
  state.queue         = [];
  state.teamA         = [];
  state.teamB         = [];
  state.scoreA        = 0;
  state.scoreB        = 0;
  state.playerScores  = {};
  state.matchHistory  = [];
  state.matchCount    = 0;
  state.teamAIsDefender = false;
  state.timerSeconds  = 0;
  state.matchActive   = false;
  saveState();
  renderQueue();
  renderCourt();
  renderHistory();
  showToast('Día reiniciado 🏀', 'info');
}

/* ============================================================
   EVENT LISTENERS
   ============================================================ */
function initEventListeners() {
  // Añadir jugador: botón
  document.getElementById('btn-add-player').addEventListener('click', () => {
    const input = document.getElementById('player-name-input');
    addPlayer(input.value);
    input.value = '';
    input.focus();
  });

  // Añadir jugador: Enter
  document.getElementById('player-name-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const input = e.target;
      addPlayer(input.value);
      input.value = '';
    }
  });

  // Generar partido
  document.getElementById('btn-generate-match').addEventListener('click', generateMatch);

  // Registrar ganador
  document.getElementById('btn-win-a').addEventListener('click', () => registerWinner('A'));
  document.getElementById('btn-win-b').addEventListener('click', () => registerWinner('B'));

  // Reset día
  document.getElementById('btn-reset-day').addEventListener('click', resetDay);

  // Reloj de partido
  document.getElementById('btn-timer-toggle').addEventListener('click', toggleTimer);
  document.getElementById('btn-timer-reset').addEventListener('click', resetTimer);

  // Faltas de equipo A
  document.getElementById('btn-foul-plus-a').addEventListener('click', () => adjustFouls('a', 1));
  document.getElementById('btn-foul-minus-a').addEventListener('click', () => adjustFouls('a', -1));

  // Faltas de equipo B
  document.getElementById('btn-foul-plus-b').addEventListener('click', () => adjustFouls('b', 1));
  document.getElementById('btn-foul-minus-b').addEventListener('click', () => adjustFouls('b', -1));

  // Cambiar tema
  document.getElementById('btn-theme-toggle').addEventListener('click', toggleTheme);

  // Control de pestañas móviles (Responsive Navigation)
  document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget.dataset.target;
      
      // Actualizar botones activos
      document.querySelectorAll('.mobile-nav-btn').forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      
      // Actualizar paneles activos
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

  // Si había partido activo al recargar, reanudar timer si estaba corriendo
  if (state.matchActive && state.timerRunning) {
    startTimer(false);
  } else {
    state.timerRunning = false;
    updateTimerUI();
  }

  renderQueue();
  renderCourt();
  renderHistory();
}

document.addEventListener('DOMContentLoaded', init);
