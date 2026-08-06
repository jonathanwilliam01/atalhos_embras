import { Component } from '@angular/core';
import { SistemaLinksComponent } from '../shared/sistema-links/sistema-links.component';
import dados from './novo-transparencia.links.json';

@Component({
  selector: 'app-novo-transparencia',
  standalone: true,
  imports: [SistemaLinksComponent],
  templateUrl: './novo-transparencia.component.html'
})
export class NovoTransparenciaComponent {
  dados = dados;
}
