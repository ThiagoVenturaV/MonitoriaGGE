#!/bin/bash
# ==============================================================================
# SCRIPT DE USER-DATA (CLOUD-INIT) PARA INSTÂNCIA DE FALLBACK NA DIGITALOCEAN
# Executado automaticamente assim que a nova Droplet é ligada.
# ==============================================================================

set -e

# Logging de execução
exec > >(tee -a /var/log/cloud-init-failover.log) 2>&1
echo "=== INICIANDO CONFIGURAÇÃO AUTOMÁTICA DO FALLBACK DA DIGITALOCEAN: $(date) ==="

# 1. Atualizar pacotes do sistema
apt-get update -y
apt-get install -y curl git ufw ca-certificates gnupg lsb-release

# 2. Instalar Docker e Docker Compose Plugin
if ! command -v docker &> /dev/null; then
    echo "Instalando Docker..."
    mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /null
    apt-get update -y
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    systemctl enable docker
    systemctl start docker
fi

# 3. Configurar Firewall Básico (UFW)
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# 4. Criar diretório da aplicação e baixar configurações
mkdir -p /opt/app
cd /opt/app

# [CONFIGURAÇÃO DO BACKEND DOCKERIZADO]
# Substitua o comando abaixo para clonar seu repositório ou dar pull na imagem Docker do seu registro (ex: Docker Hub / GHCR)
cat << 'EOF' > /opt/app/docker-compose.yml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    container_name: fallback_nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    restart: always
    depends_on:
      - api

  api:
    image: node:18-alpine # Substitua pelo nome da sua imagem compilada ou repositório
    container_name: fallback_api
    command: sh -c "echo 'Iniciando API Fallback...' && node -e 'const http = require(\"http\"); http.createServer((req, res) => { if(req.url === \"/health\") { res.writeHead(200); res.end(\"OK - DigitalOcean Fallback\"); } else { res.writeHead(200); res.end(\"Resposta da API em Contingencia (DigitalOcean)\"); } }).listen(3000);'"
    environment:
      - NODE_ENV=production
      - PORT=3000
      # As variáveis do Supabase/Neon e R2 serão passadas aqui ou via .env
      - DATABASE_URL=${DATABASE_URL}
      - R2_ACCESS_KEY_ID=${R2_ACCESS_KEY_ID}
      - R2_SECRET_ACCESS_KEY=${R2_SECRET_ACCESS_KEY}
    restart: always
EOF

# Configuração minimalista do Nginx
cat << 'EOF' > /opt/app/nginx.conf
events {
    worker_connections 1024;
}

http {
    # Permite extrair o IP real do cliente vindo do Cloudflare
    set_real_ip_from 103.21.244.0/22;
    set_real_ip_from 103.22.200.0/22;
    set_real_ip_from 103.31.4.0/22;
    set_real_ip_from 141.101.64.0/18;
    set_real_ip_from 108.162.192.0/18;
    set_real_ip_from 190.93.240.0/20;
    set_real_ip_from 188.114.96.0/20;
    set_real_ip_from 197.234.240.0/22;
    set_real_ip_from 198.41.128.0/17;
    set_real_ip_from 162.158.0.0/15;
    set_real_ip_from 172.64.0.0/13;
    set_real_ip_from 131.0.72.0/22;
    real_ip_header CF-Connecting-IP;

    server {
        listen 80;
        server_name _;

        location / {
            proxy_pass http://api:3000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
EOF

# 5. Iniciar Serviços no Docker
echo "Subindo containers no Docker Compose..."
docker compose up -d

echo "=== CONFIGURAÇÃO DO FALLBACK CONCLUÍDA COM SUCESSO: $(date) ==="
