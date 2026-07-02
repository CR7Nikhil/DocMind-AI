FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build 2>/dev/null || true

FROM node:18-alpine
WORKDIR /app
RUN apk add --no-cache wget openssl openssl-dev
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY . .
RUN npx prisma generate
RUN mkdir -p uploads

EXPOSE 5000
CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]
