const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const userService = require('../services/userService');
const systemService = require('../services/systemService');
const { handleValidationErrors, requiredFields } = require('../middleware/validate');
const { asyncHandler } = require('../middleware/errorHandler');
const { getClientIp, buildLoginResponse } = require('../utils/helpers');
const { authMiddleware } = require('../middleware/auth');

const registerValidation = [
    body('username').trim().notEmpty().withMessage('用户名不能为空').isLength({ min: 2, max: 30 }).withMessage('用户名需要2-30个字符'),
    body('password').notEmpty().withMessage('密码不能为空').isLength({ min: 8 }).withMessage('密码至少8位').matches(/[a-zA-Z]/).withMessage('密码必须包含字母').matches(/[0-9]/).withMessage('密码必须包含数字'),
    body('email').optional({ values: 'falsy' }).isEmail().withMessage('邮箱格式不正确').normalizeEmail(),
    handleValidationErrors
];

const loginValidation = [
    body('username').trim().notEmpty().withMessage('用户名不能为空'),
    body('password').notEmpty().withMessage('密码不能为空'),
    handleValidationErrors
];

router.post('/register', registerValidation, asyncHandler(async (req, res) => {
    const { username, password, email } = req.body;
    const existing = await userService.findByUsername(username);
    if (existing) {
        return res.status(400).json({ success: false, message: '用户名已存在' });
    }
    if (email) {
        const existingEmail = await userService.findByEmail(email);
        if (existingEmail) {
            return res.status(400).json({ success: false, message: '该邮箱已被注册' });
        }
    }
    const result = await userService.createUser(username, password, 0, email || null);
    systemService.logOperation(result.id, username, 'register', '新用户注册', getClientIp(req)).catch(() => {});
    res.json({ success: true, message: '注册成功', userId: result.id });
}));

router.post('/login', loginValidation, asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    const ipAddress = getClientIp(req);

    const user = await userService.findByUsername(username);
    if (!user) {
        return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
        return res.status(403).json({ success: false, message: '账号已被锁定，请稍后再试' });
    }

    const loginOk = await userService.verifyPassword(password, user.password);
    if (!loginOk) {
        await userService.incrementLoginAttempts(user.id);
        var attempts = (user.login_attempts || 0) + 1;
        if (attempts >= 3) {
            await userService.lockAccount(user.id, 15);
            return res.status(403).json({ success: false, message: '密码错误次数过多，账号已锁定15分钟' });
        }
        return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }

    await userService.resetLoginAttempts(user.id);

    if (user.is_banned) {
        return res.status(403).json({ success: false, message: '账号已被封禁，请联系管理员' });
    }

    systemService.insertLoginLog(user.id, username, ipAddress).catch(err => {
        console.error('记录登录日志失败:', err.message);
    });
    systemService.logOperation(user.id, username, 'login', '登录成功', ipAddress).catch(() => {});

    res.json(buildLoginResponse(user));
}));

router.get('/user/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = await userService.findById(id);
    if (!user) {
        return res.status(404).json({ success: false, message: '用户不存在' });
    }
    res.json({ success: true, user });
}));

router.get('/profile', authMiddleware, asyncHandler(async (req, res) => {
    var profile = await userService.getProfile(req.user.userId);
    if (!profile) {
        return res.status(404).json({ success: false, message: '用户不存在' });
    }
    res.json({ success: true, user: profile });
}));

router.put('/profile/password', authMiddleware, requiredFields('oldPassword', 'newPassword'), asyncHandler(async (req, res) => {
    var { oldPassword, newPassword } = req.body;
    if (newPassword.length < 8) {
        return res.status(400).json({ success: false, message: '新密码至少8位' });
    }
    if (!/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
        return res.status(400).json({ success: false, message: '新密码必须包含字母和数字' });
    }
    var result = await userService.changePassword(req.user.userId, oldPassword, newPassword);
    if (result === null) return res.status(404).json({ success: false, message: '用户不存在' });
    if (result === false) return res.status(400).json({ success: false, message: '旧密码不正确' });
    systemService.logOperation(req.user.userId, req.user.username, 'change_password', '修改密码', getClientIp(req)).catch(() => {});
    res.json({ success: true, message: '密码已更新' });
}));

module.exports = router;
