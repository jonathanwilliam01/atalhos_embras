import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-config-egov',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './config-egov.component.html',
  styleUrl: './config-egov.component.scss'
})
export class ConfigEgovComponent {
  currentComponent = 'config';
  
  currentPage: number = 1;

  pag(page: number): void {
    this.currentPage = page;
}
}
