export type CertificadoCategoria =
  | 'ministerial'
  | 'consagracao-obreiro'
  | 'apresentacao-criancas'
  | 'batismo-aguas'
  | 'ebd'
  | 'casamento';

export const CERTIFICADO_CATEGORIAS: Array<{ value: CertificadoCategoria; label: string }> = [
  { value: 'ministerial', label: 'Ministerial' },
  { value: 'consagracao-obreiro', label: 'Consagração de Obreiro' },
  { value: 'apresentacao-criancas', label: 'Apresentação de Crianças' },
  { value: 'batismo-aguas', label: 'Batismo nas Águas' },
  { value: 'casamento', label: 'Casamento' },
  { value: 'ebd', label: 'EBD — Escola Bíblica Dominical' },
];

const CERTIFICADO_PLACEHOLDERS_POR_CATEGORIA: Record<CertificadoCategoria, Array<{ campo: string; placeholder: string; label: string }>> = {
  ministerial: [
    { campo: 'ministro_nome',      placeholder: '{ministro_nome}',      label: 'Nome do Ministro' },
    { campo: 'matricula',          placeholder: '{matricula}',          label: 'Matrícula' },
    { campo: 'cargo_ministerial',  placeholder: '{cargo_ministerial}',  label: 'Cargo Ministerial' },
    { campo: 'congregacao',        placeholder: '{congregacao}',        label: 'Congregação' },
    { campo: 'data_consagracao',   placeholder: '{data_consagracao}',   label: 'Data de Consagração' },
    { campo: 'presidente_nome',    placeholder: '{presidente_nome}',    label: 'Presidente' },
    { campo: 'data_emissao',       placeholder: '{data_emissao}',       label: 'Data de Emissão' },
    { campo: 'nome_igreja',        placeholder: '{nome_igreja}',        label: 'Nome da Igreja' },
  ],
  'consagracao-obreiro': [
    { campo: 'obreiro_nome',      placeholder: '{obreiro_nome}',      label: 'Nome do Obreiro' },
    { campo: 'cargo',             placeholder: '{cargo}',             label: 'Cargo (Diácono, Presbítero...)' },
    { campo: 'data_consagracao',  placeholder: '{data_consagracao}',  label: 'Data de Consagração' },
    { campo: 'nome_igreja',       placeholder: '{nome_igreja}',       label: 'Nome da Igreja' },
    { campo: 'pastor_nome',       placeholder: '{pastor_nome}',       label: 'Pastor Presidente' },
    { campo: 'data_emissao',      placeholder: '{data_emissao}',      label: 'Data de Emissão' },
  ],
  'apresentacao-criancas': [
    { campo: 'crianca_nome',              placeholder: '{crianca_nome}',              label: 'Nome da Criança' },
    { campo: 'crianca_data_nascimento',   placeholder: '{crianca_data_nascimento}',   label: 'Data de Nascimento' },
    { campo: 'pai_nome',                  placeholder: '{pai_nome}',                  label: 'Nome do Pai' },
    { campo: 'mae_nome',                  placeholder: '{mae_nome}',                  label: 'Nome da Mãe' },
    { campo: 'data_apresentacao',         placeholder: '{data_apresentacao}',         label: 'Data da Apresentação' },
    { campo: 'nome_igreja',               placeholder: '{nome_igreja}',               label: 'Nome da Igreja' },
    { campo: 'data_emissao',              placeholder: '{data_emissao}',              label: 'Data de Emissão' },
  ],
  'batismo-aguas': [
    { campo: 'candidato_nome',            placeholder: '{candidato_nome}',            label: 'Nome do Candidato' },
    { campo: 'data_batismo',              placeholder: '{data_batismo}',              label: 'Data do Batismo' },
    { campo: 'pastor_nome',               placeholder: '{pastor_nome}',               label: 'Nome do Pastor' },
    { campo: 'nome_igreja',               placeholder: '{nome_igreja}',               label: 'Nome da Igreja' },
    { campo: 'data_emissao',              placeholder: '{data_emissao}',              label: 'Data de Emissão' },
  ],
  casamento: [
    { campo: 'conjuge1_nome',     placeholder: '{conjuge1_nome}',     label: 'Nome do Cônjuge 1' },
    { campo: 'conjuge2_nome',     placeholder: '{conjuge2_nome}',     label: 'Nome do Cônjuge 2' },
    { campo: 'data_casamento',    placeholder: '{data_casamento}',    label: 'Data do Casamento' },
    { campo: 'pastor_nome',       placeholder: '{pastor_nome}',       label: 'Pastor Celebrante' },
    { campo: 'nome_igreja',       placeholder: '{nome_igreja}',       label: 'Nome da Igreja' },
    { campo: 'data_emissao',      placeholder: '{data_emissao}',      label: 'Data de Emissão' },
  ],
  ebd: [
    { campo: 'aluno_nome',        placeholder: '{aluno_nome}',        label: 'Nome do Aluno' },
    { campo: 'turma_nome',        placeholder: '{turma_nome}',        label: 'Nome da Turma' },
    { campo: 'professor_nome',    placeholder: '{professor_nome}',    label: 'Professor Titular' },
    { campo: 'nome_igreja',       placeholder: '{nome_igreja}',       label: 'Nome da Igreja' },
    { campo: 'data_emissao',      placeholder: '{data_emissao}',      label: 'Data de Emissão' },
  ],
};

export const CERTIFICADO_PLACEHOLDERS = CERTIFICADO_PLACEHOLDERS_POR_CATEGORIA.ministerial;

export const getCertificadoPlaceholders = (categoria?: string) => {
  if (!categoria) return CERTIFICADO_PLACEHOLDERS;
  return CERTIFICADO_PLACEHOLDERS_POR_CATEGORIA[categoria as CertificadoCategoria] ?? CERTIFICADO_PLACEHOLDERS;
};

const formatDate = (value?: string | null) => {
  if (!value) return '';
  const str = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [ano, mes, dia] = str.split('-');
    return `${dia}/${mes}/${ano}`;
  }
  return str;
};

export function substituirPlaceholdersCertificado(texto: string, dados: Record<string, any>, categoria?: string): string {
  if (!texto) return texto;

  let resultado = texto;
  const today = new Date();
  const dataEmissao = dados.data_emissao || `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

  const base: Record<string, any> = {
    ...dados,
    data_emissao: dataEmissao,
    data_consagracao: formatDate(dados.data_consagracao || dados.data_processo || dados.data_evento || '')
  };

  const placeholders = getCertificadoPlaceholders(categoria);
  placeholders.forEach((ph) => {
    const regex = new RegExp(ph.placeholder.replace(/[{}]/g, '\\$&'), 'gi');
    const valor = String(base[ph.campo] ?? '').toUpperCase();
    resultado = resultado.replace(regex, valor);
  });

  return resultado;
}

export function obterPreviewTextoCertificado(texto: string, categoria?: string): string {
  if (!texto) return 'Texto';

  let preview = texto;
  const placeholders = getCertificadoPlaceholders(categoria);
  placeholders.forEach((ph) => {
    const regex = new RegExp(ph.placeholder.replace(/[{}]/g, '\\$&'), 'g');
    preview = preview.replace(regex, `[${ph.label}]`);
  });

  return preview;
}
