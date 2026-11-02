#!/usr/bin/env bash
# Nightly backup for the self-hosted Postgres DB + the local uploads folder.
# There is no managed-DB automated backup in this setup — this script IS
# the backup story, so treat it as load-bearing.
#
# Install as a cron job (as the `deploy` user, so it can read backend/.env
# and the uploads folder without sudo):
#   crontab -e
#   0 2 * * *  /opt/boundless/deploy/backup.sh >> /var/log/boundless-backup.log 2>&1
#
# Optionally sync BACKUP_DIR off-box afterwards (S3 / Lightsail Bucket /
# another host) — a same-disk backup doesn't survive a disk failure.

set -euo pipefail

APP_ROOT="/opt/boundless"
BACKUP_DIR="/opt/backups"
KEEP_DAYS=14
DATE="$(date +%F)"

PG_DB="boundless"
PG_USER="erp_user"

mkdir -p "$BACKUP_DIR"

echo "[$(date -Iseconds)] Starting backup..."

# ── Database dump ───────────────────────────────────────────────────────────
pg_dump -U "$PG_USER" -h localhost "$PG_DB" | gzip > "$BACKUP_DIR/db-$DATE.sql.gz"
echo "  DB dump: $BACKUP_DIR/db-$DATE.sql.gz"

# ── Uploads folder ──────────────────────────────────────────────────────────
tar czf "$BACKUP_DIR/uploads-$DATE.tar.gz" -C "$APP_ROOT/backend" uploads
echo "  Uploads archive: $BACKUP_DIR/uploads-$DATE.tar.gz"

# ── Prune anything older than KEEP_DAYS ─────────────────────────────────────
find "$BACKUP_DIR" -name "db-*.sql.gz" -mtime +"$KEEP_DAYS" -delete
find "$BACKUP_DIR" -name "uploads-*.tar.gz" -mtime +"$KEEP_DAYS" -delete

echo "[$(date -Iseconds)] Backup complete."

# ── Off-box copy (uncomment + configure once you have a target) ───────────
# aws s3 sync "$BACKUP_DIR" s3://your-backup-bucket/boundless/ --only-show-errors
