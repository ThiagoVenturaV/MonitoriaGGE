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
// BANCO DE DADOS EM MEMÓRIA (SEM DADOS MOCKADOS NO FEED)
// ==============================================================================

const revokedTokens = new Set();
const defaultPasswordHash = bcrypt.hashSync('123456', 10);

let users = [
  {
    id: 'USR-01',
    name: 'Lucas Silva',
    email: 'lucas@gge.com.br',
    passwordHash: defaultPasswordHash,
    role: 'aluno',
    turma: '3º Ano Terceirão - Medicina'
  },
  {
    id: 'USR-02',
    name: 'Beatriz Ramos',
    email: 'beatriz@gge.com.br',
    passwordHash: defaultPasswordHash,
    role: 'aluno',
    turma: 'Extensivo GGE'
  },
  {
    id: 'USR-03',
    name: 'Prof. Ricardo Mendes',
    email: 'professor@gge.com.br',
    passwordHash: defaultPasswordHash,
    role: 'monitor',
    area: 'Física',
    disciplina: 'Física & Astronomia'
  },
  {
    id: 'USR-04',
    name: 'Prof. Fernando Santos',
    email: 'coordenador@gge.com.br',
    passwordHash: defaultPasswordHash,
    role: 'coordenador',
    area: 'Exatas',
    cargo: 'Coordenador Acadêmico de Exatas'
  }
];

// Inicia com lista limpa de dúvidas (sem mocks hardcoded)
let tickets = [];

const bancoQuestoesIA = [
  {
    id: 'FIX-01',
    vestibular: 'ENEM 2023',
    assunto: 'Física - Eletrodinâmica',
    nivel: 'Médio',
    enunciado: 'Em um circuito com gerador ideal de 12V e dois resistores iguais de 6 ohms ligados em paralelo, qual é a corrente total fornecida pela fonte?',
    opcoes: ['A) 1 Ampère', 'B) 2 Ampères', 'C) 4 Ampères', 'D) 6 Ampères'],
    respostaCorreta: 'C) 4 Ampères'
  },
  {
    id: 'FIX-02',
    vestibular: 'SSA / UPE',
    assunto: 'Biologia - Genética',
    nivel: 'Médio',
    enunciado: 'No cruzamento entre dois indivíduos heterozigotos (Aa x Aa), qual a probabilidade de se obter um descendente recessivo (aa)?',
    opcoes: ['A) 25%', 'B) 50%', 'C) 75%', 'D) 100%'],
    respostaCorreta: 'A) 25%'
  }
];

// ==============================================================================
// MIDDLEWARES DE AUTENTICAÇÃO
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
    return res.status(401).json({ success: false, error: 'Acesso negado. Token não fornecido.' });
  }

  if (revokedTokens.has(token)) {
    return res.status(401).json({ success: false, error: 'Sessão encerrada.' });
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
    return res.status(401).json({ success: false, error: 'Sessão expirada.' });
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
// ENDPOINTS DE AUTENTICAÇÃO
// ==============================================================================

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, role, area, turma } = req.body;

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
    area: area || 'Geral',
    turma: turma || 'Ensino Médio GGE'
  };

  users.push(newUser);

  const token = jwt.sign(
    { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role, area: newUser.area },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  const { passwordHash: _, ...userWithoutPassword } = newUser;
  res.status(201).json({ success: true, token, user: userWithoutPassword });
});

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
    { id: user.id, name: user.name, email: user.email, role: user.role, area: user.area },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  const { passwordHash: _, ...userWithoutPassword } = user;
  res.json({ success: true, token, user: userWithoutPassword });
});

app.post('/api/auth/logout', authenticateToken, (req, res) => {
  if (req.token) {
    revokedTokens.add(req.token);
  }
  res.json({ success: true, message: 'Logout realizado com sucesso.' });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  const { passwordHash: _, ...userWithoutPassword } = req.user;
  res.json({ success: true, user: userWithoutPassword });
});

// ==============================================================================
// ENDPOINTS DE DÚVIDAS E AVALIAÇÕES DE PROFESSORES
// ==============================================================================

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', server: 'GGE Monitoria Engine' });
});

app.get('/api/tickets', optionalToken, (req, res) => {
  let result = [...tickets];
  
  // Se for aluno logado, filtra apenas as próprias dúvidas (Histórico Privado)
  if (req.user && req.user.role === 'aluno') {
    result = result.filter(t => t.alunoId === req.user.id || t.alunoEmail === req.user.email || t.aluno === req.user.name);
  }

  res.json({ success: true, count: result.length, tickets: result });
});

app.post('/api/tickets', optionalToken, upload.fields([
  { name: 'foto', maxCount: 5 },
  { name: 'fotos', maxCount: 5 }
]), (req, res) => {
  const { assunto, tipo, duvidaTexto, area } = req.body;
  
  const nomeAluno = req.user ? req.user.name : (req.body.aluno || 'Aluno GGE');
  const alunoId = req.user ? req.user.id : null;
  const alunoEmail = req.user ? req.user.email : null;

  const files = req.files || {};
  const uploadedFotos = [...(files.foto || []), ...(files.fotos || [])];
  const fotoUrls = uploadedFotos.map(f => `/uploads/${f.filename}`);

  const novoTicket = {
    id: `TK-${Math.floor(1000 + Math.random() * 9000)}`,
    alunoId,
    alunoEmail,
    aluno: nomeAluno,
    assunto: assunto || 'Geral',
    area: area || 'Física',
    tipo: tipo || 'texto',
    fotoUrl: fotoUrls[0] || null,
    fotoUrls: fotoUrls,
    duvidaTexto: duvidaTexto || '',
    status: 'Pendente',
    etapa: 1,
    criadoEm: new Date().toISOString(),
    resposta: null,
    avaliacao: null,
    questaoFixacao: null
  };

  tickets.unshift(novoTicket);
  res.status(201).json({ success: true, ticket: novoTicket });
});

app.post('/api/tickets/:id/resposta', upload.fields([
  { name: 'pdf', maxCount: 5 },
  { name: 'foto', maxCount: 5 },
  { name: 'video', maxCount: 5 },
  { name: 'audio', maxCount: 1 }
]), (req, res) => {
  const { id } = req.params;
  const { monitor, texto } = req.body;

  const ticket = tickets.find(t => t.id === id);
  if (!ticket) return res.status(404).json({ success: false, error: 'Chamado não encontrado' });

  const files = req.files || {};
  const pdfFiles = files.pdf || [];
  const fotoFiles = files.foto || [];
  const videoFiles = files.video || [];
  const audioFile = files.audio ? files.audio[0] : null;

  ticket.status = 'Explicado';
  ticket.etapa = 2;
  ticket.resposta = {
    monitor: monitor || 'Prof. Ricardo Mendes (Equipe GGE)',
    texto: texto || 'Explicação elaborada pelo professor.',
    pdfUrls: pdfFiles.map(f => `/uploads/${f.filename}`),
    fotoUrls: fotoFiles.map(f => `/uploads/${f.filename}`),
    videoUrls: videoFiles.map(f => `/uploads/${f.filename}`),
    pdfUrl: pdfFiles[0] ? `/uploads/${pdfFiles[0].filename}` : null,
    fotoUrl: fotoFiles[0] ? `/uploads/${fotoFiles[0].filename}` : null,
    videoUrl: videoFiles[0] ? `/uploads/${videoFiles[0].filename}` : null,
    audioUrl: audioFile ? `/uploads/${audioFile.filename}` : null,
    respondidoEm: new Date().toISOString()
  };

  res.json({ success: true, ticket });
});

// Endpoint de Avaliação da Explicação pelo Aluno
app.post('/api/tickets/:id/avaliar', optionalToken, (req, res) => {
  const { id } = req.params;
  const { nota, comentario } = req.body;

  const ticket = tickets.find(t => t.id === id);
  if (!ticket) return res.status(404).json({ success: false, error: 'Chamado não encontrado' });

  ticket.avaliacao = {
    nota: Number(nota) || 5,
    comentario: comentario || '',
    avaliadoEm: new Date().toISOString()
  };

  res.json({ success: true, ticket, mensagem: 'Obrigado por avaliar a explicação do professor!' });
});

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

app.get('/api/coordenador/stats', (req, res) => {
  const total = tickets.length;
  const aprovados = tickets.filter(t => t.status === 'Aprovado').length;
  const pendentes = tickets.filter(t => t.status === 'Pendente').length;
  const explicados = tickets.filter(t => t.status === 'Explicado' || t.status === 'Praticando').length;

  res.json({
    success: true,
    totalChamados: total,
    aprovados,
    pendentes,
    explicados,
    emAndamento: pendentes + explicados,
    taxaAprovacao: total > 0 ? `${Math.round((aprovados / total) * 100)}%` : '100%',
    tempoMedioResposta: '12 min (Meta < 15 min)',
    metaRespostaCumprida: '98.4%',
    taxaResolucaoPedagogica: '94.2%',
    precisaoIA: '96.5%',
    satisfacaoAlunos: '4.9 / 5.0 ★'
  });
});

app.get('/api/coordenador/dashboards', (req, res) => {
  const { professor, area, periodo } = req.query;

  let filtered = [...tickets];
  if (area && area !== 'todas') {
    filtered = filtered.filter(t => (t.area || '').toLowerCase().includes(area.toLowerCase()));
  }
  if (professor && professor !== 'todos') {
    filtered = filtered.filter(t => t.resposta && t.resposta.monitor.toLowerCase().includes(professor.toLowerCase()));
  }

  const total = filtered.length;
  const aprovados = filtered.filter(t => t.status === 'Aprovado').length;
  const pendentes = filtered.filter(t => t.status === 'Pendente').length;
  const explicados = filtered.filter(t => t.status === 'Explicado' || t.status === 'Praticando').length;

  const monitoresStats = [
    {
      id: 'USR-03',
      name: 'Prof. Ricardo Mendes',
      disciplina: 'Física',
      area: 'Física',
      atendidos: tickets.filter(t => t.resposta?.monitor.includes('Ricardo')).length || 14,
      tempoMedioResposta: '11 min',
      resolucaoPedagogica: '96.2%',
      satisfacaoAlunos: '4.9 ★',
      statusResposta: 'No Prazo'
    },
    {
      id: 'USR-05',
      name: 'Prof. Ana Clara Vilela',
      disciplina: 'Química & Biologia',
      area: 'Química',
      atendidos: 19,
      tempoMedioResposta: '13 min',
      resolucaoPedagogica: '94.8%',
      satisfacaoAlunos: '4.8 ★',
      statusResposta: 'No Prazo'
    },
    {
      id: 'USR-06',
      name: 'Prof. Carlos Eduardo',
      disciplina: 'Matemática',
      area: 'Matemática',
      atendidos: 22,
      tempoMedioResposta: '10 min',
      resolucaoPedagogica: '98.0%',
      satisfacaoAlunos: '5.0 ★',
      statusResposta: 'No Prazo'
    }
  ];

  const materiasStats = [
    { materia: 'Física', total: 18, resolvidas: 16, tempoResposta: '12 min' },
    { materia: 'Matemática', total: 24, resolvidas: 22, tempoResposta: '11 min' },
    { materia: 'Química', total: 14, resolvidas: 13, tempoResposta: '14 min' },
    { materia: 'Biologia', total: 15, resolvidas: 14, tempoResposta: '10 min' },
    { materia: 'Linguagens', total: 20, resolvidas: 19, tempoResposta: '09 min' }
  ];

  const evolucaoSemanal = [
    { dia: 'Seg', duvidas: 12, tempoMin: 14 },
    { dia: 'Ter', duvidas: 19, tempoMin: 11 },
    { dia: 'Qua', duvidas: 15, tempoMin: 12 },
    { dia: 'Qui', duvidas: 22, tempoMin: 10 },
    { dia: 'Sex', duvidas: 18, tempoMin: 13 },
    { dia: 'Sáb', duvidas: 8,  tempoMin: 9 },
    { dia: 'Dom', duvidas: 5,  tempoMin: 8 }
  ];

  res.json({
    success: true,
    filtrosAplicados: { professor: professor || 'todos', area: area || 'todas', periodo: periodo || '7d' },
    resumo: {
      totalChamados: total,
      aprovados,
      pendentes,
      explicados,
      emAndamento: pendentes + explicados,
      taxaAprovacao: total > 0 ? `${Math.round((aprovados / total) * 100)}%` : '100%',
      tempoMedioResposta: '11.8 min',
      metaTempoResposta: '< 15 min',
      cumprimentoMetaTempo: '98.5%',
      taxaResolucaoPedagogica: '95.4%',
      precisaoIA: '96.5%',
      satisfacaoAlunosGeral: '4.9 / 5.0 ★'
    },
    evolucaoSemanal,
    monitores: monitoresStats,
    materias: materiasStats
  });
});

app.listen(PORT, () => {
  console.log(`\n========================================================`);
  console.log(`🚀 SERVIDOR MONITORIA GGE ONLINE EM http://localhost:${PORT}`);
  console.log(`========================================================\n`);
});
