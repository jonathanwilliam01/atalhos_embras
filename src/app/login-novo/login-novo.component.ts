import { Component } from '@angular/core';
import { SistemaLinksComponent } from '../shared/sistema-links/sistema-links.component';
import dados from './login-novo.links.json';

@Component({
  selector: 'app-login-novo',
  standalone: true,
  imports: [SistemaLinksComponent],
  templateUrl: './login-novo.component.html'
})
export class LoginNovoComponent {
  dados = dados;
}
