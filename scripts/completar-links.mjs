// Procura clientes que faltam em cada sistema: monta o link com o servidor que o cliente já usa
// e o caminho padrão do sistema, testa e lista os que abrem em <saida> (padrão: novos-links.md).
// Com --inserir, grava nos JSONs os confirmados (versão lida ou mesma resposta dos outros clientes).
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { sistemas: SCRAPS } = require('../api/versao.js');

const PASTA = new URL('../src/app/dados/', import.meta.url);
const ARGS = process.argv.slice(2);
const SAIDA = ARGS.find(a => !a.startsWith('--')) ?? 'novos-links.md';
const INSERIR = ARGS.includes('--inserir');
const TIMEOUT_MS = 15000;
const PARALELOS = 8;
const HEADERS = { 'user-agent': 'Mozilla/5.0 (Atalhos Embras - busca de links)' };
// Sem caminho padrão por servidor: links soltos, GoGlobal (painel-<cliente>), homologação e Config Contas (endereço de retorno na URL).
// Nova Segunda Via abre em todo servidor com E-Gov, mesmo em cliente que não usa.
const IGNORAR = new Set(['links.json', 'goglobal.json', 'egov-dev.json', 'issonline-dev.json', 'login-novo.json', 'segunda-via.json']);
const ESTADOS = new Set(['São Paulo', 'Rio de Janeiro', 'Minas Gerais']);
const HOMOLOG = /\s+homolog\.?$/i;
const MINIMO_PADRAO = 3;

const normalizar = texto => texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
const temAcento = texto => /[^\x00-\x7F]/.test(texto);
const chave = (estado, nome) => `${estado}|${normalizar(nome.replace(HOMOLOG, ''))}`;

const telas = readdirSync(PASTA).filter(a => a.endsWith('.json') && !IGNORAR.has(a)).map(arquivo => {
  const dados = JSON.parse(readFileSync(new URL(arquivo, PASTA), 'utf8'));
  return { arquivo, dados, scrap: Object.values(SCRAPS).find(s => s.dados.sistema === dados.sistema)?.versao };
});

// Servidores (origem → quantos links) e aliases (/<alias>/websis/...) de cada cliente em todos os sistemas.
const clientes = new Map();
for (const { dados } of telas) {
  for (const grupo of dados.grupos.filter(g => ESTADOS.has(g.nome))) {
    for (const item of grupo.itens) {
      if (!item.url || item.inativo || HOMOLOG.test(item.cliente)) continue;
      const k = chave(grupo.nome, item.cliente);
      const c = clientes.get(k) ?? { nome: item.cliente, estado: grupo.nome, origens: new Map(), aliases: new Set() };
      clientes.set(k, c);
      if (temAcento(item.cliente) && !temAcento(c.nome)) c.nome = item.cliente;
      const url = new URL(item.url);
      c.origens.set(url.origin, (c.origens.get(url.origin) ?? 0) + 1);
      const alias = url.pathname.match(/^\/([^/]+)\/(websis|issonline)\//)?.[1];
      if (alias) c.aliases.add(alias);
    }
  }
}

// Caminho do link sem o servidor; o 1º trecho vira {alias} quando é o alias do cliente.
function padrao(url, cliente) {
  const u = new URL(url);
  const [, primeiro, resto] = u.pathname.match(/^\/([^/]*)(.*)$/);
  return (cliente.aliases.has(primeiro) ? `/{alias}${resto}` : u.pathname) + u.search;
}

async function abrir(url) {
  for (let tentativa = 1; ; tentativa++) {
    try {
      const resposta = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS), headers: HEADERS });
      const bytes = Buffer.from(await resposta.arrayBuffer());
      let corpo;
      try { corpo = new TextDecoder('utf-8', { fatal: true }).decode(bytes); } catch { corpo = bytes.toString('latin1'); }
      const titulo = corpo.match(/<title[^>]*>([^<]*)/i)?.[1].trim() ?? '';
      // Status + título sem números: o título do E-Gov traz versão e data.
      return { status: resposta.status, final: resposta.url, corpo, titulo, assinatura: `${resposta.status} ${titulo.replace(/[\d./()-]+/g, ' ').replace(/\s+/g, ' ').trim()}` };
    } catch {
      if (tentativa >= 2) return null;
    }
  }
}

async function emParalelo(itens, tarefa) {
  const fila = [...itens];
  await Promise.all(Array.from({ length: PARALELOS }, async () => {
    for (let item; (item = fila.shift()); ) await tarefa(item);
  }));
}

// Resposta que os clientes atuais dão; só vale se for igual em todos os conferidos (sem o nome da cidade).
async function assinaturaPadrao(urls) {
  const assinaturas = (await Promise.all(urls.slice(0, 3).map(abrir))).filter(Boolean).map(p => p.assinatura);
  return assinaturas.length >= 2 && assinaturas.every(a => a === assinaturas[0]) ? assinaturas[0] : null;
}

// Servidor que devolve a mesma página para qualquer caminho não prova nada.
const genericas = new Map();
function paginaGenerica(origem) {
  if (!genericas.has(origem)) genericas.set(origem, abrir(`${origem}/atalhos-caminho-inexistente`).then(p => p?.status === 404 ? null : p?.assinatura));
  return genericas.get(origem);
}

// confirmado: abriu a tela do sistema; aberto: respondeu, mas sem como confirmar que é a tela certa.
async function testar(url, tela) {
  const pagina = await abrir(url);
  if (!pagina || /Alias n.o definido/.test(pagina.corpo)) return null;
  if (pagina.status >= 400 && ![401, 403].includes(pagina.status)) return null;
  if (new URL(pagina.final).pathname === '/' && new URL(url).pathname !== '/') return null;
  if (pagina.assinatura === await paginaGenerica(new URL(url).origin)) return null;
  if (tela.scrap) {
    const versao = await tela.scrap(url).catch(() => null);
    if (versao) return { situacao: 'confirmado', detalhe: `versão ${versao}` };
  }
  if (tela.assinatura && pagina.assinatura === tela.assinatura) return { situacao: 'confirmado', detalhe: `mesma resposta dos outros clientes (HTTP ${pagina.status}, "${pagina.titulo}")` };
  return { situacao: 'aberto', detalhe: `HTTP ${pagina.status}, título "${pagina.titulo}"` };
}

const encontrados = [];
for (const tela of telas) {
  const presentes = new Set();
  const contagem = new Map();
  const exemplos = new Map();
  for (const grupo of tela.dados.grupos.filter(g => ESTADOS.has(g.nome))) {
    for (const item of grupo.itens) {
      // Inativo também conta como presente: foi tirado de propósito.
      presentes.add(chave(grupo.nome, item.cliente));
      const cliente = clientes.get(chave(grupo.nome, item.cliente));
      if (!item.url || item.inativo || !cliente) continue;
      const p = padrao(item.url, cliente);
      contagem.set(p, (contagem.get(p) ?? 0) + 1);
      exemplos.set(p, [...(exemplos.get(p) ?? []), item.url]);
    }
  }
  const [caminho, vezes] = [...contagem].sort((a, b) => b[1] - a[1])[0] ?? [];
  if (!caminho || vezes < MINIMO_PADRAO) continue;
  tela.assinatura = await assinaturaPadrao(exemplos.get(caminho));

  const faltando = [...clientes].filter(([k]) => !presentes.has(k)).map(([, c]) => c);
  await emParalelo(faltando, async cliente => {
    const origens = [...cliente.origens].sort((a, b) => b[1] - a[1]).map(([o]) => o);
    const aliases = caminho.includes('{alias}') ? [...cliente.aliases] : [''];
    for (const origem of origens) {
      for (const alias of aliases) {
        const url = origem + caminho.replace('{alias}', alias);
        const resultado = await testar(url, tela);
        if (resultado) return encontrados.push({ tela, cliente, url, ...resultado });
      }
    }
  });
}

// Mesmo formato dos JSONs da pasta dados: um item por linha.
function formatar(dados) {
  const item = i => `{ ${Object.entries(i).map(([k, v]) => `${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(', ')} }`;
  const grupos = dados.grupos.map(g => [
    '    {',
    `      "nome": ${JSON.stringify(g.nome)},`,
    ...(g.itens.length ? ['      "itens": [', g.itens.map(i => `        ${item(i)}`).join(',\n'), '      ]'] : ['      "itens": []']),
    '    }'
  ].join('\n'));
  return [
    '{',
    `  "sistema": ${JSON.stringify(dados.sistema)},`,
    `  "titulo": ${JSON.stringify(dados.titulo)},`,
    '  "imagens": [',
    dados.imagens.map(i => `    ${JSON.stringify(i)}`).join(',\n'),
    '  ],',
    '  "grupos": [',
    grupos.join(',\n'),
    '  ]',
    '}',
    ''
  ].join('\n');
}

const confirmados = encontrados.filter(e => e.situacao === 'confirmado');
if (INSERIR) {
  for (const tela of new Set(confirmados.map(e => e.tela))) {
    for (const { cliente, url } of confirmados.filter(e => e.tela === tela)) {
      let grupo = tela.dados.grupos.find(g => g.nome === cliente.estado);
      if (!grupo) tela.dados.grupos.push(grupo = { nome: cliente.estado, itens: [] });
      // Grupo vazio tem o marcador "Não Utilizado" sem link: sai quando entra o 1º cliente.
      grupo.itens = [...grupo.itens.filter(i => i.url), { cliente: cliente.nome, url }];
    }
    writeFileSync(new URL(tela.arquivo, PASTA), formatar(tela.dados));
  }
}

const ordem = (a, b) => a.tela.dados.sistema.localeCompare(b.tela.dados.sistema) || a.cliente.nome.localeCompare(b.cliente.nome);
const linha = e => `| ${e.tela.dados.sistema} | ${e.cliente.nome} (${e.cliente.estado}) | ${e.url} | ${e.detalhe} |`;
const abertos = encontrados.filter(e => e.situacao === 'aberto');
writeFileSync(SAIDA, encontrados.length ? [
  `${confirmados.length} links novos confirmados${INSERIR ? ' e incluídos' : ''}. Conferir se cada um abre a tela certa antes de aprovar.`,
  '',
  '| Sistema | Cliente | Link | Como foi confirmado |',
  '| --- | --- | --- | --- |',
  ...confirmados.sort(ordem).map(linha),
  ...(abertos.length ? [
    '',
    `${abertos.length} respondem, mas sem como confirmar que é a tela do sistema (não incluídos):`,
    '',
    '| Sistema | Cliente | Link | Resposta |',
    '| --- | --- | --- | --- |',
    ...abertos.sort(ordem).map(linha)
  ] : [])
].join('\n') + '\n' : '');
console.log(`${confirmados.length} confirmados, ${abertos.length} sem confirmação. Detalhes em ${SAIDA}.`);
