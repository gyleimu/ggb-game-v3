const User = require('../models/User');
const { hashPassword, verifyPassword } = require('../utils/password');

const userService = {

    async findByUsername(username) {
        return User.findByUsername(username);
    },

    async findByEmail(email) {
        return User.findByEmail(email);
    },

    async findById(id) {
        return User.findById(id);
    },

    async createUser(username, password, isAdmin = 0, email = null) {
        const hashed = hashPassword(password);
        return User.create(username, hashed, isAdmin, email);
    },

    async verifyLogin(username, password) {
        const user = await User.findByUsername(username);
        if (!user) return null;
        if (!verifyPassword(password, user.password)) return null;
        return user;
    },

    verifyPassword,

    async incrementLoginAttempts(userId) {
        return User.incrementLoginAttempts(userId);
    },

    async lockAccount(userId, minutes) {
        return User.lockAccount(userId, minutes);
    },

    async resetLoginAttempts(userId) {
        return User.resetLoginAttempts(userId);
    },

    async getProfile(userId) {
        return User.getProfileById(userId);
    },

    async changePassword(userId, oldPwd, newPwd) {
        var user = await User.findByIdWithPassword(userId);
        if (!user) return null;
        if (!verifyPassword(oldPwd, user.password)) return false;
        var hashed = hashPassword(newPwd);
        await User.updatePassword(userId, hashed);
        return true;
    },

    async updateStats(userId, score) {
        return User.updateStats(userId, score);
    },

    async accumulateStats(userId, totalScore, gamesPlayed, maxScore) {
        return User.accumulateStats(userId, totalScore, gamesPlayed, maxScore);
    },

    async setStats(userId, totalScore, gamesPlayed, maxScore) {
        return User.setStats(userId, totalScore, gamesPlayed, maxScore);
    },

    async getAllUsers(page = 1, limit = 20) {
        const [users, total] = await Promise.all([
            User.getAll(page, limit),
            User.countAll()
        ]);
        return { users, total, page, limit };
    },

    async searchUsers(keyword, page = 1, limit = 20) {
        const [users, total] = await Promise.all([
            User.search(keyword, page, limit),
            User.countByKeyword(keyword)
        ]);
        return { users, total, page, limit };
    },

    async banUser(id) {
        return User.banById(id);
    },

    async unbanUser(id) {
        return User.unbanById(id);
    },

    async adminResetPassword(userId, newPassword) {
        const hashed = await hashPassword(newPassword);
        await User.updatePassword(userId, hashed);
        await User.resetLoginAttempts(userId);
    },

    async deleteUser(id) {
        return User.deleteById(id);
    },

    async getLeaderboard(limit = 10) {
        return User.getLeaderboard(limit);
    },

    async createDefaultAdmin(adminUsername, adminPassword) {
        const existing = await User.findByUsername(adminUsername);
        if (existing) {
            console.log('管理员账号已存在');
            return;
        }
        await this.createUser(adminUsername, adminPassword, 1);
        console.log(`默认管理员已创建: ${adminUsername}`);
    }
};

module.exports = userService;
