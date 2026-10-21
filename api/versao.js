const TIMEOUT_MS = 12000;
const TIMEOUT_BUNDLE_MS = 17000;
const TENTATIVAS = 2;

// e-Gov: "((2.2.240.7)" no rodapé; transparência do e-Gov: "(2.2.240.7)".
const VERSAO_EGOV = /\((\d+\.\d+\.\d+\.\d+)\)/;
// GPRO WEB: "Servicos On-line 2.2.240.7" no título, sem parênteses.
const VERSAO_TITULO = /<title>[^<]*?(\d+\.\d+\.\d+\.\d+)/;
const BASE_HREF = /<base href="([^"]+)"/;
const BUNDLE = /src="(main-es2015\.\w+\.js)"/;
// Setup: "geoSiap Setup - v1.26.11.231" no rodapé do login.
const VERSAO_SETUP = /Setup - v([\d.]+)/;
const VERSAO_ISS = /ISS Online v\.\s*([\d.]+)/;
// ITBI: versão própria no cabeçalho, "Versão: 1.000007" (o título traz a do E-Gov).
const VERSAO_ITBI = /Vers.{1,8}o:\s*([\d.]+)/;
const VERSAO_PORTAL = /"name":"portal-transparencia","version":"([\d.]+)"/;
const VERSAO_API = /"version":"v?([\d.]+)"/;

async function texto(url, timeout = TIMEOUT_MS) {
  const resposta = await fetch(url, { signal: AbortSignal.timeout(timeout) });
  return Buffer.from(await resposta.arrayBuffer()).toString('latin1');
}

// Tenta de novo em falha de rede/timeout: alguns servidores demoram quando recebem vários pedidos juntos.
// null = página sem versão; undefined = não respondeu.
async function comRetentativa(versao, url, tentativa = 1) {
  try {
    return await versao(url);
  } catch {
    return tentativa < TENTATIVAS ? comRetentativa(versao, url, tentativa + 1) : undefined;
  }
}

async function versaoEgov(url) {
  return (await texto(url)).match(VERSAO_EGOV)?.[1] ?? null;
}

async function versaoTitulo(url) {
  return (await texto(url)).match(VERSAO_TITULO)?.[1] ?? null;
}

async function versaoIss(url) {
  return (await texto(url)).match(VERSAO_ISS)?.[1] ?? null;
}

async function versaoSetup(url) {
  return (await texto(url)).match(VERSAO_SETUP)?.[1] ?? null;
}

async function versaoItbi(url) {
  return (await texto(url)).match(VERSAO_ITBI)?.[1] ?? null;
}

// Portal é SPA: a versão está no bundle (~7MB). Clientes na mesma build compartilham o arquivo, então baixa uma vez por nome.
const versoesBundle = new Map();

async function versaoPortal(url) {
  const html = await texto(url);
  const bundle = html.match(BUNDLE)?.[1];
  if (!bundle) return null;

  if (!versoesBundle.has(bundle)) {
    const urlBundle = new URL(bundle, new URL(html.match(BASE_HREF)?.[1] ?? './', url));
    const versao = texto(urlBundle, TIMEOUT_BUNDLE_MS).then(js => js.match(VERSAO_PORTAL)?.[1] ?? null);
    versao.then(v => v || versoesBundle.delete(bundle), () => versoesBundle.delete(bundle));
    versoesBundle.set(bundle, versao);
  }
  return versoesBundle.get(bundle);
}

// Sistemas Java: /<sistema>/api devolve "version" em JSON. Sem login, alguns respondem 401 mas ainda trazem a versão.
async function versaoApi(url) {
  const base = new URL(url);
  return (await texto(new URL(`/${base.pathname.split('/')[1]}/api`, base))).match(VERSAO_API)?.[1] ?? null;
}

const sistemas = {
  egov: { dados: require('../src/app/dados/egov.json'), versao: versaoEgov },
  aten: { dados: require('../src/app/dados/aten.json'), versao: versaoEgov },
  'gpro-web': { dados: require('../src/app/dados/gpro-web.json'), versao: versaoTitulo },
  issonline: { dados: require('../src/app/dados/issonline.json'), versao: versaoIss },
  setup: { dados: require('../src/app/dados/setup.json'), versao: versaoSetup },
  itbi: { dados: require('../src/app/dados/itbi.json'), versao: versaoItbi },
  'transparencia-egov': { dados: require('../src/app/dados/transparencia-egov.json'), versao: versaoEgov },
  'portal-transparencia': { dados: require('../src/app/dados/portal-transparencia.json'), versao: versaoPortal },
  jucesp: { dados: require('../src/app/dados/jucesp.json'), versao: versaoApi },
  gcc: { dados: require('../src/app/dados/gcc.json'), versao: versaoApi },
  pessoas: { dados: require('../src/app/dados/pessoas.json'), versao: versaoApi },
  suprimentos: { dados: require('../src/app/dados/suprimentos.json'), versao: versaoApi },
  'atende-mais': { dados: require('../src/app/dados/atende-mais.json'), versao: versaoApi }
};

// Retorna { url: versão | null | false } de todos os clientes ativos do sistema; false = não respondeu.
module.exports = async (req, res) => {
  const sistema = sistemas[req.query.sistema];
  if (!sistema) return res.status(400).json({ erro: 'Sistema inválido' });

  const urls = sistema.dados.grupos.flatMap(g => g.itens).filter(i => i.url && !i.inativo).map(i => i.url);
  const versoes = await Promise.all(urls.map(url => comRetentativa(sistema.versao, url)));

  // Versão muda pouco: o CDN responde na hora e atualiza em segundo plano.
  // Com cliente que não respondeu, cache curto para a falha não ficar presa.
  const cache = versoes.includes(undefined) ? 's-maxage=60, stale-while-revalidate=600' : 's-maxage=1800, stale-while-revalidate=86400';
  res.setHeader('Cache-Control', cache);
  res.status(200).json(Object.fromEntries(urls.map((url, i) => [url, versoes[i] === undefined ? false : versoes[i]])));
};

// Para os testes conferirem as telas com versão.
module.exports.sistemas = sistemas;
