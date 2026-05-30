#!/bin/bash
# Deploy / update aplikacji Mundial 2026
# Uruchom z katalogu aplikacji: bash scripts/deploy.sh
set -e

echo "=== [1/4] Git pull ==="
git pull

echo "=== [2/4] npm install ==="
npm ci --omit=dev

echo "=== [3/4] Build ==="
npm run build

echo "=== [4/4] PM2 restart ==="
if pm2 list | grep -q "mundial"; then
  pm2 restart mundial
else
  pm2 start ecosystem.config.js
fi

echo ""
echo "Deploy zakończony. Sprawdź: https://mund2026.duckdns.org"
