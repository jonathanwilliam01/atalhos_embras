import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-interfaces',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './interfaces.component.html',
  styleUrl: './interfaces.component.scss'
})
export class InterfacesComponent {
  currentComponent = 'interfaces';
}
