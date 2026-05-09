// GGb Game — 统一 API 调用封装
// 自动注入 JWT token、统一 Content-Type、返回解析后的 JSON
var SERVER_URL = window.location.origin;

function apiCall(endpoint, method, body) {
    var opts = {
        method: method || 'GET',
        headers: { 'Content-Type': 'application/json' }
    };

    var token = Storage.getToken();
    if (token) {
        opts.headers['Authorization'] = 'Bearer ' + token;
    }

    if (body) {
        opts.body = JSON.stringify(body);
    }

    return fetch(SERVER_URL + endpoint, opts).then(function (res) {
        return res.json().then(function (data) {
            data._status = res.status;
            return data;
        });
    });
}
