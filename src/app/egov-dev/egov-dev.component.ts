import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-egov-dev',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './egov-dev.component.html',
  styleUrl: './egov-dev.component.scss'
})
export class EgovDevComponent {
  currentComponent = 'egov_dev';

  currentPage: number = 1;

  pag(page: number): void {
    this.currentPage = page;
}
}
