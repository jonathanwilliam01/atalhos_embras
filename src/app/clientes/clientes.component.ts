import { Component, ChangeDetectionStrategy, HostListener, Input, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { NgTemplateOutlet, isPlatformBrowser } from '@angular/common';
import { SearchService, GrupoBusca, idCliente, normalizar } from '../search/search.service';
import { VersoesComponent } from '../versoes/versoes.component';
import { VersoesClientesService } from '../versoes/versoes-clientes.service';
import { FavoritosService } from '../favoritos/favoritos.service';
import fichas from './clientes.json';

// Gerado por scripts/fichas-clientes.mjs a partir do site de cada prefeitura.
interface Ficha {
  site?: string;
  endereco?: string;
  telefone?: string;
}

const FICHAS: Record<string, Ficha> = fichas;
const CHAVE_MEUS = 'clientesFavoritos';

interface Cliente extends GrupoBusca {
  // Usado no hash (#clientes/lorena-sp) e no nome do brasão.
  id: string;
  iniciais: string;
}

// Tela Clientes (cartões com painel de links) e tela Versões (tabela).
@Component({
    selector: 'app-clientes',
    imports: [VersoesComponent, NgTemplateOutlet],
    templateUrl: './clientes.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './clientes.component.scss'
})
export class ClientesComponent implements OnInit {
  @Input() modo: 'clientes' | 'versoes' = 'clientes';
  private todos: Cliente[];
  clientes: Cliente[];
  // Meus clientes (estrela) ficam numa seção no topo da grade.
  meus = new Set<string>();
  meusClientes: Cliente[] = [];
  demais: Cliente[] = [];
  filtro = '';
  soPendencias = false;
  aberto: Cliente | null = null;
  // Cliente sem brasão em assets/brasoes: mostra as iniciais.
  semBrasao = new Set<string>();
  linkCopiado: string | null = null;
  readonly versoes = inject(VersoesClientesService);
  readonly favoritos = inject(FavoritosService);
  private platformId = inject(PLATFORM_ID);

  constructor(searchService: SearchService) {
    this.todos = this.clientes = searchService.clientes().map(c => ({
      ...c,
      id: idCliente(c.cliente, c.estado),
      iniciais: c.cliente.split(/\s+/).filter(p => /^\p{Lu}/u.test(p)).slice(0, 2).map(p => p[0]).join('')
    }));
    this.separar();
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try { this.meus = new Set(JSON.parse(localStorage.getItem(CHAVE_MEUS) ?? '[]')); } catch {}
    this.separar();
    this.versoes.carregar();
    this.abrirDoHash();
  }

  @HostListener('window:hashchange')
  abrirDoHash(): void {
    const [tela, id] = decodeURIComponent(location.hash.slice(1)).split('/');
    this.aberto = tela === 'clientes' && id ? this.todos.find(c => c.id === id) ?? null : null;
  }

  filtrar(termo: string): void {
    this.filtro = termo;
    const alvo = normalizar(termo);
    this.clientes = this.todos.filter(c => normalizar(`${c.cliente} ${c.estado} ${c.itens[0]?.local ?? ''}`).includes(alvo));
    this.separar();
  }

  alternarMeu(c: Cliente, event: Event): void {
    event.stopPropagation();
    if (!this.meus.delete(c.id)) this.meus.add(c.id);
    try { localStorage.setItem(CHAVE_MEUS, JSON.stringify([...this.meus])); } catch {}
    this.separar();
  }

  private separar(): void {
    this.meusClientes = this.clientes.filter(c => this.meus.has(c.id));
    this.demais = this.clientes.filter(c => !this.meus.has(c.id));
  }

  ficha(c: Cliente): Ficha | undefined {
    return FICHAS[c.id];
  }

  telefoneLink(telefone: string): string {
    return 'tel:' + telefone.split('/')[0].replace(/\D/g, '');
  }

  mapaLink(endereco: string): string {
    return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(endereco);
  }

  // replaceState: abrir e fechar o painel não enchem o histórico.
  abrir(c: Cliente): void {
    this.aberto = c;
    history.replaceState(null, '', `#clientes/${c.id}`);
  }

  fechar(): void {
    this.aberto = null;
    history.replaceState(null, '', '#clientes');
  }

  // Painel aberto: Esc fecha, setas laterais passam para o cliente ao lado.
  @HostListener('document:keydown', ['$event'])
  navegar(event: KeyboardEvent): void {
    if (!this.aberto || this.modo !== 'clientes') return;
    if (event.key === 'Escape') return this.fechar();
    if ((event.target as Element).closest?.('input, textarea, select')) return;
    const passo = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    const ordem = [...this.meusClientes, ...this.demais];
    const proximo = ordem[ordem.indexOf(this.aberto) + passo];
    if (passo && proximo) this.abrir(proximo);
  }

  // Links desatualizados ou que não responderam.
  pendencias(c: Cliente): number {
    return c.itens.filter(l => {
      const info = this.versoes.info(l.url);
      return info.versao === false || info.desatualizada;
    }).length;
  }

  copiarLink(url: string, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    navigator.clipboard.writeText(url).then(() => {
      this.linkCopiado = url;
      setTimeout(() => { if (this.linkCopiado === url) this.linkCopiado = null; }, 2000);
    });
  }
}
