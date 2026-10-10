#!/usr/bin/env bash
# Runs ON the EC2 host (piped in over SSH by the GitHub Actions deploy job).
# Promotes the freshly-uploaded release (dist + production node_modules) in
# releases/next, applies Prisma migrations, restarts the service and rolls back if the health check fails.
set -euo pipefail

SERVICE=labscan
ROOT=/opt/$SERVICE
ENV_FILE="$ROOT/shared/$SERVICE.env"
KEEP=5

[ -f "$ENV_FILE" ] || { echo "missing $ENV_FILE - run deploy/setup-ec2.sh first"; exit 1; }
[ -d "$ROOT/releases/next" ] || { echo "no uploaded release at $ROOT/releases/next"; exit 1; }

TS=$(date +%Y%m%d%H%M%S)
REL="$ROOT/releases/$TS"
PREVIOUS=$(readlink -f "$ROOT/current" 2>/dev/null || true)

mv "$ROOT/releases/next" "$REL"
cd "$REL"

# DATABASE_URL etc. for the migration step below.
set -a; . "$ENV_FILE"; set +a
export NODE_ENV=production
PORT=${PORT:-8082}

# Uploaded report files live outside the release so they survive deploys.
mkdir -p "$ROOT/shared/uploads"
ln -sfn "$ROOT/shared/uploads" "$REL/uploads"

# node_modules arrives pre-installed from the CI runner (a full `npm ci` here
# gets OOM-killed on a small instance). Only the Prisma schema engine is a
# platform-specific binary, so re-run its install script to fetch this host's.
echo "==> fetching Prisma engine for this host"
npm rebuild @prisma/engines

# Migrate over a direct connection: through Neon's pooler (PgBouncer) the
# session-level advisory lock Prisma takes is left held on a pooled backend
# connection, and the next deploy times out waiting for it (P1002).
# Set DIRECT_URL in the env file, or the "-pooler" host suffix is dropped.
MIGRATE_URL=${DIRECT_URL:-${DATABASE_URL/-pooler./.}}

echo "==> applying database migrations"
DATABASE_URL="$MIGRATE_URL" npx prisma migrate deploy --config prisma7.config.ts

echo "==> switching 'current' symlink -> $TS"
ln -sfn "$REL" "$ROOT/current"

echo "==> restarting service"
sudo systemctl restart "$SERVICE"

echo "==> health check on port $PORT"
if ! curl -fsS --retry 10 --retry-delay 2 --retry-connrefused "http://127.0.0.1:$PORT/health"; then
  echo
  echo "!! health check failed (database migrations are NOT reverted)"
  if [ -n "$PREVIOUS" ] && [ -d "$PREVIOUS" ]; then
    echo "!! rolling back to $(basename "$PREVIOUS")"
    ln -sfn "$PREVIOUS" "$ROOT/current"
    sudo systemctl restart "$SERVICE"
  fi
  exit 1
fi
echo

echo "==> pruning old releases (keeping last $KEEP)"
ls -1dt "$ROOT"/releases/*/ | tail -n +$((KEEP + 1)) | xargs -r rm -rf

echo "==> deployed $TS"
