import { Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, Output, ViewChild, ChangeDetectionStrategy } from '@angular/core';


const CHAVE_NOME = 'sugestaoNome';

// O GitHub não abre em iframe: o formulário monta a issue e abre o GitHub já preenchido.
@Component({
    selector: 'app-sugestao',
    imports: [],
    templateUrl: './sugestao.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './sugestao.component.scss'
})
export class SugestaoComponent implements OnChanges {
  @Input() visible = false;
  // Endereço de nova issue do repositório.
  @Input() link = '';
  @Input() origem = '';
  @Output() close = new EventEmitter<void>();
  @ViewChild('nomeInput') nomeInput?: ElementRef<HTMLInputElement>;
  @ViewChild('tituloInput') tituloInput?: ElementRef<HTMLInputElement>;

  readonly tipos = ['Novo link', 'Melhoria', 'Erro'];
  tipo = this.tipos[0];
  nome = '';
  titulo = '';
  descricao = '';

  ngOnChanges(): void {
    if (!this.visible) return;
    // Nome fica lembrado para as próximas sugestões.
    if (!this.nome) try { this.nome = localStorage.getItem(CHAVE_NOME) ?? ''; } catch {}
    setTimeout(() => (this.nome ? this.tituloInput : this.nomeInput)?.nativeElement.focus());
  }

  get valido(): boolean {
    return !!this.nome.trim() && !!this.titulo.trim();
  }

  enviar(): void {
    if (!this.valido) return;
    const nome = this.nome.trim();
    const titulo = this.titulo.trim();
    try { localStorage.setItem(CHAVE_NOME, nome); } catch {}
    const corpo = [`**Solicitado por:** ${nome}\n**Tipo:** ${this.tipo}`, this.descricao.trim(), `---\nEnviado pelo ${this.origem}`]
      .filter(Boolean).join('\n\n');
    const params = new URLSearchParams({ title: `[${this.tipo}] ${titulo}`, body: corpo });
    window.open(`${this.link}?${params}`, '_blank', 'noopener');
    this.titulo = this.descricao = '';
    this.tipo = this.tipos[0];
    this.fechar();
  }

  fechar(): void {
    this.close.emit();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.visible) this.fechar();
  }
}
