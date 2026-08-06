import { Component } from '@angular/core';
import { SistemaLinksComponent } from '../shared/sistema-links/sistema-links.component';
import dados from './transparencia-egov.links.json';

@Component({
  selector: 'app-transparencia-egov',
  standalone: true,
  imports: [SistemaLinksComponent],
  templateUrl: './transparencia-egov.component.html'
})
export class TransparenciaEgovComponent {
  dados = dados;
}
