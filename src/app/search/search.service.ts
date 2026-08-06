import { Injectable } from '@angular/core';
import goglobal from '../goglobal/goglobal.links.json';
import egov from '../egov/egov.links.json';
import egovDev from '../egov-dev/egov-dev.links.json';
import configEgov from '../config-egov/config-egov.links.json';
import links from '../links/links.links.json';
import loginNovo from '../login-novo/login-novo.links.json';
import infra from '../infra/infra.links.json';
import setup from '../setup/setup.links.json';
import pessoas from '../pessoas/pessoas.links.json';
import gcc from '../gcc/gcc.links.json';
import suprimentos from '../suprimentos/suprimentos.links.json';
import portalTransparencia from '../portal-transparencia/portal-transparencia.links.json';
import transparenciaEgov from '../transparencia-egov/transparencia-egov.links.json';
import admWeb from '../adm-web/adm-web.links.json';
import novoTransparencia from '../novo-transparencia/novo-transparencia.links.json';
import { DadosSistema } from '../shared/sistema-links/sistema-links.component';

export interface ResultadoBusca {
  sistema: string;
  local: string;
  cliente: string;
  url: string;
}

const SISTEMAS: DadosSistema[] = [
  goglobal, egov, egovDev, configEgov, links, loginNovo, infra, setup, pessoas,
  gcc, suprimentos, portalTransparencia, transparenciaEgov, admWeb, novoTransparencia
];

function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

@Injectable({ providedIn: 'root' })
export class SearchService {
  private indice: ResultadoBusca[] = SISTEMAS.flatMap(sistema =>
    sistema.grupos.flatMap(grupo =>
      grupo.itens
        .filter(item => item.url)
        .map(item => ({
          sistema: sistema.sistema,
          local: grupo.nome,
          cliente: item.cliente,
          url: item.url
        }))
    )
  );

  buscar(termo: string): ResultadoBusca[] {
    const alvo = normalizar(termo.trim());
    if (!alvo) return [];

    return this.indice.filter(r =>
      normalizar(r.sistema).includes(alvo) ||
      normalizar(r.local).includes(alvo) ||
      normalizar(r.cliente).includes(alvo) ||
      normalizar(r.url).includes(alvo)
    );
  }
}
