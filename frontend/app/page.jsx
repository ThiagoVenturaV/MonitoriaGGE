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
  FileCode, 
  Video, 
  Image as ImageIcon, 
  CheckCircle2, 
  Clock, 
  BookOpen, 
  Building2, 
  BrainCircuit, 
  RefreshCw, 
  CheckSquare, 
  HelpCircle, 
  ArrowRight,
  Square,
  ThumpsUp,
  RotateCcw,
  Zap,
  Check
} from 'lucide-react';

const API_BASE = 'http://localhost:8080';

export default function PlataformaMonitoriaGGE() {
  const [activeRole, setActiveRole] = useState('aluno');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [coordenadorStats, setCoordenadorStats] = useState(null);

  // Form Novo Chamado Aluno
  const [novoChamado, setNovoChamado] = useState({
    aluno: 'Lucas Silva (Turma 3º Ano Medicina - GGE)',
    unidade: 'Unidade Boa Viagem - Recife',
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

  // Resposta da Questão de Fixação no Aluno
  const [opcaoFixacaoSelecionada, setOpcaoFixacaoSelecionada] = useState({});

  // Gravação de Áudio Real
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);

  useEffect(() => {
    carregarDados();
  }, []);

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
      console.error('Erro ao conectar ao serviço:', err);
    } finally {
      setLoading(false);
    }
  };

  // ETAPA 1: ALUNO MANDA DÚVIDA
  const handleCriarChamado = async (e) => {
    e.preventDefault();
    if (!novoChamado.duvidaTexto && !fotoFile) {
      alert('Por favor, digite sua dúvida ou anexe uma foto da questão.');
      return;
    }

    const formData = new FormData();
    formData.append('aluno', novoChamado.aluno);
    formData.append('unidade', novoChamado.unidade);
    formData.append('assunto', novoChamado.assunto);
    formData.append('tipo', fotoFile ? 'foto' : 'texto');
    formData.append('duvidaTexto', novoChamado.duvidaTexto);
    if (fotoFile) formData.append('foto', fotoFile);

    try {
      const res = await fetch(`${API_BASE}/api/tickets`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        alert('Dúvida enviada com sucesso ao monitor! Acompanhe o ciclo de aprendizado.');
        setNovoChamado(prev => ({ ...prev, duvidaTexto: '' }));
        setFotoFile(null);
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
    formData.append('monitor', respostaMonitor.monitor);
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

  // ETAPA 3: ALUNO DISSE QUE ENTENDEU -> AGENTE DE IA SOLICITA QUESTÃO DE FIXAÇÃO
  const handleAlunoEntendeu = async (ticketId) => {
    try {
      const res = await fetch(`${API_BASE}/api/tickets/${ticketId}/entendi`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert('Ótimo! O Agente de IA selecionou uma Questão de Fixação para validar o seu aprendizado.');
        carregarDados();
      }
    } catch (err) {
      alert('Erro ao avançar para a questão de fixação.');
    }
  };

  // ETAPA 4: ALUNO RESPONDE QUESTÃO DE FIXAÇÃO (SE ACERTAR -> APROVADO, SE COM DÚVIDA -> REINICIA CICLO COM O PROFESSOR)
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
      alert('Por favor, permita o acesso ao microfone no seu navegador.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* NAVBAR GGE */}
      <nav className="glass-nav" style={{ padding: '1rem 2rem', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)', padding: '0.6rem 0.8rem', borderRadius: '12px', boxShadow: '0 4px 14px rgba(225, 29, 72, 0.4)' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ffffff', letterSpacing: '0.05em' }}>GGE</span>
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.025em' }}>
                Plataforma de Monitoria • Ciclo de Aprendizado
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Colégio GGE • Loop Interativo Aluno ↔ Monitor ↔ IA</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(15, 23, 42, 0.6)', padding: '0.35rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <button className={`tab-btn ${activeRole === 'aluno' ? 'tab-btn-active' : 'tab-btn-inactive'}`} onClick={() => setActiveRole('aluno')}>
              <GraduationCap size={18} /> Área do Aluno
            </button>
            <button className={`tab-btn ${activeRole === 'monitor' ? 'tab-btn-active' : 'tab-btn-inactive'}`} onClick={() => setActiveRole('monitor')}>
              <UserCheck size={18} /> Monitoria / Professor
            </button>
            <button className={`tab-btn ${activeRole === 'coordenador' ? 'tab-btn-active' : 'tab-btn-inactive'}`} onClick={() => setActiveRole('coordenador')}>
              <Award size={18} /> Coordenação Acadêmica
            </button>
          </div>

        </div>
      </nav>

      {/* CONTEÚDO PRINCIPAL */}
      <main style={{ flex: 1, maxWidth: '1280px', width: '100%', margin: '0 auto', padding: '2rem 1rem' }}>
        
        {/* ========================================================================= */}
        {/* 1. PERFIL ALUNO GGE                                                       */}
        {/* ========================================================================= */}
        {activeRole === 'aluno' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            <div className="glass-card" style={{ padding: '1.75rem 2rem', background: 'linear-gradient(135deg, rgba(225, 29, 72, 0.15) 0%, rgba(56, 189, 248, 0.12) 100%)', borderLeft: '4px solid #e11d48' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <span className="gge-badge" style={{ marginBottom: '0.5rem', display: 'inline-block' }}>CICLO PEDAGÓGICO GGE</span>
                  <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Tirar Dúvidas & Treino com Agente de IA</h2>
                  <p style={{ margin: '0.3rem 0 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>Dúvida → Resposta do Professor → Confirmação do Aluno → Questão de Fixação da IA → Conteúdo Dominado!</p>
                </div>
                <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.6rem 1.2rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>SUA UNIDADE</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Building2 size={16} /> Unidade Boa Viagem - Recife
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '2rem' }}>
              
              {/* FORMULÁRIO DE ENVIO DA DÚVIDA */}
              <div className="glass-card" style={{ padding: '1.75rem' }}>
                <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ffffff' }}>
                  <Send size={20} color="#e11d48" />
                  Passo 1: Enviar Dúvida para a Monitoria
                </h3>

                <form onSubmit={handleCriarChamado} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '0.4rem' }}>Aluno / Turma:</label>
                    <input 
                      type="text"
                      value={novoChamado.aluno}
                      onChange={(e) => setNovoChamado({...novoChamado, aluno: e.target.value})}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: '#0b1120', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#f8fafc', fontWeight: 500 }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '0.4rem' }}>Assunto de Matemática:</label>
                    <select 
                      value={novoChamado.assunto}
                      onChange={(e) => setNovoChamado({...novoChamado, assunto: e.target.value})}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: '#0b1120', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#f8fafc', fontWeight: 500 }}
                    >
                      <option>Geometria Analítica - Distância Ponto e Reta</option>
                      <option>Função Quadrática (Parábola & Vértice)</option>
                      <option>Logaritmos & Funções Exponenciais</option>
                      <option>Trigonometria no Triângulo Retângulo</option>
                      <option>Análise Combinatória & Probabilidade</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '0.4rem' }}>Foto da Questão (opcional):</label>
                    <input 
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFotoFile(e.target.files[0])}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '10px', background: '#0b1120', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '0.4rem' }}>Descrição da Dúvida:</label>
                    <textarea 
                      rows={4}
                      value={novoChamado.duvidaTexto}
                      onChange={(e) => setNovoChamado({...novoChamado, duvidaTexto: e.target.value})}
                      placeholder="Descreva exatamente o passo em que você travou..."
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: '#0b1120', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#f8fafc', fontFamily: 'inherit', resize: 'vertical' }}
                    />
                  </div>

                  <button 
                    type="submit"
                    style={{
                      padding: '0.85rem',
                      borderRadius: '10px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
                      color: '#ffffff',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      boxShadow: '0 4px 14px rgba(225, 29, 72, 0.4)'
                    }}
                  >
                    <Send size={18} /> Iniciar Ciclo de Aprendizado
                  </button>

                </form>
              </div>

              {/* LISTA DE CICLOS EM ANDAMENTO DO ALUNO */}
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>
                  Acompanhamento dos Meus Ciclos de Estudo ({tickets.length})
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {tickets.map(t => (
                    <div key={t.id} style={{ padding: '1.25rem', borderRadius: '14px', background: 'rgba(15, 23, 42, 0.65)', border: t.status === 'Aprovado' ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.1)' }}>
                      
                      {/* HEADER DO CARD DE CICLO */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#e11d48' }}>{t.id} • {t.aluno}</span>
                        
                        <span style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: 700, 
                          padding: '0.25rem 0.75rem', 
                          borderRadius: '9999px', 
                          background: t.status === 'Aprovado' ? 'rgba(16, 185, 129, 0.2)' : t.status === 'Praticando' ? 'rgba(192, 132, 252, 0.2)' : t.status === 'Explicado' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(245, 158, 11, 0.2)', 
                          color: t.status === 'Aprovado' ? '#10b981' : t.status === 'Praticando' ? '#c084fc' : t.status === 'Explicado' ? '#38bdf8' : '#f59e0b' 
                        }}>
                          {t.status === 'Aprovado' ? '🎉 Conteúdo Dominado' : t.status === 'Praticando' ? '⚡ Fixação pela IA' : t.status === 'Explicado' ? '👨‍🏫 Resposta do Professor' : '⏳ Aguardando Monitor'}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.3rem' }}>{t.assunto}</div>
                      <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.75rem' }}>Dúvida: "{t.duvidaTexto}"</div>

                      {/* PASSO 2: RESPOSTA DO PROFESSOR */}
                      {t.resposta && (
                        <div style={{ marginTop: '0.75rem', padding: '1rem', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8', marginBottom: '0.3rem' }}>
                            👨‍🏫 Explicação do Professor ({t.resposta.monitor}):
                          </div>
                          <div style={{ fontSize: '0.85rem', color: '#e2e8f0', marginBottom: '0.75rem' }}>{t.resposta.texto}</div>

                          {/* ANEXOS DO PROFESSOR */}
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                            {t.resposta.pdfUrl && (
                              <a href={`${API_BASE}${t.resposta.pdfUrl}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
                                <FileCode size={14} /> PDF Explicativo
                              </a>
                            )}
                            {t.resposta.videoUrl && (
                              <a href={`${API_BASE}${t.resposta.videoUrl}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', borderRadius: '6px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
                                <Video size={14} /> Vídeo MP4
                              </a>
                            )}
                            {t.resposta.audioUrl && (
                              <div style={{ width: '100%', marginTop: '0.25rem' }}>
                                <div style={{ fontSize: '0.75rem', color: '#c084fc', marginBottom: '0.2rem', fontWeight: 600 }}>🎙️ Áudio do Professor:</div>
                                <audio controls src={`${API_BASE}${t.resposta.audioUrl}`} style={{ height: '34px', width: '100%' }} />
                              </div>
                            )}
                          </div>

                          {/* BOTÃO DO ALUNO CONFIRMAR SE ENTENDEU A EXPLICAÇÃO */}
                          {t.etapa === 2 && (
                            <button 
                              onClick={() => handleAlunoEntendeu(t.id)}
                              style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: '10px',
                                border: 'none',
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                color: '#ffffff',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
                              }}
                            >
                              <CheckCircle2 size={18} /> Entendi a Explicação! Solicitar Questão de Fixação
                            </button>
                          )}
                        </div>
                      )}

                      {/* PASSO 4: AGENTE DE IA SOLICITA QUESTÃO DE FIXAÇÃO */}
                      {t.etapa === 4 && t.questaoFixacao && (
                        <div style={{ marginTop: '1rem', padding: '1rem', borderRadius: '12px', background: 'rgba(192, 132, 252, 0.08)', border: '1px solid rgba(192, 132, 252, 0.3)' }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#c084fc', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                            <BrainCircuit size={18} /> Questão de Fixação Selecionada pela IA ({t.questaoFixacao.vestibular})
                          </div>
                          
                          <div style={{ fontSize: '0.85rem', color: '#f8fafc', marginBottom: '0.75rem', lineHeight: '1.4' }}>
                            {t.questaoFixacao.enunciado}
                          </div>

                          {/* OPÇÕES DA QUESTÃO DE FIXAÇÃO */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                            {t.questaoFixacao.opcoes.map((opcao, idx) => (
                              <button
                                key={idx}
                                onClick={() => setOpcaoFixacaoSelecionada({...opcaoFixacaoSelecionada, [t.id]: opcao})}
                                style={{
                                  padding: '0.6rem 0.85rem',
                                  borderRadius: '8px',
                                  border: opcaoFixacaoSelecionada[t.id] === opcao ? '1px solid #c084fc' : '1px solid rgba(255, 255, 255, 0.1)',
                                  background: opcaoFixacaoSelecionada[t.id] === opcao ? 'rgba(192, 132, 252, 0.25)' : 'rgba(30, 41, 59, 0.5)',
                                  color: opcaoFixacaoSelecionada[t.id] === opcao ? '#c084fc' : '#cbd5e1',
                                  textAlign: 'left',
                                  fontSize: '0.825rem',
                                  fontWeight: 600,
                                  cursor: 'pointer'
                                }}
                              >
                                {opcao}
                              </button>
                            ))}
                          </div>

                          {/* BOTÕES DE CONFIRMAR OU AINDA TER DÚVIDA */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <button
                              onClick={() => handleResponderFixacao(t.id, opcaoFixacaoSelecionada[t.id], false)}
                              disabled={!opcaoFixacaoSelecionada[t.id]}
                              style={{
                                padding: '0.65rem',
                                borderRadius: '8px',
                                border: 'none',
                                background: !opcaoFixacaoSelecionada[t.id] ? '#334155' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                color: '#ffffff',
                                fontWeight: 700,
                                fontSize: '0.8rem',
                                cursor: !opcaoFixacaoSelecionada[t.id] ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.4rem'
                              }}
                            >
                              <Check size={16} /> Confirmar Resposta
                            </button>

                            <button
                              onClick={() => handleResponderFixacao(t.id, null, true)}
                              style={{
                                padding: '0.65rem',
                                borderRadius: '8px',
                                border: '1px solid rgba(244, 63, 94, 0.4)',
                                background: 'rgba(244, 63, 94, 0.15)',
                                color: '#f43f5e',
                                fontWeight: 700,
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.4rem'
                              }}
                            >
                              <RotateCcw size={16} /> Ainda tenho dúvida! Voltar pro Professor
                            </button>
                          </div>
                        </div>
                      )}

                      {/* PASSO 5: APROVADO E DOMINADO */}
                      {t.status === 'Aprovado' && (
                        <div style={{ marginTop: '0.75rem', padding: '0.75rem', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#10b981', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <CheckCircle2 size={18} /> Parabéns! Conteúdo validado e aprovado no ciclo de aprendizagem!
                        </div>
                      )}

                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. PERFIL MONITOR / PROFESSOR GGE                                          */}
        {/* ========================================================================= */}
        {activeRole === 'monitor' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            <div className="glass-card" style={{ padding: '1.75rem 2rem', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(56, 189, 248, 0.12) 100%)', borderLeft: '4px solid #10b981' }}>
              <span className="gge-badge" style={{ background: '#10b981', marginBottom: '0.5rem', display: 'inline-block' }}>EQUIPE PEDAGÓGICA GGE</span>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Atendimento aos Chamados dos Alunos</h2>
              <p style={{ margin: '0.3rem 0 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>Responda as dúvidas dos vestibulandos com orientações em PDF, Foto, Vídeo MP4 ou Áudio gravado.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '2rem' }}>
              
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.05rem', fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={20} /> Dúvidas Aguardando Resposta ({tickets.filter(t => t.status === 'Pendente').length})
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {tickets.map(t => (
                    <div 
                      key={t.id} 
                      onClick={() => setRespostaMonitor({...respostaMonitor, ticketId: t.id})}
                      style={{
                        padding: '1rem',
                        borderRadius: '12px',
                        background: respostaMonitor.ticketId === t.id ? 'rgba(16, 185, 129, 0.12)' : 'rgba(15, 23, 42, 0.6)',
                        border: respostaMonitor.ticketId === t.id ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.08)',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#38bdf8' }}>{t.id} • {t.aluno}</span>
                        <span style={{ fontSize: '0.75rem', color: t.status === 'Aprovado' ? '#10b981' : t.status === 'Explicado' ? '#38bdf8' : '#f59e0b', fontWeight: 700 }}>{t.status}</span>
                      </div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff' }}>{t.assunto}</div>
                      <div style={{ fontSize: '0.825rem', color: '#cbd5e1', marginTop: '0.25rem' }}>{t.duvidaTexto}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card" style={{ padding: '1.75rem' }}>
                <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>
                  Enviar Resolução para ({respostaMonitor.ticketId})
                </h3>

                <form onSubmit={handleEnviarResposta} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>📄 Resolução em PDF:</label>
                    <input type="file" accept=".pdf" onChange={(e) => setMonitorPdf(e.target.files[0])} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', background: '#0b1120', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8', fontSize: '0.8rem' }} />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>🖼️ Foto da Lousa / Manuscrito (.jpg/.png):</label>
                    <input type="file" accept="image/*" onChange={(e) => setMonitorFoto(e.target.files[0])} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', background: '#0b1120', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8', fontSize: '0.8rem' }} />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>🎬 Vídeo Explicativo (.mp4):</label>
                    <input type="file" accept="video/mp4" onChange={(e) => setMonitorVideo(e.target.files[0])} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', background: '#0b1120', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8', fontSize: '0.8rem' }} />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '0.4rem' }}>🎙️ Gravar Explicação em Áudio (Passo a Passo):</label>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      {!recording ? (
                        <button type="button" onClick={startRecording} style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: 'none', background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Mic size={16} /> Iniciar Gravação de Áudio
                        </button>
                      ) : (
                        <button type="button" onClick={stopRecording} style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: 'none', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Square size={16} /> Parar e Salvar Áudio
                        </button>
                      )}
                      {audioBlob && <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>✅ Áudio Gravado!</span>}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '0.4rem' }}>Orientação Escrita para o Aluno:</label>
                    <textarea 
                      rows={4}
                      value={respostaMonitor.textoExplicativo}
                      onChange={(e) => setRespostaMonitor({...respostaMonitor, textoExplicativo: e.target.value})}
                      placeholder="Explicação passo a passo para o aluno..."
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: '#0b1120', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#f8fafc', fontFamily: 'inherit' }}
                    />
                  </div>

                  <button 
                    type="submit"
                    style={{
                      padding: '0.85rem',
                      borderRadius: '10px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: '#ffffff',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
                    }}
                  >
                    <CheckCircle2 size={18} /> Enviar Explicação ao Aluno
                  </button>

                </form>
              </div>

            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. PERFIL COORDENAÇÃO ACADÊMICA GGE                                       */}
        {/* ========================================================================= */}
        {activeRole === 'coordenador' && coordenadorStats && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            <div className="glass-card" style={{ padding: '1.75rem 2rem', background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(56, 189, 248, 0.12) 100%)', borderLeft: '4px solid #c084fc' }}>
              <span className="gge-badge" style={{ background: '#c084fc', marginBottom: '0.5rem', display: 'inline-block' }}>COORDENAÇÃO DE MATEMÁTICA</span>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Métricas de Aprovacão & Retenção • Colégio GGE</h2>
              <p style={{ margin: '0.3rem 0 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>Estatísticas reais do ciclo de aprendizagem (Dúvidas ativas, aprovações e resolutividade).</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
              
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>TOTAL DE DÚVIDAS NO CICLO</div>
                <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.4rem' }}>{coordenadorStats.totalChamados}</div>
              </div>

              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>CONTEÚDOS DOMINADOS (APROVADOS)</div>
                <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#10b981', marginTop: '0.4rem' }}>{coordenadorStats.aprovados}</div>
              </div>

              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>TAXA DE RETENÇÃO DA IA</div>
                <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#c084fc', marginTop: '0.4rem' }}>{coordenadorStats.precisaoIA}</div>
              </div>

              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>TAXA DE APROVAÇÃO</div>
                <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#f59e0b', marginTop: '0.4rem' }}>{coordenadorStats.taxaAprovacao}</div>
              </div>

            </div>

            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>
                Desempenho por Unidades Colégio GGE
              </h3>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>UNIDADE GGE</th>
                      <th style={{ padding: '0.75rem 1rem' }}>MONITORES ATIVOS</th>
                      <th style={{ padding: '0.75rem 1rem' }}>CICLOS FINALIZADOS</th>
                      <th style={{ padding: '0.75rem 1rem' }}>TEMPO MÉDIO</th>
                      <th style={{ padding: '0.75rem 1rem' }}>AVALIAÇÃO ALUNOS</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <td style={{ padding: '1rem', fontWeight: 700, color: '#38bdf8' }}>Unidade Boa Viagem - Recife</td>
                      <td style={{ padding: '1rem' }}>8 Monitores</td>
                      <td style={{ padding: '1rem' }}>512 dúvidas</td>
                      <td style={{ padding: '1rem', color: '#10b981', fontWeight: 600 }}>12 min</td>
                      <td style={{ padding: '1rem', color: '#f59e0b', fontWeight: 700 }}>4.95 ★</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <td style={{ padding: '1rem', fontWeight: 700, color: '#38bdf8' }}>Unidade Benfica - Recife</td>
                      <td style={{ padding: '1rem' }}>6 Monitores</td>
                      <td style={{ padding: '1rem' }}>430 dúvidas</td>
                      <td style={{ padding: '1rem', color: '#10b981', fontWeight: 600 }}>15 min</td>
                      <td style={{ padding: '1rem', color: '#f59e0b', fontWeight: 700 }}>4.90 ★</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <td style={{ padding: '1rem', fontWeight: 700, color: '#38bdf8' }}>Unidade Caruaru - PE</td>
                      <td style={{ padding: '1rem' }}>5 Monitores</td>
                      <td style={{ padding: '1rem' }}>380 dúvidas</td>
                      <td style={{ padding: '1rem', color: '#10b981', fontWeight: 600 }}>18 min</td>
                      <td style={{ padding: '1rem', color: '#f59e0b', fontWeight: 700 }}>4.85 ★</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '1rem', fontWeight: 700, color: '#38bdf8' }}>Unidade Aldeota - Fortaleza</td>
                      <td style={{ padding: '1rem' }}>5 Monitores</td>
                      <td style={{ padding: '1rem' }}>390 dúvidas</td>
                      <td style={{ padding: '1rem', color: '#10b981', fontWeight: 600 }}>16 min</td>
                      <td style={{ padding: '1rem', color: '#f59e0b', fontWeight: 700 }}>4.88 ★</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}
