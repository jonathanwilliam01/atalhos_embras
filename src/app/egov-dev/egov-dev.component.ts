import { Component } from '@angular/core';
import { SistemaLinksComponent } from '../shared/sistema-links/sistema-links.component';
import dados from './egov-dev.links.json';

@Component({
  selector: 'app-egov-dev',
  standalone: true,
  imports: [SistemaLinksComponent],
  templateUrl: './egov-dev.component.html'
})
export class EgovDevComponent {
  dados = dados;
}
