import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-novo-transparencia',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './novo-transparencia.component.html',
  styleUrl: './novo-transparencia.component.scss'
})
export class NovoTransparenciaComponent {
  currentComponent = 'novo-transparencia';

  currentPage: number = 1;

  pag(page: number): void {
    this.currentPage = page;
  }
}
