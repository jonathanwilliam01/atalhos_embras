import { Component, HostListener, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { GoGlobalComponent } from './goglobal/goglobal.component';
import { HeaderComponent } from './header/header.component';
import { EgovComponent } from './egov/egov.component';
import { AtenComponent } from './aten/aten.component';
import { EgovDevComponent } from './egov-dev/egov-dev.component';
import { LinksComponent } from './links/links.component';
import { ConfigEgovComponent } from './config-egov/config-egov.component';
import { LoginNovoComponent } from './login-novo/login-novo.component';
import { InfraComponent } from './infra/infra.component';
import { SaibaMaisComponent } from './saiba-mais/saiba-mais.component';
import { SetupComponent } from './setup/setup.component';
import { PessoasComponent } from './pessoas/pessoas.component';
import { GccComponent } from './gcc/gcc.component';
import { SuprimentosComponent } from './suprimentos/suprimentos.component';
import { PortalTransparenciaComponent } from './portal-transparencia/portal-transparencia.component';
import { TransparenciaEgovComponent } from './transparencia-egov/transparencia-egov.component';
import { AdmWebComponent } from './adm-web/adm-web.component';
import { NovoTransparenciaComponent } from './novo-transparencia/novo-transparencia.component';
import { NotasVersaoComponent } from './notas-versao/notas-versao.component';
import notasVersaoData from './notas-versao/notas_versao.json';
import { SearchService, GrupoBusca, slug } from './search/search.service';
import { pageview } from '@vercel/analytics';
import { SwUpdate } from '@angular/service-worker';
import { FavoritosService } from './favoritos/favoritos.service';
import { ClientesComponent } from './clientes/clientes.component';


const CHAVE_NOTAS = 'notasVersaoVistas';
const DIAS_EXIBINDO_NOTAS = 7;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, GoGlobalComponent, HeaderComponent, EgovComponent,
    EgovDevComponent, LinksComponent, ConfigEgovComponent, LoginNovoComponent, InfraComponent, SaibaMaisComponent, SetupComponent, PessoasComponent,
    GccComponent, SuprimentosComponent, PortalTransparenciaComponent, TransparenciaEgovComponent, AdmWebComponent, NovoTransparenciaComponent, NotasVersaoComponent, ClientesComponent, AtenComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  currentComponent: string = '';
  copied = false;
  notasVersaoVisivel = false;
  ultimaVersao = [...notasVersaoData.versoes].sort((a, b) => b.versao.localeCompare(a.versao))[0];
  versaoAtual = this.ultimaVersao?.versao ?? '';
  private platformId = inject(PLATFORM_ID);
  favoritos = inject(FavoritosService);
  verTodosFavoritos = false;
  verTodosRecentes = false;
  private swUpdate = inject(SwUpdate);

  termoBusca = '';
  resultadosBusca: GrupoBusca[] | null = null;
  totalResultados = 0;
  linkCopiado: string | null = null;

  constructor(private searchService: SearchService) {}

  setComponent(componentName: string) {
    this.resultadosBusca = null;
    this.currentComponent = componentName;
    this.registrarVisita(`/tela/${componentName}`);
  }

  // Sem rotas, telas e links abertos viram páginas virtuais no Vercel Analytics.
  @HostListener('document:click', ['$event'])
  @HostListener('document:auxclick', ['$event'])
  registrarLinkAberto(event: MouseEvent) {
    const link = (event.target as HTMLElement).closest?.('a[href^="http"]');
    if (!link) return;
    const r = this.searchService.porUrl(link.getAttribute('href') ?? '');
    if (r) this.favoritos.registrarAberto(r.url);
    this.registrarVisita(r ? `/link/${slug(r.sistema)}/${slug(r.cliente)}` : `/link/externo/${new URL(link.getAttribute('href')!).host}`);
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
    // App instalado: quando o service worker baixa uma versão nova, recarrega para usá-la.
    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates.subscribe(e => { if (e.type === 'VERSION_READY') document.location.reload(); });
    }
    if (this.deveExibirNotas()) this.notasVersaoVisivel = true;
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
    navigator.clipboard.writeText('jonathan.willian@embras.net').then(() => {
      this.copied = true;
      setTimeout(() => this.copied = false, 2000);
    });
  }
}
