# 🎓 Monitoria GGE • Plataforma de Monitoria de Matemática

Plataforma oficial de monitoria de matemática do **Colégio GGE**, construída em **Next.js 14** e **Node.js REST API**, integrada a uma arquitetura resiliente com automação de **Failover Automático (Hostinger → DigitalOcean)** via Cloudflare Workers.

---

## 🌟 Funcionalidades por Perfil de Usuário

### 1. 🎓 Portal do Aluno
* **Envio de Dúvidas**: Suporte a envio por **Texto (Conceitual)** ou upload de **Foto da Questão**.
* **Assistente de Estudos IA**: Recomendador de questões do banco filtradas por **Vestibular** (ENEM, FUVEST, UNICAMP, SSA/UPE) e **Nível de Dificuldade** (Fácil, Médio, Difícil).
* **Acompanhamento de Dúvidas**: Visualização do status em tempo real e das respostas multimídia dos monitores.

### 2. 👨‍🏫 Painel do Monitor / Professor
* **Fila de Atendimento**: Organização das dúvidas por Unidades do Colégio GGE.
* **Respostas Multimídia**:
  - Upload de **PDF Explicativo**.
  - Upload de **Foto da Lousa / Manuscrito (.jpg/.png)**.
  - Upload de **Vídeo (.mp4)**.
  - **Gravação de Áudio Real** pelo microfone do dispositivo com explicação passo a passo.

### 3. 🏆 Coordenação Acadêmica
* Painel analítico com tempo médio de resposta por unidade, índice de resolutividade pedagógica e taxa de precisão das sugestões da IA.

---

## 💻 Como Executar o Deploy Local

Siga as instruções abaixo para rodar a aplicação completa na sua máquina local.

### 📋 Pré-requisitos
* **Node.js** (versão 18 ou superior)
* **NPM** (gerenciador de pacotes)
* **Git**

---

### 1️⃣ Passo 1: Clonar o Repositório

```bash
git clone https://github.com/ThiagoVenturaV/MonitoriaGGE.git
cd MonitoriaGGE
```

---

### 2️⃣ Passo 2: Iniciar a API REST do Backend (Porta 8080)

Abra um terminal na pasta raiz do projeto e execute:

```bash
cd backend
npm install
node server.js
```

> **Verificação:** O terminal mostrará:  
> `🚀 SERVIDOR BACKEND API REAL ONLINE EM http://localhost:8080`

---

### 3️⃣ Passo 3: Iniciar o Frontend em Next.js (Porta 3000)

Abra um **segundo terminal** na pasta raiz do projeto e execute:

```bash
cd frontend
npm install
npm run dev
```

> **Verificação:** O terminal mostrará:  
> ` Ready in 2s - Local: http://localhost:3000`

---

### 4️⃣ Passo 4: Acessar a Aplicação no Navegador

Abra o seu navegador e acesse:

👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🧪 Como Testar a Simulação Local do Failover

Para visualizar a lógica de monitoramento do **Cloudflare Worker** e a resposta a uma simulação de queda da API primária:

Na pasta raiz do projeto, execute:

```bash
node test-local.js
```

O script irá:
1. Iniciar um servidor primário mock na porta `8080`.
2. Validar o **Cenário 1 (ONLINE - HTTP 200 OK)**.
3. Simular a queda no **Cenário 2 (OFFLINE)**, disparando os logs de criação de contingência.

---

## 📂 Estrutura do Repositório

```
MonitoriaGGE/
├── frontend/             # Aplicação Web em Next.js 14 (App Router) para o Colégio GGE
│   ├── app/
│   │   ├── layout.jsx    # Layout base
│   │   ├── page.jsx      # Interface dos 3 Perfis de Usuário
│   │   └── globals.css   # Estilização Glassmorphism & GGE Branding
│   └── package.json
├── backend/              # API REST em Node.js / Express
│   ├── server.js         # Endpoints REST e Upload de Arquivos
│   └── uploads/          # Diretório onde os uploads são armazenados
├── worker/               # Cloudflare Worker para monitoramento a cada 1 min
│   └── src/index.js
├── docker/               # Arquivos Docker Compose e Nginx Proxy
├── scripts/              # Scripts de automação (cloud-init.sh e failback.sh)
├── test-local.js         # Script de testes de simulação local
└── DEPLOY_GUIDE.md       # Guia de deploy em servidores de Produção (Hostinger + DigitalOcean)
```

---

## 📄 Licença

Desenvolvido para o **Colégio GGE**. Todos os direitos reservados.
