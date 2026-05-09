// GGb Game — localStorage 统一封装
// 所有 Auth 相关的 localStorage 操作集中管理
var Storage = (function () {
    var KEYS = { USER: 'ggb_user', TOKEN: 'ggb_token' };

    return {
        getUser: function () {
            try {
                var raw = localStorage.getItem(KEYS.USER);
                if (!raw) return null;
                var user = JSON.parse(raw);
                return user && user.id ? user : null;
            } catch (e) { return null; }
        },

        setUser: function (user) {
            if (!user) return;
            localStorage.setItem(KEYS.USER, JSON.stringify(user));
        },

        getToken: function () {
            return localStorage.getItem(KEYS.TOKEN) || '';
        },

        setToken: function (token) {
            if (token) localStorage.setItem(KEYS.TOKEN, token);
        },

        clearSession: function () {
            localStorage.removeItem(KEYS.USER);
            localStorage.removeItem(KEYS.TOKEN);
        }
    };
})();
