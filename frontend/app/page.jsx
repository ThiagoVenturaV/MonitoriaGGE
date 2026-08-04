'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  UserCheck, 
  Send, 
  Camera, 
  FileText, 
  Sparkles, 
  Mic, 
  Video, 
  Clock, 
  Building2, 
  BrainCircuit, 
  RefreshCw, 
  HelpCircle, 
  RotateCcw,
  LogOut,
  LogIn,
  User,
  PlusCircle,
  Layers,
  X,
  BarChart3,
  CheckCircle2,
  BookOpen
} from 'lucide-react';

const API_BASE = 'http://localhost:8080';

export default function PlataformaMonitoriaGGE() {
  // Autenticação & Usuário
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [authForm, setAuthForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'aluno',
    unidade: 'Unidade Boa Viagem - Recife',
    turma: '3º Ano Terceirão - GGE'
  });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Navegação Mobile & Filtros
  const [mobileTab, setMobileTab] = useState('feed'); // 'feed' | 'nova_duvida'
  const [statusFilter, setStatusFilter] = useState('todos');

  // Dados dos Chamados & Estatísticas
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [coordenadorStats, setCoordenadorStats] = useState(null);

  // Form Novo Chamado Aluno (Com campo de Assunto/Tópico LIVRE para ser digitado!)
  const [novoChamado, setNovoChamado] = useState({
    assunto: '',
    tipo: 'texto',
    duvidaTexto: '',
  });
  const [fotoFile, setFotoFile] = useState(null);

  // Form Resposta Monitor
  const [respostaMonitor, setRespostaMonitor] = useState({
    ticketId: '',
    monitor: 'Prof. Ricardo Mendes (Equipe GGE)',
    textoExplicativo: ''
  });
  const [monitorPdf, setMonitorPdf] = useState(null);
  const [monitorFoto, setMonitorFoto] = useState(null);
  const [monitorVideo, setMonitorVideo] = useState(null);

  // Gravação de Áudio Real
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);

  // Restauração de Sessão JWT
  useEffect(() => {
    const savedToken = localStorage.getItem('gge_token');
    if (savedToken) {
      setToken(savedToken);
      validarSessaoToken(savedToken);
    }
    carregarDados();
  }, []);

  const validarSessaoToken = async (authToken) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
      } else {
        localStorage.removeItem('gge_token');
        setToken(null);
        setUser(null);
      }
    } catch (err) {
      console.error('Erro ao validar sessão:', err);
    }
  };

  const carregarDados = async () => {
    setLoading(true);
    try {
      const ticketsRes = await fetch(`${API_BASE}/api/tickets`);
      const ticketsData = await ticketsRes.json();
      if (ticketsData.success) {
        setTickets(ticketsData.tickets);
        if (ticketsData.tickets.length > 0) {
          setRespostaMonitor(prev => ({ ...prev, ticketId: ticketsData.tickets[0].id }));
        }
      }

      const statsRes = await fetch(`${API_BASE}/api/coordenador/stats`);
      const statsData = await statsRes.json();
      if (statsData.success) setCoordenadorStats(statsData);
    } catch (err) {
      console.error('Erro ao conectar ao serviço GGE:', err);
    } finally {
      setLoading(false);
    }
  };

  // HANDLERS DE AUTENTICAÇÃO
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm)
      });
      const data = await res.json();

      if (!data.success) {
        setAuthError(data.error || 'Falha na autenticação.');
        return;
      }

      localStorage.setItem('gge_token', data.token);
      setToken(data.token);
      setUser(data.user);
      setShowAuthModal(false);
      setAuthForm({ name: '', email: '', password: '', role: 'aluno', unidade: 'Unidade Boa Viagem - Recife', turma: '3º Ano Terceirão - GGE' });
    } catch (err) {
      setAuthError('Erro de conexão com o servidor.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    if (token) {
      try {
        await fetch(`${API_BASE}/api/auth/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (err) {}
    }
    localStorage.removeItem('gge_token');
    setToken(null);
    setUser(null);
    alert('Sessão encerrada com sucesso!');
  };

  const handleFastDemoLogin = async (demoEmail) => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoEmail, password: '123456' })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('gge_token', data.token);
        setToken(data.token);
        setUser(data.user);
        setShowAuthModal(false);
      } else {
        setAuthError(data.error);
      }
    } catch (err) {
      setAuthError('Erro no login demo.');
    } finally {
      setAuthLoading(false);
    }
  };

  // ETAPA 1: ALUNO MANDA DÚVIDA (Com campo de Assunto LIVRE!)
  const handleCriarChamado = async (e) => {
    e.preventDefault();
    if (!novoChamado.assunto.trim()) {
      alert('Por favor, informe a matéria e o assunto da sua dúvida.');
      return;
    }
    if (!novoChamado.duvidaTexto && !fotoFile) {
      alert('Por favor, digite sua dúvida ou anexe uma foto da questão.');
      return;
    }

    const formData = new FormData();
    formData.append('assunto', novoChamado.assunto);
    formData.append('tipo', fotoFile ? 'foto' : 'texto');
    formData.append('duvidaTexto', novoChamado.duvidaTexto);
    if (fotoFile) formData.append('foto', fotoFile);

    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_BASE}/api/tickets`, {
        method: 'POST',
        headers,
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        alert('Dúvida enviada com sucesso ao monitor! Acompanhe o Ciclo de Aprendizado GGE.');
        setNovoChamado({ assunto: '', tipo: 'texto', duvidaTexto: '' });
        setFotoFile(null);
        setMobileTab('feed');
        carregarDados();
      }
    } catch (err) {
      alert('Erro ao enviar a dúvida.');
    }
  };

  // ETAPA 2: MONITOR ENSINA
  const handleEnviarResposta = async (e) => {
    e.preventDefault();
    if (!respostaMonitor.ticketId) return;

    const formData = new FormData();
    formData.append('monitor', user ? `${user.name} (Equipe GGE)` : respostaMonitor.monitor);
    formData.append('texto', respostaMonitor.textoExplicativo);

    if (monitorPdf) formData.append('pdf', monitorPdf);
    if (monitorFoto) formData.append('foto', monitorFoto);
    if (monitorVideo) formData.append('video', monitorVideo);
    if (audioBlob) formData.append('audio', audioBlob, 'explicacao-audio.webm');

    try {
      const res = await fetch(`${API_BASE}/api/tickets/${respostaMonitor.ticketId}/resposta`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        alert(`Explicação enviada com sucesso ao aluno!`);
        setRespostaMonitor(prev => ({ ...prev, textoExplicativo: '' }));
        setMonitorPdf(null);
        setMonitorFoto(null);
        setMonitorVideo(null);
        setAudioBlob(null);
        carregarDados();
      }
    } catch (err) {
      alert('Erro ao enviar a resposta.');
    }
  };

  // ETAPA 3: ALUNO DIZ QUE ENTENDEU
  const handleAlunoEntendeu = async (ticketId) => {
    try {
      const res = await fetch(`${API_BASE}/api/tickets/${ticketId}/entendi`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert('Ótimo! O Agente de IA GGE selecionou uma Questão de Fixação para validar o seu aprendizado.');
        carregarDados();
      }
    } catch (err) {
      alert('Erro ao avançar para a questão de fixação.');
    }
  };

  // ETAPA 4: ALUNO RESPONDE QUESTÃO DE FIXAÇÃO
  const handleResponderFixacao = async (ticketId, opcao, teveDuvida = false) => {
    try {
      const res = await fetch(`${API_BASE}/api/tickets/${ticketId}/responder-fixacao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ respostaSelecionada: opcao, teveDuvida })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.mensagem);
        carregarDados();
      }
    } catch (err) {
      alert('Erro ao processar a resposta da questão.');
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      alert('Não foi possível acessar o microfone.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const filteredTickets = tickets.filter(t => {
    if (statusFilter === 'todos') return true;
    if (statusFilter === 'pendente') return t.status === 'Pendente';
    if (statusFilter === 'explicado') return t.status === 'Explicado';
    if (statusFilter === 'praticando') return t.status === 'Praticando';
    if (statusFilter === 'aprovado') return t.status === 'Aprovado';
    return true;
  });

  const currentUserRole = user ? user.role : 'aluno';

  return (
    <div className="gge-app-wrapper">
      
      {/* ============================================================================== */}
      {/* HEADER PRINCIPAL - COLÉGIO GGE MULTIDISCIPLINAR */}
      {/* ============================================================================== */}
      <header className="gge-header">
        <div className="gge-header-content">
          <div className="gge-brand-group">
            <img 
              src="https://cdn.gge.com.br/web/wp-content/uploads/2023/09/logo-gge.png" 
              alt="Colégio GGE Logo" 
              className="gge-brand-logo-img"
            />
            <div className="gge-brand-text">
              <h1>
                Monitoria GGE
                <span className="gge-brand-tag">Todas as Disciplinas</span>
              </h1>
              <p>Ciclo de Aprendizado • Ensino Médio, SSA & ENEM</p>
            </div>
          </div>

          <div className="gge-header-actions">
            {user ? (
              <div className="gge-user-header-badge">
                <div className="gge-user-info-text">
                  <div className="name">{user.name}</div>
                  <div className="unit">{user.unidade?.split('-')[0]} ({user.role})</div>
                </div>
                <div className="gge-user-avatar">{user.name.charAt(0)}</div>
                <button
                  onClick={handleLogout}
                  title="Sair da Conta"
                  className="gge-btn-icon"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="gge-btn gge-btn-primary"
              >
                <LogIn size={15} /> Entrar / Cadastro
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ============================================================================== */}
      {/* CONTAINER PRINCIPAL */}
      {/* ============================================================================== */}
      <div className="gge-container">

        {/* ---------------------------------------------------------------------------- */}
        {/* COLUNA ESQUERDA: SIDEBAR DE PERFIL & FILTROS (DESKTOP) */}
        {/* ---------------------------------------------------------------------------- */}
        <aside className="gge-sidebar">
          {/* Card Perfil do Usuário */}
          <div className="gge-card">
            <div className="gge-card-header">
              <span className="gge-card-title">
                <User size={16} /> Perfil do Usuário
              </span>
            </div>

            {user ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                  <div className="gge-user-avatar" style={{ width: '42px', height: '42px', fontSize: '1.1rem' }}>
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: '800', color: 'var(--gge-text-main)' }}>{user.name}</div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--gge-gold-primary)' }}>{user.turma || user.unidade}</div>
                  </div>
                </div>

                <div style={{ fontSize: '0.75rem', borderTop: '1px solid var(--gge-navy-border)', paddingTop: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                    <span style={{ color: 'var(--gge-text-muted)' }}>Função:</span>
                    <strong style={{ color: '#C8102E', textTransform: 'capitalize' }}>{user.role}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                    <span style={{ color: 'var(--gge-text-muted)' }}>Unidade:</span>
                    <strong>{user.unidade?.replace('Unidade ', '')}</strong>
                  </div>
                </div>

                <button 
                  onClick={handleLogout}
                  className="gge-btn gge-btn-secondary"
                  style={{ width: '100%', marginTop: '14px', fontSize: '0.75rem', color: '#E53935' }}
                >
                  <LogOut size={14} /> Sair da Conta
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '0.775rem', color: 'var(--gge-text-muted)', marginBottom: '12px' }}>
                  Acesse sua conta para enviar dúvidas em qualquer matéria e acompanhar seu progresso!
                </p>
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="gge-btn gge-btn-primary"
                  style={{ width: '100%' }}
                >
                  Fazer Login / Cadastrar
                </button>
              </div>
            )}
          </div>

          {/* Filtro do Ciclo de Aprendizado */}
          <div className="gge-card">
            <div className="gge-card-header">
              <span className="gge-card-title">
                <Layers size={16} /> Ciclo de Aprendizado
              </span>
            </div>

            {[
              { id: 'todos', label: 'Todas as Dúvidas', count: tickets.length },
              { id: 'pendente', label: '1. Dúvida Enviada', count: tickets.filter(t => t.status === 'Pendente').length },
              { id: 'explicado', label: '2. Resposta do Professor', count: tickets.filter(t => t.status === 'Explicado').length },
              { id: 'praticando', label: '4. Fixação com IA', count: tickets.filter(t => t.status === 'Praticando').length },
              { id: 'aprovado', label: '5. Conteúdo Dominado', count: tickets.filter(t => t.status === 'Aprovado').length },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`gge-filter-item ${statusFilter === f.id ? 'active' : ''}`}
              >
                <span>{f.label}</span>
                <span className="gge-filter-count">{f.count}</span>
              </button>
            ))}
          </div>

          {/* Metodologia GGE */}
          <div className="gge-card">
            <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#C8102E', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <BrainCircuit size={16} /> Metodologia Pedagógica
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--gge-text-muted)', lineHeight: '1.5' }}>
              Dúvidas de qualquer matéria (Exatas, Humanas, Biológicas, Linguagens) resolvidas por professores e fixadas com Inteligência Artificial.
            </p>
          </div>
        </aside>

        {/* ---------------------------------------------------------------------------- */}
        {/* COLUNA CENTRAL: FORMULÁRIOS & FEED DE DÚVIDAS */}
        {/* ---------------------------------------------------------------------------- */}
        <main className="gge-main-content">

          {/* FORMULÁRIO DE NOVA DÚVIDA (CAMPO DE ASSUNTO/TÓPICO 100% LIVRE) */}
          {(currentUserRole === 'aluno' || mobileTab === 'nova_duvida') && (
            <div className="gge-card" style={{ borderLeft: '4px solid #C8102E' }}>
              <div className="gge-card-header">
                <span className="gge-card-title">
                  <PlusCircle size={18} style={{ color: '#C8102E' }} /> Nova Dúvida Acadêmica
                </span>
                <span className="gge-badge gge-badge-pendente">Todas as Matérias</span>
              </div>

              {/* BANNER DO USUÁRIO LOGADO */}
              <div className="gge-user-banner">
                <div className="gge-user-banner-left">
                  <div className="gge-user-avatar">
                    {user ? user.name.charAt(0) : 'A'}
                  </div>
                  <div className="gge-user-banner-info">
                    <div className="name">{user ? user.name : 'Aluno Não Autenticado'}</div>
                    <div className="unit">Unidade: <strong>{user ? user.unidade : 'Unidade Boa Viagem'}</strong></div>
                  </div>
                </div>
                {!user && (
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="gge-btn gge-btn-secondary"
                    style={{ fontSize: '0.7rem', padding: '6px 10px' }}
                  >
                    Fazer Login
                  </button>
                )}
              </div>

              <form onSubmit={handleCriarChamado}>
                {/* CAMPO LIVRE DE DIGITAÇÃO PARA MATÉRIA E ASSUNTO */}
                <div className="gge-form-group">
                  <label className="gge-label">Matéria e Assunto / Tópico da Dúvida</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Física - Leis de Ohm ou Redação - Proposta de Intervenção ENEM..."
                    value={novoChamado.assunto}
                    onChange={(e) => setNovoChamado({ ...novoChamado, assunto: e.target.value })}
                    className="gge-input"
                  />
                </div>

                <div className="gge-form-group">
                  <label className="gge-label">Descreva sua dúvida com detalhes</label>
                  <textarea
                    placeholder="Escreva aqui a questão ou o ponto da matéria em que você ficou com dúvida..."
                    value={novoChamado.duvidaTexto}
                    onChange={(e) => setNovoChamado({ ...novoChamado, duvidaTexto: e.target.value })}
                    className="gge-textarea"
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <label className="gge-btn gge-btn-secondary" style={{ fontSize: '0.75rem', cursor: 'pointer' }}>
                    <Camera size={15} style={{ color: 'var(--gge-gold-primary)' }} />
                    <span>{fotoFile ? 'Foto Anexada ✓' : 'Anexar Foto da Questão'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFotoFile(e.target.files[0])}
                      style={{ display: 'none' }}
                    />
                  </label>

                  <button type="submit" className="gge-btn gge-btn-primary">
                    <Send size={15} /> Enviar Dúvida para a Monitoria
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* PAINEL PARA RESPOSTA DO PROFESSOR / MONITOR */}
          {(currentUserRole === 'monitor' || currentUserRole === 'coordenador') && (
            <div className="gge-card" style={{ borderLeft: '4px solid #0284C7' }}>
              <div className="gge-card-header">
                <span className="gge-card-title">
                  <UserCheck size={18} style={{ color: '#0284C7' }} /> Responder Dúvida do Aluno
                </span>
              </div>

              <form onSubmit={handleEnviarResposta}>
                <div className="gge-form-group">
                  <label className="gge-label">Selecionar Chamado</label>
                  <select
                    value={respostaMonitor.ticketId}
                    onChange={(e) => setRespostaMonitor({ ...respostaMonitor, ticketId: e.target.value })}
                    className="gge-select"
                  >
                    {tickets.map(t => (
                      <option key={t.id} value={t.id}>
                        [{t.id}] {t.aluno} - {t.assunto} ({t.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="gge-form-group">
                  <label className="gge-label">Explicação do Professor</label>
                  <textarea
                    placeholder="Digite aqui a resolução passo a passo..."
                    value={respostaMonitor.textoExplicativo}
                    onChange={(e) => setRespostaMonitor({ ...respostaMonitor, textoExplicativo: e.target.value })}
                    className="gge-textarea"
                  />
                </div>

                {/* Mídia & Gravação de Áudio */}
                <div style={{ background: 'var(--gge-navy-bg)', padding: '12px', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--gge-text-muted)' }}>Recursos Multimídia:</span>
                    {recording ? (
                      <button
                        type="button"
                        onClick={stopRecording}
                        className="gge-btn gge-btn-primary"
                        style={{ fontSize: '0.7rem', padding: '4px 10px' }}
                      >
                        Parar Gravação 🔴
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={startRecording}
                        className="gge-btn gge-btn-secondary"
                        style={{ fontSize: '0.7rem', padding: '4px 10px' }}
                      >
                        <Mic size={14} /> {audioBlob ? 'Áudio Gravado ✓' : 'Gravar Áudio'}
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <label className="gge-btn gge-btn-secondary" style={{ fontSize: '0.7rem', justifyContent: 'flex-start', cursor: 'pointer' }}>
                      <FileText size={14} style={{ color: '#E53935' }} />
                      <span>{monitorPdf ? monitorPdf.name : 'PDF Resolução'}</span>
                      <input type="file" accept=".pdf" onChange={(e) => setMonitorPdf(e.target.files[0])} style={{ display: 'none' }} />
                    </label>
                    <label className="gge-btn gge-btn-secondary" style={{ fontSize: '0.7rem', justifyContent: 'flex-start', cursor: 'pointer' }}>
                      <Video size={14} style={{ color: '#10B981' }} />
                      <span>{monitorVideo ? monitorVideo.name : 'Vídeo Explicação'}</span>
                      <input type="file" accept="video/*" onChange={(e) => setMonitorVideo(e.target.files[0])} style={{ display: 'none' }} />
                    </label>
                  </div>
                </div>

                <button type="submit" className="gge-btn gge-btn-primary" style={{ width: '100%' }}>
                  <Send size={15} /> Enviar Explicação ao Aluno
                </button>
              </form>
            </div>
          )}

          {/* LISTA E TIMELINE DAS DÚVIDAS E CICLO DE APRENDIZADO */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--gge-text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} style={{ color: '#C8102E' }} /> Feed de Dúvidas & Ciclo de Aprendizado
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--gge-text-muted)' }}>
                {filteredTickets.length} chamado(s)
              </span>
            </div>

            {loading ? (
              <div className="gge-card" style={{ textAlign: 'center', padding: '32px' }}>
                <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', color: '#C8102E', margin: '0 auto 8px' }} />
                <div style={{ fontSize: '0.8rem', color: 'var(--gge-text-muted)' }}>Carregando dúvidas de monitoria...</div>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="gge-card" style={{ textAlign: 'center', padding: '32px' }}>
                <HelpCircle size={32} style={{ color: 'var(--gge-text-dim)', margin: '0 auto 8px' }} />
                <div style={{ fontSize: '0.875rem', fontWeight: '800', color: 'var(--gge-text-main)' }}>Nenhuma dúvida nesta categoria</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--gge-text-muted)' }}>Selecione outro filtro ou envie uma nova dúvida.</div>
              </div>
            ) : (
              filteredTickets.map(ticket => (
                <div key={ticket.id} className="gge-ticket-card">
                  
                  {/* Header do Chamado */}
                  <div className="gge-ticket-header">
                    <div>
                      <div className="gge-ticket-id">{ticket.id}</div>
                      <div className="gge-ticket-subject">{ticket.assunto}</div>
                      <div className="gge-ticket-meta">
                        Enviado por <strong>{ticket.aluno}</strong> • {ticket.unidade}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {ticket.status === 'Pendente' && <span className="gge-badge gge-badge-pendente">1. Dúvida Pendente</span>}
                      {ticket.status === 'Explicado' && <span className="gge-badge gge-badge-explicado">2. Resposta do Professor</span>}
                      {ticket.status === 'Praticando' && <span className="gge-badge gge-badge-praticando">4. Fixação com IA</span>}
                      {ticket.status === 'Aprovado' && <span className="gge-badge gge-badge-aprovado">5. Conteúdo Dominado ✓</span>}
                    </div>
                  </div>

                  {/* Texto da Dúvida */}
                  <div className="gge-ticket-body">
                    "{ticket.duvidaTexto}"
                    {ticket.fotoUrl && (
                      <div>
                        <img
                          src={`${API_BASE}${ticket.fotoUrl}`}
                          alt="Foto da Questão"
                          className="gge-ticket-image"
                        />
                      </div>
                    )}
                  </div>

                  {/* Resposta do Professor (Etapa 2) */}
                  {ticket.resposta && (
                    <div className="gge-response-box">
                      <div className="gge-response-header">
                        <span><UserCheck size={14} /> Resposta do Professor: {ticket.resposta.monitor}</span>
                        <span style={{ fontSize: '0.675rem', color: 'var(--gge-text-muted)' }}>
                          {new Date(ticket.resposta.respondidoEm).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.8rem', color: 'var(--gge-text-main)' }}>
                        {ticket.resposta.texto}
                      </div>

                      {ticket.resposta.audioUrl && (
                        <div>
                          <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#38BDF8', marginBottom: '4px' }}>
                            <Mic size={12} /> Explicação em Áudio:
                          </div>
                          <audio controls src={`${API_BASE}${ticket.resposta.audioUrl}`} className="gge-audio-player" />
                        </div>
                      )}

                      {ticket.etapa === 2 && (
                        <div style={{ textAlign: 'right', marginTop: '8px' }}>
                          <button
                            onClick={() => handleAlunoEntendeu(ticket.id)}
                            className="gge-btn gge-btn-success"
                            style={{ fontSize: '0.75rem' }}
                          >
                            <CheckCircle2 size={15} /> Entendi! Ir para Questão de Fixação
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Questão de Fixação da IA (Etapa 4) */}
                  {ticket.questaoFixacao && ticket.etapa >= 4 && (
                    <div className="gge-ia-question-box">
                      <div className="gge-ia-header">
                        <span><Sparkles size={14} style={{ color: '#C8102E' }} /> Agente de IA GGE • Questão de Fixação [{ticket.questaoFixacao.vestibular}]</span>
                        <span style={{ background: 'rgba(139, 92, 246, 0.2)', padding: '2px 6px', borderRadius: '4px' }}>
                          Nível {ticket.questaoFixacao.nivel}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--gge-text-main)' }}>
                        {ticket.questaoFixacao.enunciado}
                      </div>

                      <div className="gge-options-grid">
                        {ticket.questaoFixacao.opcoes.map((opcao, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleResponderFixacao(ticket.id, opcao)}
                            disabled={ticket.etapa === 5}
                            className={`gge-option-btn ${
                              ticket.etapa === 5 && opcao === ticket.questaoFixacao.respostaCorreta ? 'correct' : ''
                            }`}
                          >
                            {opcao}
                          </button>
                        ))}
                      </div>

                      {ticket.etapa !== 5 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid rgba(139, 92, 246, 0.2)' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--gge-text-muted)' }}>Ficou com dúvida na resolução?</span>
                          <button
                            onClick={() => handleResponderFixacao(ticket.id, null, true)}
                            className="gge-btn gge-btn-secondary"
                            style={{ fontSize: '0.7rem', padding: '4px 10px', color: '#C8102E' }}
                          >
                            <RotateCcw size={13} /> Voltar para o Professor
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              ))
            )}
          </div>
        </main>

        {/* ---------------------------------------------------------------------------- */}
        {/* COLUNA DIREITA: ESTATÍSTICAS E PAINEL DA COORDENAÇÃO (DESKTOP) */}
        {/* ---------------------------------------------------------------------------- */}
        <aside className="gge-sidebar">
          
          {/* Métricas do Coordenador */}
          <div className="gge-card">
            <div className="gge-card-header">
              <span className="gge-card-title">
                <BarChart3 size={16} style={{ color: '#C8102E' }} /> Desempenho Pedagógico
              </span>
            </div>

            {coordenadorStats ? (
              <div>
                <div className="gge-stats-grid">
                  <div className="gge-stat-card">
                    <div className="gge-stat-number">{coordenadorStats.totalChamados}</div>
                    <div className="gge-stat-label">Total Dúvidas</div>
                  </div>
                  <div className="gge-stat-card" style={{ borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                    <div className="gge-stat-number" style={{ color: '#34D399' }}>{coordenadorStats.taxaAprovacao}</div>
                    <div className="gge-stat-label" style={{ color: '#34D399' }}>Aprovação</div>
                  </div>
                </div>

                <div style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--gge-navy-bg)', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ color: 'var(--gge-text-muted)' }}>Tempo Médio Resposta:</span>
                    <strong style={{ color: '#C8102E' }}>{coordenadorStats.tempoMedioMinutos} min</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--gge-navy-bg)', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ color: 'var(--gge-text-muted)' }}>Precisão da IA:</span>
                    <strong style={{ color: '#C084FC' }}>{coordenadorStats.precisaoIA}</strong>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '0.75rem', color: 'var(--gge-text-muted)' }}>Carregando estatísticas...</div>
            )}
          </div>

          {/* Unidades Colégio GGE */}
          <div className="gge-card">
            <div className="gge-card-header">
              <span className="gge-card-title">
                <Building2 size={16} style={{ color: '#C8102E' }} /> Unidades GGE Recife
              </span>
            </div>

            <div style={{ fontSize: '0.775rem', display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--gge-text-muted)' }}>
              <div>📍 <strong>Boa Viagem:</strong> Av. Conselheiro Aguiar</div>
              <div>📍 <strong>Benfica:</strong> Rua Benfica (Madalena)</div>
              <div>📍 <strong>Parnamirim:</strong> Rua Parnamirim</div>
            </div>
          </div>
        </aside>

      </div>

      {/* ============================================================================== */}
      {/* NAVEGAÇÃO INFERIOR FIXA PARA MOBILE */}
      {/* ============================================================================== */}
      <nav className="gge-bottom-nav">
        <button
          onClick={() => setMobileTab('feed')}
          className={`gge-nav-item ${mobileTab === 'feed' ? 'active' : ''}`}
        >
          <Clock size={18} /> Feed
        </button>
        <button
          onClick={() => setMobileTab('nova_duvida')}
          className={`gge-nav-item ${mobileTab === 'nova_duvida' ? 'active' : ''}`}
        >
          <PlusCircle size={18} /> Nova Dúvida
        </button>
        <button
          onClick={() => setShowAuthModal(true)}
          className={`gge-nav-item ${user ? 'active' : ''}`}
        >
          <User size={18} /> {user ? user.name.split(' ')[0] : 'Entrar'}
        </button>
      </nav>

      {/* ============================================================================== */}
      {/* MODAL DE AUTENTICAÇÃO */}
      {/* ============================================================================== */}
      {showAuthModal && (
        <div className="gge-modal-overlay">
          <div className="gge-modal-card">
            
            <button
              onClick={() => setShowAuthModal(false)}
              className="gge-modal-close"
            >
              <X size={20} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <img 
                src="https://cdn.gge.com.br/web/wp-content/uploads/2023/09/logo-gge.png" 
                alt="Colégio GGE Logo" 
                style={{ height: '48px', width: 'auto', margin: '0 auto 12px', display: 'block', objectFit: 'contain' }}
              />
              <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--gge-text-main)' }}>
                {authMode === 'login' ? 'Acessar Monitoria GGE' : 'Criar Conta no Portal GGE'}
              </div>
              <div style={{ fontSize: '0.725rem', color: 'var(--gge-text-muted)' }}>
                Acesso Seguro ao Portal do Aluno & Monitoria
              </div>
            </div>

            {authError && (
              <div style={{ background: 'rgba(200, 16, 46, 0.2)', border: '1px solid #C8102E', color: '#E53935', fontSize: '0.75rem', padding: '10px', borderRadius: 'var(--radius-md)', marginBottom: '14px' }}>
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit}>
              {authMode === 'register' && (
                <div className="gge-form-group">
                  <label className="gge-label">Nome Completo</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Lucas Silva"
                    value={authForm.name}
                    onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                    className="gge-input"
                  />
                </div>
              )}

              <div className="gge-form-group">
                <label className="gge-label">E-mail Institucional ou Pessoal</label>
                <input
                  type="email"
                  required
                  placeholder="aluno@gge.com.br"
                  value={authForm.email}
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                  className="gge-input"
                />
              </div>

              <div className="gge-form-group">
                <label className="gge-label">Senha</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  className="gge-input"
                />
              </div>

              {authMode === 'register' && (
                <div className="gge-form-group">
                  <label className="gge-label">Unidade GGE</label>
                  <select
                    value={authForm.unidade}
                    onChange={(e) => setAuthForm({ ...authForm, unidade: e.target.value })}
                    className="gge-select"
                  >
                    <option value="Unidade Boa Viagem - Recife">Unidade Boa Viagem - Recife</option>
                    <option value="Unidade Benfica - Recife">Unidade Benfica - Recife</option>
                    <option value="Unidade Parnamirim - Recife">Unidade Parnamirim - Recife</option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="gge-btn gge-btn-primary"
                style={{ width: '100%', padding: '12px' }}
              >
                {authLoading ? 'Processando...' : (authMode === 'login' ? 'Entrar no Sistema' : 'Cadastrar Conta')}
              </button>
            </form>

            {/* Atalhos para Contas Demo Rápidas */}
            <div className="gge-demo-accounts">
              <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--gge-text-muted)' }}>
                Testar com Contas Rápidas:
              </div>
              <div className="gge-demo-btns">
                <button
                  onClick={() => handleFastDemoLogin('lucas@gge.com.br')}
                  className="gge-demo-btn"
                >
                  Aluno Lucas
                </button>
                <button
                  onClick={() => handleFastDemoLogin('professor@gge.com.br')}
                  className="gge-demo-btn"
                >
                  Monitor Professor
                </button>
                <button
                  onClick={() => handleFastDemoLogin('coordenador@gge.com.br')}
                  className="gge-demo-btn"
                >
                  Coordenador
                </button>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '14px' }}>
              <button
                onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError(''); }}
                style={{ background: 'transparent', border: 'none', color: '#C8102E', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
              >
                {authMode === 'login' ? 'Não tem conta? Cadastre-se aqui' : 'Já tem uma conta? Fazer Login'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
