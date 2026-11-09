import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ChartRequest, ChartResponse, Place } from '../api/types';

const KEY = 'natalis.savedCharts.v1';

export interface SavedChart {
  id: string;
  name: string;
  place: Place;
  request: ChartRequest;
  /** Stored so saved charts open offline. */
  result: ChartResponse;
  createdAt: string;
}

export async function listSaved(): Promise<SavedChart[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as SavedChart[];
  } catch {
    return [];
  }
}

export async function getSaved(id: string): Promise<SavedChart | undefined> {
  return (await listSaved()).find((c) => c.id === id);
}

export async function saveChart(chart: Omit<SavedChart, 'id' | 'createdAt'>): Promise<SavedChart> {
  const entry: SavedChart = {
    ...chart,
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(KEY, JSON.stringify([entry, ...(await listSaved())]));
  return entry;
}

export async function deleteSaved(id: string): Promise<void> {
  const rest = (await listSaved()).filter((c) => c.id !== id);
  await AsyncStorage.setItem(KEY, JSON.stringify(rest));
}
