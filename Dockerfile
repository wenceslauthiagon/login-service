FROM node:22.22.3-alpine AS builder
RUN apk add --no-cache openssl
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
COPY prisma ./prisma
RUN npx prisma generate
RUN npm run build

RUN npm cache clean --force


FROM node:22.22.3-alpine
RUN apk add --no-cache openssl
RUN addgroup -S appgroup && adduser -H -D -S appuser -G appgroup
USER appuser
WORKDIR /app

COPY --from=builder --chown=appuser:appuser /app/package*.json ./
COPY --from=builder --chown=appuser:appuser /app/node_modules/ ./node_modules/
COPY --from=builder --chown=appuser:appuser /app/dist/ ./dist/

EXPOSE 3000

ENTRYPOINT ["node", "dist/main"]
