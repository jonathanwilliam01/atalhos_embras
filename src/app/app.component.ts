import { Component, HostListener, OnInit, PLATFORM_ID, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HeaderComponent } from './header/header.component';
import { SistemaLinksComponent } from './shared/sistema-links/sistema-links.component';
import { Tela, telaPorId } from './sistemas';
import { NotasVersaoComponent } from './notas-versao/notas-versao.component';
import { ULTIMA_VERSAO } from './notas-versao/notas-versao.component';
import { SearchService, GrupoBusca, host, idCliente, slug } from './search/search.service';
import { pageview } from '@vercel/analytics';
import { SwUpdate } from '@angular/service-worker';
import { FavoritosService } from './favoritos/favoritos.service';
import { ClientesComponent } from './clientes/clientes.component';
import { SugestaoComponent } from './sugestao/sugestao.component';
import { VersoesClientesService } from './versoes/versoes-clientes.service';

const CHAVE_NOTAS = 'notasVersaoVistas';
const EMAIL_CONTATO = 'jonathan.willian@embras.net';
const LINK_SUGESTAO = 'https://github.com/jonathanwilliam01/atalhos_embras/issues/new';
const DIAS_EXIBINDO_NOTAS = 7;

@Component({
    selector: 'app-root',
    imports: [CommonModule, HeaderComponent, SistemaLinksComponent, NotasVersaoComponent, SugestaoComponent, ClientesComponent],
    templateUrl: './app.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  currentComponent: string = '';
  copied = false;
  readonly email = EMAIL_CONTATO;
  readonly linkSugestao = LINK_SUGESTAO;
  sugestaoVisivel = false;
  notasVersaoVisivel = false;
  ultimaVersao = ULTIMA_VERSAO;
  versaoAtual = this.ultimaVersao?.versao ?? '';
  private platformId = inject(PLATFORM_ID);
  favoritos = inject(FavoritosService);
  verTodosFavoritos = false;
  verTodosRecentes = false;
  private swUpdate = inject(SwUpdate);
  readonly versoes = inject(VersoesClientesService);

  termoBusca = '';
  resultadosBusca: GrupoBusca[] | null = null;
  totalResultados = 0;
  linkCopiado: string | null = null;

  constructor(private searchService: SearchService) {}

  get tela(): Tela | undefined {
    return telaPorId(this.currentComponent);
  }

  setComponent(componentName: string) {
    this.resultadosBusca = null;
    this.currentComponent = componentName;
    if (componentName) this.registrarVisita(`/tela/${componentName}`);
  }

  // Sem rotas, telas e links abertos viram páginas virtuais no Vercel Analytics.
  @HostListener('document:click', ['$event'])
  @HostListener('document:auxclick', ['$event'])
  registrarLinkAberto(event: MouseEvent) {
    // auxclick também dispara no botão direito; só o do meio abre o link.
    if (event.type === 'auxclick' && event.button !== 1) return;
    const link = (event.target as HTMLElement).closest?.('a[href^="http"]');
    if (!link) return;
    const href = link.getAttribute('href') ?? '';
    const r = this.searchService.porUrl(href);
    if (r) this.favoritos.registrarAberto(r.url);
    this.registrarVisita(r ? `/link/${slug(r.sistema)}/${slug(r.cliente)}` : `/link/externo/${host(href)}`);
  }

  private registrarVisita(caminho: string) {
    if (isPlatformBrowser(this.platformId)) pageview({ route: caminho, path: caminho });
  }

  buscar(termo: string) {
    const query = termo.trim();
    if (!query) {
      this.resultadosBusca = null;
      this.currentComponent = '';
      return;
    }
    this.termoBusca = query;
    // Mesmas versões da tela Clientes: carrega uma vez e serve às duas.
    if (isPlatformBrowser(this.platformId)) this.versoes.carregar();
    this.resultadosBusca = this.searchService.buscar(query);
    this.totalResultados = this.resultadosBusca.reduce((n, g) => n + g.itens.length, 0);
    this.currentComponent = 'busca';
  }

  copiarLink(url: string, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    navigator.clipboard.writeText(url).then(() => {
      this.linkCopiado = url;
      setTimeout(() => this.linkCopiado = null, 2000);
    });
  }

  // Grupo de cliente na busca leva ao painel dele na tela Clientes.
  linkCliente(g: GrupoBusca): string | null {
    return g.porSistema ? null : `#clientes/${idCliente(g.cliente, g.estado)}`;
  }

  focarResultado(indice: number) {
    setTimeout(() => document.querySelectorAll<HTMLElement>('.busca-item')[indice]?.focus());
  }

  // Setas percorrem os resultados da busca; Enter abre o link em foco. Acima do primeiro volta para a busca.
  @HostListener('document:keydown', ['$event'])
  navegarResultados(event: KeyboardEvent) {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    const itens = [...document.querySelectorAll<HTMLElement>('.busca-item')];
    const atual = itens.indexOf(document.activeElement as HTMLElement);
    if (atual < 0) return;
    event.preventDefault();
    const proximo = atual + (event.key === 'ArrowDown' ? 1 : -1);
    if (proximo < 0) document.querySelector<HTMLInputElement>('.busca-input')?.focus();
    else itens[Math.min(proximo, itens.length - 1)].focus();
  }

  abrirNotasVersao() {
    this.notasVersaoVisivel = true;
  }

  fecharNotasVersao() {
    this.notasVersaoVisivel = false;
    try {
      localStorage.setItem(CHAVE_NOTAS, JSON.stringify({ versao: this.versaoAtual, dia: new Date().toDateString() }));
    } catch {}
  }

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.favoritos.carregar();
    this.importarDoTributario();
    // App instalado: quando o service worker baixa uma versão nova, recarrega para usá-la.
    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates.subscribe(e => { if (e.type === 'VERSION_READY') document.location.reload(); });
    }
    if (this.deveExibirNotas()) this.notasVersaoVisivel = true;
  }

  // O Atalhos Tributário redireciona para cá com ?importar={favoritos, recentes}.
  private importarDoTributario() {
    const dados = new URLSearchParams(location.search).get('importar');
    if (!dados) return;
    try {
      const { favoritos = [], recentes = [] } = JSON.parse(dados);
      this.favoritos.importar(favoritos, recentes);
    } catch {}
    history.replaceState(null, '', location.pathname + location.hash);
  }

  // Versão nova abre sempre; depois, no máximo uma vez por dia enquanto a versão for recente.
  private deveExibirNotas(): boolean {
    try {
      const visto = JSON.parse(localStorage.getItem(CHAVE_NOTAS) ?? 'null');
      if (visto?.versao !== this.versaoAtual) return true;
      if (visto.dia === new Date().toDateString()) return false;
      const [dia, mes, ano] = (this.ultimaVersao?.data ?? '').split('/').map(Number);
      const diasDesdeVersao = (Date.now() - new Date(ano, mes - 1, dia).getTime()) / 86400000;
      return diasDesdeVersao <= DIAS_EXIBINDO_NOTAS;
    } catch {
      return false;
    }
  }

  copyEmail() {
    navigator.clipboard.writeText(this.email).then(() => {
      this.copied = true;
      setTimeout(() => this.copied = false, 2000);
    });
  }
}
