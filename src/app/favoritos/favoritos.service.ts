import { Injectable } from '@angular/core';
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
    this.favoritos = this.resolver(ler(CHAVE_FAVORITOS));
    this.recentes = this.resolver(ler(CHAVE_RECENTES)).filter(r => !this.isFavorito(r.url)).slice(0, MAX_RECENTES);
  }

  isFavorito(url: string): boolean {
    return this.favoritos.some(f => f.url === url);
  }

  alternar(url: string, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    const urls = this.favoritos.map(f => f.url);
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
  importar(favoritos: unknown[], recentes: unknown[], clientes: unknown[] = []): void {
    const unir = (atuais: string[], novos: unknown[]) => [...new Set([...atuais, ...novos.filter((u): u is string => typeof u === 'string')])];
    gravar(CHAVE_FAVORITOS, unir(ler(CHAVE_FAVORITOS), favoritos));
    gravar(CHAVE_RECENTES, unir(ler(CHAVE_RECENTES), recentes).slice(0, MAX_HISTORICO));
    gravar(CHAVE_CLIENTES, unir(ler(CHAVE_CLIENTES), clientes));
    this.carregar();
  }

  // Link que leva favoritos, recentes e meus clientes para outro navegador.
  linkExportar(): string {
    const dados = { favoritos: ler(CHAVE_FAVORITOS), recentes: ler(CHAVE_RECENTES), clientes: ler(CHAVE_CLIENTES) };
    return `${location.origin}${location.pathname}?importar=${encodeURIComponent(JSON.stringify(dados))}`;
  }

  private resolver(urls: string[]): ResultadoBusca[] {
    return urls.map(u => this.searchService.porUrl(u)).filter((r): r is ResultadoBusca => !!r);
  }
}
