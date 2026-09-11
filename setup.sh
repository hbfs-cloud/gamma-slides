#!/bin/bash
set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
DIM='\033[2m'
BOLD='\033[1m'
NC='\033[0m'

ok()   { echo -e "  ${GREEN}✓${NC} $1"; }
fail() { echo -e "  ${RED}✗${NC} $1"; }
warn() { echo -e "  ${YELLOW}⚠${NC} $1"; }
info() { echo -e "  ${DIM}$1${NC}"; }

echo ""
echo -e "${BOLD}  fipto-slides setup${NC}"
echo -e "  ──────────────────"
echo ""

OS=$(uname -s)
MISSING=0

# ── Bun ──────────────────────────────────────────────────
if command -v bun &>/dev/null; then
  BUN_VER=$(bun --version)
  BUN_MAJOR=$(echo "$BUN_VER" | cut -d. -f1)
  if [ "$BUN_MAJOR" -ge 1 ]; then
    ok "Bun $BUN_VER"
  else
    warn "Bun $BUN_VER found (need >= 1.3)"
    MISSING=1
  fi
else
  fail "Bun not found"
  MISSING=1
  if [ "$OS" = "Darwin" ]; then
    info "Install: brew install bun"
  else
    info "Install: curl -fsSL https://bun.com/install | bash"
  fi
fi

# ── ffmpeg ───────────────────────────────────────────────
if command -v ffmpeg &>/dev/null; then
  FFMPEG_VER=$(ffmpeg -version 2>&1 | head -1 | awk '{print $3}')
  ok "ffmpeg $FFMPEG_VER"
else
  fail "ffmpeg not found"
  MISSING=1
  if [ "$OS" = "Darwin" ]; then
    info "Install: brew install ffmpeg"
  else
    info "Install: sudo apt-get install -y ffmpeg"
  fi
fi

# ── Python 3 ─────────────────────────────────────────────
if command -v python3 &>/dev/null; then
  PY_VER=$(python3 --version | awk '{print $2}')
  ok "Python $PY_VER"
else
  fail "Python 3 not found"
  MISSING=1
  if [ "$OS" = "Darwin" ]; then
    info "Install: brew install python3"
  else
    info "Install: sudo apt-get install -y python3 python3-pip"
  fi
fi

# ── edge-tts ─────────────────────────────────────────────
if command -v edge-tts &>/dev/null; then
  ok "edge-tts ($(edge-tts --version 2>/dev/null || echo 'installed'))"
else
  fail "edge-tts not found"
  MISSING=1
  info "Install: pip3 install edge-tts"
fi

# ── Chromium / Chrome (for Puppeteer) ────────────────────
CHROME_FOUND=0
for cmd in chromium chromium-browser google-chrome google-chrome-stable; do
  if command -v "$cmd" &>/dev/null; then
    CHROME_VER=$("$cmd" --version 2>/dev/null | head -1)
    ok "Browser: $CHROME_VER"
    CHROME_FOUND=1
    break
  fi
done
if [ "$CHROME_FOUND" -eq 0 ]; then
  # Puppeteer will download its own on bun install, so this is a soft warning
  warn "No system Chromium found (Puppeteer will download its own)"
fi

echo ""

# ── Auto-install if running with --install ───────────────
if [ "$1" = "--install" ] || [ "$1" = "-i" ]; then
  echo -e "${BOLD}  Installing missing dependencies...${NC}"
  echo ""

  if [ "$OS" = "Darwin" ]; then
    # macOS via Homebrew
    if ! command -v brew &>/dev/null; then
      info "Installing Homebrew..."
      /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    fi
    command -v bun &>/dev/null     || brew install bun
    command -v ffmpeg &>/dev/null  || brew install ffmpeg
    command -v python3 &>/dev/null || brew install python3
  else
    # Linux (Debian/Ubuntu)
    sudo apt-get update -qq
    if ! command -v bun &>/dev/null; then
      curl -fsSL https://bun.com/install | bash
      export BUN_INSTALL="${BUN_INSTALL:-$HOME/.bun}"
      export PATH="$BUN_INSTALL/bin:$PATH"
    fi
    command -v ffmpeg &>/dev/null  || sudo apt-get install -y ffmpeg
    command -v python3 &>/dev/null || sudo apt-get install -y python3 python3-pip
    # Install Chromium for Linux (Puppeteer perf)
    command -v chromium &>/dev/null || command -v chromium-browser &>/dev/null || {
      sudo apt-get install -y chromium
      echo "export PUPPETEER_EXECUTABLE_PATH=$(which chromium || which chromium-browser)" >> ~/.bashrc
    }
  fi

  # edge-tts
  command -v edge-tts &>/dev/null || pip3 install edge-tts

  echo ""
  ok "System dependencies installed"
  echo ""
fi

# ── bun install ──────────────────────────────────────────
if [ ! -d "node_modules" ]; then
  echo -e "  ${BOLD}Installing Bun packages...${NC}"
  bun install
  echo ""
  ok "Bun packages installed"
else
  ok "Bun packages already installed"
fi

echo ""

# ── Summary ──────────────────────────────────────────────
if [ "$MISSING" -eq 0 ] || [ "$1" = "--install" ] || [ "$1" = "-i" ]; then
  echo -e "  ${GREEN}${BOLD}Ready!${NC} Run:"
  echo ""
  echo -e "    ${DIM}# Generate slides${NC}"
  echo -e "    node bin/fipto-slides.js generate -t revenue-model"
  echo ""
  echo -e "    ${DIM}# Preview in browser${NC}"
  echo -e "    node bin/fipto-slides.js serve"
  echo ""
  echo -e "    ${DIM}# Generate narrated video${NC}"
  echo -e "    node bin/fipto-slides.js video -t revenue-model"
  echo ""
else
  echo -e "  ${YELLOW}${BOLD}Missing dependencies.${NC} Run:"
  echo -e "    ${BOLD}./setup.sh --install${NC}"
  echo ""
  echo -e "  Or use Docker:"
  echo -e "    ${BOLD}docker compose run fipto-slides generate -t revenue-model${NC}"
fi
echo ""
