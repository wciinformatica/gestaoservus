'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

import { createClient } from '@/lib/supabase-client';

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [dataAtual, setDataAtual] = useState('');
  const [usuarioLogado, setUsuarioLogado] = useState<{
    nome: string;
    email: string;
    nivel: string;
  } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [stats, setStats] = useState({ ministros: 0, ativos: 0, inativos: 0, homologacao: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        const { data } = await supabase.auth.getUser();

        if (!data.user) {
          router.push('/login');
          return;
        }

        // Busca role e ministry_id do usuário
        const { data: mu } = await supabase
          .from('ministry_users')
          .select('role, ministry_id')
          .eq('user_id', data.user.id)
          .maybeSingle();

        const nivel = mu?.role ? String(mu.role) : 'viewer';

        setUsuarioLogado({
          nome: data.user.user_metadata?.full_name || data.user.email || 'Usuário',
          email: data.user.email || '',
          nivel,
        });

        // Busca contagens para os cards de stats (todos filtrados por tipo_cadastro=ministro)
        if (mu?.ministry_id) {
          const mid = mu.ministry_id;
          const [
            { count: ministros },
            { count: ativos },
            { count: inativos },
            { count: homologacao },
          ] = await Promise.all([
            supabase.from('members').select('*', { count: 'exact', head: true }).eq('ministry_id', mid).eq('tipo_cadastro', 'ministro'),
            supabase.from('members').select('*', { count: 'exact', head: true }).eq('ministry_id', mid).eq('tipo_cadastro', 'ministro').eq('status', 'active'),
            supabase.from('members').select('*', { count: 'exact', head: true }).eq('ministry_id', mid).eq('tipo_cadastro', 'ministro').eq('status', 'inactive'),
            supabase.from('consagracao_registros').select('*', { count: 'exact', head: true }).eq('ministry_id', mid).eq('status_processo', 'homologar'),
          ]);
          setStats({
            ministros: ministros ?? 0,
            ativos: ativos ?? 0,
            inativos: inativos ?? 0,
            homologacao: homologacao ?? 0,
          });
        }
      } finally {
        setAuthLoading(false);
        setStatsLoading(false);
      }
    };

    run();
  }, [router]);

  useEffect(() => {
    const formatarData = () => {
      const agora = new Date();
      const dias = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
      const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
      
      const diaSemana = dias[agora.getDay()];
      const dia = agora.getDate();
      const mes = meses[agora.getMonth()];
      const ano = agora.getFullYear();
      const horas = String(agora.getHours()).padStart(2, '0');
      const minutos = String(agora.getMinutes()).padStart(2, '0');
      
      return `${diaSemana}, ${dia} de ${mes} de ${ano} - ${horas}:${minutos}`;
    };
    
    setDataAtual(formatarData());
    
    // Atualizar a cada minuto
    const intervalo = setInterval(() => {
      setDataAtual(formatarData());
    }, 60000);
    
    return () => clearInterval(intervalo);
  }, []);

  const handleLogout = () => {
    supabase.auth.signOut().finally(() => router.push('/'));
  };

  const getNivelExibicao = (nivel: string) => {
    const mapeamento: { [key: string]: string } = {
      'admin': 'Administrador',
      'manager': 'Gerente',
      'operator': 'Operador',
      'viewer': 'Visualizador'
    };
    return mapeamento[nivel] || nivel;
  };

  const getCorNivel = (nivel: string) => {
    const cores: { [key: string]: string } = {
      'admin': 'bg-red-100 text-red-800',
      'manager': 'bg-green-100 text-green-800',
      'operator': 'bg-blue-100 text-blue-800',
      'viewer': 'bg-gray-100 text-gray-800'
    };
    return cores[nivel] || 'bg-gray-100 text-gray-800';
  };

  if (authLoading) return <div className="p-8">Carregando...</div>;

  const statsCards = [
    { title: 'Financeiro', value: 'R$ 0,00', subtitle: 'Receitas', icon: '💳', color: 'bg-cyan-100' },
    { title: 'Comissão', value: '0', subtitle: 'membros ativos', icon: '👥', color: 'bg-yellow-100' },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} />

      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {/* HEADER */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#123b63]">Bem-vindo ao Dashboard</h1>
              <p className="text-gray-600 text-sm md:text-base mt-1">{dataAtual}</p>
            </div>
            {usuarioLogado && (
              <div className="flex items-center gap-6 bg-white rounded-lg p-4 shadow-sm border border-gray-200 md:flex-shrink-0">
                <div className="text-right">
                  <p className="text-sm font-semibold text-[#123b63]">{usuarioLogado.nome}</p>
                  <p className="text-xs text-gray-600 mt-1">{usuarioLogado.email}</p>
                  <div className="mt-2 flex justify-end">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${getCorNivel(usuarioLogado.nivel)}`}>
                      {getNivelExibicao(usuarioLogado.nivel)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold text-sm whitespace-nowrap"
                >
                  Sair
                </button>
              </div>
            )}
          </div>

          {/* STATS CARDS — 4 indicadores principais */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Total de Ministros */}
            <div className="rounded-2xl p-5 shadow-md transition hover:shadow-lg hover:scale-[1.02] cursor-default" style={{ background: '#3b82f6' }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white/80 text-sm font-medium">Total de Ministros</p>
                  <p className="text-white text-4xl font-bold mt-2">
                    {statsLoading ? <span className="text-white/40 text-2xl">…</span> : stats.ministros}
                  </p>
                </div>
                <svg className="w-10 h-10 text-white/30" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                </svg>
              </div>
            </div>

            {/* Ministros Ativos */}
            <div className="rounded-2xl p-5 shadow-md transition hover:shadow-lg hover:scale-[1.02] cursor-default" style={{ background: '#22c55e' }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white/80 text-sm font-medium">Ministros Ativos</p>
                  <p className="text-white text-4xl font-bold mt-2">
                    {statsLoading ? <span className="text-white/40 text-2xl">…</span> : stats.ativos}
                  </p>
                  {!statsLoading && stats.ministros > 0 && (
                    <p className="text-white/70 text-xs mt-1">
                      {((stats.ativos / stats.ministros) * 100).toFixed(1)}% do total
                    </p>
                  )}
                </div>
                <svg className="w-10 h-10 text-white/30" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            {/* Ministros Inativos */}
            <div className="rounded-2xl p-5 shadow-md transition hover:shadow-lg hover:scale-[1.02] cursor-default" style={{ background: '#f97316' }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white/80 text-sm font-medium">Ministros Inativos</p>
                  <p className="text-white text-4xl font-bold mt-2">
                    {statsLoading ? <span className="text-white/40 text-2xl">…</span> : stats.inativos}
                  </p>
                  {!statsLoading && stats.ministros > 0 && (
                    <p className="text-white/70 text-xs mt-1">
                      {((stats.inativos / stats.ministros) * 100).toFixed(1)}% do total
                    </p>
                  )}
                </div>
                <svg className="w-10 h-10 text-white/30" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                </svg>
              </div>
            </div>

            {/* Homologação */}
            <div className="rounded-2xl p-5 shadow-md transition hover:shadow-lg hover:scale-[1.02] cursor-default" style={{ background: '#a855f7' }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white/80 text-sm font-medium">Homologação</p>
                  <p className="text-white text-4xl font-bold mt-2">
                    {statsLoading ? <span className="text-white/40 text-2xl">…</span> : stats.homologacao}
                  </p>
                  <p className="text-white/70 text-xs mt-1">Aguardando</p>
                </div>
                <svg className="w-10 h-10 text-white/30" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                </svg>
              </div>
            </div>
          </div>

          {/* STATS CARDS */}
          <div className="mb-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {statsCards.map((card, index) => (
                <div
                  key={index}
                  className={`${card.color} rounded-2xl p-6 hover:shadow-md transition cursor-pointer border-2 border-gray-300 shadow-sm hover:scale-105`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-gray-700 text-sm font-semibold">{card.title}</p>
                      <h3 className="text-2xl font-bold text-[#123b63] mt-2">{card.value}</h3>
                      <p className="text-gray-600 text-xs mt-2">{card.subtitle}</p>
                    </div>
                    <span className="text-4xl">{card.icon}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RECENT ACTIVITY SECTION */}
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* MISSÕES */}
            <div className="bg-white rounded-2xl p-8 shadow-md hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-bold text-[#123b63]">Missões</h3>
                  <p className="text-gray-600 text-xs mt-2">Atividades em andamento</p>
                </div>
                <span className="text-3xl">✈️</span>
              </div>
              <p className="text-3xl font-bold text-[#123b63] mt-4">0</p>
            </div>

            {/* PATRIMÔNIO */}
            <div className="bg-white rounded-2xl p-8 shadow-md hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-bold text-[#123b63]">Patrimônio</h3>
                  <p className="text-gray-600 text-xs mt-2">Bens da instituição</p>
                </div>
                <span className="text-3xl">🏢</span>
              </div>
              <p className="text-3xl font-bold text-[#123b63] mt-4">0</p>
            </div>

            {/* EVENTOS */}
            <div className="bg-white rounded-2xl p-8 shadow-md hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-bold text-[#123b63]">Eventos</h3>
                  <p className="text-gray-600 text-xs mt-2">Próximos eventos</p>
                </div>
                <span className="text-3xl">📅</span>
              </div>
              <p className="text-3xl font-bold text-[#123b63] mt-4">0</p>
            </div>
            </div>
          </div>

          {/* SECOND ROW - MORE OPTIONS */}
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* SECRETARIA */}
            <div className="bg-white rounded-2xl p-8 shadow-md hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-bold text-[#123b63]">Secretaria</h3>
                  <p className="text-gray-600 text-xs mt-2">Documentos</p>
                </div>
                <span className="text-3xl">📝</span>
              </div>
              <p className="text-3xl font-bold text-[#123b63] mt-4">0</p>
            </div>

            {/* REUNIÕES */}
            <div className="bg-white rounded-2xl p-8 shadow-md hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-bold text-[#123b63]">Reuniões</h3>
                  <p className="text-gray-600 text-xs mt-2">Agendadas</p>
                </div>
                <span className="text-3xl">🤝</span>
              </div>
              <p className="text-3xl font-bold text-[#123b63] mt-4">0</p>
            </div>

            {/* PRESIDÊNCIA */}
            <div className="bg-white rounded-2xl p-8 shadow-md hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-bold text-[#123b63]">Presidência</h3>
                  <p className="text-gray-600 text-xs mt-2">Atividades</p>
                </div>
                <span className="text-3xl">👑</span>
              </div>
              <p className="text-3xl font-bold text-[#123b63] mt-4">0</p>
            </div>
            </div>
          </div>

          {/* THIRD ROW - FINAL OPTIONS */}
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* FUNCIONÁRIOS */}
            <div className="bg-white rounded-2xl p-8 shadow-md hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-bold text-[#123b63]">Funcionários</h3>
                  <p className="text-gray-600 text-xs mt-2">Equipe</p>
                </div>
                <span className="text-3xl">👔</span>
              </div>
              <p className="text-3xl font-bold text-[#123b63] mt-4">0</p>
            </div>

            {/* AUDITORIA */}
            <div className="bg-white rounded-2xl p-8 shadow-md hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-bold text-[#123b63]">Auditoria</h3>
                  <p className="text-gray-600 text-xs mt-2">Registros</p>
                </div>
                <span className="text-3xl">✅</span>
              </div>
              <p className="text-3xl font-bold text-[#123b63] mt-4">0</p>
            </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
