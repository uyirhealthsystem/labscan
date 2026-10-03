#!/usr/bin/env bash
# Runs ON the EC2 instance. Uploaded and executed by .github/workflows/ci-cd.yml.
# Works on Amazon Linux 2023 / RHEL-family (dnf/yum) and Ubuntu/Debian (apt).
#
# Expected env (exported by the workflow):
#   APP_DIR      install dir (default: $HOME/labscan)
#   REPO         owner/name on GitHub
#   BRANCH       branch to deploy
#   GH_TOKEN     short-lived token used for clone/fetch (never written to disk)
#   APP_ENV_B64  base64 of the production .env file
set -euo pipefail

APP_DIR=${APP_DIR:-$HOME/labscan}
PRISMA_CONFIG=prisma7.config.ts
RUN_USER=$(id -un)

log() { echo "==> $*"; }

# ---------------------------------------------------------------------------
# 1. Bootstrap the machine (idempotent; skipped once everything is installed)
# ---------------------------------------------------------------------------
if command -v apt-get >/dev/null 2>&1; then PKG=apt
elif command -v dnf >/dev/null 2>&1; then PKG=dnf
elif command -v yum >/dev/null 2>&1; then PKG=yum
else echo "Unsupported Linux distro: need apt-get, dnf or yum" >&2; exit 1
fi

install_pkgs() {
  if [ "$PKG" = apt ]; then
    sudo apt-get update -y
    sudo DEBIAN_FRONTEND=noninteractive apt-get install -y "$@"
  else
    sudo "$PKG" install -y "$@"
  fi
}

command -v git >/dev/null 2>&1 || { log "Installing git"; install_pkgs git; }

node_major=$(node -v 2>/dev/null | sed -E 's/^v([0-9]+).*/\1/' || true)
if [ "${node_major:-0}" -lt 22 ]; then
  log "Installing Node.js 22"
  if [ "$PKG" = apt ]; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  else
    curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -
  fi
  install_pkgs nodejs
fi

if ! command -v pm2 >/dev/null 2>&1; then
  log "Installing PM2"
  sudo npm install -g pm2
fi

# Register PM2 with systemd so the app comes back after a reboot.
if [ ! -f "/etc/systemd/system/pm2-${RUN_USER}.service" ]; then
  log "Registering PM2 startup service"
  sudo env PATH="$PATH" "$(command -v pm2)" startup systemd -u "$RUN_USER" --hp "$HOME"
fi

# ---------------------------------------------------------------------------
# 2. Fetch code
# ---------------------------------------------------------------------------
AUTH_URL="https://x-access-token:${GH_TOKEN}@github.com/${REPO}.git"

if [ ! -d "$APP_DIR/.git" ]; then
  log "Cloning $REPO into $APP_DIR"
  mkdir -p "$(dirname "$APP_DIR")"
  git clone --branch "$BRANCH" "$AUTH_URL" "$APP_DIR"
  # Don't leave the token in .git/config.
  git -C "$APP_DIR" remote set-url origin "https://github.com/${REPO}.git"
fi

cd "$APP_DIR"
PREV_SHA=$(git rev-parse HEAD)
git fetch --quiet "$AUTH_URL" "$BRANCH"
git reset --hard FETCH_HEAD
NEW_SHA=$(git rev-parse HEAD)
log "Deploying $NEW_SHA (previous: $PREV_SHA)"

# ---------------------------------------------------------------------------
# 3. Write .env (the APP_ENV_FILE secret is the source of truth)
# ---------------------------------------------------------------------------
if [ -n "${APP_ENV_B64:-}" ]; then
  (umask 077 && printf '%s' "$APP_ENV_B64" | base64 -d > .env)
elif [ ! -f .env ]; then
  echo "No APP_ENV_FILE secret and no existing .env on the server" >&2
  exit 1
fi

PORT=$(grep -E '^PORT=' .env | tail -n1 | cut -d= -f2- | tr -d "\"' \r")
PORT=${PORT:-8082}

# ---------------------------------------------------------------------------
# 4. Build + (re)start. Chained with && because `set -e` is ignored inside
#    functions called from an `if`.
# ---------------------------------------------------------------------------
build_and_start() {
  npm ci --include=dev &&
    npx prisma generate --config "$PRISMA_CONFIG" &&
    npx prisma migrate deploy --config "$PRISMA_CONFIG" &&
    npm run build &&
    pm2 startOrReload ecosystem.config.js --update-env &&
    pm2 save
}

healthy() {
  for _ in $(seq 1 15); do
    if curl -fsS "http://localhost:${PORT}/health" >/dev/null 2>&1; then
      return 0
    fi
    sleep 2
  done
  return 1
}

if build_and_start && healthy; then
  log "Deploy OK: $NEW_SHA is healthy on port $PORT"
  exit 0
fi

log "Deploy of $NEW_SHA FAILED"
pm2 logs labscan --lines 50 --nostream || true

if [ "$PREV_SHA" != "$NEW_SHA" ]; then
  log "Rolling back to $PREV_SHA (database migrations are NOT reverted)"
  git reset --hard "$PREV_SHA"
  if build_and_start && healthy; then
    log "Rollback OK"
  else
    log "Rollback ALSO failed - check 'pm2 logs labscan' on the server"
  fi
fi
exit 1
