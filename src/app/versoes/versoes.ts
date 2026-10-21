// Versões dos clientes vindas do /api/versao; false = cliente não respondeu na última verificação.
export type Versoes = Record<string, string | null | false>;

const CHAVE_VERSOES = 'versoesClientes';
const cacheVersoes = new Map<string, Versoes>();
const consultas = new Map<string, Promise<Versoes>>();

// Última consulta de cada sistema, exibida enquanto a nova carrega.
function versoesSalvas(): Record<string, Versoes> {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_VERSOES) ?? '{}') ?? {};
  } catch {
    return {};
  }
}

function salvarVersoes(sistema: string, versoes: Versoes): void {
  try {
    localStorage.setItem(CHAVE_VERSOES, JSON.stringify({ ...versoesSalvas(), [sistema]: versoes }));
  } catch {}
}

// Telas do E-Gov que têm a mesma versão por cliente; ficam em /<alias>/websis/. O ITBI tem versão própria.
const MESMA_VERSAO_EGOV = new Set(['egov', 'aten', 'gpro-web', 'transparencia-egov']);

function baseEgov(url: string): string | null {
  const i = url.indexOf('/websis/');
  return i < 0 ? null : url.slice(0, i);
}

// Versões que outra tela do E-Gov já carregou para estes clientes.
function versoesDoMesmoSistema(urls: string[]): Versoes {
  const porBase = new Map<string, string | null | false>();
  for (const [sistema, versoes] of cacheVersoes) {
    if (!MESMA_VERSAO_EGOV.has(sistema)) continue;
    for (const [url, v] of Object.entries(versoes)) {
      const base = baseEgov(url);
      if (base) porBase.set(base, v);
    }
  }
  const resultado: Versoes = {};
  for (const url of urls) {
    const base = baseEgov(url);
    if (base && porBase.has(base)) resultado[url] = porBase.get(base)!;
  }
  return resultado;
}

// Uma consulta por sistema, mesmo com várias telas pedindo ao mesmo tempo.
// forcar: parâmetro novo na URL para o CDN não devolver a resposta guardada.
function consultar(sistema: string, forcar = false): Promise<Versoes> {
  if (!consultas.has(sistema)) {
    consultas.set(sistema, fetch(`/api/versao?sistema=${sistema}${forcar ? `&atualizar=${Date.now()}` : ''}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((v: Versoes) => {
        cacheVersoes.set(sistema, v);
        salvarVersoes(sistema, v);
        return v;
      })
      .finally(() => consultas.delete(sistema)));
  }
  return consultas.get(sistema)!;
}

// Entrega na hora o que já houver (consulta desta visita, outra tela do E-Gov ou a última salva) e depois a consulta nova.
// carregando = nada aproveitável ainda.
export function carregarVersoes(sistema: string, urls: string[], aoMudar: (versoes: Versoes, carregando: boolean) => void): void {
  const cache = cacheVersoes.get(sistema);
  if (cache) {
    aoMudar(cache, false);
    return;
  }
  const doMesmoSistema = MESMA_VERSAO_EGOV.has(sistema) ? versoesDoMesmoSistema(urls) : {};
  const encontradas = Object.keys(doMesmoSistema).length;
  if (encontradas === urls.length) {
    cacheVersoes.set(sistema, doMesmoSistema);
    aoMudar(doMesmoSistema, false);
    return;
  }
  const iniciais = encontradas ? doMesmoSistema : versoesSalvas()[sistema] ?? {};
  aoMudar(iniciais, !encontradas);
  consultar(sistema).then(v => aoMudar(v, false), () => aoMudar(iniciais, false));
}

// Botão Atualizar visualização: consulta de novo agora, sem aproveitar nada guardado.
export function recarregarVersoes(sistema: string, atuais: Versoes, aoMudar: (versoes: Versoes, carregando: boolean) => void): void {
  cacheVersoes.delete(sistema);
  aoMudar(atuais, true);
  consultar(sistema, true).then(v => aoMudar(v, false), () => aoMudar(atuais, false));
}

export const compararVersao = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true });

// Versão atual do sistema: a maior entre os clientes. Build de staging ("10.1.staging.244") não conta.
export function versaoMaisRecente(versoes: (string | null | false)[]): string | null {
  let atual: string | null = null;
  for (const v of versoes) if (v && /^[\d.]+$/.test(v) && (!atual || compararVersao(v, atual) > 0)) atual = v;
  return atual;
}
