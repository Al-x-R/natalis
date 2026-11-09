// Mirrors the POST /chart response of natalis-server (src/routes/chart.ts).

export type BodyName =
  | 'Sun'
  | 'Moon'
  | 'Mercury'
  | 'Venus'
  | 'Mars'
  | 'Jupiter'
  | 'Saturn'
  | 'Uranus'
  | 'Neptune'
  | 'Pluto'
  | 'TrueNode'
  | 'Chiron';

export const SIGNS = [
  'Aries',
  'Taurus',
  'Gemini',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Scorpio',
  'Sagittarius',
  'Capricorn',
  'Aquarius',
  'Pisces',
] as const;
export type SignName = (typeof SIGNS)[number];

export type AspectType = 'conjunction' | 'opposition' | 'trine' | 'square' | 'sextile';

export interface ChartRequest {
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  lat: number;
  lon: number;
  houseSystem?: 'P';
  /** Manual UTC offset (minutes east); skips the server's time zone lookup. */
  utcOffsetMinutes?: number;
  disambiguation?: 'earlier' | 'later';
}

export interface Planet {
  name: BodyName;
  longitude: number;
  sign: SignName;
  degreeInSign: number;
  house: number;
  retrograde: boolean;
}

export interface House {
  number: number;
  cusp: number;
  sign: SignName;
  degreeInSign: number;
}

export interface Angle {
  longitude: number;
  sign: SignName;
  degreeInSign: number;
}

export interface Aspect {
  planet1: BodyName;
  planet2: BodyName;
  type: AspectType;
  orb: number;
}

export interface ChartResponse {
  timezone: string;
  utcOffsetMinutes: number;
  localTime: string;
  utc: string;
  localMeanTime: boolean;
  /** Absent in charts saved before this field existed. */
  manualOffset?: boolean;
  planets: Planet[];
  houses: House[];
  angles: { asc: Angle; mc: Angle };
  aspects: Aspect[];
  ephemeris: string;
  warnings: string[];
}

export interface Place {
  name: string;
  country: string;
  region?: string;
  lat: number;
  lon: number;
  timezone?: string;
}

export interface ApiErrorBody {
  error: string;
  message: string;
  details?: {
    options?: { disambiguation: 'earlier' | 'later'; utc: string; offsetMinutes: number }[];
  };
}
