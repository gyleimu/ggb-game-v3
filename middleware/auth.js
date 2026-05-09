const { verifyToken } = require('../utils/jwt');

function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: '未提供认证令牌' });
    }

    try {
        const token = authHeader.split(' ')[1];
        req.user = verifyToken(token);
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: '令牌已过期，请重新登录' });
        }
        return res.status(401).json({ success: false, message: '无效的认证令牌' });
    }
}

function optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            const token = authHeader.split(' ')[1];
            req.user = verifyToken(token);
        } catch (_) {}
    }
    next();
}

function requireOwnership(bodyField, tokenField = bodyField) {
    return (req, res, next) => {
        if (req.user[tokenField] !== req.body[bodyField] && !req.user.isAdmin) {
            return res.status(403).json({ success: false, message: '无权操作其他用户的数据' });
        }
        next();
    };
}

function adminMiddleware(req, res, next) {
    if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({ success: false, message: '无权进行此操作' });
    }
    next();
}

module.exports = { authMiddleware, optionalAuth, requireOwnership, adminMiddleware };
