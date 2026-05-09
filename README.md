<p align="center">
  <img src="public/ggb.jpg" alt="GGb Game" width="120" style="border-radius: 50%;" />
</p>

<h1 align="center">GGb Game</h1>

<p align="center">一个全栈小游戏平台 —— 5 款经典游戏 + 游戏大厅 + 管理后台 + 桌面客户端</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-green?logo=node.js" />
  <img src="https://img.shields.io/badge/Express-5-blue?logo=express" />
  <img src="https://img.shields.io/badge/MySQL-8.0-orange?logo=mysql" />
  <img src="https://img.shields.io/badge/Electron-37-purple?logo=electron" />
  <img src="https://img.shields.io/badge/License-ISC-blue" />
</p>

---

## 项目介绍

GGb Game 是一个功能完整的小游戏平台，包含 5 款经典 HTML5 游戏、用户系统、排行榜、个人中心、管理后台和数据看板。支持 Web 端和 Windows 桌面端（Electron 打包）。

**核心亮点：**

- 5 款经典小游戏，支持游戏内角色选择、实时计分
- 用户注册/登录/个人中心，游戏记录自动保存
- 全局排行榜，支持按游戏筛选
- 科幻深色主题管理后台，支持用户管理、数据看板（ECharts）、操作日志
- 支持打包为 Windows 桌面客户端（Electron），含离线模式

---

## 技术栈

| 层 | 技术 | 用途 |
|---|------|------|
| **前端** | 原生 HTML/CSS/JS | 游戏大厅、5 款游戏、个人中心、管理后台 |
| **图表** | ECharts 5.5 | 管理后台数据看板可视化 |
| **后端** | Node.js + Express 5 | API 服务、路由分发、业务逻辑 |
| **数据库** | MySQL 8.0 + mysql2/promise | 用户、游戏记录、排行榜、操作日志持久化 |
| **认证** | JWT (jsonwebtoken) + bcrypt | 令牌认证、密码哈希 |
| **安全** | Helmet + express-rate-limit + express-validator | CSP 安全头、接口限流、参数校验 |
| **桌面端** | Electron 37 + Vite | Windows 桌面客户端打包 |

---

## 项目结构

```
GGb-Game/
├── server.js               # 服务入口
├── db.js                   # 数据持久层（连接池、query/getOne/insert/buildQuery）
├── config/
│   └── error-codes.js      # 统一错误码（AUTH/USER/GAME/SYSTEM）
├── middleware/
│   ├── auth.js             # JWT 认证中间件（authMiddleware/adminMiddleware）
│   ├── validate.js         # express-validator 参数校验
│   └── errorHandler.js     # 全局错误处理
├── routes/                 # 业务逻辑层 — 路由分发
│   ├── auth.js             # 注册/登录/修改密码/获取用户信息
│   ├── game.js             # 游戏列表/游戏记录/排行榜
│   └── admin.js            # 管理后台全部 API
├── services/               # 业务逻辑层 — 业务规则
│   ├── userService.js      # 用户相关业务
│   ├── gameService.js      # 游戏相关业务
│   └── systemService.js    # 系统配置、操作日志业务
├── models/                 # 数据持久层 — Model
│   ├── User.js
│   ├── Game.js
│   ├── GameRecord.js
│   ├── LoginLog.js
│   ├── OperationLog.js
│   └── SystemConfig.js
├── utils/
│   ├── helpers.js          # 工具函数（getClientIp/getQueryInt/buildLoginResponse）
│   └── jwt.js              # JWT 签发/验证
├── public/                 # 表现层 — 前端页面
│   ├── index.html          # 游戏大厅首页
│   ├── lobby.js/css        # 游戏大厅逻辑
│   ├── game.html           # 游戏通用入口
│   ├── fish.html/js/css    # 大鱼吃小鱼
│   ├── snake.html/js/css   # 贪吃蛇
│   ├── tetris.html/js/css  # 俄罗斯方块
│   ├── bubble.html/js/css  # 泡泡龙
│   ├── shooter.html/js/css # 射击游戏
│   ├── leaderboard.html/js # 排行榜
│   ├── profile.html/js/css # 个人中心
│   ├── admin.html/css      # 管理后台
│   ├── utils/
│   │   ├── api.js          # 统一请求封装（apiCall）
│   │   └── storage.js      # localStorage 封装
│   └── covers/             # 游戏封面动态效果
├── desktop-app-new/        # Electron 桌面客户端
│   ├── electron/main.js    # Electron 主进程
│   ├── src/App.vue         # Vue 3 启动壳
│   └── build-output/       # 打包产物
├── test-e2e.js             # E2E 自动化测试（35 项）
├── test-oplogs.js          # 操作日志专项测试（10 项）
├── watch-test.js           # 文件变更自动测试
├── .env                    # 环境变量（不提交到 Git）
└── package.json
```

**三层架构调用链路：**

```
public/ (前端)
  → apiCall() → /api/* (HTTP 请求)
    → routes/ (路由分发 + 参数校验)
      → services/ (业务规则 + 数据聚合)
        → models/ → db.js (SQL 查询)
```

---

## 环境要求

| 依赖 | 版本 |
|------|------|
| Node.js | >= 18.0 |
| MySQL | >= 8.0 |
| npm | >= 9.0 |

---

## 安装与运行

### 1. 克隆项目

```bash
git clone <repo-url>
cd GGb-Game
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

在项目根目录创建 `.env` 文件：

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=ggb
DB_PASSWORD=your_password
DB_NAME=ggb_game

# JWT 密钥
JWT_SECRET=your_jwt_secret_key

# 服务端口
PORT=3000
```

### 4. 初始化数据库

```bash
mysql -u root -p < schema.sql
```

> 首次启动服务时会自动创建表结构和默认数据（管理员账号、种子游戏数据）。

### 5. 启动服务

```bash
# 开发模式
node server.js

# 或使用 npm 脚本
npm start
```

服务启动后访问：
- 游戏大厅：http://localhost:3000
- 管理后台：http://localhost:3000/admin

### 6. 桌面客户端（可选）

```bash
cd desktop-app-new
npm install
npx electron .              # 开发模式
npm run electron:build      # 打包为 Windows 安装包
```

### 7. 运行测试

```bash
npm test                    # E2E 自动化测试（35 项）
npm run test:watch          # 文件变更自动测试
```

---

## 功能列表

### 用户系统

| 功能 | 说明 |
|------|------|
| 注册 | 用户名 + 密码注册，密码 bcrypt 加密存储 |
| 登录 | JWT 令牌认证，有效期 7 天 |
| 修改密码 | 登录后可修改密码 |
| 个人中心 | 查看游戏记录、最高分、注册时间 |
| 封禁/解封 | 管理员可封禁/解封用户账号，被封禁用户无法登录 |

### 游戏中心（5 款游戏）

| 游戏 | 说明 | 角色选择 |
|------|------|---------|
| 🐟 大鱼吃小鱼 | 经典大鱼吃小鱼，吃掉比自己小的鱼成长 | 支持多角色 |
| 🐍 贪吃蛇 | 经典贪吃蛇，吃食物变长避免撞墙 | - |
| 🧱 俄罗斯方块 | 经典方块消除，消除行得分 | - |
| 🫧 泡泡龙 | 射击泡泡消除同色泡泡 | - |
| 🔫 射击游戏 | 射击目标得分 | - |

### 社交功能

| 功能 | 说明 |
|------|------|
| 排行榜 | 全局排行榜，支持按游戏类型筛选 |
| 对局记录 | 每局游戏自动记录得分、等级、时间 |

### 管理后台

| 功能 | 说明 |
|------|------|
| 数据看板 | ECharts 可视化：今日新增用户、对局数、活跃用户趋势、游戏分布 |
| 系统统计 | 总用户数、总对局数、今日数据、近 7 天趋势 |
| 用户管理 | 用户列表、搜索、分页、封禁/解封、重置密码 |
| 游戏记录 | 全部对局记录，支持按用户/游戏筛选 |
| 排行榜管理 | 查看各游戏排行榜 |
| 操作日志 | 记录注册/登录/游戏/改密等操作，支持按类型和用户筛选 |
| 系统配置 | 动态调整系统参数 |

---

## API 接口

### 认证接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/register` | 用户注册 | - |
| POST | `/api/login` | 用户登录 | - |
| PUT | `/api/change-password` | 修改密码 | JWT |
| GET | `/api/user/info` | 获取当前用户信息 | JWT |

### 游戏接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/games` | 获取游戏列表 | - |
| POST | `/api/game-record` | 保存游戏记录 | JWT |
| GET | `/api/user/game-records` | 获取用户游戏记录 | JWT |
| GET | `/api/leaderboard` | 排行榜（支持 `?gameId=` 筛选） | - |

### 管理后台接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/admin/login` | 管理员登录 | - |
| GET | `/api/admin/stats` | 系统统计 | Admin JWT |
| GET | `/api/admin/dashboard` | 数据看板 | Admin JWT |
| GET | `/api/admin/users` | 用户列表（分页） | Admin JWT |
| GET | `/api/admin/users/search` | 用户搜索 | Admin JWT |
| PUT | `/api/admin/user/:id/ban` | 封禁用户 | Admin JWT |
| PUT | `/api/admin/user/:id/unban` | 解封用户 | Admin JWT |
| PUT | `/api/admin/user/:id/reset-password` | 重置密码 | Admin JWT |
| GET | `/api/admin/leaderboard` | 排行榜 | Admin JWT |
| GET | `/api/admin/game-records` | 游戏记录列表 | Admin JWT |
| GET | `/api/admin/login-logs` | 登录日志 | Admin JWT |
| GET | `/api/admin/operation-logs` | 操作日志 | Admin JWT |
| GET | `/api/admin/config` | 获取系统配置 | Admin JWT |
| PUT | `/api/admin/config` | 更新系统配置 | Admin JWT |

> 详细接口文档（请求/响应示例、参数说明）请查看 [Apifox](https://apifox.com) 项目文档。

---

## 安全措施

| 措施 | 实现方式 | 说明 |
|------|---------|------|
| **认证** | JWT (jsonwebtoken) | Bearer Token，有效期 7 天，过期自动跳转登录 |
| **密码安全** | bcrypt | 密码哈希存储，不可逆 |
| **接口限流** | express-rate-limit | 全局限流 + 登录接口单独限流，防止暴力破解 |
| **请求头安全** | Helmet | CSP 内容安全策略、XSS 过滤、MIME 类型嗅探防护 |
| **参数校验** | express-validator | 所有用户输入严格校验，防注入 |
| **权限控制** | 中间件分级 | authMiddleware（用户认证）→ adminMiddleware（管理员权限） |
| **错误码体系** | config/error-codes.js | 统一错误码，不暴露内部错误堆栈 |
| **CORS** | cors | 跨域资源共享控制 |
| **数据隔离** | requireOwnership | 用户只能操作自己的数据，管理员可操作所有数据 |

---

## 默认账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | admin123 |

> 首次部署后请立即修改默认密码。

---

## 许可证

[ISC](LICENSE)
