import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { TELAS, Tela } from '../sistemas';
import { Versoes, carregarVersoes, compararVersao, recarregarVersoes, versaoMaisRecente } from './versoes';

export interface ColunaVersao {
  tela: Tela;
  versoes: Versoes;
  // Maior versão entre os clientes.
  atual: string | null;
  carregando: boolean;
}

export interface InfoVersao {
  versao: string | null | false | undefined;
  desatualizada: boolean;
}

// Versões de todos os sistemas com scrap, para a tela Clientes (cartões e tabela).
@Injectable({ providedIn: 'root' })
export class VersoesClientesService {
  readonly colunas: ColunaVersao[] = TELAS.filter(t => t.versao).map(tela => ({ tela, versoes: {}, atual: null, carregando: false }));
  private colunaPorUrl = new Map<string, ColunaVersao>();
  private iniciadas = new Set<ColunaVersao>();
  // Avisa quando chegam versões (a busca por versão refaz o resultado).
  readonly atualizou = new Subject<void>();

  constructor() {
    for (const coluna of this.colunas) {
      for (const url of urlsAtivas(coluna.tela)) this.colunaPorUrl.set(url, coluna);
    }
  }

  carregar(): void {
    this.carregarColunas(this.colunas);
  }

  // Só os sistemas destes links (favoritos e recentes da tela inicial).
  carregarPara(urls: string[]): void {
    this.carregarColunas(urls.map(u => this.colunaPorUrl.get(u)).filter((c): c is ColunaVersao => !!c));
  }

  private carregarColunas(colunas: ColunaVersao[]): void {
    for (const coluna of colunas) {
      if (this.iniciadas.has(coluna)) continue;
      this.iniciadas.add(coluna);
      carregarVersoes(coluna.tela.versao!, urlsAtivas(coluna.tela), this.receber(coluna));
    }
  }

  get carregando(): boolean {
    return this.colunas.some(c => c.carregando);
  }

  recarregar(): void {
    for (const coluna of this.colunas) recarregarVersoes(coluna.tela.versao!, coluna.versoes, this.receber(coluna));
  }

  private receber(coluna: ColunaVersao) {
    return (versoes: Versoes, carregando: boolean) => {
      coluna.versoes = versoes;
      coluna.carregando = carregando;
      coluna.atual = versaoMaisRecente(Object.values(versoes));
      this.atualizou.next();
    };
  }

  // undefined: sistema sem versão ou ainda sem consulta.
  info(url: string): InfoVersao {
    const coluna = this.colunaPorUrl.get(url);
    const versao = coluna?.versoes[url];
    return { versao, desatualizada: !!versao && !!coluna?.atual && compararVersao(versao, coluna.atual) < 0 };
  }
}


function urlsAtivas(tela: Tela): string[] {
  return tela.dados.grupos.flatMap(g => g.itens).filter(i => i.url && !i.inativo).map(i => i.url);
}
