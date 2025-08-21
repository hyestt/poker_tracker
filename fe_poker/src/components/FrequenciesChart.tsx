import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';
import type { FrequencyEntry } from '../viewmodels/FrequenciesViewModel';

type Props = {
  entries: FrequencyEntry[];
  noteMayNotSum100?: boolean;
};

export const FrequenciesChart: React.FC<Props> = ({ entries, noteMayNotSum100 }) => {
  const maxValue = useMemo(() => Math.max(1, ...entries.map((e) => e.value)), [entries]);

  if (!entries || entries.length === 0) {
    return (
      <Text style={styles.emptyText}>No frequency data</Text>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Frequencies</Text>
        {noteMayNotSum100 && (
          <Text style={styles.noteText}>May not sum to 100%</Text>
        )}
      </View>

      {entries.map((e) => {
        const widthPercent = Math.max(4, e.value); // 確保最小視覺寬度
        return (
          <View key={e.key} style={styles.row} accessibilityLabel={`${e.label}, ${e.display}`}>
            <View style={styles.labelsRow}>
              <Text style={styles.label}>{e.label}</Text>
              <Text style={styles.valueText}>{e.display}</Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${widthPercent}%`, backgroundColor: e.color }]} />
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  sectionTitle: {
    fontSize: theme.font.size.body,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  noteText: {
    fontSize: theme.font.size.small,
    color: theme.colors.gray,
  },
  row: {
    marginTop: theme.spacing.xs,
  },
  labelsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    color: '#E5E7EB',
    fontSize: 13,
  },
  valueText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  track: {
    height: 14,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 8,
  },
  emptyText: {
    color: theme.colors.gray,
    fontSize: theme.font.size.small,
  },
});


