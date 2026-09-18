FROM node:22.8.0 AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY src/ ./src/
COPY \
    eslint.config.mjs \
    nest-cli.json \
    tsconfig.build.json \
    tsconfig.json \
    ./
RUN npm run build

RUN npm prune --omit=dev \
    && npm cache clean --force


FROM node:22.8.0-alpine
RUN addgroup -S appgroup && adduser -H -D -S appuser -G appgroup
USER appuser
WORKDIR /app

COPY --from=builder --chown=appuser:appuser /app/package*.json ./
COPY --from=builder --chown=appuser:appuser /app/node_modules/ ./node_modules/
COPY --from=builder --chown=appuser:appuser /app/dist/ ./dist/

EXPOSE 3000

ENTRYPOINT ["node", "dist/main"]
