import { Component } from '@angular/core';
import { SistemaLinksComponent } from '../shared/sistema-links/sistema-links.component';
import dados from './portal-transparencia.links.json';

@Component({
  selector: 'app-portal-transparencia',
  standalone: true,
  imports: [SistemaLinksComponent],
  templateUrl: './portal-transparencia.component.html'
})
export class PortalTransparenciaComponent {
  dados = dados;
}
