import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-portal-transparencia',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './portal-transparencia.component.html',
  styleUrl: './portal-transparencia.component.scss'
})
export class PortalTransparenciaComponent {
  currentComponent = 'portal-transparencia';

  currentPage: number = 1;

  pag(page: number): void {
    this.currentPage = page;
}
}
