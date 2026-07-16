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
    powerupInterval: null,
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
    if (screens[screenName]) {
        screens[screenName].classList.add('active');
    }
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
    if (elements.startHighScore) elements.startHighScore.textContent = hs;
    if (elements.gameoverHighScore) elements.gameoverHighScore.textContent = hs;
}

// ============================================
// EFEITOS VISUAIS
// ============================================

function triggerLightning() {
    if (!elements.lightning) return;
    elements.lightning.classList.add('active');
    setTimeout(() => elements.lightning.classList.remove('active'), 150);
    
    if (Math.random() < 0.3) {
        setTimeout(() => {
            elements.lightning.classList.add('active');
            setTimeout(() => elements.lightning.classList.remove('active'), 100);
        }, 300);
    }
}

function startRandomLightning() {
    if (!gameState.isRunning) return;
    
    const delay = Math.random() * 8000 + 3000;
    setTimeout(() => {
        triggerLightning();
        startRandomLightning();
    }, delay);
}

function showClickEffect(x, y, text) {
    if (!elements.gameArea) return;
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
        sound.play().catch(() => {});
    }
}

// ============================================
// ATUALIZAÇÃO DO HUD
// ============================================

function updateHUD() {
    if (elements.score) elements.score.textContent = gameState.score;
    
    if (elements.combo) {
        if (gameState.combo > 1) {
            elements.combo.textContent = `x${gameState.combo}`;
            elements.combo.style.color = '#ff6b1a';
        } else {
            elements.combo.textContent = 'x1';
            elements.combo.style.color = '#c9a84c';
        }
    }
    
    if (elements.lives) {
        const hearts = '💀'.repeat(gameState.lives) + '🖤'.repeat(CONFIG.MAX_LIVES - gameState.lives);
        elements.lives.textContent = hearts;
    }
    
    if (elements.timer) elements.timer.textContent = `${gameState.timeLeft}s`;
    if (elements.level) elements.level.textContent = gameState.level;
    
    if (elements.progressBar) {
        const progress = (gameState.timeLeft / CONFIG.TOTAL_TIME) * 100;
        elements.progressBar.style.width = progress + '%';
    }
}

// ============================================
// GERAÇÃO DE FANTASMAS
// ============================================

function getRandomPosition() {
    if (!elements.gameArea) return { x: 100, y: 100 };
    const area = elements.gameArea.getBoundingClientRect();
    const padding = 60;
    const x = Math.random() * (area.width - padding * 2) + padding;
    const y = Math.random() * (area.height - padding * 2) + padding;
    return { x, y };
}

function createGhost() {
    if (!gameState.isRunning || gameState.ghostsActive >= gameState.maxGhosts) return;
    if (!elements.ghostsContainer) return;
    
    const ghost = document.createElement('div');
    ghost.className = 'ghost';
    ghost.textContent = '👻';
    
    const { x, y } = getRandomPosition();
    ghost.style.left = x + 'px';
    ghost.style.top = y + 'px';
    
    ghost.addEventListener('click', (e) => {
        e.stopPropagation();
        onGhostClick(ghost, e);
    });
    
    elements.ghostsContainer.appendChild(ghost);
    gameState.ghostsActive++;
    
    const timeout = setTimeout(() => {
        if (ghost.parentNode) {
            onGhostMiss(ghost);
        }
    }, gameState.ghostSpeed);
    
    ghost._timeout = timeout;
}

function onGhostClick(ghost, event) {
    clearTimeout(ghost._timeout);
    
    const points = CONFIG.POINTS_PER_CLICK * gameState.combo;
    gameState.score += points;
    gameState.combo++;
    if (gameState.combo > gameState.maxCombo) {
        gameState.maxCombo = gameState.combo;
    }
    
    ghost.classList.add('clicked');
    playSound(gameState.combo > 3 ? 'combo' : 'click');
    showClickEffect(event.offsetX, event.offsetY, `+${points}`);
    
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
    gameState.combo = 1;
    gameState.lives--;
    
    playSound('miss');
    updateHUD();
    
    if (elements.gameArea) {
        elements.gameArea.style.animation = 'shake 0.3s ease';
        setTimeout(() => {
            elements.gameArea.style.animation = '';
        }, 300);
    }
    
    if (gameState.lives <= 0) {
        endGame();
    }
}

// Tremer tela
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
@keyframes shake {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-5px); }
    40% { transform: translateX(5px); }
    60% { transform: translateX(-5px); }
    80% { transform: translateX(5px); }
}
`;
document.head.appendChild(shakeStyle);

// ============================================
// POWER-UPS
// ============================================

function createPowerup() {
    if (!gameState.isRunning) return;
    if (Math.random() > CONFIG.POWERUP_CHANCE) return;
    if (!elements.powerupsContainer) return;
    
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
            gameState.combo = Math.max(gameState.combo, CONFIG.COMBO_MULTIPLIER);
            showClickEffect(100, 100, '⚡ 2X PONTOS!');
            break;
        case '❄️':
            const originalSpeed = gameState.ghostSpeed;
            gameState.ghostSpeed = Math.min(gameState.ghostSpeed * 2, 4000);
            showClickEffect(100, 100, '❄️ SLOW!');
            setTimeout(() => {
                gameState.ghostSpeed = originalSpeed;
            }, 3000);
            break;
        case '💎':
            gameState.score += 50;
            showClickEffect(100, 100, '💎 +50!');
            break;
        case '🌟':
            if (gameState.lives < CONFIG.MAX_LIVES) {
                gameState.lives++;
                showClickEffect(100, 100, '🌟 +1 VIDA!');
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
        showClickEffect(200, 200, `⬆ NÍVEL ${newLevel}!`);
        triggerLightning();
    }
}

// ============================================
// LOOP PRINCIPAL DO JOGO
// ============================================

function startSpawning() {
    stopSpawning();
    
    gameState.spawnInterval = setInterval(() => {
        if (!gameState.isPaused && gameState.isRunning) {
            createGhost();
        }
    }, gameState.ghostSpeed / 2);
    
    gameState.powerupInterval = setInterval(() => {
        if (!gameState.isPaused && gameState.isRunning) {
            createPowerup();
        }
    }, 2000);
    
    gameState.timerInterval = setInterval(() => {
        if (!gameState.isPaused && gameState.isRunning) {
            gameState.timeLeft--;
            updateHUD();
            
            if (gameState.timeLeft <= 0) {
                endGame();
            }
        }
    }, 1000);
}

function stopSpawning() {
    if (gameState.spawnInterval) clearInterval(gameState.spawnInterval);
    if (gameState.timerInterval) clearInterval(gameState.timerInterval);
    if (gameState.powerupInterval) clearInterval(gameState.powerupInterval);
    
    if (elements.ghostsContainer) elements.ghostsContainer.innerHTML = '';
    if (elements.powerupsContainer) elements.powerupsContainer.innerHTML = '';
    gameState.ghostsActive = 0;
}

// ============================================
// INICIAR / REINICIAR JOGO
// ============================================

function startGame() {
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
    
    if (elements.ghostsContainer) elements.ghostsContainer.innerHTML = '';
    if (elements.powerupsContainer) elements.powerupsContainer.innerHTML = '';
    
    updateHUD();
    if (elements.progressBar) elements.progressBar.style.width = '100%';
    
    showScreen('game');
    startSpawning();
    startRandomLightning();
    
    if (elements.gameArea) elements.gameArea.style.cursor = 'crosshair';
}

function endGame() {
    gameState.isRunning = false;
    stopSpawning();
    
    playSound('gameover');
    triggerLightning();
    
    setHighScore(gameState.score);
    
    if (elements.finalScore) elements.finalScore.textContent = gameState.score;
    if (elements.finalCombo) elements.finalCombo.textContent = `Melhor Combo: x${gameState.maxCombo}`;
    if (elements.finalLevel) elements.finalLevel.textContent = `Nível Alcançado: ${gameState.level}`;
    updateHighScoreDisplay();
    
    if (elements.finalScore && gameState.score > 0 && gameState.score >= getHighScore()) {
        elements.finalScore.textContent = gameState.score + ' 🏆';
    }
    
    showScreen('gameover');
    if (elements.gameArea) elements.gameArea.style.cursor = 'default';
}

function resetGame() {
    stopSpawning();
    gameState.isRunning = false;
    gameState.isPaused = false;
    if (elements.gameArea) elements.gameArea.style.cursor = 'default';
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
// EVENT LISTENERS (com verificação)
// ============================================

function setupEventListeners() {
    if (elements.startBtn) {
        elements.startBtn.addEventListener('click', startGame);
    }
    if (elements.pauseBtn) {
        elements.pauseBtn.addEventListener('click', pauseGame);
    }
    if (elements.resumeBtn) {
        elements.resumeBtn.addEventListener('click', resumeGame);
    }
    if (elements.quitBtn) {
        elements.quitBtn.addEventListener('click', resetGame);
    }
    if (elements.restartBtn) {
        elements.restartBtn.addEventListener('click', startGame);
    }
    
    if (elements.gameArea) {
        elements.gameArea.addEventListener('click', (e) => {
            if (!gameState.isRunning) return;
            if (e.target === elements.gameArea || e.target === elements.ghostsContainer) {
                gameState.combo = 1;
                updateHUD();
            }
        });
    }
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
            if (gameState.isRunning && !gameState.isPaused) {
                pauseGame();
            } else if (gameState.isPaused) {
                resumeGame();
            }
        }
        
        if (e.key === 'Enter') {
            if (!gameState.isRunning && !gameState.isPaused) {
                startGame();
            }
        }
    });
    
    document.addEventListener('touchmove', (e) => {
        if (gameState.isRunning) {
            e.preventDefault();
        }
    }, { passive: false });
}

// ============================================
// INICIALIZAÇÃO
// ============================================

function init() {
    updateHighScoreDisplay();
    showScreen('start');
    setupEventListeners();
    
    setTimeout(triggerLightning, 2000);
    
    console.log('🎃 Haunted Click - Pronto para jogar!');
}

// Garante que o DOM está pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
