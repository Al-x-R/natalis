import Constants from 'expo-constants';
import type { ApiErrorBody, ChartRequest, ChartResponse, Place } from './types';

/**
 * EXPO_PUBLIC_API_URL wins. Otherwise reuse the dev machine's LAN IP that Expo
 * already knows (so Expo Go on a phone reaches the server), port
 * EXPO_PUBLIC_API_PORT or 3000.
 */
function resolveBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  return `http://${host ?? 'localhost'}:${process.env.EXPO_PUBLIC_API_PORT ?? '3000'}`;
}

export const API_URL = resolveBaseUrl();

/**
 * Where users can get the calculation server's source. The server runs Swiss
 * Ephemeris under AGPL-3.0, which requires offering it to everyone who uses it.
 */
export const SOURCE_URL = process.env.EXPO_PUBLIC_SOURCE_URL ?? 'https://github.com/Al-x-R/natalis-server';

export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly body?: ApiErrorBody,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, init);
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
    throw new ApiError('NETWORK', (e as Error).message);
  }
  const body = await res.json().catch(() => undefined);
  if (!res.ok) {
    const err = body as ApiErrorBody | undefined;
    throw new ApiError(err?.error ?? 'UNKNOWN', err?.message ?? `HTTP ${res.status}`, err);
  }
  return body as T;
}

export function fetchChart(req: ChartRequest): Promise<ChartResponse> {
  return request('/chart', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(req),
  });
}

export function searchCities(q: string, lang: string, signal?: AbortSignal): Promise<Place[]> {
  const params = new URLSearchParams({ q, lang, count: '8' });
  return request(`/geocode?${params}`, { signal });
}
