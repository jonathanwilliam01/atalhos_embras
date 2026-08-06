import { Component } from '@angular/core';
import { SistemaLinksComponent } from '../shared/sistema-links/sistema-links.component';
import dados from './suprimentos.links.json';

@Component({
  selector: 'app-suprimentos',
  standalone: true,
  imports: [SistemaLinksComponent],
  templateUrl: './suprimentos.component.html'
})
export class SuprimentosComponent {
  dados = dados;
}
