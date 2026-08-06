import { Component } from '@angular/core';
import { SistemaLinksComponent } from '../shared/sistema-links/sistema-links.component';
import dados from './config-egov.links.json';

@Component({
  selector: 'app-config-egov',
  standalone: true,
  imports: [SistemaLinksComponent],
  templateUrl: './config-egov.component.html'
})
export class ConfigEgovComponent {
  dados = dados;
}
