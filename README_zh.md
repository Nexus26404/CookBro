# 🍳 CookBro - 智能家庭点菜计划与共享菜谱

简体中文 | [English](README.md)

**CookBro** 是一款专为家庭和合租公寓设计的协同点餐与菜谱管理系统。它采用移动端优先的设计，界面设计温暖舒适，能有效解决家庭每日“今天吃什么”的难题。

---

## ✨ 核心功能

### 📅 协同点餐与计划
- **餐次细分**：支持按 **早餐、午餐、晚餐** 独立进行菜品选择。
- **实时同步**：采用 SWR 技术，家庭内所有成员的选择均可实时监听与同步。
- **确认点菜与加锁**：成员可以在首页将菜品加入购物车，由代表确认后提交今日菜单。确认后点餐状态将加锁，仅能通过“重新选择并加回购物车”清空原有菜单后再进行修改。

### 📖 共享菜谱库 (CRUD)
- **家庭共享**：成员可以共同创建、编辑、删除家庭菜谱。
- **信息详尽**：每个菜谱支持记录原料用量、厨具需求、步骤说明、难易程度及准备/烹饪时间。
- **内置 20 道经典菜谱**：系统初始填充了 **20 道传统中式菜谱**（涵盖川、粤、湘、江浙、东北、西北各色菜系），导入数据库后即可直接使用。
- 系统预置的初始菜谱也支持用户根据家庭口味偏好直接进行编辑或彻底删除。

### 📝 智能买菜 TodoList (采购清单)
- **同名合并**：自动提取今天选定菜单下的所有食材，并对相同食材进行智能合并（例如：五花肉 300g + 500g）。
- **TodoList 交互**：食材以清单待办形式渲染，买菜时可以随时勾选标记。
- **本地持久化**：进度自动记录在 `localStorage` 中，即使买菜中途关闭网页、刷新浏览器，已购状态也不会丢失。

### 👨‍👩‍👧‍👦 家庭成员与团队管理
- **邀请码加入**：可以通过 6 位邀请码快速创建家庭，或邀请家人加入。
- **透明的成员列表**：主卡片默认展示当前家庭内的全部成员头像、名称与邮箱。
- **创建者特权（带二次确认）**：
  - 家庭的创建者拥有“移出成员”和“解散家庭”的特殊管理权限。
  - 为避免手抖或误触，两项操作均设计了**连续两次弹窗提示确认**的严格安全保护。

### 🔐 灵活的双模用户认证 (Firebase / 纯本地)
支持通过环境变量 `NEXT_PUBLIC_AUTH_PROVIDER` 动态切换验证底层：
1. **Firebase Authentication 模式（默认）**：支持 Google 账号登录 (SSO) 以及邮箱密码注册，认证成功后自动将用户结构同步至本地 SQLite。
2. **本地数据库模式 (`local`)**：专为无公网网络或内网部署环境设计。完全断开 Firebase 的网络握手，基于本地 SQLite 数据库进行密码加密存储（SHA-256）和登录注册校验。启用时，登录页会自动隐藏 Google 登录选项。

---

## 🛠️ 技术栈
- **框架**：[Next.js 16 (App Router)](https://nextjs.org/) & [React 19](https://react.dev/)
- **样式**：Vanilla CSS Modules (温暖美食主题、暗黑模式自适应)
- **数据库与 ORM**：[Prisma 7](https://www.prisma.io/) & [SQLite](https://sqlite.org/) (基于 `better-sqlite3` 驱动适配器)
- **状态同步**：[SWR](https://swr.vercel.app/)
- **构建引擎**：[Turbopack](https://nextjs.org/docs/app/api-reference/turbopack)

---

## 🚀 快速启动

### 1. 克隆并安装依赖
```bash
git clone https://github.com/<your-username>/cook-bro.git
cd cook-bro
npm install
```

### 2. 配置环境变量
在项目根目录下创建 `.env.local` 文件（可参考 `.env.local.example`）：
```ini
# 选择 'local' 启动离线数据库验证，或 'firebase' 启动云端认证
NEXT_PUBLIC_AUTH_PROVIDER=local

# Firebase 密钥配置（仅在提供者为 'firebase' 时需要）
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

### 3. 初始化并填充数据库
同步 SQLite 表结构，并生成 Prisma 客户端，最后写入 20 道中式菜品数据：
```bash
# 推送表结构并同步数据库
npx prisma db push --accept-data-loss

# 生成 Prisma 客户端类型
npx prisma generate

# 执行种子填充数据
node prisma/seed.js
```

### 4. 启动开发服务器
启动开发环境。若需要用局域网内的其它设备（如手机、平板）访问开发服务器进行联调，请监听 `0.0.0.0`：
```bash
npm run dev -- -H 0.0.0.0
```
在移动设备浏览器中输入 `http://<你的电脑局域网IP>:3000` 即可开始测试！

*(注：如果需要在局域网设备上测试 Firebase Auth 的 Google 登录，请务必在 Firebase 控制台 Settings 中的 **Authorized Domains** 列表中添加您的开发机局域网 IP。)*

---

## 🔒 隐私与 Git 安全防范
根据最新的 [`.gitignore`](file:///Users/hzhou/workspace/cook-bro/.gitignore) 规则，所有的 SQLite 数据库本地文件（`*.db` 及其缓存日志）和 `.env` 配置文件均已默认排除在 Git 追踪之外，确保本地开发测试的隐私数据不会被推送到代码库。
