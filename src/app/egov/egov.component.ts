import { Component } from '@angular/core';
import { SistemaLinksComponent } from '../shared/sistema-links/sistema-links.component';
import dados from './egov.links.json';

@Component({
  selector: 'app-egov',
  standalone: true,
  imports: [SistemaLinksComponent],
  templateUrl: './egov.component.html'
})
export class EgovComponent {
  dados = dados;
}
