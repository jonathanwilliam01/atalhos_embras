import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-pessoas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pessoas.component.html',
  styleUrl: './pessoas.component.scss'
})
export class PessoasComponent {
  currentComponent = 'pessoas';

  currentPage: number = 1;

  pag(page: number): void {
    this.currentPage = page;
}
}
