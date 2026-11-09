import { test } from 'node:test';
import assert from 'node:assert/strict';
import { epocaDoDia, pascoa } from '../src/app/epoca/epocas.ts';

const dia = (s) => { const [d, m, a] = s.split('/').map(Number); return new Date(a, m - 1, d); };

test('Páscoa', () => {
  assert.equal(new Date(pascoa(2026)).toISOString().slice(0, 10), '2026-04-05');
  assert.equal(new Date(pascoa(2027)).toISOString().slice(0, 10), '2027-03-28');
});

test('épocas por data', () => {
  const casos = {
    '23/11/2026': null, '24/11/2026': 'natal', '25/12/2026': 'natal',
    '26/12/2026': 'ano-novo', '01/01/2027': 'ano-novo', '02/01/2027': 'ano-novo', '03/01/2027': null,
    '13/02/2027': null, '06/02/2027': 'carnaval', '09/02/2027': 'carnaval', '10/02/2027': 'carnaval', '11/02/2027': null,
    '21/03/2027': 'pascoa', '28/03/2027': 'pascoa', '29/03/2027': null,
    '01/06/2027': 'junina', '30/06/2027': 'junina', '01/07/2027': null,
    '25/10/2026': 'halloween', '31/10/2026': 'halloween', '09/11/2026': null,
  };
  for (const [d, esperado] of Object.entries(casos)) assert.equal(epocaDoDia(dia(d)), esperado, d);
});
