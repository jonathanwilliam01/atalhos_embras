// Gera src/icones.scss só com os ícones do Font Awesome usados no código (SVG como máscara, sem baixar fonte).
// Rodar depois de usar um ícone novo: node scripts/icones.mjs
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const FA = 'node_modules/@fortawesome/fontawesome-free';
const SAIDA = 'src/icones.scss';
const UTILITARIOS = new Set(['solid', 'regular', 'spin']);
// Ícones usados só por variável CSS (sem classe no HTML).
const EXTRAS = ['arrow-down'];

export function arquivos(dir) {
  return readdirSync(dir).flatMap(f => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return arquivos(p);
    return /\.(ts|html)$/.test(f) && !f.endsWith('.spec.ts') ? [p] : [];
  });
}

export function iconesUsados(dir = 'src') {
  const nomes = new Set(EXTRAS);
  for (const f of arquivos(dir)) for (const [, n] of readFileSync(f, 'utf8').matchAll(/\bfa-([a-z0-9-]+)/g)) {
    if (!UTILITARIOS.has(n)) nomes.add(n);
  }
  return [...nomes].sort();
}

function svg(estilo, nome) {
  try {
    const texto = readFileSync(`${FA}/svgs/${estilo}/${nome}.svg`, 'utf8').replace(/<!--.*?-->/g, '');
    const [, w, h] = texto.match(/viewBox="0 0 (\d+) (\d+)"/);
    const url = texto.replace(/"/g, "'").replace(/</g, '%3C').replace(/>/g, '%3E').replace(/#/g, '%23');
    return { url: `url("data:image/svg+xml,${url}")`, largura: +(w / h).toFixed(4) };
  } catch {
    return null;
  }
}

function gerar() {
  const meta = JSON.parse(readFileSync(`${FA}/metadata/icon-families.json`, 'utf8'));
  const alias = {};
  for (const [nome, m] of Object.entries(meta)) for (const a of m.aliases?.names ?? []) alias[a] = nome;
  const linhas = [];
  const faltando = [];
  for (const usado of iconesUsados()) {
    const nome = meta[usado] ? usado : alias[usado];
    let achou = false;
    for (const [estilo, classe, sufixo] of [['solid', 'fa-solid', ''], ['regular', 'fa-regular', '-r']]) {
      const s = nome && svg(estilo, nome);
      if (!s) continue;
      achou = true;
      linhas.push(`  --fa-${usado}${sufixo}: ${s.url};`);
      linhas.push(`  --fa-${usado}${sufixo}-w: ${s.largura}em;`);
      linhas.push(`  @at-root .${classe}.fa-${usado} { --fa-i: var(--fa-${usado}${sufixo}); --fa-w: var(--fa-${usado}${sufixo}-w); }`);
    }
    if (!achou) faltando.push(usado);
  }
  if (faltando.length) console.warn('Sem SVG no Font Awesome:', faltando.join(', '));

  writeFileSync(SAIDA, `// Gerado por scripts/icones.mjs. Não editar à mão.
:root {
${linhas.join('\n')}
}

.fa-solid, .fa-regular {
  display: inline-block;
  font-style: normal;
  line-height: 1;
}

.fa-solid::before, .fa-regular::before {
  content: "";
  display: inline-block;
  width: var(--fa-w, 1em);
  height: 1em;
  vertical-align: -0.125em;
  background: currentColor;
  mask: var(--fa-i) center / contain no-repeat;
}

.fa-spin { animation: fa-spin 2s linear infinite; }
@keyframes fa-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .fa-spin { animation: none; } }
`);
  console.log(`${SAIDA}: ${iconesUsados().length} ícones`);
}

if (process.argv[1]?.endsWith('icones.mjs')) gerar();
