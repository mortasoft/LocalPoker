# Stage 1: Build the application
FROM node:22-slim AS builder
WORKDIR /usr/src/app

# Instalar dependencias necesarias para compilar módulos nativos de C++
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

# Copiar configuración y código fuente
COPY tsconfig.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma
COPY src ./src

# Generar el cliente Prisma y compilar TypeScript
RUN npx prisma generate
RUN npm run build

# Stage 2: Production runner
FROM node:22-slim
WORKDIR /usr/src/app

# Instalar openssl para evitar warnings y fallos de Prisma Engine en tiempo de ejecución
RUN apt-get update && apt-get install -y \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Copiar artefactos construidos y dependencias desde el constructor
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/prisma ./prisma
COPY --from=builder /usr/src/app/prisma.config.ts ./
COPY --from=builder /usr/src/app/tsconfig.json ./

# Copiar la carpeta de archivos estáticos para pruebas
COPY public ./public

EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000
ENV DATABASE_URL="file:/usr/src/app/data/poker.db"

# Crear directorio de datos para la persistencia del volumen SQLite
RUN mkdir -p /usr/src/app/data

# Ejecutar las migraciones pendientes en el arranque y levantar el servidor
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
