# ──────────────────────────────────────────────────────────
#  DeepSeek Chatbox Lite — IDE / Dev Container
#  基于 Node.js 22 的开发环境
# ──────────────────────────────────────────────────────────

FROM node:22-alpine

# 安装系统依赖
RUN apk add --no-cache bash curl git

# 设置工作目录
WORKDIR /workspace

# 复制包管理文件
COPY package.json package-lock.json ./

# 安装依赖
RUN npm ci --prefer-offline --no-audit --no-fund

# 复制项目文件
COPY . .

# 暴露端口
# 5173 — Vite 开发服务器
# 3000 — API 代理服务器
EXPOSE 5173 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:5173/ || exit 1

# 默认启动开发模式
CMD ["sh", "-c", "node server.cjs & npx vite --host 0.0.0.0 --port 5173"]
