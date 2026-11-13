import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { agruparPorCliente, casaVersao, ehVersao, filtrarPorTermo, indexar, normalizar } from '../src/app/search/busca.ts';
import { iconesUsados } from '../scripts/icones.mjs';

const raiz = new URL('../', import.meta.url);
const ler = caminho => readFileSync(new URL(caminho, raiz), 'utf8');

// Telas do sistemas.ts (lido como texto) com o JSON de cada uma.
const sistemasTs = ler('src/app/sistemas.ts');
const jsons = Object.fromEntries([...sistemasTs.matchAll(/import (\w+) from '\.\/dados\/([^']+)'/g)].map(([, v, f]) => [v, f]));
const TELAS = [...sistemasTs.matchAll(/\{ id: '([^']+)', nome: '([^']+)', dados: (\w+)([^}]*)\}/g)]
  .map(([, id, nome, dados, resto]) => ({ id, nome, dados: JSON.parse(ler(`src/app/dados/${jsons[dados]}`)), apelidos: resto.match(/apelidos: '([^']+)'/)?.[1] }));

const entradas = indexar(TELAS);
const indice = entradas.map(e => e.r);
const textos = entradas.map(e => e.texto);
const buscar = termo => filtrarPorTermo(indice, textos, termo);
const egov = TELAS.find(t => t.id === 'egov');
const clienteEgov = egov.dados.grupos[0].itens.find(i => i.url && !i.inativo).cliente;

test('telas lidas do sistemas.ts', () => {
  assert.ok(TELAS.length > 15);
  assert.ok(indice.length > 400);
});

test('apelido acha a tela', () => {
  const doEgov = indice.filter(x => x.sistema === egov.dados.sistema);
  assert.deepEqual(buscar('tributario').filter(x => x.sistema === egov.dados.sistema), doEgov);
});

test('sem acento, sem caixa e em qualquer ordem', () => {
  const comAcento = indice.find(r => /[^\x00-\x7F]/.test(r.cliente) && r.local === 'São Paulo');
  assert.ok(comAcento, 'nenhum cliente com acento nos dados');
  const termo = normalizar(comAcento.cliente).toUpperCase();
  assert.ok(buscar(termo).some(r => r.url === comAcento.url));
  assert.deepEqual(buscar(`egov ${clienteEgov}`), buscar(`${clienteEgov} egov`));
});

test('todos os termos precisam bater', () => {
  assert.equal(buscar(`${clienteEgov} xyzsemresultado`).length, 0);
  assert.equal(buscar('   ').length, 0);
});

test('inativo e sem url ficam fora', () => {
  for (const t of TELAS) for (const g of t.dados.grupos) for (const i of g.itens) {
    if (i.inativo || !i.url) assert.ok(!indice.some(r => r.url === i.url && r.cliente === i.cliente), `${i.cliente} em ${t.id}`);
  }
});

test('Homolog. agrupa com o cliente e acento vence na exibição', () => {
  const r = { sistema: 'S', nomeSistema: 'S', local: 'São Paulo', url: 'x', host: 'x' };
  const grupos = agruparPorCliente([
    { ...r, cliente: 'Sao Jose', homolog: false },
    { ...r, cliente: 'São José Homolog.', homolog: true }
  ]);
  assert.equal(grupos.length, 1);
  assert.equal(grupos[0].cliente, 'São José');
  assert.equal(grupos[0].estado, 'SP');
});

test('busca por versão', () => {
  assert.ok(ehVersao('2.2.240'));
  assert.ok(ehVersao('2.2.'));
  assert.ok(!ehVersao('2'));
  assert.ok(!ehVersao('lorena'));
  assert.ok(casaVersao('2.2.240', '2.2.240'));
  assert.ok(casaVersao('2.2.240.7', '2.2.240'));
  assert.ok(casaVersao('2.2.240.7', '2.2.240.'));
  assert.ok(!casaVersao('2.2.2401', '2.2.240'));
  assert.ok(!casaVersao(false, '2.2'));
});

test('todo ícone usado está no icones.scss (rodar node scripts/icones.mjs)', () => {
  const scss = ler('src/icones.scss');
  const faltando = iconesUsados(fileURLToPath(new URL('src', raiz))).filter(n => !scss.includes(`.fa-${n} {`));
  assert.deepEqual(faltando, []);
});
