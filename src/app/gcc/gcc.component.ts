import { Component } from '@angular/core';
import { SistemaLinksComponent } from '../shared/sistema-links/sistema-links.component';
import dados from './gcc.links.json';

@Component({
  selector: 'app-gcc',
  standalone: true,
  imports: [SistemaLinksComponent],
  templateUrl: './gcc.component.html'
})
export class GccComponent {
  dados = dados;
}
