const express = require('express');
const router = express.Router();
const userService = require('../services/userService');
const gameService = require('../services/gameService');
const systemService = require('../services/systemService');
const { requiredFields } = require('../middleware/validate');
const { asyncHandler } = require('../middleware/errorHandler');
const { verifyPassword } = require('../utils/password');
const { getQueryInt, buildLoginResponse, getClientIp } = require('../utils/helpers');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

router.post('/admin/login', requiredFields('username', 'password'), asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    const user = await userService.findByUsername(username);
    if (!user || user.is_admin !== 1 || !verifyPassword(password, user.password)) {
        return res.status(401).json({ success: false, message: '管理员账号或密码错误' });
    }
    res.json(buildLoginResponse(user, '管理员登录成功'));
}));

router.use(authMiddleware);

router.get('/admin/leaderboard', asyncHandler(async (req, res) => {
    const limit = getQueryInt(req, 'limit', 10);
    const leaderboard = await userService.getLeaderboard(limit);
    res.json({ success: true, leaderboard });
}));

router.use(adminMiddleware);

router.get('/admin/users', asyncHandler(async (req, res) => {
    const page = getQueryInt(req, 'page', 1);
    const limit = getQueryInt(req, 'limit', 20);
    const result = await userService.getAllUsers(page, limit);
    res.json({ success: true, ...result });
}));

router.get('/admin/users/search', asyncHandler(async (req, res) => {
    const { keyword } = req.query;
    if (!keyword) {
        return res.status(400).json({ success: false, message: '请输入搜索关键词' });
    }
    const page = getQueryInt(req, 'page', 1);
    const limit = getQueryInt(req, 'limit', 20);
    const result = await userService.searchUsers(keyword, page, limit);
    res.json({ success: true, ...result });
}));

router.delete('/admin/user/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    await gameService.deleteUserRecords(id);
    const result = await userService.deleteUser(id);
    if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: '用户不存在或无法删除管理员' });
    }
    res.json({ success: true, message: '用户已删除' });
}));

router.put('/admin/user/:id/ban', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const exists = await userService.findById(id);
    if (!exists) {
        return res.status(404).json({ success: false, message: '用户不存在' });
    }
    await userService.banUser(id);
    res.json({ success: true, message: '用户已封禁' });
}));

router.put('/admin/user/:id/unban', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const exists = await userService.findById(id);
    if (!exists) {
        return res.status(404).json({ success: false, message: '用户不存在' });
    }
    await userService.unbanUser(id);
    res.json({ success: true, message: '用户已解封' });
}));

router.put('/admin/user/:id/reset-password', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
        return res.status(400).json({ success: false, message: '新密码至少8位' });
    }
    if (!/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
        return res.status(400).json({ success: false, message: '新密码必须包含字母和数字' });
    }
    const exists = await userService.findById(id);
    if (!exists) {
        return res.status(404).json({ success: false, message: '用户不存在' });
    }
    await userService.adminResetPassword(id, newPassword);
    systemService.logOperation(id, exists.username, 'admin_reset_password', '管理员重置密码', getClientIp(req)).catch(() => {});
    res.json({ success: true, message: '密码已重置' });
}));

router.get('/admin/game-records', asyncHandler(async (req, res) => {
    const { userId } = req.query;
    const limit = getQueryInt(req, 'limit', 50);
    const records = await gameService.getRecords(userId || null, limit);
    res.json({ success: true, records });
}));

router.get('/admin/config', asyncHandler(async (req, res) => {
    const config = await systemService.getConfig();
    res.json({ success: true, config });
}));

router.put('/admin/config', requiredFields('key', 'value'), asyncHandler(async (req, res) => {
    const { key, value } = req.body;
    const result = await systemService.updateConfig(key, value);
    if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: '配置项不存在' });
    }
    res.json({ success: true, message: '配置已更新' });
}));

router.get('/admin/login-logs', asyncHandler(async (req, res) => {
    const { userId } = req.query;
    const limit = getQueryInt(req, 'limit', 50);
    const logs = await systemService.getLoginLogs(userId || null, limit);
    res.json({ success: true, logs });
}));

router.get('/admin/stats', asyncHandler(async (req, res) => {
    const stats = await systemService.getStats();
    res.json({ success: true, stats });
}));

router.get('/admin/dashboard', asyncHandler(async (req, res) => {
    const days = getQueryInt(req, 'days', 7);
    const dashboard = await systemService.getDashboardStats(days);
    res.json({ success: true, dashboard });
}));

router.get('/admin/operation-logs', asyncHandler(async (req, res) => {
    const { keyword, action } = req.query;
    const page = getQueryInt(req, 'page', 1);
    const limit = getQueryInt(req, 'limit', 20);
    const result = await systemService.getOperationLogs(keyword || null, action || null, page, limit);
    res.json({ success: true, ...result });
}));

module.exports = router;
