import { Component, Output, EventEmitter} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})

export class HeaderComponent {

  @Output() componentSelected = new EventEmitter<string>();

  selectComponent(componentName: string) {
    this.componentSelected.emit(componentName);
  }

  reloadPage() {
    window.location.reload();
    ;
}
}
