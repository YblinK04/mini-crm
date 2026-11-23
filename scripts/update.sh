#!/bin/bash
set -euo pipefail

cd /opt/realcrm

echo "→ Скачиваем обновления..."
git pull

echo "→ Пересобираем образ..."
docker compose build

echo "→ Перезапускаем..."
docker compose up -d

echo "✅ Обновление завершено"
docker compose logs app --tail 20