import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const raiz = new URL('../', import.meta.url);
const ler = caminho => readFileSync(new URL(caminho, raiz), 'utf8');
const ESTADOS = ['São Paulo', 'Rio de Janeiro', 'Minas Gerais'];
// Telas que não são por município.
const SEM_ESTADO = ['links.json'];

const arquivos = readdirSync(new URL('src/app/dados/', raiz)).filter(a => a.endsWith('.json'));
const sistemasTs = ler('src/app/sistemas.ts');
const telas = [...sistemasTs.matchAll(/\{ id: '([^']+)'[^}]*dados:[^}]*\}/g)]
  .map(([obj, id]) => ({ id, versao: obj.match(/versao: '([^']+)'/)?.[1] }));

for (const arquivo of arquivos) {
  test(`dados/${arquivo}`, () => {
    const dados = JSON.parse(ler(`src/app/dados/${arquivo}`));
    assert.ok(dados.sistema && dados.titulo, 'sem sistema ou titulo');
    assert.ok(dados.grupos?.length, 'sem grupos');

    for (const imagem of dados.imagens) {
      assert.ok(existsSync(new URL(`src${imagem}`, raiz)), `imagem não existe: ${imagem}`);
    }
    if (!SEM_ESTADO.includes(arquivo)) {
      for (const grupo of dados.grupos) assert.ok(ESTADOS.includes(grupo.nome), `grupo fora de ESTADOS: "${grupo.nome}"`);
    }

    const urls = new Set();
    for (const grupo of dados.grupos) {
      for (const item of grupo.itens) {
        const onde = `${grupo.nome} · ${item.cliente}`;
        assert.ok(item.cliente?.trim(), `cliente vazio em ${grupo.nome}`);
        if (!item.url) continue;
        assert.doesNotMatch(item.url, /\s/, `url com espaço: ${onde}`);
        assert.match(new URL(item.url).protocol, /^https?:$/, `url sem http(s): ${onde}`);
        assert.ok(!urls.has(item.url), `url repetida: ${onde}`);
        urls.add(item.url);
      }
    }
  });
}

test('todo JSON de dados está no MENU', () => {
  for (const arquivo of arquivos) assert.ok(sistemasTs.includes(`'./dados/${arquivo}'`), `${arquivo} não é importado em sistemas.ts`);
});

test('ids de tela únicos', () => {
  const ids = telas.map(t => t.id);
  assert.ok(ids.length, 'nenhuma tela encontrada em sistemas.ts');
  assert.deepEqual(ids.filter((id, i) => ids.indexOf(id) !== i), []);
});

test('telas com versão batem com api/versao.js', () => {
  const { sistemas } = createRequire(import.meta.url)('../api/versao.js');
  const naTela = telas.map(t => t.versao).filter(Boolean).sort();
  assert.deepEqual(naTela, Object.keys(sistemas).sort());
});
