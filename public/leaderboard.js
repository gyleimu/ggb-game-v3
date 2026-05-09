var currentTab = 'global';
var currentUser = null;

var GAME_META = {
    '6':  { name: '大球吃小球', color: '#FF6B6B' },
    '7':  { name: '太空射击',   color: '#4ECDC4' },
    '8':  { name: '贪吃蛇大作战', color: '#45B7D1' },
    '9':  { name: '俄罗斯方块',  color: '#96CEB4' },
    '10': { name: '泡泡龙',     color: '#FFEAA7' }
};

var AVATAR_COLORS = [
    'linear-gradient(135deg, #667eea, #764ba2)',
    'linear-gradient(135deg, #f093fb, #f5576c)',
    'linear-gradient(135deg, #4facfe, #00f2fe)',
    'linear-gradient(135deg, #43e97b, #38f9d7)',
    'linear-gradient(135deg, #fa709a, #fee140)',
    'linear-gradient(135deg, #a18cd1, #fbc2eb)',
    'linear-gradient(135deg, #fccb90, #d57eeb)',
    'linear-gradient(135deg, #e0c3fc, #8ec5fc)'
];

document.addEventListener('DOMContentLoaded', function () {
    currentUser = Storage.getUser();
    showSkeleton();
    loadLeaderboard('global');
    bindTabs();
});

function bindTabs() {
    var tabs = document.querySelectorAll('.lb-tab');
    for (var i = 0; i < tabs.length; i++) {
        tabs[i].addEventListener('click', function () {
            var game = this.getAttribute('data-game');
            if (game === currentTab) return;
            setActiveTab(game);
            showSkeleton();
            loadLeaderboard(game);
        });
    }
}

function setActiveTab(game) {
    currentTab = game;
    var tabs = document.querySelectorAll('.lb-tab');
    for (var i = 0; i < tabs.length; i++) {
        tabs[i].classList.toggle('active', tabs[i].getAttribute('data-game') === game);
    }
}

function showSkeleton() {
    var body = document.getElementById('lbBody');
    var html = '';
    for (var i = 0; i < 5; i++) {
        var delay = (i * 0.1).toFixed(1);
        html += '<div class="lb-skeleton-row" style="animation-delay:' + delay + 's">' +
            '<div class="skel skel-rank"></div>' +
            '<div class="skel-user">' +
                '<div class="skel-circle skel-avatar"></div>' +
                '<div class="skel-text-group">' +
                    '<div class="skel skel-name"></div>' +
                    '<div class="skel skel-sub"></div>' +
                '</div>' +
            '</div>' +
            '<div class="skel skel-score"></div>' +
            '<div class="skel skel-time"></div>' +
        '</div>';
    }
    body.innerHTML = html;
    document.getElementById('lbStats').innerHTML = '';
}

async function loadLeaderboard(game) {
    try {
        var url = game === 'global' ? '/api/leaderboard?limit=10' : '/api/leaderboard/' + game + '?limit=10';
        var data = await apiCall(url);
        if (data.success && data.leaderboard && data.leaderboard.length > 0) {
            renderStats(data.leaderboard, game === 'global');
            renderLeaderboard(data.leaderboard, game === 'global');
        } else {
            document.getElementById('lbStats').innerHTML = '';
            document.getElementById('lbBody').innerHTML =
                '<div class="lb-empty">' +
                    '<div class="lb-empty-icon">📭</div>' +
                    '<div>暂无排行数据</div>' +
                    '<div style="font-size:0.8rem;color:var(--text-muted);margin-top:8px">去玩一局游戏吧！</div>' +
                '</div>';
        }
    } catch (e) {
        document.getElementById('lbStats').innerHTML = '';
        document.getElementById('lbBody').innerHTML =
            '<div class="lb-empty">' +
                '<div class="lb-empty-icon">⚠️</div>' +
                '<div>加载失败，请稍后重试</div>' +
            '</div>';
    }
}

function renderStats(list, isGlobal) {
    var stats = document.getElementById('lbStats');
    var totalPlayers = list.length;
    var topScore = isGlobal ? (list[0].total_score || 0) : (list[0].best_score || 0);
    var totalGames = 0;
    for (var i = 0; i < list.length; i++) totalGames += Number(list[i].play_count || 0);

    stats.innerHTML =
        '<div class="lb-stat-card">' +
            '<div class="lb-stat-icon">👥</div>' +
            '<div class="lb-stat-value">' + totalPlayers + '</div>' +
            '<div class="lb-stat-label">上榜玩家</div>' +
        '</div>' +
        '<div class="lb-stat-card">' +
            '<div class="lb-stat-icon">⭐</div>' +
            '<div class="lb-stat-value">' + formatNum(topScore) + '</div>' +
            '<div class="lb-stat-label">最高' + (isGlobal ? '总' : '') + '分</div>' +
        '</div>' +
        '<div class="lb-stat-card">' +
            '<div class="lb-stat-icon">🎯</div>' +
            '<div class="lb-stat-value">' + totalGames + '</div>' +
            '<div class="lb-stat-label">总局数</div>' +
        '</div>';
}

function renderLeaderboard(list, isGlobal) {
    var body = document.getElementById('lbBody');
    var html = '';
    for (var i = 0; i < list.length; i++) {
        var r = list[i];
        var rank = i + 1;
        var rankClass = 'rank-' + rank;
        var isMe = currentUser && r.user_id === currentUser.id;
        var rowClass = 'lb-row' + (rank <= 3 ? ' ' + rankClass : '') + (isMe ? ' lb-current-user' : '');

        var rankHtml = '';
        if (rank === 1) rankHtml = '<span class="lb-rank-medal">🥇</span>';
        else if (rank === 2) rankHtml = '<span class="lb-rank-medal">🥈</span>';
        else if (rank === 3) rankHtml = '<span class="lb-rank-medal">🥉</span>';
        else rankHtml = '<span class="lb-rank-num">#' + rank + '</span>';

        var avatarClass = 'lb-avatar';
        if (rank === 1) avatarClass += ' rank-1-avatar';
        else if (rank === 2) avatarClass += ' rank-2-avatar';
        else if (rank === 3) avatarClass += ' rank-3-avatar';
        else if (isMe) avatarClass += ' rank-me';
        else avatarClass += ' rank-normal';

        var initial = r.username ? r.username.charAt(0).toUpperCase() : '?';
        var avatarBg = '';
        if (rank > 3 && !isMe) {
            avatarBg = ' style="background:' + AVATAR_COLORS[i % AVATAR_COLORS.length] + '"';
        }

        var scoreVal = isGlobal ? r.total_score : r.best_score;
        var scoreLabel = isGlobal ? '总积分' : '最高分';

        var timeStr = formatTime(r.last_played_at);

        html += '<div class="' + rowClass + '">' +
            '<span class="lb-rank">' + rankHtml + '</span>' +
            '<span class="lb-user-info">' +
                '<span class="' + avatarClass + '"' + avatarBg + '>' + initial + '</span>' +
                '<span class="lb-user-meta">' +
                    '<span class="lb-username">' + escHtml(r.username) + (isMe ? ' (我)' : '') + '</span>' +
                    '<span class="lb-play-info">' + r.play_count + ' 局</span>' +
                '</span>' +
            '</span>' +
            '<span class="lb-score-col">' +
                '<span class="lb-score">' + formatNum(scoreVal) + '</span>' +
                '<span class="lb-score-label">' + scoreLabel + '</span>' +
            '</span>' +
            '<span class="lb-time-col">' +
                '<span class="lb-time">' + timeStr + '</span>' +
            '</span>' +
        '</div>';
    }
    body.innerHTML = html;
}

function formatTime(dateStr) {
    if (!dateStr) return '-';
    var d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    return (d.getMonth() + 1) + '月' + d.getDate() + '日 ' +
        String(d.getHours()).padStart(2, '0') + ':' +
        String(d.getMinutes()).padStart(2, '0');
}

function escHtml(s) {
    if (!s) return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatNum(n) {
    if (n === null || n === undefined) return '0';
    return Number(n).toLocaleString();
}
