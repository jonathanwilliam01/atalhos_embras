import { ChangeDetectionStrategy, Component, ViewEncapsulation, afterNextRender, signal } from '@angular/core';
import { EPOCAS, Epoca, epocaDoDia } from './epocas';

interface Efeito { qtd: number; tam: [number, number]; dur: [number, number]; cores: string[]; frente?: boolean; }

const EFEITOS: Record<Epoca, Efeito> = {
  natal: { qtd: 36, tam: [3, 7], dur: [12, 24], cores: ['#f4f8ff'] },
  'ano-novo': { qtd: 22, tam: [3, 6], dur: [14, 26], cores: ['#f5c542', '#ffe3a1', '#e8e8e8'] },
  carnaval: { qtd: 34, tam: [5, 9], dur: [9, 18], cores: ['#ff4f9a', '#ffd23f', '#3fd0c9', '#8a4fff', '#5be37d'] },
  pascoa: { qtd: 12, tam: [10, 15], dur: [18, 30], cores: ['#f7c6d9', '#c8e6c9', '#fff3b0', '#cfd8ff', '#ffd6b3'] },
  junina: { qtd: 16, tam: [2, 4], dur: [7, 13], cores: ['#ffb347', '#ff7b39', '#ffd27a'] },
  halloween: { qtd: 3, tam: [26, 38], dur: [20, 32], cores: ['#1d1426', '#2a1838'], frente: true },
};

const FOGOS = ['#f5c542', '#4ac2c2', '#ff6b8b'];

const entre = ([min, max]: [number, number]) => min + Math.random() * (max - min);

// Decoração automática por época do ano. ?epoca=natal força uma época; ?epoca=nenhuma desliga.
// Só no navegador: o HTML pré-renderizado não pode congelar a data do build.
@Component({
  selector: 'app-epoca',
  templateUrl: './epoca.component.html',
  styleUrls: ['./epoca.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EpocaComponent {
  readonly epoca = signal<Epoca | null>(null);
  readonly particulas = signal<Record<string, string>[]>([]);
  readonly fogos = signal<Record<string, string>[]>([]);
  readonly frente = signal(false);
  readonly raios = Array.from({ length: 12 });

  constructor() {
    afterNextRender(() => {
      const forcada = new URLSearchParams(location.search).get('epoca');
      const epoca = forcada === 'nenhuma' ? null : EPOCAS.find(e => e === forcada) ?? epocaDoDia();
      if (!epoca) return;
      document.documentElement.setAttribute('data-epoca', epoca);
      const ef = EFEITOS[epoca];
      this.frente.set(!!ef.frente);
      this.particulas.set(Array.from({ length: ef.qtd }, () => {
        const dur = entre(ef.dur);
        return {
          '--x': `${Math.random() * 100}%`,
          '--y': `${8 + Math.random() * 50}%`,
          '--tam': `${entre(ef.tam).toFixed(1)}px`,
          '--deriva': `${(Math.random() * 80 - 40).toFixed(0)}px`,
          '--dur': `${dur.toFixed(1)}s`,
          '--atraso': `${(-Math.random() * dur).toFixed(1)}s`,
          color: ef.cores[Math.floor(Math.random() * ef.cores.length)],
          opacity: (0.45 + Math.random() * 0.45).toFixed(2),
        };
      }));
      if (epoca === 'ano-novo') {
        this.fogos.set(FOGOS.map((cor, i) => ({
          left: `${10 + Math.random() * 80}%`,
          top: `${10 + Math.random() * 35}%`,
          color: cor,
          '--dur': `${7 + i * 2}s`,
          '--atraso': `${i * 1.7}s`,
        })));
      }
      this.epoca.set(epoca);
    });
  }
}
