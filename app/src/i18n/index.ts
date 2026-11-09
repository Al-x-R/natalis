import { ru, type Strings } from './ru';

const languages: Record<string, Strings> = { ru };

// Single language for now; switch this (or read the device locale) when adding more.
let current: Strings = languages.ru!;

export function setLanguage(code: string) {
  current = languages[code] ?? languages.ru!;
}

export function strings(): Strings {
  return current;
}

/** Fill `{placeholders}` in a template string. */
export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));
}
