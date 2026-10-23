import { Injectable } from '@angular/core';
import { DadosSistema } from '../shared/sistema-links/sistema-links.component';
import { TELAS } from '../sistemas';

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

const SISTEMAS: DadosSistema[] = TELAS.map(t => t.dados);

export const ESTADOS: Record<string, string> = { 'São Paulo': 'SP', 'Rio de Janeiro': 'RJ', 'Minas Gerais': 'MG' };
export const SUFIXO_HOMOLOG = /\s+homolog\.?$/i;

export function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
}

export function host(url: string): string {
  try { return new URL(url).host; } catch { return url; }
}

export function slug(texto: string): string {
  return normalizar(texto).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Id do cliente na tela Clientes (#clientes/lorena-sp) e no nome do brasão.
export const idCliente = (cliente: string, uf: string) => `${slug(cliente)}-${uf.toLowerCase()}`;

export const temAcento = (texto: string) => /[^\x00-\x7F]/.test(texto);

// Agrupa ignorando acentos e o sufixo "Homolog."; exibe a grafia acentuada quando houver.
function agruparPorCliente(itens: ResultadoBusca[]): GrupoBusca[] {
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

@Injectable({ providedIn: 'root' })
export class SearchService {
  private indice: ResultadoBusca[] = SISTEMAS.flatMap(sistema =>
    sistema.grupos.flatMap(grupo =>
      grupo.itens
        .filter(item => item.url && !item.inativo)
        .map(item => ({
          sistema: sistema.sistema,
          nomeSistema: sistema.sistema.replace(SUFIXO_HOMOLOG, ''),
          local: grupo.nome,
          cliente: item.cliente,
          url: item.url,
          host: host(item.url),
          homolog: SUFIXO_HOMOLOG.test(sistema.sistema) || SUFIXO_HOMOLOG.test(item.cliente)
        }))
    )
  );
  // Texto já normalizado de cada item, na ordem do índice: a busca roda a cada tecla.
  private textos = this.indice.map(r => normalizar(`${r.sistema} ${r.local} ${r.cliente} ${r.url}`));

  buscar(termo: string): GrupoBusca[] {
    const termos = normalizar(termo).split(/\s+/).filter(Boolean);
    if (!termos.length) return [];

    return agruparPorCliente(this.indice.filter((_, i) => termos.every(t => this.textos[i].includes(t))));
  }

  porUrl(url: string): ResultadoBusca | undefined {
    return this.indice.find(r => r.url === url);
  }

  clientes(): GrupoBusca[] {
    return agruparPorCliente(this.indice.filter(r => r.local in ESTADOS))
      .sort((a, b) => a.cliente.localeCompare(b.cliente, 'pt-BR'));
  }
}
