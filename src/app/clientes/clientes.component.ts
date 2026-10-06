import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchService, GrupoBusca, normalizar } from '../search/search.service';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './clientes.component.html',
  styleUrl: './clientes.component.scss'
})
export class ClientesComponent {
  private todos: GrupoBusca[];
  clientes: GrupoBusca[];

  constructor(searchService: SearchService) {
    this.todos = this.clientes = searchService.clientes();
  }

  filtrar(termo: string): void {
    const alvo = normalizar(termo);
    this.clientes = this.todos.filter(c => normalizar(`${c.cliente} ${c.estado}`).includes(alvo));
  }
}
