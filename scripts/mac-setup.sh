#!/bin/bash
# HandiPick — Mac setup script
# Run once on a new Mac: bash scripts/mac-setup.sh

set -e

echo "=== HandiPick Mac Setup ==="

# ── 1. Homebrew ───────────────────────────────────────────────────────────────
if ! command -v brew &>/dev/null; then
  echo "Installing Homebrew..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  # Add brew to PATH for Apple Silicon Macs
  echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
  eval "$(/opt/homebrew/bin/brew shellenv)"
else
  echo "✓ Homebrew already installed"
fi

# ── 2. Node.js via nvm ────────────────────────────────────────────────────────
if ! command -v nvm &>/dev/null; then
  echo "Installing nvm..."
  brew install nvm
  mkdir -p ~/.nvm
  echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.zshrc
  echo '[ -s "/opt/homebrew/opt/nvm/nvm.sh" ] && \. "/opt/homebrew/opt/nvm/nvm.sh"' >> ~/.zshrc
  source ~/.zshrc 2>/dev/null || true
fi

export NVM_DIR="$HOME/.nvm"
[ -s "/opt/homebrew/opt/nvm/nvm.sh" ] && \. "/opt/homebrew/opt/nvm/nvm.sh"

echo "Installing Node 20..."
nvm install 20
nvm use 20
nvm alias default 20
echo "✓ Node $(node --version)"

# ── 3. GitHub CLI ─────────────────────────────────────────────────────────────
if ! command -v gh &>/dev/null; then
  echo "Installing GitHub CLI..."
  brew install gh
fi
echo "✓ gh $(gh --version | head -1)"

# ── 4. Claude Code ────────────────────────────────────────────────────────────
if ! command -v claude &>/dev/null; then
  echo "Installing Claude Code..."
  npm install -g @anthropic-ai/claude-code
fi
echo "✓ Claude Code installed"

# ── 5. Project dependencies ───────────────────────────────────────────────────
echo "Installing project npm dependencies..."
npm install

# ── 6. Remind about .env ──────────────────────────────────────────────────────
if [ ! -f .env ]; then
  echo ""
  echo "⚠  No .env file found. Create one with:"
  echo ""
  echo "   AUTH_SECRET=<your value>"
  echo "   DATABASE_URL=<your Supabase URL>"
  echo ""
fi

echo ""
echo "✅  Setup complete!"
echo ""
echo "Next steps:"
echo "  1. gh auth login                     — authenticate GitHub (aawest65)"
echo "  2. Create .env with your credentials"
echo "  3. npx prisma generate               — generate Prisma client"
echo "  4. npm run dev                        — start the app"
