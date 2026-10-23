// Monta src/app/clientes/clientes.json com site, endereço e telefone da sede de cada prefeitura cliente.
// Site vem do Wikidata (P856); endereço e telefone, da página inicial do site ou da página de contato linkada nela.
// Só preenche campos vazios: correções manuais no JSON são mantidas. Com --refazer, busca tudo de novo.
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';

const PASTA = new URL('../src/app/dados/', import.meta.url);
const SAIDA = new URL('../src/app/clientes/clientes.json', import.meta.url);
const REFAZER = process.argv.includes('--refazer');
const TIMEOUT_MS = 15000;
const PARALELOS = 6;
const HEADERS = { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36 atalhos-embras/1.0' };
const UFS = { 'São Paulo': 'SP', 'Rio de Janeiro': 'RJ', 'Minas Gerais': 'MG' };
const ESTADOS_WIKIDATA = { SP: 'wd:Q175', RJ: 'wd:Q41428', MG: 'wd:Q39109' };
const CAMPOS = ['site', 'endereco', 'telefone'];

const normalizar = texto => texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
const slug = texto => normalizar(texto).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// id → { nome, uf }, só de quem tem algum link ativo.
const clientes = new Map();
for (const arquivo of readdirSync(PASTA).filter(a => a.endsWith('.json'))) {
  const dados = JSON.parse(readFileSync(new URL(arquivo, PASTA)));
  for (const grupo of dados.grupos ?? []) {
    const uf = UFS[grupo.nome];
    if (!uf) continue;
    for (const item of grupo.itens) {
      const nome = item.cliente.replace(/\s+Homolog\.?$/i, '').trim();
      const id = `${slug(nome)}-${uf.toLowerCase()}`;
      if (!item.inativo && !clientes.has(id)) clientes.set(id, { nome, uf });
    }
  }
}

// Uma consulta para todos os municípios dos três estados; o rótulo do Wikidata também corrige o nome sem acento.
async function municipiosWikidata() {
  const consulta = `SELECT ?uf ?nome ?site WHERE {
    VALUES (?estado ?uf) { ${Object.entries(ESTADOS_WIKIDATA).map(([uf, q]) => `(${q} "${uf}")`).join(' ')} }
    ?m wdt:P31 wd:Q3184121; wdt:P131 ?estado; rdfs:label ?nome. FILTER(LANG(?nome) = "pt")
    OPTIONAL { ?m wdt:P856 ?site } }`;
  const resposta = await fetch(`https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(consulta)}`, {
    headers: { 'user-agent': 'atalhos-embras/1.0 (jonathanwilliam01)', accept: 'application/sparql-results+json' },
    signal: AbortSignal.timeout(60000)
  });
  const municipios = new Map();
  for (const b of (await resposta.json()).results.bindings) {
    const chave = `${slug(b.nome.value)}-${b.uf.value.toLowerCase()}`;
    const atual = municipios.get(chave) ?? { nome: b.nome.value, sites: [] };
    if (b.site) atual.sites.push(b.site.value);
    municipios.set(chave, atual);
  }
  return municipios;
}

// Segue também o redirecionamento por <meta http-equiv="refresh">, comum nas páginas iniciais.
async function baixar(url, saltos = 3, tentativa = 1) {
  try {
    const resposta = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS), headers: HEADERS });
    if (!resposta.ok) return null;
    const bytes = Buffer.from(await resposta.arrayBuffer());
    let html;
    try {
      html = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    } catch {
      html = new TextDecoder('latin1').decode(bytes);
    }
    const destino = html.match(/<meta[^>]+http-equiv=["']?refresh["']?[^>]*content=["']?\d+\s*;\s*url=([^"'>\s]+)/i)?.[1];
    if (destino && saltos) return baixar(new URL(destino, resposta.url).href, saltos - 1);
    return { url: resposta.url, html };
  } catch (erro) {
    if (erro.name === 'TimeoutError' && tentativa < 2) return baixar(url, saltos, tentativa + 1);
    // Certificado incompleto em alguns sites: tenta a mesma página por http.
    return url.startsWith('https:') ? baixar(url.replace(/^https:/, 'http:'), saltos) : null;
  }
}

const ENTIDADES = { nbsp: ' ', amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', ordm: 'º', ordf: 'ª', deg: '°', ndash: '–', mdash: '—' };
const decodificarEntidades = texto => texto
  .replace(/&#x([\da-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
  .replace(/&([a-z]+);/gi, (m, e) => ENTIDADES[e.toLowerCase()] ?? m);

// HTML → linhas de texto; tags de bloco viram quebra de linha.
function linhasDoHtml(html) {
  const texto = html
    .replace(/<(script|style|noscript|svg|head)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(br|\/p|\/div|\/li|\/td|\/tr|\/h\d|\/address|\/section|\/footer|p|div|li|h\d|footer|section|address)\b[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ');
  return decodificarEntidades(texto).split('\n').map(l => l.replace(/\s+/g, ' ').trim()).filter(Boolean);
}

const LOGRADOURO = /\b(Rua|R\.|Avenida|Av\.?|Pra[çc]a|P[çc]a\.?|Largo|Travessa|Rodovia|Estrada|Alameda|Pa[çc]o Municipal)\s/i;
const CEP = /\b\d{2}\.?\d{3}-?\d{3}\b/;
const TELEFONE = /(?:(?:\+?55\s*)?\(?\s*\b(\d{2})\)?[\s.-]*)?\b(\d{4,5})[\s.-]?(\d{4})\b/g;
const ROTULO_TELEFONE = /(tel(efone)?s?|fone|pabx)\.?\s*:?\s*$/i;
const SEDE = /prefeitura|pa[çc]o|sede|pabx|central|telefone|tel\b|fone|endere[çc]o|contato/i;
const OUTRO_ORGAO = /secretaria|ouvidoria|conselho|escola|ubs|hospital|sa[úu]de|c[âa]mara|procon|cras|creas|defesa civil|guarda|e-?mail|whats/i;

function pontuar(linhas, i, peso) {
  const vizinhas = linhas.slice(Math.max(0, i - 2), i + 1).join(' ');
  let pontos = peso;
  if (SEDE.test(vizinhas)) pontos += 2;
  if (OUTRO_ORGAO.test(vizinhas)) pontos -= 3;
  if (i > linhas.length * 0.7) pontos += 2;
  return pontos;
}

// Número sem DDD só vale logo após "Telefone:"/"PABX", e recebe o DDD mais comum da página.
// Pontuação mínima 1: telefone de ouvidoria ou secretaria fica de fora mesmo sem alternativa.
function extrairTelefone(linhas, desconto = 0) {
  const achados = linhas.flatMap((linha, i) => [...linha.matchAll(TELEFONE)].map(m => ({ linha, i, m })));
  const contagem = {};
  for (const { m } of achados) if (m[1]) contagem[m[1]] = (contagem[m[1]] ?? 0) + 1;
  const dddComum = Object.entries(contagem).sort((a, b) => b[1] - a[1])[0]?.[0];
  let melhor = null;
  for (const { linha, i, m: { 1: lido, 2: prefixo, 3: final, index } } of achados) {
    const antes = linha.slice(Math.max(0, index - 25), index);
    const ddd = lido ?? (ROTULO_TELEFONE.test(antes) ? dddComum : null);
    if (!ddd || prefixo.length === 5 || !/^[1-9]{2}$/.test(ddd)) continue;
    let pontos = pontuar(linhas, i, (/pabx|pa[çc]o|prefeitura/i.test(antes) ? 3 : 0) - (OUTRO_ORGAO.test(antes) ? 3 : 0));
    if (OUTRO_ORGAO.test(linha)) pontos -= 2;
    pontos -= desconto;
    if (pontos > 0 && (!melhor || pontos > melhor.pontos)) melhor = { pontos, valor: `(${ddd}) ${prefixo}-${final}` };
  }
  return melhor?.valor;
}

function extrairEndereco(linhas, nome) {
  let melhor = null;
  linhas.forEach((linha, i) => {
    const inicio = linha.search(LOGRADOURO);
    if (inicio < 0 || linha.length > 250) return;
    const partes = [linha.slice(inicio)];
    for (let j = i + 1; j < i + 4 && !CEP.test(partes.join(' ')) && linhas[j]?.length < 80; j++) {
      if (/\(\d{2}\)|@/.test(linhas[j])) {
        const cep = linhas[j].match(CEP);
        if (cep) partes.push(linhas[j].slice(0, cep.index + cep[0].length));
        break;
      }
      partes.push(linhas[j]);
    }
    let texto = partes.join(' - ').replace(/\s*-\s*(-\s*)+/g, ' - ');
    const cep = texto.match(CEP);
    if (cep) texto = texto.slice(0, cep.index + cep[0].length);
    texto = texto.split(/\s*(?:Tel(?:efone)?\.?|Fone|PABX|E-?mail|CNPJ|Hor[áa]rio|Atendimento|Segunda|Expediente)\b/i)[0].replace(/[\s,;|–-]+$/, '').trim();
    texto = texto.replace(/\s*[|•]\s*/g, ' - ').replace(/\s+,/g, ',').replace(/,(?=\S)/g, ', ');
    if (!/\d/.test(texto) || texto.length < 12) return;
    let pontos = pontuar(linhas, i, 0) + (cep ? 3 : 0) + (normalizar(texto).includes(normalizar(nome)) ? 1 : 0);
    if (/^Endere[çc]o/i.test(linha)) pontos += 1;
    if (!melhor || pontos > melhor.pontos) melhor = { pontos, valor: texto };
  });
  return melhor?.valor;
}

// Portais montados por JS trazem a sede num JSON embutido: "address": { "address_name", "number", ... }.
function sedeEmbutida(html) {
  const bloco = html.replaceAll('\\"', '"').match(/"address":\{[^{}]*"address_name"[^{}]*\}/)?.[0];
  if (!bloco) return {};
  try {
    const a = JSON.parse(bloco.slice(bloco.indexOf('{')));
    const endereco = `${a.address_name}${a.number ? `, ${a.number}` : ''}${a.neighborhood ? ` - ${a.neighborhood}` : ''}, ${a.city} - ${a.uf}${a.zip_code ? `, ${a.zip_code}` : ''}`;
    return { endereco: a.address_name && a.city ? endereco : undefined, telefone: a.phone?.match(/^\(\d{2}\) \d{4}-\d{4}$/)?.[0] };
  } catch {
    return {};
  }
}

// Links para páginas de contato na própria página inicial.
function paginasDeContato(pagina) {
  const origem = new URL(pagina.url);
  const achados = [];
  for (const [, href, texto] of pagina.html.matchAll(/<a\b[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    if (!/contato|fale[\s-]?conosco|ouvidoria|endere[çc]o|localiza|telefones/i.test(normalizar(`${href} ${texto.replace(/<[^>]+>/g, '')}`))) continue;
    try {
      const url = new URL(decodificarEntidades(href), origem);
      if (url.hostname.replace(/^www\./, '') === origem.hostname.replace(/^www\./, '') && !achados.includes(url.href)) achados.push(url.href);
    } catch {}
  }
  return achados.filter(url => !/sa[uú]de|educa|secretaria|conselho/i.test(url))
    .sort((a, b) => /ouvidoria/i.test(a) - /ouvidoria/i.test(b)).slice(0, 3);
}

async function buscarFicha(nome, site) {
  const ficha = {};
  const inicial = await baixar(site);
  if (!inicial) return ficha;
  ficha.site = new URL(inicial.url).origin;
  const linhas = linhasDoHtml(inicial.html);
  ficha.endereco = extrairEndereco(linhas, nome);
  ficha.telefone = extrairTelefone(linhas);
  const embutida = sedeEmbutida(inicial.html);
  ficha.endereco ??= embutida.endereco;
  ficha.telefone ??= embutida.telefone;
  for (const url of paginasDeContato(inicial)) {
    if (ficha.endereco && ficha.telefone) break;
    const pagina = await baixar(url);
    if (!pagina) continue;
    const linhasContato = linhasDoHtml(pagina.html);
    ficha.endereco ??= extrairEndereco(linhasContato, nome);
    // Na página da ouvidoria, o telefone do corpo costuma ser o dela; o do rodapé ainda vale.
    ficha.telefone ??= extrairTelefone(linhasContato, /ouvidoria/i.test(url) ? 2 : 0);
  }
  return ficha;
}

const fichas = existsSync(SAIDA) ? JSON.parse(readFileSync(SAIDA, 'utf8')) : {};
const municipios = await municipiosWikidata();
const faltas = [];

const fila = [...clientes].filter(([id]) => municipios.has(id));
await Promise.all(Array.from({ length: PARALELOS }, async () => {
  for (let proximo; (proximo = fila.shift()); ) {
    const [id, { uf }] = proximo;
    const { nome, sites } = municipios.get(id);
    const atual = REFAZER ? {} : (fichas[id] ?? {});
    if (CAMPOS.every(c => atual[c])) continue;
    const site = atual.site ?? new URL(sites.find(s => s.startsWith('https')) ?? sites[0]
      ?? `https://www.${slug(nome).replaceAll('-', '')}.${uf.toLowerCase()}.gov.br`).origin;
    const achado = await buscarFicha(nome, site);
    const ficha = {};
    for (const campo of CAMPOS) {
      // Site que abriu agora (já com o redirecionamento) troca o salvo: falha passageira não deixa o fallback preso.
      const valor = campo === 'site' ? achado.site ?? atual.site ?? site : atual[campo] ?? achado[campo];
      if (valor) ficha[campo] = valor;
    }
    fichas[id] = ficha;
    const vazios = CAMPOS.filter(c => !ficha[c]);
    if (vazios.length) faltas.push(`${id}: sem ${vazios.join(', ')}${achado.site ? '' : ` (site não abriu: ${site})`}`);
  }
}));

const ignorados = [...clientes.keys()].filter(id => !municipios.has(id));
const ids = Object.keys(fichas).sort();
const linha = ficha => `{ ${CAMPOS.filter(c => ficha[c]).map(c => `"${c}": ${JSON.stringify(ficha[c])}`).join(', ')} }`;
writeFileSync(SAIDA, `{\n${ids.map(id => `  "${id}": ${linha(fichas[id])}`).join(',\n')}\n}\n`);

console.log(`${ids.length} fichas em src/app/clientes/clientes.json.`);
if (ignorados.length) console.log(`Fora (não é município no Wikidata): ${ignorados.join(', ')}`);
if (faltas.length) console.log(`Não encontrado:\n${faltas.sort().join('\n')}`);
