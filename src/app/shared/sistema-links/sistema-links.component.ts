import { ChangeDetectorRef, Component, ElementRef, HostListener, Input, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FavoritosService } from '../../favoritos/favoritos.service';

// Espaço dos botões: só a estrela (favorito fixo) e estrela + copiar (hover).
const RESERVA_FIXA = 36;
const RESERVA_HOVER = 60;
const cacheVersoes = new Map<string, Record<string, string | null>>();

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
export class SistemaLinksComponent implements OnInit {
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
  // Sistema com scrap de versão no /api/versao (egov, issonline).
  @Input() versaoSistema?: string;

  favoritos = inject(FavoritosService);
  linkCopiado: string | null = null;
  versoes: Record<string, string | null> = {};
  // aperta: versão some no hover; sem-espaco: só no tooltip.
  espaco = new Map<string, 'aperta' | 'sem-espaco'>();
  private platformId = inject(PLATFORM_ID);
  private el = inject(ElementRef<HTMLElement>);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    const sistema = this.versaoSistema;
    if (!sistema || !isPlatformBrowser(this.platformId)) return;

    const cache = cacheVersoes.get(sistema);
    if (cache) {
      setTimeout(() => this.aplicarVersoes(cache));
      return;
    }
    fetch(`/api/versao?sistema=${sistema}`)
      .then(r => r.json())
      .then(v => {
        cacheVersoes.set(sistema, v);
        this.aplicarVersoes(v);
      })
      .catch(() => {});
  }

  versao(item: ItemLink): string | null {
    return this.versoes[item.url] ?? null;
  }

  private aplicarVersoes(versoes: Record<string, string | null>): void {
    this.versoes = versoes;
    this.ajustarVersoes();
  }

  // Nome + versão que não cabem na linha: versão vai para o tooltip.
  @HostListener('window:resize')
  ajustarVersoes(): void {
    if (!Object.keys(this.versoes).length) return;
    this.espaco.clear();
    this.cdr.detectChanges();
    this.el.nativeElement.querySelectorAll('.li a').forEach((a: HTMLAnchorElement) => {
      const folga = a.parentElement!.clientWidth - a.offsetLeft - a.scrollWidth;
      if (folga < RESERVA_FIXA) this.espaco.set(a.getAttribute('href')!, 'sem-espaco');
      else if (folga < RESERVA_HOVER) this.espaco.set(a.getAttribute('href')!, 'aperta');
    });
    this.cdr.detectChanges();
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
