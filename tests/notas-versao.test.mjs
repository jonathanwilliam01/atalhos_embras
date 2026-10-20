import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const { versoes } = JSON.parse(readFileSync(new URL('../src/app/notas-versao/notas_versao.json', import.meta.url), 'utf8'));
const comparar = (a, b) => a.localeCompare(b, undefined, { numeric: true });
const maior = versoes.map(v => v.versao).sort(comparar).at(-1);

for (const { versao, data, descricao } of versoes) {
  test(`nota ${versao}`, () => {
    const v = versao.match(/^V\d+\.(\d{2})\.(\d{2})\.\d{2}$/);
    assert.ok(v, 'versão fora do formato VM.AA.MM.NN');
    const d = data.match(/^(\d{2})\/(\d{2})\/\d{2}(\d{2})$/);
    assert.ok(d, 'data fora do formato DD/MM/AAAA');
    assert.deepEqual([v[1], v[2]], [d[3], d[2]], 'AA.MM da versão diferente da data');
    assert.ok(descricao.length && descricao.every(l => l.trim()), 'descrição vazia');
  });
}

test('versões únicas e em ordem crescente, com data que não volta', () => {
  const nomes = versoes.map(v => v.versao);
  assert.deepEqual(nomes, [...new Set(nomes)].sort(comparar));
  const dias = versoes.map(v => v.data.split('/').reverse().join(''));
  assert.deepEqual(dias, [...dias].sort());
});

// No CI: commit com nome de versão precisa ter a nota dessa versão como a mais nova.
test('commit de versão tem a nota', { skip: !/^V\d/.test(process.env.COMMIT_MSG ?? '') }, () => {
  assert.equal(process.env.COMMIT_MSG.split('\n')[0].trim(), maior);
});
