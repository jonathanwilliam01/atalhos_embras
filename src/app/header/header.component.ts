import { Component, Output, EventEmitter} from '@angular/core';
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

  selectComponent(componentName: string) {
    this.selectedComponent = componentName; // Define o componente selecionado
    this.componentSelected.emit(componentName);
  }

  reloadPage() {
    window.location.reload();
  }
}

