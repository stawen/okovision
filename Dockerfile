FROM node:26.13.0-bookworm-slim AS build
WORKDIR /app
COPY .npmrc package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build

FROM node:26.13.0-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000
COPY .npmrc package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY --from=build --chown=node:node /app/build ./build
COPY --from=build --chown=node:node /app/src/lib/server/database.ts ./src/lib/server/database.ts
COPY --from=build --chown=node:node /app/scripts/check-db.ts ./scripts/check-db.ts
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
	CMD node --input-type=module -e "const r = await fetch('http://127.0.0.1:3000/api/v1/health'); process.exit(r.ok ? 0 : 1)"
CMD ["node", "build"]
