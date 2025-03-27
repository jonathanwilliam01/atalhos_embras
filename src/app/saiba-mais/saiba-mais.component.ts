import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-saiba-mais',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './saiba-mais.component.html',
  styleUrl: './saiba-mais.component.scss'
})
export class SaibaMaisComponent {
  currentComponent = 'SaibaMais';
}
