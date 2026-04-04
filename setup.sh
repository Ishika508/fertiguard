#!/bin/bash
# ================================================================
# FertiGuard — Automated Setup Script
# ================================================================
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo ""
echo "🌿 FertiGuard Setup Script"
echo "================================"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
  echo -e "${RED}❌ Node.js is not installed.${NC}"
  echo "Please install Node.js 18+ from https://nodejs.org"
  exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo -e "${RED}❌ Node.js 18+ required. Found: $(node -v)${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v) found${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
  echo -e "${RED}❌ npm not found.${NC}"
  exit 1
fi
echo -e "${GREEN}✓ npm $(npm -v) found${NC}"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# Setup env
if [ ! -f ".env.local" ]; then
  echo ""
  echo "⚙️  Creating .env.local from template..."
  cp .env.example .env.local
  echo -e "${YELLOW}⚠  .env.local created. Edit it to add your Firebase config.${NC}"
  echo "   For demo mode (no Firebase needed), NEXT_PUBLIC_DEMO_MODE=true is pre-set."
else
  echo -e "${GREEN}✓ .env.local already exists${NC}"
fi

# Check Ollama (optional)
echo ""
if command -v ollama &> /dev/null; then
  echo -e "${GREEN}✓ Ollama found at $(which ollama)${NC}"
  echo "  Run 'ollama serve' and 'ollama pull llama3' to enable AI chatbot."
else
  echo -e "${YELLOW}ℹ  Ollama not found — chatbot will use built-in fallback responses.${NC}"
  echo "  Install from https://ollama.ai for full AI chatbot support."
fi

echo ""
echo "================================"
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "To start the development server:"
echo -e "  ${GREEN}npm run dev${NC}"
echo ""
echo "Then open: http://localhost:3000"
echo ""
echo "Demo login: Any email + password (6+ chars)"
echo "================================"
