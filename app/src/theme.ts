import type { AspectType, SignName } from './api/types';

export const colors = {
  bg: '#0B0D17',
  surface: '#151827',
  surfaceAlt: '#1C2033',
  border: '#2A2F48',
  text: '#ECEAF4',
  muted: '#8A8FA8',
  accent: '#C9A86A',
  danger: '#E5736B',
  harmonious: '#6FA8DC',
  tense: '#E5736B',
  neutral: '#C9A86A',
};

/** Shared by the wheel and the aspect list: tense red, harmonious blue. */
export const aspectColors: Record<AspectType, string> = {
  conjunction: colors.neutral,
  trine: colors.harmonious,
  sextile: colors.harmonious,
  square: colors.tense,
  opposition: colors.tense,
};

export const elementColors = {
  fire: '#E8896F',
  earth: '#8FBF9F',
  air: '#E6CF8B',
  water: '#7AA9E0',
};

const ELEMENTS: Record<SignName, keyof typeof elementColors> = {
  Aries: 'fire',
  Leo: 'fire',
  Sagittarius: 'fire',
  Taurus: 'earth',
  Virgo: 'earth',
  Capricorn: 'earth',
  Gemini: 'air',
  Libra: 'air',
  Aquarius: 'air',
  Cancer: 'water',
  Scorpio: 'water',
  Pisces: 'water',
};

export const signColor = (sign: SignName) => elementColors[ELEMENTS[sign]];

export const spacing = (n: number) => n * 4;
export const radius = 12;
