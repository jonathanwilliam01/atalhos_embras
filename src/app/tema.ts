export const CHAVE_TEMA = 'tema';

export interface Tema { id: string; nome: string; }

// Cores de cada tema ficam no styles.scss ([data-tema="id"]).
export const TEMAS: Tema[] = [
  { id: 'grafite', nome: 'Grafite' },
  { id: 'nanquim', nome: 'Nanquim' },
  { id: 'nanquim-vermelho', nome: 'Nanquim Vermelho' },
  { id: 'nanquim-royal', nome: 'Nanquim Royal' },
  { id: 'nanquim-ambar', nome: 'Nanquim Âmbar' },
  { id: 'nanquim-roxo', nome: 'Nanquim Roxo' },
  { id: 'meia-noite', nome: 'Meia-noite' },
  { id: 'oceano', nome: 'Oceano' },
  { id: 'floresta', nome: 'Floresta' },
  { id: 'ameixa', nome: 'Ameixa' },
  { id: 'vinho', nome: 'Vinho' },
  { id: 'cafe', nome: 'Café' },
];

export function temaAtual(): string {
  const id = document.documentElement.getAttribute('data-tema');
  return TEMAS.some(t => t.id === id) ? id! : 'grafite';
}

export function aplicarTema(id: string): void {
  if (!TEMAS.some(t => t.id === id)) return;
  if (id === 'grafite') document.documentElement.removeAttribute('data-tema');
  else document.documentElement.setAttribute('data-tema', id);
  try { localStorage.setItem(CHAVE_TEMA, id); } catch {}
  const cor = getComputedStyle(document.documentElement).getPropertyValue('--painel').trim();
  if (cor) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', cor);
}
