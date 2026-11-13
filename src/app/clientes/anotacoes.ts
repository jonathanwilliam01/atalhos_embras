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

// Último link de exportar copiado: { quando, conteudo } para lembrar o backup das anotações.
const CHAVE_BACKUP = 'backupAnotacoes';
const DIAS_LEMBRAR_BACKUP = 7;

export function marcarBackupAnotacoes(): void {
  try { localStorage.setItem(CHAVE_BACKUP, JSON.stringify({ quando: Date.now(), conteudo: JSON.stringify(lerAnotacoes()) })); } catch {}
}

// "Lembrar depois": mantém o conteúdo do último backup e só renova a data.
export function adiarBackupAnotacoes(): void {
  try {
    const backup = JSON.parse(localStorage.getItem(CHAVE_BACKUP) ?? 'null');
    localStorage.setItem(CHAVE_BACKUP, JSON.stringify({ quando: Date.now(), conteudo: backup?.conteudo ?? null }));
  } catch {}
}

// Há anotação mudada desde o último backup e ele foi há mais de uma semana (ou nunca houve).
export function precisaBackupAnotacoes(agora = Date.now()): boolean {
  try {
    const atual = lerAnotacoes();
    if (!Object.values(atual).some(t => t.trim())) return false;
    const backup = JSON.parse(localStorage.getItem(CHAVE_BACKUP) ?? 'null');
    if (backup?.conteudo === JSON.stringify(atual)) return false;
    return !backup?.quando || agora - backup.quando > DIAS_LEMBRAR_BACKUP * 86400000;
  } catch {
    return false;
  }
}
