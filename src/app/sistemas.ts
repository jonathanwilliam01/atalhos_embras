import { DadosSistema } from './shared/sistema-links/sistema-links.component';
import admWeb from './dados/adm-web.json';
import aten from './dados/aten.json';
import atendeMais from './dados/atende-mais.json';
import configEgov from './dados/config-egov.json';
import egov from './dados/egov.json';
import egovDev from './dados/egov-dev.json';
import gcc from './dados/gcc.json';
import goglobal from './dados/goglobal.json';
import gproWeb from './dados/gpro-web.json';
import inscritosDivida from './dados/inscritos-divida.json';
import issonline from './dados/issonline.json';
import issonlineDev from './dados/issonline-dev.json';
import itbi from './dados/itbi.json';
import jucesp from './dados/jucesp.json';
import links from './dados/links.json';
import loginNovo from './dados/login-novo.json';
import novoTransparencia from './dados/novo-transparencia.json';
import pessoas from './dados/pessoas.json';
import portalTransparencia from './dados/portal-transparencia.json';
import segundaVia from './dados/segunda-via.json';
import setup from './dados/setup.json';
import suprimentos from './dados/suprimentos.json';
import transparenciaEgov from './dados/transparencia-egov.json';

export type Area = 'arrecadacao' | 'administracao' | 'financas' | 'suprimentos';

export const AREAS: { id: Area | ''; nome: string }[] = [
  { id: '', nome: 'Todas' },
  { id: 'arrecadacao', nome: 'Arrecadação' },
  { id: 'administracao', nome: 'Administração/RH' },
  { id: 'financas', nome: 'Finanças' },
  { id: 'suprimentos', nome: 'Suprimentos' }
];

// Tela sem área aparece em todos os filtros.
export interface Tela {
  id: string;
  nome: string;
  dados: DadosSistema;
  areas?: Area[];
  // Sistema com scrap de versão no /api/versao.
  versao?: string;
}

export interface ItemMenu {
  nome: string;
  icone: string;
  tela?: Tela;
  // Submenu: id do grupo e telas.
  grupo?: string;
  telas?: Tela[];
}

export const MENU: ItemMenu[] = [
  { nome: 'GoGlobal', icone: 'fa-solid fa-globe', tela: { id: 'GoGlobal', nome: 'GoGlobal', dados: goglobal } },
  {
    nome: 'E-Gov', icone: 'fa-solid fa-building-columns', grupo: 'egov', telas: [
      { id: 'egov', nome: 'E-Gov Prod.', dados: egov, versao: 'egov' },
      { id: 'egov_dev', nome: 'E-Gov Homol.', dados: egovDev },
      { id: 'config', nome: 'Config E-Gov', dados: configEgov },
      { id: 'segunda-via', nome: 'Nova Segunda Via', dados: segundaVia, areas: ['arrecadacao'] },
      { id: 'itbi', nome: 'ITBI', dados: itbi, areas: ['arrecadacao'], versao: 'itbi' },
      { id: 'transparencia-egov', nome: 'Transparência', dados: transparenciaEgov, areas: ['financas'], versao: 'transparencia-egov' }
    ]
  },
  {
    nome: 'IssOnline', icone: 'fa-regular fa-newspaper', grupo: 'IssOnline', telas: [
      { id: 'IssOnline', nome: 'IssOnline Prod.', dados: issonline, areas: ['arrecadacao'], versao: 'issonline' },
      { id: 'IssOnline-dev', nome: 'IssOnline Homol.', dados: issonlineDev, areas: ['arrecadacao'] }
    ]
  },
  { nome: 'Facilita-SP', icone: 'fa-solid fa-exchange', tela: { id: 'jucesp', nome: 'Facilita-SP', dados: jucesp, areas: ['arrecadacao'] } },
  { nome: 'Atende Mais', icone: 'fa-solid fa-phone', tela: { id: 'atende_mais', nome: 'Atende Mais', dados: atendeMais, areas: ['arrecadacao'] } },
  { nome: 'ATEN', icone: 'fa-solid fa-clipboard-list', tela: { id: 'aten', nome: 'ATEN', dados: aten, areas: ['administracao'], versao: 'aten' } },
  { nome: 'GPRO WEB', icone: 'fa-solid fa-folder-open', tela: { id: 'gpro-web', nome: 'GPRO WEB', dados: gproWeb, areas: ['administracao'], versao: 'gpro-web' } },
  { nome: 'ADM-Web', icone: 'fa-solid fa-desktop', tela: { id: 'adm-web', nome: 'ADM-Web', dados: admWeb, areas: ['administracao'] } },
  { nome: 'GCC', icone: 'fa-solid fa-file-text', tela: { id: 'gcc', nome: 'GCC', dados: gcc, areas: ['suprimentos'] } },
  { nome: 'Suprimentos', icone: 'fa-solid fa-boxes-stacked', tela: { id: 'suprimentos', nome: 'Suprimentos', dados: suprimentos, areas: ['suprimentos'] } },
  {
    nome: 'Transparência', icone: 'fa-solid fa-magnifying-glass-dollar', grupo: 'transparencia', telas: [
      { id: 'portal-transparencia', nome: 'Transparência', dados: portalTransparencia, areas: ['financas'], versao: 'portal-transparencia' },
      { id: 'novo-transparencia', nome: 'Novo Transparência', dados: novoTransparencia, areas: ['financas'] },
      { id: 'inscritos-divida', nome: 'Inscritos em Dívida', dados: inscritosDivida, areas: ['arrecadacao'] }
    ]
  },
  { nome: 'Config Contas', icone: 'fa-solid fa-user', tela: { id: 'login-novo', nome: 'Config Contas', dados: loginNovo } },
  { nome: 'Setup', icone: 'fa-solid fa-sliders', tela: { id: 'setup', nome: 'Setup', dados: setup } },
  { nome: 'Pessoas', icone: 'fa-solid fa-users', tela: { id: 'pessoas', nome: 'Pessoas', dados: pessoas } },
  { nome: 'Links Úteis', icone: 'fa-solid fa-link', tela: { id: 'links', nome: 'Links Úteis', dados: links } }
];

export const TELAS: Tela[] = MENU.flatMap(m => m.tela ? [m.tela] : m.telas ?? []);

export function telaPorId(id: string): Tela | undefined {
  return TELAS.find(t => t.id === id);
}

export function naArea(tela: Tela, area: Area | ''): boolean {
  return !area || !tela.areas || tela.areas.includes(area);
}
