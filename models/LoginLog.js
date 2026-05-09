const db = require('../db');

const LoginLog = {
    async create(userId, username, ipAddress) {
        return db.query(
            'INSERT INTO login_logs (user_id, username, ip_address) VALUES (?, ?, ?)',
            [userId, username, ipAddress]
        );
    },

    async getByUserId(userId = null, limit = 50) {
        return db.buildQuery(
            'SELECT * FROM login_logs',
            userId ? { user_id: userId } : {},
            'login_time DESC',
            limit
        );
    }
};

module.exports = LoginLog;
