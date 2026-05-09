const Game = require('../models/Game');
const GameRecord = require('../models/GameRecord');

const gameService = {

    // ===== 游戏表 =====
    async getAllGames() {
        return Game.getAll();
    },

    async initSeedGames() {
        const seeded = await Game.seed();
        if (seeded) console.log('种子游戏数据已初始化');
        else console.log('种子游戏数据已存在');
    },

    // ===== 游戏记录 =====
    async saveRecord(userId, score, level, gameId = null) {
        return GameRecord.create(userId, score, level, gameId);
    },

    async deleteUserRecords(userId) {
        return GameRecord.deleteByUserId(userId);
    },

    async batchSaveRecords(records) {
        return GameRecord.batchCreate(records);
    },

    async getRecords(userId = null, limit = 50) {
        return GameRecord.getByUserId(userId, limit);
    },

    async getTopByGame(gameId, limit = 10) {
        return GameRecord.getTopByGame(gameId, limit);
    },

    async getGlobalTop(limit = 10) {
        return GameRecord.getGlobalTop(limit);
    }
};

module.exports = gameService;
