import { Injectable } from '@angular/core';
import { TELAS } from '../sistemas';
import { ResultadoBusca, GrupoBusca, ESTADOS, agruparPorCliente, filtrarPorTermo, indexar, semVariacao } from './busca';

export * from './busca';

@Injectable({ providedIn: 'root' })
export class SearchService {
  private entradas = indexar(TELAS);
  private indice = this.entradas.map(e => e.r);
  private textos = this.entradas.map(e => e.texto);

  buscar(termo: string): GrupoBusca[] {
    return agruparPorCliente(filtrarPorTermo(this.indice, this.textos, termo));
  }

  filtrar(teste: (r: ResultadoBusca) => boolean): GrupoBusca[] {
    return agruparPorCliente(this.indice.filter(teste));
  }

  porUrl(url: string): ResultadoBusca | undefined {
    return this.indice.find(r => r.url === url);
  }

  // Identidade do link que não muda quando a URL é corrigida: sistema + estado + cliente.
  chave(r: ResultadoBusca): string {
    return `${r.sistema}|${r.local}|${r.cliente}`;
  }

  porChave(chave: string): ResultadoBusca | undefined {
    return this.indice.find(r => this.chave(r) === chave);
  }

  // URL antiga sem identidade salva: aceita só se um único link bate ignorando http/https, porta e o "pm" do servidor.
  porUrlParecida(url: string): ResultadoBusca | undefined {
    const alvo = semVariacao(url);
    const achados = this.indice.filter(r => semVariacao(r.url) === alvo);
    return achados.length === 1 ? achados[0] : undefined;
  }

  clientes(): GrupoBusca[] {
    return agruparPorCliente(this.indice.filter(r => r.local in ESTADOS))
      .sort((a, b) => a.cliente.localeCompare(b.cliente, 'pt-BR'));
  }
}
