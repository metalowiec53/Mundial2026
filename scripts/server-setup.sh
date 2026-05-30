#!/bin/bash
# One-time server setup: firewall + Caddy + Node.js 20 + PM2
# Run as root on Ubuntu 22: bash server-setup.sh
set -e

DOMAIN="mund2026.duckdns.org"
APP_DIR="/var/www/mundial-2026"
NODE_VERSION="20"

echo "=== [1/6] Firewall ==="
ufw allow 22
ufw allow 80
ufw allow 443
ufw deny 3000
ufw --force enable
echo "UFW aktywny"

echo "=== [2/6] Caddy ==="
apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
  | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
  | tee /etc/apt/sources.list.d/caddy-stable.list
apt update && apt install -y caddy

cat > /etc/caddy/Caddyfile <<EOF
${DOMAIN} {
    reverse_proxy localhost:3000
}
EOF

systemctl enable caddy
systemctl restart caddy
echo "Caddy działa"

echo "=== [3/6] Node.js ${NODE_VERSION} ==="
if ! command -v node &>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
  apt install -y nodejs
fi
node -v && npm -v

echo "=== [4/6] PM2 ==="
npm install -g pm2
pm2 -v

echo "=== [5/6] Katalog aplikacji ==="
mkdir -p "$APP_DIR"
echo "Folder: $APP_DIR"

echo ""
echo "=========================================="
echo "  Setup zakończony!"
echo "=========================================="
echo ""
echo "Kolejne kroki:"
echo "  1. Sklonuj repo do $APP_DIR:"
echo "       git clone <twoje-repo> $APP_DIR"
echo "  2. Skopiuj .env.local na serwer:"
echo "       scp .env.local root@217.154.83.23:$APP_DIR/"
echo "  3. Uruchom deploy:"
echo "       cd $APP_DIR && bash scripts/deploy.sh"
echo "  4. Zapisz autostart PM2:"
echo "       pm2 startup  (wklej podaną komendę)"
echo "       pm2 save"
echo ""
echo "  Aplikacja będzie dostępna na:"
echo "  https://${DOMAIN}"
