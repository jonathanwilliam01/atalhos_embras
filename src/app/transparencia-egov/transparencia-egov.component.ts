import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-transparencia-egov',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './transparencia-egov.component.html',
  styleUrl: './transparencia-egov.component.scss'
})
export class TransparenciaEgovComponent {
  currentComponent = 'transparencia-egov';

  currentPage: number = 1;

  pag(page: number): void {
    this.currentPage = page;
}
}
