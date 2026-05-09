const db = require('../db');

const DEFAULT_CONFIGS = [
    { key: 'fish_spawn_rate', value: '2000', description: '鱼生成间隔（毫秒）' },
    { key: 'bomb_spawn_rate', value: '5000', description: '炸弹生成间隔（毫秒）' },
    { key: 'player_base_speed', value: '3', description: '玩家基础速度' },
    { key: 'game_base_fish_speed', value: '1.5', description: '鱼基础速度' },
    { key: 'level_up_score', value: '100', description: '升级所需分数' }
];

const SystemConfig = {
    async getAll() {
        return db.query('SELECT `key`, value, description FROM system_config');
    },

    async update(key, value) {
        return db.query('UPDATE system_config SET value = ? WHERE `key` = ?', [value, key]);
    },

    async count() {
        const rows = await db.query('SELECT COUNT(*) as c FROM system_config');
        return rows[0].c;
    },

    async seed() {
        const c = await this.count();
        if (c > 0) return false;
        await db.batchInsert('system_config', ['key', 'value', 'description'], DEFAULT_CONFIGS);
        return true;
    }
};

module.exports = SystemConfig;