var TetrisGame = (function () {
    var COLS = 10;
    var ROWS = 20;
    var CELL = 30;
    var NEXT_CELL = 22;
    var NEXT_COLS = 4;
    var NEXT_ROWS = 4;

    var PIECES = [
        {
            name: 'I',
            shape: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
            color: '#00d4ff'
        },
        {
            name: 'O',
            shape: [[1,1],[1,1]],
            color: '#ffdd00'
        },
        {
            name: 'T',
            shape: [[0,1,0],[1,1,1],[0,0,0]],
            color: '#b44cff'
        },
        {
            name: 'S',
            shape: [[0,1,1],[1,1,0],[0,0,0]],
            color: '#00e676'
        },
        {
            name: 'Z',
            shape: [[1,1,0],[0,1,1],[0,0,0]],
            color: '#ff0055'
        },
        {
            name: 'J',
            shape: [[1,0,0],[1,1,1],[0,0,0]],
            color: '#448aff'
        },
        {
            name: 'L',
            shape: [[0,0,1],[1,1,1],[0,0,0]],
            color: '#ff9100'
        }
    ];

    var SCORE_TABLE = [0, 100, 300, 500, 800];

    var canvas, ctx, nextCanvas, nextCtx;
    var board, currentPiece, nextPiece;
    var currentX, currentY, currentShape, currentColor;
    var score, level, lines, highScore;
    var paused, gameOver, gameStarted;
    var dropInterval, dropTimer, animFrameId;
    var currentUser;
    var els;

    function initElements() {
        els = {
            scoreDisplay: document.getElementById('scoreDisplay'),
            levelDisplay: document.getElementById('levelDisplay'),
            linesDisplay: document.getElementById('linesDisplay'),
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
        document.addEventListener('keydown', handleKey);
        els.btnRestart.addEventListener('click', restart);
        els.btnBack.addEventListener('click', goToLobby);
        els.btnBackOverlay.addEventListener('click', goToLobby);
    }

    function handleKey(e) {
        if (e.code === 'KeyP') {
            e.preventDefault();
            togglePause();
            return;
        }

        if (e.code === 'Space') {
            e.preventDefault();
            if (gameOver) { restart(); return; }
            if (!gameStarted) { startGame(); return; }
            hardDrop();
            return;
        }

        if (!gameStarted || paused || gameOver) return;

        switch (e.code) {
            case 'ArrowLeft':
                e.preventDefault();
                movePiece(-1, 0);
                break;
            case 'ArrowRight':
                e.preventDefault();
                movePiece(1, 0);
                break;
            case 'ArrowDown':
                e.preventDefault();
                if (movePiece(0, 1)) {
                    dropTimer = performance.now();
                }
                break;
            case 'ArrowUp':
                e.preventDefault();
                rotatePiece();
                break;
        }
    }

    function init() {
        canvas = document.getElementById('gameCanvas');
        canvas.width = COLS * CELL;
        canvas.height = ROWS * CELL;
        ctx = canvas.getContext('2d');

        nextCanvas = document.getElementById('nextCanvas');
        nextCanvas.width = NEXT_COLS * NEXT_CELL;
        nextCanvas.height = NEXT_ROWS * NEXT_CELL;
        nextCtx = nextCanvas.getContext('2d');

        initElements();
        bindEvents();

        highScore = parseInt(localStorage.getItem('tetris_high_score') || '0', 10);
        els.highScoreDisplay.textContent = highScore;

        resetState();
        drawTitle();
    }

    function createBoard() {
        var b = [];
        for (var r = 0; r < ROWS; r++) {
            b[r] = [];
            for (var c = 0; c < COLS; c++) {
                b[r][c] = null;
            }
        }
        return b;
    }

    function resetState() {
        board = createBoard();
        score = 0;
        level = 1;
        lines = 0;
        paused = false;
        gameOver = false;
        gameStarted = false;
        dropInterval = 800;
        dropTimer = 0;
        nextPiece = randomPiece();
        spawnPiece();

        els.scoreDisplay.textContent = '0';
        els.levelDisplay.textContent = '1';
        els.linesDisplay.textContent = '0';
        els.overlay.style.display = 'none';
    }

    function randomPiece() {
        return PIECES[Math.floor(Math.random() * PIECES.length)];
    }

    function spawnPiece() {
        currentPiece = nextPiece;
        currentColor = currentPiece.color;
        currentShape = cloneShape(currentPiece.shape);
        currentX = Math.floor((COLS - currentShape[0].length) / 2);
        currentY = 0;
        nextPiece = randomPiece();

        if (!validPosition(currentShape, currentX, currentY)) {
            endGame();
        }
    }

    function cloneShape(shape) {
        return shape.map(function (row) { return row.slice(); });
    }

    function validPosition(shape, px, py) {
        for (var r = 0; r < shape.length; r++) {
            for (var c = 0; c < shape[r].length; c++) {
                if (!shape[r][c]) continue;
                var nx = px + c;
                var ny = py + r;
                if (nx < 0 || nx >= COLS || ny >= ROWS) return false;
                if (ny < 0) continue;
                if (board[ny][nx]) return false;
            }
        }
        return true;
    }

    function movePiece(dx, dy) {
        if (validPosition(currentShape, currentX + dx, currentY + dy)) {
            currentX += dx;
            currentY += dy;
            return true;
        }
        return false;
    }

    function rotatePiece() {
        var shape = currentShape;
        var n = shape.length;
        var rotated = [];
        for (var r = 0; r < n; r++) {
            rotated[r] = [];
            for (var c = 0; c < n; c++) {
                rotated[r][c] = shape[n - 1 - c][r];
            }
        }

        var kicks = [0, -1, 1, -2, 2];
        for (var i = 0; i < kicks.length; i++) {
            if (validPosition(rotated, currentX + kicks[i], currentY)) {
                currentShape = rotated;
                currentX += kicks[i];
                return;
            }
            if (validPosition(rotated, currentX, currentY - kicks[i])) {
                currentShape = rotated;
                currentY -= kicks[i];
                return;
            }
        }
    }

    function hardDrop() {
        while (movePiece(0, 1)) {}
        lockPiece();
    }

    function lockPiece() {
        for (var r = 0; r < currentShape.length; r++) {
            for (var c = 0; c < currentShape[r].length; c++) {
                if (!currentShape[r][c]) continue;
                var ny = currentY + r;
                if (ny < 0) { endGame(); return; }
                board[ny][currentX + c] = currentColor;
            }
        }

        clearLines();
        spawnPiece();
        dropTimer = performance.now();
    }

    function clearLines() {
        var cleared = 0;
        for (var r = ROWS - 1; r >= 0; r--) {
            if (board[r].every(function (c) { return c !== null; })) {
                board.splice(r, 1);
                board.unshift(new Array(COLS).fill(null));
                cleared++;
                r++;
            }
        }

        if (cleared > 0) {
            lines += cleared;
            els.linesDisplay.textContent = lines;

            var scoreGain = SCORE_TABLE[cleared] * level;
            score += scoreGain;
            els.scoreDisplay.textContent = score;

            var newLevel = Math.floor(lines / 10) + 1;
            if (newLevel > level) {
                level = newLevel;
                els.levelDisplay.textContent = level;
                dropInterval = Math.max(80, 800 - (level - 1) * 70);
            }
        }
    }

    function startGame() {
        resetState();
        gameStarted = true;
        dropTimer = performance.now();
        animFrameId = requestAnimationFrame(gameLoop);
    }

    function gameLoop(timestamp) {
        if (gameOver) return;
        animFrameId = requestAnimationFrame(gameLoop);

        if (paused) { draw(timestamp); return; }

        if (timestamp - dropTimer >= dropInterval) {
            dropTimer = timestamp;
            if (!movePiece(0, 1)) {
                lockPiece();
            }
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
            localStorage.setItem('tetris_high_score', highScore);
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
            gameId: 9
        }).then(function (res) {
            if (res.success) console.log('分数已上传');
        }).catch(function () {
            console.log('分数上传失败');
        });
    }

    function draw(timestamp) {
        drawBoard();
        drawCurrentPiece();
        drawNextPiece();

        if (!gameStarted) {
            drawTitleOverlay();
        }

        if (paused) {
            drawPauseOverlay();
        }
    }

    function drawBoard() {
        ctx.fillStyle = '#0a0e17';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 0.5;
        for (var r = 0; r <= ROWS; r++) {
            ctx.beginPath();
            ctx.moveTo(0, r * CELL);
            ctx.lineTo(canvas.width, r * CELL);
            ctx.stroke();
        }
        for (var c = 0; c <= COLS; c++) {
            ctx.beginPath();
            ctx.moveTo(c * CELL, 0);
            ctx.lineTo(c * CELL, canvas.height);
            ctx.stroke();
        }

        for (var r = 0; r < ROWS; r++) {
            for (var c = 0; c < COLS; c++) {
                if (board[r][c]) {
                    drawCell(ctx, c * CELL, r * CELL, CELL, board[r][c]);
                }
            }
        }
    }

    function drawCurrentPiece() {
        if (!gameStarted || gameOver) return;
        for (var r = 0; r < currentShape.length; r++) {
            for (var c = 0; c < currentShape[r].length; c++) {
                if (currentShape[r][c]) {
                    drawCell(ctx, (currentX + c) * CELL, (currentY + r) * CELL, CELL, currentColor);
                }
            }
        }
    }

    function drawCell(context, x, y, size, color) {
        context.fillStyle = color;
        context.fillRect(x + 1, y + 1, size - 2, size - 2);

        var grad = context.createLinearGradient(x, y, x + size, y + size);
        grad.addColorStop(0, 'rgba(255,255,255,0.25)');
        grad.addColorStop(0.4, 'rgba(255,255,255,0.05)');
        grad.addColorStop(0.4, 'rgba(0,0,0,0.05)');
        grad.addColorStop(1, 'rgba(0,0,0,0.25)');
        context.fillStyle = grad;
        context.fillRect(x + 1, y + 1, size - 2, size - 2);

        context.strokeStyle = 'rgba(255,255,255,0.15)';
        context.lineWidth = 1;
        context.strokeRect(x + 1.5, y + 1.5, size - 3, size - 3);
    }

    function drawNextPiece() {
        var nctx = nextCtx;
        nctx.fillStyle = '#0a0e17';
        nctx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);

        if (!nextPiece) return;

        var shape = nextPiece.shape;
        var color = nextPiece.color;

        var ox = (NEXT_COLS - shape[0].length) * NEXT_CELL / 2;
        var oy = (NEXT_ROWS - shape.length) * NEXT_CELL / 2;

        for (var r = 0; r < shape.length; r++) {
            for (var c = 0; c < shape[r].length; c++) {
                if (shape[r][c]) {
                    drawCell(nctx, ox + c * NEXT_CELL, oy + r * NEXT_CELL, NEXT_CELL, color);
                }
            }
        }
    }

    function drawTitleOverlay() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#fff';
        ctx.font = '700 24px "Orbitron", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🎮 俄罗斯方块', canvas.width / 2, canvas.height / 2 - 40);

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

    function drawTitle() {
        drawBoard();
        drawNextPiece();
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
                var steps = ['加载中...', '初始化方块...', '准备就绪 ✓'];
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
    TetrisGame.boot();
});
