import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-links',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './links.component.html',
  styleUrl: './links.component.scss'
})
export class LinksComponent {
  currentComponent = 'links';

 currentPage: number = 1;
 
 pag(page: number): void {
  this.currentPage = page;
 }
}
