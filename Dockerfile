FROM node:24-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build

FROM node:24-alpine AS runner
WORKDIR /app

COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps

COPY --from=builder /app/dist ./dist
RUN adduser -S nestuser

RUN chown -R nestuser /app
USER nestuser

EXPOSE 3000

CMD ["node", "dist/main"]