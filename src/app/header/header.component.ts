import { Component, Output, EventEmitter, HostListener, ElementRef, ViewChild, OnInit, PLATFORM_ID, inject, ChangeDetectionStrategy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ULTIMA_VERSAO } from '../notas-versao/notas-versao.component';
import { AREAS, Area, ItemMenu, MENU, Tela, naArea, telaPorId } from '../sistemas';

const CHAVE_AREA = 'areaMenu';

@Component({
    selector: 'app-header',
    imports: [],
    templateUrl: './header.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./header.component.scss']
})

export class HeaderComponent implements OnInit {
  @Output() componentSelected = new EventEmitter<string>();
  @Output() verNotasVersao = new EventEmitter<void>();
  @Output() pesquisar = new EventEmitter<string>();
  @Output() focarResultados = new EventEmitter<void>();
  @ViewChild('buscaInput') buscaInput?: ElementRef<HTMLInputElement>;
  selectedComponent = '';
  openSubmenu: string | null = null;
  menuOpen = false; // controla o drawer no mobile
  private timerBusca?: ReturnType<typeof setTimeout>;
  promptInstalacao: (Event & { prompt: () => Promise<void> }) | null = null;
  private telaAnterior: { tela: string; grupo: string | null } | null = null;

  versaoAtual = ULTIMA_VERSAO?.versao ?? '';

  private platformId = inject(PLATFORM_ID);
  readonly menu = MENU;
  readonly areas = AREAS;
  area: Area | '' = '';

  constructor(private elementRef: ElementRef) {}

  ngOnInit() {
    // Fora do ciclo atual: abrir a tela altera o AppComponent.
    if (!isPlatformBrowser(this.platformId)) return;
    try { this.area = (localStorage.getItem(CHAVE_AREA) ?? '') as Area | ''; } catch {}
    setTimeout(() => this.abrirTelaDaUrl());
  }

  mudarArea(area: Area | '') {
    this.area = area;
    try { localStorage.setItem(CHAVE_AREA, area); } catch {}
  }

  visivel(tela: Tela): boolean {
    return naArea(tela, this.area);
  }

  grupoVisivel(item: ItemMenu): boolean {
    return !!item.telas?.some(t => this.visivel(t));
  }

  // Tela na URL (#egov): F5 mantém a tela e o link pode ser compartilhado.
  @HostListener('window:hashchange')
  abrirTelaDaUrl() {
    const tela = decodeURIComponent(location.hash.slice(1));
    if (tela === this.selectedComponent) return;
    if (!tela) {
      this.selectedComponent = '';
      this.openSubmenu = null;
      this.componentSelected.emit('');
      return;
    }
    const t = telaPorId(tela);
    if (!t && tela !== 'clientes') return;
    // Tela fora da área filtrada: volta para todas as áreas.
    if (t && !this.visivel(t)) this.mudarArea('');
    this.selectComponent(tela, MENU.find(m => t && m.telas?.includes(t))?.grupo ?? null);
  }

  abrirNotasVersao(event: Event) {
    event.stopPropagation();
    this.verNotasVersao.emit();
  }

  buscarAoDigitar(termo: string) {
    clearTimeout(this.timerBusca);
    this.timerBusca = setTimeout(() => this.buscar(termo), 250);
  }

  // Enter ou seta para baixo: busca na hora e passa o foco para o primeiro resultado.
  irParaResultados(termo: string) {
    if (!termo.trim()) return;
    this.buscar(termo);
    this.focarResultados.emit();
  }

  limparBusca() {
    if (this.buscaInput) this.buscaInput.nativeElement.value = '';
    this.buscar('');
  }

  buscar(termo: string) {
    clearTimeout(this.timerBusca);
    if (termo.trim()) {
      if (this.selectedComponent) this.telaAnterior = { tela: this.selectedComponent, grupo: this.openSubmenu };
      history.replaceState(null, '', location.pathname + location.search);
      this.selectedComponent = '';
      this.openSubmenu = null;
    } else if (this.telaAnterior) {
      const { tela, grupo } = this.telaAnterior;
      this.selectComponent(tela, grupo);
      return;
    }
    this.pesquisar.emit(termo);
  }

  selectComponent(componentName: string, group: string | null = null) {
    clearTimeout(this.timerBusca);
    if (this.buscaInput) this.buscaInput.nativeElement.value = '';
    this.telaAnterior = null;
    this.selectedComponent = componentName; // Define o componente selecionado
    if (location.hash.slice(1) !== componentName) location.hash = componentName;
    this.componentSelected.emit(componentName);
    this.openSubmenu = group;
    this.menuOpen = false; // fecha o drawer ao escolher uma opção (mobile)
  }

  toggleSubmenu(name: string, event: Event) {
    event.stopPropagation();
    this.openSubmenu = this.openSubmenu === name ? null : name;
  }

  toggleMenu(event: Event) {
    event.stopPropagation();
    this.menuOpen = !this.menuOpen;
  }

  closeMenu() {
    this.menuOpen = false;
  }

  // Chrome/Edge disparam este evento quando o site pode ser instalado como app.
  @HostListener('window:beforeinstallprompt', ['$event'])
  aoPoderInstalar(event: Event) {
    event.preventDefault();
    this.promptInstalacao = event as Event & { prompt: () => Promise<void> };
  }

  instalarApp() {
    this.promptInstalacao?.prompt();
    this.promptInstalacao = null;
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    const digitando = (event.target as Element).closest?.('input, textarea, select');
    const atalho = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k';
    if (atalho || (event.key === '/' && !digitando)) {
      event.preventDefault();
      this.buscaInput?.nativeElement.focus();
      this.buscaInput?.nativeElement.select();
    }
  }

  // Itens do menu são <li>: Enter e Espaço acionam como botão.
  @HostListener('keydown', ['$event'])
  acionarPeloTeclado(event: KeyboardEvent) {
    const item = event.target as HTMLElement;
    if ((event.key === 'Enter' || event.key === ' ') && item.getAttribute('role') === 'button') {
      event.preventDefault();
      item.click();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.openSubmenu = null;
    }
  }
}
