import { Component, DestroyRef, Input, OnInit, PLATFORM_ID, inject, ChangeDetectionStrategy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FavoritosService } from '../../favoritos/favoritos.service';
import { copiarVersao } from '../copiar-versao';
import { Versoes, carregarVersoes, compararVersao, recarregarVersoes, versaoMaisRecente } from '../../versoes/versoes';

export interface ItemLink {
  cliente: string;
  url: string;
  inativo?: boolean;
}

export interface GrupoLinks {
  nome: string;
  itens: ItemLink[];
}

export interface DadosSistema {
  sistema: string;
  titulo: string;
  imagens: string[];
  grupos: GrupoLinks[];
}

@Component({
    selector: 'app-sistema-links',
    imports: [],
    templateUrl: './sistema-links.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './sistema-links.component.scss'
})
export class SistemaLinksComponent implements OnInit {
  @Input() titulo = '';
  @Input() sistema = '';
  readonly copiarVersao = copiarVersao;
  @Input() set grupos(valor: GrupoLinks[]) {
    this.gruposAtivos = valor.map(g => ({
      ...g,
      itens: g.itens.filter(i => !i.inativo).sort((a, b) => a.cliente.localeCompare(b.cliente, 'pt-BR'))
    }));
  }
  get grupos(): GrupoLinks[] {
    return this.gruposAtivos;
  }
  private gruposAtivos: GrupoLinks[] = [];
  @Input() imagens: string[] = [];
  // Sistema com scrap de versão no /api/versao.
  @Input() versaoSistema?: string;

  favoritos = inject(FavoritosService);
  linkCopiado: string | null = null;
  versoes: Versoes = {};
  versaoAtual: string | null = null;
  foraDoArTotal = 0;
  carregandoVersoes = false;
  private destruido = false;
  private platformId = inject(PLATFORM_ID);

  constructor() {
    inject(DestroyRef).onDestroy(() => this.destruido = true);
  }

  ngOnInit(): void {
    const sistema = this.versaoSistema;
    if (!sistema || !isPlatformBrowser(this.platformId)) return;

    const urls = this.grupos.flatMap(g => g.itens).filter(i => i.url).map(i => i.url);
    carregarVersoes(sistema, urls, this.aoReceberVersoes);
  }

  atualizarVisualizacao(): void {
    if (this.versaoSistema) recarregarVersoes(this.versaoSistema, this.versoes, this.aoReceberVersoes);
  }

  private aoReceberVersoes = (versoes: Versoes, carregando: boolean) => {
    if (this.destruido) return;
    this.carregandoVersoes = carregando;
    this.aplicarVersoes(versoes);
  };

  versao(item: ItemLink): string | null {
    return this.versoes[item.url] || null;
  }

  foraDoAr(item: ItemLink): boolean {
    return this.versoes[item.url] === false;
  }

  desatualizada(item: ItemLink): boolean {
    const v = this.versao(item);
    return !!v && !!this.versaoAtual && compararVersao(v, this.versaoAtual) < 0;
  }

  dicaVersao(item: ItemLink): string | null {
    const v = this.versao(item);
    if (!v) return null;
    return `${this.desatualizada(item) ? `Versão ${v} (abaixo da atual ${this.versaoAtual})` : `Versão ${v}`}. Clique na versão para copiar.`;
  }

  private aplicarVersoes(versoes: Versoes): void {
    this.versoes = versoes;
    this.versaoAtual = versaoMaisRecente(Object.values(versoes));
    this.foraDoArTotal = Object.values(versoes).filter(v => v === false).length;
  }

  imagemDoGrupo(index: number): string | null {
    return this.imagens.length ? this.imagens[index % this.imagens.length] : null;
  }

  copiarLink(url: string, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    navigator.clipboard.writeText(url).then(() => {
      this.linkCopiado = url;
      setTimeout(() => {
        if (this.linkCopiado === url) this.linkCopiado = null;
      }, 2000);
    });
  }
}
