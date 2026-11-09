import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { ApiError, fetchChart } from '../api/client';
import type { ApiErrorBody, ChartRequest, ChartResponse, Place } from '../api/types';
import { aspectGlyph, formatDegree, formatOffset, planetGlyph, signGlyph } from '../astro/glyphs';
import { angleText, aspectText, houseText, planetText } from '../astro/interpret';
import { ChartWheel } from '../components/ChartWheel';
import { placeLabel } from '../components/CitySearch';
import { displayValue } from '../components/DateTimeField';
import { Button, Section } from '../components/ui';
import { fmt, strings } from '../i18n';
import { getSaved, saveChart } from '../storage/savedCharts';
import { aspectColors, colors, signColor, spacing } from '../theme';

type Params = { date?: string; time?: string; name?: string; place?: string; offset?: string; savedId?: string };

type State =
  | { status: 'loading' }
  | { status: 'ok'; chart: ChartResponse; request: ChartRequest; place: Place; name: string }
  | { status: 'error'; code: string; body?: ApiErrorBody };

export default function ChartScreen() {
  const s = strings();
  const params = useLocalSearchParams<Params>();
  const { width } = useWindowDimensions();
  const [state, setState] = useState<State>({ status: 'loading' });
  const [savedId, setSavedId] = useState<string | undefined>(params.savedId);

  // Bumping `attempt` re-runs the effect (retry, or retry with a DST choice).
  const [attempt, setAttempt] = useState<{ n: number; disambiguation?: 'earlier' | 'later' }>({ n: 0 });

  useEffect(() => {
    let cancelled = false;
    const update = (next: State) => {
      if (!cancelled) setState(next);
    };
    (async () => {
      const saved = params.savedId ? await getSaved(params.savedId) : undefined;
      if (saved) {
        update({ status: 'ok', chart: saved.result, request: saved.request, place: saved.place, name: saved.name });
        return;
      }
      try {
        if (!params.date || !params.time || !params.place) throw new ApiError('INVALID_DATE', 'Missing params');
        const place = JSON.parse(params.place) as Place;
        const request: ChartRequest = {
          date: params.date,
          time: params.time,
          lat: place.lat,
          lon: place.lon,
          utcOffsetMinutes: params.offset ? Number(params.offset) : undefined,
          disambiguation: attempt.disambiguation,
        };
        const chart = await fetchChart(request);
        update({ status: 'ok', chart, request, place, name: params.name ?? '' });
      } catch (e) {
        const err = e instanceof ApiError ? e : new ApiError('UNKNOWN', String(e));
        update({ status: 'error', code: err.code, body: err.body });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params.savedId, params.date, params.time, params.place, params.name, params.offset, attempt]);

  const retry = (disambiguation?: 'earlier' | 'later') => {
    setState({ status: 'loading' });
    setAttempt((a) => ({ n: a.n + 1, disambiguation }));
  };

  if (state.status === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} size="large" />
        <Text style={styles.muted}>{s.chart.loading}</Text>
      </View>
    );
  }

  if (state.status === 'error') {
    const options = state.code === 'AMBIGUOUS_LOCAL_TIME' ? state.body?.details?.options : undefined;
    const message = s.errors[state.code as keyof typeof s.errors] ?? state.body?.message ?? s.errors.UNKNOWN;
    return (
      <View style={styles.center}>
        {options ? (
          <>
            <Text style={styles.errorTitle}>{s.chart.ambiguousTitle}</Text>
            <Text style={styles.errorText}>{s.chart.ambiguousText}</Text>
            {options.map((o) => (
              <Button
                key={o.disambiguation}
                variant="secondary"
                style={{ marginTop: spacing(3), alignSelf: 'stretch' }}
                title={fmt(o.disambiguation === 'earlier' ? s.chart.earlier : s.chart.later, {
                  offset: formatOffset(o.offsetMinutes),
                })}
                onPress={() => retry(o.disambiguation)}
              />
            ))}
          </>
        ) : (
          <>
            <Text style={styles.errorText}>{message}</Text>
            <Button title={s.chart.retry} variant="secondary" onPress={() => retry()} style={{ marginTop: spacing(4) }} />
          </>
        )}
      </View>
    );
  }

  const { chart, request, place, name } = state;
  const wheelSize = Math.min(width - spacing(8), 520);
  const notices: string[] = [];
  if (chart.localMeanTime) notices.push(s.chart.lmt);
  if (chart.manualOffset) notices.push(s.chart.manualOffset);
  if (chart.ephemeris === 'moshier') notices.push(s.chart.moshier);
  if (!chart.planets.some((p) => p.name === 'Chiron')) notices.push(s.chart.chironMissing);

  const onSave = async () => {
    const entry = await saveChart({
      name: name || placeLabel(place),
      place,
      request,
      result: chart,
    });
    setSavedId(entry.id);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen options={{ title: name || s.nav.chart }} />

      <Text style={styles.heading}>
        {displayValue('date', request.date)} · {request.time}
      </Text>
      <Text style={styles.muted}>{placeLabel(place)}</Text>
      <Text style={styles.small}>
        {s.chart.timezone}: {chart.manualOffset ? '' : `${chart.timezone} `}(UTC{formatOffset(chart.utcOffsetMinutes)}) · {s.chart.utc}{' '}
        {chart.utc.slice(0, 16).replace('T', ' ')}
      </Text>

      <View style={styles.wheel}>
        <ChartWheel chart={chart} size={wheelSize} />
      </View>

      {notices.map((n) => (
        <Text key={n} style={styles.notice}>
          {n}
        </Text>
      ))}

      <Button
        title={savedId ? s.chart.saved : s.chart.save}
        onPress={onSave}
        disabled={!!savedId}
        variant="secondary"
        style={{ marginTop: spacing(4) }}
      />

      <Section title={s.chart.planets}>
        {chart.planets.map((p, i) => (
          <Row key={p.name} first={i === 0} note={planetText(p)}>
            <Text style={styles.glyph}>{planetGlyph[p.name]}</Text>
            <Text style={styles.name}>{s.planets[p.name]}</Text>
            <Text style={[styles.glyphSmall, { color: signColor(p.sign) }]}>{signGlyph[p.sign]}</Text>
            <Text style={styles.value}>
              {formatDegree(p.degreeInSign)} {s.signs[p.sign]}
              {p.retrograde ? <Text style={{ color: colors.danger }}> R</Text> : null}
            </Text>
            <Text style={styles.house}>{p.house}</Text>
          </Row>
        ))}
      </Section>

      <Section title={s.chart.angles}>
        {(['asc', 'mc'] as const).map((k, i) => {
          const a = chart.angles[k];
          return (
            <Row key={k} first={i === 0} note={angleText(k, a)}>
              <Text style={[styles.glyph, styles.accent]}>{k === 'asc' ? 'AC' : 'MC'}</Text>
              <Text style={styles.name}>{s.chart[k]}</Text>
              <Text style={[styles.glyphSmall, { color: signColor(a.sign) }]}>{signGlyph[a.sign]}</Text>
              <Text style={styles.value}>
                {formatDegree(a.degreeInSign)} {s.signs[a.sign]}
              </Text>
            </Row>
          );
        })}
      </Section>

      <Section title={s.chart.houses}>
        {chart.houses.map((h, i) => (
          <Row key={h.number} first={i === 0} note={houseText(h)}>
            <Text style={[styles.glyph, styles.muted]}>{h.number}</Text>
            <Text style={styles.name}>
              {s.chart.house} {h.number}
            </Text>
            <Text style={[styles.glyphSmall, { color: signColor(h.sign) }]}>{signGlyph[h.sign]}</Text>
            <Text style={styles.value}>
              {formatDegree(h.degreeInSign)} {s.signs[h.sign]}
            </Text>
          </Row>
        ))}
      </Section>

      <Section title={s.chart.aspects}>
        {chart.aspects.length === 0 && (
          <Row first>
            <Text style={styles.muted}>{s.chart.noAspects}</Text>
          </Row>
        )}
        {chart.aspects.map((a, i) => (
          <Row key={`${a.planet1}-${a.planet2}`} first={i === 0} note={aspectText(a)}>
            <Text style={styles.aspectGlyphs}>
              {planetGlyph[a.planet1]} <Text style={{ color: aspectColors[a.type] }}>{aspectGlyph[a.type]}</Text>{' '}
              {planetGlyph[a.planet2]}
            </Text>
            <Text style={styles.name}>
              {s.planets[a.planet1]} — {s.planets[a.planet2]}
              {'\n'}
              <Text style={[styles.aspectType, { color: aspectColors[a.type] }]}>{s.aspects[a.type]}</Text>
            </Text>
            <Text style={styles.orb}>{fmt(s.chart.orb, { orb: formatDegree(a.orb) })}</Text>
          </Row>
        ))}
      </Section>
    </ScrollView>
  );
}

function Row({ children, first, note }: { children: React.ReactNode; first?: boolean; note?: string }) {
  return (
    <View style={[styles.rowWrap, !first && styles.rowBorder]}>
      <View style={styles.row}>{children}</View>
      {note ? <Text style={styles.note}>{note}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing(4), paddingBottom: spacing(16) },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing(6), gap: spacing(3) },
  heading: { color: colors.text, fontSize: 22, fontWeight: '700' },
  muted: { color: colors.muted, fontSize: 15 },
  small: { color: colors.muted, fontSize: 12, marginTop: spacing(1) },
  accent: { color: colors.accent, fontSize: 14, fontWeight: '700' },
  wheel: { alignItems: 'center', marginTop: spacing(5) },
  notice: { color: colors.accent, fontSize: 13, marginTop: spacing(3), textAlign: 'center' },
  errorTitle: { color: colors.text, fontSize: 20, fontWeight: '700', textAlign: 'center' },
  errorText: { color: colors.text, fontSize: 16, textAlign: 'center', lineHeight: 22 },
  rowWrap: { paddingHorizontal: spacing(4), paddingVertical: spacing(3) },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing(3) },
  // Indented past the glyph column (28 + gap) so it lines up with the name.
  note: { color: colors.muted, fontSize: 13, lineHeight: 18, marginTop: spacing(1), marginLeft: 28 + spacing(3) },
  rowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  glyph: { color: colors.text, fontSize: 20, width: 28, textAlign: 'center' },
  glyphSmall: { fontSize: 16, width: 20, textAlign: 'center' },
  name: { color: colors.text, fontSize: 15, flex: 1 },
  value: { color: colors.text, fontSize: 15, fontVariant: ['tabular-nums'] },
  house: { color: colors.muted, fontSize: 14, width: 22, textAlign: 'right', fontVariant: ['tabular-nums'] },
  aspectGlyphs: { color: colors.text, fontSize: 17, width: 72 },
  aspectType: { fontSize: 12, fontWeight: '600' },
  orb: { color: colors.muted, fontSize: 13, fontVariant: ['tabular-nums'] },
});
