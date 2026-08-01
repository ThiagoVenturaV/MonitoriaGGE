/**
 * Teste Local Simulado do Sistema de Failover
 * Executa um servidor local mock e simula a queda para testar a lógica do Worker.
 */

const http = require("http");
const path = require("path");

// 1. Criar um servidor local de mock representando a Hostinger (Porta 8080)
let isPrimaryHealthy = true;

const primaryServer = http.createServer((req, res) => {
  if (req.url === "/health") {
    if (isPrimaryHealthy) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "OK", server: "Hostinger KVM 2 - Primario" }));
    } else {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Internal Server Error (Simulando Queda)" }));
    }
  } else {
    res.writeHead(404);
    res.end();
  }
});

primaryServer.listen(8080, async () => {
  console.log("\n========================================================");
  console.log("🚀 MOCK SERVER PRIMÁRIO INICIADO EM http://localhost:8080");
  console.log("========================================================\n");

  // Importar dinamicamente a lógica do worker
  const workerModule = await import("./worker/src/index.js");
  const worker = workerModule.default;

  // Mock das variáveis de ambiente do Cloudflare Worker
  const envMock = {
    PRIMARY_HEALTH_CHECK_URL: "http://localhost:8080/health",
    DOMAIN_NAME: "api.seudominio.com",
    CLOUDFLARE_ZONE_ID: "mock_zone_id",
    CLOUDFLARE_DNS_RECORD_ID: "mock_record_id",
    CLOUDFLARE_API_TOKEN: "mock_cf_token",
    DIGITALOCEAN_TOKEN: "mock_do_token",
    DO_REGION: "nyc1",
    DO_SIZE: "s-1vcpu-2gb",
    DO_IMAGE: "ubuntu-22-04-x64",
    DO_DROPLET_NAME: "fallback-api-droplet",
  };

  console.log("--- 🧪 TESTE 1: SERVIDOR PRIMÁRIO ONLINE ---");
  const res1 = await worker.fetch(new Request("http://localhost/test-check"), envMock);
  const data1 = await res1.json();
  console.log("Resultado Teste 1:");
  console.log(JSON.stringify(data1, null, 2));

  console.log("\n--------------------------------------------------------");
  console.log("🚨 SIMULANDO QUEDA DO SERVIDOR PRIMÁRIO (HOSTINGER)...");
  console.log("--------------------------------------------------------\n");
  isPrimaryHealthy = false;

  console.log("--- 🧪 TESTE 2: SERVIDOR PRIMÁRIO CAÍDO (FAILOVER DISPARADO) ---");
  const res2 = await worker.fetch(new Request("http://localhost/test-check"), envMock);
  const data2 = await res2.json();
  console.log("Resultado Teste 2:");
  console.log(JSON.stringify(data2, null, 2));

  console.log("\n========================================================");
  console.log("✅ SIMULAÇÃO CONCLUÍDA COM SUCESSO!");
  console.log("========================================================\n");

  primaryServer.close();
  process.exit(0);
});
