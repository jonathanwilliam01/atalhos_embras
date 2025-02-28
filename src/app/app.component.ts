import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoGlobalComponent } from './goglobal/goglobal.component';
import { ItemService } from './item.service';
import { HeaderComponent } from './header/header.component';
import { IssonlineComponent } from './issonline/issonline.component';
import { EgovComponent } from './egov/egov.component';
import { EgovDevComponent } from './egov-dev/egov-dev.component';
import { InterfacesComponent } from './interfaces/interfaces.component';
import { LinksComponent } from './links/links.component';
import { ConfigEgovComponent } from './config-egov/config-egov.component';
import { LoginNovoComponent } from './login-novo/login-novo.component';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, GoGlobalComponent, HeaderComponent, IssonlineComponent, EgovComponent,
    EgovDevComponent, InterfacesComponent, LinksComponent, ConfigEgovComponent, LoginNovoComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [ItemService]
})
export class AppComponent {
  title= 'trib'

currentComponent: string = '';

  setComponent(componentName: string) {
    this.currentComponent = componentName;
  }
}
