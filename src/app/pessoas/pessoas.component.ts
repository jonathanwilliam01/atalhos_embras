import { Component } from '@angular/core';
import { SistemaLinksComponent } from '../shared/sistema-links/sistema-links.component';
import dados from './pessoas.links.json';

@Component({
  selector: 'app-pessoas',
  standalone: true,
  imports: [SistemaLinksComponent],
  templateUrl: './pessoas.component.html'
})
export class PessoasComponent {
  dados = dados;
}
