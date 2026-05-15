import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { colors, font, spacing } from './theme';

interface JsonViewerProps {
  value: string | null;
  maxInitialDepth?: number;
}

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonObject | JsonArray;
interface JsonObject { [key: string]: JsonValue }
type JsonArray = JsonValue[];

export function JsonViewer({ value, maxInitialDepth = 2 }: JsonViewerProps): React.ReactElement | null {
  if (!value) return null;

  let parsed: JsonValue;
  try {
    parsed = JSON.parse(value);
  } catch {
    return (
      <ScrollView horizontal>
        <Text style={styles.raw}>{value}</Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} nestedScrollEnabled>
      <JsonNode value={parsed} depth={0} maxInitialDepth={maxInitialDepth} />
    </ScrollView>
  );
}

interface JsonNodeProps {
  value: JsonValue;
  depth: number;
  maxInitialDepth: number;
  keyName?: string;
  isLast?: boolean;
}

function JsonNode({ value, depth, maxInitialDepth, keyName, isLast = true }: JsonNodeProps): React.ReactElement {
  const [collapsed, setCollapsed] = useState(depth >= maxInitialDepth);

  const toggle = useCallback(() => setCollapsed((c) => !c), []);
  const indent = depth * 14;

  if (value === null) {
    return (
      <Text style={[styles.line, { paddingLeft: indent }]}>
        {keyName !== undefined && <Text style={styles.key}>"{keyName}": </Text>}
        <Text style={styles.null}>null</Text>
        {!isLast && <Text style={styles.comma}>,</Text>}
      </Text>
    );
  }

  if (typeof value === 'boolean') {
    return (
      <Text style={[styles.line, { paddingLeft: indent }]}>
        {keyName !== undefined && <Text style={styles.key}>"{keyName}": </Text>}
        <Text style={styles.boolean}>{String(value)}</Text>
        {!isLast && <Text style={styles.comma}>,</Text>}
      </Text>
    );
  }

  if (typeof value === 'number') {
    return (
      <Text style={[styles.line, { paddingLeft: indent }]}>
        {keyName !== undefined && <Text style={styles.key}>"{keyName}": </Text>}
        <Text style={styles.number}>{value}</Text>
        {!isLast && <Text style={styles.comma}>,</Text>}
      </Text>
    );
  }

  if (typeof value === 'string') {
    return (
      <Text style={[styles.line, { paddingLeft: indent }]}>
        {keyName !== undefined && <Text style={styles.key}>"{keyName}": </Text>}
        <Text style={styles.string}>"{value}"</Text>
        {!isLast && <Text style={styles.comma}>,</Text>}
      </Text>
    );
  }

  const isArray = Array.isArray(value);
  const entries = isArray
    ? (value as JsonArray).map((v, i) => [String(i), v] as [string, JsonValue])
    : Object.entries(value as JsonObject);

  const open = isArray ? '[' : '{';
  const close = isArray ? ']' : '}';
  const count = entries.length;

  return (
    <View style={{ paddingLeft: indent }}>
      <TouchableOpacity onPress={toggle} activeOpacity={0.7} style={styles.collapseRow}>
        {keyName !== undefined && <Text style={styles.key}>"{keyName}": </Text>}
        <Text style={styles.bracket}>{open}</Text>
        {collapsed && (
          <>
            <Text style={styles.collapse}> {count} {isArray ? 'items' : 'keys'} </Text>
            <Text style={styles.bracket}>{close}</Text>
          </>
        )}
        {!collapsed && <Text style={styles.collapse}> ▾</Text>}
        {!isLast && <Text style={styles.comma}>,</Text>}
      </TouchableOpacity>

      {!collapsed &&
        entries.map(([k, v], i) => (
          <JsonNode
            key={k}
            keyName={isArray ? undefined : k}
            value={v}
            depth={depth + 1}
            maxInitialDepth={maxInitialDepth}
            isLast={i === count - 1}
          />
        ))}

      {!collapsed && (
        <Text style={[styles.bracket, { paddingLeft: 0 }]}>{close}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg,
    padding: spacing.sm,
    borderRadius: 6,
  },
  line: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 1,
  },
  raw: {
    fontFamily: font.mono,
    fontSize: font.size.sm,
    color: colors.text,
  },
  key: {
    fontFamily: font.mono,
    fontSize: font.size.sm,
    color: colors.jsonKey,
  },
  string: {
    fontFamily: font.mono,
    fontSize: font.size.sm,
    color: colors.jsonString,
  },
  number: {
    fontFamily: font.mono,
    fontSize: font.size.sm,
    color: colors.jsonNumber,
  },
  boolean: {
    fontFamily: font.mono,
    fontSize: font.size.sm,
    color: colors.jsonBoolean,
  },
  null: {
    fontFamily: font.mono,
    fontSize: font.size.sm,
    color: colors.jsonNull,
  },
  bracket: {
    fontFamily: font.mono,
    fontSize: font.size.sm,
    color: colors.jsonBracket,
  },
  comma: {
    fontFamily: font.mono,
    fontSize: font.size.sm,
    color: colors.textFaint,
  },
  collapse: {
    fontFamily: font.mono,
    fontSize: font.size.sm,
    color: colors.textMuted,
  },
  collapseRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginVertical: 1,
  },
});
