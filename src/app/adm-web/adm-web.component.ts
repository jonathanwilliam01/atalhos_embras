import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-adm-web',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './adm-web.component.html',
  styleUrl: './adm-web.component.scss'
})
export class AdmWebComponent {
  currentComponent = 'adm-web';

  currentPage: number = 1;

  pag(page: number): void {
    this.currentPage = page;
  }
}
