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
  UploadCloud,
  Users,
  Square,
  CheckSquare,
  Building2,
  BrainCircuit,
  MessageSquare
} from 'lucide-react';

const API_BASE = 'http://localhost:8080';

export default function PlataformaMonitoriaGGE() {
  const [activeRole, setActiveRole] = useState('aluno');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [coordenadorStats, setCoordenadorStats] = useState(null);

  // Form Novo Chamado
  const [novoChamado, setNovoChamado] = useState({
    aluno: 'Lucas Silva (Turma 3º Ano Medicina - GGE)',
    unidade: 'Unidade Boa Viagem - Recife',
    assunto: 'Geometria Analítica - Distância Ponto e Reta',
    tipo: 'texto',
    duvidaTexto: '',
  });
  const [fotoFile, setFotoFile] = useState(null);

  // Assistente IA Filtros
  const [filtroIA, setFiltroIA] = useState({
    vestibular: 'ENEM',
    nivel: 'Médio',
    assunto: 'Geometria Analítica'
  });
  const [questoesIA, setQuestoesIA] = useState([]);

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

      buscarQuestoesIA();

      const statsRes = await fetch(`${API_BASE}/api/coordenador/stats`);
      const statsData = await statsRes.json();
      if (statsData.success) setCoordenadorStats(statsData);
    } catch (err) {
      console.error('Erro ao conectar ao serviço:', err);
    } finally {
      setLoading(false);
    }
  };

  const buscarQuestoesIA = async () => {
    try {
      const url = `${API_BASE}/api/ai/recomendar?vestibular=${filtroIA.vestibular}&nivel=${filtroIA.nivel}&assunto=${encodeURIComponent(filtroIA.assunto)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setQuestoesIA(data.questoes);
      }
    } catch (err) {
      console.error('Erro ao consultar banco de questões:', err);
    }
  };

  useEffect(() => {
    buscarQuestoesIA();
  }, [filtroIA]);

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
        alert('Sua dúvida foi enviada com sucesso para a equipe de monitoria!');
        setNovoChamado(prev => ({ ...prev, duvidaTexto: '' }));
        setFotoFile(null);
        carregarDados();
      }
    } catch (err) {
      alert('Ocorreu um erro ao enviar a dúvida. Tente novamente.');
    }
  };

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
        alert(`Resposta enviada ao aluno com sucesso!`);
        setRespostaMonitor(prev => ({ ...prev, textoExplicativo: '' }));
        setMonitorPdf(null);
        setMonitorFoto(null);
        setMonitorVideo(null);
        setAudioBlob(null);
        carregarDados();
      }
    } catch (err) {
      alert('Erro ao enviar a resposta ao aluno.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* NAVBAR COLÉGIO GGE */}
      <nav className="glass-nav" style={{ padding: '1rem 2rem', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          
          {/* LOGO GGE */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)', padding: '0.6rem 0.8rem', borderRadius: '12px', boxShadow: '0 4px 14px rgba(225, 29, 72, 0.4)' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ffffff', letterSpacing: '0.05em' }}>GGE</span>
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.025em' }}>
                Plataforma de Monitoria • Matemática
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Colégio GGE • Excelência em Aprovacão</div>
            </div>
          </div>

          {/* NAVEGAÇÃO DE PERFIS */}
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

      {/* CONTEÚDO PRINCIPAL DO PRODUTO */}
      <main style={{ flex: 1, maxWidth: '1280px', width: '100%', margin: '0 auto', padding: '2rem 1rem' }}>
        
        {/* ========================================================================= */}
        {/* 1. PERFIL ALUNO GGE                                                       */}
        {/* ========================================================================= */}
        {activeRole === 'aluno' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            <div className="glass-card" style={{ padding: '1.75rem 2rem', background: 'linear-gradient(135deg, rgba(225, 29, 72, 0.15) 0%, rgba(56, 189, 248, 0.12) 100%)', borderLeft: '4px solid #e11d48' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <span className="gge-badge" style={{ marginBottom: '0.5rem', display: 'inline-block' }}>PORTAL DO ALUNO</span>
                  <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Tirar Dúvidas de Matemática</h2>
                  <p style={{ margin: '0.3rem 0 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>Envie suas perguntas conceituais ou foto de questões para os monitores especialistas do GGE.</p>
                </div>
                <div style={{ textAlign: 'right', background: 'rgba(15, 23, 42, 0.6)', padding: '0.6rem 1.2rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>SUA UNIDADE</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Building2 size={16} /> Unidade Boa Viagem - Recife
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '2rem' }}>
              
              {/* FORMULÁRIO DE DÚVIDA */}
              <div className="glass-card" style={{ padding: '1.75rem' }}>
                <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ffffff' }}>
                  <Send size={20} color="#e11d48" />
                  Enviar Dúvida para a Monitoria
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

                  {/* FOTO DA QUESTÃO */}
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '0.4rem' }}>Foto da Questão (opcional):</label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type="file"
                        accept="image/*"
                        onChange={(e) => setFotoFile(e.target.files[0])}
                        style={{ width: '100%', padding: '0.6rem', borderRadius: '10px', background: '#0b1120', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8', fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>

                  {/* DÚVIDA CONCEITUAL EM TEXTO */}
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '0.4rem' }}>Descrição da Dúvida:</label>
                    <textarea 
                      rows={4}
                      value={novoChamado.duvidaTexto}
                      onChange={(e) => setNovoChamado({...novoChamado, duvidaTexto: e.target.value})}
                      placeholder="Descreva onde você travou na resolução do exercício..."
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
                    <Send size={18} /> Enviar Dúvida para Monitoria GGE
                  </button>

                </form>
              </div>

              {/* ASSISTENTE DE IA E MINHAS DÚVIDAS */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                {/* ASSISTENTE IA GGE */}
                <div className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid #c084fc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#c084fc' }}>
                      <BrainCircuit size={20} /> Assistente de Estudos IA GGE
                    </h3>
                    <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '9999px', background: 'rgba(192, 132, 252, 0.15)', color: '#c084fc', fontWeight: 600 }}>
                      Filtro de Vestibular
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Vestibular Target:</label>
                      <select 
                        value={filtroIA.vestibular} 
                        onChange={(e) => setFiltroIA({...filtroIA, vestibular: e.target.value})}
                        style={{ width: '100%', padding: '0.4rem', borderRadius: '8px', background: '#0b1120', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem' }}
                      >
                        <option>ENEM</option>
                        <option>FUVEST</option>
                        <option>UNICAMP</option>
                        <option>SSA / UPE</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Nível da Questão:</label>
                      <select 
                        value={filtroIA.nivel} 
                        onChange={(e) => setFiltroIA({...filtroIA, nivel: e.target.value})}
                        style={{ width: '100%', padding: '0.4rem', borderRadius: '8px', background: '#0b1120', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem' }}
                      >
                        <option>Fácil</option>
                        <option>Médio</option>
                        <option>Difícil</option>
                      </select>
                    </div>
                  </div>

                  {/* LISTA DE QUESTÕES RECOMENDADAS PELA IA */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {questoesIA.map(q => (
                      <div key={q.id} style={{ padding: '0.85rem', borderRadius: '10px', background: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8' }}>{q.vestibular} • {q.id}</span>
                          <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', fontWeight: 600 }}>Nível: {q.nivel}</span>
                        </div>
                        <div style={{ fontSize: '0.825rem', color: '#cbd5e1', marginBottom: '0.4rem' }}>{q.enunciado}</div>
                        <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>Gabarito Sugerido: {q.respostaCerta}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CHAMADOS DO ALUNO */}
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                  <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>
                    Minhas Dúvidas Enviadas ({tickets.length})
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {tickets.map(t => (
                      <div key={t.id} style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#e11d48' }}>{t.id} • {t.aluno}</span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '9999px', background: t.status === 'Respondido' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)', color: t.status === 'Respondido' ? '#10b981' : '#f59e0b' }}>
                            {t.status}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.25rem' }}>{t.assunto}</div>
                        <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.5rem' }}>{t.duvidaTexto}</div>

                        {t.fotoUrl && (
                          <div style={{ marginTop: '0.5rem' }}>
                            <a href={`${API_BASE}${t.fotoUrl}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: '#38bdf8', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Camera size={14} /> Foto da Questão Enviada
                            </a>
                          </div>
                        )}

                        {t.resposta && (
                          <div style={{ marginTop: '0.75rem', padding: '0.85rem', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#10b981' }}>Resposta da Equipe GGE ({t.resposta.monitor}):</div>
                            <div style={{ fontSize: '0.85rem', color: '#e2e8f0', margin: '0.3rem 0 0.6rem 0' }}>{t.resposta.texto}</div>
                            
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                              {t.resposta.pdfUrl && (
                                <a href={`${API_BASE}${t.resposta.pdfUrl}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
                                  <FileCode size={14} /> Abrir PDF Explicativo
                                </a>
                              )}
                              {t.resposta.fotoUrl && (
                                <a href={`${API_BASE}${t.resposta.fotoUrl}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
                                  <ImageIcon size={14} /> Abrir Foto da Lousa
                                </a>
                              )}
                              {t.resposta.videoUrl && (
                                <a href={`${API_BASE}${t.resposta.videoUrl}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', borderRadius: '6px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
                                  <Video size={14} /> Assistir Vídeo MP4
                                </a>
                              )}
                              {t.resposta.audioUrl && (
                                <div style={{ width: '100%', marginTop: '0.4rem' }}>
                                  <div style={{ fontSize: '0.75rem', color: '#c084fc', marginBottom: '0.2rem', fontWeight: 600 }}>🎙️ Explicação em Áudio Passo a Passo:</div>
                                  <audio controls src={`${API_BASE}${t.resposta.audioUrl}`} style={{ height: '36px', width: '100%' }} />
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
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
              <span className="gge-badge" style={{ background: '#10b981', marginBottom: '0.5rem', display: 'inline-block' }}>EQUIPE PEDAGÓGICA</span>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Painel do Monitor GGE • Resposta aos Alunos</h2>
              <p style={{ margin: '0.3rem 0 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>Elabore resoluções completas com envio de PDF, Foto da Lousa, Vídeo MP4 e Áudio gravado.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '2rem' }}>
              
              {/* FILA DE DÚVIDAS DAS UNIDADES */}
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.05rem', fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={20} /> Selecionar Dúvida para Responder
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
                        <span style={{ fontSize: '0.75rem', color: t.status === 'Respondido' ? '#10b981' : '#f59e0b', fontWeight: 700 }}>{t.status}</span>
                      </div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff' }}>{t.assunto}</div>
                      <div style={{ fontSize: '0.825rem', color: '#cbd5e1', marginTop: '0.25rem' }}>{t.duvidaTexto}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* FORMULÁRIO DE ENVIO MULTIMÍDIA */}
              <div className="glass-card" style={{ padding: '1.75rem' }}>
                <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>
                  Anexar Resolução para ({respostaMonitor.ticketId})
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

                  {/* GRAVADOR DE ÁUDIO */}
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
                      {audioBlob && <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>✅ Áudio Prontinho!</span>}
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
                    <CheckCircle2 size={18} /> Enviar Resposta Completa ao Aluno
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
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Painel Pedagógico de Monitoria • Colégio GGE</h2>
              <p style={{ margin: '0.3rem 0 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>Acompanhamento em tempo real das métricas de atendimento, unidades e retenção de dúvidas.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
              
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>DÚVIDAS ATENDIDAS (MÊS)</div>
                <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.4rem' }}>{coordenadorStats.totalChamados}</div>
                <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.2rem' }}>↑ 18% em relação ao período anterior</div>
              </div>

              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>TEMPO MÉDIO DE RESPOSTA</div>
                <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#10b981', marginTop: '0.4rem' }}>{coordenadorStats.tempoMedioMinutos} min</div>
                <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.2rem' }}>Meta GGE: &lt; 30 min</div>
              </div>

              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>ACERTOS ASSISTENTE IA</div>
                <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#c084fc', marginTop: '0.4rem' }}>{coordenadorStats.precisaoIA}</div>
                <div style={{ fontSize: '0.75rem', color: '#c084fc', marginTop: '0.2rem' }}>Recomendações aceitas pelos vestibulandos</div>
              </div>

              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>TAXA DE RESOLUTIVIDADE</div>
                <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#f59e0b', marginTop: '0.4rem' }}>{coordenadorStats.taxaResposta}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>Sem retrabalho nas dúvidas</div>
              </div>

            </div>

            {/* TABELA DE UNIDADES GGE */}
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>
                Acompanhamento por Unidades Colégio GGE
              </h3>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>UNIDADE GGE</th>
                      <th style={{ padding: '0.75rem 1rem' }}>MONITORES ATIVOS</th>
                      <th style={{ padding: '0.75rem 1rem' }}>DÚVIDAS ATENDIDAS</th>
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
