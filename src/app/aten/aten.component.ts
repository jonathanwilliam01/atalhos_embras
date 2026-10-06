import { Component } from '@angular/core';
import { SistemaLinksComponent } from '../shared/sistema-links/sistema-links.component';
import dados from './aten.links.json';

@Component({
  selector: 'app-aten',
  standalone: true,
  imports: [SistemaLinksComponent],
  templateUrl: './aten.component.html'
})
export class AtenComponent {
  dados = dados;
}
