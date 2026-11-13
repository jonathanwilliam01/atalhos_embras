import type { Tela } from '../sistemas';

export interface ResultadoBusca {
  sistema: string;
  nomeSistema: string;
  local: string;
  cliente: string;
  url: string;
  host: string;
  homolog: boolean;
}

export interface GrupoBusca {
  cliente: string;
  // Sigla do estado, ou a categoria em grupo por sistema.
  estado: string;
  // Tela que não é por município (Links Úteis): agrupa por sistema + categoria e o item mostra o nome do link.
  porSistema?: boolean;
  itens: ResultadoBusca[];
}

export const ESTADOS: Record<string, string> = { 'São Paulo': 'SP', 'Rio de Janeiro': 'RJ', 'Minas Gerais': 'MG' };
export const SUFIXO_HOMOLOG = /\s+homolog\.?$/i;

export function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
}

export function host(url: string): string {
  try { return new URL(url).host; } catch { return url; }
}

export function semVariacao(url: string): string {
  try {
    const u = new URL(url);
    return `${u.hostname.replace(/^(www\.)?pm/, '')}${u.pathname.replace(/\/+$/, '')}${u.search}`.toLowerCase();
  } catch {
    return url;
  }
}

export function slug(texto: string): string {
  return normalizar(texto).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Id do cliente na tela Clientes (#clientes/lorena-sp) e no nome do brasão.
export const idCliente = (cliente: string, uf: string) => `${slug(cliente)}-${uf.toLowerCase()}`;

export const temAcento = (texto: string) => /[^\x00-\x7F]/.test(texto);

// Agrupa ignorando acentos e o sufixo "Homolog."; exibe a grafia acentuada quando houver.
export function agruparPorCliente(itens: ResultadoBusca[]): GrupoBusca[] {
  const grupos = new Map<string, GrupoBusca>();
  for (const r of itens) {
    const porSistema = !(r.local in ESTADOS);
    const nome = porSistema ? r.nomeSistema : r.cliente.replace(SUFIXO_HOMOLOG, '');
    const chave = porSistema ? `${normalizar(nome)}|${r.local}` : normalizar(nome);
    let grupo = grupos.get(chave);
    if (!grupo) grupos.set(chave, grupo = porSistema
      ? { cliente: nome, estado: r.local, porSistema, itens: [] }
      : { cliente: nome, estado: ESTADOS[r.local], itens: [] });
    if (temAcento(nome) && !temAcento(grupo.cliente)) grupo.cliente = nome;
    grupo.itens.push(r);
  }
  return [...grupos.values()];
}

// Texto já normalizado de cada item (com nome da tela, título e apelidos): a busca roda a cada tecla.
export function indexar(telas: Tela[]): { r: ResultadoBusca; texto: string }[] {
  return telas.flatMap(tela =>
    tela.dados.grupos.flatMap(grupo =>
      grupo.itens
        .filter(item => item.url && !item.inativo)
        .map(item => {
          const sistema = tela.dados.sistema;
          const r: ResultadoBusca = {
            sistema,
            nomeSistema: sistema.replace(SUFIXO_HOMOLOG, ''),
            local: grupo.nome,
            cliente: item.cliente,
            url: item.url,
            host: host(item.url),
            homolog: SUFIXO_HOMOLOG.test(sistema) || SUFIXO_HOMOLOG.test(item.cliente)
          };
          return { r, texto: normalizar(`${tela.nome} ${tela.dados.titulo} ${tela.apelidos ?? ''} ${sistema} ${grupo.nome} ${item.cliente} ${item.url}`) };
        })
    )
  );
}

// Todos os termos precisam aparecer, sem acento e em qualquer ordem.
export function filtrarPorTermo(indice: ResultadoBusca[], textos: string[], termo: string): ResultadoBusca[] {
  const termos = normalizar(termo).split(/\s+/).filter(Boolean);
  if (!termos.length) return [];
  return indice.filter((_, i) => termos.every(t => textos[i].includes(t)));
}

// Termo que é número de versão (2.2.240): a busca lista quem está nela.
export const ehVersao = (termo: string) => /^\d+(\.\d+)+$/.test(termo.replace(/\.$/, ''));

// "2.2.240" pega 2.2.240 e 2.2.240.7, mas não 2.2.2401.
export function casaVersao(versao: string | null | false | undefined, termo: string): boolean {
  const alvo = termo.replace(/\.$/, '');
  return !!versao && (versao === alvo || versao.startsWith(`${alvo}.`));
}
