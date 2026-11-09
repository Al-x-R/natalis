import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SOURCE_URL } from '../api/client';
import type { Place } from '../api/types';
import { CitySearch } from '../components/CitySearch';
import { DateTimeField } from '../components/DateTimeField';
import { Button, Label } from '../components/ui';
import { parseOffset } from '../astro/glyphs';
import { strings } from '../i18n';
import { colors, radius, spacing } from '../theme';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

export default function FormScreen() {
  const s = strings();
  const [name, setName] = useState('');
  const [date, setDate] = useState('1990-01-01');
  const [time, setTime] = useState('12:00');
  const [place, setPlace] = useState<Place | null>(null);

  const [offsetText, setOffsetText] = useState('');

  const year = DATE_RE.test(date) ? Number(date.slice(0, 4)) : undefined;
  // The server's ephemeris files start in 1800.
  const yearOk = year !== undefined && year >= 1800;
  const offset = offsetText.trim() ? parseOffset(offsetText) : undefined;
  const offsetOk = !offsetText.trim() || offset !== undefined;
  const valid = !!place && yearOk && TIME_RE.test(time) && offsetOk;

  const submit = () => {
    if (!place) return;
    router.push({
      pathname: '/chart',
      params: { date, time, name, place: JSON.stringify(place), ...(offset !== undefined && { offset: String(offset) }) },
    });
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable onPress={() => router.push('/saved')} hitSlop={8}>
              <Text style={styles.headerLink}>{s.nav.saved}</Text>
            </Pressable>
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{s.form.title}</Text>

        <Label>{s.form.name}</Label>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder={s.form.namePlaceholder}
          placeholderTextColor={colors.muted}
        />

        <Label>{s.form.date}</Label>
        <DateTimeField mode="date" value={date} onChange={setDate} />
        {year !== undefined && !yearOk && <Text style={[styles.fieldHint, styles.fieldError]}>{s.form.dateRange}</Text>}
        {/* Old Style dates were still in use somewhere until 1923. */}
        {yearOk && year < 1924 && <Text style={styles.fieldHint}>{s.form.gregorianHint}</Text>}

        <Label>{s.form.time}</Label>
        <DateTimeField mode="time" value={time} onChange={setTime} />

        <Label>{s.form.city}</Label>
        <CitySearch value={place} onChange={setPlace} />

        <Label>{s.form.offset}</Label>
        <TextInput
          style={styles.input}
          value={offsetText}
          onChangeText={setOffsetText}
          placeholder={s.form.offsetPlaceholder}
          placeholderTextColor={colors.muted}
          keyboardType="numbers-and-punctuation"
          autoCorrect={false}
        />
        <Text style={[styles.fieldHint, !offsetOk && styles.fieldError]}>
          {offsetOk ? s.form.offsetHint : s.form.offsetInvalid}
        </Text>

        <Button title={s.form.submit} onPress={submit} disabled={!valid} style={{ marginTop: spacing(8) }} />
        {!place && <Text style={styles.hint}>{s.form.selectCity}</Text>}

        <View style={styles.about}>
          <Text style={styles.aboutText}>{s.about.engine}</Text>
          <Text style={[styles.aboutText, styles.aboutLink]} accessibilityRole="link" onPress={() => Linking.openURL(SOURCE_URL)}>
            {s.about.source}
          </Text>
          <Text style={styles.aboutText}>{s.about.data}</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing(4), paddingBottom: spacing(12) },
  title: { color: colors.text, fontSize: 26, fontWeight: '700', marginTop: spacing(2) },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius,
    color: colors.text,
    fontSize: 16,
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(3),
  },
  about: { marginTop: spacing(10), gap: spacing(1) },
  aboutText: { color: colors.muted, fontSize: 11, lineHeight: 16, textAlign: 'center' },
  aboutLink: { color: colors.accent, textDecorationLine: 'underline' },
  fieldHint: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: spacing(2) },
  fieldError: { color: colors.danger },
  hint: { color: colors.muted, fontSize: 13, textAlign: 'center', marginTop: spacing(3) },
  headerLink: { color: colors.accent, fontSize: 16 },
});
