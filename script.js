(function() {
    'use strict';

    var screens = {
        start: document.getElementById('startScreen'),
        game: document.getElementById('gameScreen'),
        pause: document.getElementById('pauseScreen'),
        gameover: document.getElementById('gameoverScreen')
    };

    var els = {
        score: document.getElementById('score'),
        combo: document.getElementById('combo'),
        lives: document.getElementById('lives'),
        timer: document.getElementById('timer'),
        level: document.getElementById('level'),
        progressBar: document.getElementById('progressBar'),
        gameArea: document.getElementById('gameArea'),
        ghostsContainer: document.getElementById('ghostsContainer'),
        powerupsContainer: document.getElementById('powerupsContainer'),
        finalScore: document.getElementById('finalScore'),
        finalCombo: document.getElementById('finalCombo'),
        finalLevel: document.getElementById('finalLevel'),
        startHighScore: document.getElementById('startHighScoreValue'),
        gameoverHighScore: document.getElementById('gameoverHighScoreValue'),
        lightning: document.getElementById('lightning'),
        startBtn: document.getElementById('startBtn'),
        pauseBtn: document.getElementById('pauseBtn'),
        resumeBtn: document.getElementById('resumeBtn'),
        quitBtn: document.getElementById('quitBtn'),
        restartBtn: document.getElementById('restartBtn'),
        clickSound: document.getElementById('clickSound'),
        comboSound: document.getElementById('comboSound'),
        missSound: document.getElementById('missSound'),
        gameoverSound: document.getElementById('gameoverSound')
    };

    var state = {
        score: 0,
        combo: 1,
        maxCombo: 1,
        lives: 3,
        timeLeft: 60,
        level: 1,
        isRunning: false,
        isPaused: false,
        ghostSpeed: 2000,
        maxGhosts: 3,
        ghostsActive: 0,
        spawnInterval: null,
        timerInterval: null,
        powerupInterval: null
    };

    var CFG = {
        TOTAL_TIME: 60,
        MAX_LIVES: 3,
        MAX_GHOSTS_BASE: 3,
        GHOST_BASE_SPEED: 2000,
        GHOST_MIN_SPEED: 800,
        SPEED_INCREMENT: 150,
        POWERUP_CHANCE: 0.15,
        COMBO_MULTIPLIER: 2,
        POINTS_PER_CLICK: 10
    };

    function showScreen(name) {
        Object.values(screens).forEach(function(s) {
            s.classList.remove('active');
        });
        if (screens[name]) {
            screens[name].classList.add('active');
        }
    }

    function getHS() {
        return parseInt(localStorage.getItem('hauntedClickHS')) || 0;
    }

    function setHS(s) {
        if (s > getHS()) {
            localStorage.setItem('hauntedClickHS', s);
            return true;
        }
        return false;
    }

    function updateHS() {
        var h = getHS();
        if (els.startHighScore) els.startHighScore.textContent = h;
        if (els.gameoverHighScore) els.gameoverHighScore.textContent = h;
    }

    function lightning() {
        if (!els.lightning) return;
        els.lightning.classList.add('active');
        setTimeout(function() {
            els.lightning.classList.remove('active');
        }, 150);
        if (Math.random() < 0.3) {
            setTimeout(function() {
                els.lightning.classList.add('active');
                setTimeout(function() {
                    els.lightning.classList.remove('active');
                }, 100);
            }, 300);
        }
    }

    function randomLightning() {
        if (!state.isRunning) return;
        setTimeout(function() {
            lightning();
            randomLightning();
        }, Math.random() * 8000 + 3000);
    }

    function clickFx(x, y, text) {
        if (!els.gameArea) return;
        var fx = document.createElement('div');
        fx.className = 'click-effect';
        fx.textContent = text;
        fx.style.left = x + 'px';
        fx.style.top = y + 'px';
        els.gameArea.appendChild(fx);
        setTimeout(function() { fx.remove(); }, 800);
    }

    function playSound(name) {
        var sound = els[name + 'Sound'];
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(function() {});
        }
    }

    function updateHUD() {
        if (els.score) els.score.textContent = state.score;
        if (els.combo) {
            if (state.combo > 1) {
                els.combo.textContent = 'x' + state.combo;
                els.combo.style.color = '#ff6b1a';
            } else {
                els.combo.textContent = 'x1';
                els.combo.style.color = '#c9a84c';
            }
        }
        if (els.lives) {
            var hearts = '';
            for (var i = 0; i < state.lives; i++) hearts += '💀';
            for (var i = state.lives; i < CFG.MAX_LIVES; i++) hearts += '🖤';
            els.lives.textContent = hearts;
        }
        if (els.timer) els.timer.textContent = state.timeLeft + 's';
        if (els.level) els.level.textContent = state.level;
        if (els.progressBar) {
            var progress = (state.timeLeft / CFG.TOTAL_TIME) * 100;
            els.progressBar.style.width = progress + '%';
        }
    }

    function getRandomPosition() {
        if (!els.gameArea) return { x: 100, y: 100 };
        var area = els.gameArea.getBoundingClientRect();
        var padding = 60;
        return {
            x: Math.random() * (area.width - padding * 2) + padding,
            y: Math.random() * (area.height - padding * 2) + padding
        };
    }

    function createGhost() {
        if (!state.isRunning || state.ghostsActive >= state.maxGhosts || !els.ghostsContainer) return;
        var ghost = document.createElement('div');
        ghost.className = 'ghost';
        ghost.textContent = '👻';
        var pos = getRandomPosition();
        ghost.style.left = pos.x + 'px';
        ghost.style.top = pos.y + 'px';
        ghost.addEventListener('click', function(e) {
            e.stopPropagation();
            onGhostClick(ghost, e);
        });
        els.ghostsContainer.appendChild(ghost);
        state.ghostsActive++;
        var timeout = setTimeout(function() {
            if (ghost.parentNode) onGhostMiss(ghost);
        }, state.ghostSpeed);
        ghost._timeout = timeout;
    }

    function onGhostClick(ghost, event) {
        clearTimeout(ghost._timeout);
        var points = CFG.POINTS_PER_CLICK * state.combo;
        state.score += points;
        state.combo++;
        if (state.combo > state.maxCombo) state.maxCombo = state.combo;
        ghost.classList.add('clicked');
        playSound(state.combo > 3 ? 'combo' : 'click');
        clickFx(event.offsetX, event.offsetY, '+' + points);
        setTimeout(function() {
            ghost.remove();
            state.ghostsActive--;
        }, 300);
        updateHUD();
        checkLevelUp();
    }

    function onGhostMiss(ghost) {
        ghost.remove();
        state.ghostsActive--;
        state.combo = 1;
        state.lives--;
        playSound('miss');
        updateHUD();
        if (els.gameArea) {
            els.gameArea.style.animation = 'shake 0.3s ease';
            setTimeout(function() { els.gameArea.style.animation = ''; }, 300);
        }
        if (state.lives <= 0) endGame();
    }

    var shakeStyle = document.createElement('style');
    shakeStyle.textContent = '@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-5px)}40%{transform:translateX(5px)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}}';
    document.head.appendChild(shakeStyle);

    if (els.gameArea) {
        els.gameArea.addEventListener('click', function(e) {
            if (!state.isRunning) return;
            if (e.target === els.gameArea || e.target === els.ghostsContainer) {
                state.combo = 1;
                updateHUD();
            }
        });
    }

    function createPowerup() {
        if (!state.isRunning || Math.random() > CFG.POWERUP_CHANCE || !els.powerupsContainer) return;
        var powerups = ['⚡', '❄️', '💎', '🌟'];
        var emoji = powerups[Math.floor(Math.random() * powerups.length)];
        var pu = document.createElement('div');
        pu.className = 'powerup';
        pu.textContent = emoji;
        var pos = getRandomPosition();
        pu.style.left = pos.x + 'px';
        pu.style.top = pos.y + 'px';
        pu.addEventListener('click', function(e) {
            e.stopPropagation();
            activatePowerup(pu, emoji);
        });
        els.powerupsContainer.appendChild(pu);
        setTimeout(function() { if (pu.parentNode) pu.remove(); }, 3000);
    }

    function activatePowerup(pu, type) {
        pu.remove();
        playSound('combo');
        if (type === '⚡') {
            state.combo = Math.max(state.combo, CFG.COMBO_MULTIPLIER);
            clickFx(100, 100, '⚡ 2X PONTOS!');
        } else if (type === '❄️') {
            var orig = state.ghostSpeed;
            state.ghostSpeed = Math.min(state.ghostSpeed * 2, 4000);
            clickFx(100, 100, '❄️ SLOW!');
            setTimeout(function() { state.ghostSpeed = orig; }, 3000);
        } else if (type === '💎') {
            state.score += 50;
            clickFx(100, 100, '💎 +50!');
        } else if (type === '🌟') {
            if (state.lives < CFG.MAX_LIVES) {
                state.lives++;
                clickFx(100, 100, '🌟 +1 VIDA!');
            }
        }
        updateHUD();
    }

    function checkLevelUp() {
        var newLevel = Math.floor(state.score / 100) + 1;
        if (newLevel > state.level) {
            state.level = newLevel;
            state.maxGhosts = CFG.MAX_GHOSTS_BASE + Math.floor((newLevel - 1) / 2);
            state.ghostSpeed = Math.max(CFG.GHOST_MIN_SPEED, CFG.GHOST_BASE_SPEED - (newLevel - 1) * CFG.SPEED_INCREMENT);
            clickFx(200, 200, 'NIVEL ' + newLevel + '!');
            lightning();
        }
    }

    function startSpawning() {
        stopSpawning();
        state.spawnInterval = setInterval(function() {
            if (!state.isPaused && state.isRunning) createGhost();
        }, state.ghostSpeed / 2);
        state.powerupInterval = setInterval(function() {
            if (!state.isPaused && state.isRunning) createPowerup();
        }, 2000);
        state.timerInterval = setInterval(function() {
            if (!state.isPaused && state.isRunning) {
                state.timeLeft--;
                updateHUD();
                if (state.timeLeft <= 0) endGame();
            }
        }, 1000);
    }

    function stopSpawning() {
        if (state.spawnInterval) clearInterval(state.spawnInterval);
        if (state.timerInterval) clearInterval(state.timerInterval);
        if (state.powerupInterval) clearInterval(state.powerupInterval);
        if (els.ghostsContainer) els.ghostsContainer.innerHTML = '';
        if (els.powerupsContainer) els.powerupsContainer.innerHTML = '';
        state.ghostsActive = 0;
    }

    function startGame() {
        state.score = 0;
        state.combo = 1;
        state.maxCombo = 1;
        state.lives = CFG.MAX_LIVES;
        state.timeLeft = CFG.TOTAL_TIME;
        state.level = 1;
        state.isRunning = true;
        state.isPaused = false;
        state.ghostSpeed = CFG.GHOST_BASE_SPEED;
        state.maxGhosts = CFG.MAX_GHOSTS_BASE;
        state.ghostsActive = 0;
        if (els.ghostsContainer) els.ghostsContainer.innerHTML = '';
        if (els.powerupsContainer) els.powerupsContainer.innerHTML = '';
        updateHUD();
        if (els.progressBar) els.progressBar.style.width = '100%';
        showScreen('game');
        startSpawning();
        randomLightning();
        if (els.gameArea) els.gameArea.style.cursor = 'crosshair';
        console.log('🎃 Jogo iniciado!');
    }

    function endGame() {
        state.isRunning = false;
        stopSpawning();
        playSound('gameover');
        lightning();
        setHS(state.score);
        if (els.finalScore) els.finalScore.textContent = state.score;
        if (els.finalCombo) els.finalCombo.textContent = 'Melhor Combo: x' + state.maxCombo;
        if (els.finalLevel) els.finalLevel.textContent = 'Nivel: ' + state.level;
        updateHS();
        if (els.finalScore && state.score > 0 && state.score >= getHS()) {
            els.finalScore.textContent = state.score + ' 🏆';
        }
        showScreen('gameover');
        if (els.gameArea) els.gameArea.style.cursor = 'default';
        console.log('💀 Game Over! Score: ' + state.score);
    }

    function resetGame() {
        stopSpawning();
        state.isRunning = false;
        state.isPaused = false;
        if (els.gameArea) els.gameArea.style.cursor = 'default';
        showScreen('start');
        updateHS();
    }

    function pauseGame() {
        if (!state.isRunning) return;
        state.isPaused = true;
        showScreen('pause');
    }

    function resumeGame() {
        state.isPaused = false;
        showScreen('game');
    }

    // Event Listeners
    if (els.startBtn) {
        els.startBtn.addEventListener('click', function() {
            console.log('🖱️ Botão ENTRAR NA CASA clicado!');
            startGame();
        });
    }

    if (els.pauseBtn) els.pauseBtn.addEventListener('click', pauseGame);
    if (els.resumeBtn) els.resumeBtn.addEventListener('click', resumeGame);
    if (els.quitBtn) els.quitBtn.addEventListener('click', resetGame);
    if (els.restartBtn) els.restartBtn.addEventListener('click', startGame);

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
            if (state.isRunning && !state.isPaused) pauseGame();
            else if (state.isPaused) resumeGame();
        }
        if (e.key === 'Enter') {
            if (!state.isRunning && !state.isPaused) startGame();
        }
    });

    // Init
    function init() {
        updateHS();
        showScreen('start');
        setTimeout(lightning, 2000);
        console.log('🎃 Haunted Click pronto!');
        console.log('🖱️ Clique em ENTRAR NA CASA ou aperte ENTER');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
