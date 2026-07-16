// ============================================
// HAUNTED CLICK - LÓGICA COMPLETA DO JOGO
// ============================================

// --- ELEMENTOS DO DOM ---
const screens = {
    start: document.getElementById('startScreen'),
    game: document.getElementById('gameScreen'),
    pause: document.getElementById('pauseScreen'),
    gameover: document.getElementById('gameoverScreen')
};

const elements = {
    // HUD
    score: document.getElementById('score'),
    combo: document.getElementById('combo'),
    lives: document.getElementById('lives'),
    timer: document.getElementById('timer'),
    level: document.getElementById('level'),
    progressBar: document.getElementById('progressBar'),
    
    // Área do jogo
    gameArea: document.getElementById('gameArea'),
    ghostsContainer: document.getElementById('ghostsContainer'),
    powerupsContainer: document.getElementById('powerupsContainer'),
    clickEffect: document.getElementById('clickEffect'),
    
    // Tela final
    finalScore: document.getElementById('finalScore'),
    finalCombo: document.getElementById('finalCombo'),
    finalLevel: document.getElementById('finalLevel'),
    
    // High Score
    startHighScore: document.getElementById('startHighScoreValue'),
    gameoverHighScore: document.getElementById('gameoverHighScoreValue'),
    
    // Relâmpago
    lightning: document.getElementById('lightning'),
    
    // Botões
    startBtn: document.getElementById('startBtn'),
    pauseBtn: document.getElementById('pauseBtn'),
    resumeBtn: document.getElementById('resumeBtn'),
    quitBtn: document.getElementById('quitBtn'),
    restartBtn: document.getElementById('restartBtn')
};

// --- ÁUDIO ---
const sounds = {
    click: document.getElementById('clickSound'),
    combo: document.getElementById('comboSound'),
    miss: document.getElementById('missSound'),
    gameover: document.getElementById('gameoverSound')
};

// --- ESTADO DO JOGO ---
const gameState = {
    score: 0,
    combo: 1,
    maxCombo: 1,
    lives: 3,
    timeLeft: 60,
    level: 1,
    isRunning: false,
    isPaused: false,
    ghostSpeed: 2000,
    spawnInterval: null,
    timerInterval: null,
    ghostTimeout: null,
    powerupTimeout: null,
    ghostsActive: 0,
    maxGhosts: 3
};

// --- CONFIGURAÇÕES ---
const CONFIG = {
    TOTAL_TIME: 60,
    MAX_LIVES: 3,
    MAX_GHOSTS_BASE: 3,
    GHOST_BASE_SPEED: 2000,
    GHOST_MIN_SPEED: 800,
    SPEED_INCREMENT: 150,
    GHOST_SIZE: 50,
    POWERUP_CHANCE: 0.15,
    COMBO_MULTIPLIER: 2,
    POINTS_PER_CLICK: 10,
    LEVEL_UP_TIME: 15
};

// ============================================
// GERENCIAMENTO DE TELAS
// ============================================

function showScreen(screenName) {
    Object.values(screens).forEach(screen => screen.classList.remove('active'));
    screens[screenName].classList.add('active');
}

// ============================================
// HIGH SCORE (LocalStorage)
// ============================================

function getHighScore() {
    return parseInt(localStorage.getItem('hauntedClickHighScore')) || 0;
}

function setHighScore(score) {
    const current = getHighScore();
    if (score > current) {
        localStorage.setItem('hauntedClickHighScore', score);
        return true;
    }
    return false;
}

function updateHighScoreDisplay() {
    const hs = getHighScore();
    elements.startHighScore.textContent = hs;
    elements.gameoverHighScore.textContent = hs;
}

// ============================================
// EFEITOS VISUAIS
// ============================================

function triggerLightning() {
    elements.lightning.classList.add('active');
    setTimeout(() => elements.lightning.classList.remove('active'), 150);
    
    // Às vezes, dois relâmpagos seguidos
    if (Math.random() < 0.3) {
        setTimeout(() => {
            elements.lightning.classList.add('active');
            setTimeout(() => elements.lightning.classList.remove('active'), 100);
        }, 300);
    }
}

function startRandomLightning() {
    if (!gameState.isRunning) return;
    
    const delay = Math.random() * 8000 + 3000; // 3 a 11 segundos
    setTimeout(() => {
        triggerLightning();
        startRandomLightning();
    }, delay);
}

function showClickEffect(x, y, text) {
    const effect = document.createElement('div');
    effect.className = 'click-effect';
    effect.textContent = text;
    effect.style.left = x + 'px';
    effect.style.top = y + 'px';
    elements.gameArea.appendChild(effect);
    
    setTimeout(() => effect.remove(), 800);
}

// ============================================
// ÁUDIO
// ============================================

function playSound(soundName) {
    const sound = sounds[soundName];
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(() => {}); // Ignora erros de autoplay
    }
}

// ============================================
// ATUALIZAÇÃO DO HUD
// ============================================

function updateHUD() {
    elements.score.textContent = gameState.score;
    
    if (gameState.combo > 1) {
        elements.combo.textContent = `x${gameState.combo}`;
        elements.combo.style.color = 'var(--laranja-claro)';
    } else {
        elements.combo.textContent = 'x1';
        elements.combo.style.color = 'var(--dourado)';
    }
    
    // Vidas com emojis
    const hearts = '💀'.repeat(gameState.lives) + '🖤'.repeat(CONFIG.MAX_LIVES - gameState.lives);
    elements.lives.textContent = hearts;
    
    elements.timer.textContent = `${gameState.timeLeft}s`;
    elements.level.textContent = gameState.level;
    
    // Barra de progresso
    const progress = (gameState.timeLeft / CONFIG.TOTAL_TIME) * 100;
    elements.progressBar.style.width = progress + '%';
    
    // Cor da barra muda conforme tempo
    if (progress < 25) {
        elements.progressBar.style.background = 'linear-gradient(90deg, var(--vermelho-vivo), var(--laranja-queimado))';
    } else if (progress < 50) {
        elements.progressBar.style.background = 'linear-gradient(90deg, var(--laranja-queimado), var(--dourado))';
    } else {
        elements.progressBar.style.background = 'linear-gradient(90deg, var(--roxo-medio), var(--dourado))';
    }
}

// ============================================
// GERAÇÃO DE FANTASMAS
// ============================================

function getRandomPosition() {
    const area = elements.gameArea.getBoundingClientRect();
    const padding = 60;
    const x = Math.random() * (area.width - padding * 2) + padding;
    const y = Math.random() * (area.height - padding * 2) + padding;
    return { x, y };
}

function createGhost() {
    if (!gameState.isRunning || gameState.ghostsActive >= gameState.maxGhosts) return;
    
    const ghost = document.createElement('div');
    ghost.className = 'ghost';
    ghost.textContent = '👻';
    
    const { x, y } = getRandomPosition();
    ghost.style.left = x + 'px';
    ghost.style.top = y + 'px';
    
    // Evento de clique no fantasma
    ghost.addEventListener('click', (e) => {
        e.stopPropagation();
        onGhostClick(ghost, e);
    });
    
    elements.ghostsContainer.appendChild(ghost);
    gameState.ghostsActive++;
    
    // O fantasma desaparece após um tempo
    const timeout = setTimeout(() => {
        if (ghost.parentNode) {
            onGhostMiss(ghost);
        }
    }, gameState.ghostSpeed);
    
    // Salva o timeout no elemento pra limpar depois
    ghost._timeout = timeout;
}

function onGhostClick(ghost, event) {
    clearTimeout(ghost._timeout);
    
    // Pontuação com combo
    const points = CONFIG.POINTS_PER_CLICK * gameState.combo;
    gameState.score += points;
    gameState.combo++;
    if (gameState.combo > gameState.maxCombo) {
        gameState.maxCombo = gameState.combo;
    }
    
    // Efeitos
    ghost.classList.add('clicked');
    playSound(gameState.combo > 3 ? 'combo' : 'click');
    showClickEffect(event.offsetX, event.offsetY, `+${points}`);
    
    // Remove o fantasma
    setTimeout(() => {
        ghost.remove();
        gameState.ghostsActive--;
    }, 300);
    
    updateHUD();
    checkLevelUp();
}

function onGhostMiss(ghost) {
    ghost.remove();
    gameState.ghostsActive--;
    gameState.combo = 1; // Reseta o combo
    gameState.lives--;
    
    playSound('miss');
    updateHUD();
    
    // Tremer a tela
    elements.gameArea.style.animation = 'shake 0.3s ease';
    setTimeout(() => {
        elements.gameArea.style.animation = '';
    }, 300);
    
    if (gameState.lives <= 0) {
        endGame();
    }
}

// Tremer tela
const shakeKeyframes = `
@keyframes shake {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-5px); }
    40% { transform: translateX(5px); }
    60% { transform: translateX(-5px); }
    80% { transform: translateX(5px); }
}
`;
const shakeStyle = document.createElement('style');
shakeStyle.textContent = shakeKeyframes;
document.head.appendChild(shakeStyle);

// Clique na área vazia (errou)
elements.gameArea.addEventListener('click', (e) => {
    if (!gameState.isRunning) return;
    if (e.target === elements.gameArea || e.target === elements.ghostsContainer) {
        gameState.combo = 1;
        updateHUD();
    }
});

// ============================================
// POWER-UPS
// ============================================

function createPowerup() {
    if (!gameState.isRunning) return;
    if (Math.random() > CONFIG.POWERUP_CHANCE) return;
    
    const powerups = ['⚡', '❄️', '💎', '🌟'];
    const powerupEmoji = powerups[Math.floor(Math.random() * powerups.length)];
    
    const powerup = document.createElement('div');
    powerup.className = 'powerup';
    powerup.textContent = powerupEmoji;
    
    const { x, y } = getRandomPosition();
    powerup.style.left = x + 'px';
    powerup.style.top = y + 'px';
    
    powerup.addEventListener('click', (e) => {
        e.stopPropagation();
        activatePowerup(powerup, powerupEmoji);
    });
    
    elements.powerupsContainer.appendChild(powerup);
    
    // Power-up some após 3 segundos
    setTimeout(() => {
        if (powerup.parentNode) {
            powerup.remove();
        }
    }, 3000);
}

function activatePowerup(powerup, type) {
    powerup.remove();
    playSound('combo');
    
    switch(type) {
        case '⚡':
            // Dobro de pontos por 5 segundos
            gameState.combo = Math.max(gameState.combo, CONFIG.COMBO_MULTIPLIER);
            showClickEffect(0, 0, '⚡ 2X PONTOS!');
            break;
        case '❄️':
            // Slow motion por 3 segundos
            const originalSpeed = gameState.ghostSpeed;
            gameState.ghostSpeed = Math.min(gameState.ghostSpeed * 2, 4000);
            showClickEffect(0, 0, '❄️ SLOW!');
            setTimeout(() => {
                gameState.ghostSpeed = originalSpeed;
            }, 3000);
            break;
        case '💎':
            // Bônus de 50 pontos
            gameState.score += 50;
            showClickEffect(0, 0, '💎 +50!');
            break;
        case '🌟':
            // Recupera 1 vida
            if (gameState.lives < CONFIG.MAX_LIVES) {
                gameState.lives++;
                showClickEffect(0, 0, '🌟 +1 VIDA!');
            }
            break;
    }
    updateHUD();
}

// ============================================
// SISTEMA DE LEVEL
// ============================================

function checkLevelUp() {
    const newLevel = Math.floor(gameState.score / 100) + 1;
    if (newLevel > gameState.level) {
        gameState.level = newLevel;
        gameState.maxGhosts = CONFIG.MAX_GHOSTS_BASE + Math.floor((newLevel - 1) / 2);
        gameState.ghostSpeed = Math.max(
            CONFIG.GHOST_MIN_SPEED,
            CONFIG.GHOST_BASE_SPEED - (newLevel - 1) * CONFIG.SPEED_INCREMENT
        );
        showClickEffect(0, 0, `⬆ NÍVEL ${newLevel}!`);
        triggerLightning();
    }
}

// ============================================
// LOOP PRINCIPAL DO JOGO
// ============================================

function startSpawning() {
    // Spawn de fantasmas
    gameState.spawnInterval = setInterval(() => {
        if (!gameState.isPaused) {
            createGhost();
        }
    }, gameState.ghostSpeed / 2);
    
    // Spawn de power-ups
    gameState.powerupTimeout = setInterval(() => {
        if (!gameState.isPaused) {
            createPowerup();
        }
    }, 2000);
    
    // Timer
    gameState.timerInterval = setInterval(() => {
        if (!gameState.isPaused) {
            gameState.timeLeft--;
            updateHUD();
            
            if (gameState.timeLeft <= 0) {
                endGame();
            }
        }
    }, 1000);
}

function stopSpawning() {
    clearInterval(gameState.spawnInterval);
    clearInterval(gameState.timerInterval);
    clearInterval(gameState.powerupTimeout);
    
    // Remove todos os fantasmas
    elements.ghostsContainer.innerHTML = '';
    elements.powerupsContainer.innerHTML = '';
    gameState.ghostsActive = 0;
}

// ============================================
// INICIAR / REINICIAR JOGO
// ============================================

function startGame() {
    // Reset estado
    gameState.score = 0;
    gameState.combo = 1;
    gameState.maxCombo = 1;
    gameState.lives = CONFIG.MAX_LIVES;
    gameState.timeLeft = CONFIG.TOTAL_TIME;
    gameState.level = 1;
    gameState.isRunning = true;
    gameState.isPaused = false;
    gameState.ghostSpeed = CONFIG.GHOST_BASE_SPEED;
    gameState.maxGhosts = CONFIG.MAX_GHOSTS_BASE;
    gameState.ghostsActive = 0;
    
    // Limpa containers
    elements.ghostsContainer.innerHTML = '';
    elements.powerupsContainer.innerHTML = '';
    
    // Atualiza HUD
    updateHUD();
    elements.progressBar.style.width = '100%';
    
    // Mostra tela do jogo
    showScreen('game');
    
    // Inicia spawn e timer
    startSpawning();
    
    // Inicia relâmpagos aleatórios
    startRandomLightning();
    
    // Cursor personalizado na área do jogo
    elements.gameArea.style.cursor = 'crosshair';
}

function endGame() {
    gameState.isRunning = false;
    stopSpawning();
    
    playSound('gameover');
    triggerLightning();
    
    // Atualiza high score
    const isNewHighScore = setHighScore(gameState.score);
    
    // Atualiza tela final
    elements.finalScore.textContent = gameState.score;
    elements.finalCombo.textContent = `Melhor Combo: x${gameState.maxCombo}`;
    elements.finalLevel.textContent = `Nível Alcançado: ${gameState.level}`;
    updateHighScoreDisplay();
    
    // Se for novo recorde
    if (isNewHighScore && gameState.score > 0) {
        elements.finalScore.style.color = 'var(--dourado)';
        elements.finalScore.textContent = gameState.score + ' 🏆';
    } else {
        elements.finalScore.style.color = 'var(--dourado)';
    }
    
    showScreen('gameover');
    elements.gameArea.style.cursor = 'default';
}

function resetGame() {
    stopSpawning();
    gameState.isRunning = false;
    gameState.isPaused = false;
    elements.gameArea.style.cursor = 'default';
    showScreen('start');
    updateHighScoreDisplay();
}

// ============================================
// PAUSA
// ============================================

function pauseGame() {
    if (!gameState.isRunning) return;
    gameState.isPaused = true;
    showScreen('pause');
}

function resumeGame() {
    gameState.isPaused = false;
    showScreen('game');
}

// ============================================
// EVENT LISTENERS
// ============================================

elements.startBtn.addEventListener('click', startGame);
elements.pauseBtn.addEventListener('click', pauseGame);
elements.resumeBtn.addEventListener('click', resumeGame);
elements.quitBtn.addEventListener('click', resetGame);
elements.restartBtn.addEventListener('click', startGame);

// Pausa com tecla ESC ou P
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (gameState.isRunning && !gameState.isPaused) {
            pauseGame();
        } else if (gameState.isPaused) {
            resumeGame();
        }
    }
    
    // Enter para iniciar/reiniciar
    if (e.key === 'Enter') {
        if (!gameState.isRunning && !gameState.isPaused) {
            startGame();
        }
    }
});

// Previne comportamento padrão em mobile
document.addEventListener('touchmove', (e) => {
    if (gameState.isRunning) {
        e.preventDefault();
    }
}, { passive: false });

// ============================================
// INICIALIZAÇÃO
// ============================================

function init() {
    updateHighScoreDisplay();
    showScreen('start');
    
    // Primeiro relâmpago após 2 segundos
    setTimeout(triggerLightning, 2000);
}

// Inicia o jogo quando a página carregar
window.addEventListener('DOMContentLoaded', init);

console.log('🎃 Haunted Click - A Maldição da Casa Abandonada');
console.log('👻 Clique nos fantasmas para eliminá-los!');
console.log('💀 Não deixe escapar ou perde uma vida!');
console.log('🏆 High Score salvo no navegador!');
