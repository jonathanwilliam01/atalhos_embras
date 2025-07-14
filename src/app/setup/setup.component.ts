import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-setup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './setup.component.html',
  styleUrl: './setup.component.scss'
})
export class SetupComponent {
    currentComponent = 'setup';

  currentPage: number = 1;

  pag(page: number): void {
    this.currentPage = page;
}

}
