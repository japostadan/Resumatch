# syntax=docker/dockerfile:1

# The backend is one package in an npm-workspaces monorepo, so the build context
# is the repo root: it needs the root lockfile and the shared workspace (which is
# types-only) to compile. Build from the repo root:
#   docker build -f backend/Dockerfile .

# Pin node to the toolchain in mise.toml/Volta and npm to the version that
# authored package-lock.json, so `npm ci` stays reproducible. A newer npm
# resolves optional deps differently and rejects the committed lockfile.
FROM node:24.16.0-alpine AS builder
WORKDIR /app
RUN npm install -g npm@11.6.2

# Install dependencies from the workspace manifests first so this layer is cached
# until a package.json or the lockfile actually changes.
COPY package.json package-lock.json ./
COPY shared/package.json shared/package.json
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
# --ignore-scripts: source isn't copied yet, so skip the shared "prepare" build
# here; the explicit build step below compiles it once the source is in place.
RUN npm ci --ignore-scripts

# Build the shared declarations first (backend consumes them from shared/dist),
# then compile the backend into backend/dist.
COPY shared/ shared/
COPY backend/ backend/
RUN npm run build --prefix shared && npm run build --prefix backend

# Drop devDependencies so only runtime deps are carried into the final image.
# --ignore-scripts: don't re-run the shared "prepare" build (its tsc is a
# devDependency being pruned away); dist is already built above.
RUN npm prune --omit=dev --ignore-scripts

FROM node:24.16.0-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/package.json ./backend/package.json
# Keep the shared workspace directory so its node_modules symlink resolves.
COPY --from=builder /app/shared/package.json ./shared/package.json

EXPOSE 3000
CMD ["node", "backend/dist/index.js"]
