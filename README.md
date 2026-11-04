# Joyful Trekking

Website for Joyful Trekking Pvt. Ltd., a Kathmandu-based trekking, tour and travel company.

## Project structure


| Folder | What it is |
| --- | --- |
| `frontend/` | Public website (Next.js, React, Tailwind CSS) |
| `frontend-admin/` | Admin panel for managing content (Vite, React) |
| `backend/` | API server (Node.js, TypeScript, Prisma) |
| `deploy/` | Deployment scripts, PM2 config and nginx config (see `deploy/README.md`) |

## Getting started

Each part is installed and run on its own. You need Node.js and npm.

### Backend

```bash
cd backend
npm install
npm run dev        # starts the API with auto-reload
```

Copy your environment settings into a `.env` file in `backend/` first. Database commands: `npm run prisma:migrate` and `npm run prisma:studio`.

### Frontend (website)

```bash
cd frontend
npm install
npm run dev        # http://localhost:3000
```

Other scripts: `npm run build`, `npm run lint`, `npm run typecheck`, `npm test`.

### Admin panel

```bash
cd frontend-admin
npm install
npm run dev
```

## Deployment

See [deploy/README.md](deploy/README.md).
