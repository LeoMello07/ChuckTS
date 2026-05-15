import React, { useEffect, useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  View,
} from 'react-native';
import { useChuckTSStore } from '../store';
import { colors, font, radius } from './theme';

const BUTTON_SIZE = 52;
const MARGIN = 16;

export function FloatingButton(): React.ReactElement | null {
  const records = useChuckTSStore((s) => s.records);
  const isVisible = useChuckTSStore((s) => s.isVisible);
  const toggleVisible = useChuckTSStore((s) => s.toggleVisible);

  const { width, height } = Dimensions.get('window');
  const pan = useRef(new Animated.ValueXY({ x: width - BUTTON_SIZE - MARGIN, y: height * 0.5 })).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const errorCount = records.filter((r) => r.status === 'error').length;
  const pendingCount = records.filter((r) => r.status === 'pending').length;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 5 || Math.abs(gesture.dy) > 5,
      onPanResponderGrant: () => {
        pan.setOffset({ x: (pan.x as unknown as { _value: number })._value, y: (pan.y as unknown as { _value: number })._value });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gesture) => {
        pan.flattenOffset();
        const currentX = (pan.x as unknown as { _value: number })._value;
        const currentY = (pan.y as unknown as { _value: number })._value;

        // Snap to nearest edge
        const snapX =
          currentX < width / 2 ? MARGIN : width - BUTTON_SIZE - MARGIN;
        const clampedY = Math.max(
          MARGIN,
          Math.min(currentY, height - BUTTON_SIZE - MARGIN)
        );

        // Only treat as tap if movement was tiny
        if (Math.abs(gesture.dx) < 5 && Math.abs(gesture.dy) < 5) {
          toggleVisible();
        }

        Animated.spring(pan, {
          toValue: { x: snapX, y: clampedY },
          useNativeDriver: false,
          friction: 6,
          tension: 80,
        }).start();
      },
    })
  ).current;

  useEffect(() => {
    if (pendingCount > 0) {
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.15, duration: 150, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [pendingCount, scaleAnim]);

  if (isVisible) return null;

  const badgeCount = errorCount > 0 ? errorCount : records.length;
  const badgeColor = errorCount > 0 ? colors.error : colors.info;

  return (
    <Animated.View
      style={[styles.wrapper, { transform: [{ translateX: pan.x }, { translateY: pan.y }] }]}
      {...panResponder.panHandlers}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <View style={styles.button}>
          <Text style={styles.icon}>🔌</Text>
          {records.length > 0 && (
            <View style={[styles.badge, { backgroundColor: badgeColor }]}>
              <Text style={styles.badgeText}>{badgeCount > 99 ? '99+' : badgeCount}</Text>
            </View>
          )}
          {pendingCount > 0 && <View style={styles.pulse} />}
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    zIndex: 9999,
    elevation: 9999,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: radius.full,
    backgroundColor: colors.bgCard,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  icon: {
    fontSize: 22,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    borderRadius: radius.full,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: colors.bg,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontFamily: font.mono,
    fontWeight: '700',
  },
  pulse: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
});
