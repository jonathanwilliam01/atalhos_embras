// Testa todos os links ativos de src/app/dados e grava em <saida> (padrão: relatorio.md)
// a lista dos que não abrem. Sem problemas, o arquivo fica vazio.
// Com --corrigir, troca nos JSONs os links com endereço novo comprovado e lista as trocas em correcoes.md.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';

const PASTA = new URL('../src/app/dados/', import.meta.url);
const ARGS = process.argv.slice(2);
const SAIDA = ARGS.find(a => !a.startsWith('--')) ?? 'relatorio.md';
const CORRIGIR = ARGS.includes('--corrigir');
const SAIDA_CORRECOES = 'correcoes.md';
const TIMEOUT_MS = 20000;
const PARALELOS = 8;
const HEADERS = { 'user-agent': 'Mozilla/5.0 (Atalhos Embras - verificação de links)' };
// Rede interna da Embras (inclui a homologação em dev.geosiap.net): não abre fora dela.
const INTERNO = /^https?:\/\/(localhost|127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|dev\.geosiap\.net)/;

const normalizar = texto => texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();

// url → onde aparece ({ arquivo, sistema, grupo, cliente }).
const links = new Map();
for (const arquivo of readdirSync(PASTA).filter(a => a.endsWith('.json'))) {
  const dados = JSON.parse(readFileSync(new URL(arquivo, PASTA)));
  for (const grupo of dados.grupos) {
    for (const item of grupo.itens) {
      if (!item.url || item.inativo || INTERNO.test(item.url)) continue;
      const usos = links.get(item.url) ?? [];
      links.set(item.url, [...usos, { arquivo, sistema: dados.sistema, grupo: grupo.nome, cliente: item.cliente }]);
    }
  }
}
const onde = url => links.get(url).map(u => `${u.sistema} · ${u.cliente}`);

async function testar(url) {
  for (let tentativa = 1; ; tentativa++) {
    try {
      const resposta = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS), headers: HEADERS });
      const corpo = Buffer.from(await resposta.arrayBuffer()).toString('latin1');
      if (/Alias n.o definido/.test(corpo)) return 'Alias não definido';
      // 401/403: o servidor respondeu, só pede login.
      if (resposta.status >= 400 && ![401, 403].includes(resposta.status)) return `HTTP ${resposta.status}`;
      return null;
    } catch (erro) {
      if (tentativa < 2) continue;
      return erro.name === 'TimeoutError' ? 'Sem resposta em 20s' : `Não conecta (${erro.cause?.code ?? erro.message})`;
    }
  }
}

async function emParalelo(itens, tarefa) {
  const fila = [...itens];
  await Promise.all(Array.from({ length: PARALELOS }, async () => {
    for (let item; (item = fila.shift()); ) await tarefa(item);
  }));
}

const caminho = url => new URL(url).pathname.replace(/\/$/, '');

// Segue só redirecionamentos permanentes (301/308) que mantêm o caminho: troca de http para https, de servidor ou de porta.
// Um temporário (302, ex.: ida para a tela de login) encerra a cadeia.
async function enderecoPermanente(url) {
  let atual = url;
  try {
    for (let salto = 0; salto < 5; salto++) {
      const resposta = await fetch(atual, { redirect: 'manual', signal: AbortSignal.timeout(TIMEOUT_MS), headers: HEADERS });
      const destino = resposta.headers.get('location');
      if (![301, 308].includes(resposta.status) || !destino) break;
      atual = new URL(destino, atual).href;
    }
  } catch {}
  return atual !== url && caminho(atual) === caminho(url) ? atual : null;
}

// Link que não abre: mesmo caminho em outro endereço do servidor (https, sem porta)
// ou no servidor que o mesmo cliente usa em outro sistema e que está abrindo. Nunca troca https por http.
function candidatos(url, quebrados, corrigidos) {
  const original = new URL(url);
  const resto = original.pathname + original.search + original.hash;
  const origens = new Set();

  if (original.protocol === 'http:') origens.add(`https://${original.host}`);
  if (original.port) origens.add(`${original.protocol}//${original.hostname}`);

  const clientes = new Set(links.get(url).map(u => `${u.grupo}|${normalizar(u.cliente)}`));
  for (const [outra, usos] of links) {
    if (quebrados.has(outra) || !usos.some(u => clientes.has(`${u.grupo}|${normalizar(u.cliente)}`))) continue;
    origens.add(new URL(corrigidos.get(outra)?.novo ?? outra).origin);
  }
  origens.delete(original.origin);
  return [...origens].filter(o => original.protocol === 'http:' || o.startsWith('https:')).map(o => o + resto);
}

const problemas = new Map();
await emParalelo(links.keys(), async url => {
  const motivo = await testar(url);
  if (motivo) problemas.set(url, motivo);
});

const correcoes = new Map();
if (CORRIGIR) {
  await emParalelo(links.keys(), async url => {
    const novo = problemas.has(url) ? null : await enderecoPermanente(url);
    if (novo && !(await testar(novo))) correcoes.set(url, { novo, motivo: 'Redirecionamento permanente' });
  });
  await emParalelo(problemas.keys(), async url => {
    for (const novo of candidatos(url, problemas, correcoes)) {
      if (!(await testar(novo))) return correcoes.set(url, { novo, motivo: `Não abria (${problemas.get(url)}); abre no novo endereço` });
    }
  });

  // Troca o texto direto no arquivo para manter a formatação dos JSONs.
  for (const arquivo of new Set([...correcoes.keys()].flatMap(url => links.get(url).map(u => u.arquivo)))) {
    let texto = readFileSync(new URL(arquivo, PASTA), 'utf8');
    for (const [url, { novo }] of correcoes) texto = texto.replaceAll(`"url": ${JSON.stringify(url)}`, `"url": ${JSON.stringify(novo)}`);
    writeFileSync(new URL(arquivo, PASTA), texto);
  }
  for (const url of correcoes.keys()) problemas.delete(url);

  const linhas = [...correcoes].map(([url, c]) => `| ${onde(url).join('<br>')} | ${c.motivo} | ${url} | ${c.novo} |`);
  writeFileSync(SAIDA_CORRECOES, correcoes.size ? [
    `${correcoes.size} links trocados pela verificação automática. Conferir se cada endereço novo abre a tela certa antes de aprovar.`,
    '',
    '| Onde | Motivo | De | Para |',
    '| --- | --- | --- | --- |',
    ...linhas
  ].join('\n') + '\n' : '');
}

const ordenados = [...problemas].map(([url, motivo]) => ({ url, motivo, usos: onde(url) }))
  .sort((a, b) => a.usos[0].localeCompare(b.usos[0], 'pt-BR'));
const relatorio = ordenados.length ? [
  `${ordenados.length} de ${links.size} links não abriram na verificação de ${new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}.`,
  '',
  '| Onde | Problema | Link |',
  '| --- | --- | --- |',
  ...ordenados.map(p => `| ${p.usos.join('<br>')} | ${p.motivo} | ${p.url} |`),
  '',
  'A verificação roda fora da rede da Embras: servidor que só aceita IP do Brasil ou da prefeitura pode aparecer aqui mesmo funcionando.'
].join('\n') + '\n' : '';

writeFileSync(SAIDA, relatorio);
console.log(`${links.size} links testados, ${ordenados.length} com problema${CORRIGIR ? `, ${correcoes.size} corrigidos` : ''}.`);
if (relatorio) console.log(relatorio);
if (correcoes.size) console.log(readFileSync(SAIDA_CORRECOES, 'utf8'));
