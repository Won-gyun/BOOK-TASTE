// ============================================================
// 진행률 바 컴포넌트
// ============================================================
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, borderRadius } from '../utils/theme';

interface Props {
  progress: number; // 0~100
  height?: number;
  color?: string;
  backgroundColor?: string;
}

export function ProgressBar({
  progress,
  height = 6,
  color = colors.primary,
  backgroundColor = colors.surfaceVariant,
}: Props) {
  const clamped = Math.max(0, Math.min(100, progress));
  return (
    <View style={[styles.track, { height, backgroundColor, borderRadius: height / 2 }]}>
      <View
        style={[
          styles.fill,
          { width: `${clamped}%`, backgroundColor: color, borderRadius: height / 2 },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', overflow: 'hidden' },
  fill: { height: '100%' },
});
