// Testa todos os links ativos de src/app/dados e grava em <saida> (padrão: relatorio.md)
// a lista dos que não abrem. Sem problemas, o arquivo fica vazio.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';

const PASTA = new URL('../src/app/dados/', import.meta.url);
const SAIDA = process.argv[2] ?? 'relatorio.md';
const TIMEOUT_MS = 20000;
const PARALELOS = 8;
// Rede interna da Embras (inclui a homologação em dev.geosiap.net): não abre fora dela.
const INTERNO = /^https?:\/\/(localhost|127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|dev\.geosiap\.net)/;

const links = new Map();
for (const arquivo of readdirSync(PASTA).filter(a => a.endsWith('.json'))) {
  const dados = JSON.parse(readFileSync(new URL(arquivo, PASTA)));
  for (const grupo of dados.grupos) {
    for (const item of grupo.itens) {
      if (!item.url || item.inativo || INTERNO.test(item.url)) continue;
      const usos = links.get(item.url) ?? [];
      links.set(item.url, [...usos, `${dados.sistema} · ${item.cliente}`]);
    }
  }
}

async function testar(url) {
  for (let tentativa = 1; ; tentativa++) {
    try {
      const resposta = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS), headers: { 'user-agent': 'Mozilla/5.0 (Atalhos Embras - verificação de links)' } });
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

const fila = [...links.keys()];
const problemas = [];
await Promise.all(Array.from({ length: PARALELOS }, async () => {
  for (let url; (url = fila.shift()); ) {
    const motivo = await testar(url);
    if (motivo) problemas.push({ url, motivo, usos: links.get(url) });
  }
}));

problemas.sort((a, b) => a.usos[0].localeCompare(b.usos[0], 'pt-BR'));
const linhas = problemas.map(p => `| ${p.usos.join('<br>')} | ${p.motivo} | ${p.url} |`);
const relatorio = problemas.length ? [
  `${problemas.length} de ${links.size} links não abriram na verificação de ${new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}.`,
  '',
  '| Onde | Problema | Link |',
  '| --- | --- | --- |',
  ...linhas,
  '',
  'A verificação roda fora da rede da Embras: servidor que só aceita IP do Brasil ou da prefeitura pode aparecer aqui mesmo funcionando.'
].join('\n') + '\n' : '';

writeFileSync(SAIDA, relatorio);
console.log(`${links.size} links testados, ${problemas.length} com problema.`);
if (relatorio) console.log(relatorio);
