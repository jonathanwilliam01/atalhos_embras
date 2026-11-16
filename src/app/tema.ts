export const CHAVE_TEMA = 'tema';
export const CHAVE_TEMA_PERSONALIZADO = 'temaPersonalizado';
export const PERSONALIZADO = 'personalizado';

export interface Tema { id: string; nome: string; }
export interface CoresTema { painel: string; destaque: string; }

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

const PADRAO: CoresTema = { painel: '#293135', destaque: '#4ac2c2' };
const HEX = /^#[0-9a-f]{6}$/i;

type Rgb = [number, number, number];
const BRANCO: Rgb = [255, 255, 255];
const PRETO: Rgb = [0, 0, 0];
const rgb = (hex: string): Rgb => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)) as Rgb;
const hex = (c: Rgb) => '#' + c.map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
// Igual ao color.mix do Sass: peso% de a + o resto de b.
const mix = (a: Rgb, b: Rgb, peso: number): Rgb => a.map((v, i) => v * peso / 100 + b[i] * (1 - peso / 100)) as Rgb;
const luz = (c: Rgb) => (Math.max(...c) + Math.min(...c)) / 510;

// Os temas são escuros: fundo claro demais escurece, destaque escuro demais clareia (senão o texto some).
export function ajustarCores(cores: CoresTema): CoresTema {
  let p = rgb(cores.painel), d = rgb(cores.destaque);
  const lp = luz(p), ld = luz(d);
  if (lp > 0.3) p = p.map(v => v * 0.3 / lp) as Rgb;
  if (ld < 0.45) d = mix(BRANCO, d, (0.45 - ld) / (1 - ld) * 100);
  return { painel: hex(p), destaque: hex(d) };
}

// Mesmas contas do @mixin tema do styles.scss, feitas no navegador.
export function variaveisTema({ painel, destaque }: CoresTema): Record<string, string> {
  const p = rgb(painel), d = rgb(destaque);
  const claro = (c: Rgb, peso: number) => hex(mix(BRANCO, c, peso));
  const escuro = (c: Rgb, peso: number) => hex(mix(PRETO, c, peso));
  // --painel e --destaque também: na amostra do seletor não basta o -rgb (o :root já resolveu o var()).
  return {
    '--painel-rgb': p.join(' '),
    '--painel': `rgb(${p.join(' ')})`,
    '--painel-2': claro(p, 4),
    '--campo': escuro(p, 26),
    '--hover': claro(p, 5),
    '--botao': claro(p, 8),
    '--botao-hover': claro(p, 18),
    '--linha': claro(p, 8),
    '--borda': claro(p, 14),
    '--borda-2': claro(p, 16),
    '--borda-3': claro(p, 19),
    '--texto-2': claro(p, 78),
    '--texto-3': claro(p, 70),
    '--texto-4': claro(p, 55),
    '--texto-5': claro(p, 47),
    '--destaque-rgb': d.join(' '),
    '--destaque': `rgb(${d.join(' ')})`,
    '--destaque-claro': claro(d, 10),
    '--destaque-escuro': escuro(d, 30),
    '--destaque-texto': claro(d, 45),
    '--sobre-destaque': escuro(p, 45),
    '--chip-fundo': `rgb(${mix(PRETO, d, 80).map(Math.round).join(' ')} / 0.85)`,
  };
}

export function coresPersonalizadas(): CoresTema {
  try {
    const c = JSON.parse(localStorage.getItem(CHAVE_TEMA_PERSONALIZADO) ?? 'null');
    if (HEX.test(c?.painel) && HEX.test(c?.destaque)) return { painel: c.painel, destaque: c.destaque };
  } catch {}
  return PADRAO;
}

// Grava também as variáveis prontas: o index.html aplica antes do Angular, sem refazer as contas.
export function salvarPersonalizado(cores: unknown): CoresTema | null {
  const c = cores as CoresTema;
  if (!HEX.test(c?.painel) || !HEX.test(c?.destaque)) return null;
  const ajustadas = ajustarCores(c);
  try { localStorage.setItem(CHAVE_TEMA_PERSONALIZADO, JSON.stringify({ ...ajustadas, vars: variaveisTema(ajustadas) })); } catch {}
  return ajustadas;
}

export function temaAtual(): string {
  const id = document.documentElement.getAttribute('data-tema');
  return id === PERSONALIZADO || TEMAS.some(t => t.id === id) ? id! : 'grafite';
}

export function aplicarTema(id: string): void {
  if (id !== PERSONALIZADO && !TEMAS.some(t => t.id === id)) return;
  const html = document.documentElement;
  const vars = variaveisTema(coresPersonalizadas());
  for (const nome in vars) {
    if (id === PERSONALIZADO) html.style.setProperty(nome, vars[nome]);
    else html.style.removeProperty(nome);
  }
  if (id === 'grafite') html.removeAttribute('data-tema');
  else html.setAttribute('data-tema', id);
  try { localStorage.setItem(CHAVE_TEMA, id); } catch {}
  const cor = getComputedStyle(html).getPropertyValue('--painel').trim();
  if (cor) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', cor);
}
