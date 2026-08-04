import { Component, Output, EventEmitter, HostListener, ElementRef } from '@angular/core';
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
  selectedComponent: string = ''; // Adicione esta propriedade
  openSubmenu: string | null = null;
  menuOpen = false; // controla o drawer no mobile

  versaoAtual = [...notasVersaoData.versoes].sort((a, b) => b.versao.localeCompare(a.versao))[0]?.versao ?? '';

  constructor(private elementRef: ElementRef) {}

  abrirNotasVersao(event: Event) {
    event.stopPropagation();
    this.verNotasVersao.emit();
  }

  selectComponent(componentName: string, group: string | null = null) {
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
