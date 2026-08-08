'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  UserCheck, Send, Camera, FileText, Sparkles, Mic, Video, Clock,
  BrainCircuit, RefreshCw, HelpCircle, RotateCcw, LogOut, Star,
  User, PlusCircle, Layers, X, BarChart3, CheckCircle2, BookOpen,
  Image as ImageIcon, Trash2, Square, Download, Filter, PieChart,
  TrendingUp, Award, Check, Eye
} from 'lucide-react';

const API_BASE = 'http://localhost:8080';

export default function PlataformaMonitoriaGGE() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({
    name: '', email: '', password: '', role: 'aluno',
    area: 'Física', turma: '3º Ano Terceirão - GGE'
  });
  const [profileForm, setProfileForm] = useState({
    name: '', email: '', password: '', turma: '', area: 'Física'
  });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [mobileTab, setMobileTab] = useState('feed');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [coordenadorStats, setCoordenadorStats] = useState(null);
  const [novoChamado, setNovoChamado] = useState({ assunto: '', area: 'Física', tipo: 'texto', duvidaTexto: '' });
  const [fotosAluno, setFotosAluno] = useState([]);
  const [respostaMonitor, setRespostaMonitor] = useState({ ticketId: '', monitor: 'Prof. Ricardo Mendes (Equipe GGE)', textoExplicativo: '' });
  const [monitorPdfs, setMonitorPdfs] = useState([]);
  const [monitorFotos, setMonitorFotos] = useState([]);
  const [monitorVideos, setMonitorVideos] = useState([]);
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const mediaRecorderRef = useRef(null);

  // Lightbox modal para imagem
  const [selectedImage, setSelectedImage] = useState(null);

  // Estado de avaliação da explicação do professor
  const [avaliacoes, setAvaliacoes] = useState({});

  // Navigation State
  const [activeTab, setActiveTab] = useState('atendimento'); // 'atendimento' | 'dashboards' | 'perfil'
  const [filterProfessor, setFilterProfessor] = useState('todos');
  const [filterArea, setFilterArea] = useState('todas');
  const [filterPeriodo, setFilterPeriodo] = useState('7d');
  const [dashboardsData, setDashboardsData] = useState(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('gge_token');
    if (savedToken) { setToken(savedToken); validarSessaoToken(savedToken); }
    carregarDados();
  }, []);

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        password: '',
        turma: user.turma || '',
        area: user.area || 'Física'
      });
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'dashboards' || (user && user.role === 'coordenador')) {
      carregarDashboards();
    }
  }, [activeTab, filterProfessor, filterArea, filterPeriodo]);

  const carregarDashboards = async () => {
    try {
      const query = `professor=${encodeURIComponent(filterProfessor)}&area=${encodeURIComponent(filterArea)}&periodo=${encodeURIComponent(filterPeriodo)}`;
      const res = await fetch(`${API_BASE}/api/coordenador/dashboards?${query}`);
      const data = await res.json();
      if (data.success) {
        setDashboardsData(data);
      }
    } catch (err) {
      console.error('Erro ao carregar dashboards da coordenação:', err);
    }
  };

  const validarSessaoToken = async (authToken) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, { headers: { 'Authorization': `Bearer ${authToken}` } });
      const data = await res.json();
      if (data.success) { setUser(data.user); }
      else { localStorage.removeItem('gge_token'); setToken(null); setUser(null); }
    } catch (err) { console.error('Erro ao validar sessão:', err); }
  };

  const carregarDados = async () => {
    setLoading(true);
    try {
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const ticketsRes = await fetch(`${API_BASE}/api/tickets`, { headers });
      const ticketsData = await ticketsRes.json();
      if (ticketsData.success) {
        setTickets(ticketsData.tickets);
        if (ticketsData.tickets.length > 0 && !respostaMonitor.ticketId) {
          setRespostaMonitor(prev => ({ ...prev, ticketId: ticketsData.tickets[0].id }));
        }
      }
      const statsRes = await fetch(`${API_BASE}/api/coordenador/stats`);
      const statsData = await statsRes.json();
      if (statsData.success) setCoordenadorStats(statsData);
    } catch (err) { console.error('Erro ao conectar ao serviço GGE:', err); }
    finally { setLoading(false); }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault(); setAuthError(''); setAuthLoading(true);
    const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(authForm) });
      const data = await res.json();
      if (!data.success) { setAuthError(data.error || 'Falha na autenticação.'); return; }
      localStorage.setItem('gge_token', data.token); setToken(data.token); setUser(data.user); setShowAuthModal(false);
      setAuthForm({ name: '', email: '', password: '', role: 'aluno', area: 'Física', turma: '3º Ano Terceirão - GGE' });
      carregarDados();
    } catch (err) { setAuthError('Erro de conexão com o servidor.'); }
    finally { setAuthLoading(false); }
  };

  const handleSalvarPerfil = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileForm)
      });
      const data = await res.json();
      if (data.success) {
        alert('Cadastro atualizado com sucesso!');
        setUser(data.user);
        setProfileForm(prev => ({ ...prev, password: '' }));
        setActiveTab('atendimento');
      } else {
        alert(data.error || 'Erro ao atualizar perfil.');
      }
    } catch (err) {
      alert('Erro ao salvar alterações no perfil.');
    }
  };

  const handleUploadAvatar = async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await fetch(`${API_BASE}/api/auth/profile/avatar`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        alert('Foto de perfil atualizada com sucesso!');
      } else {
        alert(data.error || 'Erro ao enviar foto de perfil.');
      }
    } catch (err) {
      alert('Erro de conexão ao enviar foto de perfil.');
    }
  };

  const handleLogout = async () => {
    if (token) { try { await fetch(`${API_BASE}/api/auth/logout`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } }); } catch (err) {} }
    localStorage.removeItem('gge_token'); setToken(null); setUser(null); setShowProfileDropdown(false); alert('Sessão encerrada com sucesso!');
  };

  const handleFastDemoLogin = async (demoEmail) => {
    setAuthLoading(true); setAuthError('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: demoEmail, password: '123456' }) });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('gge_token', data.token);
        setToken(data.token);
        setUser(data.user);
        setShowAuthModal(false);
        carregarDados();
      }
      else { setAuthError(data.error); }
    } catch (err) { setAuthError('Erro no login demo.'); }
    finally { setAuthLoading(false); }
  };

  const handleAddFotosAluno = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFotosAluno(prev => [...prev, ...Array.from(e.target.files)]);
    }
  };
  const handleRemoveFotoAluno = (index) => {
    setFotosAluno(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddPdfs = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setMonitorPdfs(prev => [...prev, ...Array.from(e.target.files)]);
    }
  };

  const handleAddFotos = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setMonitorFotos(prev => [...prev, ...Array.from(e.target.files)]);
    }
  };

  const handleAddVideos = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setMonitorVideos(prev => [...prev, ...Array.from(e.target.files)]);
    }
  };

  const handleCriarChamado = async (e) => {
    e.preventDefault();
    if (!novoChamado.assunto.trim()) { alert('Por favor, informe a matéria e o assunto da sua dúvida.'); return; }
    if (!novoChamado.duvidaTexto && fotosAluno.length === 0) { alert('Por favor, digite sua dúvida ou anexe pelo menos uma foto da questão.'); return; }
    const formData = new FormData();
    formData.append('assunto', novoChamado.assunto);
    formData.append('area', novoChamado.area);
    formData.append('tipo', fotosAluno.length > 0 ? 'foto' : 'texto');
    formData.append('duvidaTexto', novoChamado.duvidaTexto);
    fotosAluno.forEach(file => formData.append('foto', file));
    const headers = {}; if (token) headers['Authorization'] = `Bearer ${token}`;
    try {
      const res = await fetch(`${API_BASE}/api/tickets`, { method: 'POST', headers, body: formData });
      const data = await res.json();
      if (data.success) {
        alert('Dúvida registrada com sucesso no seu histórico!');
        setNovoChamado({ assunto: '', area: 'Física', tipo: 'texto', duvidaTexto: '' });
        setFotosAluno([]);
        setMobileTab('feed');
        carregarDados();
      }
    } catch (err) { alert('Erro ao enviar a dúvida.'); }
  };

  const handleEnviarResposta = async (e) => {
    e.preventDefault(); if (!respostaMonitor.ticketId) return;
    const formData = new FormData();
    formData.append('monitor', user ? `${user.name} (Equipe GGE)` : respostaMonitor.monitor);
    formData.append('texto', respostaMonitor.textoExplicativo);

    monitorPdfs.forEach(file => formData.append('pdf', file));
    monitorFotos.forEach(file => formData.append('foto', file));
    monitorVideos.forEach(file => formData.append('video', file));
    if (audioBlob) formData.append('audio', audioBlob, 'explicacao-audio.webm');

    try {
      const res = await fetch(`${API_BASE}/api/tickets/${respostaMonitor.ticketId}/resposta`, { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        alert('Explicação enviada com sucesso ao aluno!');
        setRespostaMonitor(prev => ({ ...prev, textoExplicativo: '' }));
        setMonitorPdfs([]);
        setMonitorFotos([]);
        setMonitorVideos([]);
        clearAudio();
        carregarDados();
      }
    } catch (err) { alert('Erro ao enviar a resposta.'); }
  };

  const handleAvaliarProfessor = async (ticketId, nota, comentario = '') => {
    try {
      const res = await fetch(`${API_BASE}/api/tickets/${ticketId}/avaliar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nota, comentario })
      });
      const data = await res.json();
      if (data.success) {
        alert('Obrigado pela sua avaliação!');
        setAvaliacoes(prev => ({ ...prev, [ticketId]: nota }));
        carregarDados();
      }
    } catch (err) {
      alert('Erro ao enviar avaliação.');
    }
  };

  const handleAlunoEntendeu = async (ticketId) => {
    try { const res = await fetch(`${API_BASE}/api/tickets/${ticketId}/entendi`, { method: 'POST' }); const data = await res.json();
      if (data.success) { alert('Ótimo! Uma Questão de Fixação foi selecionada para validar seu aprendizado.'); carregarDados(); }
    } catch (err) { alert('Erro ao avançar para a questão de fixação.'); }
  };

  const handleResponderFixacao = async (ticketId, opcao, teveDuvida = false) => {
    try { const res = await fetch(`${API_BASE}/api/tickets/${ticketId}/responder-fixacao`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ respostaSelecionada: opcao, teveDuvida }) });
      const data = await res.json(); if (data.success) { alert(data.mensagem); carregarDados(); }
    } catch (err) { alert('Erro ao processar a resposta da questão.'); }
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
        setAudioUrl(URL.createObjectURL(blob));
      };
      mediaRecorder.start();
      setRecording(true);
    } catch (err) { alert('Não foi possível acessar o microfone.'); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
      setRecording(false);
    }
  };

  const clearAudio = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
  };

  // Feed Privado para Aluno (Histórico Próprio)
  const filteredTickets = tickets.filter(t => {
    if (user && user.role === 'aluno') {
      const eMeu = t.alunoId === user.id || t.alunoEmail === user.email || t.aluno === user.name;
      if (!eMeu) return false;
    }
    if (statusFilter === 'todos') return true;
    if (statusFilter === 'pendente') return t.status === 'Pendente';
    if (statusFilter === 'explicado') return t.status === 'Explicado';
    if (statusFilter === 'entendido') return t.etapa >= 3;
    if (statusFilter === 'praticando') return t.status === 'Praticando';
    if (statusFilter === 'aprovado') return t.status === 'Aprovado';
    return true;
  });

  const currentUserRole = user ? user.role : 'aluno';
  const selectedTicketForMonitor = tickets.find(t => t.id === respostaMonitor.ticketId);

  const statusBadge = (ticket) => {
    if (ticket.status === 'Aprovado') return <span className="gge-badge gge-badge-aprovado">Conteúdo Dominado ✓</span>;
    if (ticket.status === 'Praticando') return <span className="gge-badge gge-badge-praticando">Fixação com IA</span>;
    if (ticket.etapa === 3) return <span className="gge-badge gge-badge-aprovado">Aluno Entendeu</span>;
    if (ticket.status === 'Explicado') return <span className="gge-badge gge-badge-explicado">Resposta do Professor</span>;
    return <span className="gge-badge gge-badge-pendente">Dúvida Pendente</span>;
  };

  /* RENDER DA TELA DE LOGIN OU APP */
  if (!user || showAuthModal) {
    return (
      <div className="gge-login-wrapper">
        <div className="gge-login-grid">
          {/* Lado Esquerdo - Hero Navy */}
          <section className="gge-login-hero">
            <div className="gge-login-hero-header">
              <img src="/logo-gge-official.png" alt="Colégio GGE" className="gge-login-hero-logo-img" />
              <div>
                <span className="gge-login-hero-brand-title">
                  Monitoria GGE
                </span>
                <span className="gge-login-hero-brand-sub">
                  Colégio GGE · Ensino Médio, SSA & ENEM
                </span>
              </div>
            </div>

            <div className="gge-login-hero-main">
              <h1 className="gge-login-hero-title">
                Sua dúvida vira aprendizado no mesmo dia.
              </h1>
              <p className="gge-login-hero-desc">
                Envie a questão por texto ou foto, receba a resolução do professor em vídeo, áudio ou PDF e tire suas dúvidas de forma rápida e individual.
              </p>

              <div className="gge-login-demo-cards">
                <div
                  onClick={() => handleFastDemoLogin('lucas@gge.com.br')}
                  className="gge-login-demo-card"
                >
                  <UserCheck className="gge-login-demo-icon" size={20} />
                  <div>
                    <span className="gge-login-demo-title">Portal do Aluno (Demo)</span>
                    <span className="gge-login-demo-sub">Histórico privado e acompanhamento de respostas.</span>
                  </div>
                </div>

                <div
                  onClick={() => handleFastDemoLogin('professor@gge.com.br')}
                  className="gge-login-demo-card"
                >
                  <BookOpen className="gge-login-demo-icon" size={20} />
                  <div>
                    <span className="gge-login-demo-title">Painel do Monitor (Demo)</span>
                    <span className="gge-login-demo-sub">Visualização da dúvida completa e respostas multimídia.</span>
                  </div>
                </div>

                <div
                  onClick={() => handleFastDemoLogin('coordenador@gge.com.br')}
                  className="gge-login-demo-card"
                >
                  <BarChart3 className="gge-login-demo-icon" size={20} />
                  <div>
                    <span className="gge-login-demo-title">Coordenação Acadêmica (Demo)</span>
                    <span className="gge-login-demo-sub">Tempo de resposta, satisfação e métricas por área.</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="gge-login-hero-footer">
              <CheckCircle2 size={16} style={{ color: '#10B981' }} />
              <span>Ambiente oficial de Monitoria Pedagógica Colégio GGE.</span>
            </div>
          </section>

          {/* Lado Direito - Form de Acesso */}
          <section className="gge-login-form-section">
            <div className="gge-login-card">
              {showAuthModal && user && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
                  <button onClick={() => setShowAuthModal(false)} className="gge-btn gge-btn-outline" style={{ fontSize: '0.8rem', padding: '4px 10px' }}>
                    <X size={16} /> Fechar
                  </button>
                </div>
              )}

              <div className="gge-login-card-header">
                <h2 className="gge-login-card-title">Acesse a plataforma</h2>
                <p className="gge-login-card-sub">
                  Use <strong>lucas@gge.com.br</strong>, <strong>professor@gge.com.br</strong> ou <strong>coordenador@gge.com.br</strong> com a senha <strong>123456</strong>.
                </p>
              </div>

              {authError && (
                <div style={{ background: 'rgba(227,6,18,0.1)', color: '#E30612', padding: '10px 12px', borderRadius: 'var(--radius-md)', fontSize: '0.825rem', marginBottom: '14px', border: '1px solid rgba(227,6,18,0.25)', fontWeight: 600 }}>
                  {authError}
                </div>
              )}

              <div className="gge-tabs-header">
                <button
                  type="button"
                  className={`gge-tab-btn ${authMode === 'login' ? 'active' : ''}`}
                  onClick={() => { setAuthMode('login'); setAuthError(''); }}
                >
                  Entrar
                </button>
                <button
                  type="button"
                  className={`gge-tab-btn ${authMode === 'register' ? 'active' : ''}`}
                  onClick={() => { setAuthMode('register'); setAuthError(''); }}
                >
                  Criar conta
                </button>
              </div>

              <form onSubmit={handleAuthSubmit}>
                {authMode === 'register' && (
                  <div className="gge-form-group">
                    <label className="gge-form-label">Nome Completo</label>
                    <input
                      type="text"
                      required
                      placeholder="Seu nome"
                      value={authForm.name}
                      onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                      className="gge-form-input"
                    />
                  </div>
                )}

                <div className="gge-form-group">
                  <label className="gge-form-label">E-mail institucional</label>
                  <input
                    type="email"
                    required
                    placeholder="seu.email@gge.com.br"
                    value={authForm.email}
                    onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                    className="gge-form-input"
                  />
                </div>

                <div className="gge-form-group">
                  <label className="gge-form-label">Senha</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={authForm.password}
                    onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                    className="gge-form-input"
                  />
                </div>

                {authMode === 'register' && (
                  <>
                    <div className="gge-form-group">
                      <label className="gge-form-label">Papel / Função</label>
                      <select
                        value={authForm.role}
                        onChange={(e) => setAuthForm({ ...authForm, role: e.target.value })}
                        className="gge-form-select"
                      >
                        <option value="aluno">Aluno(a)</option>
                        <option value="monitor">Monitor / Professor</option>
                        <option value="coordenador">Coordenador Pedagógico</option>
                      </select>
                    </div>

                    {(authForm.role === 'coordenador' || authForm.role === 'monitor') && (
                      <div className="gge-form-group">
                        <label className="gge-form-label">Área do Conhecimento</label>
                        <select
                          value={authForm.area}
                          onChange={(e) => setAuthForm({ ...authForm, area: e.target.value })}
                          className="gge-form-select"
                        >
                          <option value="Física">Física</option>
                          <option value="Matemática">Matemática</option>
                          <option value="Química">Química</option>
                          <option value="Biologia">Biologia</option>
                          <option value="Linguagens">Linguagens & Redação</option>
                          <option value="Ciências Humanas">Ciências Humanas</option>
                        </select>
                      </div>
                    )}

                    {authForm.role === 'aluno' && (
                      <div className="gge-form-group">
                        <label className="gge-form-label">Turma</label>
                        <input
                          type="text"
                          placeholder="Ex: 3º Ano Terceirão - GGE"
                          value={authForm.turma}
                          onChange={(e) => setAuthForm({ ...authForm, turma: e.target.value })}
                          className="gge-form-input"
                        />
                      </div>
                    )}
                  </>
                )}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="gge-submit-btn"
                >
                  {authLoading ? 'Acessando...' : authMode === 'login' ? 'Entrar na plataforma' : 'Cadastrar conta'}
                </button>
              </form>

              <div className="gge-demo-logins-box">
                <div className="gge-demo-logins-title">
                  Logins de demonstração rápida:
                </div>
                <div className="gge-demo-logins-grid">
                  <button
                    type="button"
                    onClick={() => handleFastDemoLogin('lucas@gge.com.br')}
                    className="gge-demo-btn"
                  >
                    Aluno
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFastDemoLogin('professor@gge.com.br')}
                    className="gge-demo-btn"
                  >
                    Monitor
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFastDemoLogin('coordenador@gge.com.br')}
                    className="gge-demo-btn"
                  >
                    Coordenação
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="gge-app-wrapper">

      {/* ─── HEADER OFICIAL GGE ─── */}
      <div className="gge-top-bar">
        <div className="gge-top-bar-inner">
          <span>Colégio GGE · Preparação para a Vida · SSA & ENEM</span>
          <span>Portal Oficial de Monitoria Pedagógica</span>
        </div>
      </div>

      <header className="gge-official-header">
        <div className="gge-official-header-inner">
          <div className="gge-official-logo-box">
            <img src="/logo-gge-official.png" alt="Colégio GGE" className="gge-official-logo-img" />
          </div>

          <nav className="gge-official-nav">
            <button
              onClick={() => setActiveTab('atendimento')}
              className={`gge-official-nav-btn ${activeTab === 'atendimento' ? 'active' : ''}`}
            >
              <BookOpen size={16} /> <span>Histórico de Dúvidas</span>
            </button>

            {currentUserRole === 'coordenador' && (
              <button
                onClick={() => setActiveTab('dashboards')}
                className={`gge-official-nav-btn ${activeTab === 'dashboards' ? 'active' : ''}`}
              >
                <BarChart3 size={16} /> <span>Dashboards da Coordenação</span>
              </button>
            )}

            {currentUserRole === 'aluno' && (
              <button
                onClick={() => {
                  const el = document.getElementById('form-duvida');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="gge-official-nav-btn"
              >
                <PlusCircle size={16} /> <span>Nova Dúvida</span>
              </button>
            )}
          </nav>

          {/* PERFIL CLICÁVEL NO CANTO SUPERIOR DIREITO COM FOTO */}
          <div className="gge-official-user-area">
            <div
              className="gge-user-clickable-box"
              onClick={() => setShowProfileDropdown(prev => !prev)}
              title="Clique para ver seu perfil e opções de conta"
            >
              <div className="gge-user-avatar" style={{ width: '40px', height: '40px' }}>
                {user?.avatarUrl ? (
                  <img src={`${API_BASE}${user.avatarUrl}`} alt={user.name} className="gge-user-avatar-img" />
                ) : (
                  user?.name?.charAt(0)
                )}
              </div>
              <div className="gge-official-user-info">
                <div className="gge-official-user-name">{user?.name}</div>
                <div className="gge-official-user-sub">
                  {currentUserRole === 'coordenador' ? `Coordenação (${user?.area || 'Exatas'})` : currentUserRole === 'monitor' ? `Monitor (${user?.area || 'Física'})` : 'Aluno GGE'}
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="gge-official-logout-btn"
              title="Encerrar sessão"
            >
              <LogOut size={14} /> <span>Sair</span>
            </button>

            {/* DROPDOWN / MODAL DE PERFIL DE USUÁRIO */}
            {showProfileDropdown && (
              <div className="gge-profile-dropdown" onClick={(e) => e.stopPropagation()}>
                <div className="gge-dropdown-user-header">
                  <div className="gge-user-avatar" style={{ width: '46px', height: '46px' }}>
                    {user?.avatarUrl ? (
                      <img src={`${API_BASE}${user.avatarUrl}`} alt={user.name} className="gge-user-avatar-img" />
                    ) : (
                      user?.name?.charAt(0)
                    )}
                  </div>
                  <div>
                    <div className="gge-dropdown-user-name">{user?.name}</div>
                    <div className="gge-dropdown-user-email">{user?.email}</div>
                  </div>
                </div>

                <div className="gge-card-divider" style={{ margin: '8px 0' }} />

                <div className="gge-dropdown-menu-list">
                  <button
                    type="button"
                    className="gge-dropdown-item"
                    onClick={() => {
                      setActiveTab('perfil');
                      setShowProfileDropdown(false);
                    }}
                  >
                    <User size={16} style={{ color: '#E30612' }} /> <span>Meu Perfil / Alterar Cadastro</span>
                  </button>

                  <button
                    type="button"
                    className="gge-dropdown-item"
                    onClick={() => {
                      setActiveTab('atendimento');
                      setShowProfileDropdown(false);
                    }}
                  >
                    <BookOpen size={16} style={{ color: '#14387E' }} /> <span>Histórico de Dúvidas</span>
                  </button>

                  <button
                    type="button"
                    className="gge-dropdown-item danger"
                    onClick={() => {
                      setShowProfileDropdown(false);
                      handleLogout();
                    }}
                  >
                    <LogOut size={16} /> <span>Sair da Conta</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ─── MAIN GRID ─── */}
      <div className={activeTab === 'dashboards' && currentUserRole === 'coordenador' ? "gge-container-full" : "gge-container"}>

        {/* ─── ABA 1: PÁGINA DEDICADA DE PERFIL DO USUÁRIO COM UPLOAD DE FOTO ─── */}
        {activeTab === 'perfil' ? (
          <main style={{ width: '100%', maxWidth: '680px', margin: '0 auto' }}>
            <div className="gge-card">
              <div className="gge-card-header" style={{ marginBottom: '1.25rem' }}>
                <h2 className="gge-card-title">
                  <User size={22} style={{ color: '#E30612' }} /> Editar Cadastro & Perfil
                </h2>
                <button
                  type="button"
                  onClick={() => setActiveTab('atendimento')}
                  className="gge-btn gge-btn-outline"
                  style={{ fontSize: '0.8rem', padding: '4px 10px' }}
                >
                  <X size={16} /> Voltar ao Feed
                </button>
              </div>

              {/* SEÇÃO DE FOTO DE PERFIL */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid #CBD5E1' }}>
                <div className="gge-user-avatar" style={{ width: '96px', height: '96px', fontSize: '2.2rem', marginBottom: '12px', borderWidth: '3px' }}>
                  {user?.avatarUrl ? (
                    <img src={`${API_BASE}${user.avatarUrl}`} alt={user.name} className="gge-user-avatar-img" />
                  ) : (
                    user?.name?.charAt(0)
                  )}
                </div>
                <label className="gge-btn gge-btn-secondary" style={{ cursor: 'pointer', fontSize: '0.85rem', padding: '6px 14px' }}>
                  <Camera size={16} style={{ color: '#E30612' }} />
                  <span>{user?.avatarUrl ? 'Alterar Foto de Perfil' : 'Enviar Foto de Perfil'}</span>
                  <input type="file" accept="image/*" onChange={handleUploadAvatar} style={{ display: 'none' }} />
                </label>
              </div>

              <form onSubmit={handleSalvarPerfil}>
                <div className="gge-form-group">
                  <label className="gge-form-label">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="gge-form-input"
                  />
                </div>

                <div className="gge-form-group">
                  <label className="gge-form-label">E-mail Institucional</label>
                  <input
                    type="email"
                    required
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="gge-form-input"
                  />
                </div>

                <div className="gge-form-group">
                  <label className="gge-form-label">Alterar Senha (opcional)</label>
                  <input
                    type="password"
                    placeholder="Preencha apenas se quiser alterar sua senha"
                    value={profileForm.password}
                    onChange={(e) => setProfileForm({ ...profileForm, password: e.target.value })}
                    className="gge-form-input"
                  />
                </div>

                {user?.role === 'aluno' ? (
                  <div className="gge-form-group">
                    <label className="gge-form-label">Turma</label>
                    <input
                      type="text"
                      value={profileForm.turma}
                      onChange={(e) => setProfileForm({ ...profileForm, turma: e.target.value })}
                      className="gge-form-input"
                    />
                  </div>
                ) : (
                  <div className="gge-form-group">
                    <label className="gge-form-label">Área do Conhecimento</label>
                    <select
                      value={profileForm.area}
                      onChange={(e) => setProfileForm({ ...profileForm, area: e.target.value })}
                      className="gge-form-select"
                    >
                      <option value="Física">Física</option>
                      <option value="Matemática">Matemática</option>
                      <option value="Química">Química</option>
                      <option value="Biologia">Biologia</option>
                      <option value="Linguagens">Linguagens & Redação</option>
                      <option value="Ciências Humanas">Ciências Humanas</option>
                    </select>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                  <button type="submit" className="gge-btn gge-btn-primary" style={{ flex: 1 }}>
                    <CheckCircle2 size={18} /> Salvar Alterações no Cadastro
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('atendimento')}
                    className="gge-btn gge-btn-outline"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </main>
        ) : activeTab === 'dashboards' && currentUserRole === 'coordenador' ? (
          /* ─── ABA 2: DASHBOARDS DA COORDENAÇÃO ─── */
          <main style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Header com Filtros do Dashboard */}
            <div className="gge-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#14387E', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BarChart3 size={24} style={{ color: '#E30612' }} /> Painel de Gestão & Indicadores Pedagógicos
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: '#475569', marginTop: '2px' }}>
                    Tempo de resposta, satisfação dos alunos e métricas por área pedagógica.
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="gge-badge gge-badge-aprovado">Dados em Tempo Real ✓</span>
                </div>
              </div>

              {/* Filtros Interativos */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', background: '#F8FAFC', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid #CBD5E1' }}>
                <div>
                  <label className="gge-label">
                    <User size={14} /> Professor / Monitor
                  </label>
                  <select value={filterProfessor} onChange={(e) => setFilterProfessor(e.target.value)} className="gge-select">
                    <option value="todos">Todos os Professores</option>
                    {dashboardsData?.monitores?.map((m, idx) => (
                      <option key={idx} value={m.name}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="gge-label">
                    <BookOpen size={14} /> Área do Conhecimento
                  </label>
                  <select value={filterArea} onChange={(e) => setFilterArea(e.target.value)} className="gge-select">
                    <option value="todas">Todas as Áreas</option>
                    <option value="Física">Física</option>
                    <option value="Matemática">Matemática</option>
                    <option value="Química">Química</option>
                    <option value="Biologia">Biologia</option>
                    <option value="Linguagens">Linguagens</option>
                  </select>
                </div>

                <div>
                  <label className="gge-label">
                    <Clock size={14} /> Período
                  </label>
                  <select value={filterPeriodo} onChange={(e) => setFilterPeriodo(e.target.value)} className="gge-select">
                    <option value="7d">Últimos 7 dias</option>
                    <option value="30d">Este Mês (30 dias)</option>
                    <option value="semestre">Semestre Letivo Atual</option>
                  </select>
                </div>
              </div>
            </div>

            {/* CARDS DE RESUMO DE METRICAS E TEMPO DE RESPOSTA */}
            {dashboardsData ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px' }}>
                  
                  {/* Card 1: Volume */}
                  <div className="gge-card">
                    <div>
                      <div style={{ fontSize: '0.85rem', color: '#475569', fontWeight: '600' }}>Volume Total de Dúvidas</div>
                      <div style={{ fontSize: '1.85rem', fontWeight: '800', color: '#14387E', marginTop: '4px' }}>{dashboardsData.resumo.totalChamados}</div>
                    </div>
                    <div style={{ marginTop: '12px' }}>
                      <div style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 600 }}>
                        {dashboardsData.resumo.taxaAprovacao} resolvidas no ciclo
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Tempo de Resposta */}
                  <div className="gge-card">
                    <div>
                      <div style={{ fontSize: '0.85rem', color: '#475569', fontWeight: '600' }}>Tempo Médio de Resposta</div>
                      <div style={{ fontSize: '1.85rem', fontWeight: '800', color: '#D97706', marginTop: '4px' }}>{dashboardsData.resumo.tempoMedioResposta}</div>
                    </div>
                    <div style={{ marginTop: '12px' }}>
                      <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                        Meta de Resposta: <strong style={{ color: '#059669' }}>{dashboardsData.resumo.metaTempoResposta} ✓</strong>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Taxa de Resolução Pedagógica */}
                  <div className="gge-card">
                    <div>
                      <div style={{ fontSize: '0.85rem', color: '#475569', fontWeight: '600' }}>Taxa de Resolução Pedagógica</div>
                      <div style={{ fontSize: '1.85rem', fontWeight: '800', color: '#0284C7', marginTop: '4px' }}>{dashboardsData.resumo.taxaResolucaoPedagogica}</div>
                    </div>
                    <div style={{ marginTop: '12px' }}>
                      <div style={{ fontSize: '0.8rem', color: '#0284C7', fontWeight: 600 }}>
                        Meta Cumprida: {dashboardsData.resumo.cumprimentoMetaTempo}
                      </div>
                    </div>
                  </div>

                  {/* Card 4: Satisfação dos Alunos */}
                  <div className="gge-card">
                    <div>
                      <div style={{ fontSize: '0.85rem', color: '#475569', fontWeight: '600' }}>Satisfação dos Alunos</div>
                      <div style={{ fontSize: '1.85rem', fontWeight: '800', color: '#7E22CE', marginTop: '4px' }}>{dashboardsData.resumo.satisfacaoAlunosGeral}</div>
                    </div>
                    <div style={{ marginTop: '12px' }}>
                      <div style={{ fontSize: '0.8rem', color: '#7E22CE', fontWeight: '600' }}>
                        Precisão da IA: {dashboardsData.resumo.precisaoIA}
                      </div>
                    </div>
                  </div>
                </div>

                {/* TABELA DE DESEMPENHO DOS PROFESSORES */}
                <div className="gge-card">
                  <div className="gge-card-header" style={{ justifyContent: 'space-between', marginBottom: '14px' }}>
                    <span className="gge-card-title"><UserCheck size={18} style={{ color: '#E30612' }} /> Desempenho Detalhado por Professor / Monitor</span>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #CBD5E1', color: '#14387E' }}>
                          <th style={{ padding: '12px' }}>Professor</th>
                          <th style={{ padding: '12px' }}>Área / Disciplina</th>
                          <th style={{ padding: '12px' }}>Atendidos</th>
                          <th style={{ padding: '12px' }}>Tempo de Resposta</th>
                          <th style={{ padding: '12px' }}>Taxa de Resolução</th>
                          <th style={{ padding: '12px' }}>Satisfação dos Alunos</th>
                          <th style={{ padding: '12px' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboardsData.monitores.map((m, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #E2E8F0', color: '#1e293b' }}>
                            <td style={{ padding: '14px 12px', fontWeight: '700', color: '#14387E' }}>{m.name}</td>
                            <td style={{ padding: '14px 12px' }}>{m.disciplina}</td>
                            <td style={{ padding: '14px 12px', fontWeight: '700' }}>{m.atendidos}</td>
                            <td style={{ padding: '14px 12px', color: '#E30612', fontWeight: '600' }}>{m.tempoMedioResposta}</td>
                            <td style={{ padding: '14px 12px', color: '#059669', fontWeight: '600' }}>{m.resolucaoPedagogica}</td>
                            <td style={{ padding: '14px 12px', color: '#D97706', fontWeight: '600' }}>{m.satisfacaoAlunos}</td>
                            <td style={{ padding: '14px 12px' }}>
                              <span className="gge-badge gge-badge-aprovado">{m.statusResposta} ✓</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="gge-card" style={{ textAlign: 'center', padding: '40px' }}>
                <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', color: '#E30612', margin: '0 auto 10px' }} />
                <p style={{ fontSize: '0.9rem', color: '#475569' }}>Carregando estatísticas pedagógicas...</p>
              </div>
            )}
          </main>
        ) : (
          /* ─── ABA 3: FEED PRINCIPAL DE DÚVIDAS (ATENDIMENTO) ─── */
          <>
            {/* ─── LEFT SIDEBAR ─── */}
            <aside className="gge-sidebar">

              {/* Cycle Filter */}
              <div className="gge-card">
                <div className="gge-card-header">
                  <span className="gge-card-title"><Layers size={18} style={{ color: '#E30612' }} /> Ciclo de Aprendizado</span>
                </div>
                <div className="gge-filter-buttons-grid">
                  {[
                    { id: 'todos', label: 'Todas', count: filteredTickets.length },
                    { id: 'pendente', label: 'Dúvida Enviada', count: filteredTickets.filter(t => t.status === 'Pendente').length },
                    { id: 'explicado', label: 'Resposta do Professor', count: filteredTickets.filter(t => t.status === 'Explicado').length },
                    { id: 'entendido', label: 'Aluno Entendido', count: filteredTickets.filter(t => t.etapa >= 3 && t.etapa < 4).length },
                    { id: 'praticando', label: 'Fixação com IA', count: filteredTickets.filter(t => t.status === 'Praticando').length },
                    { id: 'aprovado', label: 'Conteúdo Dominado', count: filteredTickets.filter(t => t.status === 'Aprovado').length },
                  ].map(f => (
                    <button key={f.id} onClick={() => setStatusFilter(f.id)} className={`gge-filter-item ${statusFilter === f.id ? 'active' : ''}`}>
                      <span>{f.label}</span>
                      <span className="gge-filter-count">{f.count}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Methodology */}
              <div className="gge-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <BrainCircuit size={18} style={{ color: '#E30612' }} />
                  <span style={{ fontSize: '0.95rem', fontWeight: '800', color: '#14387E' }}>Metodologia GGE</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: '1.6' }}>
                  Dúvidas de qualquer matéria resolvidas por professores e fixadas com Inteligência Artificial.
                </p>
              </div>
            </aside>

            {/* ─── CENTER — MAIN CONTENT ─── */}
            <main className="gge-main-content">

              {/* Form Nova Dúvida (Visível para Alunos) */}
              {(currentUserRole === 'aluno' || mobileTab === 'nova_duvida') && (
                <div className="gge-card" id="form-duvida">
                  <div className="gge-card-header">
                    <span className="gge-card-title">
                      <PlusCircle size={18} style={{ color: '#E30612' }} /> Nova Dúvida
                    </span>
                  </div>

                  <div className="gge-user-banner">
                    <div className="gge-user-banner-left">
                      <div className="gge-user-avatar">
                        {user?.avatarUrl ? (
                          <img src={`${API_BASE}${user.avatarUrl}`} alt={user.name} className="gge-user-avatar-img" />
                        ) : (
                          user ? user.name.charAt(0) : 'A'
                        )}
                      </div>
                      <div className="gge-user-banner-info">
                        <div className="name">{user ? user.name : 'Visitante'}</div>
                        <div className="unit">{user ? user.email : 'Faça login para enviar'}</div>
                      </div>
                    </div>
                    {!user && (
                      <button onClick={() => setShowAuthModal(true)} className="gge-btn gge-btn-secondary" style={{ fontSize: '0.8rem' }}>
                        Entrar
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleCriarChamado}>
                    <div className="gge-form-group">
                      <label className="gge-label">Área do Conhecimento</label>
                      <select
                        value={novoChamado.area}
                        onChange={(e) => setNovoChamado({ ...novoChamado, area: e.target.value })}
                        className="gge-select"
                      >
                        <option value="Física">Física</option>
                        <option value="Matemática">Matemática</option>
                        <option value="Química">Química</option>
                        <option value="Biologia">Biologia</option>
                        <option value="Linguagens">Linguagens & Redação</option>
                        <option value="Ciências Humanas">Ciências Humanas</option>
                      </select>
                    </div>

                    <div className="gge-form-group">
                      <label className="gge-label">Matéria e Assunto</label>
                      <input type="text" required placeholder="Ex: Física — Leis de Ohm, Redação — Proposta de Intervenção..."
                        value={novoChamado.assunto} onChange={(e) => setNovoChamado({ ...novoChamado, assunto: e.target.value })} className="gge-input" />
                    </div>

                    <div className="gge-form-group">
                      <label className="gge-label">Sua Dúvida</label>
                      <textarea
                        placeholder="Descreva a questão ou o ponto da matéria que você não entendeu..."
                        value={novoChamado.duvidaTexto}
                        onChange={(e) => setNovoChamado({ ...novoChamado, duvidaTexto: e.target.value })}
                        onInput={(e) => {
                          e.target.style.height = 'auto';
                          e.target.style.height = `${e.target.scrollHeight + 4}px`;
                        }}
                        className="gge-textarea"
                        rows={3}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                        <label className="gge-btn gge-btn-secondary" style={{ cursor: 'pointer', fontSize: '0.875rem' }}>
                          <Camera size={16} style={{ color: '#D97706' }} />
                          <span>{fotosAluno.length > 0 ? `+ Anexar Fotos (${fotosAluno.length})` : 'Anexar Foto(s)'}</span>
                          <input type="file" accept="image/*" multiple onChange={handleAddFotosAluno} style={{ display: 'none' }} />
                        </label>
                        <button type="submit" className="gge-btn gge-btn-primary">
                          <Send size={16} /> Enviar Dúvida
                        </button>
                      </div>

                      {fotosAluno.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                          {fotosAluno.map((file, idx) => (
                            <span key={idx} style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              <ImageIcon size={14} style={{ color: '#D97706' }} /> {file.name}
                              <button type="button" onClick={() => handleRemoveFotoAluno(idx)} style={{ background: 'none', border: 'none', color: '#e11d48', cursor: 'pointer', padding: '0 2px' }}>
                                <X size={14} />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </form>
                </div>
              )}

              {/* Form Responder Dúvida com Preview Completo da Dúvida Selecionada */}
              {(currentUserRole === 'monitor' || currentUserRole === 'coordenador') && (
                <div className="gge-card">
                  <div className="gge-card-header">
                    <span className="gge-card-title"><UserCheck size={18} style={{ color: '#0284C7' }} /> Responder Dúvida</span>
                  </div>
                  <form onSubmit={handleEnviarResposta}>
                    <div className="gge-form-group">
                      <label className="gge-label">Selecionar Dúvida para Atendimento</label>
                      <select
                        value={respostaMonitor.ticketId}
                        onChange={(e) => setRespostaMonitor({ ...respostaMonitor, ticketId: e.target.value })}
                        className="gge-select"
                      >
                        <option value="">-- Escolha um chamado da fila --</option>
                        {tickets.map(t => (
                          <option key={t.id} value={t.id}>[{t.id}] {t.aluno} — {t.assunto} ({t.status})</option>
                        ))}
                      </select>
                    </div>

                    {/* PREVIEW COMPLETO DA DÚVIDA SELEIONADA PELO MONITOR */}
                    {selectedTicketForMonitor && (
                      <div className="gge-selected-doubt-preview">
                        <div className="gge-selected-doubt-title">
                          <Eye size={16} /> Detalhes Completos da Dúvida Selecionada [{selectedTicketForMonitor.id}]
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '4px' }}>
                          Aluno: <strong style={{ color: '#14387E' }}>{selectedTicketForMonitor.aluno}</strong> · Matéria: <strong style={{ color: '#E30612' }}>{selectedTicketForMonitor.assunto}</strong>
                        </div>
                        <div className="gge-selected-doubt-text">
                          {selectedTicketForMonitor.duvidaTexto || <em>Dúvida enviada via anexo de imagem/foto.</em>}
                        </div>
                        {selectedTicketForMonitor.fotoUrls && selectedTicketForMonitor.fotoUrls.length > 0 && (
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                            {selectedTicketForMonitor.fotoUrls.map((url, i) => (
                              <img
                                key={i}
                                src={`${API_BASE}${url}`}
                                alt="Questão do aluno"
                                onClick={() => setSelectedImage(`${API_BASE}${url}`)}
                                style={{ height: '80px', width: 'auto', borderRadius: '6px', border: '1px solid #CBD5E1', cursor: 'pointer' }}
                                title="Clique para ampliar e baixar"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="gge-form-group">
                      <label className="gge-label">Explicação Passo a Passo</label>
                      <textarea
                        placeholder="Resolução detalhada da questão..."
                        value={respostaMonitor.textoExplicativo}
                        onChange={(e) => setRespostaMonitor({ ...respostaMonitor, textoExplicativo: e.target.value })}
                        onInput={(e) => {
                          e.target.style.height = 'auto';
                          e.target.style.height = `${e.target.scrollHeight + 4}px`;
                        }}
                        className="gge-textarea"
                        rows={3}
                      />
                    </div>
                    
                    {/* Formas de Enviar Conteudo (Recursos) */}
                    <div className="gge-resources-box">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: '700', color: '#14387E' }}>Anexar Recursos à Explicação</span>
                        {recording ? (
                          <button type="button" onClick={stopRecording} className="gge-btn gge-btn-primary" style={{ fontSize: '0.8rem', padding: '6px 12px', background: '#E30612' }}>
                            <Square size={14} fill="white" /> Parar Gravação 🔴
                          </button>
                        ) : (
                          <button type="button" onClick={startRecording} className="gge-btn gge-btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 12px', color: audioBlob ? '#059669' : '#14387E' }}>
                            <Mic size={15} style={{ color: audioBlob ? '#059669' : '#0284C7' }} /> {audioBlob ? 'Regravar Áudio' : 'Gravar Áudio'}
                          </button>
                        )}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '12px' }}>
                        <label className="gge-resource-btn" style={{ cursor: 'pointer' }}>
                          <FileText size={16} style={{ color: '#e11d48' }} /> <span>+ PDF</span>
                          <input type="file" accept=".pdf" multiple onChange={handleAddPdfs} style={{ display: 'none' }} />
                        </label>
                        <label className="gge-resource-btn" style={{ cursor: 'pointer' }}>
                          <ImageIcon size={16} style={{ color: '#D97706' }} /> <span>+ Imagem</span>
                          <input type="file" accept="image/*" multiple onChange={handleAddFotos} style={{ display: 'none' }} />
                        </label>
                        <label className="gge-resource-btn" style={{ cursor: 'pointer' }}>
                          <Video size={16} style={{ color: '#059669' }} /> <span>+ Vídeo</span>
                          <input type="file" accept="video/*" multiple onChange={handleAddVideos} style={{ display: 'none' }} />
                        </label>
                      </div>

                      {/* Player de áudio gravado */}
                      {audioUrl && (
                        <div style={{ background: '#F1F5F9', padding: '10px 12px', borderRadius: '8px', marginBottom: '10px', border: '1px solid #CBD5E1' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#0284C7', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Mic size={14} /> Áudio gravado — Ouça antes de enviar:
                            </span>
                            <button type="button" onClick={clearAudio} style={{ background: 'none', border: 'none', color: '#e11d48', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Trash2 size={14} /> <span style={{ fontSize: '0.75rem' }}>Apagar</span>
                            </button>
                          </div>
                          <audio controls src={audioUrl} style={{ width: '100%', height: '36px' }} />
                        </div>
                      )}
                    </div>

                    <button type="submit" className="gge-btn gge-btn-primary" style={{ width: '100%' }}>
                      <Send size={16} /> Enviar Explicação ao Aluno
                    </button>
                  </form>
                </div>
              )}

              {/* ─── HISTÓRICO DE DÚVIDAS ─── */}
              <div id="feed-section">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#14387E', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BookOpen size={20} style={{ color: '#E30612' }} />
                    {user?.role === 'aluno' ? 'Seu Histórico Privado de Dúvidas' : 'Fila Geral de Dúvidas'}
                  </h2>
                  <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: '600' }}>
                    {filteredTickets.length} {filteredTickets.length === 1 ? 'chamado' : 'chamados'}
                  </span>
                </div>

                {loading ? (
                  <div className="gge-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', color: '#E30612', marginBottom: '10px' }} />
                    <p style={{ fontSize: '0.9rem', color: '#475569' }}>Carregando dúvidas...</p>
                  </div>
                ) : filteredTickets.length === 0 ? (
                  <div className="gge-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <HelpCircle size={32} style={{ color: '#64748B', marginBottom: '10px' }} />
                    <p style={{ fontSize: '1rem', fontWeight: '800', color: '#14387E', marginBottom: '4px' }}>Nenhuma dúvida cadastrada</p>
                    <p style={{ fontSize: '0.85rem', color: '#475569' }}>Use o botão "Nova Dúvida" para enviar sua questão ao professor.</p>
                  </div>
                ) : (
                  filteredTickets.map(ticket => (
                    <div key={ticket.id} className="gge-ticket-card">

                      {/* Ticket header */}
                      <div className="gge-ticket-header">
                        <div style={{ minWidth: 0 }}>
                          <div className="gge-ticket-id">{ticket.id} · {ticket.area || 'Física'}</div>
                          <div className="gge-ticket-subject">{ticket.assunto}</div>
                          <div className="gge-ticket-meta">por <strong>{ticket.aluno}</strong> · {new Date(ticket.criadoEm).toLocaleDateString('pt-BR')}</div>
                        </div>
                        {statusBadge(ticket)}
                      </div>

                      {/* Doubt text */}
                      <div className="gge-ticket-body">
                        {ticket.duvidaTexto}
                        {ticket.fotoUrls && ticket.fotoUrls.length > 0 ? (
                          <div style={{ display: 'grid', gridTemplateColumns: ticket.fotoUrls.length > 1 ? 'repeat(auto-fit, minmax(180px, 1fr))' : '1fr', gap: '10px', marginTop: '12px' }}>
                            {ticket.fotoUrls.map((url, idx) => (
                              <img
                                key={idx}
                                src={`${API_BASE}${url}`}
                                alt={`Foto da Questão ${idx + 1}`}
                                onClick={() => setSelectedImage(`${API_BASE}${url}`)}
                                className="gge-ticket-image"
                                style={{ cursor: 'pointer' }}
                                title="Clique para ampliar e baixar foto"
                              />
                            ))}
                          </div>
                        ) : ticket.fotoUrl ? (
                          <img
                            src={`${API_BASE}${ticket.fotoUrl}`}
                            alt="Foto da Questão"
                            onClick={() => setSelectedImage(`${API_BASE}${ticket.fotoUrl}`)}
                            className="gge-ticket-image"
                            style={{ cursor: 'pointer' }}
                            title="Clique para ampliar e baixar foto"
                          />
                        ) : null}
                      </div>

                      {/* Teacher response */}
                      {ticket.resposta && (
                        <div className="gge-response-box">
                          <div className="gge-response-header">
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><UserCheck size={16} /> {ticket.resposta.monitor}</span>
                            <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                              {new Date(ticket.resposta.respondidoEm).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          {ticket.resposta.texto && <p style={{ fontSize: '0.95rem', color: '#1e293b', lineHeight: '1.6', marginBottom: '10px' }}>{ticket.resposta.texto}</p>}
                          
                          {/* Audio */}
                          {ticket.resposta.audioUrl && (
                            <div style={{ marginBottom: '12px' }}>
                              <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#0284C7', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Mic size={14} /> Áudio do professor
                              </div>
                              <audio controls src={`${API_BASE}${ticket.resposta.audioUrl}`} style={{ width: '100%', height: '38px' }} />
                            </div>
                          )}

                          {/* Photos */}
                          {((ticket.resposta.fotoUrls && ticket.resposta.fotoUrls.length > 0) || ticket.resposta.fotoUrl) && (
                            <div style={{ display: 'grid', gridTemplateColumns: (ticket.resposta.fotoUrls?.length > 1) ? 'repeat(auto-fit, minmax(200px, 1fr))' : '1fr', gap: '10px', marginBottom: '10px' }}>
                              {(ticket.resposta.fotoUrls && ticket.resposta.fotoUrls.length > 0 ? ticket.resposta.fotoUrls : [ticket.resposta.fotoUrl]).map((url, i) => (
                                <img
                                  key={i}
                                  src={`${API_BASE}${url}`}
                                  alt={`Imagem explicativa ${i + 1}`}
                                  onClick={() => setSelectedImage(`${API_BASE}${url}`)}
                                  className="gge-ticket-image"
                                  style={{ cursor: 'pointer' }}
                                  title="Clique para ampliar e baixar foto"
                                />
                              ))}
                            </div>
                          )}

                          {/* PDFs */}
                          {((ticket.resposta.pdfUrls && ticket.resposta.pdfUrls.length > 0) || ticket.resposta.pdfUrl) && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                              {(ticket.resposta.pdfUrls && ticket.resposta.pdfUrls.length > 0 ? ticket.resposta.pdfUrls : [ticket.resposta.pdfUrl]).map((url, i) => (
                                <a key={i} href={`${API_BASE}${url}`} target="_blank" rel="noreferrer" className="gge-btn gge-btn-secondary" style={{ fontSize: '0.85rem' }}>
                                  <FileText size={16} style={{ color: '#e11d48' }} /> <span>PDF Explicativo {i > 0 ? `#${i+1}` : ''}</span>
                                </a>
                              ))}
                            </div>
                          )}

                          {ticket.etapa === 2 && user?.role === 'aluno' && (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                              <button onClick={() => handleAlunoEntendeu(ticket.id)} className="gge-btn gge-btn-primary">
                                <CheckCircle2 size={16} /> Entendi! Ir para Fixação
                              </button>
                            </div>
                          )}

                          {/* SISTEMA DE AVALIAÇÃO DA EXPLICAÇÃO PELO ALUNO */}
                          {ticket.resposta && user?.role === 'aluno' && (
                            <div className="gge-rating-card">
                              <div className="gge-rating-title">
                                <Star size={16} fill="#F59E0B" /> Avalie a Explicação do Professor
                              </div>
                              <p style={{ fontSize: '0.825rem', color: '#78350F' }}>
                                Como você avalia a clareza e didática desta resolução?
                              </p>
                              <div className="gge-stars-row">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() => handleAvaliarProfessor(ticket.id, star)}
                                    className={`gge-star-btn ${(ticket.avaliacao?.nota || avaliacoes[ticket.id]) >= star ? 'active' : ''}`}
                                  >
                                    ★
                                  </button>
                                ))}
                              </div>
                              {ticket.avaliacao && (
                                <div style={{ fontSize: '0.8rem', color: '#92400E', fontWeight: 600, marginTop: '4px' }}>
                                  Sua avaliação enviada: {ticket.avaliacao.nota} / 5 Estrelas ★
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* AI fixation */}
                      {ticket.questaoFixacao && ticket.etapa >= 4 && (
                        <div className="gge-ia-question-box">
                          <div className="gge-ia-header">
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Sparkles size={16} style={{ color: '#E30612' }} /> IA GGE · Fixação [{ticket.questaoFixacao.vestibular}]
                            </span>
                            <span style={{ fontSize: '0.75rem', background: 'rgba(126,34,206,.15)', padding: '3px 9px', borderRadius: '9999px', fontWeight: 700 }}>
                              Nível {ticket.questaoFixacao.nivel}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.95rem', fontWeight: '600', color: '#1e293b', lineHeight: '1.6' }}>{ticket.questaoFixacao.enunciado}</p>
                          <div className="gge-options-grid">
                            {ticket.questaoFixacao.opcoes.map((opcao, idx) => (
                              <button key={idx} onClick={() => handleResponderFixacao(ticket.id, opcao)} disabled={ticket.etapa === 5}
                                className={`gge-option-btn ${ticket.etapa === 5 && opcao === ticket.questaoFixacao.respostaCorreta ? 'correct' : ''}`}>
                                {opcao}
                              </button>
                            ))}
                          </div>
                          {ticket.etapa !== 5 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid rgba(126,34,206,.15)' }}>
                              <span style={{ fontSize: '0.825rem', color: '#64748B' }}>Ainda tem dúvida?</span>
                              <button onClick={() => handleResponderFixacao(ticket.id, null, true)} className="gge-btn gge-btn-secondary" style={{ fontSize: '0.825rem', padding: '6px 12px', color: '#E30612' }}>
                                <RotateCcw size={14} /> Voltar ao Professor
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
          </>
        )}
      </div>

      {/* ─── MODAL LIGHTBOX DE VISUALIZAÇÃO E DOWNLOAD DE FOTOS ─── */}
      {selectedImage && (
        <div className="gge-lightbox-overlay" onClick={() => setSelectedImage(null)}>
          <div className="gge-lightbox-card" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelectedImage(null)} style={{ position: 'absolute', top: '12px', right: '12px', background: '#F1F5F9', border: 'none', borderRadius: '50%', padding: '6px', cursor: 'pointer' }}>
              <X size={20} />
            </button>
            <img src={selectedImage} alt="Visualização expandida da dúvida" className="gge-lightbox-img" />
            <div className="gge-lightbox-actions">
              <a href={selectedImage} download="duvida-gge.jpg" target="_blank" rel="noreferrer" className="gge-btn gge-btn-primary">
                <Download size={16} /> Baixar Foto
              </a>
              <button onClick={() => setSelectedImage(null)} className="gge-btn gge-btn-outline">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── AUTH MODAL ─── */}
      {showAuthModal && (
        <div className="gge-lightbox-overlay">
          <div className="gge-login-card" style={{ maxWidth: '420px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
              <button onClick={() => setShowAuthModal(false)} className="gge-btn gge-btn-outline" style={{ padding: '4px 8px', fontSize: '0.8rem' }}><X size={16} /></button>
            </div>
            <div className="gge-login-card-header" style={{ textAlign: 'center' }}>
              <img src="/logo-gge-official.png" alt="GGE" style={{ height: '40px', margin: '0 auto 10px', display: 'block' }} />
              <h2 className="gge-login-card-title">{authMode === 'login' ? 'Entrar no GGE' : 'Criar Conta'}</h2>
            </div>
            <form onSubmit={handleAuthSubmit}>
              {authMode === 'register' && (
                <div className="gge-form-group">
                  <label className="gge-form-label">Nome Completo</label>
                  <input type="text" required placeholder="Seu nome" value={authForm.name} onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })} className="gge-form-input" />
                </div>
              )}
              <div className="gge-form-group">
                <label className="gge-form-label">E-mail institucional</label>
                <input type="email" required placeholder="seu.email@gge.com.br" value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} className="gge-form-input" />
              </div>
              <div className="gge-form-group">
                <label className="gge-form-label">Senha</label>
                <input type="password" required placeholder="••••••••" value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} className="gge-form-input" />
              </div>
              <button type="submit" className="gge-submit-btn">{authLoading ? 'Acessando...' : authMode === 'login' ? 'Entrar' : 'Cadastrar'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
