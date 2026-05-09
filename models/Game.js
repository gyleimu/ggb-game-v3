const db = require('../db');

const SEED_GAMES = [
    { name: '大球吃小球', description: '猪猪侠风格！控制你的球吃掉比你小的球来成长，躲避炸弹，挑战最高分！', cover_image: 'cover-fish.png', page_url: '/game' },
    { name: '太空射击', description: '驾驶星际战舰在浩瀚宇宙中消灭敌机，收集能量道具、升级武器系统！', cover_image: 'cover-shooter.png', page_url: '/game-shooter' },
    { name: '贪吃蛇大作战', description: '操控你的彩色贪吃蛇吃掉食物不断变长，在竞技场中与其他玩家斗智斗勇！', cover_image: 'cover-snake.png', page_url: '/game-snake' },
    { name: '俄罗斯方块', description: '经典永不过时！旋转、移动、堆叠下落方块，消除整行得分！', cover_image: 'cover-tetris.png', page_url: '/game-tetris' },
    { name: '泡泡龙', description: '瞄准、发射、消除！同色三个泡泡相连即消除，关卡层层递进！', cover_image: 'cover-bubble.png', page_url: '/game-bubble' }
];

const Game = {
    async getAll() {
        return db.query('SELECT id, name, description, cover_image, page_url, created_at FROM games ORDER BY id ASC');
    },

    async count() {
        const rows = await db.query('SELECT COUNT(*) as c FROM games');
        return rows[0].c;
    },

    async seed() {
        const c = await this.count();
        if (c > 0) return false;
        await db.batchInsert('games', ['name', 'description', 'cover_image', 'page_url'], SEED_GAMES);
        return true;
    }
};

module.exports = Game;
