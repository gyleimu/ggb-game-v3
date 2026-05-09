// GGb Game — 游戏大厅
var currentUser = null;

function showMsg(el, text, type) {
    el.innerHTML = text;
    el.className = 'message ' + type;
}

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', function () {
    checkLoginState();
    loadGames();
});

function checkLoginState() {
    currentUser = Storage.getUser();
    if (currentUser) {
        updateNavForLoggedIn();
    }
}

function updateNavForLoggedIn() {
    document.getElementById('navAuthLinks').style.display = 'none';
    document.getElementById('navUserInfo').style.display = 'flex';
    document.getElementById('navUsername').textContent = currentUser.username;
    document.getElementById('authOverlay').classList.add('hidden');
}

// ===== 加载游戏列表 =====
async function loadGames() {
    var grid = document.getElementById('gamesGrid');
    try {
        var data = await apiCall('/api/games');
        if (!data.success || !data.games.length) {
            grid.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🎮</div><div class="empty-state-text">暂无游戏</div></div>';
            return;
        }
        renderCards(data.games);
    } catch (e) {
        grid.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-text">加载失败，请检查网络</div></div>';
    }
}

function renderCards(games) {
    var grid = document.getElementById('gamesGrid');
    grid.innerHTML = games.map(function (g) {
        return '<div class="game-card">' +
            '<img class="card-cover" src="' + g.cover_image + '" alt="' + escHtml(g.name) + '" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'">' +
            '<div class="card-cover-placeholder" style="display:' + (g.cover_image ? 'none' : 'flex') + '">🎮</div>' +
            '<div class="card-body">' +
            '<h3 class="card-title">' + escHtml(g.name) + '</h3>' +
            '<p class="card-desc">' + escHtml(g.description) + '</p>' +
            '<button class="card-btn" onclick="playGame(\'' + escHtml(g.page_url) + '\')">开始游戏</button>' +
            '</div></div>';
    }).join('');
}

function escHtml(s) {
    if (!s) return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ===== 开始游戏 =====
function playGame(url) {
    if (!currentUser) { showLogin(); return; }
    window.location.href = url;
}

// ===== 登录遮罩 =====
function showLogin() {
    document.getElementById('authOverlay').classList.remove('hidden');
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
    clearMessages();
}
function showRegister() {
    document.getElementById('authOverlay').classList.remove('hidden');
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    clearMessages();
}
function closeAuth() { document.getElementById('authOverlay').classList.add('hidden'); }
function clearMessages() {
    var lm = document.getElementById('loginMessage');
    var rm = document.getElementById('registerMessage');
    if (lm) lm.innerHTML = '';
    if (rm) rm.innerHTML = '';
}

// ===== 登录 =====
async function handleLogin() {
    var username = document.getElementById('loginUsername').value.trim();
    var password = document.getElementById('loginPassword').value;
    var el = document.getElementById('loginMessage');

    if (!username || !password) { showMsg(el, '请输入用户名和密码', 'error'); return; }

    try {
        var data = await apiCall('/api/login', 'POST', { username: username, password: password });
        if (data.success) {
            currentUser = { id: data.userId, username: data.username };
            Storage.setUser(currentUser);
            if (data.token) Storage.setToken(data.token);
            showMsg(el, '登录成功', 'success');
            setTimeout(function () { updateNavForLoggedIn(); closeAuth(); clearMessages(); }, 800);
        } else {
            showMsg(el, data.message || '用户名或密码错误', 'error');
        }
    } catch (e) { showMsg(el, '网络错误，请稍后重试', 'error'); }
}

// ===== 注册 =====
async function handleRegister() {
    var username = document.getElementById('registerUsername').value.trim();
    var email = document.getElementById('registerEmail').value.trim();
    var password = document.getElementById('registerPassword').value;
    var confirm = document.getElementById('registerConfirmPassword').value;
    var el = document.getElementById('registerMessage');

    if (!username || !password) { showMsg(el, '请输入用户名和密码', 'error'); return; }
    if (!email) { showMsg(el, '请输入邮箱', 'error'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showMsg(el, '邮箱格式不正确', 'error'); return; }
    if (password !== confirm) { showMsg(el, '两次密码不一致', 'error'); return; }
    if (password.length < 8) { showMsg(el, '密码至少8位', 'error'); return; }

    try {
        var data = await apiCall('/api/register', 'POST', { username: username, password: password, email: email });
        if (data.success) {
            currentUser = { id: data.userId, username: username };
            Storage.setUser(currentUser);
            showMsg(el, '注册成功，正在登录...', 'success');
            setTimeout(function () { updateNavForLoggedIn(); closeAuth(); clearMessages(); }, 800);
        } else {
            showMsg(el, data.message || '注册失败', 'error');
        }
    } catch (e) { showMsg(el, '网络错误，请稍后重试', 'error'); }
}

// ===== 退出 =====
function handleLogout() {
    currentUser = null;
    Storage.clearSession();
    document.getElementById('navAuthLinks').style.display = 'flex';
    document.getElementById('navUserInfo').style.display = 'none';
}

// ===== 排行榜弹窗 =====
async function openLeaderboard() {
    document.getElementById('leaderboardModal').style.display = 'flex';
    var body = document.getElementById('leaderboardBody');
    body.innerHTML = '<p class="loading-text">加载中...</p>';

    try {
        var data = await apiCall('/api/admin/leaderboard?limit=20');
        if (data.success && data.leaderboard.length > 0) {
            body.innerHTML = data.leaderboard.map(function (u, i) {
                var rankClass = '', badge = '#' + (i + 1);
                if (i === 0) { rankClass = 'gold'; badge = '🥇'; }
                else if (i === 1) { rankClass = 'silver'; badge = '🥈'; }
                else if (i === 2) { rankClass = 'bronze'; badge = '🥉'; }
                return '<div class="leaderboard-row"><span class="leaderboard-rank ' + rankClass + '">' + badge + '</span>' +
                    '<span class="leaderboard-name">' + escHtml(u.username) + '</span>' +
                    '<span class="leaderboard-score">' + u.max_score + '</span>' +
                    '<span class="leaderboard-games">' + u.games_played + '局</span></div>';
            }).join('');
        } else {
            body.innerHTML = '<p class="loading-text">暂无排行数据</p>';
        }
    } catch (e) { body.innerHTML = '<p class="loading-text">加载失败</p>'; }
}

// ===== 个人中心弹窗 =====
async function openProfile() {
    if (!currentUser) { showLogin(); return; }
    document.getElementById('profileModal').style.display = 'flex';
    var body = document.getElementById('profileBody');
    body.innerHTML = '<p class="loading-text">加载中...</p>';

    try {
        var data = await apiCall('/api/user/' + currentUser.id);
        if (data.success && data.user) {
            var u = data.user;
            body.innerHTML =
                '<div class="profile-stat"><span class="profile-stat-label">用户名</span><span class="profile-stat-value">' + escHtml(u.username) + '</span></div>' +
                '<div class="profile-stat"><span class="profile-stat-label">注册时间</span><span class="profile-stat-value" style="font-size:14px">' + new Date(u.created_at).toLocaleDateString('zh-CN') + '</span></div>' +
                '<div class="profile-stat"><span class="profile-stat-label">游戏场次</span><span class="profile-stat-value">' + u.games_played + '</span></div>' +
                '<div class="profile-stat"><span class="profile-stat-label">总得分</span><span class="profile-stat-value">' + u.total_score + '</span></div>' +
                '<div class="profile-stat"><span class="profile-stat-label">最高分</span><span class="profile-stat-value">' + u.max_score + '</span></div>';
        } else {
            body.innerHTML = '<p class="loading-text">加载失败</p>';
        }
    } catch (e) { body.innerHTML = '<p class="loading-text">网络错误</p>'; }
    body.innerHTML += '<div style="text-align:center;margin-top:16px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.06)"><a href="/profile" style="color:#4CAF50;font-size:0.82rem;text-decoration:none">查看完整个人中心 →</a></div>';
}

function closeModal(id) { document.getElementById(id).style.display = 'none'; }

document.addEventListener('click', function (e) {
    if (e.target.classList.contains('modal-overlay')) e.target.style.display = 'none';
});

document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
        var overlay = document.getElementById('authOverlay');
        if (!overlay.classList.contains('hidden')) {
            if (document.getElementById('loginForm').style.display !== 'none') handleLogin();
            else handleRegister();
        }
    }
});
