var SpaceShooter = (function () {
    var CANVAS_W = 500;
    var CANVAS_H = 750;

    var PLAYER_W = 40;
    var PLAYER_H = 48;
    var PLAYER_SPEED = 6;
    var PLAYER_Y = CANVAS_H - 80;

    var BULLET_W = 4;
    var BULLET_H = 14;
    var BULLET_SPEED = 8;
    var BULLET_INTERVAL = 200;

    var ENEMY_W = 36;
    var ENEMY_H = 32;
    var BASE_ENEMY_SPEED = 2;
    var ENEMY_SPAWN_INTERVAL = 1200;
    var MIN_ENEMY_SPAWN = 400;

    var BOSS_W = 64;
    var BOSS_H = 56;
    var BOSS_HP = 3;
    var BOSS_SCORE = 50;

    var SCORE_PER_KILL = 10;
    var DIFFICULTY_INTERVAL = 10000;
    var BOSS_THRESHOLD = 20;

    var canvas, ctx;
    var player, bullets, enemies, particles, stars;
    var score, highScore, bossScoreAccum;
    var paused, gameOver, gameStarted, gameRunning;
    var keys;
    var lastShot, lastSpawn, lastDifficultyTick, animFrameId;
    var enemySpeed, enemySpawnInterval;
    var currentUser;
    var els;

    function initElements() {
        els = {
            scoreDisplay: document.getElementById('scoreDisplay'),
            highScoreDisplay: document.getElementById('highScoreDisplay'),
            finalScoreDisplay: document.getElementById('finalScoreDisplay'),
            overlay: document.getElementById('gameOverOverlay'),
            overlayBadge: document.getElementById('overlayBadge'),
            hint: document.getElementById('hint'),
            btnRestart: document.getElementById('btnRestart'),
            btnBackOverlay: document.getElementById('btnBackOverlay')
        };
    }

    function bindEvents() {
        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);
        els.btnRestart.addEventListener('click', restart);
        els.btnBackOverlay.addEventListener('click', goToLobby);
    }

    function onKeyDown(e) {
        if (e.code === 'Space') {
            e.preventDefault();
            if (!gameStarted) { startGame(); return; }
            if (gameOver) { restart(); return; }
        }
        if (e.code === 'KeyP') { e.preventDefault(); togglePause(); return; }
        keys[e.code] = true;
    }

    function onKeyUp(e) {
        keys[e.code] = false;
    }

    function init() {
        canvas = document.getElementById('gameCanvas');
        canvas.width = CANVAS_W;
        canvas.height = CANVAS_H;
        ctx = canvas.getContext('2d');

        initElements();
        bindEvents();

        highScore = parseInt(localStorage.getItem('shooter_high_score') || '0', 10);
        els.highScoreDisplay.textContent = highScore;

        keys = {};
        stars = [];
        generateStars(150);

        resetState();
        draw(performance.now());
    }

    function resetState() {
        player = { x: CANVAS_W / 2 - PLAYER_W / 2, y: PLAYER_Y, w: PLAYER_W, h: PLAYER_H, invincible: 0 };
        bullets = [];
        enemies = [];
        particles = [];
        score = 0;
        bossScoreAccum = 0;
        paused = false;
        gameOver = false;
        gameStarted = false;
        gameRunning = false;
        lastShot = 0;
        lastSpawn = 0;
        lastDifficultyTick = 0;
        enemySpeed = BASE_ENEMY_SPEED;
        enemySpawnInterval = ENEMY_SPAWN_INTERVAL;
        els.scoreDisplay.textContent = '0';
        els.overlay.style.display = 'none';
    }

    function generateStars(count) {
        stars = [];
        for (var i = 0; i < count; i++) {
            stars.push({
                x: Math.random() * CANVAS_W,
                y: Math.random() * CANVAS_H,
                r: Math.random() * 1.8 + 0.3,
                speed: Math.random() * 0.6 + 0.15,
                alpha: Math.random() * 0.6 + 0.4
            });
        }
    }

    function startGame() {
        resetState();
        gameStarted = true;
        gameRunning = true;
        var now = performance.now();
        lastSpawn = now;
        lastShot = now;
        lastDifficultyTick = now;
        animFrameId = requestAnimationFrame(gameLoop);
    }

    function gameLoop(timestamp) {
        if (!gameRunning) return;
        animFrameId = requestAnimationFrame(gameLoop);

        if (paused) { draw(timestamp); return; }

        updateStars();
        updatePlayer();
        updateBullets();
        updateEnemies();
        updateParticles();
        checkDifficulty(timestamp);
        updateInput(timestamp);
        spawnEnemies(timestamp);
        draw(timestamp);
    }

    function updateStars() {
        for (var i = 0; i < stars.length; i++) {
            stars[i].y += stars[i].speed;
            if (stars[i].y > CANVAS_H) {
                stars[i].y = -2;
                stars[i].x = Math.random() * CANVAS_W;
            }
        }
    }

    function updatePlayer() {
        if (keys['ArrowLeft'] || keys['KeyA']) {
            player.x -= PLAYER_SPEED;
        }
        if (keys['ArrowRight'] || keys['KeyD']) {
            player.x += PLAYER_SPEED;
        }
        if (player.x < 0) player.x = 0;
        if (player.x > CANVAS_W - player.w) player.x = CANVAS_W - player.w;

        if (player.invincible > 0) player.invincible--;
    }

    function updateInput(timestamp) {
        if (keys['Space'] && timestamp - lastShot >= BULLET_INTERVAL) {
            lastShot = timestamp;
            bullets.push({
                x: player.x + player.w / 2 - BULLET_W / 2,
                y: player.y - BULLET_H,
                w: BULLET_W,
                h: BULLET_H
            });
        }
    }

    function updateBullets() {
        for (var i = bullets.length - 1; i >= 0; i--) {
            bullets[i].y -= BULLET_SPEED;
            if (bullets[i].y + bullets[i].h < 0) {
                bullets.splice(i, 1);
            }
        }
    }

    function spawnEnemies(timestamp) {
        if (timestamp - lastSpawn < enemySpawnInterval) return;
        lastSpawn = timestamp;

        var isBoss = bossScoreAccum >= BOSS_THRESHOLD;

        if (isBoss) {
            bossScoreAccum -= BOSS_THRESHOLD;
            enemies.push({
                x: CANVAS_W / 2 - BOSS_W / 2,
                y: -BOSS_H,
                w: BOSS_W,
                h: BOSS_H,
                hp: BOSS_HP,
                maxHp: BOSS_HP,
                speed: enemySpeed * 0.6,
                isBoss: true,
                wobble: 0
            });
        } else {
            enemies.push({
                x: Math.random() * (CANVAS_W - ENEMY_W),
                y: -ENEMY_H,
                w: ENEMY_W,
                h: ENEMY_H,
                hp: 1,
                maxHp: 1,
                speed: enemySpeed + Math.random() * 1.5,
                isBoss: false
            });
        }
    }

    function updateEnemies() {
        for (var i = enemies.length - 1; i >= 0; i--) {
            var e = enemies[i];
            e.y += e.speed;

            if (e.isBoss) {
                e.wobble += 0.03;
                e.x += Math.sin(e.wobble) * 0.8;
            }

            if (e.y > CANVAS_H + 20) {
                enemies.splice(i, 1);
                continue;
            }

            if (checkCollision(player, e) && player.invincible === 0) {
                spawnExplosion(player.x + player.w / 2, player.y + player.h / 2, 30, '#ff4444');
                endGame();
                return;
            }

            for (var j = bullets.length - 1; j >= 0; j--) {
                if (checkCollision(bullets[j], e)) {
                    bullets.splice(j, 1);
                    e.hp--;

                    if (e.hp <= 0) {
                        var killScore = e.isBoss ? BOSS_SCORE : SCORE_PER_KILL;
                        score += killScore;
                        bossScoreAccum += killScore;
                        els.scoreDisplay.textContent = score;
                        spawnExplosion(e.x + e.w / 2, e.y + e.h / 2,
                            e.isBoss ? 40 : 15,
                            e.isBoss ? '#ff8800' : '#ffcc00');
                        enemies.splice(i, 1);
                    } else {
                        spawnExplosion(bullets[j] ? bullets[j].x : e.x, e.y + e.h / 2, 8, '#ffaa00');
                    }
                    break;
                }
            }
        }
    }

    function checkCollision(a, b) {
        return a.x < b.x + b.w &&
               a.x + (a.w || 4) > b.x &&
               a.y < b.y + b.h &&
               a.y + (a.h || 14) > b.y;
    }

    function spawnExplosion(cx, cy, count, color) {
        for (var i = 0; i < count; i++) {
            var angle = Math.random() * Math.PI * 2;
            var speed = Math.random() * 3 + 1;
            particles.push({
                x: cx,
                y: cy,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                decay: Math.random() * 0.04 + 0.02,
                size: Math.random() * 3 + 1.5,
                color: color
            });
        }
    }

    function updateParticles() {
        for (var i = particles.length - 1; i >= 0; i--) {
            var p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= p.decay;
            if (p.life <= 0) {
                particles.splice(i, 1);
            }
        }
    }

    function checkDifficulty(timestamp) {
        if (timestamp - lastDifficultyTick >= DIFFICULTY_INTERVAL) {
            lastDifficultyTick = timestamp;
            enemySpeed += 0.5;
            enemySpawnInterval = Math.max(MIN_ENEMY_SPAWN, enemySpawnInterval - 80);
        }
    }

    function togglePause() {
        if (gameOver) return;
        paused = !paused;
    }

    function endGame() {
        gameOver = true;
        gameRunning = false;
        if (animFrameId) {
            cancelAnimationFrame(animFrameId);
            animFrameId = null;
        }

        var isNewHigh = score > highScore;
        if (isNewHigh) {
            highScore = score;
            localStorage.setItem('shooter_high_score', highScore);
            els.highScoreDisplay.textContent = highScore;
        }

        els.finalScoreDisplay.textContent = score;
        els.overlayBadge.style.display = isNewHigh ? 'inline-block' : 'none';
        els.overlay.style.display = 'flex';
        els.hint.style.display = 'none';

        uploadScore();
    }

    function uploadScore() {
        if (!currentUser || !currentUser.id) return;
        apiCall('/api/game-record', 'POST', {
            userId: currentUser.id,
            score: score,
            level: Math.floor(score / 10) + 1,
            gameId: 7
        }).then(function (res) {
            if (res.success) console.log('分数已上传');
        }).catch(function () {
            console.log('分数上传失败');
        });
    }

    function draw(timestamp) {
        ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

        drawStarfield();

        if (!gameStarted) {
            drawTitleOverlay();
            return;
        }

        if (paused) {
            drawPauseOverlay();
        }

        drawParticles();
        drawBullets();
        drawEnemies();
        drawPlayer(timestamp);
    }

    function drawStarfield() {
        ctx.fillStyle = '#05081a';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        for (var i = 0; i < stars.length; i++) {
            var s = stars[i];
            ctx.fillStyle = 'rgba(255, 255, 255, ' + s.alpha + ')';
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function drawPlayer(timestamp) {
        var cx = player.x + player.w / 2;
        var cy = player.y + player.h / 2;
        var blink = player.invincible > 0 && Math.floor(player.invincible / 3) % 2 === 0;
        if (blink) return;

        ctx.save();
        ctx.translate(cx, cy);

        ctx.shadowColor = 'rgba(100, 149, 237, 0.8)';
        ctx.shadowBlur = 16;

        ctx.fillStyle = '#7ec8ff';
        ctx.beginPath();
        ctx.moveTo(0, -player.h / 2);
        ctx.lineTo(-player.w / 2, player.h / 2);
        ctx.lineTo(player.w / 2, player.h / 2);
        ctx.closePath();
        ctx.fill();

        ctx.shadowColor = 'rgba(100, 149, 237, 0.3)';
        ctx.shadowBlur = 6;
        ctx.fillStyle = '#4682B4';
        ctx.beginPath();
        ctx.moveTo(0, -player.h / 2);
        ctx.lineTo(-player.w / 2 + 6, player.h / 2 - 6);
        ctx.lineTo(player.w / 2 - 6, player.h / 2 - 6);
        ctx.closePath();
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.arc(0, player.h / 2 - 8, 4, 0, Math.PI * 2);
        ctx.fill();

        var flicker = Math.sin(timestamp * 0.015) * 0.3 + 0.7;
        ctx.fillStyle = 'rgba(135, 206, 250, ' + flicker + ')';
        ctx.beginPath();
        ctx.arc(0, -player.h / 2 + 6, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    function drawBullets() {
        for (var i = 0; i < bullets.length; i++) {
            var b = bullets[i];
            ctx.fillStyle = '#7ec8ff';
            ctx.shadowColor = 'rgba(135, 206, 250, 0.8)';
            ctx.shadowBlur = 8;
            ctx.fillRect(b.x, b.y, b.w, b.h);
            ctx.fillStyle = '#fff';
            ctx.fillRect(b.x + 1, b.y, 2, b.h);
        }
        ctx.shadowBlur = 0;
    }

    function drawEnemies() {
        for (var i = 0; i < enemies.length; i++) {
            var e = enemies[i];
            if (e.isBoss) {
                drawBoss(e);
            } else {
                drawBasicEnemy(e);
            }
        }
    }

    function drawBasicEnemy(e) {
        var cx = e.x + e.w / 2;
        var cy = e.y + e.h / 2;

        ctx.fillStyle = '#ff4444';
        ctx.shadowColor = 'rgba(255, 68, 68, 0.6)';
        ctx.shadowBlur = 10;

        ctx.beginPath();
        ctx.moveTo(cx, cy - e.h / 2);
        ctx.lineTo(cx + e.w / 2, cy);
        ctx.lineTo(cx, cy + e.h / 2);
        ctx.lineTo(cx - e.w / 2, cy);
        ctx.closePath();
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ff8888';
        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawBoss(e) {
        var cx = e.x + e.w / 2;
        var cy = e.y + e.h / 2;

        ctx.fillStyle = '#cc4400';
        ctx.shadowColor = 'rgba(255, 136, 0, 0.8)';
        ctx.shadowBlur = 20;
        ctx.fillRect(cx - e.w / 2, cy - e.h / 2, e.w, e.h);
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#ff6600';
        ctx.fillRect(cx - e.w / 2 + 4, cy - e.h / 2 + 4, e.w - 8, e.h - 8);

        ctx.fillStyle = '#ffaa00';
        ctx.shadowColor = 'rgba(255, 170, 0, 0.6)';
        ctx.shadowBlur = 8;
        ctx.fillRect(cx - 8, cy - 6, 16, 12);
        ctx.shadowBlur = 0;

        var hpRatio = e.hp / e.maxHp;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(cx - 20, cy - e.h / 2 - 10, 40, 5);
        ctx.fillStyle = hpRatio > 0.5 ? '#4CAF50' : hpRatio > 0.25 ? '#ffaa00' : '#ff4444';
        ctx.fillRect(cx - 20, cy - e.h / 2 - 10, 40 * hpRatio, 5);
    }

    function drawParticles() {
        for (var i = 0; i < particles.length; i++) {
            var p = particles[i];
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life;
            ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        }
        ctx.globalAlpha = 1;
    }

    function drawTitleOverlay() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        ctx.fillStyle = '#fff';
        ctx.font = '700 28px "Orbitron", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🚀 太空射击', CANVAS_W / 2, CANVAS_H / 2 - 40);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = '14px -apple-system, sans-serif';
        ctx.fillText('按 空格键 开始游戏', CANVAS_W / 2, CANVAS_H / 2 + 10);
    }

    function drawPauseOverlay() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        ctx.fillStyle = '#fff';
        ctx.font = '700 24px "Orbitron", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⏸ 暂停中', CANVAS_W / 2, CANVAS_H / 2);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '13px -apple-system, sans-serif';
        ctx.fillText('按 P 继续', CANVAS_W / 2, CANVAS_H / 2 + 32);
    }

    function restart() {
        resetState();
        els.hint.style.display = 'flex';
        startGame();
    }

    function goToLobby() {
        window.location.href = '/';
    }

    function checkAuth() {
        var token = Storage.getToken();
        currentUser = Storage.getUser();
        if (!token || !currentUser || !currentUser.id) {
            window.location.href = '/';
            return false;
        }
        return true;
    }

    return {
        boot: function () {
            if (!checkAuth()) return;

            var splashScreen = document.getElementById('splashScreen');
            var gameContainer = document.getElementById('gameContainer');

            var showGame = function () {
                gameContainer.style.display = 'flex';
                init();
            };

            if (splashScreen) {
                var splashSubtitle = splashScreen.querySelector('.splash-subtitle');
                var steps = ['加载中...', '初始化星域...', '战舰就绪 ✓'];
                var step = 0;
                var stepTimer = setInterval(function () {
                    step++;
                    if (step < steps.length && splashSubtitle) {
                        splashSubtitle.textContent = steps[step];
                    }
                }, 800);

                setTimeout(function () {
                    clearInterval(stepTimer);
                    splashScreen.classList.add('fade-out');
                    setTimeout(function () {
                        splashScreen.style.display = 'none';
                        showGame();
                    }, 600);
                }, 2500);
            } else {
                setTimeout(showGame, 100);
            }
        }
    };
})();

document.addEventListener('DOMContentLoaded', function () {
    SpaceShooter.boot();
});
