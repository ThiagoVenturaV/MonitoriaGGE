'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  UserCheck, Send, Camera, FileText, Sparkles, Mic, Video, Clock,
  Building2, BrainCircuit, RefreshCw, HelpCircle, RotateCcw, LogOut,
  LogIn, User, PlusCircle, Layers, X, BarChart3, CheckCircle2, BookOpen,
  Image as ImageIcon, Trash2, Square
} from 'lucide-react';

const API_BASE = 'http://localhost:8080';

export default function PlataformaMonitoriaGGE() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({
    name: '', email: '', password: '', role: 'aluno',
    unidade: 'Unidade Boa Viagem - Recife', turma: '3º Ano Terceirão - GGE'
  });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [mobileTab, setMobileTab] = useState('feed');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [coordenadorStats, setCoordenadorStats] = useState(null);
  const [novoChamado, setNovoChamado] = useState({ assunto: '', tipo: 'texto', duvidaTexto: '' });
  const [fotosAluno, setFotosAluno] = useState([]);
  const [respostaMonitor, setRespostaMonitor] = useState({ ticketId: '', monitor: 'Prof. Ricardo Mendes (Equipe GGE)', textoExplicativo: '' });
  const [monitorPdfs, setMonitorPdfs] = useState([]);
  const [monitorFotos, setMonitorFotos] = useState([]);
  const [monitorVideos, setMonitorVideos] = useState([]);
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const mediaRecorderRef = useRef(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('gge_token');
    if (savedToken) { setToken(savedToken); validarSessaoToken(savedToken); }
    carregarDados();
  }, []);

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
      const ticketsRes = await fetch(`${API_BASE}/api/tickets`);
      const ticketsData = await ticketsRes.json();
      if (ticketsData.success) {
        setTickets(ticketsData.tickets);
        if (ticketsData.tickets.length > 0) setRespostaMonitor(prev => ({ ...prev, ticketId: ticketsData.tickets[0].id }));
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
      setAuthForm({ name: '', email: '', password: '', role: 'aluno', unidade: 'Unidade Boa Viagem - Recife', turma: '3º Ano Terceirão - GGE' });
    } catch (err) { setAuthError('Erro de conexão com o servidor.'); }
    finally { setAuthLoading(false); }
  };

  const handleLogout = async () => {
    if (token) { try { await fetch(`${API_BASE}/api/auth/logout`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } }); } catch (err) {} }
    localStorage.removeItem('gge_token'); setToken(null); setUser(null); alert('Sessão encerrada com sucesso!');
  };

  const handleFastDemoLogin = async (demoEmail) => {
    setAuthLoading(true); setAuthError('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: demoEmail, password: '123456' }) });
      const data = await res.json();
      if (data.success) { localStorage.setItem('gge_token', data.token); setToken(data.token); setUser(data.user); setShowAuthModal(false); }
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
  const handleRemovePdf = (index) => {
    setMonitorPdfs(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddFotos = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setMonitorFotos(prev => [...prev, ...Array.from(e.target.files)]);
    }
  };
  const handleRemoveFoto = (index) => {
    setMonitorFotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddVideos = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setMonitorVideos(prev => [...prev, ...Array.from(e.target.files)]);
    }
  };
  const handleRemoveVideo = (index) => {
    setMonitorVideos(prev => prev.filter((_, i) => i !== index));
  };

  const handleCriarChamado = async (e) => {
    e.preventDefault();
    if (!novoChamado.assunto.trim()) { alert('Por favor, informe a matéria e o assunto da sua dúvida.'); return; }
    if (!novoChamado.duvidaTexto && fotosAluno.length === 0) { alert('Por favor, digite sua dúvida ou anexe pelo menos uma foto da questão.'); return; }
    const formData = new FormData();
    formData.append('assunto', novoChamado.assunto);
    formData.append('tipo', fotosAluno.length > 0 ? 'foto' : 'texto');
    formData.append('duvidaTexto', novoChamado.duvidaTexto);
    fotosAluno.forEach(file => formData.append('foto', file));
    const headers = {}; if (token) headers['Authorization'] = `Bearer ${token}`;
    try {
      const res = await fetch(`${API_BASE}/api/tickets`, { method: 'POST', headers, body: formData });
      const data = await res.json();
      if (data.success) {
        alert('Dúvida enviada com sucesso! Acompanhe o Ciclo de Aprendizado.');
        setNovoChamado({ assunto: '', tipo: 'texto', duvidaTexto: '' });
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
        alert('Explicação enviada com sucesso!');
        setRespostaMonitor(prev => ({ ...prev, textoExplicativo: '' }));
        setMonitorPdfs([]);
        setMonitorFotos([]);
        setMonitorVideos([]);
        clearAudio();
        carregarDados();
      }
    } catch (err) { alert('Erro ao enviar a resposta.'); }
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

  const handleMobileNavClick = (tab) => {
    setMobileTab(tab);
    if (tab === 'feed') document.getElementById('feed-section')?.scrollIntoView({ behavior: 'smooth' });
    else if (tab === 'nova_duvida') { const el = document.getElementById('form-duvida'); if (el) el.scrollIntoView({ behavior: 'smooth' }); else if (!user) setShowAuthModal(true); }
    else if (tab === 'perfil') { if (user) document.getElementById('perfil-section')?.scrollIntoView({ behavior: 'smooth' }); else setShowAuthModal(true); }
  };

  const filteredTickets = tickets.filter(t => {
    if (statusFilter === 'todos') return true;
    if (statusFilter === 'pendente') return t.status === 'Pendente';
    if (statusFilter === 'explicado') return t.status === 'Explicado';
    if (statusFilter === 'entendido') return t.etapa >= 3;
    if (statusFilter === 'praticando') return t.status === 'Praticando';
    if (statusFilter === 'aprovado') return t.status === 'Aprovado';
    return true;
  });

  const currentUserRole = user ? user.role : 'aluno';

  const statusBadge = (ticket) => {
    if (ticket.status === 'Aprovado') return <span className="gge-badge gge-badge-aprovado">Conteúdo Dominado ✓</span>;
    if (ticket.status === 'Praticando') return <span className="gge-badge gge-badge-praticando">Fixação com IA</span>;
    if (ticket.etapa === 3) return <span className="gge-badge gge-badge-aprovado">Aluno Entendeu</span>;
    if (ticket.status === 'Explicado') return <span className="gge-badge gge-badge-explicado">Resposta do Professor</span>;
    return <span className="gge-badge gge-badge-pendente">Dúvida Pendente</span>;
  };

  /* ======================================================================== */
  /* RENDER */
  /* ======================================================================== */
  return (
    <div className="gge-app-wrapper">

      {/* ─── HEADER ─── */}
      <header className="gge-header">
        <div className="gge-header-content">
          <div className="gge-brand-group">
            <img src="https://cdn.gge.com.br/web/wp-content/uploads/2023/09/logo-gge.png" alt="Colégio GGE" className="gge-brand-logo-img" />
            <div className="gge-brand-text">
              <h1>Monitoria GGE</h1>
              <p>Ciclo de Aprendizado · Ensino Médio, SSA & ENEM</p>
            </div>
          </div>
          <div className="gge-header-actions">
            {user ? (
              <div className="gge-user-header-badge">
                <div className="gge-user-info-text">
                  <div className="name">{user.name}</div>
                  <div className="unit">{user.unidade?.split('-')[0]?.trim()}</div>
                </div>
                <div className="gge-user-avatar">{user.name.charAt(0)}</div>
                <button onClick={handleLogout} title="Sair" className="gge-btn-icon"><LogOut size={15} /></button>
              </div>
            ) : (
              <button onClick={() => setShowAuthModal(true)} className="gge-btn gge-btn-primary">
                <LogIn size={14} /> <span>Entrar</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ─── MAIN GRID ─── */}
      <div className="gge-container">

        {/* ─── LEFT SIDEBAR ─── */}
        <aside className="gge-sidebar">

          {/* Profile */}
          <div className="gge-card" id="perfil-section">
            <div className="gge-card-header">
              <span className="gge-card-title"><User size={15} /> Perfil</span>
            </div>
            {user ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                  <div className="gge-user-avatar" style={{ width: '40px', height: '40px', fontSize: '1rem' }}>{user.name.charAt(0)}</div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-0)' }}>{user.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-2)' }}>{user.turma || user.unidade}</div>
                  </div>
                </div>
                <div className="gge-card-divider" />
                <div style={{ fontSize: '0.725rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-2)' }}>Função</span>
                    <strong style={{ color: 'var(--brand)', textTransform: 'capitalize' }}>{user.role}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-2)' }}>Unidade</span>
                    <strong style={{ color: 'var(--text-0)' }}>{user.unidade?.replace('Unidade ', '')}</strong>
                  </div>
                </div>
                <div className="gge-card-divider" />
                <button onClick={handleLogout} className="gge-btn gge-btn-secondary" style={{ width: '100%', fontSize: '0.725rem', color: 'var(--brand)' }}>
                  <LogOut size={13} /> Sair da Conta
                </button>
              </>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-2)', marginBottom: '14px', lineHeight: '1.5' }}>
                  Acesse sua conta para enviar dúvidas e acompanhar seu progresso.
                </p>
                <button onClick={() => setShowAuthModal(true)} className="gge-btn gge-btn-primary" style={{ width: '100%' }}>
                  Acessar Conta
                </button>
              </div>
            )}
          </div>

          {/* Cycle Filter */}
          <div className="gge-card">
            <div className="gge-card-header">
              <span className="gge-card-title"><Layers size={15} /> Ciclo de Aprendizado</span>
            </div>
            {[
              { id: 'todos', label: 'Todas', count: tickets.length },
              { id: 'pendente', label: 'Dúvida Enviada', count: tickets.filter(t => t.status === 'Pendente').length },
              { id: 'explicado', label: 'Resposta do Professor', count: tickets.filter(t => t.status === 'Explicado').length },
              { id: 'entendido', label: 'Aluno Entendeu', count: tickets.filter(t => t.etapa >= 3 && t.etapa < 4).length },
              { id: 'praticando', label: 'Fixação com IA', count: tickets.filter(t => t.status === 'Praticando').length },
              { id: 'aprovado', label: 'Conteúdo Dominado', count: tickets.filter(t => t.status === 'Aprovado').length },
            ].map(f => (
              <button key={f.id} onClick={() => setStatusFilter(f.id)} className={`gge-filter-item ${statusFilter === f.id ? 'active' : ''}`}>
                <span>{f.label}</span>
                <span className="gge-filter-count">{f.count}</span>
              </button>
            ))}
          </div>

          {/* Methodology */}
          <div className="gge-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <BrainCircuit size={15} style={{ color: 'var(--brand)' }} />
              <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-0)' }}>Metodologia</span>
            </div>
            <p style={{ fontSize: '0.725rem', color: 'var(--text-2)', lineHeight: '1.6' }}>
              Dúvidas de qualquer matéria resolvidas por professores e fixadas com Inteligência Artificial.
            </p>
          </div>
        </aside>

        {/* ─── CENTER — MAIN CONTENT ─── */}
        <main className="gge-main-content">

          {/* New doubt form */}
          {(currentUserRole === 'aluno' || mobileTab === 'nova_duvida') && (
            <div className="gge-card" id="form-duvida">
              <div className="gge-card-header">
                <span className="gge-card-title">
                  <PlusCircle size={16} style={{ color: 'var(--brand)' }} /> Nova Dúvida
                </span>
              </div>

              <div className="gge-user-banner">
                <div className="gge-user-banner-left">
                  <div className="gge-user-avatar">{user ? user.name.charAt(0) : 'A'}</div>
                  <div className="gge-user-banner-info">
                    <div className="name">{user ? user.name : 'Visitante'}</div>
                    <div className="unit">{user ? user.unidade : 'Faça login para enviar'}</div>
                  </div>
                </div>
                {!user && (
                  <button onClick={() => setShowAuthModal(true)} className="gge-btn gge-btn-secondary" style={{ fontSize: '0.7rem', padding: '5px 10px' }}>
                    Entrar
                  </button>
                )}
              </div>

              <form onSubmit={handleCriarChamado}>
                <div className="gge-form-group">
                  <label className="gge-label">Matéria e Assunto</label>
                  <input type="text" required placeholder="Ex: Física — Leis de Ohm, Redação — Proposta de Intervenção..."
                    value={novoChamado.assunto} onChange={(e) => setNovoChamado({ ...novoChamado, assunto: e.target.value })} className="gge-input" />
                </div>
                <div className="gge-form-group">
                  <label className="gge-label">Sua Dúvida</label>
                  <textarea placeholder="Descreva a questão ou o ponto da matéria que você não entendeu..."
                    value={novoChamado.duvidaTexto} onChange={(e) => setNovoChamado({ ...novoChamado, duvidaTexto: e.target.value })} className="gge-textarea" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                    <label className="gge-btn gge-btn-secondary" style={{ cursor: 'pointer', fontSize: '0.75rem' }}>
                      <Camera size={14} style={{ color: 'var(--amber)' }} />
                      <span>{fotosAluno.length > 0 ? `+ Anexar Fotos (${fotosAluno.length})` : 'Anexar Foto(s)'}</span>
                      <input type="file" accept="image/*" multiple onChange={handleAddFotosAluno} style={{ display: 'none' }} />
                    </label>
                    <button type="submit" className="gge-btn gge-btn-primary">
                      <Send size={14} /> Enviar Dúvida
                    </button>
                  </div>

                  {fotosAluno.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                      {fotosAluno.map((file, idx) => (
                        <span key={idx} style={{ background: 'var(--surface-3)', border: '1px solid var(--border-default)', padding: '4px 8px', borderRadius: 'var(--r-sm)', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <ImageIcon size={12} style={{ color: 'var(--amber)' }} /> {file.name}
                          <button type="button" onClick={() => handleRemoveFotoAluno(idx)} style={{ background: 'none', border: 'none', color: 'var(--rose)', cursor: 'pointer', padding: '0 2px' }}>
                            <X size={13} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* Monitor response form */}
          {(currentUserRole === 'monitor' || currentUserRole === 'coordenador') && (
            <div className="gge-card">
              <div className="gge-card-header">
                <span className="gge-card-title"><UserCheck size={16} style={{ color: 'var(--sky)' }} /> Responder Dúvida</span>
              </div>
              <form onSubmit={handleEnviarResposta}>
                <div className="gge-form-group">
                  <label className="gge-label">Chamado</label>
                  <select value={respostaMonitor.ticketId} onChange={(e) => setRespostaMonitor({ ...respostaMonitor, ticketId: e.target.value })} className="gge-select">
                    {tickets.map(t => <option key={t.id} value={t.id}>[{t.id}] {t.aluno} — {t.assunto}</option>)}
                  </select>
                </div>
                <div className="gge-form-group">
                  <label className="gge-label">Explicação</label>
                  <textarea placeholder="Resolução passo a passo..." value={respostaMonitor.textoExplicativo}
                    onChange={(e) => setRespostaMonitor({ ...respostaMonitor, textoExplicativo: e.target.value })} className="gge-textarea" />
                </div>
                
                {/* Formas de Enviar Conteudo (Recursos) */}
                <div style={{ background: 'var(--surface-2)', padding: '14px', borderRadius: 'var(--r-lg)', marginBottom: '16px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-1)' }}>Formas de Enviar Conteúdo (Recursos)</span>
                    {recording ? (
                      <button type="button" onClick={stopRecording} className="gge-btn gge-btn-primary" style={{ fontSize: '0.675rem', padding: '4px 10px', background: 'var(--brand)' }}>
                        <Square size={12} fill="white" /> Parar Gravação 🔴
                      </button>
                    ) : (
                      <button type="button" onClick={startRecording} className="gge-btn gge-btn-secondary" style={{ fontSize: '0.675rem', padding: '4px 10px', color: audioBlob ? 'var(--emerald)' : 'var(--text-1)' }}>
                        <Mic size={13} style={{ color: audioBlob ? 'var(--emerald)' : 'var(--sky)' }} /> {audioBlob ? 'Regravar Áudio' : 'Gravar Áudio'}
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px' }}>
                    <label className="gge-btn gge-btn-secondary" style={{ fontSize: '0.675rem', cursor: 'pointer', justifyContent: 'center' }}>
                      <FileText size={13} style={{ color: 'var(--rose)' }} /> <span>+ PDF</span>
                      <input type="file" accept=".pdf" multiple onChange={handleAddPdfs} style={{ display: 'none' }} />
                    </label>
                    <label className="gge-btn gge-btn-secondary" style={{ fontSize: '0.675rem', cursor: 'pointer', justifyContent: 'center' }}>
                      <ImageIcon size={13} style={{ color: 'var(--amber)' }} /> <span>+ Imagem</span>
                      <input type="file" accept="image/*" multiple onChange={handleAddFotos} style={{ display: 'none' }} />
                    </label>
                    <label className="gge-btn gge-btn-secondary" style={{ fontSize: '0.675rem', cursor: 'pointer', justifyContent: 'center' }}>
                      <Video size={13} style={{ color: 'var(--emerald)' }} /> <span>+ Vídeo</span>
                      <input type="file" accept="video/*" multiple onChange={handleAddVideos} style={{ display: 'none' }} />
                    </label>
                  </div>

                  {/* Player de áudio com opção de reouvir e apagar */}
                  {audioUrl && (
                    <div style={{ background: 'var(--surface-3)', padding: '10px 12px', borderRadius: 'var(--r-md)', marginBottom: '10px', border: '1px solid var(--border-default)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.675rem', fontWeight: '700', color: 'var(--sky)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Mic size={12} /> Áudio gravado — Ouça antes de enviar:
                        </span>
                        <button type="button" onClick={clearAudio} className="gge-btn-icon" style={{ color: 'var(--rose)', padding: '2px 6px', display: 'flex', alignItems: 'center', gap: '4px' }} title="Descartar e apagar áudio">
                          <Trash2 size={13} /> <span style={{ fontSize: '0.65rem' }}>Apagar</span>
                        </button>
                      </div>
                      <audio controls src={audioUrl} style={{ width: '100%', height: '36px' }} />
                    </div>
                  )}

                  {/* Lista de anexos selecionados */}
                  {(monitorPdfs.length > 0 || monitorFotos.length > 0 || monitorVideos.length > 0) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-2)', fontWeight: '600' }}>Anexos selecionados ({monitorPdfs.length + monitorFotos.length + monitorVideos.length}):</span>
                      
                      {monitorFotos.map((file, idx) => (
                        <div key={`foto-${idx}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface-3)', padding: '6px 10px', borderRadius: 'var(--r-sm)', fontSize: '0.7rem' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <ImageIcon size={13} style={{ color: 'var(--amber)', flexShrink: 0 }} />
                            <strong style={{ color: 'var(--text-0)' }}>{file.name}</strong>
                            <span style={{ color: 'var(--text-2)', fontSize: '0.65rem' }}>({(file.size / 1024).toFixed(1)} KB)</span>
                          </span>
                          <button type="button" onClick={() => handleRemoveFoto(idx)} style={{ background: 'none', border: 'none', color: 'var(--rose)', cursor: 'pointer', padding: '2px' }} title="Remover imagem">
                            <X size={14} />
                          </button>
                        </div>
                      ))}

                      {monitorPdfs.map((file, idx) => (
                        <div key={`pdf-${idx}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface-3)', padding: '6px 10px', borderRadius: 'var(--r-sm)', fontSize: '0.7rem' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <FileText size={13} style={{ color: 'var(--rose)', flexShrink: 0 }} />
                            <strong style={{ color: 'var(--text-0)' }}>{file.name}</strong>
                            <span style={{ color: 'var(--text-2)', fontSize: '0.65rem' }}>({(file.size / 1024).toFixed(1)} KB)</span>
                          </span>
                          <button type="button" onClick={() => handleRemovePdf(idx)} style={{ background: 'none', border: 'none', color: 'var(--rose)', cursor: 'pointer', padding: '2px' }} title="Remover PDF">
                            <X size={14} />
                          </button>
                        </div>
                      ))}

                      {monitorVideos.map((file, idx) => (
                        <div key={`vid-${idx}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface-3)', padding: '6px 10px', borderRadius: 'var(--r-sm)', fontSize: '0.7rem' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <Video size={13} style={{ color: 'var(--emerald)', flexShrink: 0 }} />
                            <strong style={{ color: 'var(--text-0)' }}>{file.name}</strong>
                            <span style={{ color: 'var(--text-2)', fontSize: '0.65rem' }}>({(file.size / (1024 * 1024)).toFixed(1)} MB)</span>
                          </span>
                          <button type="button" onClick={() => handleRemoveVideo(idx)} style={{ background: 'none', border: 'none', color: 'var(--rose)', cursor: 'pointer', padding: '2px' }} title="Remover vídeo">
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button type="submit" className="gge-btn gge-btn-primary" style={{ width: '100%' }}>
                  <Send size={14} /> Enviar Explicação
                </button>
              </form>
            </div>
          )}

          {/* ─── FEED ─── */}
          <div id="feed-section">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h2 style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-0)', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '-0.2px' }}>
                <BookOpen size={16} style={{ color: 'var(--brand)' }} /> Feed de Dúvidas
              </h2>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-2)', fontWeight: '500' }}>
                {filteredTickets.length} {filteredTickets.length === 1 ? 'chamado' : 'chamados'}
              </span>
            </div>

            {loading ? (
              <div className="gge-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
                <RefreshCw size={22} style={{ animation: 'spin 1s linear infinite', color: 'var(--brand)', marginBottom: '10px' }} />
                <p style={{ fontSize: '0.8rem', color: 'var(--text-2)' }}>Carregando dúvidas...</p>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="gge-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
                <HelpCircle size={28} style={{ color: 'var(--text-3)', marginBottom: '10px' }} />
                <p style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-0)', marginBottom: '4px' }}>Nenhuma dúvida encontrada</p>
                <p style={{ fontSize: '0.725rem', color: 'var(--text-2)' }}>Selecione outro filtro ou envie uma nova dúvida.</p>
              </div>
            ) : (
              filteredTickets.map(ticket => (
                <div key={ticket.id} className="gge-ticket-card">

                  {/* Ticket header */}
                  <div className="gge-ticket-header">
                    <div style={{ minWidth: 0 }}>
                      <div className="gge-ticket-id">{ticket.id}</div>
                      <div className="gge-ticket-subject">{ticket.assunto}</div>
                      <div className="gge-ticket-meta">por <strong>{ticket.aluno}</strong> · {ticket.unidade}</div>
                    </div>
                    {statusBadge(ticket)}
                  </div>

                  {/* Doubt text */}
                  <div className="gge-ticket-body">
                    {ticket.duvidaTexto}
                    {ticket.fotoUrls && ticket.fotoUrls.length > 0 ? (
                      <div style={{ display: 'grid', gridTemplateColumns: ticket.fotoUrls.length > 1 ? 'repeat(auto-fit, minmax(180px, 1fr))' : '1fr', gap: '8px', marginTop: '10px' }}>
                        {ticket.fotoUrls.map((url, idx) => (
                          <img key={idx} src={`${API_BASE}${url}`} alt={`Foto da Questão ${idx + 1}`} className="gge-ticket-image" />
                        ))}
                      </div>
                    ) : ticket.fotoUrl ? (
                      <img src={`${API_BASE}${ticket.fotoUrl}`} alt="Foto da Questão" className="gge-ticket-image" />
                    ) : null}
                  </div>

                  {/* Teacher response */}
                  {ticket.resposta && (
                    <div className="gge-response-box">
                      <div className="gge-response-header">
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><UserCheck size={13} /> {ticket.resposta.monitor}</span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-2)' }}>
                          {new Date(ticket.resposta.respondidoEm).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {ticket.resposta.texto && <p style={{ fontSize: '0.8rem', color: 'var(--text-1)', lineHeight: '1.6', marginBottom: '8px' }}>{ticket.resposta.texto}</p>}
                      
                      {/* Audio */}
                      {ticket.resposta.audioUrl && (
                        <div style={{ marginBottom: '10px' }}>
                          <div style={{ fontSize: '0.675rem', fontWeight: '600', color: 'var(--sky)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Mic size={11} /> Áudio do professor
                          </div>
                          <audio controls src={`${API_BASE}${ticket.resposta.audioUrl}`} className="gge-audio-player" />
                        </div>
                      )}

                      {/* Photos */}
                      {((ticket.resposta.fotoUrls && ticket.resposta.fotoUrls.length > 0) || ticket.resposta.fotoUrl) && (
                        <div style={{ display: 'grid', gridTemplateColumns: (ticket.resposta.fotoUrls?.length > 1) ? 'repeat(auto-fit, minmax(200px, 1fr))' : '1fr', gap: '8px', marginBottom: '10px' }}>
                          {(ticket.resposta.fotoUrls && ticket.resposta.fotoUrls.length > 0 ? ticket.resposta.fotoUrls : [ticket.resposta.fotoUrl]).map((url, i) => (
                            <img key={i} src={`${API_BASE}${url}`} alt={`Imagem explicativa ${i + 1}`} className="gge-ticket-image" />
                          ))}
                        </div>
                      )}

                      {/* PDFs */}
                      {((ticket.resposta.pdfUrls && ticket.resposta.pdfUrls.length > 0) || ticket.resposta.pdfUrl) && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                          {(ticket.resposta.pdfUrls && ticket.resposta.pdfUrls.length > 0 ? ticket.resposta.pdfUrls : [ticket.resposta.pdfUrl]).map((url, i) => (
                            <a key={i} href={`${API_BASE}${url}`} target="_blank" rel="noreferrer" className="gge-btn gge-btn-secondary" style={{ fontSize: '0.725rem', width: 'fit-content' }}>
                              <FileText size={14} style={{ color: 'var(--rose)' }} /> <span>PDF Explicativo {i > 0 ? `#${i+1}` : ''}</span>
                            </a>
                          ))}
                        </div>
                      )}

                      {/* Videos */}
                      {((ticket.resposta.videoUrls && ticket.resposta.videoUrls.length > 0) || ticket.resposta.videoUrl) && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
                          {(ticket.resposta.videoUrls && ticket.resposta.videoUrls.length > 0 ? ticket.resposta.videoUrls : [ticket.resposta.videoUrl]).map((url, i) => (
                            <video key={i} controls src={`${API_BASE}${url}`} style={{ width: '100%', borderRadius: 'var(--r-md)', maxHeight: '320px' }} />
                          ))}
                        </div>
                      )}

                      {ticket.etapa === 2 && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                          <button onClick={() => handleAlunoEntendeu(ticket.id)} className="gge-btn gge-btn-success" style={{ fontSize: '0.75rem' }}>
                            <CheckCircle2 size={14} /> Entendi! Ir para Fixação
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* AI fixation */}
                  {ticket.questaoFixacao && ticket.etapa >= 4 && (
                    <div className="gge-ia-question-box">
                      <div className="gge-ia-header">
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Sparkles size={13} style={{ color: 'var(--brand)' }} /> IA GGE · Fixação [{ticket.questaoFixacao.vestibular}]
                        </span>
                        <span style={{ fontSize: '0.625rem', background: 'rgba(167,139,250,.15)', padding: '2px 7px', borderRadius: 'var(--r-full)' }}>
                          Nível {ticket.questaoFixacao.nivel}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.8rem', fontWeight: '500', color: 'var(--text-0)', lineHeight: '1.6' }}>{ticket.questaoFixacao.enunciado}</p>
                      <div className="gge-options-grid">
                        {ticket.questaoFixacao.opcoes.map((opcao, idx) => (
                          <button key={idx} onClick={() => handleResponderFixacao(ticket.id, opcao)} disabled={ticket.etapa === 5}
                            className={`gge-option-btn ${ticket.etapa === 5 && opcao === ticket.questaoFixacao.respostaCorreta ? 'correct' : ''}`}>
                            {opcao}
                          </button>
                        ))}
                      </div>
                      {ticket.etapa !== 5 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid rgba(167,139,250,.12)' }}>
                          <span style={{ fontSize: '0.675rem', color: 'var(--text-2)' }}>Ainda tem dúvida?</span>
                          <button onClick={() => handleResponderFixacao(ticket.id, null, true)} className="gge-btn gge-btn-secondary" style={{ fontSize: '0.675rem', padding: '4px 10px', color: 'var(--brand)' }}>
                            <RotateCcw size={12} /> Voltar ao Professor
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

        {/* ─── RIGHT SIDEBAR ─── */}
        <aside className="gge-sidebar">

          {/* Painel Exclusivo da Coordenação (Métricas, KPIs & SLA) */}
          {currentUserRole === 'coordenador' && (
            <div className="gge-card">
              <div className="gge-card-header" style={{ justifyContent: 'space-between' }}>
                <span className="gge-card-title"><BarChart3 size={15} style={{ color: 'var(--brand)' }} /> Painel do Coordenador</span>
                <span className="gge-badge gge-badge-aprovado" style={{ fontSize: '0.6rem', padding: '2px 6px' }}>Gestão & KPIs</span>
              </div>
              {coordenadorStats ? (
                <>
                  <div className="gge-stats-grid">
                    <div className="gge-stat-card">
                      <div className="gge-stat-number">{coordenadorStats.totalChamados}</div>
                      <div className="gge-stat-label">Total Dúvidas</div>
                    </div>
                    <div className="gge-stat-card">
                      <div className="gge-stat-number" style={{ color: 'var(--emerald)' }}>{coordenadorStats.taxaAprovacao}</div>
                      <div className="gge-stat-label" style={{ color: 'var(--emerald)' }}>Aprovação</div>
                    </div>
                  </div>
                  
                  <div style={{ fontSize: '0.725rem', display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 10px', background: 'var(--surface-2)', borderRadius: 'var(--r-sm)' }}>
                      <span style={{ color: 'var(--text-2)' }}>SLA Atendimento</span>
                      <strong style={{ color: 'var(--amber)' }}>{coordenadorStats.slaAtendimento}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 10px', background: 'var(--surface-2)', borderRadius: 'var(--r-sm)' }}>
                      <span style={{ color: 'var(--text-2)' }}>Cumprimento SLA</span>
                      <strong style={{ color: 'var(--emerald)' }}>{coordenadorStats.slaCumprimento}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 10px', background: 'var(--surface-2)', borderRadius: 'var(--r-sm)' }}>
                      <span style={{ color: 'var(--text-2)' }}>Resolutividade</span>
                      <strong style={{ color: 'var(--sky)' }}>{coordenadorStats.resolutividadePedagogica}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 10px', background: 'var(--surface-2)', borderRadius: 'var(--r-sm)' }}>
                      <span style={{ color: 'var(--text-2)' }}>Precisão da IA</span>
                      <strong style={{ color: 'var(--violet)' }}>{coordenadorStats.precisaoIA}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 10px', background: 'var(--surface-2)', borderRadius: 'var(--r-sm)' }}>
                      <span style={{ color: 'var(--text-2)' }}>Satisfação Alunos</span>
                      <strong style={{ color: 'var(--amber)' }}>{coordenadorStats.satisfacaoAlunos}</strong>
                    </div>
                  </div>
                </>
              ) : (
                <p style={{ fontSize: '0.725rem', color: 'var(--text-2)' }}>Carregando métricas...</p>
              )}
            </div>
          )}

          <div className="gge-card">
            <div className="gge-card-header">
              <span className="gge-card-title"><Building2 size={15} style={{ color: 'var(--brand)' }} /> Unidades GGE</span>
            </div>
            <div style={{ fontSize: '0.725rem', display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--text-2)' }}>
              <div>📍 <strong style={{ color: 'var(--text-1)' }}>Boa Viagem</strong> — Av. Conselheiro Aguiar</div>
              <div>📍 <strong style={{ color: 'var(--text-1)' }}>Benfica</strong> — Rua Benfica, Madalena</div>
              <div>📍 <strong style={{ color: 'var(--text-1)' }}>Parnamirim</strong> — Rua Parnamirim</div>
            </div>
          </div>
        </aside>
      </div>

      {/* ─── MOBILE BOTTOM NAV ─── */}
      <nav className="gge-bottom-nav">
        <button onClick={() => handleMobileNavClick('feed')} className={`gge-nav-item ${mobileTab === 'feed' ? 'active' : ''}`}>
          <Clock size={18} /> Feed
        </button>
        <button onClick={() => handleMobileNavClick('nova_duvida')} className={`gge-nav-item ${mobileTab === 'nova_duvida' ? 'active' : ''}`}>
          <PlusCircle size={18} /> Dúvida
        </button>
        <button onClick={() => handleMobileNavClick('perfil')} className={`gge-nav-item ${mobileTab === 'perfil' ? 'active' : ''}`}>
          <User size={18} /> {user ? user.name.split(' ')[0] : 'Entrar'}
        </button>
      </nav>

      {/* ─── AUTH MODAL ─── */}
      {showAuthModal && (
        <div className="gge-modal-overlay">
          <div className="gge-modal-card">
            <button onClick={() => setShowAuthModal(false)} className="gge-modal-close"><X size={16} /></button>

            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <img src="https://cdn.gge.com.br/web/wp-content/uploads/2023/09/logo-gge.png" alt="GGE" style={{ height: '40px', margin: '0 auto 14px', display: 'block', objectFit: 'contain' }} />
              <h2 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-0)', letterSpacing: '-0.3px' }}>
                {authMode === 'login' ? 'Acessar Monitoria' : 'Criar Conta'}
              </h2>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-2)', marginTop: '4px' }}>Portal do Aluno · Colégio GGE</p>
            </div>

            {authError && (
              <div style={{ background: 'rgba(200,16,46,.1)', border: '1px solid rgba(200,16,46,.25)', color: 'var(--brand-soft)', fontSize: '0.75rem', padding: '10px 12px', borderRadius: 'var(--r-md)', marginBottom: '16px' }}>
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit}>
              {authMode === 'register' && (
                <div className="gge-form-group">
                  <label className="gge-label">Nome Completo</label>
                  <input type="text" required placeholder="Ex: Lucas Silva" value={authForm.name}
                    onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })} className="gge-input" />
                </div>
              )}
              <div className="gge-form-group">
                <label className="gge-label">E-mail</label>
                <input type="email" required placeholder="aluno@gge.com.br" value={authForm.email}
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} className="gge-input" />
              </div>
              <div className="gge-form-group">
                <label className="gge-label">Senha</label>
                <input type="password" required placeholder="••••••••" value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} className="gge-input" />
              </div>
              {authMode === 'register' && (
                <div className="gge-form-group">
                  <label className="gge-label">Unidade</label>
                  <select value={authForm.unidade} onChange={(e) => setAuthForm({ ...authForm, unidade: e.target.value })} className="gge-select">
                    <option value="Unidade Boa Viagem - Recife">Boa Viagem — Recife</option>
                    <option value="Unidade Benfica - Recife">Benfica — Recife</option>
                    <option value="Unidade Parnamirim - Recife">Parnamirim — Recife</option>
                  </select>
                </div>
              )}
              <button type="submit" disabled={authLoading} className="gge-btn gge-btn-primary" style={{ width: '100%', padding: '11px' }}>
                {authLoading ? 'Processando...' : (authMode === 'login' ? 'Entrar' : 'Cadastrar')}
              </button>
            </form>

            <div className="gge-demo-accounts">
              <span style={{ fontSize: '0.675rem', color: 'var(--text-2)', fontWeight: '600' }}>Acesso rápido para testes:</span>
              <div className="gge-demo-btns">
                <button onClick={() => handleFastDemoLogin('lucas@gge.com.br')} className="gge-demo-btn">Aluno</button>
                <button onClick={() => handleFastDemoLogin('professor@gge.com.br')} className="gge-demo-btn">Monitor</button>
                <button onClick={() => handleFastDemoLogin('coordenador@gge.com.br')} className="gge-demo-btn">Coordenador</button>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError(''); }}
                style={{ background: 'transparent', border: 'none', color: 'var(--brand)', fontSize: '0.725rem', fontWeight: '600', cursor: 'pointer' }}>
                {authMode === 'login' ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
