// ============================================
// HAUNTED CLICK - JOGO COMPLETO
// ============================================

(function() {
    'use strict';

    // --- ELEMENTOS ---
    const $ = (id) => document.getElementById(id);

    const screens = {
        start: $('startScreen'),
        game: $('gameScreen'),
        pause: $('pauseScreen'),
        gameover: $('gameoverScreen')
    };

    const els = {
        score: $('score'),
        combo: $('combo'),
        lives: $('lives'),
        timer: $('timer'),
        level: $('level'),
        progressBar: $('progressBar'),
        gameArea: $('gameArea'),
        ghostsContainer: $('ghostsContainer'),
        powerupsContainer: $('powerupsContainer'),
        finalScore: $('finalScore'),
        finalCombo: $('finalCombo'),
        finalLevel: $('finalLevel'),
        startHighScore: $('startHighScoreValue'),
        gameoverHighScore: $('gameoverHighScoreValue'),
        lightning: $('lightning'),
        startBtn: $('startBtn'),
        pauseBtn: $('pauseBtn'),
        resumeBtn: $('resumeBtn'),
        quitBtn: $('quitBtn'),
        restartBtn: $('restartBtn'),
        clickSound: $('clickSound'),
        comboSound: $('comboSound'),
        missSound: $('missSound'),
        gameoverSound: $('gameoverSound')
    };

    // --- ESTADO ---
    const state = {
        score: 0, combo: 1, maxCombo: 1, lives: 3,
        timeLeft: 60, level: 1, isRunning: false, isPaused: false,
        ghostSpeed: 2000, maxGhosts: 3, ghostsActive: 0,
        spawnInterval: null, timerInterval: null, powerupInterval: null
    };

    const CFG = { TOTAL_TIME: 60, MAX_LIVES: 3, MAX_GHOSTS_BASE: 3, GHOST_BASE_SPEED: 2000, GHOST_MIN_SPEED: 800, SPEED_INCREMENT: 150, POWERUP_CHANCE: 0.15, COMBO_MULTIPLIER: 2, POINTS_PER_CLICK: 10 };

    // --- TELAS ---
    function showScreen(name) {
        Object.values(screens).forEach(s => s.classList.remove('active'));
        if (screens[name]) screens[name].classList.add('active');
    }

    // --- HIGH SCORE ---
    function getHS() { return parseInt(localStorage.getItem('hauntedClickHS')) || 0; }
    function setHS(s) { if (s > getHS()) { localStorage.setItem('hauntedClickHS', s); return true; } return false; }
    function updateHS() { const h = getHS(); if (els.startHighScore) els.startHighScore.textContent = h; if (els.gameoverHighScore) els.gameoverHighScore.textContent = h; }

    // --- EFEITOS ---
    function lightning() {
        if (!els.lightning) return;
        els.lightning.classList.add('active');
        setTimeout(() => els.lightning.classList.remove('active'), 150);
        if (Math.random() < 0.3) setTimeout(() => { els.lightning.classList.add('active'); setTimeout(() => els.lightning.classList.remove('active'), 100); }, 300);
    }

    function randomLightning() {
        if (!state.isRunning) return;
        setTimeout(() => { lightning(); randomLightning(); }, Math.random() * 8000 + 3000);
    }

    function clickFx(x, y, text) {
        if (!els.gameArea) return;
        const fx = document.createElement('div');
        fx.className = 'click-effect
