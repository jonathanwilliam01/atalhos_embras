import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import { TELAS } from '../sistemas';
import { ESTADOS, SUFIXO_HOMOLOG, normalizar, temAcento } from '../search/search.service';
import { ColunaVersao, VersoesClientesService } from './versoes-clientes.service';

const NOMES_ESTADO = Object.fromEntries(Object.entries(ESTADOS).map(([nome, uf]) => [uf, nome]));

interface Linha {
  cliente: string;
  estado: string;
  // url do cliente em cada tela (id da tela).
  urls: Record<string, string>;
  // Cliente + UF + estado normalizados, para o filtro.
  texto: string;
}

// Visão Versões da tela Clientes: uma linha por cliente e uma coluna por sistema com versão.
@Component({
  selector: 'app-versoes',
  templateUrl: './versoes.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './versoes.component.scss'
})
export class VersoesComponent {
  @Input() filtro = '';
  @Input() soPendencias = false;
  readonly versoes = inject(VersoesClientesService);
  readonly colunas = this.versoes.colunas;
  private todas = montarLinhas();
  private ultimas?: { chave: unknown[]; linhas: Linha[] };

  // O getter roda a cada ciclo: só refiltra quando filtro, pendências ou versões mudam.
  get linhas(): Linha[] {
    const chave = [this.filtro, this.soPendencias, ...this.colunas.map(c => c.versoes)];
    if (this.ultimas?.chave.every((v, i) => v === chave[i])) return this.ultimas.linhas;
    const alvo = normalizar(this.filtro);
    const linhas = this.todas.filter(l => l.texto.includes(alvo) && (!this.soPendencias || this.pendente(l)));
    this.ultimas = { chave, linhas };
    return linhas;
  }

  versao(coluna: ColunaVersao, linha: Linha) {
    const url = linha.urls[coluna.tela.id];
    return url ? this.versoes.info(url).versao : undefined;
  }

  desatualizada(coluna: ColunaVersao, linha: Linha): boolean {
    const url = linha.urls[coluna.tela.id];
    return !!url && this.versoes.info(url).desatualizada;
  }

  private pendente(linha: Linha): boolean {
    return this.colunas.some(c => this.versao(c, linha) === false || this.desatualizada(c, linha));
  }
}

// Agrupa por cliente + estado, ignorando acentos e o sufixo "Homolog.".
function montarLinhas(): Linha[] {
  const linhas = new Map<string, Linha>();
  for (const tela of TELAS.filter(t => t.versao)) {
    for (const grupo of tela.dados.grupos) {
      const estado = ESTADOS[grupo.nome];
      if (!estado) continue;
      for (const item of grupo.itens) {
        if (!item.url || item.inativo) continue;
        const nome = item.cliente.replace(SUFIXO_HOMOLOG, '');
        const chave = `${normalizar(nome)}|${estado}`;
        let linha = linhas.get(chave);
        if (!linha) linhas.set(chave, linha = { cliente: nome, estado, urls: {}, texto: '' });
        if (temAcento(nome) && !temAcento(linha.cliente)) linha.cliente = nome;
        linha.urls[tela.id] = item.url;
      }
    }
  }
  for (const l of linhas.values()) l.texto = normalizar(`${l.cliente} ${l.estado} ${NOMES_ESTADO[l.estado]}`);
  return [...linhas.values()].sort((a, b) => a.cliente.localeCompare(b.cliente, 'pt-BR'));
}
