var ProfilePage = (function () {
    var currentUser;

    function init() {
        bindSidebar();
        loadProfile();
        loadRecords();
    }

    function bindSidebar() {
        document.querySelectorAll('.nav-item').forEach(function (item) {
            item.addEventListener('click', function (e) {
                e.preventDefault();
                var tab = this.dataset.tab;

                document.querySelectorAll('.nav-item').forEach(function (n) { n.classList.remove('active'); });
                this.classList.add('active');

                document.querySelectorAll('.tab-content').forEach(function (t) { t.classList.remove('active'); });
                document.getElementById('tab' + tab.charAt(0).toUpperCase() + tab.slice(1)).classList.add('active');
            });
        });

        document.getElementById('btnChangePassword').addEventListener('click', changePassword);
    }

    function loadProfile() {
        apiCall('/api/profile', 'GET').then(function (data) {
            if (!data.success) return;

            var u = data.user;
            document.getElementById('sidebarUsername').textContent = u.username;
            document.getElementById('sidebarAvatar').textContent = u.username.charAt(0).toUpperCase();

            document.getElementById('infoGrid').innerHTML =
                '<div class="info-card"><div class="info-card-label">用户名</div><div class="info-card-value">' + esc(u.username) + '</div></div>' +
                '<div class="info-card"><div class="info-card-label">邮箱</div><div class="info-card-value">' + maskEmail(u.email) + '</div></div>' +
                '<div class="info-card"><div class="info-card-label">注册时间</div><div class="info-card-value" style="font-size:0.9rem">' + formatDate(u.created_at) + '</div></div>' +
                '<div class="info-card"><div class="info-card-label">游戏场次</div><div class="info-card-value">' + u.games_played + '</div></div>' +
                '<div class="info-card"><div class="info-card-label">总得分</div><div class="info-card-value">' + u.total_score + '</div></div>' +
                '<div class="info-card"><div class="info-card-label">最高分</div><div class="info-card-value" style="color:#FFD700">' + u.max_score + '</div></div>';
        }).catch(function () {});
    }

    function loadRecords() {
        apiCall('/api/profile/records?limit=50', 'GET').then(function (data) {
            var list = document.getElementById('recordsList');
            if (!data.success || !data.records || data.records.length === 0) {
                list.innerHTML = '<p class="empty-text">暂无游戏记录</p>';
                return;
            }

            list.innerHTML = data.records.map(function (r) {
                return '<div class="record-row">' +
                    '<span class="record-date">' + formatDate(r.played_at) + '</span>' +
                    '<span class="record-level">Lv.' + r.level + '</span>' +
                    '<span class="record-score">' + r.score + ' 分</span>' +
                    '</div>';
            }).join('');
        }).catch(function () {});
    }

    function changePassword() {
        var oldPwd = document.getElementById('oldPassword').value;
        var newPwd = document.getElementById('newPassword').value;
        var confirmPwd = document.getElementById('confirmPassword').value;
        var msg = document.getElementById('passwordMessage');
        msg.className = 'form-message';

        if (!oldPwd || !newPwd || !confirmPwd) { msg.textContent = '请填写所有字段'; msg.className += ' error'; return; }
        if (newPwd !== confirmPwd) { msg.textContent = '两次新密码不一致'; msg.className += ' error'; return; }

        apiCall('/api/profile/password', 'PUT', { oldPassword: oldPwd, newPassword: newPwd }).then(function (data) {
            if (data.success) {
                msg.textContent = '密码更新成功';
                msg.className += ' success';
                document.getElementById('oldPassword').value = '';
                document.getElementById('newPassword').value = '';
                document.getElementById('confirmPassword').value = '';
            } else {
                msg.textContent = data.message || '修改失败';
                msg.className += ' error';
            }
        }).catch(function () {
            msg.textContent = '网络错误';
            msg.className += ' error';
        });
    }

    function checkAuth() {
        var token = Storage.getToken();
        currentUser = Storage.getUser();
        if (!token || !currentUser || !currentUser.id) { window.location.href = '/'; return false; }
        return true;
    }

    function esc(str) { return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

    function maskEmail(email) {
        if (!email) return '未设置';
        var at = email.indexOf('@');
        if (at <= 0) return email;
        var local = email.substring(0, at);
        var domain = email.substring(at);
        if (local.length <= 3) return email;
        var stars = '';
        var hideCount = Math.min(6, local.length - 3);
        for (var i = 0; i < hideCount; i++) stars += '*';
        return local.substring(0, 3) + stars + local.substring(local.length - 2) + domain;
    }

    function formatDate(dateString) {
        var d = new Date(dateString);
        return d.toLocaleString('zh-CN');
    }

    return {
        boot: function () { if (checkAuth()) init(); }
    };
})();

document.addEventListener('DOMContentLoaded', function () { ProfilePage.boot(); });
