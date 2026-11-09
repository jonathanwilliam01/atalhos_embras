export type Epoca = 'carnaval' | 'pascoa' | 'junina' | 'halloween' | 'natal' | 'ano-novo';

export const EPOCAS: Epoca[] = ['carnaval', 'pascoa', 'junina', 'halloween', 'natal', 'ano-novo'];

const DIA = 86_400_000;

// Domingo de Páscoa (algoritmo de Meeus/Jones/Butcher), em UTC.
export function pascoa(ano: number): number {
  const a = ano % 19, b = Math.floor(ano / 100), c = ano % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31), dia = ((h + l - 7 * m + 114) % 31) + 1;
  return Date.UTC(ano, mes - 1, dia);
}

export function epocaDoDia(data = new Date()): Epoca | null {
  const ano = data.getFullYear(), mes = data.getMonth(), dia = data.getDate();
  const md = (mes + 1) * 100 + dia;
  const daPascoa = Math.round((Date.UTC(ano, mes, dia) - pascoa(ano)) / DIA);

  if (daPascoa >= -51 && daPascoa <= -46) return 'carnaval'; // sábado à quarta de cinzas
  if (daPascoa >= -7 && daPascoa <= 0) return 'pascoa';       // Domingo de Ramos à Páscoa
  if (md >= 601 && md <= 630) return 'junina';
  if (md >= 1025 && md <= 1031) return 'halloween';
  if (md >= 1124 && md <= 1225) return 'natal';
  if (md >= 1226 || md <= 102) return 'ano-novo';
  return null;
}
