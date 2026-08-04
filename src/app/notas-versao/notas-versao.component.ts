import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import notasVersaoData from './notas_versao.json';

interface VersaoNota {
  versao: string;
  data: string;
  descricao: string[];
}

@Component({
  selector: 'app-notas-versao',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notas-versao.component.html',
  styleUrl: './notas-versao.component.scss'
})
export class NotasVersaoComponent {
  @Input() visible = false;
  @Output() close = new EventEmitter<void>();

  versoes: VersaoNota[] = [...notasVersaoData.versoes].sort((a, b) => b.versao.localeCompare(a.versao));
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
