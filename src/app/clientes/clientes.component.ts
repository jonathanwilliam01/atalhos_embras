import { Component, ChangeDetectionStrategy, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SearchService, GrupoBusca, normalizar } from '../search/search.service';
import { VersoesComponent } from '../versoes/versoes.component';
import { VersoesClientesService } from '../versoes/versoes-clientes.service';

const CHAVE_MODO = 'clientesModo';
type Modo = 'cartoes' | 'versoes';

@Component({
    selector: 'app-clientes',
    imports: [VersoesComponent],
    templateUrl: './clientes.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './clientes.component.scss'
})
export class ClientesComponent implements OnInit {
  private todos: GrupoBusca[];
  clientes: GrupoBusca[];
  filtro = '';
  modo: Modo = 'cartoes';
  soPendencias = false;
  readonly versoes = inject(VersoesClientesService);
  private platformId = inject(PLATFORM_ID);

  constructor(searchService: SearchService) {
    this.todos = this.clientes = searchService.clientes();
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try { if (localStorage.getItem(CHAVE_MODO) === 'versoes') this.modo = 'versoes'; } catch {}
    this.versoes.carregar();
  }

  filtrar(termo: string): void {
    this.filtro = termo;
    const alvo = normalizar(termo);
    this.clientes = this.todos.filter(c => normalizar(`${c.cliente} ${c.estado} ${c.itens[0]?.local ?? ''}`).includes(alvo));
  }

  mudarModo(modo: Modo): void {
    this.modo = modo;
    try { localStorage.setItem(CHAVE_MODO, modo); } catch {}
  }
}
