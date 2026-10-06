import { Component, Output, EventEmitter, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import notasVersaoData from '../notas-versao/notas_versao.json';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})

export class HeaderComponent {
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

  versaoAtual = [...notasVersaoData.versoes].sort((a, b) => b.versao.localeCompare(a.versao))[0]?.versao ?? '';

  constructor(private elementRef: ElementRef) {}

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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.openSubmenu = null;
    }
  }

  reloadPage() {
    window.location.reload();
  }
}
