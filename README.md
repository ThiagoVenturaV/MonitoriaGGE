# 🎓 Monitoria GGE — Plataforma de Monitoria

<p align="center">
  <img src="https://img.shields.io/badge/Next.js%2014-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js 14" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/Cloudflare_Workers-F38020?style=for-the-badge&logo=cloudflare&logoColor=white" alt="Cloudflare Workers" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
</p>

Plataforma completa e resiliente de monitoria acadêmica do **Colégio GGE**. O sistema oferece uma experiência integrada para alunos, monitores e coordenação, contando com uma arquitetura de alta disponibilidade com **Failover Automático (Hostinger KVM 2 → DigitalOcean)** via Cloudflare Workers.

---

## 🎯 Principais Recursos por Perfil

### 🎓 Portal do Aluno
* 📝 **Envio de Dúvidas**: Suporte a envio por texto (dúvida conceitual) ou anexo de fotos da questão.
* 🤖 **Assistente de Estudos IA**: Recomendador de questões por vestibular (ENEM, FUVEST, UNICAMP, SSA/UPE) e nível de dificuldade (Fácil, Médio, Difícil).
* ⏱️ **Acompanhamento em Tempo Real**: Status das dúvidas enviadas e acesso a resoluções multimídia.

### 👨‍🏫 Painel do Monitor / Professor
* 📥 **Fila por Unidade**: Organização de dúvidas filtradas por unidades do Colégio GGE.
* 🎙️ **Respostas Multimídia**: Envio de explicativos em PDF, imagens de lousa/manuscritos, vídeos (`.mp4`) e gravação de áudio em tempo real pelo navegador.

### 🏆 Coordenação Acadêmica
* 📊 **Painel Analítico**: Métricas de tempo médio de resposta por unidade, taxa de resolutividade pedagógica e precisão das recomendações da IA.

---

## 🏗️ Arquitetura & Failover

```
                      ┌───────────────────────┐
                      │    Usuário / Cliente  │
                      └───────────┬───────────┘
                                  │
                       [ api.seudominio.com ]
                                  │
                                  ▼
                      ┌───────────────────────┐
                      │    Cloudflare DNS     │
                      └───────────┬───────────┘
                                  │
      ┌───────────────────────────┴───────────────────────────┐
      │ (Normal: Aponta para Hostinger)                       │ (Queda: Worker altera para DO)
      ▼                                                       ▼
┌─────────────────────────┐   ⚡ Worker HealthCheck    ┌─────────────────────────┐
│ Hostinger KVM 2 (VPS)   │ ◄───────────────────────── │ Cloudflare Worker       │
│  - API Node.js/Express  │   Verifica a cada 1 min    │  - Dispara droplet DO   │
│  - Nginx Reverse Proxy  │                            │  - Atualiza registro A  │
└─────────────────────────┘                            └───────────┬─────────────┘
                                                                   │
                                                                   ▼
                                                       ┌─────────────────────────┐
                                                       │  DigitalOcean Droplet   │
                                                       │  (Fallback sob demanda) │
                                                       └─────────────────────────┘
```

---

## 🚀 Como Executar Localmente

### 📋 Pré-requisitos
* **Node.js** v18+
* **NPM** ou **Yarn**
* **Git**

---

### 1️⃣ Clonar o Repositório

```bash
git clone https://github.com/ThiagoVenturaV/MonitoriaGGE.git
cd MonitoriaGGE
```

---

### 2️⃣ Iniciar o Backend (Porta 8080)

```bash
cd backend
npm install
node server.js
```
> 📍 **API Backend**: `http://localhost:8080`

---

### 3️⃣ Iniciar o Frontend Next.js (Porta 3000)

Em um **novo terminal**, navegue até a raiz do projeto e execute:

```bash
cd frontend
npm install
npm run dev
```
> 📍 **Interface Web**: `http://localhost:3000`

---

### 4️⃣ Simulação Local de Failover (Opcional)

Para testar a lógica do Worker e simulação de queda do servidor primário:

```bash
# Na raiz do projeto:
node test-local.js
```

---

## 📁 Estrutura do Projeto

```text
MonitoriaGGE/
├── frontend/             # Interface Web em Next.js 14 (App Router & Glassmorphism)
│   ├── app/              # Páginas, componentes e rotas da aplicação
│   └── package.json
├── backend/              # REST API em Node.js / Express com rotas de upload
│   ├── server.js         # Servidor Express e armazenamento de mídias
│   └── uploads/          # Diretório local de mídias enviadas
├── worker/               # Cloudflare Worker para monitoramento contínuo (Cron 1 min)
│   └── src/index.js
├── docker/               # Arquivos de orquestração Docker & Nginx
├── scripts/              # Scripts de automação (cloud-init.sh e failback.sh)
├── test-local.js         # Script para simulação local do motor de failover
└── DEPLOY_GUIDE.md       # Guia completo de deploy em produção (Hostinger + DigitalOcean)
```

---

## 📖 Guias & Documentações Adicionais

* 🚀 [Guia de Deploy em Produção & Failover](DEPLOY_GUIDE.md): Instruções passo a passo para configurar os tokens da Cloudflare, DigitalOcean e publicar a infraestrutura.

---

## 📄 Licença

Desenvolvido para o **Colégio GGE**. Todos os direitos reservados.

