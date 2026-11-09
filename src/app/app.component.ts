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
import { copiarVersao } from './shared/copiar-versao';
import { EpocaComponent } from './epoca/epoca.component';

const CHAVE_NOTAS = 'notasVersaoVistas';
const EMAIL_CONTATO = 'jonathan.willian@embras.net';
const LINK_SUGESTAO = 'https://github.com/jonathanwilliam01/atalhos_embras/issues/new';
const LINK_APP = 'https://atalhos-embras.vercel.app';
const TEXTO_CONVITE = 'Conhece o Atalhos Embras? Reúne os links dos sistemas de todos os clientes em um só lugar, com busca, favoritos e versões. Acesse:';
const DIAS_EXIBINDO_NOTAS = 7;
// Termo que é número de versão (2.2.240): a busca lista quem está nela.
const VERSAO = /^\d+(\.\d+)+$/;

@Component({
    selector: 'app-root',
    imports: [CommonModule, HeaderComponent, SistemaLinksComponent, NotasVersaoComponent, SugestaoComponent, ClientesComponent, EpocaComponent],
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
  readonly copiarVersao = copiarVersao;

  termoBusca = '';
  resultadosBusca: GrupoBusca[] | null = null;
  totalResultados = 0;
  buscaPorVersao = false;
  linkCopiado: string | null = null;
  exportarCopiado = false;
  conviteCopiado = false;

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
    const porVersao = this.buscarVersao(query);
    this.resultadosBusca = this.favoritos.ordenarPorUso(porVersao.length ? porVersao : this.searchService.buscar(query));
    this.totalResultados = this.resultadosBusca.reduce((n, g) => n + g.itens.length, 0);
    this.currentComponent = 'busca';
  }

  // "2.2.240" pega 2.2.240 e 2.2.240.7, mas não 2.2.2401.
  private buscarVersao(termo: string) {
    const alvo = termo.replace(/\.$/, '');
    this.buscaPorVersao = VERSAO.test(alvo);
    if (!this.buscaPorVersao) return [];
    return this.searchService.filtrar(r => {
      const v = this.versoes.info(r.url).versao;
      return !!v && (v === alvo || v.startsWith(`${alvo}.`));
    });
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

  // Enter na busca com um único link de produção abre direto; senão foca o primeiro resultado.
  irParaResultados(abrir: boolean) {
    const itens = this.resultadosBusca?.flatMap(g => g.itens) ?? [];
    const producao = itens.filter(r => !r.homolog);
    if (!abrir || producao.length !== 1) return this.focarResultado(0);
    const indice = itens.indexOf(producao[0]);
    // click() no próprio link: abre em nova aba e entra nos Recentes como um clique normal.
    setTimeout(() => {
      const link = document.querySelectorAll<HTMLElement>('.busca-item')[indice];
      link?.focus();
      link?.click();
    });
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
    this.importar();
    this.favoritos.carregar();
    // Busca por versão aberta enquanto as versões chegam: refaz o resultado.
    this.versoes.atualizou.subscribe(() => {
      if (this.currentComponent === 'busca' && this.buscaPorVersao) this.buscar(this.termoBusca);
    });
    this.versoes.carregarPara([...this.favoritos.favoritos, ...this.favoritos.recentes].map(r => r.url));
    // App instalado: quando o service worker baixa uma versão nova, recarrega para usá-la.
    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates.subscribe(e => { if (e.type === 'VERSION_READY') document.location.reload(); });
    }
    if (this.deveExibirNotas()) this.notasVersaoVisivel = true;
  }

  // ?importar={favoritos, recentes, clientes, anotacoes, tema}: vem do Atalhos Tributário ou do link copiado em outro navegador.
  private importar() {
    const dados = new URLSearchParams(location.search).get('importar');
    if (!dados) return;
    try {
      const { favoritos, recentes, clientes, anotacoes, tema } = JSON.parse(dados);
      const lista = (v: unknown) => Array.isArray(v) ? v : [];
      this.favoritos.importar(lista(favoritos), lista(recentes), lista(clientes), anotacoes, tema);
    } catch {}
    history.replaceState(null, '', location.pathname + location.hash);
  }

  copiarLinkExportar() {
    navigator.clipboard.writeText(this.favoritos.linkExportar()).then(() => {
      this.exportarCopiado = true;
      setTimeout(() => this.exportarCopiado = false, 2000);
    });
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

  // Celular: menu de compartilhar do sistema. Sem ele: copia o convite.
  compartilhar() {
    if (navigator.share) {
      navigator.share({ title: 'Atalhos Embras', text: TEXTO_CONVITE, url: LINK_APP }).catch(() => {});
      return;
    }
    navigator.clipboard.writeText(`${TEXTO_CONVITE} ${LINK_APP}`).then(() => {
      this.conviteCopiado = true;
      setTimeout(() => this.conviteCopiado = false, 2000);
    });
  }

  copyEmail() {
    navigator.clipboard.writeText(this.email).then(() => {
      this.copied = true;
      setTimeout(() => this.copied = false, 2000);
    });
  }
}
