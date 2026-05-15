import React, { useCallback, useMemo } from 'react';
import {
  FlatList,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ListRenderItem,
} from 'react-native';
import { useChuckTSStore, getFilteredRecords } from '../store';
import { HttpRecord } from '../types';
import { colors, font, spacing, radius, methodColor, statusColor, statusBg } from './theme';
import { generateCurl } from '../core/curlGenerator';
import Clipboard from '@react-native-clipboard/clipboard';

const METHOD_FILTERS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const STATUS_FILTERS = ['2xx', '3xx', '4xx', '5xx'];

interface RequestItemProps {
  record: HttpRecord;
  onPress: () => void;
}

function RequestItem({ record, onPress }: RequestItemProps): React.ReactElement {
  const statusCode = record.statusCode;
  const pathOnly = extractPath(record.url);
  const durationStr = record.duration !== null ? `${record.duration}ms` : '…';
  const isError = record.status === 'error';

  return (
    <TouchableOpacity
      style={[styles.item, isError && styles.itemError]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.itemHeader}>
        <View style={[styles.methodBadge, { borderColor: methodColor(record.method) }]}>
          <Text style={[styles.methodText, { color: methodColor(record.method) }]}>
            {record.method}
          </Text>
        </View>

        {statusCode !== null && (
          <View style={[styles.statusBadge, { backgroundColor: statusBg(statusCode) }]}>
            <Text style={[styles.statusText, { color: statusColor(statusCode) }]}>
              {statusCode}
            </Text>
          </View>
        )}

        <Text style={styles.duration}>{durationStr}</Text>
      </View>

      <Text style={styles.url} numberOfLines={2}>{pathOnly}</Text>
      <Text style={styles.urlFull} numberOfLines={1}>{record.url}</Text>

      {record.error && (
        <Text style={styles.errorText} numberOfLines={1}>{record.error}</Text>
      )}
    </TouchableOpacity>
  );
}

export function RequestList(): React.ReactElement {
  const records = useChuckTSStore((s) => s.records);
  const filter = useChuckTSStore((s) => s.filter);
  const setFilter = useChuckTSStore((s) => s.setFilter);
  const resetFilter = useChuckTSStore((s) => s.resetFilter);
  const clearRecords = useChuckTSStore((s) => s.clearRecords);
  const selectRecord = useChuckTSStore((s) => s.selectRecord);

  const filtered = useMemo(() => getFilteredRecords(records, filter), [records, filter]);

  const renderItem: ListRenderItem<HttpRecord> = useCallback(
    ({ item }) => (
      <RequestItem record={item} onPress={() => selectRecord(item.id)} />
    ),
    [selectRecord]
  );

  const keyExtractor = useCallback((item: HttpRecord) => item.id, []);

  const toggleMethod = useCallback(
    (m: string) => {
      setFilter({
        methods: filter.methods.includes(m)
          ? filter.methods.filter((x) => x !== m)
          : [...filter.methods, m],
      });
    },
    [filter.methods, setFilter]
  );

  const toggleStatus = useCallback(
    (s: string) => {
      setFilter({
        statusCodes: filter.statusCodes.includes(s)
          ? filter.statusCodes.filter((x) => x !== s)
          : [...filter.statusCodes, s],
      });
    },
    [filter.statusCodes, setFilter]
  );

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search URL…"
          placeholderTextColor={colors.textFaint}
          value={filter.search}
          onChangeText={(t) => setFilter({ search: t })}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {(filter.search !== '' || filter.methods.length > 0 || filter.statusCodes.length > 0) && (
          <TouchableOpacity style={styles.clearBtn} onPress={resetFilter}>
            <Text style={styles.clearBtnText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Method filters */}
      <View style={styles.chipRow}>
        {METHOD_FILTERS.map((m) => (
          <TouchableOpacity
            key={m}
            style={[
              styles.chip,
              filter.methods.includes(m) && { backgroundColor: methodColor(m), borderColor: methodColor(m) },
            ]}
            onPress={() => toggleMethod(m)}
          >
            <Text
              style={[
                styles.chipText,
                { color: filter.methods.includes(m) ? colors.bg : methodColor(m) },
              ]}
            >
              {m}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Status filters */}
      <View style={styles.chipRow}>
        {STATUS_FILTERS.map((s) => (
          <TouchableOpacity
            key={s}
            style={[
              styles.chip,
              filter.statusCodes.includes(s) && styles.chipActive,
            ]}
            onPress={() => toggleStatus(s)}
          >
            <Text
              style={[
                styles.chipText,
                filter.statusCodes.includes(s) && styles.chipTextActive,
              ]}
            >
              {s}
            </Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={[styles.chip, styles.clearAllChip]} onPress={clearRecords}>
          <Text style={[styles.chipText, { color: colors.error }]}>Clear all</Text>
        </TouchableOpacity>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <Text style={styles.statsText}>
          {filtered.length} request{filtered.length !== 1 ? 's' : ''}
          {filtered.length !== records.length && ` (${records.length} total)`}
        </Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<EmptyState />}
        initialNumToRender={20}
        maxToRenderPerBatch={20}
        windowSize={10}
      />
    </View>
  );
}

function EmptyState(): React.ReactElement {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyEmoji}>📡</Text>
      <Text style={styles.emptyTitle}>No requests yet</Text>
      <Text style={styles.emptySubtitle}>Make an HTTP request to see it here</Text>
    </View>
  );
}

function extractPath(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.pathname + parsed.search;
  } catch {
    return url;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.bgInput,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontFamily: font.mono,
    fontSize: font.size.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  clearBtn: {
    backgroundColor: colors.bgInput,
    borderRadius: radius.full,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnText: {
    color: colors.textMuted,
    fontSize: font.size.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  chipActive: {
    backgroundColor: colors.info,
    borderColor: colors.info,
  },
  clearAllChip: {
    borderColor: colors.errorBg,
    marginLeft: 'auto',
  },
  chipText: {
    fontSize: font.size.xs,
    fontFamily: font.mono,
    color: colors.textMuted,
  },
  chipTextActive: {
    color: colors.bg,
  },
  statsRow: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
  },
  statsText: {
    fontSize: font.size.xs,
    color: colors.textFaint,
    fontFamily: font.sans,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  item: {
    backgroundColor: colors.bgCard,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemError: {
    borderColor: colors.errorBg,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  methodBadge: {
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  methodText: {
    fontSize: font.size.xs,
    fontFamily: font.mono,
    fontWeight: '700',
  },
  statusBadge: {
    borderRadius: radius.sm,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  statusText: {
    fontSize: font.size.xs,
    fontFamily: font.mono,
    fontWeight: '600',
  },
  duration: {
    fontSize: font.size.xs,
    color: colors.textMuted,
    fontFamily: font.mono,
    marginLeft: 'auto',
  },
  url: {
    fontSize: font.size.md,
    color: colors.text,
    fontFamily: font.sans,
    fontWeight: '500',
  },
  urlFull: {
    fontSize: font.size.xs,
    color: colors.textFaint,
    fontFamily: font.mono,
    marginTop: 2,
  },
  errorText: {
    fontSize: font.size.xs,
    color: colors.error,
    fontFamily: font.mono,
    marginTop: spacing.xs,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: font.size.lg,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: font.size.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
