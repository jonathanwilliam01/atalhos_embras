import { Component, EventEmitter, HostListener, Input, Output, ChangeDetectionStrategy } from '@angular/core';

import { ROTULOS_NOTA, VERSOES_NOTAS } from './notas';

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
  readonly rotulos = ROTULOS_NOTA;
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
