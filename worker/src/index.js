/**
 * Cloudflare Worker: Health Check & Automated Failover (Hostinger -> DigitalOcean)
 */

export default {
  // Chamado via Cron Trigger (a cada 1 min) ou via HTTP para testes manuais
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runFailoverCheck(env));
  },

  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/test-check") {
      const result = await runFailoverCheck(env);
      return new Response(JSON.stringify(result, null, 2), {
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response("Cloudflare Failover Worker Ativo. Acesse /test-check para simular.", {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  },
};

async function runFailoverCheck(env) {
  const log = [];
  const addLog = (msg) => {
    console.log(`[FailoverWorker] ${msg}`);
    log.push(`${new Date().toISOString()} - ${msg}`);
  };

  addLog("Iniciando verificação de saúde da aplicação primária...");

  const isPrimaryHealthy = await checkUrlHealth(env.PRIMARY_HEALTH_CHECK_URL, 5000);

  if (isPrimaryHealthy) {
    addLog(`✅ Servidor Primário (${env.PRIMARY_HEALTH_CHECK_URL}) está ONLINE e saudável.`);
    return { status: "OK", primaryHealthy: true, log };
  }

  addLog(`❌ ALERTA: Servidor Primário (${env.PRIMARY_HEALTH_CHECK_URL}) NÃO respondeu ou retornou erro.`);

  // 1. Verificar se o DNS A da Cloudflare já aponta para um IP diferente do Primário (para evitar re-criacoes desnecessárias)
  const currentDns = await getCurrentDnsRecord(env);
  addLog(`IP atual no Cloudflare DNS (${env.DOMAIN_NAME}): ${currentDns.ip}`);

  // 2. Verificar se já existe um Droplet de Fallback ativo na DigitalOcean
  const existingDroplet = await findExistingDroplet(env);

  let fallbackIp = null;

  if (existingDroplet) {
    addLog(`ℹ️ Droplet de Fallback já existe na DigitalOcean (ID: ${existingDroplet.id}, Status: ${existingDroplet.status}).`);
    fallbackIp = getDropletPublicIp(existingDroplet);
  } else {
    addLog("🚀 Iniciando criação do Droplet de Contingência na DigitalOcean...");
    const newDroplet = await createDigitalOceanDroplet(env);
    
    if (!newDroplet) {
      addLog("❌ ERRO CRÍTICO: Falha ao solicitar a criação do Droplet na DigitalOcean.");
      await sendAlertNotification(env, "🚨 FAILOVER FALHOU: Erro ao criar Droplet na DigitalOcean!");
      return { status: "ERROR", error: "Failed to create Droplet", log };
    }

    addLog(`Droplet ${newDroplet.id} solicitado. Aguardando alocação de IP público...`);
    fallbackIp = await waitForDropletIp(env, newDroplet.id);
  }

  if (!fallbackIp) {
    addLog("❌ ERRO CRÍTICO: O Droplet de Fallback foi criado, mas não obtivemos o IP público em tempo hábil.");
    await sendAlertNotification(env, "🚨 FAILOVER INCOMPLETO: Droplet sem IP público!");
    return { status: "ERROR", error: "No IP assigned", log };
  }

  addLog(`📌 IP do Fallback obtido: ${fallbackIp}`);

  // 3. Atualizar DNS A da Cloudflare se o IP atual for diferente do IP do Fallback
  if (currentDns.ip !== fallbackIp) {
    addLog(`🔄 Atualizando DNS Cloudflare (${env.DOMAIN_NAME}) de ${currentDns.ip} para ${fallbackIp}...`);
    const dnsUpdated = await updateCloudflareDns(env, fallbackIp);

    if (dnsUpdated) {
      addLog("✅ DNS atualizado com sucesso no Cloudflare!");
      await sendAlertNotification(
        env,
        `⚠️ **FAILOVER EXECUTADO COM SUCESSO!**\n` +
        `- Servidor Primário: CAÍDO\n` +
        `- Novo IP de Contingência (DigitalOcean): \`${fallbackIp}\`\n` +
        `- Domínio \`${env.DOMAIN_NAME}\` redirecionado!`
      );
    } else {
      addLog("❌ ERRO ao atualizar registro DNS no Cloudflare.");
    }
  } else {
    addLog("ℹ️ DNS já está apontado para o IP de Contingência. Nenhuma alteração de DNS necessária.");
  }

  return { status: "FAILOVER_ACTIVE", fallbackIp, log };
}

// Helper: Verificação de Saúde HTTP com Timeout
async function checkUrlHealth(url, timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: { "User-Agent": "CloudflareWorker-HealthCheck/1.0" },
    });
    clearTimeout(timeoutId);
    return response.ok; // Status 200-299
  } catch (err) {
    clearTimeout(timeoutId);
    return false;
  }
}

// Helper: Obter registro DNS atual da Cloudflare
async function getCurrentDnsRecord(env) {
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${env.CLOUDFLARE_ZONE_ID}/dns_records/${env.CLOUDFLARE_DNS_RECORD_ID}`,
      {
        headers: {
          Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
    const data = await response.json();
    if (data.success) {
      return { ip: data.result.content, name: data.result.name };
    }
  } catch (err) {
    console.error("Erro ao buscar DNS no Cloudflare:", err);
  }
  return { ip: null, name: null };
}

// Helper: Buscar se Droplet já existe
async function findExistingDroplet(env) {
  try {
    const response = await fetch(
      `https://api.digitalocean.com/v2/droplets?name=${env.DO_DROPLET_NAME}`,
      {
        headers: {
          Authorization: `Bearer ${env.DIGITALOCEAN_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
    const data = await response.json();
    if (data.droplets && data.droplets.length > 0) {
      // Retorna o primeiro droplet ativo ou recém-criado com esse nome
      return data.droplets[0];
    }
  } catch (err) {
    console.error("Erro ao consultar droplets na DigitalOcean:", err);
  }
  return null;
}

// Helper: Criar Droplet na DigitalOcean via API
async function createDigitalOceanDroplet(env) {
  try {
    const userDataScript = env.CLOUD_INIT_BASE64
      ? atob(env.CLOUD_INIT_BASE64)
      : `#!/bin/bash\necho "Droplet de Contingência iniciado em $(date)" > /var/log/cloud-init-done.log`;

    const payload = {
      name: env.DO_DROPLET_NAME || "fallback-api-droplet",
      region: env.DO_REGION || "nyc1",
      size: env.DO_SIZE || "s-1vcpu-2gb",
      image: env.DO_IMAGE || "ubuntu-22-04-x64",
      user_data: userDataScript,
      tags: ["failover", "auto-generated"],
    };

    if (env.DO_SSH_KEYS) {
      try {
        payload.ssh_keys = JSON.parse(env.DO_SSH_KEYS);
      } catch (e) {
        console.log("DO_SSH_KEYS não é um JSON array válido, ignorando.");
      }
    }

    const response = await fetch("https://api.digitalocean.com/v2/droplets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.DIGITALOCEAN_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    return data.droplet || null;
  } catch (err) {
    console.error("Erro ao criar droplet na DigitalOcean:", err);
    return null;
  }
}

// Helper: Polling para aguardar a atribuição de IP público no Droplet da DO
async function waitForDropletIp(env, dropletId, maxRetries = 12, delayMs = 5000) {
  for (let i = 0; i < maxRetries; i++) {
    await new Promise((res) => setTimeout(res, delayMs));
    try {
      const response = await fetch(`https://api.digitalocean.com/v2/droplets/${dropletId}`, {
        headers: {
          Authorization: `Bearer ${env.DIGITALOCEAN_TOKEN}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (data.droplet) {
        const ip = getDropletPublicIp(data.droplet);
        if (ip) return ip;
      }
    } catch (err) {
      console.error(`Erro ao consultar IP do droplet (tentativa ${i + 1}):`, err);
    }
  }
  return null;
}

// Helper: Extrai IP v4 público da resposta da API da DO
function getDropletPublicIp(droplet) {
  if (!droplet.networks || !droplet.networks.v4) return null;
  const publicV4 = droplet.networks.v4.find((net) => net.type === "public");
  return publicV4 ? publicV4.ip_address : null;
}

// Helper: Atualizar Registro A no Cloudflare DNS
async function updateCloudflareDns(env, newIp) {
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${env.CLOUDFLARE_ZONE_ID}/dns_records/${env.CLOUDFLARE_DNS_RECORD_ID}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "A",
          name: env.DOMAIN_NAME,
          content: newIp,
          ttl: 60, // TTL curto de 60 segundos
          proxied: true, // Mantém proxy Cloudflare ativado
        }),
      }
    );
    const data = await response.json();
    return data.success;
  } catch (err) {
    console.error("Erro ao atualizar DNS Cloudflare:", err);
    return false;
  }
}

// Helper: Enviar notificação Webhook (Discord / Telegram)
async function sendAlertNotification(env, message) {
  if (!env.NOTIFICATION_WEBHOOK_URL) return;

  try {
    await fetch(env.NOTIFICATION_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message, text: message }),
    });
  } catch (err) {
    console.error("Erro ao enviar notificação de alerta:", err);
  }
}
