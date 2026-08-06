import { Component } from '@angular/core';
import { SistemaLinksComponent } from '../shared/sistema-links/sistema-links.component';
import dados from './infra.links.json';

@Component({
  selector: 'app-infra',
  standalone: true,
  imports: [SistemaLinksComponent],
  templateUrl: './infra.component.html'
})
export class InfraComponent {
  dados = dados;
}
