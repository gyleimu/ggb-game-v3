// GGb Game — 错误码常量
// 所有接口返回的错误信息统一走此文件，禁止在代码中硬编码错误码

const ERROR_CODES = {
    // ========== 认证相关 (AUTH) ==========
    AUTH_001: { code: 'AUTH_001', status: 401, message: '请先登录' },
    AUTH_002: { code: 'AUTH_002', status: 401, message: 'token 已过期，请重新登录' },
    AUTH_003: { code: 'AUTH_003', status: 403, message: '无权进行此操作' },

    // ========== 用户相关 (USER) ==========
    USER_001: { code: 'USER_001', status: 404, message: '用户不存在' },
    USER_002: { code: 'USER_002', status: 401, message: '用户名或密码错误' },
    USER_003: { code: 'USER_003', status: 403, message: '账号已被锁定' },
    USER_004: { code: 'USER_004', status: 400, message: '该邮箱已被注册' },
    USER_005: { code: 'USER_005', status: 403, message: '账号已被封禁，请联系管理员' },

    // ========== 游戏相关 (GAME) ==========
    GAME_001: { code: 'GAME_001', status: 404, message: '游戏不存在' },
    GAME_002: { code: 'GAME_002', status: 500, message: '游戏记录保存失败' },

    // ========== 系统相关 (SYSTEM) ==========
    SYSTEM_001: { code: 'SYSTEM_001', status: 500, message: '服务器内部错误' },
    SYSTEM_002: { code: 'SYSTEM_002', status: 400, message: '请求参数错误' },
    SYSTEM_003: { code: 'SYSTEM_003', status: 429, message: '请求过于频繁，请稍后再试' },
};

// 根据错误码 key 取完整的 { code, status, message } 对象
function getError(key) {
    return ERROR_CODES[key] || ERROR_CODES.SYSTEM_001;
}

// 快捷方法：直接发送错误响应
function sendError(res, key) {
    const err = getError(key);
    return res.status(err.status).json({
        success: false,
        code: err.code,
        message: err.message
    });
}

module.exports = { ERROR_CODES, getError, sendError };
