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

## 📱 移动端 App (React Native & Expo)

本项目在 `mobile/` 目录下配备了一个原生的移动端应用程序，基于 **React Native** 和 **Expo** 构建。它能与 Next.js Web 端后端进行实时数据联调与状态同步，并支持离线兜底。

### 📱 移动端核心功能
- **实时数据同步**：与后端 Web 服务 API 保持联调，实时同步家庭菜谱、今日点餐菜单和家庭厨房的成员变动。
- **离线模式兜底**：在与 API 服务器断开连接时，自动激活离线流程。用户依然可以在本地创建或加入“离线版”家庭厨房（数据基于 `AsyncStorage` 缓存持久化），完整测试和演示家庭列表与成员视图。
- **历史记录与点单详情**：支持查看家庭历史订单，自动合并生成今日买菜 TodoList 清单，并可在本地持久化记录勾选买菜状态。
- **静态菜谱展示**：去除了复杂的待办和分量调节器，让进入的菜品菜谱实现简洁、直观的静态展示。
- **手势导航与防误触退出**：
  - 支持 iOS & Android 全局**屏幕左侧向右滑动返回**手势；
  - 拦截 Android 物理返回键；
  - 退出应用前会弹出自定义样式的 `AlertModal` 二次确认弹窗，防止用户误触退出。
- **Makefile 自动化编译**：提供了一键式编译的自动化脚本，方便在本地直接构建生成 Android APK 安装包或 iOS 应用项目。

### 🚀 运行移动端 App
1. **进入 mobile 目录并安装依赖**：
   ```bash
   cd mobile
   npm install
   ```
2. **配置后端 API 接口地址**：
   打开 `mobile/lib/api.ts` 文件，将 `API_BASE_URL` 修改为您电脑的局域网 IP（用于本地联调）或公网服务器域名：
   ```typescript
   let API_BASE_URL = 'http://192.168.x.x:3000';
   ```
3. **启动 Expo 开发服务器**：
   ```bash
   npm start
   ```
   随后按终端提示输入 `a` 调起安卓模拟器，输入 `i` 调起 iOS 模拟器；或在手机上下载 Expo Go 客户端，直接扫描控制台上的二维码进行真机联调！

### 🛠️ 本地原生打包编译
您也可以直接使用提供的 [Makefile](mobile/Makefile) 工具在本地直接编译出 Release 安装包：
```bash
# 编译生成安卓 Android Release APK 包
make android

# 编译生成苹果 iOS Release 项目 (需 macOS 环境及安装 Xcode)
make ios

# 一键编译双端包
make all

# 清除生成的编译临时文件夹
make clean
```

---

## 🔒 隐私与 Git 安全防范
根据最新的 [`.gitignore`](file:///Users/hzhou/workspace/cook-bro/.gitignore) 规则，所有的 SQLite 数据库本地文件（`*.db` 及其缓存日志）和 `.env` 配置文件均已默认排除在 Git 追踪之外，确保本地开发测试的隐私数据不会被推送到代码库。
