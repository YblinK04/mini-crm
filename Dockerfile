# ══════════════════════════════════════════════════════════════
# Stage 1: builder — установка, генерация Prisma, сборка Next.js
# ══════════════════════════════════════════════════════════════
# Обновлено до node:22-slim для устранения предупреждения EBADENGINE
FROM node:22-slim AS builder

# openssl нужен для Prisma; ca-certificates для HTTPS
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Отключаем телеметрию и сообщения обновлений
ENV NEXT_TELEMETRY_DISABLED=1
ENV PRISMA_HIDE_UPDATE_MESSAGE=1

# 1. ИСПРАВЛЕНИЕ: Копируем package.json И папку prisma ДО npm ci
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Теперь postinstall (prisma generate) отработает успешно, 
# так как schema.prisma уже присутствует в контейнере.
RUN npm ci

# Копируем остальной проект
COPY . .

# Сборка Next.js (если в скрипте build уже есть prisma generate, это сработает или будет no-op)
RUN npm run build

# Удаляем devDependencies (~500MB: vitest, jsdom, typescript, и т.д.)
RUN npm prune --omit=dev && npm cache clean --force

# Удаляем build cache Next.js (экономит ~100MB)
RUN rm -rf .next/cache

# ══════════════════════════════════════════════════════════════
# Stage 2: runner — минимальный рантайм
# ══════════════════════════════════════════════════════════════
FROM node:22-slim AS runner

# openssl — Prisma; curl — healthcheck; postgresql-client — pg_dump (backup)
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl ca-certificates curl postgresql-client && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Non-root пользователь
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs nextjs

# Копируем артефакты из builder (node_modules уже pruned — только prod deps)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/next.config.ts ./next.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/tsconfig.json ./tsconfig.json
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts

# Prisma CLI устанавливаем глобально, чтобы избежать конфликтов npm после prune
RUN npm install -g prisma && npm cache clean --force

# Entrypoint
# Entrypoint
COPY --chown=nextjs:nodejs docker/entrypoint.sh /entrypoint.sh
RUN sed -i 's/\r$//' /entrypoint.sh
RUN chmod +x /entrypoint.sh && chown nextjs:nodejs /entrypoint.sh
USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=3 \
    CMD curl -fsS "http://localhost:${PORT}/api/health" || exit 1

ENTRYPOINT ["/entrypoint.sh"]