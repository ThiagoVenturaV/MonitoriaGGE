import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || (file.mimetype.includes('audio') ? '.webm' : '.bin');
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// ==============================================================================
// BANCO DE DADOS EM MEMÓRIA
// ==============================================================================

let tickets = [
  {
    id: 'TK-1001',
    aluno: 'Lucas Silva (Terceirão GGE)',
    unidade: 'Unidade Boa Viagem - Recife',
    assunto: 'Geometria Analítica - Distância Ponto e Reta',
    tipo: 'foto',
    fotoUrl: null,
    duvidaTexto: 'Como aplicar a fórmula da distância de um ponto a uma reta quando a equação geral possui termos negativos?',
    status: 'Pendente', // Pendente | Explicado | Entendido | Praticando | Aprovado
    etapa: 1, // 1: Dúvida Enviada | 2: Professor Ensinou | 3: Aluno Entendeu | 4: IA enviou Questão | 5: Aprovado
    criadoEm: new Date(Date.now() - 3600000).toISOString(),
    resposta: null,
    questaoFixacao: null
  },
  {
    id: 'TK-1002',
    aluno: 'Beatriz Ramos (Extensivo GGE)',
    unidade: 'Unidade Benfica - Recife',
    assunto: 'Logaritmos & Funções Exponenciais',
    tipo: 'texto',
    fotoUrl: null,
    duvidaTexto: 'Qual a diferença conceitual entre mudança de base e propriedade do produto nos logaritmos?',
    status: 'Explicado',
    etapa: 2,
    criadoEm: new Date(Date.now() - 7200000).toISOString(),
    resposta: {
      monitor: 'Prof. Ricardo Mendes (Equipe GGE)',
      texto: 'Olá Beatriz! A mudança de base permite converter log_b(a) para log_c(a)/log_c(b). Gravamos um áudio detalhado para você!',
      pdfUrl: null,
      fotoUrl: null,
      videoUrl: null,
      audioUrl: null,
      respondidoEm: new Date(Date.now() - 1800000).toISOString()
    },
    questaoFixacao: null
  }
];

const bancoQuestoesIA = [
  {
    id: 'FIX-01',
    vestibular: 'ENEM 2023',
    assunto: 'Geometria Analítica',
    nivel: 'Médio',
    enunciado: 'Um poste de iluminação no plano cartesiano está em (3, -4). A linha de transmissão segue a reta 3x + 4y - 12 = 0. Qual a distância mínima do poste até a linha?',
    opcoes: ['A) 3 metros', 'B) 4 metros', 'C) 5 metros', 'D) 7 metros'],
    respostaCorreta: 'C) 5 metros'
  },
  {
    id: 'FIX-02',
    vestibular: 'SSA / UPE',
    assunto: 'Logaritmos & Funções Exponenciais',
    nivel: 'Médio',
    enunciado: 'Sabendo que log2(3) = a e log2(5) = b, qual o valor de log2(15)?',
    opcoes: ['A) a * b', 'B) a + b', 'C) a / b', 'D) a^b'],
    respostaCorreta: 'B) a + b'
  }
];

// ==============================================================================
// ENDPOINTS REST
// ==============================================================================

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', server: 'Hostinger KVM 2 - Primario (São Paulo)' });
});

app.get('/api/tickets', (req, res) => {
  res.json({ success: true, count: tickets.length, tickets });
});

// ETAPA 1: ALUNO MANDA DÚVIDA
app.post('/api/tickets', upload.single('foto'), (req, res) => {
  const { aluno, unidade, assunto, tipo, duvidaTexto } = req.body;
  
  const novoTicket = {
    id: `TK-${Math.floor(1000 + Math.random() * 9000)}`,
    aluno: aluno || 'Aluno GGE',
    unidade: unidade || 'Unidade Boa Viagem - Recife',
    assunto: assunto || 'Matemática Geral',
    tipo: tipo || 'texto',
    fotoUrl: req.file ? `/uploads/${req.file.filename}` : null,
    duvidaTexto: duvidaTexto || '',
    status: 'Pendente',
    etapa: 1,
    criadoEm: new Date().toISOString(),
    resposta: null,
    questaoFixacao: null
  };

  tickets.unshift(novoTicket);
  res.status(201).json({ success: true, ticket: novoTicket });
});

// ETAPA 2: PROFESSOR / MONITOR ENSINA (RESPOSTA)
app.post('/api/tickets/:id/resposta', upload.fields([
  { name: 'pdf', maxCount: 1 },
  { name: 'foto', maxCount: 1 },
  { name: 'video', maxCount: 1 },
  { name: 'audio', maxCount: 1 }
]), (req, res) => {
  const { id } = req.params;
  const { monitor, texto } = req.body;

  const ticket = tickets.find(t => t.id === id);
  if (!ticket) return res.status(404).json({ success: false, error: 'Chamado não encontrado' });

  const files = req.files || {};

  ticket.status = 'Explicado';
  ticket.etapa = 2;
  ticket.resposta = {
    monitor: monitor || 'Prof. Ricardo Mendes',
    texto: texto || 'Explicação elaborada pelo professor.',
    pdfUrl: files.pdf ? `/uploads/${files.pdf[0].filename}` : null,
    fotoUrl: files.foto ? `/uploads/${files.foto[0].filename}` : null,
    videoUrl: files.video ? `/uploads/${files.video[0].filename}` : null,
    audioUrl: files.audio ? `/uploads/${files.audio[0].filename}` : null,
    respondidoEm: new Date().toISOString()
  };

  res.json({ success: true, ticket });
});

// ETAPA 3: ALUNO DIZ QUE ENTENDEU -> AGENTE DE IA GERA QUESTÃO DE FIXAÇÃO
app.post('/api/tickets/:id/entendi', (req, res) => {
  const { id } = req.params;
  const ticket = tickets.find(t => t.id === id);
  if (!ticket) return res.status(404).json({ success: false, error: 'Chamado não encontrado' });

  // Selecionar questão de fixação correspondente do banco da IA
  const questao = bancoQuestoesIA.find(q => q.assunto.toLowerCase().includes(ticket.assunto.toLowerCase())) || bancoQuestoesIA[0];

  ticket.status = 'Praticando';
  ticket.etapa = 4;
  ticket.questaoFixacao = questao;

  res.json({ success: true, ticket, questao });
});

// ETAPA 4: ALUNO RESPONDE A QUESTÃO DE FIXAÇÃO
app.post('/api/tickets/:id/responder-fixacao', (req, res) => {
  const { id } = req.params;
  const { respostaSelecionada, teveDuvida } = req.body;

  const ticket = tickets.find(t => t.id === id);
  if (!ticket) return res.status(404).json({ success: false, error: 'Chamado não encontrado' });

  // Se o aluno disse que teve dúvida ou errou a questão -> VOLTA PARA O PROFESSOR (CICLO REINICIADO)
  if (teveDuvida || (ticket.questaoFixacao && respostaSelecionada !== ticket.questaoFixacao.respostaCorreta)) {
    ticket.status = 'Pendente';
    ticket.etapa = 1;
    ticket.duvidaTexto = `[Nova dúvida na questão de fixação ${ticket.questaoFixacao?.id}]: Marquei ${respostaSelecionada || 'opção incorreta'} mas fiquei em dúvida na resolução.`;
    res.json({ success: true, resultado: 'REINICIADO', mensagem: 'Dúvida enviada de volta para o professor no ciclo de aprendizado!', ticket });
  } else {
    // Aluno acertou e entendeu -> APROVADO & DOMINADO
    ticket.status = 'Aprovado';
    ticket.etapa = 5;
    res.json({ success: true, resultado: 'APROVADO', mensagem: 'Parabéns! Conteúdo dominado e aprovado com sucesso!', ticket });
  }
});

// STATS COORDENADOR
app.get('/api/coordenador/stats', (req, res) => {
  const total = tickets.length;
  const aprovados = tickets.filter(t => t.status === 'Aprovado').length;
  const emAndamento = tickets.filter(t => t.status !== 'Aprovado').length;

  res.json({
    success: true,
    totalChamados: total,
    aprovados,
    emAndamento,
    taxaAprovacao: total > 0 ? `${Math.round((aprovados / total) * 100)}%` : '100%',
    tempoMedioMinutos: 12,
    precisaoIA: '96.5%'
  });
});

app.listen(PORT, () => {
  console.log(`\n========================================================`);
  console.log(`🚀 SERVIDOR CICLO DE APRENDIZADO GGE ONLINE EM http://localhost:${PORT}`);
  console.log(`========================================================\n`);
});
