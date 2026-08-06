import { Component } from '@angular/core';
import { SistemaLinksComponent } from '../shared/sistema-links/sistema-links.component';
import dados from './links.links.json';

@Component({
  selector: 'app-links',
  standalone: true,
  imports: [SistemaLinksComponent],
  templateUrl: './links.component.html'
})
export class LinksComponent {
  dados = dados;
}
