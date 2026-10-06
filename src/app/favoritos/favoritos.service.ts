import { Injectable } from '@angular/core';
import { ResultadoBusca, SearchService } from '../search/search.service';

const CHAVE_FAVORITOS = 'linksFavoritos';
const CHAVE_RECENTES = 'linksRecentes';
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

// Guarda só as URLs; nome do sistema e do cliente vêm dos JSONs, então links removidos somem sozinhos.
// Recentes não repetem o que já está nos favoritos.
@Injectable({ providedIn: 'root' })
export class FavoritosService {
  favoritos: ResultadoBusca[] = [];
  recentes: ResultadoBusca[] = [];

  constructor(private searchService: SearchService) {}

  carregar(): void {
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
    this.carregar();
  }

  private resolver(urls: string[]): ResultadoBusca[] {
    return urls.map(u => this.searchService.porUrl(u)).filter((r): r is ResultadoBusca => !!r);
  }
}
