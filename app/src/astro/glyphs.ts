import type { AspectType, BodyName, SignName } from '../api/types';

// U+FE0E forces text (not emoji) presentation, otherwise iOS draws zodiac signs as colored emoji.
const T = '︎';

export const planetGlyph: Record<BodyName, string> = {
  Sun: '☉' + T,
  Moon: '☽' + T,
  Mercury: '☿' + T,
  Venus: '♀' + T,
  Mars: '♂' + T,
  Jupiter: '♃' + T,
  Saturn: '♄' + T,
  Uranus: '♅' + T,
  Neptune: '♆' + T,
  Pluto: '♇' + T,
  TrueNode: '☊' + T,
  Chiron: '⚷' + T,
};

export const signGlyph: Record<SignName, string> = {
  Aries: '♈' + T,
  Taurus: '♉' + T,
  Gemini: '♊' + T,
  Cancer: '♋' + T,
  Leo: '♌' + T,
  Virgo: '♍' + T,
  Libra: '♎' + T,
  Scorpio: '♏' + T,
  Sagittarius: '♐' + T,
  Capricorn: '♑' + T,
  Aquarius: '♒' + T,
  Pisces: '♓' + T,
};

export const aspectGlyph: Record<AspectType, string> = {
  conjunction: '☌' + T,
  opposition: '☍' + T,
  trine: '△',
  square: '□',
  sextile: '✶',
};

/** 23.508 → "23°30′" (minutes truncated, as in printed ephemerides). */
export function formatDegree(deg: number): string {
  let d = Math.floor(deg);
  let m = Math.floor((deg - d) * 60 + 1e-9);
  if (m === 60) {
    d += 1;
    m = 0;
  }
  return `${d}°${String(m).padStart(2, '0')}′`;
}

/** "+2", "-5:30", "3" → minutes east of UTC; undefined if not a valid offset. */
export function parseOffset(text: string): number | undefined {
  const m = /^([+\-−]?)(\d{1,2})(?::([0-5]\d))?$/.exec(text.trim());
  if (!m) return undefined;
  const minutes = Number(m[2]) * 60 + Number(m[3] ?? 0);
  if (minutes > 15 * 60) return undefined;
  return m[1] === '-' || m[1] === '−' ? -minutes : minutes;
}

export function formatOffset(minutes: number): string {
  const abs = Math.round(Math.abs(minutes));
  return `${minutes < 0 ? '−' : '+'}${Math.floor(abs / 60)}${abs % 60 ? ':' + String(abs % 60).padStart(2, '0') : ''}`;
}
