FROM node:22-alpine AS build
RUN npm install -g pnpm@10.29.3
WORKDIR /repo

# Manifests first, so the dependency layer is cached until a manifest changes.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/shell/package.json apps/shell/
COPY apps/people/package.json apps/people/
COPY apps/delivery/package.json apps/delivery/
COPY packages/domain/package.json packages/domain/
COPY packages/contracts/package.json packages/contracts/
COPY packages/fixtures/package.json packages/fixtures/
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm verify && pnpm build

  # shell
  FROM nginx:alpine AS shell
  COPY docker/nginx.shell.conf /etc/nginx/conf.d/default.conf
  COPY docker/write-shell-config.sh /docker-entrypoint.d/40-write-shell-config.sh
  RUN chmod +x /docker-entrypoint.d/40-write-shell-config.sh
  COPY --from=build /repo/apps/shell/dist /usr/share/nginx/html

  # people
  FROM nginx:alpine AS people
  COPY docker/nginx.remote.conf /etc/nginx/conf.d/default.conf
  COPY --from=build /repo/apps/people/dist /usr/share/nginx/html

  # delivery
  FROM nginx:alpine AS delivery
  COPY docker/nginx.remote.conf /etc/nginx/conf.d/default.conf
  COPY --from=build /repo/apps/delivery/dist /usr/share/nginx/html