import { Component } from '@angular/core';
import { SistemaLinksComponent } from '../shared/sistema-links/sistema-links.component';
import dados from './setup.links.json';

@Component({
  selector: 'app-setup',
  standalone: true,
  imports: [SistemaLinksComponent],
  templateUrl: './setup.component.html'
})
export class SetupComponent {
  dados = dados;
}
