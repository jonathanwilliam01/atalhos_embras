import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoGlobalComponent } from './goglobal/goglobal.component';
import { ItemService } from './item.service';
import { HeaderComponent } from './header/header.component';
import { EgovComponent } from './egov/egov.component';
import { EgovDevComponent } from './egov-dev/egov-dev.component';
import { InterfacesComponent } from './interfaces/interfaces.component';
import { LinksComponent } from './links/links.component';
import { ConfigEgovComponent } from './config-egov/config-egov.component';
import { LoginNovoComponent } from './login-novo/login-novo.component';
import { InfraComponent } from './infra/infra.component';
import { SaibaMaisComponent } from './saiba-mais/saiba-mais.component';
import { SetupComponent } from './setup/setup.component';
import { PessoasComponent } from './pessoas/pessoas.component';
import { GccComponent } from './gcc/gcc.component';
import { SuprimentosComponent } from './suprimentos/suprimentos.component';
import { PortalTransparenciaComponent } from './portal-transparencia/portal-transparencia.component';
import { TransparenciaEgovComponent } from './transparencia-egov/transparencia-egov.component';
import { AdmWebComponent } from './adm-web/adm-web.component';
import { NovoTransparenciaComponent } from './novo-transparencia/novo-transparencia.component';
import { NotasVersaoComponent } from './notas-versao/notas-versao.component';
import notasVersaoData from './notas-versao/notas_versao.json';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, GoGlobalComponent, HeaderComponent, EgovComponent,
    EgovDevComponent, InterfacesComponent, LinksComponent, ConfigEgovComponent, LoginNovoComponent, InfraComponent, SaibaMaisComponent, SetupComponent, PessoasComponent,
    GccComponent, SuprimentosComponent, PortalTransparenciaComponent, TransparenciaEgovComponent, AdmWebComponent, NovoTransparenciaComponent, NotasVersaoComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [ItemService]
})
export class AppComponent {
  title = 'atalhos';

  currentComponent: string = '';
  copied = false;
  notasVersaoVisivel = false;
  versaoAtual = [...notasVersaoData.versoes].sort((a, b) => b.versao.localeCompare(a.versao))[0]?.versao ?? '';

  setComponent(componentName: string) {
    this.currentComponent = componentName;
  }

  abrirNotasVersao() {
    this.notasVersaoVisivel = true;
  }

  fecharNotasVersao() {
    this.notasVersaoVisivel = false;
  }

  copyEmail() {
    navigator.clipboard.writeText('Jonathan.willian@embras.net').then(() => {
      this.copied = true;
      setTimeout(() => this.copied = false, 2000);
    });
  }
}
