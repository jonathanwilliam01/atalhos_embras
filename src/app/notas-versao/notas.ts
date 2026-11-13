import notasVersaoData from './notas_versao.json';

export type TipoNota = 'novidade' | 'melhoria' | 'correcao';

export const ROTULOS_NOTA: Record<TipoNota, string> = { novidade: 'Novidade', melhoria: 'Melhoria', correcao: 'Correção' };

interface VersaoNota {
  versao: string;
  data: string;
  descricao: { tipo: TipoNota; texto: string }[];
}

// Mais nova primeiro; a versão do app é a maior nota.
export const VERSOES_NOTAS: VersaoNota[] = [...notasVersaoData.versoes as VersaoNota[]].sort((a, b) => b.versao.localeCompare(a.versao, undefined, { numeric: true }));
export const ULTIMA_VERSAO: VersaoNota | undefined = VERSOES_NOTAS[0];
