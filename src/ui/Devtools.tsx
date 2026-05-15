import React, { useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useChuckTSStore } from '../store';
import { RequestList } from './RequestList';
import { RequestDetails } from './RequestDetails';
import { FloatingButton } from './FloatingButton';
import { colors, font, spacing } from './theme';

interface DevtoolsProps {
  /** Show the floating drag-and-drop trigger button. Default: true */
  showFloatingButton?: boolean;
}

export function Devtools({ showFloatingButton = true }: DevtoolsProps): React.ReactElement | null {
  // Only render in dev mode unless manually started in prod
  if (typeof __DEV__ !== 'undefined' && !__DEV__) {
    return null;
  }

  return (
    <>
      <InspectorModal />
      {showFloatingButton && <FloatingButton />}
    </>
  );
}

function InspectorModal(): React.ReactElement {
  const isVisible = useChuckTSStore((s) => s.isVisible);
  const selectedId = useChuckTSStore((s) => s.selectedId);
  const records = useChuckTSStore((s) => s.records);
  const selectRecord = useChuckTSStore((s) => s.selectRecord);
  const setVisible = useChuckTSStore((s) => s.setVisible);

  const selectedRecord = records.find((r) => r.id === selectedId) ?? null;

  const handleClose = useCallback(() => setVisible(false), [setVisible]);
  const handleBack = useCallback(() => selectRecord(null), [selectRecord]);

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          {/* Toolbar */}
          <View style={styles.toolbar}>
            <View style={styles.toolbarLeft}>
              <View style={styles.dragHandle} />
            </View>
            <Text style={styles.toolbarTitle}>
              {selectedRecord ? `${selectedRecord.method} ${extractHost(selectedRecord.url)}` : 'ChuckTS'}
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          {selectedRecord ? (
            <RequestDetails record={selectedRecord} onClose={handleBack} />
          ) : (
            <RequestList />
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function extractHost(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url.slice(0, 40);
  }
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  toolbarLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  dragHandle: {
    width: 36,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
  },
  toolbarTitle: {
    color: colors.text,
    fontSize: font.size.lg,
    fontFamily: font.mono,
    fontWeight: '600',
    flex: 2,
    textAlign: 'center',
  },
  closeBtn: {
    flex: 1,
    alignItems: 'flex-end',
    padding: spacing.xs,
  },
  closeBtnText: {
    color: colors.textMuted,
    fontSize: font.size.lg,
  },
});
