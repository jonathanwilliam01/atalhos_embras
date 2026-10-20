# Atalhos Embras

Portal de atalhos das equipes da Embras. Reúne em um só lugar os links dos sistemas dos municípios atendidos (arrecadação, administração/RH, finanças e suprimentos), organizados por estado (SP, RJ e MG).

Acesse: https://atalhos-embras.vercel.app/

O antigo Atalhos Tributário (https://projeto-tributario.vercel.app/) redireciona para cá e traz junto os favoritos e recentes.

## O que tem

- **Filtro de área** no menu lateral: Arrecadação, Administração/RH, Finanças ou Suprimentos.
- **Favoritos e Recentes**: marque links com estrela e veja os últimos abertos na tela inicial.
- **Busca rápida (Ctrl K)**: encontra qualquer link; setas percorrem os resultados e Enter abre.
- **Clientes**: todos os sistemas de cada município numa tela só, com a versão de cada um e filtro por nome ou estado. A visão **Versões** mostra clientes × sistemas numa tabela, destacando desatualizados e quem não respondeu.
- **E-Gov**: produção, homologação, configurações, Nova Segunda Via, ITBI e Transparência E-Gov.
- **IssOnline** (produção e homologação), **Facilita-SP / Jucesp** e **Atende Mais**.
- **ATEN**, **GPRO WEB**, **ADM-Web**, **GCC** (Gestão de Contratos e Convênios) e **Suprimentos**.
- **Transparência**: Portal da Transparência, Novo Transparência e Inscritos em Dívida.
- **GoGlobal**, **Setup**, **Pessoas**, **Config Contas** e **Links Úteis** (documentação, wiki, demandas e planilhas).
- **Versão dos clientes**: E-Gov, ITBI, IssOnline, Setup, ATEN, GPRO WEB, Transparência E-Gov e Portal da Transparência mostram a versão de cada município, destacam quem está desatualizado e quem não respondeu, com o botão **Atualizar visualização** para buscar de novo na hora.
- **Link direto para a tela** (ex.: `#egov`) e **sugestões pelo GitHub** na tela inicial.
- Pode ser instalado como aplicativo pelo botão **Instalar app**.

## Desenvolvimento

- Telas, menu, áreas e versões ficam em `src/app/sistemas.ts`; os links de cada tela, em `src/app/dados/<tela>.json`.
- Tela nova: criar o JSON em `dados/` e uma linha no `MENU`. Com versão, incluir também o sistema em `api/versao.js`.
- Toda segunda o GitHub Actions roda `scripts/verificar-links.mjs --corrigir`: links com endereço novo comprovado vão para o PR "Correção automática de links" (branch `correcao-links`) e os que continuam sem abrir ficam na issue "Links quebrados". Dá para rodar na aba Actions ou com `node scripts/verificar-links.mjs [--corrigir]`.
- `npm test` confere os JSONs de dados, as notas de versão e se as telas com versão batem com `api/versao.js`. Roda no GitHub a cada push e PR.
