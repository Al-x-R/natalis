import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { searchCities } from '../api/client';
import type { Place } from '../api/types';
import { fmt, strings } from '../i18n';
import { colors, radius, spacing } from '../theme';

interface Props {
  value: Place | null;
  onChange: (place: Place | null) => void;
}

export const placeLabel = (p: Place) => [p.name, p.region, p.country].filter(Boolean).join(', ');

export function CitySearch({ value, onChange }: Props) {
  const s = strings();
  const [query, setQuery] = useState(value ? placeLabel(value) : '');
  const [results, setResults] = useState<Place[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'done'>('idle');
  const [open, setOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 2) return;
    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setStatus('loading');
      try {
        const places = await searchCities(q, s.geocodeLanguage, ctrl.signal);
        if (!ctrl.signal.aborted) {
          setResults(places);
          setStatus('done');
        }
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setStatus('error');
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [query, open, s.geocodeLanguage]);

  const select = (p: Place) => {
    onChange(p);
    setQuery(placeLabel(p));
    setOpen(false);
    setResults([]);
  };

  return (
    <View>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={query}
          placeholder={s.form.cityPlaceholder}
          placeholderTextColor={colors.muted}
          onChangeText={(t) => {
            setQuery(t);
            setOpen(true);
            if (t.trim().length < 2) {
              abortRef.current?.abort();
              setResults([]);
              setStatus('idle');
            }
            if (value) onChange(null);
          }}
          autoCorrect={false}
          returnKeyType="search"
        />
        {status === 'loading' && <ActivityIndicator color={colors.accent} style={styles.spinner} />}
      </View>

      {open && status === 'done' && results.length === 0 && <Text style={styles.hint}>{s.form.cityNothingFound}</Text>}
      {open && status === 'error' && <Text style={[styles.hint, { color: colors.danger }]}>{s.form.cityError}</Text>}

      {open && results.length > 0 && (
        <View style={styles.list}>
          {results.map((p, i) => (
            <Pressable
              key={`${p.lat},${p.lon},${i}`}
              onPress={() => select(p)}
              style={({ pressed }) => [styles.item, i > 0 && styles.itemBorder, pressed && styles.pressed]}
            >
              <Text style={styles.itemTitle}>{p.name}</Text>
              <Text style={styles.itemSub}>{[p.region, p.country].filter(Boolean).join(', ')}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {value && (
        <Text style={styles.hint}>{fmt(s.form.coordinates, { lat: value.lat.toFixed(4), lon: value.lon.toFixed(4) })}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inputRow: { justifyContent: 'center' },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius,
    color: colors.text,
    fontSize: 16,
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(3),
    paddingRight: spacing(10),
  },
  spinner: { position: 'absolute', right: spacing(3) },
  hint: { color: colors.muted, fontSize: 13, marginTop: spacing(2) },
  list: {
    marginTop: spacing(2),
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius,
    overflow: 'hidden',
  },
  item: { paddingHorizontal: spacing(4), paddingVertical: spacing(3) },
  itemBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  pressed: { backgroundColor: colors.surfaceAlt },
  itemTitle: { color: colors.text, fontSize: 16 },
  itemSub: { color: colors.muted, fontSize: 13, marginTop: 2 },
});
