#!/bin/sh
set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 RealCRM — запуск"
echo "   NODE_ENV:   ${NODE_ENV:-development}"
echo "   PORT:       ${PORT:-3000}"
echo "   TZ:         ${TZ:-(системная)}"
echo "   PUBLIC_URL: ${PUBLIC_URL:-(не задан)}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── Валидация переменных ────────────────────────────────────
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL не задан"
  exit 1
fi

if [ -z "$NEXTAUTH_SECRET" ]; then
  echo "⚠️  NEXTAUTH_SECRET не задан — логин не будет работать"
fi

if [ -z "$PUBLIC_URL" ] || [ "$PUBLIC_URL" = "http://localhost:3000" ]; then
  echo "⚠️  PUBLIC_URL = ${PUBLIC_URL:-unset}"
  echo "    Ссылки в письмах, TG-кнопках и PWA-чате будут указывать на localhost."
  echo "    Укажите реальный адрес: PUBLIC_URL=https://crm.example.ru"
fi

# ── Применение миграций с ретраями (ждём Postgres) ───────────
echo "⏳ Применяем Prisma migrations (с ретраями, макс. 60 сек)..."
MAX_RETRIES=30
RETRY=0
until npx prisma migrate deploy; do
  RETRY=$((RETRY + 1))
  if [ "$RETRY" -ge "$MAX_RETRIES" ]; then
    echo "❌ Не удалось применить миграции за $MAX_RETRIES попыток"
    echo "   Проверьте: DATABASE_URL, доступность Postgres, состояние миграций."
    exit 1
  fi
  echo "   Попытка $RETRY/$MAX_RETRIES, ждём 2 сек..."
  sleep 2
done
echo "✅ Миграции применены"

# ── Запуск ──────────────────────────────────────────────────
echo "🌐 Запуск Next.js на :${PORT:-3000}"
exec npm start