import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Share,
  Alert,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { HttpRecord } from '../types';
import { JsonViewer } from './JsonViewer';
import { colors, font, spacing, radius, methodColor, statusColor, statusBg } from './theme';
import { generateCurl } from '../core/curlGenerator';

interface RequestDetailsProps {
  record: HttpRecord;
  onClose: () => void;
}

type Tab = 'request' | 'response' | 'raw';

export function RequestDetails({ record, onClose }: RequestDetailsProps): React.ReactElement {
  const [tab, setTab] = useState<Tab>('request');

  const copyCurl = useCallback(() => {
    const curl = generateCurl(record);
    Clipboard.setString(curl);
    Alert.alert('Copied', 'cURL command copied to clipboard');
  }, [record]);

  const copyBody = useCallback((body: string | null) => {
    if (!body) return;
    Clipboard.setString(body);
    Alert.alert('Copied', 'Payload copied to clipboard');
  }, []);

  const shareLogs = useCallback(async () => {
    const content = JSON.stringify(record, null, 2);
    try {
      await Share.share({ message: content, title: `Request — ${record.method} ${record.url}` });
    } catch {
      // user cancelled
    }
  }, [record]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={[styles.methodBadge, { borderColor: methodColor(record.method) }]}>
            <Text style={[styles.methodText, { color: methodColor(record.method) }]}>
              {record.method}
            </Text>
          </View>
          {record.statusCode !== null && (
            <View style={[styles.statusBadge, { backgroundColor: statusBg(record.statusCode) }]}>
              <Text style={[styles.statusText, { color: statusColor(record.statusCode) }]}>
                {record.statusCode}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={copyCurl} style={styles.actionBtn}>
            <Text style={styles.actionText}>cURL</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={shareLogs} style={styles.actionBtn}>
            <Text style={styles.actionText}>↑</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* URL */}
      <View style={styles.urlSection}>
        <Text style={styles.urlText} selectable>{record.url}</Text>
        <View style={styles.metaRow}>
          {record.duration !== null && (
            <Text style={styles.metaChip}>{record.duration}ms</Text>
          )}
          <Text style={styles.metaChip}>{new Date(record.timestamp).toLocaleTimeString()}</Text>
          {record.requestSize > 0 && (
            <Text style={styles.metaChip}>↑ {formatBytes(record.requestSize)}</Text>
          )}
          {record.responseSize > 0 && (
            <Text style={styles.metaChip}>↓ {formatBytes(record.responseSize)}</Text>
          )}
          {record.isTimeout && <Text style={[styles.metaChip, styles.badgeError]}>Timeout</Text>}
          {record.isCancelled && <Text style={[styles.metaChip, styles.badgeWarning]}>Cancelled</Text>}
        </View>
      </View>

      {record.error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>⚠ {record.error}</Text>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['request', 'response', 'raw'] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.body} nestedScrollEnabled>
        {tab === 'request' && (
          <RequestTab record={record} onCopyBody={() => copyBody(record.requestBody)} />
        )}
        {tab === 'response' && (
          <ResponseTab record={record} onCopyBody={() => copyBody(record.responseBody)} />
        )}
        {tab === 'raw' && <RawTab record={record} />}
      </ScrollView>
    </View>
  );
}

function RequestTab({ record, onCopyBody }: { record: HttpRecord; onCopyBody: () => void }) {
  return (
    <View style={styles.section}>
      <SectionTitle title="Headers" />
      <HeadersTable headers={record.requestHeaders} />

      {record.requestBody && (
        <>
          <SectionTitle title="Body" action="Copy" onAction={onCopyBody} />
          <JsonViewer value={record.requestBody} />
        </>
      )}
    </View>
  );
}

function ResponseTab({ record, onCopyBody }: { record: HttpRecord; onCopyBody: () => void }) {
  return (
    <View style={styles.section}>
      <SectionTitle title="Headers" />
      <HeadersTable headers={record.responseHeaders} />

      {record.responseBody && (
        <>
          <SectionTitle title="Body" action="Copy" onAction={onCopyBody} />
          <JsonViewer value={record.responseBody} />
        </>
      )}
    </View>
  );
}

function RawTab({ record }: { record: HttpRecord }) {
  return (
    <View style={styles.section}>
      <SectionTitle title="cURL" />
      <Text selectable style={styles.rawText}>{generateCurl(record)}</Text>
    </View>
  );
}

function SectionTitle({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionTitle}>
      <Text style={styles.sectionTitleText}>{title}</Text>
      {action && onAction && (
        <TouchableOpacity onPress={onAction}>
          <Text style={styles.sectionAction}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function HeadersTable({ headers }: { headers: Record<string, string> }) {
  const entries = Object.entries(headers);
  if (entries.length === 0) {
    return <Text style={styles.emptyText}>No headers</Text>;
  }
  return (
    <View style={styles.headersTable}>
      {entries.map(([key, value]) => (
        <View key={key} style={styles.headerRow}>
          <Text style={styles.headerKey} selectable>{key}</Text>
          <Text style={styles.headerValue} selectable>{value}</Text>
        </View>
      ))}
    </View>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    paddingRight: spacing.md,
  },
  backText: {
    color: colors.info,
    fontSize: font.size.lg,
    fontFamily: font.sans,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  methodBadge: {
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  methodText: {
    fontSize: font.size.sm,
    fontFamily: font.mono,
    fontWeight: '700',
  },
  statusBadge: {
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statusText: {
    fontSize: font.size.sm,
    fontFamily: font.mono,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    backgroundColor: colors.bgInput,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionText: {
    color: colors.info,
    fontSize: font.size.sm,
    fontFamily: font.mono,
  },
  urlSection: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  urlText: {
    color: colors.text,
    fontSize: font.size.sm,
    fontFamily: font.mono,
    marginBottom: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  metaChip: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    color: colors.textMuted,
    fontSize: font.size.xs,
    fontFamily: font.mono,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeError: {
    backgroundColor: colors.errorBg,
    borderColor: colors.error,
    color: colors.error,
  },
  badgeWarning: {
    backgroundColor: colors.warningBg,
    borderColor: colors.warning,
    color: colors.warning,
  },
  errorBanner: {
    backgroundColor: colors.errorBg,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.error,
  },
  errorBannerText: {
    color: colors.error,
    fontSize: font.size.sm,
    fontFamily: font.mono,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginRight: spacing.sm,
  },
  tabActive: {
    borderBottomColor: colors.info,
  },
  tabText: {
    color: colors.textMuted,
    fontSize: font.size.md,
    fontFamily: font.sans,
  },
  tabTextActive: {
    color: colors.info,
    fontWeight: '600',
  },
  body: {
    flex: 1,
  },
  section: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  sectionTitleText: {
    color: colors.textMuted,
    fontSize: font.size.xs,
    fontFamily: font.sans,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionAction: {
    color: colors.info,
    fontSize: font.size.xs,
    fontFamily: font.mono,
  },
  headersTable: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  headerKey: {
    color: colors.jsonKey,
    fontSize: font.size.xs,
    fontFamily: font.mono,
    flex: 1,
  },
  headerValue: {
    color: colors.text,
    fontSize: font.size.xs,
    fontFamily: font.mono,
    flex: 2,
  },
  emptyText: {
    color: colors.textFaint,
    fontSize: font.size.sm,
    fontFamily: font.sans,
    fontStyle: 'italic',
  },
  rawText: {
    color: colors.text,
    fontSize: font.size.xs,
    fontFamily: font.mono,
    backgroundColor: colors.bgCard,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
