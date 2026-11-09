import { Injectable } from '@angular/core';
import { CHAVE_TEMA, aplicarTema } from '../tema';
import { lerAnotacoes, mesclarAnotacoes } from '../clientes/anotacoes';
import { GrupoBusca, ResultadoBusca, SearchService } from '../search/search.service';

const CHAVE_FAVORITOS = 'linksFavoritos';
const CHAVE_RECENTES = 'linksRecentes';
// Quantas vezes cada link foi aberto: ordena a busca.
const CHAVE_USO = 'usoLinks';
// Meus clientes da tela Clientes (ids).
export const CHAVE_CLIENTES = 'clientesFavoritos';
const MAX_RECENTES = 8;
const MAX_HISTORICO = 20;

function ler(chave: string): string[] {
  try {
    const valor = JSON.parse(localStorage.getItem(chave) ?? '[]');
    return Array.isArray(valor) ? valor : [];
  } catch {
    return [];
  }
}

function gravar(chave: string, urls: string[]): void {
  try { localStorage.setItem(chave, JSON.stringify(urls)); } catch {}
}

// url -> "sistema|estado|cliente" dos favoritos e recentes.
const CHAVE_IDS = 'linksIdentidade';

function lerIds(): Record<string, string> {
  try {
    const valor = JSON.parse(localStorage.getItem(CHAVE_IDS) ?? '{}');
    return valor && typeof valor === 'object' && !Array.isArray(valor) ? valor : {};
  } catch {
    return {};
  }
}

function gravarIds(ids: Record<string, string>): void {
  try { localStorage.setItem(CHAVE_IDS, JSON.stringify(ids)); } catch {}
}

function lerUso(): Record<string, number> {
  try {
    const valor = JSON.parse(localStorage.getItem(CHAVE_USO) ?? '{}');
    return valor && typeof valor === 'object' && !Array.isArray(valor) ? valor : {};
  } catch {
    return {};
  }
}

// Guarda só as URLs; nome do sistema e do cliente vêm dos JSONs, então links removidos somem sozinhos.
// Recentes não repetem o que já está nos favoritos.
@Injectable({ providedIn: 'root' })
export class FavoritosService {
  favoritos: ResultadoBusca[] = [];
  recentes: ResultadoBusca[] = [];
  private uso: Record<string, number> = {};

  constructor(private searchService: SearchService) {}

  carregar(): void {
    this.uso = lerUso();
    const ids = lerIds();
    this.favoritos = this.resolver(CHAVE_FAVORITOS, ids);
    this.recentes = this.resolver(CHAVE_RECENTES, ids).filter(r => !this.isFavorito(r.url)).slice(0, MAX_RECENTES);
    // Guarda a identidade só dos links salvos, para achar o link de novo se a URL mudar.
    const urls = [...ler(CHAVE_FAVORITOS), ...ler(CHAVE_RECENTES)];
    const novos = Object.fromEntries(urls.filter(u => ids[u]).map(u => [u, ids[u]]));
    if (JSON.stringify(novos) !== JSON.stringify(lerIds())) gravarIds(novos);
  }

  isFavorito(url: string): boolean {
    return this.favoritos.some(f => f.url === url);
  }

  alternar(url: string, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    // Parte do que está salvo, não do que aparece: link fora dos JSONs (inativo, removido) não é apagado.
    const urls = ler(CHAVE_FAVORITOS);
    gravar(CHAVE_FAVORITOS, this.isFavorito(url) ? urls.filter(u => u !== url) : [...urls, url]);
    this.carregar();
  }

  registrarAberto(url: string): void {
    const urls = [url, ...ler(CHAVE_RECENTES).filter(u => u !== url)].slice(0, MAX_HISTORICO);
    gravar(CHAVE_RECENTES, urls);
    const uso = lerUso();
    uso[url] = (uso[url] ?? 0) + 1;
    try { localStorage.setItem(CHAVE_USO, JSON.stringify(uso)); } catch {}
    this.carregar();
  }

  // Clientes e links mais abertos primeiro; empate mantém a ordem da busca.
  ordenarPorUso(grupos: GrupoBusca[]): GrupoBusca[] {
    const uso = (url: string) => this.uso[url] ?? 0;
    const total = (g: GrupoBusca) => g.itens.reduce((n, r) => n + uso(r.url), 0);
    return grupos
      .map(g => ({ ...g, itens: [...g.itens].sort((a, b) => uso(b.url) - uso(a.url)) }))
      .sort((a, b) => total(b) - total(a));
  }

  // Junta o que veio no ?importar= (Atalhos Tributário ou link de outro navegador), sem repetir.
  importar(favoritos: unknown[], recentes: unknown[], clientes: unknown[] = [], anotacoes?: unknown, tema?: unknown): void {
    mesclarAnotacoes(anotacoes);
    if (typeof tema === 'string') aplicarTema(tema);
    const unir = (atuais: string[], novos: unknown[]) => [...new Set([...atuais, ...novos.filter((u): u is string => typeof u === 'string')])];
    gravar(CHAVE_FAVORITOS, unir(ler(CHAVE_FAVORITOS), favoritos));
    gravar(CHAVE_RECENTES, unir(ler(CHAVE_RECENTES), recentes).slice(0, MAX_HISTORICO));
    gravar(CHAVE_CLIENTES, unir(ler(CHAVE_CLIENTES), clientes));
    this.carregar();
  }

  // Link que leva favoritos, recentes, meus clientes, anotações e tema para outro navegador.
  linkExportar(): string {
    let tema: string | null = null;
    try { tema = localStorage.getItem(CHAVE_TEMA); } catch {}
    const dados = { favoritos: ler(CHAVE_FAVORITOS), recentes: ler(CHAVE_RECENTES), clientes: ler(CHAVE_CLIENTES), anotacoes: lerAnotacoes(), tema };
    return `${location.origin}${location.pathname}?importar=${encodeURIComponent(JSON.stringify(dados))}`;
  }

  // URL que mudou no JSON (correção de links) é trocada pela atual do mesmo sistema + estado + cliente.
  private resolver(chave: string, ids: Record<string, string>): ResultadoBusca[] {
    const busca = this.searchService;
    const urls = ler(chave);
    let mudou = false;
    const itens = urls.map((u, i) => {
      let r = busca.porUrl(u);
      if (!r) {
        r = (ids[u] && busca.porChave(ids[u])) || busca.porUrlParecida(u);
        if (r) { urls[i] = r.url; mudou = true; }
      }
      if (r) ids[r.url] = busca.chave(r);
      return r;
    });
    if (mudou) gravar(chave, [...new Set(urls)]);
    const vistos = new Set<string>();
    return itens.filter((r): r is ResultadoBusca => !!r && !vistos.has(r.url) && !!vistos.add(r.url));
  }
}
