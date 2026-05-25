# 🧠 DeepSeek Chatbox Lite — AI Terminal

> 深空科技 · 思考可视化 · 流式对话

一个基于 **DeepSeek V4 API** 的现代化 AI 聊天应用，支持流式对话、思考链（CoT）可视化、Markdown/数学公式/代码高亮渲染、语音合成（TTS）、提示词库等丰富功能。

---

## ✨ 功能特性

- **多模型支持** — `deepseek-v4-flash`（快） / `deepseek-v4-pro`（强），可切换
- **思考可视化** — 实时展示 AI 的 Chain-of-Thought 推理过程
- **流式对话** — SSE 流式传输，逐字输出，体验流畅
- **多会话管理** — 支持创建/切换/删除会话，数据持久化至 IndexedDB
- **Markdown 渲染** — 支持 GFM、数学公式（KaTeX）、代码语法高亮
- **语音合成** — 基于 Azure Neural TTS，支持多种中文语音
- **提示词库** — 内置 72 个专业模板，覆盖 12 个分类
- **用量追踪** — 实时统计 Token 消耗和费用估算
- **赛博朋克 UI** — 深空科技风格，支持深色/浅色主题切换
- **键盘快捷键** — 全面支持快捷键操作
- **响应式布局** — 适配桌面和移动端

---

## 🛠️ 技术栈

| 类别 | 技术 |
|---|---|
| 框架 | React 18 + TypeScript |
| 构建 | Vite 6 |
| 样式 | Tailwind CSS 3 |
| 状态管理 | Zustand 5 |
| Markdown | react-markdown + remark-gfm + remark-math + rehype-katex |
| 代码高亮 | react-syntax-highlighter |
| 持久化 | IndexedDB (idb-keyval) |
| 图标 | Lucide React |
| 后端 | Vercel Serverless Functions / Node.js 本地代理 |
| AI 模型 | DeepSeek V4 API |
| TTS | Azure Cognitive Services |

---

## 📦 快速开始

### 前提条件

- **Node.js** ≥ 18（推荐 22 LTS）
- **npm** ≥ 9
- **DeepSeek API Key**（从 [DeepSeek 开放平台](https://platform.deepseek.com/api_keys) 获取）

### 一键启动

```bash
# 克隆项目
git clone <your-repo-url>
cd deepseek-chat

# 一键启动（自动安装依赖、配置环境变量、启动服务）
bash start.sh
```

### 手动启动

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.local.example .env.local
# 编辑 .env.local，填入你的 DEEPSEEK_API_KEY

# 3. 启动 API 代理 + 前端开发服务器
npm run dev:api &   # 端口 3000
npm run dev         # 端口 5173
```

浏览器访问 **[http://localhost:5173](http://localhost:5173)** 即可使用。

---

## ⚙️ 环境变量

| 变量 | 必填 | 说明 |
|---|---|---|
| `DEEPSEEK_API_KEY` | ✅ | DeepSeek API 密钥 |
| `AZURE_TTS_KEY` | ❌ | Azure TTS 密钥（可选，启用语音合成） |
| `AZURE_TTS_REGION` | ❌ | Azure TTS 区域，默认 `eastasia` |
| `API_PORT` | ❌ | API 代理端口，默认 `3000` |

---

## 🚀 部署

### Vercel（推荐）

项目已配置 `vercel.json`，可直接部署：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

部署前需在 Vercel 项目设置中配置环境变量 `DEEPSEEK_API_KEY`。

### Docker

```bash
docker build -t deepseek-chat .
docker run -p 5173:5173 -e DEEPSEEK_API_KEY=sk-xxx deepseek-chat
```

---

## ⌨️ 快捷键

| 快捷键 | 功能 |
|---|---|
| `Ctrl + N` | 新建对话 |
| `Ctrl + B` | 侧栏展开/收起 |
| `Ctrl + E` | 聚焦输入框 |
| `Ctrl + K` | 清空当前对话 |
| `Ctrl + P` | 打开提示词库 |
| `Ctrl + /` | 快捷键帮助 |

---

## 📁 项目结构

```
deepseek-chat/
├── api/                    # Vercel Serverless Functions
│   ├── chat.js             #   POST /api/chat — 聊天代理
│   └── speech.js           #   POST /api/speech — TTS 代理
├── public/                 # 静态资源
├── src/
│   ├── components/         # React 组件
│   │   ├── ChatLayout.tsx      # 主聊天布局
│   │   ├── Composer.tsx        # 消息编辑器
│   │   ├── MarkdownRenderer.tsx# Markdown 渲染
│   │   ├── MessageItem.tsx     # 单条消息
│   │   ├── MessageList.tsx     # 消息列表
│   │   ├── PromptLibrary.tsx   # 提示词库
│   │   ├── SettingsPanel.tsx   # 设置面板
│   │   ├── Sidebar.tsx         # 侧边栏
│   │   ├── Toast.tsx           # Toast 通知
│   │   ├── ErrorBoundary.tsx   # 错误边界
│   │   └── ConfirmDialog.tsx   # 确认对话框
│   ├── lib/                # 工具库
│   │   ├── prompts.ts          # 提示词定义（72 个模板）
│   │   ├── stream.ts           # SSE 流处理
│   │   ├── session.ts          # 会话管理
│   │   ├── speech.ts           # TTS 客户端
│   │   ├── sound.ts            # 音效系统
│   │   ├── music.ts            # 背景音乐
│   │   ├── storage.ts          # IndexedDB 封装
│   │   └── utils.ts            # 通用工具
│   ├── stores/             # Zustand 状态管理
│   │   ├── chatStore.ts        # 聊天状态
│   │   ├── settingsStore.ts    # 设置状态
│   │   └── usageStore.ts       # 用量追踪
│   └── types/              # TypeScript 类型定义
├── server.cjs              # 本地 API 代理服务器
├── start.sh                # 一键启动脚本
├── vercel.json             # Vercel 部署配置
└── package.json
```

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可

MIT License
