# Deploying Boundless to the Lightsail VM (PM2, self-hosted Postgres, local uploads)

Everything runs on one Ubuntu VM: native Postgres, local disk uploads, PM2
supervising the backend + frontend Node processes, Nginx as the only
public-facing thing. No Docker, no managed AWS services — the VM is
treated the same way as a local dev machine.

The Next.js frontend (`frontend/`) was briefly deployed on Vercel — moved
back to this VM due to Vercel plan limits. If a Vercel project/domain is
still configured from that attempt, remove `boundlessadventure.com`/`www`
from it (or just stop using it) once this VM is serving them instead, so
the two don't fight over DNS.

Run the numbered steps once, by hand, to bring the VM up. After that,
`./deploy.sh` handles every future update.

## 0. Baseline packages

```bash
sudo apt update && sudo apt upgrade -y
sudo adduser deploy && sudo usermod -aG sudo deploy   # don't deploy as root/ubuntu
sudo apt install -y nginx postgresql postgresql-contrib certbot python3-certbot-nginx git

# Node 20 LTS (via NodeSource) + PM2
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2

sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```
Then in the Lightsail console's networking tab, restrict SSH (22) to your IP.

## 1. Postgres (native, local-only)

```bash
sudo -u postgres createuser --pwprompt erp_user
sudo -u postgres createdb -O erp_user boundless
```
Postgres binds to `localhost` only by default — leave it that way, never
expose 5432 externally. Confirm with `sudo ss -tlnp | grep 5432`.

For `deploy/backup.sh` to run `pg_dump` without a password prompt, add a
`~/.pgpass` for the `deploy` user:
```bash
echo "localhost:5432:boundless:erp_user:<the real password>" > ~/.pgpass
chmod 600 ~/.pgpass
```

## 2. Clone the repo + real env files

```bash
sudo mkdir -p /opt/boundless && sudo chown deploy:deploy /opt/boundless
git clone <your-repo-url> /opt/boundless
cd /opt/boundless
```
Create these directly on the VM (copy from each app's `.env.example`,
fill in real production values). **Never commit any of these.**

- `backend/.env` — PACO live keys, SMTP creds, JWT secrets, `DATABASE_URL`
  pointing at the `erp_user`/`boundless` DB above, and `ALLOWED_ORIGINS`
  set to `https://boundlessadventure.com,https://www.boundlessadventure.com,https://admin.boundlessadventure.com`
  (comma-separated, no spaces — see `backend/src/config/cors.ts`; without
  this, the browser gets CORS errors calling the API).
- `frontend/.env.production` — `NEXT_PUBLIC_SITE_URL=https://boundlessadventure.com`,
  `NEXT_PUBLIC_API_URL=https://api.boundlessadventure.com/api`,
  `API_URL=https://api.boundlessadventure.com/api`,
  `NEXT_PUBLIC_APP_ENV=production`, real Turnstile site key, and
  `REVALIDATION_SECRET` matching the backend's.
- `frontend-admin/.env.production` — just `VITE_API_URL=https://api.boundlessadventure.com/api`.
  (Its `.env.example` also lists `VITE_SUPABASE_*` vars — checked, they're
  dead: the only component using Supabase isn't imported anywhere in the
  app. The real upload path is `MediaUrlField`, which goes through the
  backend. Skip Supabase entirely.)

## 3. First build + schema

```bash
cd backend && npm ci && npx prisma migrate deploy && npm run build && cd ..
cd frontend && npm ci && npm run build && cd ..
cd frontend-admin && npm ci && npm run build && cd ..
```

## 4. Start under PM2

```bash
pm2 start deploy/ecosystem.config.js
pm2 save
pm2 startup   # run the printed systemd command so PM2 survives reboots
```

## 5. Nginx + TLS

```bash
sudo cp deploy/nginx/boundless.conf /etc/nginx/sites-available/boundless
sudo ln -s /etc/nginx/sites-available/boundless /etc/nginx/sites-enabled/
sudo htpasswd -c /etc/nginx/.htpasswd-admin <admin-username>   # admin panel lock
sudo nginx -t && sudo systemctl reload nginx

sudo certbot --nginx \
  -d boundlessadventure.com -d www.boundlessadventure.com \
  -d api.boundlessadventure.com -d admin.boundlessadventure.com
```
(Swap in the real domain first if it isn't `boundlessadventure.com` —
edit `deploy/nginx/boundless.conf` before copying it. All four DNS
records need to already point at this VM's IP in Cloudflare, DNS-only/
grey-cloud, before certbot can issue for them — request certs one
subdomain at a time as each record goes live if they're not all ready yet.)

## 6. Backups

```bash
sudo mkdir -p /opt/backups && sudo chown deploy:deploy /opt/backups
chmod +x deploy/backup.sh
crontab -e
# add:
0 2 * * * /opt/boundless/deploy/backup.sh >> /var/log/boundless-backup.log 2>&1
```
Run it once by hand first (`./deploy/backup.sh`) to confirm it actually
works before trusting the cron.

## Ongoing deploys

```bash
cd /opt/boundless
./deploy/deploy.sh          # everything
./deploy/deploy.sh backend  # just one app
```

## Go-live checklist

- [ ] `ufw status` / Lightsail firewall: only 22 (your IP), 80, 443 open
- [ ] Postgres unreachable from outside the VM
- [ ] Real `.env` values in place on all three apps, nothing left as a dev/test placeholder
- [ ] `certbot renew --dry-run` succeeds
- [ ] `./deploy/backup.sh` run manually once, files actually appear in `/opt/backups`
- [ ] `pm2 startup` + a real `sudo reboot` test — both PM2 apps come back on their own
- [ ] Domain removed/unused in the Vercel project, so it can't reclaim the DNS
