// ============================================================
// 녹음 항목 컴포넌트
// ============================================================
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Recording } from '../types';
import { formatDuration, formatDate } from '../utils/format';
import { colors, spacing, borderRadius, fontSize, shadow } from '../utils/theme';

interface Props {
  recording: Recording;
  onPlay: () => void;
  onDelete: () => void;
  isPlaying?: boolean;
}

export function RecordingItem({ recording, onPlay, onDelete, isPlaying }: Props) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.playBtn} onPress={onPlay}>
        <MaterialIcons
          name={isPlaying ? 'pause-circle-filled' : 'play-circle-filled'}
          size={40}
          color={colors.primary}
        />
      </TouchableOpacity>

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{recording.title}</Text>
        <Text style={styles.meta}>
          {formatDuration(recording.duration)} · {formatDate(recording.createdAt)}
        </Text>
      </View>

      <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
        <MaterialIcons name="delete-outline" size={22} color={colors.danger} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.sm,
  },
  playBtn: {
    marginRight: spacing.md,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  meta: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: 2,
  },
  deleteBtn: {
    padding: spacing.sm,
  },
});
