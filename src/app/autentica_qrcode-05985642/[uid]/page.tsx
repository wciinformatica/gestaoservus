import { createServerClient } from '@/lib/supabase-server';
import { notFound } from 'next/navigation';
import Image from 'next/image';

interface Props {
  params: { uid: string };
}

function formatarData(data: string | null | undefined): string {
  if (!data) return '—';
  try {
    const d = new Date(data);
    if (isNaN(d.getTime())) return data;
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return data;
  }
}

function labelTipoCadastro(tipo: string): string {
  const mapa: Record<string, string> = {
    ministro: 'Ministro',
    membro: 'Membro',
    congregado: 'Congregado',
    crianca: 'Criança',
    funcionario: 'Funcionário',
  };
  return mapa[String(tipo).toLowerCase()] ?? tipo;
}

export default async function CredencialPage({ params }: Props) {
  const { uid } = params;

  if (!uid || uid.trim().length < 8) {
    notFound();
  }

  const supabase = createServerClient();

  const { data: member } = await supabase
    .from('members')
    .select(
      'id, unique_id, name, matricula, tipo_cadastro, cargo_ministerial, qual_funcao, foto_url, status, data_validade_credencial, data_emissao, data_consagracao, custom_fields, ministry_id'
    )
    .eq('unique_id', uid.trim())
    .maybeSingle();

  if (!member) {
    notFound();
  }

  const cf = (member.custom_fields && typeof member.custom_fields === 'object')
    ? member.custom_fields as Record<string, any>
    : {};

  // Busca dados do ministério para exibir nome/logo
  const { data: ministry } = await supabase
    .from('ministries')
    .select('name, logo_url, responsible_name')
    .eq('id', member.ministry_id)
    .maybeSingle();

  const ativa = member.status === 'active';
  const nome = member.name;
  const matricula = member.matricula || cf.matricula || '—';
  const tipoCadastro = member.tipo_cadastro || cf.tipoCadastro || '';
  const cargo = member.cargo_ministerial || cf.cargoMinisterial || member.qual_funcao || cf.qualFuncao || '—';
  const fotoUrl = member.foto_url || cf.fotoUrl || null;
  const dataEmissao = formatarData(member.data_emissao || cf.dataEmissao);
  const dataValidade = formatarData(member.data_validade_credencial || cf.validade);
  const dataConsagracao = formatarData(member.data_consagracao || cf.dataConsagracao);

  const agora = new Date().toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'America/Sao_Paulo',
  });

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Cabeçalho com logo/nome do ministério */}
        {ministry && (
          <div className="flex flex-col items-center mb-6 gap-2">
            {ministry.logo_url ? (
              <Image
                src={ministry.logo_url}
                alt={ministry.name}
                width={80}
                height={80}
                className="rounded-full object-contain bg-white p-1"
                unoptimized
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-2xl">
                ⛪
              </div>
            )}
            <span className="text-white/80 text-sm font-medium text-center">
              {ministry.name}
            </span>
          </div>
        )}

        {/* Cartão de credencial */}
        <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/10">

          {/* Topo do cartão */}
          <div className={`px-6 pt-6 pb-4 ${ativa ? 'bg-gradient-to-br from-blue-700 to-blue-900' : 'bg-gradient-to-br from-slate-600 to-slate-800'}`}>
            <div className="flex items-start gap-4">
              {/* Foto */}
              <div className="flex-shrink-0">
                {fotoUrl ? (
                  <Image
                    src={fotoUrl}
                    alt={nome}
                    width={72}
                    height={88}
                    className="w-18 h-22 object-cover rounded-lg border-2 border-white/40 shadow"
                    style={{ width: 72, height: 88 }}
                    unoptimized
                  />
                ) : (
                  <div className="w-[72px] h-[88px] rounded-lg bg-white/20 border-2 border-white/30 flex items-center justify-center text-3xl">
                    👤
                  </div>
                )}
              </div>

              {/* Nome e cargo */}
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-base leading-tight break-words">
                  {nome}
                </p>
                {cargo && cargo !== '—' && (
                  <p className="text-blue-200 text-xs mt-1 break-words">
                    {cargo}
                  </p>
                )}
                <p className="text-white/60 text-xs mt-1">
                  {labelTipoCadastro(tipoCadastro)}
                </p>

                {/* Badge de status */}
                <div className="mt-2">
                  {ativa ? (
                    <span className="inline-flex items-center gap-1 bg-green-500/20 text-green-300 border border-green-500/40 text-xs px-2 py-0.5 rounded-full font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block"></span>
                      CREDENCIAL ATIVA
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-red-500/20 text-red-300 border border-red-500/40 text-xs px-2 py-0.5 rounded-full font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block"></span>
                      CREDENCIAL INATIVA
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Corpo do cartão */}
          <div className="bg-white px-6 py-4 space-y-3">

            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">Matrícula</p>
                <p className="text-sm font-semibold text-slate-800">{matricula}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">ID</p>
                <p className="text-xs font-mono text-slate-600 break-all">{uid}</p>
              </div>

              {dataEmissao !== '—' && (
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Emissão</p>
                  <p className="text-sm text-slate-700">{dataEmissao}</p>
                </div>
              )}

              {dataValidade !== '—' && (
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Validade</p>
                  <p className={`text-sm font-semibold ${ativa ? 'text-slate-700' : 'text-red-600'}`}>
                    {dataValidade}
                  </p>
                </div>
              )}

              {dataConsagracao !== '—' && (
                <div className="col-span-2">
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Consagração</p>
                  <p className="text-sm text-slate-700">{dataConsagracao}</p>
                </div>
              )}
            </div>

            {/* Separador */}
            <div className="border-t border-slate-100" />

            {/* Rodapé do cartão */}
            <div className="text-center">
              <p className="text-[10px] text-slate-400">
                Verificado em {agora} (Brasília)
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Autenticidade confirmada pelo sistema
              </p>
            </div>
          </div>
        </div>

        {/* Nota de rodapé */}
        <p className="text-center text-white/30 text-xs mt-4">
          Esta credencial é gerada automaticamente e pode ser verificada a qualquer momento.
        </p>
      </div>
    </main>
  );
}

export const dynamic = 'force-dynamic';
