// Clique no chip de versão: copia "Cliente · Sistema · versão" sem abrir o link.
export function copiarVersao(cliente: string, sistema: string, versao: string, event: Event): void {
  event.preventDefault();
  event.stopPropagation();
  const texto = `${cliente} · ${sistema} · ${versao}`;
  navigator.clipboard.writeText(texto).then(() => avisar(`Copiado: ${texto}`));
}

// Aviso rápido no rodapé; DOM direto para servir a qualquer tela.
function avisar(mensagem: string): void {
  document.querySelector('.aviso-copia')?.remove();
  const aviso = document.createElement('div');
  aviso.className = 'aviso-copia';
  aviso.setAttribute('role', 'status');
  aviso.textContent = mensagem;
  document.body.appendChild(aviso);
  setTimeout(() => aviso.remove(), 2200);
}
