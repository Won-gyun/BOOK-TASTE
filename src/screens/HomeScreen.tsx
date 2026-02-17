// ============================================================
// 홈 화면 - 현재 읽고 있는 책 + 독서 통계 요약
// ============================================================
import React, { useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useBooks } from '../hooks/useBooks';
import { useStats } from '../hooks/useStats';
import { BookCard } from '../components/BookCard';
import { StatCard } from '../components/StatCard';
import { EmptyState } from '../components/EmptyState';
import { formatDurationLong } from '../utils/format';
import { RootStackParamList } from '../types';
import { colors, spacing, fontSize } from '../utils/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const nav = useNavigation<Nav>();
  const { books, loading: booksLoading, refresh: refreshBooks } = useBooks();
  const { stats, loading: statsLoading, refresh: refreshStats } = useStats();

  // 탭 포커스 시 새로고침
  useFocusEffect(
    useCallback(() => {
      refreshBooks();
      refreshStats();
    }, [refreshBooks, refreshStats])
  );

  // 읽는 중인 책만 필터
  const reading = books.filter(
    (b) => b.totalPages > 0 && b.currentPage < b.totalPages
  );

  const refreshing = booksLoading || statsLoading;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { refreshBooks(); refreshStats(); }}
          colors={[colors.primary]}
        />
      }
    >
      {/* 인사말 */}
      <Text style={styles.greeting}>오늘도 책을 음미해볼까요?</Text>

      {/* 통계 카드 */}
      <View style={styles.statsRow}>
        <StatCard icon="auto-stories" label="총 도서" value={`${stats.totalBooks}`} />
        <View style={{ width: spacing.sm }} />
        <StatCard icon="check-circle" label="완독" value={`${stats.completedBooks}`} color={colors.success} />
        <View style={{ width: spacing.sm }} />
        <StatCard icon="local-fire-department" label="연속" value={`${stats.streakDays}일`} color={colors.accent} />
      </View>

      <View style={styles.statsRow}>
        <StatCard
          icon="menu-book"
          label="이번 달"
          value={`${stats.totalPagesThisMonth}p`}
          color={colors.info}
        />
        <View style={{ width: spacing.sm }} />
        <StatCard
          icon="mic"
          label="총 녹음"
          value={formatDurationLong(stats.totalRecordingDuration)}
          color={colors.primaryDark}
        />
      </View>

      {/* 월별 독서량 미니 차트 */}
      {stats.monthlyPages.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>월별 독서량</Text>
          <View style={styles.chartContainer}>
            {stats.monthlyPages.map((item) => {
              const maxPages = Math.max(...stats.monthlyPages.map((m) => m.pages), 1);
              const barHeight = Math.max((item.pages / maxPages) * 100, 4);
              return (
                <View key={item.month} style={styles.chartBar}>
                  <Text style={styles.chartValue}>{item.pages}p</Text>
                  <View style={[styles.bar, { height: barHeight, backgroundColor: colors.primary }]} />
                  <Text style={styles.chartLabel}>{item.month.slice(5)}월</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* 읽고 있는 책 목록 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>읽고 있는 책</Text>
        {reading.length === 0 ? (
          <EmptyState
            icon="menu-book"
            title="읽고 있는 책이 없어요"
            subtitle="라이브러리에서 새 도서를 추가해보세요"
          />
        ) : (
          reading.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onPress={() => nav.navigate('BookDetail', { bookId: book.id })}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 40,
  },
  greeting: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xl,
    marginTop: spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  section: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    height: 180,
  },
  chartBar: {
    alignItems: 'center',
    flex: 1,
  },
  chartValue: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginBottom: 4,
  },
  bar: {
    width: 24,
    borderRadius: 4,
    minHeight: 4,
  },
  chartLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 6,
  },
});
