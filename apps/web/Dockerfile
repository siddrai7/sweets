# Builds the storefront. Build context is the repo root (Coolify: base directory "/",
# Dockerfile location "/apps/web/Dockerfile").
# NEXT_PUBLIC_* values are baked into the bundle, so they must be set as build variables.
# API_URL and REVALIDATE_SECRET are read at runtime.

FROM node:22-bookworm-slim

RUN corepack enable
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0 TURBO_TELEMETRY_DISABLED=1 NEXT_TELEMETRY_DISABLED=1

WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_SITE_NAME
ARG NEXT_PUBLIC_DELIVERY_FEE
ARG NEXT_PUBLIC_FREE_DELIVERY_ABOVE
RUN test -n "$NEXT_PUBLIC_API_URL" || (echo "NEXT_PUBLIC_API_URL build variable is required" && exit 1)
RUN test -n "$NEXT_PUBLIC_SITE_URL" || (echo "NEXT_PUBLIC_SITE_URL build variable is required" && exit 1)
RUN pnpm turbo run build --filter=@sweets/web

ENV NODE_ENV=production
WORKDIR /app/apps/web
EXPOSE 3000
CMD ["node_modules/.bin/next", "start", "--port", "3000"]
