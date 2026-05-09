var BubbleGame = (function () {
    var ROWS = 10;
    var COLS = 9;
    var RADIUS = 18;
    var DIAMETER = RADIUS * 2;
    var SHOOTER_Y;
    var BUBBLE_SPEED = 10;
    var SHOOT_COOLDOWN = 400;
    var DIFFICULTY_INTERVAL = 15000;
    var COLOR_INCREMENT = 60000;

    var COLORS = [
        '#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff',
        '#b44cff', '#ff9100', '#00d4ff'
    ];

    var canvas, ctx, nextCanvas, nextCtx;
    var grid, flyingBubble, nextBubble, currentBubble;
    var score, highScore, numColors, colorPalette;
    var mouseX, mouseY, aimAngle;
    var paused, gameOver, gameStarted, canShoot;
    var lastShootTime, lastDifficultyTick, lastColorTick, animFrameId;
    var particles;
    var currentUser;
    var els;

    function initElements() {
        els = {
            scoreDisplay: document.getElementById('scoreDisplay'),
            highScoreDisplay: document.getElementById('highScoreDisplay'),
            finalScoreDisplay: document.getElementById('finalScoreDisplay'),
            overlay: document.getElementById('gameOverOverlay'),
            overlayBadge: document.getElementById('overlayBadge'),
            btnRestart: document.getElementById('btnRestart'),
            btnBack: document.getElementById('btnBack'),
            btnBackOverlay: document.getElementById('btnBackOverlay')
        };
    }

    function bindEvents() {
        canvas.addEventListener('mousemove', onMouseMove);
        canvas.addEventListener('click', onCanvasClick);
        document.addEventListener('keydown', onKeyDown);
        els.btnRestart.addEventListener('click', restart);
        els.btnBack.addEventListener('click', goToLobby);
        els.btnBackOverlay.addEventListener('click', goToLobby);
    }

    function onMouseMove(e) {
        var rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
    }

    function onCanvasClick() {
        if (!gameStarted || paused || gameOver) return;
        shoot();
    }

    function onKeyDown(e) {
        if (e.code === 'KeyP') {
            e.preventDefault();
            togglePause();
            return;
        }
        if (e.code === 'Space') {
            e.preventDefault();
            if (!gameStarted) { startGame(); return; }
            if (gameOver) { restart(); return; }
            shoot();
        }
    }

    function init() {
        canvas = document.getElementById('gameCanvas');
        canvas.width = COLS * DIAMETER + RADIUS;
        canvas.height = (ROWS + 1) * DIAMETER + DIAMETER;
        ctx = canvas.getContext('2d');
        SHOOTER_Y = canvas.height - DIAMETER;

        nextCanvas = document.getElementById('nextCanvas');
        nextCanvas.width = DIAMETER * 2;
        nextCanvas.height = DIAMETER * 2;
        nextCtx = nextCanvas.getContext('2d');

        initElements();
        bindEvents();

        highScore = parseInt(localStorage.getItem('bubble_high_score') || '0', 10);
        els.highScoreDisplay.textContent = highScore;

        mouseX = canvas.width / 2;
        mouseY = canvas.height / 2;
        particles = [];

        resetState();
        drawTitleScreen();
    }

    function resetState() {
        score = 0;
        paused = false;
        gameOver = false;
        gameStarted = false;
        canShoot = true;
        numColors = 5;
        colorPalette = COLORS.slice(0, numColors);
        flyingBubble = null;
        nextBubble = randomColor();
        currentBubble = randomColor();
        lastShootTime = 0;
        lastDifficultyTick = performance.now();
        lastColorTick = performance.now();
        particles = [];
        grid = createGrid();

        els.scoreDisplay.textContent = '0';
        els.overlay.style.display = 'none';
    }

    function createGrid() {
        var g = [];
        for (var r = 0; r < ROWS; r++) {
            g[r] = [];
            for (var c = 0; c < COLS; c++) {
                g[r][c] = null;
            }
        }
        for (var r = 0; r < 4; r++) {
            for (var c = 0; c < COLS; c++) {
                if (Math.random() < 0.5) {
                    g[r][c] = randomColor();
                }
            }
        }
        return g;
    }

    function randomColor() {
        return colorPalette[Math.floor(Math.random() * colorPalette.length)];
    }

    function getGridPos(row, col) {
        var ox = (row % 2 === 0) ? 0 : RADIUS;
        return {
            x: col * DIAMETER + RADIUS + ox,
            y: row * DIAMETER + RADIUS
        };
    }

    function snapToGrid(x, y) {
        var row = Math.round((y - RADIUS) / DIAMETER);
        if (row < 0) row = 0;
        if (row >= ROWS) row = ROWS - 1;

        var offset = (row % 2 === 0) ? 0 : RADIUS;
        var col = Math.round((x - RADIUS - offset) / DIAMETER);
        var maxCol = (row % 2 === 0) ? COLS - 1 : COLS - 2;
        if (col < 0) col = 0;
        if (col > maxCol) col = maxCol;

        return { row: row, col: col };
    }

    function validGridPos(row, col) {
        if (row < 0 || row >= ROWS) return false;
        var maxCol = (row % 2 === 0) ? COLS - 1 : COLS - 2;
        if (col < 0 || col > maxCol) return false;
        return !grid[row][col];
    }

    function shoot() {
        if (!canShoot || flyingBubble) return;
        canShoot = false;

        var cx = canvas.width / 2;
        var cy = SHOOTER_Y;
        var dx = mouseX - cx;
        var dy = mouseY - cy;
        var len = Math.sqrt(dx * dx + dy * dy);
        if (len < 1) { dy = -1; len = 1; }
        var vx = dx / len * BUBBLE_SPEED;
        var vy = dy / len * BUBBLE_SPEED;
        if (vy > 0) vy = -vy;

        flyingBubble = {
            x: cx, y: cy,
            vx: vx, vy: vy,
            color: currentBubble
        };

        currentBubble = nextBubble;
        nextBubble = randomColor();

        setTimeout(function () {
            canShoot = true;
        }, SHOOT_COOLDOWN);
    }

    function updateFlyingBubble() {
        if (!flyingBubble) return;
        var b = flyingBubble;

        b.x += b.vx;
        b.y += b.vy;

        if (b.x - RADIUS <= 0) { b.x = RADIUS; b.vx = Math.abs(b.vx); }
        if (b.x + RADIUS >= canvas.width) { b.x = canvas.width - RADIUS; b.vx = -Math.abs(b.vx); }

        if (b.y - RADIUS <= 0) {
            var snap = snapToGrid(b.x, 0);
            if (validGridPos(snap.row, snap.col)) {
                landing(snap.row, snap.col, b.color);
            }
            return;
        }

        for (var r = 0; r < ROWS; r++) {
            for (var c = 0; c < COLS; c++) {
                if (!grid[r][c]) continue;
                var pos = getGridPos(r, c);
                var d = dist(b.x, b.y, pos.x, pos.y);
                if (d < DIAMETER) {
                    var snap = snapToGrid(b.x, b.y);
                    if (validGridPos(snap.row, snap.col)) {
                        landing(snap.row, snap.col, b.color);
                    }
                    return;
                }
            }
        }
    }

    function landing(row, col, color) {
        grid[row][col] = color;
        flyingBubble = null;

        var matched = findMatches(row, col, color);
        if (matched.length >= 3) {
            removeBubbles(matched);
            score += matched.length * 10;
            els.scoreDisplay.textContent = score;
            generateParticles(matched);
            checkFloating();
        }

        checkGameOver();
    }

    function findMatches(startRow, startCol, color) {
        var visited = {};
        var result = [];
        var queue = [{ r: startRow, c: startCol }];

        while (queue.length > 0) {
            var p = queue.shift();
            var key = p.r + ',' + p.c;
            if (visited[key]) continue;
            if (p.r < 0 || p.r >= ROWS || p.c < 0 || p.c >= COLS) continue;
            if (grid[p.r][p.c] !== color) continue;

            visited[key] = true;
            result.push({ row: p.r, col: p.c });

            var neighbors = getNeighbors(p.r, p.c);
            for (var i = 0; i < neighbors.length; i++) {
                queue.push(neighbors[i]);
            }
        }
        return result;
    }

    function getNeighbors(row, col) {
        var even = row % 2 === 0;
        var dirs;
        if (even) {
            dirs = [[-1,-1],[-1,0],[0,-1],[0,1],[1,-1],[1,0]];
        } else {
            dirs = [[-1,0],[-1,1],[0,-1],[0,1],[1,0],[1,1]];
        }
        var result = [];
        for (var i = 0; i < dirs.length; i++) {
            var nr = row + dirs[i][0];
            var nc = col + dirs[i][1];
            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
                result.push({ r: nr, c: nc });
            }
        }
        return result;
    }

    function removeBubbles(matched) {
        for (var i = 0; i < matched.length; i++) {
            grid[matched[i].row][matched[i].col] = null;
        }
    }

    function generateParticles(matched) {
        for (var i = 0; i < matched.length; i++) {
            var pos = getGridPos(matched[i].row, matched[i].col);
            for (var j = 0; j < 6; j++) {
                var angle = Math.random() * Math.PI * 2;
                var spd = Math.random() * 2 + 1;
                particles.push({
                    x: pos.x, y: pos.y,
                    vx: Math.cos(angle) * spd,
                    vy: Math.sin(angle) * spd,
                    life: 1, decay: 0.03,
                    size: Math.random() * 3 + 2,
                    color: COLORS[Math.floor(Math.random() * 7)]
                });
            }
        }
    }

    function checkFloating() {
        var visited = {};
        var queue = [];
        for (var c = 0; c < COLS; c++) {
            if (grid[0][c]) {
                visited['0,' + c] = true;
                queue.push({ r: 0, c: c });
            }
        }

        while (queue.length > 0) {
            var p = queue.shift();
            var neighbors = getNeighbors(p.r, p.c);
            for (var i = 0; i < neighbors.length; i++) {
                var nr = neighbors[i].r;
                var nc = neighbors[i].c;
                var key = nr + ',' + nc;
                if (!visited[key] && grid[nr][nc]) {
                    visited[key] = true;
                    queue.push({ r: nr, c: nc });
                }
            }
        }

        var floating = [];
        for (var r = 1; r < ROWS; r++) {
            for (var c = 0; c < COLS; c++) {
                if (grid[r][c] && !visited[r + ',' + c]) {
                    floating.push({ row: r, col: c });
                }
            }
        }

        if (floating.length > 0) {
            score += floating.length * 5;
            els.scoreDisplay.textContent = score;
            removeBubbles(floating);
            generateParticles(floating);
        }
    }

    function checkGameOver() {
        for (var c = 0; c < COLS; c++) {
            if (grid[ROWS - 1] && grid[ROWS - 1][c]) {
                endGame();
                return;
            }
        }
    }

    function addNewRow() {
        for (var r = 0; r < ROWS - 1; r++) {
            grid[r] = grid[r + 1];
        }
        grid[ROWS - 1] = [];
        for (var c = 0; c < COLS; c++) {
            grid[ROWS - 1][c] = null;
        }

        var topRow = [];
        for (var c = 0; c < COLS; c++) {
            topRow[c] = Math.random() < 0.6 ? randomColor() : null;
        }

        for (var r = ROWS - 1; r >= 1; r--) {
            grid[r] = grid[r - 1];
        }
        grid[0] = topRow;

        checkGameOver();
    }

    function updateParticles() {
        for (var i = particles.length - 1; i >= 0; i--) {
            var p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.05;
            p.life -= p.decay;
            if (p.life <= 0) particles.splice(i, 1);
        }
    }

    function updateColors(timestamp) {
        if (timestamp - lastColorTick >= COLOR_INCREMENT && numColors < 7) {
            lastColorTick = timestamp;
            numColors++;
            colorPalette = COLORS.slice(0, numColors);
        }
    }

    function startGame() {
        resetState();
        gameStarted = true;
        animFrameId = requestAnimationFrame(gameLoop);
    }

    function gameLoop(timestamp) {
        if (gameOver) return;
        animFrameId = requestAnimationFrame(gameLoop);

        if (paused) { draw(timestamp); return; }

        updateFlyingBubble();
        updateParticles();
        updateColors(timestamp);

        if (timestamp - lastDifficultyTick >= DIFFICULTY_INTERVAL) {
            lastDifficultyTick = timestamp;
            addNewRow();
        }

        draw(timestamp);
    }

    function togglePause() {
        if (gameOver) return;
        paused = !paused;
    }

    function endGame() {
        gameOver = true;
        if (animFrameId) {
            cancelAnimationFrame(animFrameId);
            animFrameId = null;
        }

        var isNewHigh = score > highScore;
        if (isNewHigh) {
            highScore = score;
            localStorage.setItem('bubble_high_score', highScore);
            els.highScoreDisplay.textContent = highScore;
        }

        els.finalScoreDisplay.textContent = score;
        els.overlayBadge.style.display = isNewHigh ? 'inline-block' : 'none';
        els.overlay.style.display = 'flex';

        uploadScore();
    }

    function uploadScore() {
        if (!currentUser || !currentUser.id) return;
        apiCall('/api/game-record', 'POST', {
            userId: currentUser.id,
            score: score,
            level: Math.floor(score / 50) + 1,
            gameId: 10
        }).then(function (res) {
            if (res.success) console.log('分数已上传');
        }).catch(function () {
            console.log('分数上传失败');
        });
    }

    function draw(timestamp) {
        ctx.fillStyle = '#05081a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        drawGridBubbles();
        drawFlyingBubble();
        drawShooter();
        drawAimLine();
        drawParticles();

        if (!gameStarted) drawTitleOverlay();
        if (paused) drawPauseOverlay();

        drawNextBubble();
    }

    function drawGridBubbles() {
        for (var r = 0; r < ROWS; r++) {
            for (var c = 0; c < COLS; c++) {
                if (grid[r][c]) {
                    var pos = getGridPos(r, c);
                    drawBubble(ctx, pos.x, pos.y, grid[r][c]);
                }
            }
        }
    }

    function drawFlyingBubble() {
        if (flyingBubble) {
            drawBubble(ctx, flyingBubble.x, flyingBubble.y, flyingBubble.color);
        }
    }

    function drawShooter() {
        var cx = canvas.width / 2;
        var cy = SHOOTER_Y;

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, RADIUS + 4, 0, Math.PI * 2);
        ctx.stroke();

        if (currentBubble) {
            drawBubble(ctx, cx, cy, currentBubble);
        }

        ctx.fillStyle = 'rgba(100, 100, 120, 0.6)';
        ctx.beginPath();
        ctx.moveTo(cx - 8, cy + RADIUS + 2);
        ctx.lineTo(cx + 8, cy + RADIUS + 2);
        ctx.lineTo(cx, cy + RADIUS + 12);
        ctx.closePath();
        ctx.fill();
    }

    function drawAimLine() {
        if (!gameStarted || paused || gameOver) return;
        if (!canShoot) return;

        var cx = canvas.width / 2;
        var cy = SHOOTER_Y;
        var dx = mouseX - cx;
        var dy = mouseY - cy;
        var len = Math.sqrt(dx * dx + dy * dy);
        if (len < 1) return;
        var vx = dx / len * BUBBLE_SPEED;
        var vy = dy / len * BUBBLE_SPEED;
        if (vy > 0) vy = -vy;

        var aimLen = 80;
        var dots = [];
        var px = cx, py = cy - RADIUS;
        for (var i = 0; i < 20; i++) {
            px += vx * 3;
            py += vy * 3;
            if (px < RADIUS || px > canvas.width - RADIUS) vx = -vx;
            if (py < RADIUS) break;
            dots.push({ x: px, y: py });
        }

        for (var j = 0; j < dots.length; j++) {
            var alpha = 1 - j / dots.length;
            ctx.fillStyle = 'rgba(255, 255, 255, ' + (alpha * 0.4) + ')';
            ctx.beginPath();
            ctx.arc(dots[j].x, dots[j].y, 2 - j * 0.08, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function drawBubble(context, x, y, color) {
        context.fillStyle = color;
        context.shadowColor = color;
        context.shadowBlur = 8;
        context.beginPath();
        context.arc(x, y, RADIUS - 2, 0, Math.PI * 2);
        context.fill();
        context.shadowBlur = 0;

        var grad = context.createRadialGradient(x - RADIUS * 0.3, y - RADIUS * 0.3, RADIUS * 0.1, x, y, RADIUS);
        grad.addColorStop(0, 'rgba(255,255,255,0.4)');
        grad.addColorStop(0.4, 'rgba(255,255,255,0.05)');
        grad.addColorStop(1, 'rgba(0,0,0,0.2)');
        context.fillStyle = grad;
        context.beginPath();
        context.arc(x, y, RADIUS - 2, 0, Math.PI * 2);
        context.fill();
    }

    function drawNextBubble() {
        var nctx = nextCtx;
        nctx.fillStyle = '#0a0e17';
        nctx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
        if (nextBubble) {
            drawBubble(nctx, DIAMETER, DIAMETER, nextBubble);
        }
    }

    function drawParticles() {
        for (var i = 0; i < particles.length; i++) {
            var p = particles[i];
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    function drawTitleOverlay() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#fff';
        ctx.font = '700 26px "Orbitron", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🫧 泡泡龙', canvas.width / 2, canvas.height / 2 - 40);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
        ctx.font = '13px -apple-system, sans-serif';
        ctx.fillText('按 空格键 开始游戏', canvas.width / 2, canvas.height / 2 + 10);
    }

    function drawPauseOverlay() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#fff';
        ctx.font = '700 22px "Orbitron", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⏸ 暂停中', canvas.width / 2, canvas.height / 2);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '13px -apple-system, sans-serif';
        ctx.fillText('按 P 继续', canvas.width / 2, canvas.height / 2 + 30);
    }

    function drawTitleScreen() {
        ctx.fillStyle = '#05081a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawGridBubbles();
        drawShooter();
        drawNextBubble();
        drawTitleOverlay();
    }

    function restart() {
        resetState();
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

    function dist(x1, y1, x2, y2) {
        var dx = x1 - x2;
        var dy = y1 - y2;
        return Math.sqrt(dx * dx + dy * dy);
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
                var steps = ['加载中...', '生成泡泡...', '准备就绪 ✓'];
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
    BubbleGame.boot();
});
