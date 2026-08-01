# 🚀 Guia Completo de Deploy & Configuração: Failover Hostinger → DigitalOcean

Este documento fornece as instruções passo a passo para implantar a infraestrutura de failover automático baseada em **Hostinger KVM 2 (Primário)**, **DigitalOcean (Fallback sob demanda)** e **Cloudflare Workers (Monitoramento & Automação)**.

---

## 📋 Pré-requisitos & Contas Necessárias

1. **Conta na Cloudflare**: Com o domínio (`seudominio.com`) apontado via DNS.
2. **Conta na DigitalOcean**: Para gerar o Token de API e provisionar os Droplets.
3. **Hostinger KVM 2**: Servidor VPS primário em São Paulo rodando Docker.
4. **Banco de Dados Gerenciado (PostgreSQL)**: Instância no Supabase ou Neon.
5. **Storage de Mídia (S3 compatível)**: Cloudflare R2 ou Backblaze B2.

---

## 🔑 Passo 1: Coletar Tokens e Identificadores

### A. Token e IDs da Cloudflare
1. Acesse o painel da Cloudflare e vá em **My Profile > API Tokens**.
2. Crie um Token com a permissão: `Zone.DNS (Edit)` para todas as zonas ou a zona específica.
3. Copie o **Zone ID**:
   - Vá na página principal do seu domínio no Cloudflare. Na barra lateral direita ("Overview"), copie o **Zone ID**.
4. Descubra o **DNS Record ID** do seu registro A (`api.seudominio.com`):
   - Execute no terminal (substituindo seu Token e Zone ID):
     ```bash
     curl -X GET "https://api.cloudflare.com/client/v4/zones/SEU_ZONE_ID/dns_records?name=api.seudominio.com" \
          -H "Authorization: Bearer SEU_CLOUDFLARE_API_TOKEN" \
          -H "Content-Type: application/json"
     ```
   - No JSON retornado, copie o valor do campo `"id"` dentro de `result[0]`.

### B. Personal Access Token da DigitalOcean
1. Acesse o painel da DigitalOcean > **API > Tokens/Keys**.
2. Clique em **Generate New Token**, selecione acesso de **Read & Write**.
3. Copie o Token gerado (`dop_v1_...`).

---

## 🛠️ Passo 2: Configurar o Servidor Primário (Hostinger KVM 2)

1. Acesse sua VPS Hostinger via SSH:
   ```bash
   ssh root@IP_DA_HOSTINGER
   ```
2. Clone o seu projeto e copie a pasta `docker/` e o arquivo `.env`:
   ```bash
   cp .env.example .env
   # Edite o arquivo .env preenchendo DATABASE_URL, R2_..., etc.
   nano .env
   ```
3. Suba a stack do servidor primário:
   ```bash
   cd docker
   docker compose up -d
   ```
4. Teste se o endpoint de saúde está respondendo localmente:
   ```bash
   curl http://localhost/health
   # Deve retornar 200 OK
   ```

---

## ⚡ Passo 3: Implantar o Cloudflare Worker (Monitoramento)

1. Na sua máquina local, navegue até a pasta `worker/`:
   ```bash
   cd failover-system/worker
   npm install
   ```

2. Atualize o arquivo `wrangler.toml` com seus dados fixos (URL de health check, Zone ID, Record ID e Domínio).

3. Converta o script `scripts/cloud-init.sh` para **Base64** (isso será enviado para a DigitalOcean ao criar a máquina):
   - **Linux/macOS**:
     ```bash
     base64 -w 0 ../scripts/cloud-init.sh
     ```
   - **Windows (PowerShell)**:
     ```powershell
     [Convert]::ToBase64String([System.IO.File]::ReadAllBytes("..\scripts\cloud-init.sh"))
     ```

4. Adicione as credenciais sensíveis (Secrets) no Cloudflare Worker via Wrangler:
   ```bash
   npx wrangler secret put CLOUDFLARE_API_TOKEN
   # Cole o Token da Cloudflare quando solicitado

   npx wrangler secret put DIGITALOCEAN_TOKEN
   # Cole o Token da DigitalOcean

   npx wrangler secret put CLOUD_INIT_BASE64
   # Cole a string em Base64 gerada no passo anterior

   npx wrangler secret put NOTIFICATION_WEBHOOK_URL
   # (Opcional) Cole a URL do Webhook do Discord/Telegram
   ```

5. Faça o Deploy do Worker:
   ```bash
   npx wrangler deploy
   ```

---

## 🧪 Passo 4: Teste de Simulação de Failover

1. **Simular Queda do Servidor Primário**:
   - Acesse sua VPS Hostinger e pare a API:
     ```bash
     docker stop hostinger_nginx hostinger_api
     ```

2. **Disparar a Verificação**:
   - O Worker será disparado automaticamente em até 1 minuto pelo Cron Trigger.
   - Ou acesse no seu navegador: `https://failover-monitor.SEU_SUBDOMINIO.workers.dev/test-check`

3. **Verificar os Resultados**:
   - Acesse o painel da **DigitalOcean** > Droplets: Uma nova instância chamada `fallback-api-droplet` estará em criação.
   - Acesse a **Cloudflare** > DNS: O registro A de `api.seudominio.com` terá sido alterado para o IP da nova Droplet.
   - Teste a API: Acesse `https://api.seudominio.com/health` e confirme que a resposta agora vem da DigitalOcean.

---

## 🔄 Passo 5: Executar o Failback (Retorno à Hostinger)

Quando a sua VPS Hostinger estiver recuperada e online novamente:

1. Suba os containers na Hostinger:
   ```bash
   docker compose up -d
   ```

2. Abra o terminal na pasta `scripts/` e execute o script de failback:
   ```bash
   cd failover-system/scripts
   bash failback.sh
   ```

3. O script irá:
   - Confirmar que a Hostinger está respondendo com HTTP 200 OK.
   - Atualizar o DNS A na Cloudflare de volta para o IP da Hostinger.
   - Deletar automaticamente o Droplet da DigitalOcean para pausar a cobrança.

---

## 🔐 Recomendações de Segurança
- Mantenha os Tokens de API guardados em cofre seguro de senhas.
- Configure o **Cloudflare Proxied (Nuvem Laranja)** no DNS para ocultar os IPs das suas VPSs contra ataques de DDoS diretos.
