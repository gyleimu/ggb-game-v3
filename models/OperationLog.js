const db = require('../db');

module.exports = {
    async create(userId, username, action, detail, ip) {
        return db.query(
            'INSERT INTO operation_logs (user_id, username, action, detail, ip_address) VALUES (?, ?, ?, ?, ?)',
            [userId, username, action, detail || null, ip || null]
        );
    },

    async getAll(page = 1, limit = 20) {
        const offset = (page - 1) * limit;
        return db.query(
            `SELECT id, user_id, username, action, detail, ip_address, created_at
             FROM operation_logs ORDER BY created_at DESC LIMIT ?, ?`,
            [offset, limit]
        );
    },

    async countAll() {
        const rows = await db.query('SELECT COUNT(*) AS total FROM operation_logs');
        return rows[0].total;
    },

    async search(keyword, action, page = 1, limit = 20) {
        const offset = (page - 1) * limit;
        let sql = `SELECT id, user_id, username, action, detail, ip_address, created_at
                   FROM operation_logs WHERE 1=1`;
        const params = [];

        if (keyword) {
            sql += ' AND username LIKE ?';
            params.push(`%${keyword}%`);
        }
        if (action) {
            sql += ' AND action = ?';
            params.push(action);
        }

        sql += ' ORDER BY created_at DESC LIMIT ?, ?';
        params.push(offset, limit);
        return db.query(sql, params);
    },

    async countByFilter(keyword, action) {
        let sql = 'SELECT COUNT(*) AS total FROM operation_logs WHERE 1=1';
        const params = [];
        if (keyword) {
            sql += ' AND username LIKE ?';
            params.push(`%${keyword}%`);
        }
        if (action) {
            sql += ' AND action = ?';
            params.push(action);
        }
        const rows = await db.query(sql, params);
        return rows[0].total;
    }
};
