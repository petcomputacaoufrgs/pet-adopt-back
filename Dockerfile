# --- Estágio 1: Build ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copia arquivos de dependência
COPY package*.json ./

# Instala todas as dependências (incluindo devDependencies para o build)
RUN npm ci

# Copia o código fonte
COPY . .

# Gera a pasta dist
RUN npm run build

# --- Estágio 2: Produção ---
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV production

# Copia package.json para instalar apenas dependências de prod
COPY package*.json ./

# Instala apenas dependências de produção (mais leve)
RUN npm ci --only=production

# Copia o código compilado do estágio anterior
COPY --from=builder /app/dist ./dist

# Cria a pasta uploads
RUN mkdir -p /app/uploads


EXPOSE 3002

# Comando de inicialização
CMD ["node", "dist/main"]