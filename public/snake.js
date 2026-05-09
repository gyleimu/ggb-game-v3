var SnakeGame = (function () {
    var GRID_SIZE = 20;
    var CELL_SIZE = 25;
    var CANVAS_SIZE = GRID_SIZE * CELL_SIZE;
    var BASE_SPEED = 140;
    var MIN_SPEED = 50;
    var SPEED_DECREMENT = 10;
    var POINTS_PER_FOOD = 10;
    var SCORE_PER_LEVEL = 50;

    var canvas, ctx;
    var snake, food;
    var direction, nextDirection;
    var score, level, highScore;
    var paused, gameOver, gameStarted;
    var lastTick, animFrameId;
    var tickInterval;

    var currentUser;

    var els = {};

    function initElements() {
        els.scoreDisplay = document.getElementById('scoreDisplay');
        els.levelDisplay = document.getElementById('levelDisplay');
        els.highScoreDisplay = document.getElementById('highScoreDisplay');
        els.finalScoreDisplay = document.getElementById('finalScoreDisplay');
        els.overlay = document.getElementById('gameOverOverlay');
        els.overlayBadge = document.getElementById('overlayBadge');
        els.btnRestart = document.getElementById('btnRestart');
        els.btnBack = document.getElementById('btnBack');
        els.btnBackOverlay = document.getElementById('btnBackOverlay');
    }

    function bindEvents() {
        document.addEventListener('keydown', handleKey);
        els.btnRestart.addEventListener('click', restart);
        els.btnBack.addEventListener('click', goToLobby);
        els.btnBackOverlay.addEventListener('click', goToLobby);
    }

    function handleKey(e) {
        if (gameOver) return;

        if (e.code === 'Space') {
            e.preventDefault();
            if (!gameStarted) {
                startGame();
                return;
            }
            togglePause();
            return;
        }

        if (paused || !gameStarted) return;

        switch (e.code) {
            case 'ArrowUp':
            case 'KeyW':
                e.preventDefault();
                if (direction.y !== 1) nextDirection = { x: 0, y: -1 };
                break;
            case 'ArrowDown':
            case 'KeyS':
                e.preventDefault();
                if (direction.y !== -1) nextDirection = { x: 0, y: 1 };
                break;
            case 'ArrowLeft':
            case 'KeyA':
                e.preventDefault();
                if (direction.x !== 1) nextDirection = { x: -1, y: 0 };
                break;
            case 'ArrowRight':
            case 'KeyD':
                e.preventDefault();
                if (direction.x !== -1) nextDirection = { x: 1, y: 0 };
                break;
        }
    }

    function init() {
        canvas = document.getElementById('gameCanvas');
        canvas.width = CANVAS_SIZE;
        canvas.height = CANVAS_SIZE;
        ctx = canvas.getContext('2d');

        initElements();
        bindEvents();

        highScore = parseInt(localStorage.getItem('snake_high_score') || '0', 10);
        els.highScoreDisplay.textContent = highScore;

        resetState();
        drawInitialScreen();
    }

    function resetState() {
        var mid = Math.floor(GRID_SIZE / 2);
        snake = [
            { x: mid, y: mid },
            { x: mid - 1, y: mid },
            { x: mid - 2, y: mid }
        ];
        direction = { x: 1, y: 0 };
        nextDirection = { x: 1, y: 0 };
        score = 0;
        level = 1;
        paused = false;
        gameOver = false;
        gameStarted = false;
        tickInterval = BASE_SPEED;
        lastTick = 0;

        food = spawnFood();

        els.scoreDisplay.textContent = '0';
        els.levelDisplay.textContent = '1';
        els.overlay.style.display = 'none';
    }

    function spawnFood() {
        var occupied = {};
        for (var i = 0; i < snake.length; i++) {
            occupied[snake[i].x + ',' + snake[i].y] = true;
        }

        var empty = [];
        for (var x = 0; x < GRID_SIZE; x++) {
            for (var y = 0; y < GRID_SIZE; y++) {
                if (!occupied[x + ',' + y]) {
                    empty.push({ x: x, y: y });
                }
            }
        }

        if (empty.length === 0) return null;
        return empty[Math.floor(Math.random() * empty.length)];
    }

    function startGame() {
        resetState();
        gameStarted = true;
        lastTick = performance.now();
        animFrameId = requestAnimationFrame(gameLoop);
    }

    function gameLoop(timestamp) {
        if (gameOver) return;

        animFrameId = requestAnimationFrame(gameLoop);

        if (paused) return;

        if (timestamp - lastTick >= tickInterval) {
            lastTick = timestamp;
            update();
        }

        draw(timestamp);
    }

    function update() {
        direction = nextDirection;

        var head = snake[0];
        var newHead = { x: head.x + direction.x, y: head.y + direction.y };

        if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
            endGame();
            return;
        }

        for (var i = 0; i < snake.length; i++) {
            if (snake[i].x === newHead.x && snake[i].y === newHead.y) {
                endGame();
                return;
            }
        }

        snake.unshift(newHead);

        if (food && newHead.x === food.x && newHead.y === food.y) {
            score += POINTS_PER_FOOD;
            els.scoreDisplay.textContent = score;

            var newLevel = Math.floor(score / SCORE_PER_LEVEL) + 1;
            if (newLevel > level) {
                level = newLevel;
                els.levelDisplay.textContent = level;
                tickInterval = Math.max(MIN_SPEED, BASE_SPEED - (level - 1) * SPEED_DECREMENT);
            }

            food = spawnFood();
            if (!food) {
                endGame();
                return;
            }
        } else {
            snake.pop();
        }
    }

    function draw(timestamp) {
        ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        drawGrid();
        drawFood(timestamp);
        drawSnake(timestamp);
    }

    function drawGrid() {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 0.5;

        for (var i = 0; i <= GRID_SIZE; i++) {
            var pos = i * CELL_SIZE;
            ctx.beginPath();
            ctx.moveTo(pos, 0);
            ctx.lineTo(pos, CANVAS_SIZE);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, pos);
            ctx.lineTo(CANVAS_SIZE, pos);
            ctx.stroke();
        }
    }

    function drawSnake(timestamp) {
        var pulse = 1 + Math.sin(timestamp * 0.005) * 0.04;

        for (var i = snake.length - 1; i >= 0; i--) {
            var seg = snake[i];
            var cx = seg.x * CELL_SIZE + CELL_SIZE / 2;
            var cy = seg.y * CELL_SIZE + CELL_SIZE / 2;
            var radius = (CELL_SIZE / 2 - 2) * pulse;

            if (i === 0) {
                ctx.fillStyle = '#4CAF50';
                ctx.shadowColor = 'rgba(76, 175, 80, 0.6)';
                ctx.shadowBlur = 10;
            } else {
                ctx.fillStyle = i % 2 === 0 ? '#2E7D32' : '#388E3C';
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;
            }

            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;

        drawSnakeEyes();
    }

    function drawSnakeEyes() {
        var head = snake[0];
        var cx = head.x * CELL_SIZE + CELL_SIZE / 2;
        var cy = head.y * CELL_SIZE + CELL_SIZE / 2;
        var eyeOffset = 5;
        var eyeRadius = 3;

        var leftEye, rightEye;

        if (direction.x === 1) {
            leftEye = { x: cx + eyeOffset, y: cy - eyeOffset };
            rightEye = { x: cx + eyeOffset, y: cy + eyeOffset };
        } else if (direction.x === -1) {
            leftEye = { x: cx - eyeOffset, y: cy - eyeOffset };
            rightEye = { x: cx - eyeOffset, y: cy + eyeOffset };
        } else if (direction.y === -1) {
            leftEye = { x: cx - eyeOffset, y: cy - eyeOffset };
            rightEye = { x: cx + eyeOffset, y: cy - eyeOffset };
        } else {
            leftEye = { x: cx - eyeOffset, y: cy + eyeOffset };
            rightEye = { x: cx + eyeOffset, y: cy + eyeOffset };
        }

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(leftEye.x, leftEye.y, eyeRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(rightEye.x, rightEye.y, eyeRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.arc(leftEye.x, leftEye.y, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(rightEye.x, rightEye.y, 1.5, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawFood(timestamp) {
        if (!food) return;

        var fx = food.x * CELL_SIZE + CELL_SIZE / 2;
        var fy = food.y * CELL_SIZE + CELL_SIZE / 2;
        var breathe = 1 + Math.sin(timestamp * 0.006) * 0.15;

        ctx.fillStyle = '#ff6b6b';
        ctx.shadowColor = 'rgba(255, 107, 107, 0.5)';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(fx, fy, (CELL_SIZE / 2 - 3) * breathe, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;

        var highlightGrad = ctx.createRadialGradient(fx - 2, fy - 3, 1, fx, fy, CELL_SIZE / 2);
        highlightGrad.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
        highlightGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = highlightGrad;
        ctx.beginPath();
        ctx.arc(fx, fy, (CELL_SIZE / 2 - 3) * breathe, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawInitialScreen() {
        ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        drawGrid();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.font = '18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('按 空格键 开始游戏', CANVAS_SIZE / 2, CANVAS_SIZE / 2);
    }

    function togglePause() {
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
            localStorage.setItem('snake_high_score', highScore);
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
            level: level,
            gameId: 8
        }).then(function (res) {
            if (res.success) {
                console.log('分数已上传');
            }
        }).catch(function () {
            console.log('分数上传失败，将在下次尝试');
        });
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
                var steps = ['加载中...', '连接服务器...', '准备就绪 ✓'];
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
    SnakeGame.boot();
});
