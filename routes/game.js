const express = require('express');
const router = express.Router();
const gameService = require('../services/gameService');
const userService = require('../services/userService');
const systemService = require('../services/systemService');
const { requiredFields } = require('../middleware/validate');
const { asyncHandler } = require('../middleware/errorHandler');
const { authMiddleware, requireOwnership } = require('../middleware/auth');
const { getQueryInt, getClientIp } = require('../utils/helpers');

router.get('/games', asyncHandler(async (req, res) => {
    const games = await gameService.getAllGames();
    res.json({ success: true, games });
}));

router.post('/game-record', authMiddleware, requireOwnership('userId'), requiredFields('userId', 'score', 'level'), asyncHandler(async (req, res) => {
    const { userId, score, level, gameId } = req.body;
    let validGameId = null;
    if (gameId) {
        const games = await gameService.getAllGames();
        if (games.some(g => g.id === gameId)) {
            validGameId = gameId;
        }
    }
    await gameService.saveRecord(userId, score, level, validGameId);
    await userService.updateStats(userId, score);
    systemService.logOperation(userId, req.user.username, 'play_game', `得分:${score},等级:${level}`, getClientIp(req)).catch(() => {});
    res.json({ success: true, message: '游戏记录已保存' });
}));

router.get('/profile/records', authMiddleware, asyncHandler(async (req, res) => {
    var limit = getQueryInt(req, 'limit', 50);
    var records = await gameService.getRecords(req.user.userId, limit);
    res.json({ success: true, records });
}));

router.get('/leaderboard', authMiddleware, asyncHandler(async (req, res) => {
    const limit = getQueryInt(req, 'limit', 10);
    const leaderboard = await gameService.getGlobalTop(limit);
    res.json({ success: true, leaderboard });
}));

router.get('/leaderboard/:gameId', authMiddleware, asyncHandler(async (req, res) => {
    const gameId = parseInt(req.params.gameId, 10);
    if (isNaN(gameId) || gameId < 1) {
        return res.status(400).json({ success: false, message: '无效的游戏ID' });
    }
    const limit = getQueryInt(req, 'limit', 10);
    const leaderboard = await gameService.getTopByGame(gameId, limit);
    res.json({ success: true, leaderboard });
}));

router.post('/upload-data', authMiddleware, requireOwnership('username', 'username'), requiredFields('username'), asyncHandler(async (req, res) => {
    const { username, total_score, games_played, max_score, records } = req.body;

    let user = await userService.findByUsername(username);

    if (user) {
        await userService.accumulateStats(user.id, total_score || 0, games_played || 0, max_score || 0);
        if (records && records.length > 0) {
            const batchRecords = records.map(r => ({ userId: user.id, score: r.score || 0, level: r.level || 1 }));
            await gameService.batchSaveRecords(batchRecords);
        }
        return res.json({ success: true, message: '数据上传成功' });
    }

    const result = await userService.createUser(username, 'default123');
    const userId = result.id;
    await userService.setStats(userId, total_score || 0, games_played || 0, max_score || 0);

    if (records && records.length > 0) {
        const batchRecords = records.map(r => ({ userId, score: r.score || 0, level: r.level || 1 }));
        await gameService.batchSaveRecords(batchRecords);
    }

    res.json({ success: true, message: '数据上传成功，用户已创建' });
}));

module.exports = router;
