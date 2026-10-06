import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FavoritosService } from '../../favoritos/favoritos.service';

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
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sistema-links.component.html',
  styleUrl: './sistema-links.component.scss'
})
export class SistemaLinksComponent {
  @Input() titulo = '';
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

  favoritos = inject(FavoritosService);
  linkCopiado: string | null = null;

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
