import type { Angle, Aspect, House, Planet } from '../api/types';
import { fmt, strings } from '../i18n';

/** One-line explanations shown under each row of the chart screen. */

export function planetText(p: Planet): string {
  const t = strings().interp;
  return fmt(t.planetText, { meaning: t.planets[p.name], style: t.signs[p.sign], area: t.houses[p.house] ?? '' });
}

export function houseText(h: House): string {
  const t = strings().interp;
  return fmt(t.houseText, { area: t.houses[h.number] ?? '', style: t.signs[h.sign] });
}

export function angleText(kind: 'asc' | 'mc', a: Angle): string {
  const t = strings().interp;
  return fmt(t.angleText, { meaning: t.angles[kind], style: t.signs[a.sign] });
}

export function aspectText(a: Aspect): string {
  const t = strings().interp;
  return fmt(t.aspectText, { meaning: t.aspects[a.type], key1: t.keys[a.planet1], key2: t.keys[a.planet2] });
}
