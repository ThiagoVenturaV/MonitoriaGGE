import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET || 'gge-monitoria-secret-key-2026';

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
// REVOGAÇÃO DE TOKENS & BANCO DE DADOS EM MEMÓRIA (bcrypt & jwt)
// ==============================================================================

// Set em memória para blacklist de tokens revogados no logout
const revokedTokens = new Set();

// Usuários iniciais com senhas criptografadas por bcrypt
const defaultPasswordHash = bcrypt.hashSync('123456', 10);

let users = [
  {
    id: 'USR-01',
    name: 'Lucas Silva',
    email: 'lucas@gge.com.br',
    passwordHash: defaultPasswordHash,
    role: 'aluno', // aluno | monitor | coordenador
    unidade: 'Unidade Boa Viagem - Recife',
    turma: '3º Ano Terceirão - Medicina'
  },
  {
    id: 'USR-02',
    name: 'Beatriz Ramos',
    email: 'beatriz@gge.com.br',
    passwordHash: defaultPasswordHash,
    role: 'aluno',
    unidade: 'Unidade Benfica - Recife',
    turma: 'Extensivo GGE'
  },
  {
    id: 'USR-03',
    name: 'Prof. Ricardo Mendes',
    email: 'professor@gge.com.br',
    passwordHash: defaultPasswordHash,
    role: 'monitor',
    unidade: 'GGE Recife (Todas as Unidades)',
    disciplina: 'Matemática & Física'
  },
  {
    id: 'USR-04',
    name: 'Prof. Fernando Santos',
    email: 'coordenador@gge.com.br',
    passwordHash: defaultPasswordHash,
    role: 'coordenador',
    unidade: 'Coordenação Geral GGE',
    cargo: 'Coordenador Pedagógico'
  }
];

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
// MIDDLEWARES DE AUTENTICAÇÃO E REVOGAÇÃO
// ==============================================================================

const extractToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  return parts.length === 2 && parts[0] === 'Bearer' ? parts[1] : null;
};

const authenticateToken = (req, res, next) => {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ success: false, error: 'Acesso negado. Token de autenticação não fornecido.' });
  }

  // Verifica se o token foi revogado no logout
  if (revokedTokens.has(token)) {
    return res.status(401).json({ success: false, error: 'Token revogado (Sessão encerrada via Logout).' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = users.find(u => u.id === decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Usuário não encontrado.' });
    }
    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Token inválido ou expirado.' });
  }
};

const optionalToken = (req, res, next) => {
  const token = extractToken(req);
  if (token && !revokedTokens.has(token)) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = users.find(u => u.id === decoded.id);
      if (user) {
        req.user = user;
        req.token = token;
      }
    } catch (e) {}
  }
  next();
};

// ==============================================================================
// ENDPOINTS REST DE AUTENTICAÇÃO (bcrypt & jwt & logout revocation)
// ==============================================================================

// AUTENTICAÇÃO: CADASTRO
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, role, unidade, turma } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ success: false, error: 'Preencha nome, e-mail e senha.' });
  }

  const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ success: false, error: 'Este e-mail já está cadastrado.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser = {
    id: `USR-${Math.floor(100 + Math.random() * 900)}`,
    name,
    email: email.toLowerCase(),
    passwordHash,
    role: role || 'aluno',
    unidade: unidade || 'Unidade Boa Viagem - Recife',
    turma: turma || 'Ensino Médio GGE'
  };

  users.push(newUser);

  const token = jwt.sign(
    { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role, unidade: newUser.unidade },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  const { passwordHash: _, ...userWithoutPassword } = newUser;
  res.status(201).json({ success: true, token, user: userWithoutPassword });
});

// AUTENTICAÇÃO: LOGIN
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Informe e-mail e senha.' });
  }

  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(401).json({ success: false, error: 'E-mail ou senha incorretos.' });
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    return res.status(401).json({ success: false, error: 'E-mail ou senha incorretos.' });
  }

  const token = jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role, unidade: user.unidade },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  const { passwordHash: _, ...userWithoutPassword } = user;
  res.json({ success: true, token, user: userWithoutPassword });
});

// AUTENTICAÇÃO: LOGOUT (REVOGAÇÃO DO TOKEN JWT)
app.post('/api/auth/logout', authenticateToken, (req, res) => {
  if (req.token) {
    revokedTokens.add(req.token);
  }
  res.json({ success: true, message: 'Logout realizado com sucesso. Token revogado.' });
});

// AUTENTICAÇÃO: OBTER USUÁRIO ATUAL ME
app.get('/api/auth/me', authenticateToken, (req, res) => {
  const { passwordHash: _, ...userWithoutPassword } = req.user;
  res.json({ success: true, user: userWithoutPassword });
});

// ==============================================================================
// ENDPOINTS REST DE DÚVIDAS E MONITORIA
// ==============================================================================

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', server: 'Hostinger KVM 2 - Primario (São Paulo)' });
});

app.get('/api/tickets', (req, res) => {
  res.json({ success: true, count: tickets.length, tickets });
});

// ETAPA 1: ALUNO MANDA DÚVIDA (Usando autenticação para preencher nome automaticamente)
app.post('/api/tickets', optionalToken, upload.single('foto'), (req, res) => {
  const { assunto, tipo, duvidaTexto } = req.body;
  
  // Se o aluno estiver logado via JWT, extrai o nome e a unidade do usuário autenticado!
  const nomeAluno = req.user ? req.user.name : (req.body.aluno || 'Aluno GGE');
  const unidadeAluno = req.user ? req.user.unidade : (req.body.unidade || 'Unidade Boa Viagem - Recife');

  const novoTicket = {
    id: `TK-${Math.floor(1000 + Math.random() * 9000)}`,
    aluno: nomeAluno,
    unidade: unidadeAluno,
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
    monitor: monitor || 'Prof. Ricardo Mendes (Equipe GGE)',
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

  if (teveDuvida || (ticket.questaoFixacao && respostaSelecionada !== ticket.questaoFixacao.respostaCorreta)) {
    ticket.status = 'Pendente';
    ticket.etapa = 1;
    ticket.duvidaTexto = `[Nova dúvida na questão de fixação ${ticket.questaoFixacao?.id}]: Marquei ${respostaSelecionada || 'opção incorreta'} mas fiquei em dúvida na resolução.`;
    res.json({ success: true, resultado: 'REINICIADO', mensagem: 'Dúvida enviada de volta para o professor no ciclo de aprendizado!', ticket });
  } else {
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
