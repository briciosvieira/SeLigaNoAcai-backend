FROM node:22-alpine

# python3 + make + g++ compilam os bindings nativos do bcrypt
# dumb-init garante tratamento correto de sinais Unix (SIGTERM, etc.)
RUN apk add --no-cache python3 make g++ dumb-init

WORKDIR /app

# Instala dependências antes de copiar o fonte para aproveitar cache do Docker
COPY package*.json ./
RUN npm ci

# Copia o restante do projeto (respeitando .dockerignore)
COPY . .

# Gera o Prisma Client a partir do schema
RUN npx prisma generate --no-check-order

# Compila o TypeScript para JavaScript
RUN npm run build

# Garante que as pastas de upload existam
RUN mkdir -p uploads/products uploads/store

RUN chmod +x entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["dumb-init", "--", "/app/entrypoint.sh"]
