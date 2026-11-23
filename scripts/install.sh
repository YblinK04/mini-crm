#!/bin/bash
# ══════════════════════════════════════════════════════════════
# RealCRM — установка под ключ на чистый Ubuntu 22.04/24.04 VPS
# Использование:
#   ./install.sh <domain> <admin-email> <admin-password>
# Пример:
#   ./install.sh crm.client.ru owner@client.ru SecretPass123
# ══════════════════════════════════════════════════════════════
set -euo pipefail

DOMAIN="${1:-}"
ADMIN_EMAIL="${2:-}"
ADMIN_PASSWORD="${3:-}"

if [ -z "$DOMAIN" ] || [ -z "$ADMIN_EMAIL" ] || [ -z "$ADMIN_PASSWORD" ]; then
  echo "Использование: $0 <domain> <admin-email> <admin-password>"
  echo "Пример:        $0 crm.client.ru owner@client.ru SecretPass123"
  exit 1
fi

if [ "$EUID" -ne 0 ]; then
  echo "❌ Запускать от root (sudo ./install.sh ...)"
  exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Установка RealCRM"
echo "   Домен:        $DOMAIN"
echo "   Admin email:  $ADMIN_EMAIL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── 1. Проверка DNS ─────────────────────────────────────────
echo "→ Проверка DNS..."
apt-get update -qq
apt-get install -y -qq dnsutils curl git >/dev/null

SERVER_IP=$(curl -s https://api.ipify.org)
DOMAIN_IP=$(dig +short "$DOMAIN" | tail -1)
if [ "$SERVER_IP" != "$DOMAIN_IP" ]; then
  echo "⚠️  $DOMAIN → $DOMAIN_IP, а сервер = $SERVER_IP"
  echo "   Проверьте A-запись домена. Может занять до 24 часов."
  read -p "Продолжить? (y/n) " -n 1 -r
  echo
  [[ ! $REPLY =~ ^[Yy]$ ]] && exit 1
fi

# ── 2. Swap 2 GB ────────────────────────────────────────────
echo "→ Настройка swap (2 GB)..."
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
else
  echo "   swap уже есть, пропускаем"
fi

# ── 3. Docker ───────────────────────────────────────────────
echo "→ Установка Docker..."
if ! command -v docker &>/dev/null; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
fi
if ! docker compose version &>/dev/null; then
  apt-get install -y -qq docker-compose-plugin
fi

# ── 4. Nginx + certbot ──────────────────────────────────────
echo "→ Установка Nginx + certbot..."
apt-get install -y -qq nginx certbot python3-certbot-nginx

# Временный HTTP-конфиг (для certbot challenge)
cat > /etc/nginx/sites-available/realcrm <<EOF
server {
    listen 80;
    server_name $DOMAIN;
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 301 https://\$host\$request_uri; }
}
EOF
ln -sf /etc/nginx/sites-available/realcrm /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
mkdir -p /var/www/certbot
nginx -t && systemctl reload nginx

# ── 5. SSL ──────────────────────────────────────────────────
echo "→ Получение SSL (Let's Encrypt)..."
certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$ADMIN_EMAIL" --redirect

# ── 6. Клонирование проекта ─────────────────────────────────
echo "→ Загрузка RealCRM..."
INSTALL_DIR="/opt/realcrm"
if [ -d "$INSTALL_DIR" ]; then
  cd "$INSTALL_DIR"
  git pull
else
  # ⚠️ ЗАМЕНИ на свой репозиторий
  git clone https://github.com/ВАШ-USER/mini-crm.git "$INSTALL_DIR"
  cd "$INSTALL_DIR"
fi

# ── 7. Генерация .env ───────────────────────────────────────
echo "→ Генерация .env..."
POSTGRES_PASSWORD=$(openssl rand -hex 16)
NEXTAUTH_SECRET=$(openssl rand -base64 32)

cat > .env <<EOF
POSTGRES_USER=crm
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
POSTGRES_DB=crm

NEXTAUTH_URL=https://$DOMAIN
PUBLIC_URL=https://$DOMAIN
NEXTAUTH_SECRET=$NEXTAUTH_SECRET
AUTH_SECRET=$NEXTAUTH_SECRET

MASTER_ADMIN_EMAIL=$ADMIN_EMAIL
MASTER_ADMIN_PASSWORD=$ADMIN_PASSWORD

TZ=Europe/Moscow
TELEGRAM_POLLING=false
EOF

chmod 600 .env
echo "   ✅ .env создан (пароли сгенерированы)"

# ── 8. Nginx reverse-proxy ──────────────────────────────────
echo "→ Настройка Nginx (proxy на app:3000)..."
cat > /etc/nginx/sites-available/realcrm <<EOF
server {
    listen 443 ssl http2;
    server_name $DOMAIN;

    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    client_max_body_size 20M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 120s;
    }

    # SSE/polling не буферизуем
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_buffering off;
        proxy_read_timeout 120s;
    }
}

server {
    listen 80;
    server_name $DOMAIN;
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 301 https://\$host\$request_uri; }
}
EOF
nginx -t && systemctl reload nginx

# Автообновление SSL
systemctl enable --now certbot.timer

# ── 9. Docker build + up ────────────────────────────────────
echo "→ Сборка Docker-образа (5-7 минут)..."
docker compose build

echo "→ Запуск контейнеров..."
docker compose up -d

# ── 10. Ожидание healthcheck ────────────────────────────────
echo "→ Ожидание готовности (макс. 120 сек)..."
READY=0
for i in $(seq 1 60); do
  if curl -fsS "http://127.0.0.1:3000/api/health" &>/dev/null; then
    READY=1
    break
  fi
  sleep 2
done

if [ "$READY" -eq 0 ]; then
  echo "❌ Приложение не отвечает за 120 сек"
  echo "   Логи: docker compose -f $INSTALL_DIR/docker-compose.yml logs app"
  exit 1
fi

# ── 11. Проверка снаружи ────────────────────────────────────
echo "→ Проверка HTTPS..."
if curl -fsS "https://$DOMAIN/api/health" &>/dev/null; then
  echo "✅ HTTPS работает"
else
  echo "⚠️  HTTPS не отвечает — проверьте Nginx: nginx -t && systemctl status nginx"
fi

# ── 12. Бэкап cron ──────────────────────────────────────────
echo "→ Настройка ежедневного бэкапа..."
mkdir -p /opt/backups
cat > /etc/cron.daily/realcrm-backup <<'EOF'
#!/bin/bash
cd /opt/realcrm
docker compose exec -T postgres pg_dump -U crm crm | gzip > /opt/backups/crm_$(date +%F).sql.gz
find /opt/backups -name "*.sql.gz" -mtime +30 -delete
EOF
chmod +x /etc/cron.daily/realcrm-backup

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ RealCRM установлена!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 Адрес:        https://$DOMAIN"
echo "👤 Admin email:  $ADMIN_EMAIL"
echo "🔑 Admin pass:   $ADMIN_PASSWORD"
echo ""
echo "Что дальше:"
echo "  1. Откройте https://$DOMAIN/login"
echo "  2. Войдите с admin credentials (создастся при первом входе)"
echo "  3. Настройки → Мессенджеры → вставьте токен бота"
echo "  4. Настройки → Email → настройте SMTP"
echo ""
echo "Диагностика:"
echo "  cd $INSTALL_DIR"
echo "  docker compose logs -f app"
echo "  docker compose ps"
echo ""