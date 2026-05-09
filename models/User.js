const db = require('../db');
const { NON_ADMIN_FILTER } = require('../utils/helpers');

const USER_PUBLIC_FIELDS = 'id, username, created_at, is_admin, total_score, games_played, max_score';

const User = {
    async findByUsername(username) {
        return db.getOne('SELECT * FROM users WHERE username = ?', [username]);
    },

    async findByEmail(email) {
        return db.getOne('SELECT * FROM users WHERE email = ?', [email]);
    },

    async findById(id) {
        return db.getOne(`SELECT ${USER_PUBLIC_FIELDS} FROM users WHERE id = ?`, [id]);
    },

    async create(username, hashedPassword, isAdmin = 0, email = null) {
        const result = await db.insert(
            'INSERT INTO users (username, password, email, is_admin) VALUES (?, ?, ?, ?)',
            [username, hashedPassword, email, isAdmin]
        );
        return { id: result.insertId };
    },

    async updateStats(userId, score) {
        return db.query(
            `UPDATE users SET total_score = total_score + ?, games_played = games_played + 1,
             max_score = CASE WHEN ? > max_score THEN ? ELSE max_score END WHERE id = ?`,
            [score, score, score, userId]
        );
    },

    async accumulateStats(userId, totalScore, gamesPlayed, maxScore) {
        return db.query(
            `UPDATE users SET total_score = total_score + COALESCE(?, 0), games_played = games_played + COALESCE(?, 0),
             max_score = CASE WHEN COALESCE(?, 0) > max_score THEN COALESCE(?, 0) ELSE max_score END WHERE id = ?`,
            [totalScore, gamesPlayed, maxScore, maxScore, userId]
        );
    },

    async setStats(userId, totalScore, gamesPlayed, maxScore) {
        return db.query(
            'UPDATE users SET total_score = ?, games_played = ?, max_score = ? WHERE id = ?',
            [totalScore || 0, gamesPlayed || 0, maxScore || 0, userId]
        );
    },

    async getAll(page = 1, limit = 20) {
        const offset = (page - 1) * limit;
        return db.query(
            `SELECT id, username, email, created_at, is_banned FROM users WHERE ${NON_ADMIN_FILTER} ORDER BY created_at DESC LIMIT ?, ?`,
            [offset, limit]
        );
    },

    async countAll() {
        const rows = await db.query(`SELECT COUNT(*) AS total FROM users WHERE ${NON_ADMIN_FILTER}`);
        return rows[0].total;
    },

    async search(keyword, page = 1, limit = 20) {
        const offset = (page - 1) * limit;
        return db.query(
            `SELECT id, username, email, created_at, is_banned FROM users WHERE ${NON_ADMIN_FILTER} AND username LIKE ? ORDER BY created_at DESC LIMIT ?, ?`,
            [`%${keyword}%`, offset, limit]
        );
    },

    async countByKeyword(keyword) {
        const rows = await db.query(
            `SELECT COUNT(*) AS total FROM users WHERE ${NON_ADMIN_FILTER} AND username LIKE ?`,
            [`%${keyword}%`]
        );
        return rows[0].total;
    },

    async banById(id) {
        const result = await db.query(`UPDATE users SET is_banned = 1 WHERE id = ? AND ${NON_ADMIN_FILTER}`, [id]);
        return result.affectedRows > 0;
    },

    async unbanById(id) {
        const result = await db.query('UPDATE users SET is_banned = 0 WHERE id = ?', [id]);
        return result.affectedRows > 0;
    },

    async deleteById(id) {
        return db.query(`DELETE FROM users WHERE id = ? AND ${NON_ADMIN_FILTER}`, [id]);
    },

    async getLeaderboard(limit = 10) {
        return db.query(
            `SELECT ${USER_PUBLIC_FIELDS} FROM users WHERE ${NON_ADMIN_FILTER} AND max_score > 0 ORDER BY max_score DESC LIMIT ?`,
            [limit]
        );
    },

    async countNonAdmin() {
        const rows = await db.query(`SELECT COUNT(*) as c FROM users WHERE ${NON_ADMIN_FILTER}`);
        return rows[0].c;
    },

    async countToday() {
        const rows = await db.query(
            `SELECT COUNT(*) AS c FROM users WHERE ${NON_ADMIN_FILTER} AND DATE(created_at) = CURDATE()`
        );
        return rows[0].c;
    },

    async countByDateRange(days = 7) {
        return db.query(
            `SELECT DATE(created_at) AS date, COUNT(*) AS count
             FROM users WHERE ${NON_ADMIN_FILTER} AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
             GROUP BY DATE(created_at) ORDER BY date`,
            [days]
        );
    },

    async maxScore() {
        const rows = await db.query(`SELECT COALESCE(MAX(max_score), 0) as v FROM users WHERE ${NON_ADMIN_FILTER}`);
        return rows[0].v;
    },

    async incrementLoginAttempts(userId) {
        return db.query(
            'UPDATE users SET login_attempts = COALESCE(login_attempts, 0) + 1 WHERE id = ?',
            [userId]
        );
    },

    async lockAccount(userId, minutes) {
        var lockedUntil = new Date(Date.now() + minutes * 60 * 1000);
        return db.query(
            'UPDATE users SET locked_until = ? WHERE id = ?',
            [lockedUntil, userId]
        );
    },

    async resetLoginAttempts(userId) {
        return db.query(
            'UPDATE users SET login_attempts = 0, locked_until = NULL WHERE id = ?',
            [userId]
        );
    },

    async getProfileById(userId) {
        return db.getOne('SELECT id, username, email, created_at, total_score, games_played, max_score FROM users WHERE id = ?', [userId]);
    },

    async findByIdWithPassword(userId) {
        return db.getOne('SELECT * FROM users WHERE id = ?', [userId]);
    },

    async updatePassword(userId, hashedPwd) {
        return db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPwd, userId]);
    }
};

module.exports = User;
