import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-issonline',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './issonline.component.html',
  styleUrl: './issonline.component.scss'
})
export class IssonlineComponent {
  currentComponent = 'IssOnline';

  currentPage: number = 1;

  pag(page: number): void {
    this.currentPage = page;
}
}
