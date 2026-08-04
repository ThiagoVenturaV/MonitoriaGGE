'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  GraduationCap, 
  UserCheck, 
  Award, 
  Send, 
  Camera, 
  FileText, 
  Sparkles, 
  Mic, 
  Video, 
  Image as ImageIcon, 
  CheckCircle2, 
  Clock, 
  BookOpen, 
  Building2, 
  BrainCircuit, 
  RefreshCw, 
  HelpCircle, 
  ArrowRight,
  RotateCcw,
  Zap,
  Check,
  LogOut,
  LogIn,
  User,
  Lock,
  Mail,
  PlusCircle,
  Layers,
  ShieldCheck,
  X,
  ChevronRight,
  BarChart3
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
  const [mobileTab, setMobileTab] = useState('feed'); // 'feed' | 'nova_duvida' | 'stats' | 'perfil'
  const [activeRole, setActiveRole] = useState('aluno');
  const [statusFilter, setStatusFilter] = useState('todos');

  // Dados dos Chamados & Estatísticas
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [coordenadorStats, setCoordenadorStats] = useState(null);

  // Form Novo Chamado Aluno (Sem campo de nome manual!)
  const [novoChamado, setNovoChamado] = useState({
    assunto: 'Geometria Analítica - Distância Ponto e Reta',
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

  // Carregamento Inicial & Restauração de Sessão JWT
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
        setActiveRole(data.user.role || 'aluno');
      } else {
        // Token inválido ou revogado
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
      console.error('Erro ao conectar ao serviço de monitoria GGE:', err);
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

      // Salva Token JWT no localStorage
      localStorage.setItem('gge_token', data.token);
      setToken(data.token);
      setUser(data.user);
      setActiveRole(data.user.role || 'aluno');
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
      } catch (err) {
        console.error('Erro ao revogar token no backend:', err);
      }
    }
    localStorage.removeItem('gge_token');
    setToken(null);
    setUser(null);
    setActiveRole('aluno');
    alert('Você saiu da sua conta. Sessão e token revogados com sucesso!');
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
        setActiveRole(data.user.role || 'aluno');
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

  // ETAPA 1: ALUNO MANDA DÚVIDA (Sem perdir o nome!)
  const handleCriarChamado = async (e) => {
    e.preventDefault();
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
        setNovoChamado(prev => ({ ...prev, duvidaTexto: '' }));
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

  return (
    <div className="min-h-screen bg-[#040e19] text-slate-100 flex flex-col font-sans">
      
      {/* ============================================================================== */}
      {/* HEADER PRINCIPAL COM BRANDING COLÉGIO GGE */}
      {/* ============================================================================== */}
      <header className="gge-glass-header sticky top-0 z-40 px-4 lg:px-8 py-3 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3">
          {/* Emblem GGE Logo */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C8102E] to-[#800A1D] flex items-center justify-center font-extrabold text-white text-lg tracking-wider shadow-lg shadow-[#C8102E]/30 border border-white/20">
            GGE
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base lg:text-lg tracking-tight text-white flex items-center gap-2">
                Monitoria GGE
                <span className="text-[10px] bg-[#C8102E] text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Matemática
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Sistema de Aprendizado e Auxílio Aos Vestibulandos (ENEM / SSA)
            </p>
          </div>
        </div>

        {/* Right Side Header Action & User Profile */}
        <div className="flex items-center gap-3">
          {/* Seletor de Visão/Role */}
          <div className="bg-[#092038] p-1 rounded-xl border border-white/10 hidden md:flex items-center gap-1">
            <button
              onClick={() => setActiveRole('aluno')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeRole === 'aluno'
                  ? 'bg-[#C8102E] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <GraduationCap size={14} /> Aluno
            </button>
            <button
              onClick={() => setActiveRole('monitor')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeRole === 'monitor'
                  ? 'bg-[#C8102E] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserCheck size={14} /> Monitor
            </button>
            <button
              onClick={() => setActiveRole('coordenador')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeRole === 'coordenador'
                  ? 'bg-[#C8102E] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Award size={14} /> Coordenador
            </button>
          </div>

          {/* User Auth Profile Indicator */}
          {user ? (
            <div className="flex items-center gap-2 bg-[#092038] border border-white/10 pl-3 pr-1 py-1 rounded-xl">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-white leading-tight">{user.name}</p>
                <p className="text-[10px] text-amber-400 font-semibold">{user.unidade?.split('-')[0]}</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-[#C8102E] text-white flex items-center justify-center font-bold text-xs shadow">
                {user.name.charAt(0)}
              </div>
              <button
                onClick={handleLogout}
                title="Sair (Revogar Token JWT)"
                className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-white/5 transition"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="gge-btn-primary text-xs py-2 px-3.5"
            >
              <LogIn size={15} /> Entrar / Cadastro
            </button>
          )}
        </div>
      </header>

      {/* ============================================================================== */}
      {/* CORPO PRINCIPAL - LAYOUT DESKTOP 12 COLUNAS & MOBILE RESPONSIVO */}
      {/* ============================================================================== */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ---------------------------------------------------------------------------- */}
        {/* COLUNA ESQUERDA: DESKTOP SIDEBAR (3 Colunas) */}
        {/* ---------------------------------------------------------------------------- */}
        <aside className="hidden lg:block lg:col-span-3 space-y-5">
          {/* Card Perfil do Usuário */}
          <div className="gge-card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#C8102E] to-[#002B49] p-0.5 flex items-center justify-center shadow-lg">
                <div className="w-full h-full bg-[#092038] rounded-[14px] flex items-center justify-center font-extrabold text-white text-lg">
                  {user ? user.name.charAt(0) : 'G'}
                </div>
              </div>
              <div>
                <h3 className="font-extrabold text-white text-sm">
                  {user ? user.name : 'Visitante GGE'}
                </h3>
                <p className="text-xs text-amber-400 font-medium">
                  {user ? (user.turma || user.unidade) : 'Acesse sua conta para enviar dúvidas'}
                </p>
              </div>
            </div>

            {user ? (
              <div className="space-y-2 border-t border-white/10 pt-3 text-xs text-slate-300">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Tipo de Conta:</span>
                  <span className="font-bold text-emerald-400 capitalize">{user.role}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Unidade:</span>
                  <span className="font-medium text-white">{user.unidade?.replace('Unidade ', '')}</span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="w-full mt-3 gge-btn-secondary text-xs py-2 justify-center text-red-400 border-red-500/30 hover:bg-red-500/10"
                >
                  <LogOut size={14} /> Sair da Conta (Logout)
                </button>
              </div>
            ) : (
              <div className="bg-white/5 p-3 rounded-xl border border-white/10 text-center">
                <p className="text-xs text-slate-300 mb-2">Com o login ativo, você não precisa mais digitar seu nome ao postar dúvidas!</p>
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="w-full gge-btn-primary text-xs py-2 justify-center"
                >
                  Fazer Login / Cadastrar
                </button>
              </div>
            )}
          </div>

          {/* Filtro de Status das Dúvidas */}
          <div className="gge-card p-5">
            <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Layers size={14} className="text-[#C8102E]" /> Filtrar Ciclo
            </h4>
            <div className="space-y-1.5">
              {[
                { id: 'todos', label: 'Todas as Dúvidas', count: tickets.length },
                { id: 'pendente', label: '1. Pendente de Resposta', count: tickets.filter(t => t.status === 'Pendente').length },
                { id: 'explicado', label: '2. Professor Explicou', count: tickets.filter(t => t.status === 'Explicado').length },
                { id: 'praticando', label: '4. Fixação com IA', count: tickets.filter(t => t.status === 'Praticando').length },
                { id: 'aprovado', label: '5. Conteúdo Dominado', count: tickets.filter(t => t.status === 'Aprovado').length },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    statusFilter === f.id
                      ? 'bg-[#C8102E] text-white shadow-md'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <span>{f.label}</span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    statusFilter === f.id ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {f.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Resumo do Ciclo de Aprendizado GGE */}
          <div className="gge-card p-5 bg-gradient-to-br from-[#092038] to-[#051626]">
            <h4 className="text-xs font-extrabold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <BrainCircuit size={16} /> Metodologia GGE
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              Garantimos o aprendizado completo: da dúvida inicial à resolução prática de vestibulares.
            </p>
            <div className="space-y-2 text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#C8102E] text-white flex items-center justify-center font-bold text-[10px]">1</span>
                <span>Dúvida enviada pelo Aluno</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">2</span>
                <span>Vídeo/Áudio do Professor</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-[10px]">4</span>
                <span>Questão de Fixação com IA</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px]">5</span>
                <span>Aprovação e Conteúdo Dominado</span>
              </div>
            </div>
          </div>
        </aside>

        {/* ---------------------------------------------------------------------------- */}
        {/* COLUNA CENTRAL: FORMULÁRIO & FEED PRINCIPAL (6 ou 9 Colunas) */}
        {/* ---------------------------------------------------------------------------- */}
        <section className="lg:col-span-6 space-y-6">

          {/* PAINEL PARA O ALUNO POSTAR NOVA DÚVIDA (MOBILE & DESKTOP) */}
          {(activeRole === 'aluno' || mobileTab === 'nova_duvida') && (
            <div className="gge-card p-5 border-l-4 border-l-[#C8102E]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <PlusCircle size={18} className="text-[#C8102E]" /> Enviar Nova Dúvida de Matemática
                </h2>
                <span className="text-xs bg-[#C8102E]/20 text-[#EF4444] border border-[#C8102E]/40 px-2.5 py-0.5 rounded-full font-bold">
                  Monitoria Ativa
                </span>
              </div>

              {/* BANNER DO USUÁRIO LOGADO (NÃO PEDE NOME DO ALUNO DA DUVIDA) */}
              <div className="mb-4 bg-slate-900/80 border border-white/10 p-3 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#C8102E] text-white flex items-center justify-center font-bold text-xs">
                    {user ? user.name.charAt(0) : 'A'}
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-white">
                      {user ? user.name : 'Aluno Não Autenticado'}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Unidade: <span className="text-amber-400 font-semibold">{user ? user.unidade : 'Unidade Boa Viagem'}</span>
                    </p>
                  </div>
                </div>
                {!user && (
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="text-xs text-[#EF4444] hover:underline font-bold"
                  >
                    Fazer Login
                  </button>
                )}
              </div>

              <form onSubmit={handleCriarChamado} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Assunto / Tópico da Dúvida
                  </label>
                  <select
                    value={novoChamado.assunto}
                    onChange={(e) => setNovoChamado({ ...novoChamado, assunto: e.target.value })}
                    className="w-full bg-[#051626] border border-white/15 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-[#C8102E]"
                  >
                    <option value="Geometria Analítica - Distância Ponto e Reta">Geometria Analítica - Distância Ponto e Reta</option>
                    <option value="Logaritmos & Funções Exponenciais">Logaritmos & Funções Exponenciais</option>
                    <option value="Trigonometria & Ciclo Trigonométrico">Trigonometria & Ciclo Trigonométrico</option>
                    <option value="Análise Combinatória & Probabilidade">Análise Combinatória & Probabilidade</option>
                    <option value="Matrizes e Sistemas Lineares">Matrizes e Sistemas Lineares</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Descreva sua dúvida com detalhes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Ex: Não compreendi como aplicar a fórmula da distância de um ponto à reta quando os coeficientes são negativos..."
                    value={novoChamado.duvidaTexto}
                    onChange={(e) => setNovoChamado({ ...novoChamado, duvidaTexto: e.target.value })}
                    className="w-full bg-[#051626] border border-white/15 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#C8102E]"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2">
                    <label className="gge-btn-secondary text-xs py-2 px-3 cursor-pointer">
                      <Camera size={14} className="text-amber-400" />
                      <span>{fotoFile ? 'Foto Anexada ✓' : 'Anexar Foto da Questão'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setFotoFile(e.target.files[0])}
                        className="hidden"
                      />
                    </label>
                    {fotoFile && (
                      <span className="text-[10px] text-emerald-400 font-semibold">{fotoFile.name}</span>
                    )}
                  </div>

                  <button type="submit" className="gge-btn-primary text-xs py-2.5 px-5">
                    <Send size={14} /> Enviar para a Monitoria
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* PAINEL PARA RESPOSTA DO PROFESSOR / MONITOR */}
          {activeRole === 'monitor' && (
            <div className="gge-card p-5 border-l-4 border-l-blue-500">
              <h2 className="text-sm font-extrabold text-white mb-3 flex items-center gap-2">
                <UserCheck size={18} className="text-blue-400" /> Responder Dúvida do Aluno (Monitoria GGE)
              </h2>

              <form onSubmit={handleEnviarResposta} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Selecionar Chamado</label>
                  <select
                    value={respostaMonitor.ticketId}
                    onChange={(e) => setRespostaMonitor({ ...respostaMonitor, ticketId: e.target.value })}
                    className="w-full bg-[#051626] border border-white/15 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none"
                  >
                    {tickets.map(t => (
                      <option key={t.id} value={t.id}>
                        [{t.id}] {t.aluno} - {t.assunto} ({t.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Explicação do Professor</label>
                  <textarea
                    rows={3}
                    placeholder="Digite aqui a resolução passo a passo..."
                    value={respostaMonitor.textoExplicativo}
                    onChange={(e) => setRespostaMonitor({ ...respostaMonitor, textoExplicativo: e.target.value })}
                    className="w-full bg-[#051626] border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none"
                  />
                </div>

                {/* Gravação e Anexos de Mídia */}
                <div className="bg-slate-900/60 p-3 rounded-xl border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">Recursos de Resposta Multimídia:</span>
                    {recording ? (
                      <button
                        type="button"
                        onClick={stopRecording}
                        className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1 rounded-lg animate-pulse"
                      >
                        🔴 Parar Gravação
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={startRecording}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1 rounded-lg flex items-center gap-1"
                      >
                        <Mic size={14} /> {audioBlob ? 'Gravado ✓ (Regravar)' : 'Gravador de Áudio'}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <label className="bg-white/5 hover:bg-white/10 p-2 rounded-lg border border-white/10 cursor-pointer flex items-center gap-2">
                      <FileText size={14} className="text-red-400" />
                      <span className="truncate">{monitorPdf ? monitorPdf.name : 'PDF Resolução'}</span>
                      <input type="file" accept=".pdf" onChange={(e) => setMonitorPdf(e.target.files[0])} className="hidden" />
                    </label>
                    <label className="bg-white/5 hover:bg-white/10 p-2 rounded-lg border border-white/10 cursor-pointer flex items-center gap-2">
                      <Video size={14} className="text-emerald-400" />
                      <span className="truncate">{monitorVideo ? monitorVideo.name : 'Vídeo Explicação'}</span>
                      <input type="file" accept="video/*" onChange={(e) => setMonitorVideo(e.target.files[0])} className="hidden" />
                    </label>
                  </div>
                </div>

                <button type="submit" className="w-full gge-btn-primary text-xs py-2.5 justify-center">
                  <Send size={14} /> Enviar Explicação ao Aluno
                </button>
              </form>
            </div>
          )}

          {/* LISTA E TIMELINE DAS DÚVIDAS E CICLO DE APRENDIZADO */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Clock size={16} className="text-[#C8102E]" /> Feed de Dúvidas & Ciclo de Aprendizado
              </h2>
              <span className="text-xs text-slate-400">
                {filteredTickets.length} chamado(s) encontrado(s)
              </span>
            </div>

            {loading ? (
              <div className="gge-card p-8 text-center text-slate-400 space-y-2">
                <RefreshCw size={24} className="animate-spin mx-auto text-[#C8102E]" />
                <p className="text-xs">Carregando chamados de monitoria...</p>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="gge-card p-8 text-center text-slate-400">
                <HelpCircle size={32} className="mx-auto mb-2 text-slate-600" />
                <p className="text-xs font-bold text-white mb-1">Nenhuma dúvida nesta categoria</p>
                <p className="text-xs text-slate-500">Selecione outro filtro ou envie uma nova dúvida.</p>
              </div>
            ) : (
              filteredTickets.map(ticket => (
                <div key={ticket.id} className="gge-card p-5 space-y-4 relative">
                  
                  {/* Header do Chamado */}
                  <div className="flex flex-wrap items-start justify-between gap-2 border-b border-white/10 pb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-amber-400 font-bold">{ticket.id}</span>
                        <h3 className="font-bold text-white text-sm">{ticket.assunto}</h3>
                      </div>
                      <p className="text-xs text-slate-400 flex items-center gap-2">
                        <User size={12} className="text-[#C8102E]" /> <strong className="text-slate-200">{ticket.aluno}</strong> • {ticket.unidade}
                      </p>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {ticket.status === 'Pendente' && <span className="gge-badge-gold">1. Dúvida Pendente</span>}
                      {ticket.status === 'Explicado' && <span className="gge-badge-blue">2. Professor Explicou</span>}
                      {ticket.status === 'Praticando' && <span className="gge-badge-gold bg-purple-900/60 text-purple-300 border-purple-500/40">4. Fixação com IA</span>}
                      {ticket.status === 'Aprovado' && <span className="gge-badge-green">5. Conteúdo Dominado ✓</span>}
                    </div>
                  </div>

                  {/* Conteúdo da Dúvida */}
                  <div className="bg-slate-900/60 p-3.5 rounded-xl border border-white/5 space-y-2">
                    <p className="text-xs text-slate-200 leading-relaxed font-medium">
                      "{ticket.duvidaTexto}"
                    </p>
                    {ticket.fotoUrl && (
                      <div className="mt-2">
                        <img
                          src={`${API_BASE}${ticket.fotoUrl}`}
                          alt="Foto da Questão"
                          className="max-h-56 rounded-lg border border-white/10 object-contain bg-black/40"
                        />
                      </div>
                    )}
                  </div>

                  {/* ETAPA 2: RESPOSTA DO PROFESSOR (SE EXISTIR) */}
                  {ticket.resposta && (
                    <div className="bg-blue-950/40 border border-blue-500/30 p-4 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-blue-400 flex items-center gap-1.5">
                          <UserCheck size={14} /> Resposta da Monitoria: {ticket.resposta.monitor}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(ticket.resposta.respondidoEm).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <p className="text-xs text-slate-200">
                        {ticket.resposta.texto}
                      </p>

                      {/* Reprodutor de Áudio da Resposta */}
                      {ticket.resposta.audioUrl && (
                        <div className="bg-blue-900/40 p-2 rounded-lg border border-blue-400/20">
                          <p className="text-[10px] font-bold text-blue-300 mb-1 flex items-center gap-1">
                            <Mic size={12} /> Áudio do Professor:
                          </p>
                          <audio controls src={`${API_BASE}${ticket.resposta.audioUrl}`} className="w-full h-8" />
                        </div>
                      )}

                      {/* Ação do Aluno: Entendeu a resposta */}
                      {ticket.etapa === 2 && (
                        <div className="pt-2 flex justify-end">
                          <button
                            onClick={() => handleAlunoEntendeu(ticket.id)}
                            className="gge-btn-primary text-xs py-2 px-4 bg-gradient-to-r from-emerald-600 to-teal-600"
                          >
                            <CheckCircle2 size={15} /> Entendi a Explicação! Ir para Questão de Fixação
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ETAPA 4: QUESTÃO DE FIXAÇÃO GERADA PELA IA */}
                  {ticket.questaoFixacao && ticket.etapa >= 4 && (
                    <div className="bg-purple-950/40 border border-purple-500/30 p-4 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-purple-300 flex items-center gap-1.5">
                          <Sparkles size={14} className="text-amber-400" /> Agente de IA GGE • Questão de Fixação [{ticket.questaoFixacao.vestibular}]
                        </span>
                        <span className="text-[10px] bg-purple-900 text-purple-200 px-2 py-0.5 rounded font-bold">
                          Nível {ticket.questaoFixacao.nivel}
                        </span>
                      </div>

                      <p className="text-xs text-slate-200 font-medium">
                        {ticket.questaoFixacao.enunciado}
                      </p>

                      {/* Opções de Resposta */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {ticket.questaoFixacao.opcoes.map((opcao, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleResponderFixacao(ticket.id, opcao)}
                            disabled={ticket.etapa === 5}
                            className={`p-2.5 rounded-lg text-xs font-semibold text-left transition ${
                              ticket.etapa === 5 && opcao === ticket.questaoFixacao.respostaCorreta
                                ? 'bg-emerald-600 text-white font-bold'
                                : 'bg-white/5 hover:bg-white/15 text-slate-200 border border-white/10'
                            }`}
                          >
                            {opcao}
                          </button>
                        ))}
                      </div>

                      {/* Botão de Dúvida Extra na Questão */}
                      {ticket.etapa !== 5 && (
                        <div className="pt-2 flex justify-between items-center border-t border-purple-500/20">
                          <span className="text-[10px] text-slate-400">Errou ou ficou com dúvida?</span>
                          <button
                            onClick={() => handleResponderFixacao(ticket.id, null, true)}
                            className="text-xs text-amber-400 hover:text-amber-300 font-bold underline flex items-center gap-1"
                          >
                            <RotateCcw size={13} /> Reiniciar Dúvida com o Professor
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              ))
            )}
          </div>
        </section>

        {/* ---------------------------------------------------------------------------- */}
        {/* COLUNA DIREITA: ESTATÍSTICAS E PAINEL COORDENADOR (3 Colunas) */}
        {/* ---------------------------------------------------------------------------- */}
        <aside className="hidden lg:block lg:col-span-3 space-y-5">
          
          {/* Card Estatísticas do Coordenador Pedagógico GGE */}
          <div className="gge-card p-5 bg-gradient-to-br from-[#092038] to-[#040e19]">
            <h3 className="text-xs font-extrabold text-white uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-white/10 pb-2">
              <BarChart3 size={16} className="text-[#C8102E]" /> Métricas de Desempenho GGE
            </h3>

            {coordenadorStats ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 p-3 rounded-xl border border-white/10 text-center">
                    <p className="text-2xl font-extrabold text-white">{coordenadorStats.totalChamados}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Total Chamados</p>
                  </div>
                  <div className="bg-emerald-950/40 p-3 rounded-xl border border-emerald-500/30 text-center">
                    <p className="text-2xl font-extrabold text-emerald-400">{coordenadorStats.taxaAprovacao}</p>
                    <p className="text-[10px] text-emerald-300 uppercase font-bold">Taxa Aprovação</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center p-2 rounded-lg bg-white/5">
                    <span className="text-slate-400">Tempo Médio Resposta:</span>
                    <span className="font-bold text-amber-400">{coordenadorStats.tempoMedioMinutos} min</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-white/5">
                    <span className="text-slate-400">Precisão da IA Fixação:</span>
                    <span className="font-bold text-purple-400">{coordenadorStats.precisaoIA}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Carregando métricas...</p>
            )}
          </div>

          {/* Banner Unidades Colégio GGE Recife */}
          <div className="gge-card p-5 border border-amber-500/20">
            <h4 className="text-xs font-extrabold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Building2 size={15} /> Unidades GGE Recife
            </h4>
            <ul className="text-xs space-y-1.5 text-slate-300 font-medium">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#C8102E]" /> Unidade Boa Viagem
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#C8102E]" /> Unidade Benfica (Madalena)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#C8102E]" /> Unidade Parnamirim
              </li>
            </ul>
          </div>
        </aside>
      </main>

      {/* ============================================================================== */}
      {/* NAVEGAÇÃO INFERIOR PARA MOBILE (MOBILE-FIRST) */}
      {/* ============================================================================== */}
      <nav className="gge-bottom-nav md:hidden">
        <button
          onClick={() => setMobileTab('feed')}
          className={`flex flex-col items-center justify-center gap-1 text-[11px] font-bold ${
            mobileTab === 'feed' ? 'text-[#EF4444]' : 'text-slate-400'
          }`}
        >
          <Clock size={18} /> Feed
        </button>
        <button
          onClick={() => setMobileTab('nova_duvida')}
          className={`flex flex-col items-center justify-center gap-1 text-[11px] font-bold ${
            mobileTab === 'nova_duvida' ? 'text-[#EF4444]' : 'text-slate-400'
          }`}
        >
          <PlusCircle size={18} /> Nova Dúvida
        </button>
        <button
          onClick={() => setShowAuthModal(true)}
          className={`flex flex-col items-center justify-center gap-1 text-[11px] font-bold ${
            user ? 'text-emerald-400' : 'text-slate-400'
          }`}
        >
          <User size={18} /> {user ? user.name.split(' ')[0] : 'Entrar'}
        </button>
      </nav>

      {/* ============================================================================== */}
      {/* MODAL DE LOGIN / CADASTRO COM BCRYPT E JWT */}
      {/* ============================================================================== */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="gge-card max-w-md w-full p-6 relative border-t-4 border-t-[#C8102E]">
            
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[#C8102E] text-white flex items-center justify-center font-black text-xl mx-auto mb-2 shadow-lg">
                GGE
              </div>
              <h3 className="font-extrabold text-white text-lg">
                {authMode === 'login' ? 'Acessar Monitoria GGE' : 'Criar Conta no Portal GGE'}
              </h3>
              <p className="text-xs text-slate-400">
                Autenticação segura com JWT e Bcrypt (com suporte a Logout Revogável)
              </p>
            </div>

            {authError && (
              <div className="mb-4 bg-red-950/60 border border-red-500/40 text-red-300 text-xs p-3 rounded-xl font-medium">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authMode === 'register' && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Nome Completo</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Lucas Silva"
                    value={authForm.name}
                    onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                    className="w-full bg-[#051626] border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">E-mail Institucional ou Pessoal</label>
                <input
                  type="email"
                  required
                  placeholder="aluno@gge.com.br"
                  value={authForm.email}
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                  className="w-full bg-[#051626] border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Senha</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  className="w-full bg-[#051626] border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              {authMode === 'register' && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Unidade GGE</label>
                  <select
                    value={authForm.unidade}
                    onChange={(e) => setAuthForm({ ...authForm, unidade: e.target.value })}
                    className="w-full bg-[#051626] border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
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
                className="w-full gge-btn-primary text-xs py-3 justify-center"
              >
                {authLoading ? 'Processando...' : (authMode === 'login' ? 'Entrar no Sistema' : 'Cadastrar Conta')}
              </button>
            </form>

            {/* Atalhos para Contas Demo Rápidas */}
            <div className="mt-5 border-t border-white/10 pt-4 text-center">
              <p className="text-[11px] font-bold text-slate-400 mb-2">Entrar com Contas de Teste Rápidas:</p>
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => handleFastDemoLogin('lucas@gge.com.br')}
                  className="text-[10px] bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg border border-white/10 text-slate-300 font-bold"
                >
                  Aluno Lucas
                </button>
                <button
                  onClick={() => handleFastDemoLogin('professor@gge.com.br')}
                  className="text-[10px] bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg border border-white/10 text-slate-300 font-bold"
                >
                  Monitor Professor
                </button>
                <button
                  onClick={() => handleFastDemoLogin('coordenador@gge.com.br')}
                  className="text-[10px] bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg border border-white/10 text-slate-300 font-bold"
                >
                  Coordenador
                </button>
              </div>
            </div>

            <div className="mt-4 text-center">
              <button
                onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError(''); }}
                className="text-xs text-amber-400 hover:underline font-bold"
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
