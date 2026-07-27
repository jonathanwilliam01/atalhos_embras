import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-suprimentos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './suprimentos.component.html',
  styleUrl: './suprimentos.component.scss'
})
export class SuprimentosComponent {
  currentComponent = 'suprimentos';

  currentPage: number = 1;

  pag(page: number): void {
    this.currentPage = page;
}
}
