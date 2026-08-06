import { Component } from '@angular/core';
import { SistemaLinksComponent } from '../shared/sistema-links/sistema-links.component';
import dados from './goglobal.links.json';

@Component({
  selector: 'app-goglobal',
  standalone: true,
  imports: [SistemaLinksComponent],
  templateUrl: './goglobal.component.html'
})
export class GoGlobalComponent {
  dados = dados;
}
