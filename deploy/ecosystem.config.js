// PM2 process file for the backend + frontend on the production VM.
//
// Usage (from /opt/boundless, or wherever this repo is checked out on
// the VM — adjust APP_ROOT below to match):
//   pm2 start deploy/ecosystem.config.js
//   pm2 save                # persist the process list
//   pm2 startup              # print + run the systemd hook so PM2 (and
//                              these apps) come back up after a reboot
//
// The admin panel (frontend-admin) is NOT listed here — it's a static
// Vite build served directly by Nginx, no Node process to supervise.
//
// Env vars: the backend loads `backend/.env` itself via `dotenv/config`
// (see backend/src/config/env.ts), and Next.js loads `frontend/.env.production`
// automatically — so PM2 doesn't need to inject env vars here. Just make
// sure both real .env files exist on the VM (never committed) before
// starting these, and that backend/.env's ALLOWED_ORIGINS includes
// https://boundlessadventure.com (+ www + admin subdomain) — see
// backend/src/config/cors.ts.

const APP_ROOT = "/opt/boundless";

module.exports = {
  apps: [
    {
      name: "boundless-backend",
      cwd: `${APP_ROOT}/backend`,
      script: "dist/server.js",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "400M",
      env: { NODE_ENV: "production" },
    },
    {
      name: "boundless-frontend",
      cwd: `${APP_ROOT}/frontend`,
      script: "node_modules/.bin/next",
      args: "start -p 3000",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "500M",
      env: { NODE_ENV: "production" },
    },
  ],
};
