function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

function globalErrorHandler(err, req, res, _next) {
    console.error('========== 错误捕获 ==========');
    console.error(err);
    console.error('err.status:', err.status);
    console.error('err.code:', err.code);
    console.error('err.name:', err.name);
    console.error('err.message:', err.message);
    console.error('err.stack:', err.stack);
    console.error('==============================');

    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({
            success: false,
            message: '请求体JSON格式错误'
        });
    }

    if (err.status) {
        return res.status(err.status).json({
            success: false,
            message: err.message || '请求错误'
        });
    }

    if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: '认证失败'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: '令牌已过期，请重新登录'
        });
    }

    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
            success: false,
            message: '上传文件过大'
        });
    }

    console.error('========== 500 服务器错误 ==========');
    console.error('请求:', req.method, req.originalUrl);
    console.error('错误:', err.message);
    console.error('错误码:', err.code || 'N/A');
    console.error('堆栈:\n' + (err.stack || 'no stack'));
    console.error('=====================================');
    res.status(500).json({
        success: false,
        message: '服务器内部错误'
    });
}

function notFoundHandler(req, res) {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({
            success: false,
            message: '接口不存在'
        });
    }
    res.status(404).sendFile(path.join(__dirname, '..', 'public', 'index.html'));
}

const path = require('path');

module.exports = { asyncHandler, globalErrorHandler, notFoundHandler };
