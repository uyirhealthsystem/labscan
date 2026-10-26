# syntax=docker/dockerfile:1
# Multi-stage build. The final image runs as a non-root user and ships only
# production dependencies + compiled JS (the Prisma client is generated into
# src/generated and compiled into dist/ with the rest of the code).
ARG NODE_VERSION=22

# ---- build: all deps, generate the Prisma client, compile TypeScript ----
FROM node:${NODE_VERSION}-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY tsconfig.json prisma7.config.ts ./
COPY prisma ./prisma
COPY src ./src
# prisma7.config.ts needs DATABASE_URL to be set; generate never connects, so a
# placeholder is enough and does not outlive this stage.
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" npx prisma generate --config prisma7.config.ts \
 && npm run build

# ---- prod-deps: production-only node_modules ----
FROM node:${NODE_VERSION}-bookworm-slim AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev

# ---- runtime ----
FROM node:${NODE_VERSION}-bookworm-slim AS runtime
ENV NODE_ENV=production \
    PORT=8082
WORKDIR /app

COPY --chown=node:node --from=prod-deps /app/node_modules ./node_modules
COPY --chown=node:node --from=build /app/dist ./dist
# Schema + migrations + config stay in the image so a release job can run
# `npx prisma migrate deploy --config prisma7.config.ts` from it.
COPY --chown=node:node package.json prisma7.config.ts ./
COPY --chown=node:node prisma ./prisma

# Uploaded report files are written to ./uploads/reports - mount a volume here
# so they survive the container.
RUN mkdir -p uploads/reports && chown -R node:node uploads
VOLUME ["/app/uploads"]

USER node
EXPOSE 8082

STOPSIGNAL SIGTERM
HEALTHCHECK --interval=15s --timeout=3s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8082)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/server.js"]
