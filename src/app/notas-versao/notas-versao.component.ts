import { Component, EventEmitter, HostListener, Input, Output, ChangeDetectionStrategy } from '@angular/core';

import notasVersaoData from './notas_versao.json';

interface VersaoNota {
  versao: string;
  data: string;
  descricao: string[];
}

// Mais nova primeiro; a versão do app é a maior nota.
export const VERSOES_NOTAS: VersaoNota[] = [...notasVersaoData.versoes].sort((a, b) => b.versao.localeCompare(a.versao, undefined, { numeric: true }));
export const ULTIMA_VERSAO: VersaoNota | undefined = VERSOES_NOTAS[0];

@Component({
    selector: 'app-notas-versao',
    imports: [],
    templateUrl: './notas-versao.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './notas-versao.component.scss'
})
export class NotasVersaoComponent {
  @Input() visible = false;
  @Output() close = new EventEmitter<void>();

  versoes = VERSOES_NOTAS;
  expandedVersao: string | null = this.versoes[0]?.versao ?? null;

  toggle(versao: string) {
    this.expandedVersao = this.expandedVersao === versao ? null : versao;
  }

  fechar() {
    this.close.emit();
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.visible) {
      this.fechar();
    }
  }
}
