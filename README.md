把这个直接复制进去：
GGb Game 🎮
一个全栈游戏聚合平台，支持网页端与 Windows 桌面客户端
[
�
](https://nodejs.org)
[
�
](https://expressjs.com)
[
�
](https://mysql.com)
[
�
](https://electronjs.org)
线上地址： https://ggb-game.online
项目介绍
GGb Game 是一个功能完整的小游戏聚合平台，包含 5 款经典 HTML5 游戏、用户系统、排行榜、个人中心、管理后台和数据看板。支持 Web 端访问和 Windows 桌面客户端。
技术栈
层级
技术
用途
前端
原生 HTML/CSS/JS
游戏大厅、游戏页面、个人中心
图表
ECharts 5
管理后台数据可视化
后端
Node.js + Express 5
API 服务、业务逻辑
数据库
MySQL 8.0
数据持久化
认证
JWT + bcrypt
用户鉴权、密码加密
安全
Helmet + express-rate-limit
安全防护、接口限流
桌面端
Electron
Windows 客户端打包
架构设计
采用三层架构，严格分层：
表现层 (public/)
    ↕ HTTP 请求
业务逻辑层 (routes/ + services/)
    ↕ 数据库操作  
数据持久层 (models/ + db.js)
routes/ — 只做路由分发，零 SQL
services/ — 只写业务逻辑，不直接操作数据库
models/ — 只做数据库 CRUD
功能列表
用户系统
邮箱验证注册
JWT 登录鉴权（7天有效期）
密码 bcrypt 哈希存储
登录失败锁定机制
个人中心（游戏记录、最高分）
游戏中心（5款游戏）
游戏
描述
🐟 大鱼吃小鱼
控制大鱼吃掉比自己小的鱼
🐍 贪吃蛇
经典贪吃蛇，吃食物变长
🧱 俄罗斯方块
经典方块消除
🫧 泡泡龙
射击泡泡消除同色泡泡
🔫 太空射击
射击敌人得分
排行榜
每个游戏独立排行榜
全平台总排行榜
管理后台
数据看板（ECharts 可视化）
用户管理（封禁/解封）
操作日志
系统统计
安全措施
JWT Token 鉴权
密码 bcrypt 哈希存储
接口限流（express-rate-limit）
Helmet 防御常见 Web 攻击
参数校验（express-validator）
管理员/普通用户权限分离
HTTPS + Nginx 反向代理
本地运行
环境要求
Node.js >= 18.0
MySQL >= 8.0
安装步骤
# 克隆项目
git clone https://github.com/gyleimu/ggb-game-v3.git
cd ggb-game-v3

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 填入数据库配置

# 启动服务
node server.js
访问 http://localhost:3000
桌面端
cd desktop-app-new
npm install
npx electron .
部署
服务器使用 PM2 管理进程：
pm2 start server.js --name ggb-game
pm2 startup
pm2 save
Nginx 反向代理 + HTTPS 证书已配置。
测试
# E2E 自动化测试（35项）
node test-e2e.js
项目结构
GGb-Game/
├── config/          # 错误码配置
├── middleware/      # JWT鉴权、参数校验、错误处理
├── models/          # 数据持久层（5张表）
├── routes/          # 路由分发层
├── services/        # 业务逻辑层
├── utils/           # 工具函数
├── public/          # 前端静态文件
├── desktop-app-new/ # Electron 桌面端
├── docs/            # 项目文档
└── server.js        # 服务入口
License
ISC
