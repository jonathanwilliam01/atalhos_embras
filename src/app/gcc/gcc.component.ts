import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-gcc',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gcc.component.html',
  styleUrl: './gcc.component.scss'
})
export class GccComponent {
  currentComponent = 'gcc';

  currentPage: number = 1;

  pag(page: number): void {
    this.currentPage = page;
}
}
