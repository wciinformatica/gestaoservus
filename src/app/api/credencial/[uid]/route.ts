import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export async function GET(
  _request: NextRequest,
  { params }: { params: { uid: string } }
) {
  const { uid } = params;

  if (!uid || uid.trim().length < 8) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  const supabase = createServerClient();

  const { data: member, error } = await supabase
    .from('members')
    .select(
      'id, unique_id, name, matricula, tipo_cadastro, cargo_ministerial, qual_funcao, foto_url, status, data_validade_credencial, data_emissao, data_consagracao, custom_fields, ministry_id'
    )
    .eq('unique_id', uid.trim())
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: 'Erro ao consultar banco de dados' }, { status: 500 });
  }

  if (!member) {
    return NextResponse.json({ error: 'Credencial não encontrada' }, { status: 404 });
  }

  if (member.status === 'inactive' || member.status === 'deceased' || member.status === 'transferred') {
    return NextResponse.json(
      {
        ativa: false,
        nome: member.name,
        matricula: member.matricula,
        tipoCadastro: member.tipo_cadastro,
        cargo: member.cargo_ministerial || member.qual_funcao || '',
        status: member.status,
        fotoUrl: member.foto_url,
      },
      { status: 403 }
    );
  }

  const cf = (member.custom_fields && typeof member.custom_fields === 'object')
    ? member.custom_fields as Record<string, any>
    : {};

  return NextResponse.json({
    ativa: true,
    nome: member.name,
    matricula: member.matricula || (cf.matricula ?? ''),
    tipoCadastro: member.tipo_cadastro || (cf.tipoCadastro ?? ''),
    cargo: member.cargo_ministerial || cf.cargoMinisterial || member.qual_funcao || cf.qualFuncao || '',
    fotoUrl: member.foto_url || cf.fotoUrl || null,
    dataEmissao: member.data_emissao || cf.dataEmissao || null,
    dataValidade: member.data_validade_credencial || cf.validade || null,
    dataConsagracao: member.data_consagracao || cf.dataConsagracao || null,
    status: member.status,
    uniqueId: member.unique_id,
  });
}
