# ──────────────────────────────────────────────────────────
#  DeepSeek Chatbox — IDE / Dev Container
#  基于 Node.js 22 Alpine 的全功能开发环境
# ──────────────────────────────────────────────────────────

# ── 基础镜像 ────────────────────────────────────────────
FROM node:22-alpine

# ── 系统依赖 ────────────────────────────────────────────
RUN apk add --no-cache \
    bash \
    curl \
    git \
    wget \
    ca-certificates \
    tzdata

# 设置时区
ENV TZ=Asia/Shanghai
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# ── 工作目录 ────────────────────────────────────────────
WORKDIR /workspace

# ── 环境变量 ────────────────────────────────────────────
ENV NODE_ENV=development \
    VITE_PORT=5173 \
    API_PORT=3000 \
    NPM_CONFIG_PREFER_OFFLINE=true

# ── 依赖安装（分层缓存） ─────────────────────────────────
COPY package.json package-lock.json ./
RUN npm ci --prefer-offline --no-audit --no-fund

# ── 项目文件 ────────────────────────────────────────────
COPY . .

# ── 暴露端口 ────────────────────────────────────────────
# 5173 — Vite 开发服务器（前端）
# 3000 — API 代理服务器（后端）
EXPOSE 5173 3000

# ── 健康检查 ────────────────────────────────────────────
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:5173/ || exit 1

# ── 默认启动：API 代理 + Vite 前端 ──────────────────────
CMD ["sh", "-c", "node server.cjs & npx vite --host 0.0.0.0 --port 5173"]

# ── 可选：仅启动 API 代理（用于后端开发） ────────────────
# CMD ["node", "server.cjs"]

# ── 可选：构建生产版本并静态服务 ─────────────────────────
# RUN npm run build
# CMD ["npx", "serve", "-s", "dist", "-l", "5173"]
