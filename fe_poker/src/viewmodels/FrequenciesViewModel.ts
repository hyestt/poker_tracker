import { theme } from '../theme';

export type FrequencyEntry = {
  key: string;
  label: string;
  value: number; // 0..100（四捨五入）
  display: string; // e.g., "70%"
  rank: number; // 1-based
  isTop3: boolean;
  color: string;
};

const frequencyLabelMap: Record<string, string> = {
  raise_3x: 'Raise 3X',
  raise_5x: 'Raise 5X',
  check: 'Check',
  fold: 'Fold',
  bet_33: 'Bet 33%',
  bet_50: 'Bet 50%',
  bet_75: 'Bet 75%',
  bet_100: 'Bet 100%',
  overbet: 'Overbet',
};

const toLabel = (key: string): string => {
  if (frequencyLabelMap[key]) return frequencyLabelMap[key];
  const normalized = key.replace(/_/g, ' ');
  return normalized.replace(/\b\w/g, (m) => m.toUpperCase());
};

const parsePercent = (value: unknown): number => {
  if (value == null) return 0;
  let num = 0;
  if (typeof value === 'number') {
    num = value;
  } else if (typeof value === 'string') {
    const cleaned = value.trim().replace(/%$/, '');
    const parsed = Number(cleaned);
    num = isNaN(parsed) ? 0 : parsed;
  }
  // clamp 0..100 並四捨五入
  num = Math.max(0, Math.min(100, Math.round(num)));
  return num;
};

const rankColor = (rank: number): string => {
  // Top3 採更亮的品牌色，其餘為藍色系
  if (rank === 1) return '#4ECDC4';
  if (rank === 2) return '#F7B733';
  if (rank === 3) return '#FF6B6B';
  return '#3B82F6';
};

export function buildFrequenciesViewModel(input: Record<string, unknown> | undefined | null): {
  entries: FrequencyEntry[];
  hasData: boolean;
  mayNotSum100: boolean;
} {
  if (!input || typeof input !== 'object') {
    return { entries: [], hasData: false, mayNotSum100: false };
  }

  const entriesRaw = Object.entries(input)
    .map(([key, v]) => ({ key, label: toLabel(key), value: parsePercent(v) }))
    // 過濾 0%
    .filter((e) => e.value > 0);

  // 依數值排序（由大到小）
  entriesRaw.sort((a, b) => b.value - a.value);

  const entries: FrequencyEntry[] = entriesRaw.map((e, idx) => ({
    key: e.key,
    label: e.label,
    value: e.value,
    display: `${e.value}%`,
    rank: idx + 1,
    isTop3: idx < 3,
    color: rankColor(idx + 1),
  }));

  const total = entries.reduce((sum, e) => sum + e.value, 0);

  return {
    entries,
    hasData: entries.length > 0,
    mayNotSum100: entries.length > 0 && total !== 100,
  };
}


