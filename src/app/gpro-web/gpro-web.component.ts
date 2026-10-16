import { Component } from '@angular/core';
import { SistemaLinksComponent } from '../shared/sistema-links/sistema-links.component';
import dados from './gpro-web.links.json';

@Component({
  selector: 'app-gpro-web',
  standalone: true,
  imports: [SistemaLinksComponent],
  templateUrl: './gpro-web.component.html'
})
export class GproWebComponent {
  dados = dados;
}
