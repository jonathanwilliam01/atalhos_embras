import { Component } from '@angular/core';
import { SistemaLinksComponent } from '../shared/sistema-links/sistema-links.component';
import dados from './adm-web.links.json';

@Component({
  selector: 'app-adm-web',
  standalone: true,
  imports: [SistemaLinksComponent],
  templateUrl: './adm-web.component.html'
})
export class AdmWebComponent {
  dados = dados;
}
