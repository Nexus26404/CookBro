#!/bin/bash
# =============================================================================
# CookBro - Ubuntu 22 Server Setup Script
# Sets up: Nginx + Certbot (Let's Encrypt) + HTTPS reverse proxy for Next.js
#
# Usage:
#   chmod +x server-setup.sh
#   sudo bash server-setup.sh your-domain.com your@email.com
# =============================================================================

set -e

DOMAIN="${1}"
EMAIL="${2}"
APP_PORT="${3:-3000}"
DEPLOY_PATH="${4:-/var/www/cook-bro}"

# --- Validate Args ---
if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
  echo "Usage: $0 <domain> <email> [app_port] [deploy_path]"
  echo "Example: $0 cookbro.example.com admin@example.com 3000 /var/www/cook-bro"
  exit 1
fi

echo "============================================"
echo "  CookBro Server Setup"
echo "  Domain:      $DOMAIN"
echo "  Email:       $EMAIL"
echo "  App Port:    $APP_PORT"
echo "  Deploy Path: $DEPLOY_PATH"
echo "============================================"

# --- Install Dependencies ---
echo ""
echo "📦 Installing Nginx and Certbot..."
apt-get update -qq
apt-get install -y nginx certbot python3-certbot-nginx

# --- Create Deploy Directory ---
mkdir -p "$DEPLOY_PATH"

# --- Write initial Nginx config (HTTP only, needed for Certbot challenge) ---
echo ""
echo "⚙️  Writing Nginx configuration..."
cat > "/etc/nginx/sites-available/cookbro" <<EOF
server {
    listen 80;
    server_name ${DOMAIN};

    # Let's Encrypt ACME challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

ln -sf /etc/nginx/sites-available/cookbro /etc/nginx/sites-enabled/cookbro
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl reload nginx
echo "✅ Nginx HTTP config applied."

# --- Obtain Let's Encrypt Certificate ---
echo ""
echo "🔐 Obtaining Let's Encrypt certificate for ${DOMAIN}..."
mkdir -p /var/www/certbot
certbot --nginx \
  --non-interactive \
  --agree-tos \
  --email "$EMAIL" \
  --domains "$DOMAIN" \
  --redirect

echo "✅ HTTPS certificate obtained."

# --- Write final Nginx config with HTTPS (certbot already patches it, this is for reference) ---
# Certbot auto-updates the config above with SSL directives.
# After certbot, the config will have listen 443 ssl blocks added automatically.

# --- Reload Nginx with final HTTPS config ---
nginx -t
systemctl reload nginx

# --- Install Node.js (if not present) ---
if ! command -v node &> /dev/null; then
  echo ""
  echo "📦 Installing Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
echo "✅ Node.js $(node --version) is available."

# --- Install PM2 globally (if not present) ---
if ! command -v pm2 &> /dev/null; then
  echo ""
  echo "📦 Installing PM2..."
  npm install -g pm2
fi
echo "✅ PM2 $(pm2 --version) is available."

# --- Configure PM2 to start on boot ---
pm2 startup systemd -u root --hp /root | tail -1 | bash || true

echo ""
echo "============================================"
echo "  ✅ Server setup complete!"
echo ""
echo "  Next steps:"
echo "  1. Push code to GitHub to trigger CI/CD"
echo "  2. Or manually place your app in: $DEPLOY_PATH"
echo "  3. Then run:"
echo "     cd $DEPLOY_PATH"
echo "     pm2 start node_modules/.bin/next --name cookbro --interpreter none -- start --port $APP_PORT"
echo "     pm2 save"
echo ""
echo "  Your app will be available at: https://$DOMAIN"
echo "============================================"
