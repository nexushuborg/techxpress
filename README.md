# TechXpress

One repo, one website:

| Path | App | Folder |
|---|---|---|
| `/` | Train experience (animated story landing site) | [apps/site](apps/site) |
| `/login`, `/dashboard`, `/teams`, `/admin`, … | VORTEX hackathon platform (frontend) | [apps/portal](apps/portal) |
| API | VORTEX backend: Express, Prisma, Socket.IO | [services/api](services/api) |

The frontend is one Cloudflare Worker ([wrangler.jsonc](wrangler.jsonc), [worker/index.js](worker/index.js)). The API runs on Google Cloud Run with Cloud SQL for PostgreSQL. Deployment and operations are in [docs/](docs).

## Local development

Needs Node 22 (see `.nvmrc`) and Docker.

```sh
npm run setup         # install all four packages
cp services/api/.env.example services/api/.env
npm run dev:api       # Postgres in Docker + API on :3001
npm run dev:site      # train site on :5173
npm run dev:portal    # portal on :5174 (proxies /api to :3001)
```

To test the production layout as one site:

```sh
npm run build:local   # dist/ (site) + dist/_app/ (portal shell)
npm run preview       # wrangler dev on :8787
```

## Documentation

| | |
|---|---|
| [docs/DEPLOY.md](docs/DEPLOY.md) | Hosting, first-time setup, releases, domain and email |
| [docs/RUNBOOK.md](docs/RUNBOOK.md) | Health checks, logs, rollback, incidents, launch-day steps |
| [docs/CREDENTIALS.md](docs/CREDENTIALS.md) | Accounts and where each secret lives (no values) |
| [infra/gcp/README.md](infra/gcp/README.md) | Google Cloud setup script |
| [docs/VORTEX.md](docs/VORTEX.md) | What the VORTEX platform does, and its code layout |

## License

[AGPL-3.0](LICENSE).
