# syntax=docker/dockerfile:1

# The frontend is one package in an npm-workspaces monorepo, so the build context
# is the repo root: the Vite build resolves the shared workspace from its source
# (aliased to shared/src). Build from the repo root:
#   docker build -f frontend/Dockerfile .

# Pin node to the toolchain in mise.toml/Volta and npm to the version that
# authored package-lock.json, so `npm ci` stays reproducible. A newer npm
# resolves optional deps differently and rejects the committed lockfile.
FROM node:24.16.0-alpine AS builder
WORKDIR /app
RUN npm install -g npm@11.6.2

COPY package.json package-lock.json ./
COPY shared/package.json shared/package.json
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
# --ignore-scripts: source isn't copied yet, so skip the shared "prepare" build
# here; the frontend build below resolves shared from its source via the alias.
RUN npm ci --ignore-scripts

COPY shared/ shared/
COPY frontend/ frontend/
RUN npm run build --prefix frontend

FROM nginx:1.27-alpine AS runtime
# nginx serves the static build and reverse-proxies /api to the backend service
# over the compose network, so the browser only ever talks to one origin.
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/frontend/dist /usr/share/nginx/html
EXPOSE 80
