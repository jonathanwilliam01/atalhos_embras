import { Component, Output, EventEmitter, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})

export class HeaderComponent {
  @Output() componentSelected = new EventEmitter<string>();
  selectedComponent: string = ''; // Adicione esta propriedade
  openSubmenu: string | null = null;
  menuOpen = false; // controla o drawer no mobile

  constructor(private elementRef: ElementRef) {}

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
