# Deployment

How Resumatch ships to production on **Coolify**. Both apps deploy from one
`docker-compose.yaml` as a single resource.

> Live: <http://resumatch.178.105.39.91.sslip.io> (Coolify-generated `sslip.io`
> domain; swap in a real domain when we have one).

## How it's wired

- **`backend`** — the Express API. No public domain; reached only internally.
- **`frontend`** — nginx serving the Vite build, reverse-proxying `/api/` to
  `http://backend:3000` over the compose network (see `frontend/nginx.conf`).

Because nginx proxies `/api`, the browser only ever talks to one origin — no CORS,
no public backend URL, and the frontend keeps calling relative `/api/...` exactly
as it does behind the Vite dev proxy.

Each service builds from its own Dockerfile (`backend/Dockerfile`,
`frontend/Dockerfile`) with the **repo root** as build context, because both are
npm-workspaces packages that need the root lockfile and the `shared` workspace.
The images pin **node 24.16.0** (matching `mise.toml`/Volta); the bundled npm is
fine because `package-lock.json` is complete, so `npm ci` reproduces it on any
recent npm.

## Test locally before you push

Coolify builds exactly this compose file, so verify it locally first. The one
addition is temporarily publishing the frontend port (Coolify maps a domain
instead):

```bash
# throwaway override — do NOT commit
cat > docker-compose.local.yml <<'EOF'
services:
  frontend:
    ports:
      - "8080:80"
EOF

docker compose -f docker-compose.yaml -f docker-compose.local.yml up --build
```

In another terminal:

```bash
curl -i http://localhost:8080/ | head -n 1                    # 200 OK
curl http://localhost:8080/api/health                          # {"status":"ok",...}
curl -X POST http://localhost:8080/api/games \
  -H 'content-type: application/json' -d '{"password":"x"}'    # {"gameId":...}
curl -o /dev/null -w "%{http_code}\n" http://localhost:8080/host  # 200
```

Best check: open <http://localhost:8080>, create a game as host, join from an
incognito window, play through. Tear down with
`docker compose -f docker-compose.yaml -f docker-compose.local.yml down` and
`rm docker-compose.local.yml`.

## Deploy on Coolify

1. **Connect the repo** (one-time): Coolify → **Sources** → install the Coolify
   **GitHub App** on `japostadan/Resumatch` (or add it as a public repo).
2. Open/create a **Project → Environment** (e.g. `production`).
3. **+ New → Resource** → the GitHub source → repo `japostadan/Resumatch`, and the
   **branch** to deploy.
4. **Build Pack → Docker Compose**, **Docker Compose Location** `/docker-compose.yaml`.
   Coolify parses the file and shows both services.
5. On **`frontend`**, set the **Domain / FQDN**. With a real domain, point an
   **A record** at the Coolify server IP and enter `https://<domain>` — Coolify
   provisions Let's Encrypt TLS. Otherwise use the generated `*.sslip.io` URL.
   Leave **`backend`** with **no domain**.
6. **Deploy.** When `backend` is **healthy** and `frontend` is running, open the
   domain and play through a game.

Coolify installs a webhook, so pushes to the deployed branch redeploy
automatically. Point it at `main` for the production deployment.

## Verify in production

- `https://<domain>/` loads the app.
- `https://<domain>/api/health` returns `{"status":"ok",...}`.
- Create + join a game across two browser sessions.

The backend is **in-memory only** — a redeploy or restart drops any active game,
and players start a new one. No database addon or environment variables required.

## Troubleshooting

| Symptom                                               | Cause / fix                                                                                                                                            |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Build fails: `Missing: yaml@2.9.0 from lock file`     | `package-lock.json` drifted (a dep changed without regenerating the lock with npm 11.13.0). Run `npm install` with the pinned npm and commit the lock. |
| Build fails: `Cannot find module '@resumatch/shared'` | `shared/dist` not emitted; a stale `*.tsbuildinfo` leaked into the context. Ensure `.dockerignore` has `**/*.tsbuildinfo`.                             |
| `/api/*` → 502                                        | nginx can't reach the backend. Check backend logs and that the service is named `backend`.                                                             |
| `/api/*` → HTML/404                                   | Request fell through to the SPA fallback. Check the `location /api/` block in `frontend/nginx.conf`.                                                   |
| TLS not issued                                        | The domain's A record isn't pointing at the Coolify server yet, or DNS hasn't propagated.                                                              |
