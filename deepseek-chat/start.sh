#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────
#  DeepSeek Chatbox Lite — 一键启动脚本
#  - 自动检测 Node.js / npm
#  - 自动安装缺失的包管理器
#  - 自动 npm install
#  - 自动配置 .env.local
#  - 启动 Vite + 本地 API 代理 (端口 5173 + 3000)
# ──────────────────────────────────────────────────────────
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

# ── 颜色 ────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'
BOLD='\033[1m'

info()  { echo -e "${BLUE}[info]${NC}  $*"; }
ok()    { echo -e "${GREEN}[  ✓]${NC} $*"; }
warn()  { echo -e "${YELLOW}[warn]${NC} $*"; }
err()   { echo -e "${RED}[err]${NC}  $*"; }
step()  { echo -e "\n${CYAN}${BOLD}▶ $*${NC}"; }
banner(){ echo -e "${CYAN}${BOLD}$*${NC}"; }

banner "
╔═══════════════════════════════════════╗
║   🧠 DeepSeek Chatbox Lite v2.0     ║
║   深空科技 · 思考可视化 · 流式对话   ║
╚═══════════════════════════════════════╝
"

# ── Step 0: OS 检测 ────────────────────────────────────
step "检测操作系统..."
OS="$(uname -s)"
case "$OS" in
  Linux)   OS_NAME="linux"  ;;
  Darwin)  OS_NAME="macos"  ;;
  MINGW*|MSYS*|CYGWIN*) OS_NAME="windows" ;;
  *)       OS_NAME="unknown"; warn "未知系统: $OS，继续尝试..." ;;
esac
ok "系统: $OS ($OS_NAME)"

# ── Step 1: Node.js 检测 & 自动安装 ────────────────────
step "检测 Node.js..."

install_node_nvm() {
  info "通过 nvm 安装 Node.js LTS..."
  export NVM_DIR="${HOME}/.nvm"
  if [ ! -d "$NVM_DIR" ]; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
  fi
  [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
  nvm install --lts
  nvm use --lts
}

install_node_apt() {
  info "通过 apt 安装 Node.js..."
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
}

install_node_brew() {
  info "通过 Homebrew 安装 Node.js..."
  brew install node
}

if command -v node &>/dev/null; then
  NODE_VER=$(node -v)
  ok "Node.js: $NODE_VER"
else
  warn "未检测到 Node.js，尝试自动安装..."
  case "$OS_NAME" in
    linux)
      if command -v curl &>/dev/null; then
        install_node_nvm
      elif command -v apt-get &>/dev/null; then
        install_node_apt
      else
        err "无法自动安装 Node.js，请手动安装: https://nodejs.org"
        exit 1
      fi
      ;;
    macos)
      if command -v brew &>/dev/null; then
        install_node_brew
      else
        install_node_nvm
      fi
      ;;
    *)
      err "请手动安装 Node.js ≥18: https://nodejs.org"
      exit 1
      ;;
  esac
  ok "Node.js 安装完成"
fi

# ── Step 2: npm 检测 ───────────────────────────────────
step "检测 npm..."
if command -v npm &>/dev/null; then
  NPM_VER=$(npm -v)
  ok "npm: v$NPM_VER"
else
  warn "npm 未独立安装，使用 corepack enable..."
  corepack enable npm 2>/dev/null || true
  if ! command -v npm &>/dev/null; then
    err "npm 安装失败，请手动处理"
    exit 1
  fi
  NPM_VER=$(npm -v)
  ok "npm: v$NPM_VER"
fi

# ── Step 3: 依赖安装 ───────────────────────────────────
step "检查项目依赖..."

if [ -d "node_modules" ] && [ -f "node_modules/.package-lock.json" ]; then
  ok "node_modules 已存在"
else
  if [ -f "package-lock.json" ] || [ -d "node_modules" ]; then
    info "检测到已有 lock 文件，执行 npm ci..."
    npm ci --prefer-offline --no-audit --no-fund
  else
    info "执行 npm install..."
    npm install --prefer-offline --no-audit --no-fund
  fi
  ok "依赖安装完成"
fi

# ── Step 4: 环境变量配置 ───────────────────────────────
step "配置环境变量..."

load_env() {
  if [ -f "$ROOT/.env.local" ]; then
    set -a; source "$ROOT/.env.local"; set +a
  fi
}
load_env

if [ -z "${DEEPSEEK_API_KEY:-}" ] || [ "$DEEPSEEK_API_KEY" = "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" ]; then
  echo ""
  warn "未检测到有效的 DEEPSEEK_API_KEY"
  echo ""
  echo -e "  ${YELLOW}请粘贴你的 DeepSeek API Key${NC}"
  echo -e "  ${YELLOW}获取地址: https://platform.deepseek.com/api_keys${NC}"
  echo -e "  ${YELLOW}格式: sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx${NC}"
  echo ""
  read -r -p "  API Key (回车跳过): " INPUT_KEY
  if [ -n "$INPUT_KEY" ]; then
    echo "DEEPSEEK_API_KEY=$INPUT_KEY" > "$ROOT/.env.local"
    export DEEPSEEK_API_KEY="$INPUT_KEY"
    ok "API Key 已保存到 .env.local"
  else
    warn "跳过 API Key 输入（功能受限，仅 UI 可预览）"
  fi
else
  ok "DEEPSEEK_API_KEY 已配置"
fi

# ── Step 5: 检查 .env.local 中是否已有 BASE_URL 等配置 ──
step "检查额外配置..."

if [ -n "${DEEPSEEK_API_KEY:-}" ]; then
  info "API Key: ${DEEPSEEK_API_KEY:0:12}...${DEEPSEEK_API_KEY: -4}"
fi

# ── Step 6: 启动服务 ───────────────────────────────────
step "启动服务..."

cleanup() {
  echo ""
  warn "正在关闭所有服务..."
  if [ -n "${API_PID:-}" ]; then kill "$API_PID" 2>/dev/null || true; fi
  if [ -n "${VITE_PID:-}" ]; then kill "$VITE_PID" 2>/dev/null || true; fi
  exit 0
}
trap cleanup SIGINT SIGTERM

# ── 启动 API 代理服务器 ──────────────────────────
echo ""
info "启动 API 代理服务器 → 端口 ${API_PORT:-3000} ..."
node "$ROOT/server.cjs" &
API_PID=$!
sleep 1

if ! kill -0 "$API_PID" 2>/dev/null; then
  err "API 代理服务器启动失败"
  err "请确认 DEEPSEEK_API_KEY 已正确配置在 .env.local 中"
  exit 1
fi
ok "API 代理服务器已就绪"

# ── 检测可用端口 ────────────────────────────────
VITE_PORT="${VITE_PORT:-5173}"
if command -v ss &>/dev/null; then
  if ss -tln | grep -q ":$VITE_PORT "; then
    warn "端口 $VITE_PORT 已被占用，尝试随机端口..."
    VITE_PORT=""
  fi
fi

# ── 启动 Vite 前端 ──────────────────────────────
echo ""
info "启动 Vite 开发服务器..."
if [ -n "$VITE_PORT" ]; then
  npx vite --host --port "$VITE_PORT" &
else
  npx vite --host &
fi
VITE_PID=$!
sleep 2

echo ""
echo -e "  ${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  ${BOLD}  前端地址 → ${CYAN}http://localhost:${VITE_PORT:-5173}${NC}"
echo -e "  ${BOLD}  API 代理  → ${CYAN}http://localhost:${API_PORT:-3000}${NC}"
echo -e "  ${BOLD}  默认模型  → ${CYAN}deepseek-v4-flash${NC}"
echo -e "  ${BOLD}  思考模式  → ${CYAN}默认启用（可视化 CoT）${NC}"
echo -e "  ${BOLD}  主题     → ${CYAN}深空暗色 · 霓虹科技${NC}"
echo -e ""
echo -e "  ${YELLOW}快捷键:${NC}"
echo -e "  ${YELLOW}  Ctrl+N   → ${NC}新建对话"
echo -e "  ${YELLOW}  Ctrl+B   → ${NC}侧栏展开/收起"
echo -e "  ${YELLOW}  Ctrl+E   → ${NC}聚焦输入框"
echo -e "  ${YELLOW}  Ctrl+K   → ${NC}清空对话"
echo -e "  ${YELLOW}  Ctrl+/   → ${NC}快捷键帮助"
echo -e "  ${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
info "按 Ctrl+C 停止所有服务"
echo ""

wait
