#!/bin/bash
# ==============================================================================
# SCRIPT DE FAILBACK (RETORNO DO TRÁFEGO PARA O SERVIDOR PRIMÁRIO HOSTINGER)
# Execute este script quando o servidor primário (Hostinger) for restabelecido.
# ==============================================================================

set -e

# Carregar variáveis do arquivo .env
if [ -f "../.env" ]; then
    export $(cat ../.env | grep -v '#' | awk '/=/ {print $1}')
fi

PRIMARY_IP="${PRIMARY_SERVER_IP}"
CF_TOKEN="${CLOUDFLARE_API_TOKEN}"
ZONE_ID="${CLOUDFLARE_ZONE_ID}"
RECORD_ID="${CLOUDFLARE_DNS_RECORD_ID}"
DOMAIN="${DOMAIN_NAME}"
DO_TOKEN="${DIGITALOCEAN_TOKEN}"
DROPLET_NAME="${DO_DROPLET_NAME:-fallback-api-droplet}"

echo "========================================================"
echo "          INICIANDO PROCEDIMENTO DE FAILBACK            "
echo "========================================================"

if [ -z "$PRIMARY_IP" ] || [ -z "$CF_TOKEN" ] || [ -z "$ZONE_ID" ] || [ -z "$RECORD_ID" ] || [ -z "$DO_TOKEN" ]; then
    echo "❌ Erro: Variáveis obrigatórias não foram definidas no arquivo .env!"
    echo "Verifique PRIMARY_SERVER_IP, CLOUDFLARE_API_TOKEN, CLOUDFLARE_ZONE_ID, CLOUDFLARE_DNS_RECORD_ID e DIGITALOCEAN_TOKEN."
    exit 1
fi

# 1. Testar se o Servidor Primário está realmente respondendo
echo "1. Testando saúde do servidor primário (Hostinger IP: $PRIMARY_IP)..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "http://$PRIMARY_IP/health" || true)

if [ "$HTTP_STATUS" -ne 200 ]; then
    echo "⚠️ ATENÇÃO: O servidor primário retornou HTTP STATUS $HTTP_STATUS (esperado: 200)."
    read -p "Deseja forçar o failback mesmo assim? (y/N): " confirm
    if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
        echo "Cancelado pelo usuário."
        exit 1
    fi
else
    echo "✅ Servidor Primário está respondendo com HTTP 200 OK!"
fi

# 2. Retornar DNS Cloudflare para o IP Primário
echo "2. Atualizando DNS A na Cloudflare ($DOMAIN -> $PRIMARY_IP)..."
CF_RESPONSE=$(curl -s -X PUT "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records/$RECORD_ID" \
     -H "Authorization: Bearer $CF_TOKEN" \
     -H "Content-Type: application/json" \
     --data "{\"type\":\"A\",\"name\":\"$DOMAIN\",\"content\":\"$PRIMARY_IP\",\"ttl\":60,\"proxied\":true}")

CF_SUCCESS=$(echo "$CF_RESPONSE" | grep -o '"success":true' || true)

if [ -n "$CF_SUCCESS" ]; then
    echo "✅ DNS atualizado com sucesso! Tráfego direcionado de volta para a Hostinger."
else
    echo "❌ Erro ao atualizar o DNS na Cloudflare. Resposta:"
    echo "$CF_RESPONSE"
    exit 1
fi

# 3. Localizar e Deletar o Droplet de Fallback na DigitalOcean
echo "3. Buscando Droplet de Fallback na DigitalOcean ('$DROPLET_NAME')..."
DROPLET_ID=$(curl -s -X GET "https://api.digitalocean.com/v2/droplets?name=$DROPLET_NAME" \
     -H "Authorization: Bearer $DO_TOKEN" \
     -H "Content-Type: application/json" | grep -o '"id":[0-9]*' | head -n 1 | cut -d':' -f2 || true)

if [ -n "$DROPLET_ID" ]; then
    echo "Droplet de Fallback encontrado (ID: $DROPLET_ID). Deletando para encerrar cobrança..."
    DELETE_RES=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "https://api.digitalocean.com/v2/droplets/$DROPLET_ID" \
         -H "Authorization: Bearer $DO_TOKEN")
    if [ "$DELETE_RES" -eq 204 ]; then
        echo "✅ Droplet da DigitalOcean deletado com sucesso!"
    else
        echo "⚠️ Erro ao deletar o Droplet (HTTP $DELETE_RES). Verifique manualmente no painel da DigitalOcean."
    fi
else
    echo "ℹ️ Nenhum Droplet com o nome '$DROPLET_NAME' foi encontrado ativo."
fi

echo "========================================================"
echo "          FAILBACK CONCLUÍDO COM SUCESSO!               "
echo "========================================================"
