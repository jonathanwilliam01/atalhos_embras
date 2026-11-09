// Anotações pessoais por cliente (id → texto). Só neste navegador; vão junto no link de exportar.
export const CHAVE_ANOTACOES = 'anotacoesClientes';

export function lerAnotacoes(): Record<string, string> {
  try {
    const valor = JSON.parse(localStorage.getItem(CHAVE_ANOTACOES) ?? '{}');
    return valor && typeof valor === 'object' && !Array.isArray(valor) ? valor : {};
  } catch {
    return {};
  }
}

export function gravarAnotacoes(anotacoes: Record<string, string>): void {
  try { localStorage.setItem(CHAVE_ANOTACOES, JSON.stringify(anotacoes)); } catch {}
}

// Importação: o que falta entra; texto diferente do local é somado abaixo, sem perder nada.
export function mesclarAnotacoes(novas: unknown): void {
  if (!novas || typeof novas !== 'object' || Array.isArray(novas)) return;
  const atuais = lerAnotacoes();
  for (const [id, texto] of Object.entries(novas)) {
    if (typeof texto !== 'string' || !texto.trim()) continue;
    const atual = atuais[id]?.trim();
    atuais[id] = !atual || atual.includes(texto.trim()) ? (atual || texto) : `${atual}\n\n${texto}`;
  }
  gravarAnotacoes(atuais);
}
