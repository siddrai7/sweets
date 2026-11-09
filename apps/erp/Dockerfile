# Builds the ERP. Build context is the repo root (Coolify: base directory "/",
# Dockerfile location "/apps/erp/Dockerfile").
# NEXT_PUBLIC_* values are baked into the bundle, so they must be set as build variables.

FROM node:22-bookworm-slim

RUN corepack enable
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0 TURBO_TELEMETRY_DISABLED=1 NEXT_TELEMETRY_DISABLED=1

WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_STOREFRONT_URL
RUN test -n "$NEXT_PUBLIC_API_URL" || (echo "NEXT_PUBLIC_API_URL build variable is required" && exit 1)
RUN test -n "$NEXT_PUBLIC_STOREFRONT_URL" || (echo "NEXT_PUBLIC_STOREFRONT_URL build variable is required" && exit 1)
RUN pnpm turbo run build --filter=@sweets/erp

ENV NODE_ENV=production
WORKDIR /app/apps/erp
EXPOSE 3001
CMD ["node_modules/.bin/next", "start", "--port", "3001"]
