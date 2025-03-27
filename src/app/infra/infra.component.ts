import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-infra',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './infra.component.html',
  styleUrl: './infra.component.scss'
})
export class InfraComponent {
  currentComponent = 'infra';

  currentPage: number = 1;

  pag(page: number): void {
    this.currentPage = page;
}

}
