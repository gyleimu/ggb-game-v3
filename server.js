require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { getPool } = require('./db');
const { globalErrorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== 中间件 =====
app.use(cors());

app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginOpenerPolicy: false
}));

app.use(express.json());

// ===== 静态资源 =====
app.use(express.static(path.join(__dirname, 'public')));

// ===== 限流 =====
const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    message: { success: false, message: '请求过于频繁，请稍后再试' }
});

app.use('/api', apiLimiter);

// ===== 路由 =====
app.use('/api', require('./routes/auth'));
app.use('/api', require('./routes/game'));
app.use('/api', require('./routes/admin'));

// ===== 页面路由 =====
const sendPage = (file) => (req, res) =>
    res.sendFile(path.join(__dirname, 'public', file));

app.get('/', sendPage('index.html'));
app.get('/admin', sendPage('admin.html'));
app.get('/game', sendPage('game.html'));
app.get('/game-snake', sendPage('snake.html'));
app.get('/game-shooter', sendPage('shooter.html'));
app.get('/game-tetris', sendPage('tetris.html'));
app.get('/game-bubble', sendPage('bubble.html'));
app.get('/profile', sendPage('profile.html'));
app.get('/leaderboard', sendPage('leaderboard.html'));

// ===== 错误处理 =====
app.use(notFoundHandler);
app.use(globalErrorHandler);

// ===== 数据库初始化 =====
async function initDatabase() {
    const pool = await getPool();

    await pool.execute(`
        CREATE TABLE IF NOT EXISTS users (
            id INT PRIMARY KEY AUTO_INCREMENT,
            username VARCHAR(100) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            email VARCHAR(200) DEFAULT NULL,
            email_verified TINYINT DEFAULT 0,
            login_attempts INT DEFAULT 0,
            locked_until DATETIME DEFAULT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            is_admin TINYINT DEFAULT 0,
            total_score INT DEFAULT 0,
            games_played INT DEFAULT 0,
            max_score INT DEFAULT 0
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await pool.execute(`
        CREATE TABLE IF NOT EXISTS games (
            id INT PRIMARY KEY AUTO_INCREMENT,
            name VARCHAR(100) NOT NULL,
            description VARCHAR(500) DEFAULT '',
            cover_image VARCHAR(255) DEFAULT '',
            page_url VARCHAR(255) NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await pool.execute(`
        CREATE TABLE IF NOT EXISTS game_records (
            id INT PRIMARY KEY AUTO_INCREMENT,
            user_id INT NOT NULL,
            game_id INT DEFAULT NULL,
            score INT NOT NULL,
            level INT NOT NULL,
            played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await pool.execute(`
        CREATE TABLE IF NOT EXISTS system_config (
            \`key\` VARCHAR(100) PRIMARY KEY,
            value VARCHAR(255) NOT NULL,
            description VARCHAR(255)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await pool.execute(`
        CREATE TABLE IF NOT EXISTS login_logs (
            id INT PRIMARY KEY AUTO_INCREMENT,
            user_id INT NOT NULL,
            username VARCHAR(100) NOT NULL,
            ip_address VARCHAR(50),
            status VARCHAR(20),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    console.log('✅ 数据库初始化完成');
}

// ===== 启动 =====
initDatabase().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
});