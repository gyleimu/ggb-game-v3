const { generateToken } = require('./jwt');

// 非管员过滤常量 — 复用于所有用户查询
const NON_ADMIN_FILTER = 'is_admin = 0';

function getClientIp(req) {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    return req.ip || req.socket?.remoteAddress || '';
}

function getQueryInt(req, key, defaultVal = 10) {
    const val = parseInt(req.query[key], 10);
    return isNaN(val) ? defaultVal : val;
}

function sendSuccess(res, data = {}) {
    res.json({ success: true, ...data });
}

function sendError(res, statusCode, message) {
    res.status(statusCode).json({ success: false, message });
}

function buildLoginResponse(user, message = '登录成功') {
    const token = generateToken({
        userId: user.id,
        username: user.username,
        isAdmin: user.is_admin === 1
    });

    return {
        success: true,
        message,
        token,
        userId: user.id,
        username: user.username,
        isAdmin: user.is_admin === 1
    };
}

module.exports = { NON_ADMIN_FILTER, getClientIp, getQueryInt, sendSuccess, sendError, buildLoginResponse };
