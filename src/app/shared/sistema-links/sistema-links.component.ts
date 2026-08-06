import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ItemLink {
  cliente: string;
  url: string;
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

const ITENS_POR_PAGINA = 11;

@Component({
  selector: 'app-sistema-links',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sistema-links.component.html',
  styleUrl: './sistema-links.component.scss'
})
export class SistemaLinksComponent {
  @Input() titulo = '';
  @Input() grupos: GrupoLinks[] = [];
  @Input() imagens: string[] = [];

  linkCopiado: string | null = null;

  private paginaAtual: Record<number, number> = {};

  totalPaginas(grupo: GrupoLinks): number {
    return Math.max(1, Math.ceil(grupo.itens.length / ITENS_POR_PAGINA));
  }

  paginasDoGrupo(grupo: GrupoLinks): number[] {
    return Array.from({ length: this.totalPaginas(grupo) }, (_, i) => i + 1);
  }

  paginaDoGrupo(grupoIndex: number): number {
    return this.paginaAtual[grupoIndex] ?? 1;
  }

  itensDaPagina(grupo: GrupoLinks, grupoIndex: number): ItemLink[] {
    const pagina = this.paginaDoGrupo(grupoIndex);
    return grupo.itens.slice((pagina - 1) * ITENS_POR_PAGINA, pagina * ITENS_POR_PAGINA);
  }

  fillerDaPagina(grupo: GrupoLinks, grupoIndex: number): number[] {
    if (this.totalPaginas(grupo) <= 1) return [];
    const restantes = ITENS_POR_PAGINA - this.itensDaPagina(grupo, grupoIndex).length;
    return Array.from({ length: Math.max(0, restantes) });
  }

  irParaPagina(grupoIndex: number, pagina: number): void {
    this.paginaAtual[grupoIndex] = pagina;
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
