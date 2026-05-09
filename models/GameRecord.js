const db = require('../db');

const GameRecord = {
    async create(userId, score, level, gameId = null) {
        return db.query(
            'INSERT INTO game_records (user_id, game_id, score, level) VALUES (?, ?, ?, ?)',
            [userId, gameId, score, level]
        );
    },

    async batchCreate(records) {
        if (!records || records.length === 0) return [];
        return db.batchInsert('game_records',
            ['user_id', 'game_id', 'score', 'level'],
            records.map(r => ({ user_id: r.userId, game_id: r.gameId || null, score: r.score || 0, level: r.level || 1 }))
        );
    },

    async deleteByUserId(userId) {
        return db.query('DELETE FROM game_records WHERE user_id = ?', [userId]);
    },

    async getByUserId(userId = null, limit = 50) {
        return db.buildQuery(
            'SELECT gr.id, gr.score, gr.level, gr.game_id, gr.played_at, u.username, g.name AS game_name FROM game_records gr JOIN users u ON gr.user_id = u.id LEFT JOIN games g ON gr.game_id = g.id',
            userId ? { 'gr.user_id': userId } : {},
            'gr.played_at DESC',
            limit
        );
    },

    async getTopByGame(gameId, limit = 10) {
        return db.query(
            `SELECT u.id AS user_id, u.username, MAX(gr.score) AS best_score, COUNT(gr.id) AS play_count, MAX(gr.played_at) AS last_played_at
             FROM game_records gr JOIN users u ON gr.user_id = u.id
             WHERE gr.game_id = ? AND u.is_admin = 0
             GROUP BY u.id, u.username
             ORDER BY best_score DESC LIMIT ?`,
            [gameId, limit]
        );
    },

    async getGlobalTop(limit = 10) {
        return db.query(
            `SELECT u.id AS user_id, u.username, SUM(gr.score) AS total_score, MAX(gr.score) AS best_score, COUNT(gr.id) AS play_count, MAX(gr.played_at) AS last_played_at
             FROM game_records gr JOIN users u ON gr.user_id = u.id
             WHERE u.is_admin = 0
             GROUP BY u.id, u.username
             ORDER BY total_score DESC LIMIT ?`,
            [limit]
        );
    },

    async count() {
        const rows = await db.query('SELECT COUNT(*) as c FROM game_records');
        return rows[0].c;
    },

    async sumScore() {
        const rows = await db.query('SELECT COALESCE(SUM(score), 0) as v FROM game_records');
        return rows[0].v;
    },

    async avgScore() {
        const rows = await db.query('SELECT COALESCE(ROUND(AVG(score)), 0) as v FROM game_records');
        return rows[0].v;
    },

    async countTodayByGame() {
        return db.query(
            `SELECT g.id, g.name, COUNT(gr.id) AS count
             FROM games g LEFT JOIN game_records gr
             ON g.id = gr.game_id AND DATE(gr.played_at) = CURDATE()
             GROUP BY g.id, g.name ORDER BY g.id`
        );
    },

    async countByDateRange(days = 7) {
        return db.query(
            `SELECT DATE(played_at) AS date, COUNT(*) AS count
             FROM game_records WHERE played_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
             GROUP BY DATE(played_at) ORDER BY date`,
            [days]
        );
    }
};

module.exports = GameRecord;
