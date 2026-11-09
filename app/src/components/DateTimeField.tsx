import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { strings } from '../i18n';
import { colors, radius, spacing } from '../theme';

/*
 * Values are plain strings ("YYYY-MM-DD" / "HH:mm"): a birth time is wall-clock
 * time at the birthplace, not an instant. The native picker runs in UTC so the
 * device's own timezone/DST never shifts what the user picked.
 */

type Mode = 'date' | 'time';

interface Props {
  mode: Mode;
  value: string;
  onChange: (value: string) => void;
}

const pad = (n: number) => String(n).padStart(2, '0');

function toDate(mode: Mode, value: string): Date {
  if (mode === 'date') {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(Date.UTC(y!, m! - 1, d!, 12));
  }
  const [h, mi] = value.split(':').map(Number);
  return new Date(Date.UTC(2000, 0, 1, h!, mi!));
}

function fromDate(mode: Mode, date: Date): string {
  return mode === 'date'
    ? `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`
    : `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
}

export function displayValue(mode: Mode, value: string): string {
  if (mode === 'time') return value;
  const [y, m, d] = value.split('-');
  return `${d}.${m}.${y}`;
}

// The bundled ephemeris files cover 1800–2400.
const MIN_DATE = new Date(Date.UTC(1800, 0, 1));
const MAX_DATE = new Date();

export function DateTimeField({ mode, value, onChange }: Props) {
  const s = strings();
  const [iosOpen, setIosOpen] = useState(false);
  const [draft, setDraft] = useState(value);

  if (Platform.OS === 'web') {
    return (
      <TextInput
        style={styles.field}
        value={value}
        onChangeText={onChange}
        placeholder={mode === 'date' ? s.form.webDateHint : s.form.webTimeHint}
        placeholderTextColor={colors.muted}
      />
    );
  }

  const open = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        mode,
        value: toDate(mode, value),
        is24Hour: true,
        timeZoneName: 'UTC',
        minimumDate: mode === 'date' ? MIN_DATE : undefined,
        maximumDate: mode === 'date' ? MAX_DATE : undefined,
        onValueChange: (_e, date) => onChange(fromDate(mode, date)),
      });
    } else {
      setDraft(value);
      setIosOpen(true);
    }
  };

  return (
    <>
      <Pressable onPress={open} style={({ pressed }) => [styles.field, pressed && styles.pressed]}>
        <Text style={styles.value}>{displayValue(mode, value)}</Text>
      </Pressable>

      {Platform.OS === 'ios' && (
        <Modal transparent animationType="slide" visible={iosOpen} onRequestClose={() => setIosOpen(false)}>
          <Pressable style={styles.backdrop} onPress={() => setIosOpen(false)} />
          <View style={styles.sheet}>
            <DateTimePicker
              mode={mode}
              value={toDate(mode, draft)}
              display="spinner"
              timeZoneName="UTC"
              locale={s.locale}
              themeVariant="dark"
              textColor={colors.text}
              minimumDate={mode === 'date' ? MIN_DATE : undefined}
              maximumDate={mode === 'date' ? MAX_DATE : undefined}
              onValueChange={(_e, date) => setDraft(fromDate(mode, date))}
            />
            <Pressable
              style={styles.done}
              onPress={() => {
                onChange(draft);
                setIosOpen(false);
              }}
            >
              <Text style={styles.doneText}>{s.form.done}</Text>
            </Pressable>
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius,
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(3),
    color: colors.text,
    fontSize: 16,
  },
  pressed: { backgroundColor: colors.surfaceAlt },
  value: { color: colors.text, fontSize: 16 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    backgroundColor: colors.surface,
    paddingBottom: spacing(8),
    borderTopLeftRadius: radius * 1.5,
    borderTopRightRadius: radius * 1.5,
  },
  done: { alignSelf: 'stretch', marginHorizontal: spacing(4), padding: spacing(3), alignItems: 'center' },
  doneText: { color: colors.accent, fontSize: 17, fontWeight: '600' },
});
