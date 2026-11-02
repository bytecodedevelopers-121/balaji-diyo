#!/usr/bin/env bash
# Pulls latest main, rebuilds, migrates, and restarts all three apps on
# the VM. Run as the `deploy` user from /opt/boundless:
#   ./deploy/deploy.sh              # deploy everything
#   ./deploy/deploy.sh backend      # just the backend
#   ./deploy/deploy.sh frontend     # just the frontend
#   ./deploy/deploy.sh admin        # just the admin static build
#
# Assumes: repo already cloned at /opt/boundless, PM2 already running
# `pm2 start deploy/ecosystem.config.js` at least once, real .env files
# already in place in backend/ and frontend/ (never touched by this script).

set -euo pipefail

APP_ROOT="/opt/boundless"
TARGET="${1:-all}"

cd "$APP_ROOT"
echo "[$(date -Iseconds)] git pull..."
git pull origin main

deploy_backend() {
  echo "[$(date -Iseconds)] Deploying backend..."
  cd "$APP_ROOT/backend"
  npm ci
  npx prisma migrate deploy
  npm run build
  pm2 restart boundless-backend
  cd "$APP_ROOT"
}

deploy_frontend() {
  echo "[$(date -Iseconds)] Deploying frontend..."
  cd "$APP_ROOT/frontend"
  npm ci
  npm run build
  pm2 restart boundless-frontend
  cd "$APP_ROOT"
}

deploy_admin() {
  echo "[$(date -Iseconds)] Deploying admin..."
  cd "$APP_ROOT/frontend-admin"
  npm ci
  npm run build
  cd "$APP_ROOT"
  # dist/ is served directly by Nginx — nothing to restart, but reload
  # picks up any nginx config changes if you also edited those.
  sudo systemctl reload nginx
}

case "$TARGET" in
  backend)  deploy_backend ;;
  frontend) deploy_frontend ;;
  admin)    deploy_admin ;;
  all)
    deploy_backend
    deploy_frontend
    deploy_admin
    ;;
  *)
    echo "Unknown target: $TARGET (expected backend|frontend|admin|all)" >&2
    exit 1
    ;;
esac

pm2 save
echo "[$(date -Iseconds)] Deploy complete."
