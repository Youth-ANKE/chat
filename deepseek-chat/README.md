# 🧠 DeepSeek Chatbox — AI Terminal

> 深空科技 · 思考可视化 · 流式对话 · 多模型对比 · PWA 离线

基于 **DeepSeek V4 API** 的全功能 AI 聊天终端，支持流式对话、思考链（CoT）可视化、多 API 供应商管理、A/B 模型对比、Mermaid 图表、语音输入、多语言、PWA 离线安装等丰富功能。

---

## ✨ 功能特性

### 🤖 AI 对话核心
- **流式对话** — SSE 流式传输，逐字输出，支持思考链（CoT）可视化
- **多供应商管理** — 支持多个 API 供应商（DeepSeek、OpenAI 兼容等），可动态切换
- **自定义模型** — 自定义添加/管理模型，支持 temperature、max_tokens 等参数调节
- **A/B 模型对比** — 同时向两个模型发送相同消息，直观对比回复质量
- **工具调用卡片** — 可视化展示 AI 工具调用过程与结果

### 📝 对话管理
- **多会话管理** — 创建/切换/删除/分支/重命名会话，数据持久化至 IndexedDB
- **对话模板** — 内置专业提示词模板，覆盖编程、写作、翻译等场景
- **消息引用回复** — 支持引用历史消息进行精准回复
- **时间线视图** — 以时间线模式查看对话分支历史
- **对话导出** — 支持 PNG 截图导出和 PDF 文档导出
- **对话分享** — 生成可分享的对话链接
- **对话导入** — 从 JSON 文件批量导入对话记录

### 🎨 内容渲染
- **Markdown 渲染** — 支持 GFM 表格、数学公式（KaTeX）、代码语法高亮（200+ 语言）
- **Mermaid 图表** — 实时渲染流程图、时序图、甘特图等
- **代码预览** — 全屏 Artifact 代码预览面板

### 🎤 输入与交互
- **语音输入** — 浏览器端语音识别，解放双手
- **键盘快捷键** — 全面支持快捷键操作（Ctrl+N/B/E/K/P 等）
- **提示词库** — 内置 72 个专业模板，12 个分类
- **全局搜索** — 跨会话全文搜索

### 🌐 多语言 & 离线
- **多语言支持** — 中文 / English 实时切换 (i18next)
- **PWA 离线安装** — 支持 Service Worker + 离线缓存 + 桌面安装
- **离线横幅提示** — 网络断开时自动提示

### ⚙️ 增强功能
- **知识库** — 本地知识库管理，增强对话上下文
- **用量追踪** — 实时统计 Token 消耗和费用估算
- **标签系统** — 为会话添加标签分类
- **消息评分** — 对 AI 回复进行满意度评分
- **通知系统** — 对话完成/错误 Toast 通知
- **音效系统** — 打字音效、通知音效
- **书签收藏** — 收藏重要对话
- **右侧滚动导航条** — 快速回到顶部/底部，拖动跳转
- **赛博朋克 UI** — 深空科技风格，支持深色/浅色主题切换
- **响应式布局** — 适配桌面和移动端

---

## 🛠️ 技术栈

| 类别 | 技术 |
|---|---|
| 框架 | React 18 + TypeScript 5.6 |
| 构建 | Vite 6 |
| 样式 | Tailwind CSS 3 + 自定义赛博朋克主题 |
| 状态管理 | Zustand 5 |
| Markdown | react-markdown + remark-gfm + remark-math + rehype-katex |
| 代码高亮 | react-syntax-highlighter (200+ 语言) |
| 图表 | Mermaid |
| 持久化 | IndexedDB (idb-keyval) |
| 国际化 | i18next + react-i18next |
| PWA | vite-plugin-pwa + Workbox |
| 导出 | html2canvas |
| 图标 | Lucide React (1000+ 图标) |
| 后端 | Vercel Serverless Functions / Node.js 本地代理 |
| AI 模型 | DeepSeek V4 API + 多供应商适配 |
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
| `VITE_PORT` | ❌ | Vite 开发服务器端口，默认 `5173` |

---

## 🚀 部署

### Vercel（推荐）

项目已配置 `vercel.json`，可直接部署：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

部署前需在 Vercel 项目设置中配置环境变量 `DEEPSEEK_API_KEY`。

### Docker

```bash
# 构建镜像
docker build -t deepseek-chat .

# 运行容器
docker run -p 5173:5173 -e DEEPSEEK_API_KEY=sk-xxx deepseek-chat
```

### CNB (Cloud Native Build)

```bash
# 使用 .cnb.yml 配置的流水线自动构建部署
# 参考项目根目录 .cnb.yml 文件
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
| `Ctrl + S` | 导出当前对话 |
| `Ctrl + F` | 全局搜索 |
| `Enter` | 发送消息 |
| `Shift + Enter` | 换行 |

---

## 📁 项目结构

```
deepseek-chat/
├── .cnb.yml                # CNB CI/CD 流水线配置
├── .ide/
│   └── Dockerfile          # IDE 开发容器配置
├── api/                    # Vercel Serverless Functions
│   ├── chat.js             #   POST /api/chat — 聊天代理
│   └── speech.js           #   POST /api/speech — TTS 代理
├── public/                 # 静态资源
│   ├── manifest.json       # PWA 清单
│   ├── sw.js               # Service Worker
│   └── icon.svg            # 应用图标
├── src/
│   ├── components/         # React 组件 (30 个)
│   │   ├── ChatLayout.tsx      # 主聊天布局
│   │   ├── Composer.tsx        # 消息编辑器（引用回复/语音输入）
│   │   ├── MessageList.tsx     # 消息列表（含时间线模式）
│   │   ├── MessageItem.tsx     # 单条消息（含工具调用卡片）
│   │   ├── MarkdownRenderer.tsx# Markdown + Mermaid 渲染
│   │   ├── Sidebar.tsx         # 侧边栏
│   │   ├── SettingsPanel.tsx   # 设置面板
│   │   ├── PromptLibrary.tsx   # 提示词库（72 个模板）
│   │   ├── ProviderManager.tsx # API 供应商管理
│   │   ├── ModelSelector.tsx   # 模型选择器
│   │   ├── ComparisonPanel.tsx # A/B 模型对比
│   │   ├── TemplateSelector.tsx# 对话模板
│   │   ├── ScrollNavigator.tsx # 右侧滚动导航条
│   │   ├── GlobalSearch.tsx    # 全局搜索
│   │   ├── KnowledgeBasePanel.tsx   # 知识库
│   │   ├── UsagePanel.tsx      # 用量追踪
│   │   ├── SharePanel.tsx      # 对话分享
│   │   ├── ImportDialog.tsx    # 对话导入
│   │   ├── TagsPanel.tsx       # 标签管理
│   │   ├── ArtifactPreview.tsx # 代码全屏预览
│   │   ├── VoiceInputButton.tsx# 语音输入按钮
│   │   ├── ToolCallCard.tsx    # 工具调用卡片
│   │   ├── ConfirmDialog.tsx   # 确认对话框
│   │   ├── Toast.tsx           # Toast 通知
│   │   ├── ErrorBoundary.tsx   # 错误边界
│   │   ├── OfflineBanner.tsx   # 离线横幅
│   │   ├── ContextBar.tsx      # 上下文信息栏
│   │   ├── AboutPanel.tsx      # 关于面板
│   │   ├── TechBackground.tsx  # 科技背景动画
│   │   └── ShortcutHelp.tsx    # 快捷键帮助
│   ├── lib/                # 工具库
│   │   ├── prompts.ts          # 提示词模板定义
│   │   ├── stream.ts           # SSE 流处理
│   │   ├── session.ts          # 会话管理
│   │   ├── speech.ts           # TTS 客户端
│   │   ├── sound.ts            # 音效系统
│   │   ├── music.ts            # 背景音乐
│   │   ├── storage.ts          # IndexedDB 封装
│   │   ├── export-file.ts      # PNG/PDF 导出
│   │   ├── provider-adapter.ts # 多供应商适配
│   │   └── utils.ts            # 通用工具
│   ├── stores/             # Zustand 状态管理
│   │   ├── chatStore.ts        # 聊天状态
│   │   ├── settingsStore.ts    # 设置状态
│   │   └── usageStore.ts       # 用量追踪
│   ├── locales/            # 国际化翻译文件
│   ├── types/              # TypeScript 类型定义
│   ├── App.tsx             # 应用入口
│   ├── main.tsx            # 渲染入口
│   └── index.css           # 全局样式
├── server.cjs              # 本地 API 代理服务器
├── start.sh                # 一键启动脚本
├── vercel.json             # Vercel 部署配置
├── vite.config.ts          # Vite 构建配置
├── tailwind.config.js      # Tailwind CSS 配置
├── tsconfig.json           # TypeScript 配置
└── package.json            # 项目依赖
```

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可

MIT License
