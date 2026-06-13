# build stage
FROM node:22-alpine AS build
WORKDIR /repo
ENV CI=true
ENV TURBO_TELEMETRY_DISABLED=1

# Copy workspace configuration and dependencies locks
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc turbo.json ./
COPY packages ./packages
COPY apps/api-gateway ./apps/api-gateway

# Install dependencies using filters and compile the gateway
RUN corepack enable && pnpm install --filter ...api-gateway --frozen-lockfile
RUN npx turbo run build --filter=api-gateway

# runtime stage
FROM node:22-alpine AS runtime
WORKDIR /repo
ENV NODE_ENV=production

# Copy node_modules and built packages to preserve workspace symbolic links
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/packages ./packages
COPY --from=build /repo/apps/api-gateway/node_modules ./apps/api-gateway/node_modules
COPY --from=build /repo/apps/api-gateway/dist ./apps/api-gateway/dist
COPY --from=build /repo/apps/api-gateway/package.json ./apps/api-gateway/package.json

WORKDIR /repo/apps/api-gateway
EXPOSE 4000
USER node
CMD ["node", "dist/server.js"]
