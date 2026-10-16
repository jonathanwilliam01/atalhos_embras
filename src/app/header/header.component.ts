import { Component, Output, EventEmitter, HostListener, ElementRef, ViewChild, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import notasVersaoData from '../notas-versao/notas_versao.json';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})

export class HeaderComponent implements OnInit {
  @Output() componentSelected = new EventEmitter<string>();
  @Output() verNotasVersao = new EventEmitter<void>();
  @Output() pesquisar = new EventEmitter<string>();
  @ViewChild('buscaInput') buscaInput?: ElementRef<HTMLInputElement>;
  selectedComponent = '';
  openSubmenu: string | null = null;
  menuOpen = false; // controla o drawer no mobile
  private timerBusca?: ReturnType<typeof setTimeout>;
  promptInstalacao: (Event & { prompt: () => Promise<void> }) | null = null;
  private telaAnterior: { tela: string; grupo: string | null } | null = null;

  versaoAtual = [...notasVersaoData.versoes].sort((a, b) => b.versao.localeCompare(a.versao, undefined, { numeric: true }))[0]?.versao ?? '';

  private platformId = inject(PLATFORM_ID);

  constructor(private elementRef: ElementRef) {}

  ngOnInit() {
    // Fora do ciclo atual: abrir a tela altera o AppComponent.
    if (isPlatformBrowser(this.platformId)) setTimeout(() => this.abrirTelaDaUrl());
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
    this.elementRef.nativeElement.querySelector(`[data-tela="${CSS.escape(tela)}"]`)?.click();
  }

  abrirNotasVersao(event: Event) {
    event.stopPropagation();
    this.verNotasVersao.emit();
  }

  buscarAoDigitar(termo: string) {
    clearTimeout(this.timerBusca);
    this.timerBusca = setTimeout(() => this.buscar(termo), 250);
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
    const digitando = (event.target as HTMLElement).closest('input, textarea');
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
