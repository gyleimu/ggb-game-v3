const User = require('../models/User');
const GameRecord = require('../models/GameRecord');
const SystemConfig = require('../models/SystemConfig');
const LoginLog = require('../models/LoginLog');
const OperationLog = require('../models/OperationLog');

const systemService = {

    async initDefaultConfig() {
        const seeded = await SystemConfig.seed();
        if (seeded) console.log('默认配置已初始化');
        else console.log('默认配置已存在');
    },

    async getConfig() {
        return SystemConfig.getAll();
    },

    async updateConfig(key, value) {
        return SystemConfig.update(key, value);
    },

    async getStats() {
        const [total_users, total_games, total_score, avg_score, highest_score] = await Promise.all([
            User.countNonAdmin(),
            GameRecord.count(),
            GameRecord.sumScore(),
            GameRecord.avgScore(),
            User.maxScore()
        ]);
        return { total_users, total_games, total_score, avg_score, highest_score };
    },

    async getDashboardStats(days = 7) {
        const [todayUsers, gamesByGameToday, userTrend, recordTrend] = await Promise.all([
            User.countToday(),
            GameRecord.countTodayByGame(),
            User.countByDateRange(days),
            GameRecord.countByDateRange(days)
        ]);
        return { todayUsers, gamesByGameToday, userTrend, recordTrend };
    },

    async insertLoginLog(userId, username, ipAddress) {
        return LoginLog.create(userId, username, ipAddress);
    },

    async getLoginLogs(userId = null, limit = 50) {
        return LoginLog.getByUserId(userId, limit);
    },

    async logOperation(userId, username, action, detail, ip) {
        return OperationLog.create(userId, username, action, detail, ip);
    },

    async getOperationLogs(keyword, action, page = 1, limit = 20) {
        const hasFilter = keyword || action;
        const [logs, total] = await Promise.all([
            hasFilter ? OperationLog.search(keyword, action, page, limit) : OperationLog.getAll(page, limit),
            hasFilter ? OperationLog.countByFilter(keyword, action) : OperationLog.countAll()
        ]);
        return { logs, total, page, limit };
    }
};

module.exports = systemService;
