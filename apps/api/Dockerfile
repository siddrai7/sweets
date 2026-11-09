# Builds the API. Build context is the repo root (Coolify: base directory "/",
# Dockerfile location "/apps/api/Dockerfile").

FROM node:22-bookworm-slim

# Prisma's migration engine needs OpenSSL, which the slim image leaves out
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
RUN corepack enable
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0 TURBO_TELEMETRY_DISABLED=1

WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm turbo run build --filter=@sweets/api

ENV NODE_ENV=production
WORKDIR /app/apps/api
EXPOSE 4000

# Apply pending migrations, then start. A failed migration stops this container
# before it serves traffic, so Coolify keeps the previous one running.
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && exec node dist/main.js"]
