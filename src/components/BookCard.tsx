// ============================================================
// 도서 카드 컴포넌트 (홈 / 라이브러리에서 사용)
// ============================================================
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Book } from '../types';
import { ProgressBar } from './ProgressBar';
import { calcProgress } from '../utils/format';
import { colors, spacing, borderRadius, fontSize, shadow } from '../utils/theme';

interface Props {
  book: Book;
  onPress: () => void;
}

export function BookCard({ book, onPress }: Props) {
  const progress = calcProgress(book.currentPage, book.totalPages);
  const isComplete = progress >= 100;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {/* 표지 이미지 */}
      <View style={styles.coverContainer}>
        {book.coverUri ? (
          <Image source={{ uri: book.coverUri }} style={styles.cover} />
        ) : (
          <View style={styles.coverPlaceholder}>
            <MaterialIcons name="menu-book" size={32} color={colors.textTertiary} />
          </View>
        )}
      </View>

      {/* 도서 정보 */}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{book.title}</Text>
        <Text style={styles.author} numberOfLines={1}>{book.author || '저자 미상'}</Text>

        <View style={styles.progressSection}>
          <ProgressBar
            progress={progress}
            color={isComplete ? colors.success : colors.primary}
          />
          <View style={styles.progressLabelRow}>
            <Text style={styles.progressText}>
              {book.currentPage} / {book.totalPages}p
            </Text>
            <Text style={[styles.progressPercent, isComplete && { color: colors.success }]}>
              {progress}%
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadow.md,
  },
  coverContainer: {
    width: 70,
    height: 100,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    marginRight: spacing.lg,
  },
  cover: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  coverPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  author: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  progressSection: {
    marginTop: 'auto',
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  progressText: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
  progressPercent: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.primary,
  },
});
