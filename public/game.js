// 全局变量声明
let welcomeUser;
let canvas, ctx, scoreElement, levelElement, gameOverElement, finalScoreElement;
let startScreen, gameScreen;
let player;
let fishArray = [];
let bombArray = [];
let score = 0;
let level = 1;
let gameSpeed = 1;
let gameOver = false;
let selectedColor = '#ff6b6b';
let selectedImage = "ggb.jpg";
let currentUser = null;
let audioContext = null;

// 控制变量
let keys = {
    up: false,
    down: false,
    left: false,
    right: false
};

// 音效系统
const SoundManager = {
    audioContext: null,
    backgroundOscillators: [],
    isMuted: false,
    isBackgroundPlaying: false,
    
    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.error('音频初始化失败:', e);
        }
    },
    
    playBackground() {
        if (this.isMuted || this.isBackgroundPlaying || !this.audioContext) return;
        
        this.isBackgroundPlaying = true;
        const ctx = this.audioContext;
        
        // 创建简单的背景音乐循环
        const playNote = (freq, delay) => {
            setTimeout(() => {
                if (!this.isBackgroundPlaying || this.isMuted) return;
                
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, ctx.currentTime);
                
                gain.gain.setValueAtTime(0, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.1);
                gain.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 0.2);
                gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);
                
                osc.connect(gain);
                gain.connect(ctx.destination);
                
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.8);
            }, delay);
        };
        
        // 循环播放简单的背景音乐模式
        const playLoop = () => {
            if (!this.isBackgroundPlaying || this.isMuted) return;
            
            // C大调简单旋律
            const notes = [261.63, 293.66, 329.63, 349.23, 392.00, 349.23, 329.63, 293.66];
            notes.forEach((freq, i) => {
                playNote(freq, i * 400);
            });
            
            setTimeout(playLoop, 3200); // 每3.2秒循环一次
        };
        
        playLoop();
    },
    
    stopBackground() {
        this.isBackgroundPlaying = false;
        this.backgroundOscillators.forEach(osc => {
            try { osc.stop(); } catch(e) {}
        });
        this.backgroundOscillators = [];
    },
    
    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            this.stopBackground();
        } else {
            this.playBackground();
        }
        return this.isMuted;
    },
    
    playSound(type) {
        if (this.isMuted || !this.audioContext) return;
        
        const ctx = this.audioContext;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        switch(type) {
            case 'click':
                oscillator.frequency.setValueAtTime(800, ctx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);
                gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
                oscillator.start(ctx.currentTime);
                oscillator.stop(ctx.currentTime + 0.1);
                break;
                
            case 'eat':
                oscillator.frequency.setValueAtTime(200, ctx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.15);
                oscillator.type = 'sine';
                gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
                oscillator.start(ctx.currentTime);
                oscillator.stop(ctx.currentTime + 0.2);
                break;
                
            case 'bomb':
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(100, ctx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.3);
                gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
                oscillator.start(ctx.currentTime);
                oscillator.stop(ctx.currentTime + 0.4);
                break;
                
            case 'levelup':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(300, ctx.currentTime);
                oscillator.frequency.setValueAtTime(400, ctx.currentTime + 0.1);
                oscillator.frequency.setValueAtTime(500, ctx.currentTime + 0.2);
                oscillator.frequency.setValueAtTime(600, ctx.currentTime + 0.3);
                gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
                oscillator.start(ctx.currentTime);
                oscillator.stop(ctx.currentTime + 0.4);
                break;
                
            case 'gameover':
                oscillator.type = 'triangle';
                oscillator.frequency.setValueAtTime(200, ctx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.5);
                gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
                oscillator.start(ctx.currentTime);
                oscillator.stop(ctx.currentTime + 0.6);
                break;
                
            case 'login':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(523, ctx.currentTime);
                oscillator.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
                oscillator.frequency.setValueAtTime(784, ctx.currentTime + 0.2);
                gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
                oscillator.start(ctx.currentTime);
                oscillator.stop(ctx.currentTime + 0.3);
                break;
        }
    }
};

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    SoundManager.init();

    // 检查 JWT Token：有 token 则自动登录，没有则跳转大厅
    var token = Storage.getToken();
    currentUser = Storage.getUser();

    if (!token || !currentUser) {
        window.location.href = '/';
        return;
    }

    // 启动动画：2.5 秒后淡出，然后直接进入角色选择
    const splashScreen = document.getElementById('splashScreen');
    const showStartScreen = () => {
        startScreen.style.display = 'block';
        welcomeUser.innerHTML = '欢迎, ' + currentUser.username + '!';
        initCharacterOptions();
        SoundManager.playBackground();
    };

    if (splashScreen) {
        const splashSubtitle = splashScreen.querySelector('.splash-subtitle');
        const steps = ['加载中...', '连接服务器...', '准备就绪 ✓'];
        let step = 0;
        const stepTimer = setInterval(() => {
            step++;
            if (step < steps.length && splashSubtitle) {
                splashSubtitle.textContent = steps[step];
            }
        }, 800);

        setTimeout(() => {
            clearInterval(stepTimer);
            splashScreen.classList.add('fade-out');
            setTimeout(() => {
                splashScreen.style.display = 'none';
                showStartScreen();
            }, 600);
        }, 2500);
    } else {
        setTimeout(showStartScreen, 100);
    }

    // 初始化DOM元素
    welcomeUser = document.getElementById('welcomeUser');

    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    scoreElement = document.getElementById('score');
    levelElement = document.getElementById('level');
    gameOverElement = document.getElementById('gameOver');
    finalScoreElement = document.getElementById('finalScore');
    startScreen = document.getElementById('startScreen');
    gameScreen = document.getElementById('gameScreen');
    
    // 设置键盘事件监听
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    // 开始游戏循环
    gameLoop();
});

// 返回大厅
function goToLobby() {
    window.location.href = '/';
}

// 退出登录
function logout() {
    currentUser = null;
    Storage.clearSession();
    window.location.href = '/';
}

// 角色选项初始化
function initCharacterOptions() {
    const characterOptions = document.querySelectorAll('.character-option');
    if (characterOptions.length > 0) {
        characterOptions.forEach(option => {
            option.addEventListener('click', function() {
                characterOptions.forEach(opt => opt.classList.remove('selected'));
                this.classList.add('selected');
                selectedColor = this.dataset.color;
                selectedImage = this.dataset.image;
            });
        });
        characterOptions[0].classList.add('selected');
        selectedImage = characterOptions[0].dataset.image;
    }
}

// 玩家类
class Player {
    constructor(color, imageSrc) {
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
        this.radius = 20;
        this.speed = 3;
        this.color = color;
        this.image = new Image();
        this.image.src = imageSrc;
    }

    draw() {
        // 使用图片绘制玩家
        ctx.drawImage(this.image, this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
    }

    update() {
        if (keys.up && this.y - this.radius > 0) {
            this.y -= this.speed;
        }
        if (keys.down && this.y + this.radius < canvas.height) {
            this.y += this.speed;
        }
        if (keys.left && this.x - this.radius > 0) {
            this.x -= this.speed;
        }
        if (keys.right && this.x + this.radius < canvas.width) {
            this.x += this.speed;
        }
    }

    grow() {
        this.radius += 2;
    }
}

// 鱼群类
class Fish {
    constructor() {
        // 所有鱼都从右边来
        this.x = canvas.width + 20;
        this.y = Math.random() * canvas.height;

        // 随机大小（基于等级）
        this.radius = Math.random() * 30 + 5;
        if (level > 1) {
            this.radius += level * 3;
        }

        // 随机颜色
        this.color = this.getRandomColor();

        // 随机速度（向左移动）
        this.speed = Math.random() * 1.5 + 0.5;

        // 随机垂直移动方向
        this.verticalSpeed = (Math.random() - 0.5) * 0.5;
    }

    getRandomColor() {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dfe6e9'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    draw() {
        // 绘制猪脸
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // 头部
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();
        
        // 护目镜/眼睛
        const eyeSize = this.radius * 0.25;
        const eyeOffsetX = this.radius * 0.3;
        const eyeOffsetY = -this.radius * 0.1;
        
        // 左眼
        ctx.beginPath();
        ctx.ellipse(-eyeOffsetX, eyeOffsetY, eyeSize, eyeSize * 0.8, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.closePath();
        
        // 右眼
        ctx.beginPath();
        ctx.ellipse(eyeOffsetX, eyeOffsetY, eyeSize, eyeSize * 0.8, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.closePath();
        
        // 眼珠
        ctx.beginPath();
        ctx.arc(-eyeOffsetX, eyeOffsetY, eyeSize * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = '#333';
        ctx.fill();
        ctx.closePath();
        
        ctx.beginPath();
        ctx.arc(eyeOffsetX, eyeOffsetY, eyeSize * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = '#333';
        ctx.fill();
        ctx.closePath();
        
        // 鼻子
        const noseSize = this.radius * 0.15;
        ctx.beginPath();
        ctx.arc(0, this.radius * 0.15, noseSize, 0, Math.PI * 2);
        ctx.fillStyle = '#ff9ff3';
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.closePath();
        
        // 嘴巴
        ctx.beginPath();
        ctx.arc(0, this.radius * 0.3, this.radius * 0.25, 0.2 * Math.PI, 0.8 * Math.PI);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();
        
        ctx.restore();
    }

    update() {
        this.x -= this.speed * gameSpeed;
        this.y += this.verticalSpeed;
        
        // 边界检测，防止鱼游出屏幕上下边界
        if (this.y - this.radius < 0 || this.y + this.radius > canvas.height) {
            this.verticalSpeed *= -1;
        }
    }

    isOutOfBounds() {
        return this.x < -50 || this.x > canvas.width + 50 || this.y < -50 || this.y > canvas.height + 50;
    }
}

// 炸弹类
class Bomb {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.radius = 15;
        this.color = '#333333';
        this.pulse = 0;
        this.pulseSpeed = 0.05;
        this.lifetime = 3000;
        this.createdTime = Date.now();
    }

    draw() {
        // 绘制炸弹主体
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + Math.sin(this.pulse) * 3, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
        
        // 绘制炸弹的导火索
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.radius);
        ctx.lineTo(this.x, this.y - this.radius - 10);
        ctx.strokeStyle = '#ffcc00';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();
        
        // 绘制炸弹的金属部分
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = '#999999';
        ctx.fill();
        ctx.closePath();
    }

    update() {
        this.pulse += this.pulseSpeed;
    }

    isExpired() {
        return Date.now() - this.createdTime > this.lifetime;
    }
}

// 初始化游戏
function initGame() {
    player = new Player(selectedColor, selectedImage);
    fishArray = [];
    bombArray = [];
    score = 0;
    level = 1;
    gameSpeed = 1;
    gameOver = false;
    scoreElement.textContent = score;
    levelElement.textContent = level;
    gameOverElement.style.display = 'none';
}

// 生成鱼群
function spawnFish() {
    if (fishArray.length < 10 + level * 2) {
        fishArray.push(new Fish());
    }
}

// 生成炸弹
function spawnBombs() {
    if (bombArray.length < level * 2) {
        bombArray.push(new Bomb());
    }
}

// 检测碰撞
function checkCollisions() {
    // 检测与鱼的碰撞
    for (let i = fishArray.length - 1; i >= 0; i--) {
        const fish = fishArray[i];
        const distance = Math.sqrt(
            Math.pow(player.x - fish.x, 2) + Math.pow(player.y - fish.y, 2)
        );

        if (distance < player.radius + fish.radius) {
            if (player.radius > fish.radius) {
                // 玩家吃了鱼
                score += Math.floor(fish.radius);
                scoreElement.textContent = score;
                player.grow();
                fishArray.splice(i, 1);
                SoundManager.playSound('eat');

                // 升级
                if (score >= level * 100) {
                    level++;
                    levelElement.textContent = level;
                    gameSpeed += 0.1;
                    SoundManager.playSound('levelup');
                }
            } else {
                // 玩家被大鱼吃掉
                gameOver = true;
                gameOverElement.style.display = 'block';
                finalScoreElement.textContent = score;
                SoundManager.playSound('gameover');
                saveGameRecord();
            }
        }
    }

    // 检测与炸弹的碰撞
    for (let i = bombArray.length - 1; i >= 0; i--) {
        const bomb = bombArray[i];
        const distance = Math.sqrt(
            Math.pow(player.x - bomb.x, 2) + Math.pow(player.y - bomb.y, 2)
        );

        if (distance < player.radius + bomb.radius) {
            // 玩家碰到炸弹
            gameOver = true;
            gameOverElement.style.display = 'block';
            finalScoreElement.textContent = score;
            SoundManager.playSound('bomb');
            saveGameRecord();
        }

        // 炸弹过期自动爆炸
        if (bomb.isExpired()) {
            bombArray.splice(i, 1);
        }
    }
}

// 更新游戏状态
function update() {
    if (gameOver || !player) return;

    player.update();

    // 更新鱼群
    for (let i = fishArray.length - 1; i >= 0; i--) {
        fishArray[i].update();
        if (fishArray[i].isOutOfBounds()) {
            fishArray.splice(i, 1);
        }
    }

    // 更新炸弹
    for (let bomb of bombArray) {
        bomb.update();
    }

    // 生成新的鱼和炸弹
    spawnFish();
    spawnBombs();

    // 检测碰撞
    checkCollisions();
}

// 绘制游戏画面
function draw() {
    // 清空画布
    ctx.fillStyle = '#e6f7ff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制鱼群
    for (let fish of fishArray) {
        fish.draw();
    }

    // 绘制炸弹
    for (let bomb of bombArray) {
        bomb.draw();
    }

    // 绘制玩家
    if (player) {
        player.draw();
    }
}

// 游戏主循环
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// 键盘事件处理
function handleKeyDown(e) {
    switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            keys.up = true;
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            keys.down = true;
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            keys.left = true;
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            keys.right = true;
            break;
        case ' ':
            if (!gameOver && gameScreen.style.display === 'block') {
                backToMenu();
            }
            break;
    }
}

function handleKeyUp(e) {
    switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            keys.up = false;
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            keys.down = false;
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            keys.left = false;
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            keys.right = false;
            break;
    }
}

// 开始游戏
function startGame() {
    SoundManager.playSound('click');
    startScreen.style.display = 'none';
    gameScreen.style.display = 'block';
    initGame();
}

// 返回主菜单
function backToMenu() {
    SoundManager.playSound('click');
    gameOver = false;
    gameOverElement.style.display = 'none';
    gameScreen.style.display = 'none';
    startScreen.style.display = 'block';
}

// 切换静音
function toggleMute() {
    const isMuted = SoundManager.toggleMute();
    const muteBtn = document.querySelector('.mute-btn');
    if (muteBtn) {
        muteBtn.textContent = isMuted ? '🔇 静音' : '🔊 声音';
    }
}

// 保存游戏记录
async function saveGameRecord() {
    if (!currentUser || !currentUser.id) return;

    try {
        var data = await apiCall('/api/game-record', 'POST', {
            userId: currentUser.id,
            score: score,
            level: level,
            gameId: 6
        });
        if (!data.success) {
            console.error('保存游戏记录失败:', data.message);
        }
    } catch (error) {
        console.error('保存游戏记录失败:', error);
    }
}

// 同步数据到远程服务器
async function syncToServer() {
    if (!currentUser || !currentUser.username) return;

    try {
        await apiCall('/api/upload-data', 'POST', {
            username: currentUser.username,
            total_score: 0,
            games_played: 0,
            max_score: 0,
            records: []
        });
    } catch (error) {
        console.error('同步数据失败:', error);
    }
}
