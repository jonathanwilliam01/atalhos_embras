import { ChangeDetectorRef, Component, DestroyRef, ElementRef, HostListener, Input, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FavoritosService } from '../../favoritos/favoritos.service';

// Espaço dos botões: só a estrela (favorito fixo) e estrela + copiar (hover).
const RESERVA_FIXA = 36;
const RESERVA_HOVER = 60;
const CHAVE_VERSOES = 'versoesClientes';
const cacheVersoes = new Map<string, Record<string, string | null>>();

// Última consulta de cada sistema, exibida enquanto a nova carrega.
function versoesSalvas(): Record<string, Record<string, string | null>> {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_VERSOES) ?? '{}') ?? {};
  } catch {
    return {};
  }
}

function salvarVersoes(sistema: string, versoes: Record<string, string | null>): void {
  try {
    localStorage.setItem(CHAVE_VERSOES, JSON.stringify({ ...versoesSalvas(), [sistema]: versoes }));
  } catch {}
}

const compararVersao = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true });

// Versão mais comum entre os clientes; empate fica com a maior.
function versaoPredominante(versoes: (string | null)[]): string | null {
  const contagem = new Map<string, number>();
  for (const v of versoes) if (v) contagem.set(v, (contagem.get(v) ?? 0) + 1);
  let atual: string | null = null;
  for (const [v, n] of contagem) {
    const nAtual = atual ? contagem.get(atual)! : 0;
    if (n > nAtual || (n === nAtual && compararVersao(v, atual!) > 0)) atual = v;
  }
  return atual;
}

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
  // Sistema com scrap de versão no /api/versao.
  @Input() versaoSistema?: string;

  favoritos = inject(FavoritosService);
  linkCopiado: string | null = null;
  versoes: Record<string, string | null> = {};
  versaoAtual: string | null = null;
  carregandoVersoes = false;
  private destruido = false;
  // aperta: versão some no hover; quebra: versão vai para a linha de baixo.
  espaco = new Map<string, 'aperta' | 'quebra'>();
  private platformId = inject(PLATFORM_ID);
  private el = inject(ElementRef<HTMLElement>);
  private cdr = inject(ChangeDetectorRef);

  constructor() {
    inject(DestroyRef).onDestroy(() => this.destruido = true);
  }

  ngOnInit(): void {
    const sistema = this.versaoSistema;
    if (!sistema || !isPlatformBrowser(this.platformId)) return;

    const cache = cacheVersoes.get(sistema);
    if (cache) {
      setTimeout(() => this.aplicarVersoes(cache));
      return;
    }
    const salvas = versoesSalvas()[sistema];
    if (salvas) setTimeout(() => this.aplicarVersoes(salvas));

    this.carregandoVersoes = true;
    fetch(`/api/versao?sistema=${sistema}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(v => {
        cacheVersoes.set(sistema, v);
        salvarVersoes(sistema, v);
        if (!this.destruido) this.aplicarVersoes(v);
      })
      .catch(() => {})
      .finally(() => this.carregandoVersoes = false);
  }

  versao(item: ItemLink): string | null {
    return this.versoes[item.url] ?? null;
  }

  desatualizada(item: ItemLink): boolean {
    const v = this.versao(item);
    return !!v && !!this.versaoAtual && compararVersao(v, this.versaoAtual) < 0;
  }

  dicaVersao(item: ItemLink): string | null {
    const v = this.versao(item);
    if (!v) return null;
    return this.desatualizada(item) ? `Versão ${v} (abaixo da atual ${this.versaoAtual})` : `Versão ${v}`;
  }

  private aplicarVersoes(versoes: Record<string, string | null>): void {
    this.versoes = versoes;
    this.versaoAtual = versaoPredominante(Object.values(versoes));
    this.ajustarVersoes();
  }

  // Nome + versão que não cabem na linha: versão desce para baixo do nome.
  @HostListener('window:resize')
  ajustarVersoes(): void {
    if (!Object.keys(this.versoes).length) return;
    this.espaco.clear();
    this.cdr.detectChanges();
    this.el.nativeElement.querySelectorAll('.li a').forEach((a: HTMLAnchorElement) => {
      const folga = a.parentElement!.clientWidth - a.offsetLeft - a.scrollWidth;
      if (folga < RESERVA_FIXA) this.espaco.set(a.getAttribute('href')!, 'quebra');
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
