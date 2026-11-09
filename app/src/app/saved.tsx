import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { planetGlyph, signGlyph } from '../astro/glyphs';
import { displayValue } from '../components/DateTimeField';
import { placeLabel } from '../components/CitySearch';
import { fmt, strings } from '../i18n';
import { deleteSaved, listSaved, type SavedChart } from '../storage/savedCharts';
import { colors, radius, spacing } from '../theme';

export default function SavedScreen() {
  const s = strings();
  const [items, setItems] = useState<SavedChart[]>([]);

  useFocusEffect(
    useCallback(() => {
      listSaved().then(setItems);
    }, []),
  );

  const remove = (item: SavedChart) => {
    const doDelete = async () => {
      await deleteSaved(item.id);
      setItems(await listSaved());
    };
    const question = fmt(s.saved.deleteConfirm, { name: item.name || s.saved.unnamed });
    if (Platform.OS === 'web') {
      if (window.confirm(question)) doDelete();
      return;
    }
    Alert.alert(question, undefined, [
      { text: s.saved.cancel, style: 'cancel' },
      { text: s.saved.delete, style: 'destructive', onPress: doDelete },
    ]);
  };

  return (
    <FlatList
      data={items}
      keyExtractor={(c) => c.id}
      contentContainerStyle={styles.container}
      ListEmptyComponent={<Text style={styles.empty}>{s.saved.empty}</Text>}
      renderItem={({ item }) => {
        const sun = item.result.planets.find((p) => p.name === 'Sun');
        const moon = item.result.planets.find((p) => p.name === 'Moon');
        const asc = item.result.angles.asc;
        return (
          <Pressable
            onPress={() => router.push({ pathname: '/chart', params: { savedId: item.id } })}
            onLongPress={() => remove(item)}
            style={({ pressed }) => [styles.card, pressed && { backgroundColor: colors.surfaceAlt }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name || s.saved.unnamed}</Text>
              <Text style={styles.sub}>
                {displayValue('date', item.request.date)} · {item.request.time} · {placeLabel(item.place)}
              </Text>
              <Text style={styles.big3}>
                {sun && `${planetGlyph.Sun} ${signGlyph[sun.sign]}   `}
                {moon && `${planetGlyph.Moon} ${signGlyph[moon.sign]}   `}
                {`AC ${signGlyph[asc.sign]}`}
              </Text>
            </View>
            <Pressable onPress={() => remove(item)} hitSlop={10}>
              <Text style={styles.delete}>{s.saved.delete}</Text>
            </Pressable>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing(4), gap: spacing(3), flexGrow: 1 },
  empty: { color: colors.muted, fontSize: 15, textAlign: 'center', marginTop: spacing(20) },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius,
    padding: spacing(4),
    gap: spacing(3),
  },
  name: { color: colors.text, fontSize: 17, fontWeight: '600' },
  sub: { color: colors.muted, fontSize: 13, marginTop: spacing(1) },
  big3: { color: colors.accent, fontSize: 15, marginTop: spacing(2) },
  delete: { color: colors.danger, fontSize: 14 },
});
